import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import React, { memo, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../context/CartContext";

type ProductOption = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  unit: string;
  stock?: number;
  image?: string;
  thumbnailUrl?: string;
  maxOrderQty?: number;
};

type Props = {
  id: string;
  name: string;
  stock?: number;
  price: number;
  mrp?: number;
  image: string;
  thumbnailUrl?: string;
  protext?: string;
  rating: number;
  unit: string;
  width?: number;
  maxOrderQty?: number;
  availableOptions?: ProductOption[];
  compactCard?: boolean;
  uniformCard?: boolean;
};

function ProductCard({
  id,
  name,
  price,
  mrp = price,
  stock = 0,
  image,
  thumbnailUrl,
  protext = "",
  rating,
  unit,
  width = 120,
  maxOrderQty,
  availableOptions = [],
  compactCard = false,
  uniformCard = false,
}: Props) {
  const { addToCart, cart, increaseQty, decreaseQty } = useCart();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [popupFrame, setPopupFrame] = useState({ left: 12, top: 100, width: 260 });
  const cardRef = useRef<View>(null);
  const popupScale = useRef(new Animated.Value(0.88)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const otherOptions = availableOptions.filter((option) => option.id !== id);

  const itemInCart = cart.find((item) => item.id == id);
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= 5;

  const scale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const isUpdatingRef=useRef(false);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.955, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  const animateBtn = () =>
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

  const openOptions = (event: any) => {
    event.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
    const popupHeight = Math.min(430, 94 + otherOptions.length * 76);

    cardRef.current?.measureInWindow((x, y, cardWidth, cardHeight) => {
      const gap = 10;
      // Keep the glass panel comfortably wide for product names and inline cart controls.
      const availableWidth = Math.min(320, screenWidth - 24);
      const rightSpace = screenWidth - (x + cardWidth) - gap - 12;
      const leftSpace = x - gap - 12;
      const placeRight = rightSpace >= leftSpace;
      const preferredLeft = placeRight ? x + cardWidth + gap : x - availableWidth - gap;
      const left = Math.max(12, Math.min(screenWidth - availableWidth - 12, preferredLeft));
      const top = Math.max(12, Math.min(
        y + cardHeight / 2 - popupHeight / 2,
        screenHeight - popupHeight - 12
      ));

      setPopupFrame({ left, top, width: availableWidth });
      popupScale.setValue(0.88);
      popupOpacity.setValue(0);
      setOptionsVisible(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(popupScale, {
            toValue: 1, damping: 17, stiffness: 210, mass: 0.75, useNativeDriver: true,
          }),
          Animated.timing(popupOpacity, {
            toValue: 1, duration: 180, useNativeDriver: true,
          }),
        ]).start();
      });
    });
  };

  const closeOptions = () => {
    Animated.parallel([
      Animated.timing(popupScale, { toValue: 0.94, duration: 120, useNativeDriver: true }),
      Animated.timing(popupOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => setOptionsVisible(false));
  };

  const handleCardPress = () => {
    if (isOutOfStock) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/product/[id]", params: { id } });
  };

  const handleAddToCart = (e: any) => {
  e.stopPropagation();
  
  if (isUpdatingRef.current) return;
  isUpdatingRef.current = true;

  if (isOutOfStock) {
    isUpdatingRef.current = false;
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  animateBtn();

  console.log("Adding to cart",{
    id,name,stock,maxOrderQty,stockType:typeof stock,maxOrderQtyType:typeof maxOrderQty,
  });
  
  addToCart({
    id,
    name,
    price,
    mrp,
    image,
    thumbnailUrl,
    quantity: 1,
    stock,
    maxOrderQty,
    unit,
  });
  requestAnimationFrame(() => {
    isUpdatingRef.current = false;
  });
};

  const handleIncrease = (e: any) => {
  e.stopPropagation();

  if (isUpdatingRef.current) return;

  isUpdatingRef.current = true;

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  increaseQty(id);

  requestAnimationFrame(() => {
    isUpdatingRef.current = false;
  });
};

 const handleDecrease = (e: any) => {
  e.stopPropagation();

  if (isUpdatingRef.current) return;
  isUpdatingRef.current = true;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  decreaseQty(id);

  requestAnimationFrame(() => {
    isUpdatingRef.current = false;
  });
};

  return (
    <TouchableOpacity
      ref={cardRef}
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handleCardPress}
    >
      <Animated.View
        style={[
          styles.card,
          compactCard && styles.compactCard,
          uniformCard && styles.uniformCard,
          { width },
          isOutOfStock && styles.outOfStockCard,
          { transform: [{ scale }] },
        ]}
      >
        {/* Stock Badge */}
        {isOutOfStock && (
          <View style={[styles.stockBadge, styles.outOfStockBadge]}>
            <Text style={styles.stockBadgeText}>Out of Stock</Text>
          </View>
        )}
        {isLowStock && (
          <View style={[styles.stockBadge, styles.lowStockBadge]}>
            <Text style={styles.stockBadgeText}>Only {stock} left</Text>
          </View>
        )}

        {/* Image */}
        <View style={[styles.imageContainer, uniformCard && styles.uniformImageContainer]}>
          <Image
            source={{ uri: thumbnailUrl || image }}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={120}
            style={[styles.image, compactCard && styles.compactImage, uniformCard && styles.uniformImage, isOutOfStock && { opacity: 0.5 }]}
          />
          {rating > 0 && !isOutOfStock && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={8} color="#FF9500" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[styles.infoContainer, compactCard && styles.compactInfoContainer, uniformCard && styles.uniformInfoContainer]}>
          <Text style={[styles.name, compactCard && styles.compactName, uniformCard && styles.uniformName]} numberOfLines={2}>{name}</Text>
          <Text style={[styles.unit, compactCard && styles.compactUnit, uniformCard && styles.uniformUnit]} numberOfLines={1}>{unit}</Text>

          <View style={styles.bottomRow}>
            <View style={[styles.priceBlock, uniformCard && styles.uniformPriceBlock]}>
              <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" }}>
                <Text style={[styles.price, compactCard && styles.compactPrice, isOutOfStock && { color: "#ABABAB" }]}>₹{price}</Text>
                {Number(mrp) > Number(price) ? <Text style={[styles.mrp, compactCard && styles.compactMrp]}>₹{mrp}</Text> : null}
              </View>
              {Number(mrp) > Number(price) ? <Text style={[styles.savings, compactCard && styles.compactSavings]}>You save ₹{((Number(mrp) - Number(price)) * (itemInCart?.quantity ?? 1)).toFixed(2)}</Text> : uniformCard ? <View style={styles.uniformSavingsPlaceholder} /> : null}
            </View>

            {isOutOfStock ? (
              <View style={styles.unavailableBtn}>
                <Text style={styles.unavailableText}>N/A</Text>
              </View>

            ) : !itemInCart ? (
              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <View style={[styles.actionColumn, uniformCard && styles.uniformActionColumn]}>
                  <TouchableOpacity
                    style={[styles.addBtn, compactCard && styles.compactAddBtn]}
                    onPress={handleAddToCart}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={12} color="#fff" />
                    <Text style={[styles.addText, compactCard && styles.compactAddText]}>Add</Text>
                  </TouchableOpacity>
                  {otherOptions.length > 0 ? (
                    <TouchableOpacity
                      onPress={openOptions}
                      activeOpacity={0.7}
                      hitSlop={6}
                    >
                      <Text style={[styles.optionsLink, uniformCard && styles.uniformOptionsLink]}>See other options</Text>
                    </TouchableOpacity>
                  ) : uniformCard ? <View style={styles.uniformOptionsPlaceholder} /> : null}
                </View>
              </Animated.View>

            ) : (
              <View style={[styles.actionColumn, uniformCard && styles.uniformActionColumn]}>
                <View style={[styles.qtyBox, compactCard && styles.compactQtyBox]}>
                <TouchableOpacity
                disabled={false}
                  style={[styles.qtyBtn, compactCard && styles.compactQtyBtn]}
                  onPress={handleDecrease}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Ionicons name="remove" size={10} color="#007AFF" />
                </TouchableOpacity>


                <Text style={[styles.qtyText, compactCard && styles.compactQtyText]}>{itemInCart.quantity}</Text>
                <TouchableOpacity
                  disabled={false}
                  style={[styles.qtyBtn, compactCard && styles.compactQtyBtn, styles.qtyBtnAdd]}
                  onPress={handleIncrease}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Ionicons name="add" size={10} color="#fff" />
                </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
      <Modal
        visible={optionsVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeOptions}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeOptions}
          />
          <Animated.View
            style={[
              styles.optionsPopup,
              {
                left: popupFrame.left,
                top: popupFrame.top,
                width: popupFrame.width,
                opacity: popupOpacity,
                transform: [{ scale: popupScale }],
              },
            ]}
          >
            <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.glassHighlight} />
            <View style={styles.popupContent}>
              <View style={styles.popupHeader}>
                <View style={styles.popupHeading}>
                  <Text style={styles.popupTitle}>Available options</Text>
                  <Text style={styles.popupSubtitle} numberOfLines={1}>{name}</Text>
                </View>
                <TouchableOpacity onPress={closeOptions} hitSlop={8} accessibilityLabel="Close available options">
                  <Ionicons name="close-circle" size={23} color="#777" />
                </TouchableOpacity>
              </View>

              {otherOptions.map((option) => {
                const optionOutOfStock = (option.stock ?? 0) <= 0;
                const optionCartItem = cart.find((item) => item.id === option.id);
                return (
                  <View key={option.id} style={styles.optionRow}>
                    <TouchableOpacity
                      style={styles.optionProductTap}
                      activeOpacity={0.75}
                      disabled={optionOutOfStock}
                      onPress={() => {
                        closeOptions();
                        router.push({ pathname: "/product/[id]", params: { id: option.id } });
                      }}
                    >
                      {option.image ? (
                        <Image
                          source={{ uri: option.thumbnailUrl || option.image }}
                          style={[styles.optionImage, optionOutOfStock && styles.optionImageOutOfStock]}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View style={styles.optionImagePlaceholder}>
                          <Ionicons name="image-outline" size={19} color="#A0A7B4" />
                        </View>
                      )}
                      <View style={styles.optionDetails}>
                        <Text style={styles.optionName} numberOfLines={1}>{option.name}</Text>
                        <Text style={styles.optionUnit} numberOfLines={1}>{option.unit}</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.optionActionColumn}>
                      <Text style={styles.optionPrice}>₹{option.price}</Text>
                      {optionOutOfStock ? (
                        <Text style={[styles.optionStock, styles.optionOutOfStock]}>Out of stock</Text>
                      ) : optionCartItem ? (
                        <View style={styles.optionQtyBox}>
                          <TouchableOpacity
                            style={styles.optionQtyButton}
                            onPress={() => decreaseQty(option.id)}
                            hitSlop={6}
                          >
                            <Ionicons name="remove" size={13} color="#007AFF" />
                          </TouchableOpacity>
                          <Text style={styles.optionQtyText}>{optionCartItem.quantity}</Text>
                          <TouchableOpacity
                            style={[styles.optionQtyButton, styles.optionQtyButtonAdd]}
                            onPress={() => increaseQty(option.id)}
                            hitSlop={6}
                          >
                            <Ionicons name="add" size={13} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.optionAddButton}
                          activeOpacity={0.8}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            addToCart({
                              id: option.id,
                              name: option.name,
                              price: option.price,
                              mrp: option.mrp ?? option.price,
                              image: option.image ?? "",
                              thumbnailUrl: option.thumbnailUrl,
                              quantity: 1,
                              stock: option.stock ?? 0,
                              maxOrderQty: option.maxOrderQty,
                              unit: option.unit,
                            });
                          }}
                        >
                          <Ionicons name="add" size={13} color="#fff" />
                          <Text style={styles.optionAddText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  compactCard: { borderRadius: 11, marginRight: 0, marginBottom: 0, shadowOpacity: 0.035, shadowRadius: 4, elevation: 1 },
  uniformCard: { height: 148 },
  uniformImageContainer: { height: 44 },
  uniformImage: { height: 44 },
  uniformInfoContainer: { flex: 1, paddingHorizontal: 6, paddingTop: 4, paddingBottom: 4, justifyContent: "space-between" },
  uniformName: { height: 22, minHeight: 22, fontSize: 9, lineHeight: 11 },
  uniformUnit: { height: 11, fontSize: 8, marginTop: 0, marginBottom: 1 },
  uniformPriceBlock: { height: 21, justifyContent: "flex-start" },
  uniformSavingsPlaceholder: { height: 7, marginTop: 0 },
  uniformActionColumn: { height: 35, justifyContent: "flex-start" },
  uniformOptionsLink: { height: 10, fontSize: 7, marginTop: 1, textAlign: "center" },
  uniformOptionsPlaceholder: { height: 10 },
  compactImage: { height: 64 },
  compactInfoContainer: { paddingHorizontal: 6, paddingTop: 5, paddingBottom: 6 },
  compactName: { fontSize: 10, lineHeight: 13, minHeight: 26 },
  compactUnit: { fontSize: 9, marginBottom: 4 },
  compactPrice: { fontSize: 11 },
  compactMrp: { fontSize: 8, marginLeft: 3 },
  compactSavings: { fontSize: 7, marginTop: 1 },
  compactAddBtn: { minWidth: 66, minHeight: 25, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compactAddText: { fontSize: 9 },
  compactQtyBox: { minWidth: 66, minHeight: 25, paddingHorizontal: 2, paddingVertical: 2, gap: 1 },
  compactQtyBtn: { width: 20, height: 20, borderRadius: 6 },
  compactQtyText: { fontSize: 10, minWidth: 14 },

  outOfStockCard: { opacity: 0.7 },

  stockBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    zIndex: 10,
  },
  outOfStockBadge: { backgroundColor: "#FF3B30" },
  lowStockBadge: { backgroundColor: "#FF9500" },
  stockBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
  },

  imageContainer: {
    position: "relative",
    backgroundColor: "#F7F7F9",
  },
  image: {
    width: "100%",
    height: 88,
  },

  ratingBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 2,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },

  infoContainer: {
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 8,
  },

  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1C1E",
    lineHeight: 16,
    minHeight: 32,
    letterSpacing: -0.1,
  },

  unit: {
    fontSize: 10,
    color: "#ABABAB",
    fontWeight: "500",
    marginTop: 1,
    marginBottom: 6,
  },

  bottomRow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 5,
  },
  priceBlock: { width: "100%", minWidth: 0 },

  mrp: { fontSize: 10, color: '#999', textDecorationLine: 'line-through', marginLeft: 5 },
  savings: { fontSize: 9, color: '#18864B', fontWeight: '700', marginTop: 2 },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },

  addBtn: {
    width: "100%",
    minWidth: 0,
    minHeight: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 3,
  },
  actionColumn: {
    width: "100%",
    alignItems: "stretch",
    alignSelf: "stretch",
    maxWidth: "100%",
  },
  optionsLink: {
    color: "#007AFF",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,25,35,0.08)",
  },
  optionsPopup: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(248,250,255,0.72)",
    shadowColor: "#243047",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 18,
  },
  glassHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  popupContent: {
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 5,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  popupHeading: {
    flex: 1,
    marginRight: 12,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172033",
    letterSpacing: -0.25,
  },
  popupSubtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(80,95,120,0.16)",
    paddingVertical: 9,
    gap: 10,
  },
  optionProductTap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  optionImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  optionImageOutOfStock: {
    opacity: 0.45,
  },
  optionDetails: {
    flex: 1,
    minWidth: 0,
  },
  optionName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#172033",
    flexShrink: 1,
  },
  optionUnit: {
    fontSize: 10,
    color: "#667085",
    marginTop: 3,
  },
  optionActionColumn: {
    minWidth: 76,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
  },
  optionPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#172033",
  },
  optionStock: {
    fontSize: 9,
    color: "#18864B",
    marginTop: 3,
  },
  optionOutOfStock: {
    color: "#FF3B30",
  },
  optionAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 3,
  },
  optionAddText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  optionQtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,122,255,0.10)",
    borderRadius: 8,
    padding: 2,
    gap: 5,
  },
  optionQtyButton: {
    width: 23,
    height: 23,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,122,255,0.08)",
  },
  optionQtyButtonAdd: {
    backgroundColor: "#007AFF",
  },
  optionQtyText: {
    minWidth: 14,
    textAlign: "center",
    color: "#007AFF",
    fontSize: 11,
    fontWeight: "700",
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
  },

  qtyBox: {
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F3F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 9,
    paddingHorizontal: 3,
    paddingVertical: 2,
    gap: 3,
  },
  qtyBtn: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnAdd: {
    backgroundColor: "#1C1C1E",
  },
  qtyText: {
    color: "#1C1C1E",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 18,
    textAlign: "center",
  },

  unavailableBtn: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  unavailableText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ABABAB",
  },
});


export default memo(ProductCard);
