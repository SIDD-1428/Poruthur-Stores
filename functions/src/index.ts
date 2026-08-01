import * as admin from "firebase-admin";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

admin.initializeApp();

const db = admin.firestore();

export const restoreStockAfterCancellation = onDocumentUpdated(
  
  {
    document: "orders/{orderId}",
    region: "asia-south1",
  },
  async (event) => {
    console.log("Function started");
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    console.log("CANCEL TRIGGER");
    console.log("Order:", event.params.orderId);
    console.log("Before Status:", before.status);
    console.log("After Status:", after.status);
    console.log("Stock Deducted:", after.stockDeducted);
    console.log("Stock Restored:", after.stockRestored);

    if (
      before.status === "Pending" &&
      after.status === "Cancelled" &&
      after.stockDeducted === true &&
      after.stockRestored === false
    ) {
      try {
        await db.runTransaction(async (transaction) => {
        const orderRef = db.collection("orders").doc(event.params.orderId);

        for (const item of after.items || []) {
          transaction.update(
            db.collection("products").doc(item.productId),
            {
              stock: admin.firestore.FieldValue.increment(item.quantity),
            }
          );
        }

        transaction.update(orderRef, {
          stockRestored: true,
          "payment.status": "Cancelled",
        });
      });
      console.log(`stock restored for order ${event.params.orderId}`);
      }
       catch (err) {
        console.error("Restore Stock Error:", err);
      }
    } else {
      console.log("Conditions not satisfied. Skipping restore.");
    }
  }
);

export const processNewOrder = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region: "asia-south1",
  },
  async (event) => {
    const order = event.data?.data();

    if (!order) return;

    if (order.stockDeducted) return;

    const orderRef = db.collection("orders").doc(event.params.orderId);

    try {
      await db.runTransaction(async (transaction) => {
        const updates: {
          ref: FirebaseFirestore.DocumentReference;
          newStock: number;
        }[] = [];

        const latestOrderSnap = await transaction.get(orderRef);

        if (!latestOrderSnap.exists) return;

        const latestOrder = latestOrderSnap.data();

        if (!latestOrder) return;

        if (latestOrder.status === "Cancelled") {
          console.log(
            `Order ${event.params.orderId} already cancelled.`
          );
          return;
        }

        for (const item of latestOrder.items || []) {
          const productRef = db
            .collection("products")
            .doc(item.productId);

          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists) {
            throw new Error(`${item.name} not found`);
          }

          const product = productSnap.data();

          if (!product) {
            throw new Error(`${item.name} not found`);
          }

          const currentStock = product.stock ?? 0;

          if (currentStock < item.quantity) {
            throw new Error(`${item.name} is out of stock`);
          }

          updates.push({
            ref: productRef,
            newStock: currentStock - item.quantity,
          });
        }

        for (const update of updates) {
          transaction.update(update.ref, {
            stock: update.newStock,
          });
        }

        transaction.update(orderRef, {
          stockDeducted: true,
          processedAt:admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`Processed order ${event.params.orderId}`);
    } catch (err: any) {
      console.error(err);

      await orderRef.update({
        status: "Rejected",
        rejectionReason: err.message,
        "payment.status": "Failed",
      });
    }
  }
);