import { calculateDistance } from "@/utils/calculateDistance";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../context/CartContext";
import { db } from "../firebase/config";

const Colors = {
  background: "#FFFFFF",
  card: "#FFFFFF",
  surface: "#F5F5F5",
  textPrimary: "#000000",
  textSecondary: "#666666",
  muted: "#999999",
  separator: "#E8E8E8",
  primary: "#000000",
  primaryLight: "#00000010",
  accent: "#333333",
  success: "#34C759",
  danger: "#FF3B30",
  warning: "#FF9500",
};

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryCharge = subtotal >= 999 ? 0 : 30;
  const discount = 0;
  const grandTotal = subtotal + deliveryCharge - discount;

  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      const snapshot = await db
        .collection("addresses")
        .where("userId", "==", user.uid)
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(data);

      const defaultAddr = data.find((a: any) => a.isDefault) ?? data[0];
      setSelectedAddress(defaultAddr);
    } catch (error) {
      console.log(error);
    }
  };

  const placeOrder = async () => {
    if (placingOrder) return;

    if (cart.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Cart Empty", "Add products before placing an order.");
      return;
    }

    if (!selectedAddress) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Address Required",
        "Please select a delivery address."
      );
      return;
    }
    setPlacingOrder(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("CHECKOUT USER:", auth().currentUser);
      console.log("CHECKOUT UID:", auth().currentUser?.uid);

      const deliverySnap = await db
        .collection("settings")
        .doc("delivery")
        .get();

      if (!deliverySnap.exists()) {
        throw new Error("Delivery settings not configured");
      }

      const delivery = deliverySnap.data();
      if (!delivery) {
        throw new Error("Delivery settings not configured");
      }

      //radius validation
      const distance = calculateDistance(
        delivery.shopLatitude,
        delivery.shopLongitude,
        selectedAddress.latitude,
        selectedAddress.longitude
      );

      const insideRadius = distance <= delivery.radiusKm;

      const insidePincode = delivery.serviceablePincodes?.includes(String(selectedAddress.pincode)) ?? false;

      if (!insideRadius || !insidePincode) {
        throw new Error(
          "The selected address is outside our delivery area. Please choose another address"
        );
      }
      const orderRef = db.collection("orders").doc();

      await orderRef.set({
        userId: auth().currentUser?.uid,
        customerName: auth().currentUser?.displayName || "",
        customerEmail: auth().currentUser?.email || "",
        address: {
          type: selectedAddress.type,
          address: selectedAddress.address,
          landmark: selectedAddress.landmark,
          phone: selectedAddress.phone,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          pincode: selectedAddress.pincode,
        },
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          image: item.image || "",
        })),
        pricing: {
          subtotal,
          deliveryCharge,
          discount,
          grandTotal,
        },
        invoice: {
          number: `PS-INV-${Date.now()}`,
          issuedAt: firestore.FieldValue.serverTimestamp(),
        },
        payment: {
          method: "Cash on Delivery",
          status: "Pending",
        },
        total: grandTotal,
        status: "Pending",
        stockDeducted: false,
        stockRestored: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPlacingOrder(false);
      clearCart();
      router.replace("/order-confirmed");
    } catch (error) {
      setPlacingOrder(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Order Failed",
        error instanceof Error ? error.message : "Please try again"
      );
    }
  };

  const AddressSection = () => (
    <View style={styles.addressCard}>
      <View style={styles.sectionHeader}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8
          }}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.sectionTitle}>
            Delivery Address
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddressSelector(true)}
        >
          <Text
            style={{
              fontWeight: "700",
              color: Colors.primary
            }}
          >
            Change
          </Text>
        </TouchableOpacity>
      </View>

      {selectedAddress ? (
        <View style={styles.addressContent}>
          <View style={styles.addressTypeBadge}>
            <Text style={styles.addressTypeText}>
              {selectedAddress.type || "Home"}
            </Text>
          </View>
          <Text style={styles.addressLine}>{selectedAddress.address}</Text>
          {selectedAddress.landmark && (
            <Text style={styles.addressLandmark}>
              📍 Near {selectedAddress.landmark}
            </Text>
          )}
          <View style={styles.phoneContainer}>
            <Ionicons name="call-outline" size={14} color={Colors.muted} />
            <Text style={styles.phoneText}>{selectedAddress.phone}</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addAddressBtn}
          onPress={() => router.push({
            pathname: "/add-address",
            params: {
              onboarding: "false"
            }
          })}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addAddressText}>Add Delivery Address</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const AddressSelector = () => (
    <Modal
      visible={showAddressSelector}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddressSelector(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowAddressSelector(false)}
      >
        <Pressable style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>
            Select Delivery Address
          </Text>

          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.addressOption,
                  selectedAddress?.id === item.id &&
                  styles.selectedAddressOption,
                ]}
                onPress={() => {
                  setSelectedAddress(item);
                  setShowAddressSelector(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionType}>
                    {item.type}
                  </Text>
                  <Text style={styles.optionAddress}>
                    {item.address}
                  </Text>
                  {!!item.landmark && (
                    <Text style={styles.optionLandmark}>
                      Near {item.landmark}
                    </Text>
                  )}
                </View>

                {selectedAddress?.id === item.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                )}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addAnotherAddress}
                onPress={() => {
                  setShowAddressSelector(false);
                  router.push({
                    pathname: "/add-address",
                    params: {
                      onboarding: "false",
                    },
                  });
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={Colors.primary}
                />
                <Text style={styles.addAnotherText}>
                  Add New Address
                </Text>
              </TouchableOpacity>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderCartItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemUnit}>{item.unit || "unit"}</Text>
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
        </View>
      </View>
      <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
    </View>
  );

  const EmptyCart = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cart-outline" size={64} color={Colors.muted} />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>Add items to proceed with checkout</Text>
      <TouchableOpacity
        style={styles.shopBtn}
        onPress={() => router.push("/(tabs)/home")}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          style={styles.shopBtnGradient}
        >
          <Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />
          <Text style={styles.shopBtnText}>Continue Shopping</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyCart />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <AddressSection />
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>Order Items</Text>
              <Text style={styles.itemsCount}>{cart.length} items</Text>
            </View>
          </>
        }
        renderItem={renderCartItem}
        ListFooterComponent={
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Bill Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      deliveryCharge === 0
                        ? Colors.success
                        : Colors.textPrimary,
                  },
                ]}
              >
                {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                -₹{discount}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{grandTotal}</Text>
            </View>
          </View>
        }
      />
      <AddressSelector />
      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, placingOrder && styles.placeOrderDisabled]}
          onPress={placeOrder}
          disabled={placingOrder}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            style={styles.placeOrderGradient}
          >
            {placingOrder ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.placeOrderText}>Place Order</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },

  // Address Card
  addressCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.separator,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  addressContent: {
    gap: 6,
  },
  addressTypeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  addressTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  addressLine: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  addressLandmark: {
    fontSize: 12,
    color: Colors.muted,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.muted,
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },

  // Items Header
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  itemsCount: {
    fontSize: 12,
    color: Colors.muted,
  },

  // Item Card
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPrice: {
    fontSize: 12,
    color: Colors.muted,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Summary
  summaryContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.separator,
    marginVertical: 12,
  },
  totalRow: {
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomTotal: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 2,
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  placeOrderBtn: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  placeOrderDisabled: {
    opacity: 0.6,
  },
  placeOrderGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    marginBottom: 24,
  },
  shopBtn: {
    borderRadius: 30,
    overflow: "hidden",
  },
  shopBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "70%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D0D0D0",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  selectedAddressOption: {
    backgroundColor: "#F7F7F7",
  },
  optionType: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  optionAddress: {
    fontSize: 14,
    color: "#333",
  },
  optionLandmark: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  addAnotherAddress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DDD",
    borderRadius: 14,
  },
  addAnotherText: {
    fontSize: 15,
    fontWeight: "600",
  },
});