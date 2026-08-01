import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();
const db = getFirestore();

type CartItem = {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
};

// Combines items that reference the same product into a single
// entry with a summed quantity. Without this, if a caller sends the
// same productId twice, each entry would be checked against the
// same original stock number, and the two separate writes to that
// product's stock would overwrite each other instead of adding up —
// corrupting the stock count.
function mergeByProductId(items: CartItem[]) {
  const merged = new Map<string, number>();

  for (const item of items) {
    const productId = item?.productId;
    const quantity = Number(item?.quantity);

    if (!productId || typeof productId !== "string") {
      throw new HttpsError("invalid-argument", "Every item needs a productId.");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid quantity for product ${productId}.`
      );
    }

    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  return Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));
}

// Creates an order using prices and stock read straight from the
// "products" collection on the server — never from the client.
// This is the only way orders should be created; the Firestore
// rules block direct client writes to "orders" now (see
// firestore.rules), so the customer app must call this function
// instead of writing to Firestore directly.
//
// Expected input from the client:
//   { items: [{ productId: "abc123", quantity: 2 }, ...], addressId: "xyz" }
export const createOrder = onCall(
  {
    region: "asia-south1"
  },
  async (request: CallableRequest<any>) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to place an order."
    );
  }

  const rawItems = request.data?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "Order must include at least one item."
    );
  }

  // Same product listed twice becomes one entry with the combined quantity.
  const requestedItems = mergeByProductId(rawItems);

  const addressId = request.data?.addressId || null;
  
  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data();
  
  if (!user) {
    throw new HttpsError(
      "not-found",
      "User not found."
    );
  }

  let address = null;
  
  if (addressId) {
    const addressSnap = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .doc(addressId)
      .get();
  
    if (!addressSnap.exists) {
      throw new HttpsError(
        "not-found",
        "Address not found."
      );
    }
  
    address = addressSnap.data();
  }

  const orderRef = db.collection("orders").doc();

  // Everything happens inside one transaction so two customers can't
  // both buy the "last unit" of something at the same time.
  await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
    // Firestore transactions require ALL reads before ANY writes,
    // so read every product involved in the order first.
    const productRefs = requestedItems.map((item) =>
      db.collection("products").doc(item.productId)
    );
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref))
    );

    const verifiedItems: {
      productId: string;
      name: string;
      image?: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }[] = [];
    let total = 0;

    for (let i = 0; i < requestedItems.length; i++) {
      const { productId, quantity } = requestedItems[i];
      const productSnap = productSnaps[i];

      if (!productSnap.exists) {
        throw new HttpsError("not-found", `Product ${productId} does not exist.`);
      }

      const product = productSnap.data();
      
      if (!product) {
        throw new HttpsError(
          "not-found",
          `Product ${productId} not found.`
        );
      }

      const maxOrderQty =
        product.maxOrderQty != null ? Number(product.maxOrderQty) : Infinity;

      if (quantity > maxOrderQty) {
        throw new HttpsError(
          "invalid-argument",
          `${product.name}: maximum order quantity is ${maxOrderQty}.`
        );
      }
      if (quantity > product.stock) {
        throw new HttpsError(
          "failed-precondition",
          `${product.name} does not have enough stock left.`
        );
      }

      // Price comes from the product document. The client's price,
      // if it sent one, is ignored completely.
      const price = product.price;
      total += price * quantity;

      verifiedItems.push({
        productId,
        name: product.name,
        image: product.image,
        unitPrice: price,
        quantity,
        totalPrice: price * quantity,
      });
    }

    // Reads are done — now apply the writes. Each product appears at
    // most once here, so there's no overwrite risk.
    for (let i = 0; i < requestedItems.length; i++) {
      const product = productSnaps[i].data();

if (!product) {
  throw new HttpsError(
    "not-found",
    `Product ${requestedItems[i].productId} not found.`
  );
}

const currentStock = product.stock;
      const newStock = currentStock - verifiedItems[i].quantity;
      transaction.update(productRefs[i], { stock: newStock });
    }

    const deliveryCharge = 30;
    const grandTotal = total + deliveryCharge;

    transaction.set(orderRef, {
      userId: uid,

      customerName: user.fullName,
      customerEmail: user.email,

      address,

      items: verifiedItems,

      pricing: {
        subtotal: total,
        deliveryCharge,
        discount: 0,
        grandTotal,
      },

      total: grandTotal,

      payment: {
        method: "Cash on Delivery",
        status: "Pending",
      },

      invoice: {
        number: `PS-INV-${Date.now()}`,
        issuedAt: FieldValue.serverTimestamp(),
      },

      status: "Pending",

      stockDeducted: true,
      stockRestored: false,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { orderId: orderRef.id };
});

// Cancels a customer's own order and restores the stock that was
// reserved for it. This is the only way an order can be cancelled;
// the Firestore rules no longer let a customer update order status
// directly (see firestore.rules), so the customer app must call
// this function instead of writing to Firestore directly.
//
// Expected input from the client:
//   { orderId: "abc123" }
export const cancelOrder = onCall(
    {
    region: "asia-south1"
  },
  async (request: CallableRequest<any>) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to cancel an order."
    );
  }

  const orderId = request.data?.orderId;
  if (!orderId) {
    throw new HttpsError("invalid-argument", "orderId is required.");
  }

  const orderRef = db.collection("orders").doc(String(orderId));

  await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const order = orderSnap.data();

if (!order) {
  throw new HttpsError(
    "not-found",
    "Order not found."
  );
}

if (order.userId !== uid) {
      throw new HttpsError("permission-denied", "This is not your order.");
    }
    if (order.status !== "Pending") {
      throw new HttpsError(
        "failed-precondition",
        "Only a pending order can be cancelled."
      );
    }

    // Orders created by createOrder never have duplicate productIds
    // (they get merged at creation), but merge again here anyway —
    // cheap, and it makes cancelOrder safe even if an order was ever
    // written by something other than createOrder.
    const items = mergeByProductId(Array.isArray(order.items) ? order.items : []);

    // Firestore transactions require ALL reads before ANY writes,
    // so read every product involved before restocking anything.
    const productRefs = items.map((item) =>
      db.collection("products").doc(item.productId)
    );
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref))
    );

    for (let i = 0; i < items.length; i++) {
      const productSnap = productSnaps[i];
      // If the product was deleted since the order was placed,
      // there's nothing to restock it to — just skip it rather
      // than fail the whole cancellation.
      if (!productSnap.exists) continue;

      const product = productSnap.data();
      
      if (!product) continue;

      const currentStock = product.stock;
      const restoredStock = currentStock + items[i].quantity;
      transaction.update(productRefs[i], { stock: restoredStock });
    }

    transaction.update(orderRef, { status: "Cancelled" });
  });

  return { success: true };
});