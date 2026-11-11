import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../context/CartContext";

const Colors = {
  background: "#FFFFFF", card: "#FFFFFF", surface: "#F5F5F5",
  textPrimary: "#000000", textSecondary: "#666666", muted: "#999999",
  separator: "#E8E8E8", primary: "#000000", accent: "#333333",
  success: "#18864B", danger: "#FF3B30",
};

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { cart, increaseQty, decreaseQty, removeFromCart } = useCart();
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalSavings = cart.reduce((sum, item) =>
    sum + Math.max(0, Number(item.mrp ?? item.price) - Number(item.price)) * item.quantity, 0);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <View>
        <Text style={styles.eyebrow}>BONMART</Text>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout</Text>
      </View>
      <View style={styles.itemCountBadge}><Text style={styles.itemCountText}>{itemCount}</Text></View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}><Ionicons name="bag-handle-outline" size={42} color={Colors.muted} /></View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>Discover something fresh for your home.</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/(tabs)/home")} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.shopBtnGradient}>
          <Text style={styles.shopBtnText}>Start shopping</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => {
    const mrp = Number(item.mrp ?? item.price);
    const price = Number(item.price || 0);
    const saving = Math.max(0, mrp - price) * item.quantity;
    const imageUri = item.thumbnailUrl || item.image;
    return (
      <View style={styles.productCard}>
        <View style={styles.imageWrap}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.productImage} contentFit="cover" transition={160} /> :
            <View style={styles.imagePlaceholder}><Ionicons name="image-outline" size={24} color={Colors.muted} /></View>}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productUnit}>{item.unit || "Unit not specified"}</Text>
          <View style={styles.priceLine}>
            <Text style={styles.productPrice}>₹{price.toLocaleString("en-IN")}</Text>
            {mrp > price ? <Text style={styles.mrp}>₹{mrp.toLocaleString("en-IN")}</Text> : null}
          </View>
          {saving > 0 ? <Text style={styles.savings}>You save ₹{saving.toFixed(2)}</Text> : null}
          <Text style={styles.lineTotal}>₹{(price * item.quantity).toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.removeBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removeFromCart(item.id); }} hitSlop={8}>
            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
          </TouchableOpacity>
          <View style={styles.quantityControl}>
            <TouchableOpacity style={styles.quantityButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decreaseQty(item.id); }} hitSlop={5}>
              <Ionicons name="remove" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increaseQty(item.id); }} hitSlop={5}>
              <Ionicons name="add" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const checkout = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/checkout"); };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {cart.length === 0 ? renderEmpty() : <>
        <FlatList data={cart} keyExtractor={item => item.id}
          style={styles.cartList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false} renderItem={renderItem} />
        <View style={styles.summaryDock}>
          <View style={styles.summaryInner}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
              {totalSavings > 0 ? <Text style={styles.summarySavings}>You save ₹{totalSavings.toFixed(2)}</Text> : null}
              <Text style={styles.summaryTotal}>₹{total.toLocaleString("en-IN")}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={checkout} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.checkoutGradient}>
                <Text style={styles.checkoutText}>Checkout</Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.separator, backgroundColor: "#FFFFFF" },
  eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.8, color: Colors.muted, marginBottom: 4 },
  title: { fontSize: 27, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontSize: 12, color: Colors.muted, marginTop: 3 },
  itemCountBadge: { minWidth: 42, height: 42, borderRadius: 21, paddingHorizontal: 10, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.separator },
  itemCountText: { fontSize: 14, fontWeight: "800", color: Colors.textPrimary },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 36 },
  emptyIcon: { width: 104, height: 104, borderRadius: 34, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, marginBottom: 7 },
  emptySubtitle: { fontSize: 13, color: Colors.muted, textAlign: "center", marginBottom: 22 },
  shopBtn: { borderRadius: 24, overflow: "hidden" },
  shopBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 23, paddingVertical: 13, gap: 9 },
  shopBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  cartList: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  productCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 19, padding: 11, marginBottom: 12, borderWidth: 1, borderColor: Colors.separator, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 9, elevation: 2 },
  imageWrap: { width: 76, height: 76, borderRadius: 14, overflow: "hidden", backgroundColor: Colors.surface },
  productImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  productInfo: { flex: 1, minWidth: 0, marginLeft: 12 },
  productName: { fontSize: 13, lineHeight: 17, fontWeight: "700", color: Colors.textPrimary },
  productUnit: { fontSize: 10, color: Colors.muted, marginTop: 2, marginBottom: 5 },
  priceLine: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  productPrice: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary },
  mrp: { fontSize: 10, color: Colors.muted, textDecorationLine: "line-through" },
  savings: { fontSize: 10, color: Colors.success, fontWeight: "700", marginTop: 2 },
  lineTotal: { fontSize: 12, fontWeight: "800", color: Colors.textSecondary, marginTop: 4 },
  actions: { alignItems: "flex-end", justifyContent: "space-between", alignSelf: "stretch", paddingVertical: 2, marginLeft: 8 },
  removeBtn: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FF3B3010" },
  quantityControl: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 12, padding: 3, gap: 3 },
  quantityButton: { width: 27, height: 27, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  quantityValue: { minWidth: 20, textAlign: "center", fontSize: 12, fontWeight: "800", color: Colors.textPrimary },
  summaryDock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: "#FFFFFF" },
  summaryInner: { flexDirection: "row", alignItems: "center", paddingVertical: 2, gap: 10 },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryLabel: { fontSize: 9, color: Colors.muted, fontWeight: "900", letterSpacing: 0.8 },
  summarySavings: { fontSize: 10, color: Colors.success, fontWeight: "700", marginTop: 2 },
  summaryTotal: { fontSize: 21, color: Colors.textPrimary, fontWeight: "900", marginTop: 1 },
  checkoutBtn: { borderRadius: 17, overflow: "hidden" },
  checkoutGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  checkoutText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
