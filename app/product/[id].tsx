import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { getProductById } from "../../services/products";
import { db } from "../../firebase/config";

const { width, height } = Dimensions.get("window");

export default function ProductDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [product, setProduct] = useState<any>(null);
    const [groupVariants, setGroupVariants] = useState<any[]>([]);
    const [imageLoaded, setImageLoaded] = useState(false);
    const { cart, addToCart, increaseQty, decreaseQty } = useCart();

    // Animations
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const imageScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadProduct();
        // Entrance animation
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                damping: 20,
                stiffness: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                damping: 20,
                stiffness: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const loadProduct = async () => {
        try {
            const data: any = await getProductById(id);
            setProduct(data);
            if (data?.groupId) {
                const groupSnapshot = await db.collection("productGroups").doc(String(data.groupId)).get();
                if (groupSnapshot.exists()) {
                    const groupData = groupSnapshot.data() as any;
                    const ids: string[] = Array.isArray(groupData?.productIds) ? groupData.productIds : [];
                    const snapshots = await Promise.all(ids.map((productId) => db.collection("products").doc(productId).get()));
                    const variants = snapshots
                        .filter((snapshot) => snapshot.exists)
                        .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
                        .sort((a: any, b: any) => {
                            if (a.id === groupData.standardProductId) return -1;
                            if (b.id === groupData.standardProductId) return 1;
                            return String(a.unit ?? "").localeCompare(String(b.unit ?? ""));
                        });
                    setGroupVariants(variants);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => router.back());
    };

    const handleAddToCart = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        addToCart({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            mrp: Number(product.mrp ?? product.price),
            image: product.image,
            quantity: 1,
            stock: product.stock,
            maxOrderQty: product.maxOrderQty,
            unit: product.unit,
        });
        // Button bounce animation
        Animated.sequence([
            Animated.timing(imageScale, {
                toValue: 1.1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(imageScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    if (!product) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIcon}>
                    <Ionicons name="cube-outline" size={48} color="#999" />
                </View>
                <Text style={styles.loadingText}>Loading product...</Text>
            </View>
        );
    }

    const itemInCart = cart.find((item) => item.id === product.id);
    const isOutOfStock = product.stock <= 0;
    const productPrice = Number(product.price);
    const productMrp = Number(product.mrp ?? product.price);
    const quantityInCart = itemInCart?.quantity ?? 1;
    const totalSavings = Math.max(0, productMrp - productPrice) * quantityInCart;

    return (
    <View style={styles.overlay}>

        {/* Blurred background */}
        <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint="dark"
        />

        {/* Tap outside card to close */}
        <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
        />

        <Animated.View
            style={[
                styles.card,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >

            {/* CARD */}

            {/* Close Button */}
            <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
            >
                <Ionicons
                    name="close"
                    size={24}
                    color="#000"
                />
            </TouchableOpacity>


            {/* FIXED IMAGE */}
            <Animated.View
                style={{
                    transform: [{ scale: imageScale }],
                }}
            >
                <Image
                    source={{ uri: product.image }}
                    style={styles.image}
                    onLoadStart={() => setImageLoaded(false)}
                    onLoadEnd={() => setImageLoaded(true)}
                />

                {!imageLoaded && (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons
                            name="image-outline"
                            size={40}
                            color="#CCC"
                        />
                    </View>
                )}
            </Animated.View>


            {/* SCROLLABLE DETAILS */}
            <ScrollView
                style={styles.detailsScroll}
                contentContainerStyle={styles.detailsContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                directionalLockEnabled={true}
            >

                {/* Stock */}
                {isOutOfStock ? (
                    <View
                        style={[
                            styles.stockBadge,
                            styles.outOfStockBadge,
                        ]}
                    >
                        <Ionicons
                            name="close-circle"
                            size={16}
                            color="#FF3B30"
                        />

                        <Text style={styles.outOfStockText}>
                            Out of Stock
                        </Text>
                    </View>
                ) : product.stock <= 5 ? (
                    <View
                        style={[
                            styles.stockBadge,
                            styles.lowStockBadge,
                        ]}
                    >
                        <Ionicons
                            name="alert-circle"
                            size={16}
                            color="#FF9500"
                        />

                        <Text style={styles.lowStockText}>
                            Only {product.stock} left in stock
                        </Text>
                    </View>
                ) : null}


                {/* NAME */}
                <Text style={styles.name}>
                    {product.name}
                </Text>


                {/* UNIT + RATING */}
                <View style={styles.metaRow}>

                    <View style={styles.unitContainer}>
                        <Ionicons
                            name="cube-outline"
                            size={14}
                            color="#666"
                        />

                        <Text style={styles.unit}>
                            {product.unit}
                        </Text>
                    </View>

                    {product.rating > 0 && (
                        <View style={styles.ratingContainer}>
                            <Ionicons
                                name="star"
                                size={14}
                                color="#FF9500"
                            />

                            <Text style={styles.rating}>
                                {product.rating}
                            </Text>
                        </View>
                    )}

                </View>


                {/* PRODUCT SIZE / VARIANT SELECTOR */}
                {groupVariants.length > 1 && (
                    <View style={styles.variantSection}>
                        <Text style={styles.sectionTitle}>Available sizes</Text>
                        <View style={styles.variantOptions}>
                            {groupVariants.map((variant: any) => {
                                const selected = variant.id === product.id;
                                const unavailable = Number(variant.stock ?? 0) <= 0;
                                return (
                                    <TouchableOpacity
                                        key={variant.id}
                                        disabled={unavailable}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setProduct(variant);
                                            setImageLoaded(false);
                                        }}
                                        style={[
                                            styles.variantOption,
                                            selected && styles.variantOptionSelected,
                                            unavailable && styles.variantOptionDisabled,
                                        ]}
                                    >
                                        <Text style={[styles.variantUnit, selected && styles.variantTextSelected]}>
                                            {variant.unit || variant.name}
                                        </Text>
                                        <Text style={[styles.variantPrice, selected && styles.variantTextSelected]}>
                                            ₹{Number(variant.price || 0).toFixed(2)}
                                        </Text>
                                        {unavailable && <Text style={styles.variantUnavailable}>Out of stock</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* PRICE */}
                <View style={{ marginTop: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={styles.price}>₹{productPrice}</Text>
                    {productMrp > productPrice ? <Text style={styles.mrp}>₹{productMrp}</Text> : null}
                  </View>
                  {productMrp > productPrice ? <Text style={styles.savings}>You save ₹{totalSavings.toFixed(2)}{quantityInCart > 1 ? ` on ${quantityInCart} items` : ""}</Text> : null}
                </View>
                

                {/* MAX ORDER */}
                {product.maxOrderQty > 0 && (
                    <View style={styles.infoCard}>

                        <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color="#666"
                        />

                        <Text style={styles.infoText}>
                            Maximum {product.maxOrderQty} units per order
                        </Text>

                    </View>
                )}
                

                {/* DESCRIPTION */}
                {(product.protext || product.description) && (
                    <View style={styles.descriptionSection}>

                        <Text style={styles.sectionTitle}>
                            Description
                        </Text>

                        <Text style={styles.description}>
                            {product.protext || product.description}
                        </Text>

                    </View>
                )}


            </ScrollView>


            {/* FIXED BOTTOM BUTTON */}
            {!isOutOfStock && (
                <View style={styles.bottomContainer}>

                    {!itemInCart ? (

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddToCart}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[
                                    "#000000",
                                    "#333333",
                                ]}
                                style={styles.addButtonGradient}
                            >
                                <Ionicons
                                    name="cart-outline"
                                    size={20}
                                    color="#FFF"
                                />

                                <Text style={styles.addButtonText}>
                                    Add to Cart
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                    ) : (

                        <View style={styles.qtyBox}>

                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() =>
                                    decreaseQty(product.id)
                                }
                            >
                                <Ionicons
                                    name="remove"
                                    size={18}
                                    color="#FFF"
                                />
                            </TouchableOpacity>

                            <Text style={styles.qtyText}>
                                {itemInCart.quantity}
                            </Text>

                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() =>
                                    increaseQty(product.id)
                                }
                            >
                                <Ionicons
                                    name="add"
                                    size={18}
                                    color="#FFF"
                                />
                            </TouchableOpacity>

                        </View>

                    )}

                </View>
            )}

        </Animated.View>

    </View>
);
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
    loadingIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 14,
        color: "#999",
    },

    card: {
        width: width * 0.9,
        height: height * 0.85,
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 15,
    },

    cardContent: {
        flex: 1,
    },

   detailsScroll: {
    flex:1,
},

    detailsContent: {
        paddingBottom: 30,
    },

    closeBtn: {
        position: "absolute",
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.05)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },

    image: {
        width: "100%",
        height: 280,
        backgroundColor: "#F5F5F5",
    },
    imagePlaceholder: {
        position: "absolute",
        width: "100%",
        height: 280,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
    },

    stockBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    outOfStockBadge: {
        backgroundColor: "#FF3B3015",
    },
    lowStockBadge: {
        backgroundColor: "#FF950015",
    },
    outOfStockText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FF3B30",
    },
    lowStockText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FF9500",
    },

    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#000",
        marginHorizontal: 16,
        marginTop: 12,
    },

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 8,
        gap: 12,
    },
    unitContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    unit: {
        fontSize: 13,
        color: "#666",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    rating: {
        fontSize: 13,
        fontWeight: "600",
        color: "#FF9500",
    },

    mrp: { fontSize: 14, color: '#999', textDecorationLine: 'line-through', marginLeft: 8 },
    savings: { color: '#18864B', fontSize: 13, fontWeight: '700', marginTop: 3 },
    price: {
        fontSize: 28,
        fontWeight: "800",
        color: "#000",
        marginHorizontal: 16,
        marginTop: 12,
    },

    variantSection: {
        marginHorizontal: 16,
        marginTop: 18,
    },
    variantOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
    },
    variantOption: {
        minWidth: 88,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        backgroundColor: "#FAFAFA",
    },
    variantOptionSelected: {
        borderColor: "#000",
        backgroundColor: "#000",
    },
    variantOptionDisabled: {
        opacity: 0.4,
    },
    variantUnit: {
        color: "#222",
        fontSize: 12,
        fontWeight: "600",
    },
    variantPrice: {
        color: "#555",
        fontSize: 12,
        marginTop: 4,
    },
    variantTextSelected: {
        color: "#FFF",
    },
    variantUnavailable: {
        color: "#D00",
        fontSize: 9,
        marginTop: 3,
    },

    descriptionSection: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },

    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: "#666",
        flex: 1,
    },

  bottomContainer: {
    height: 90,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    backgroundColor: "#FFF",
    justifyContent: "center",
},

    addButton: {
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    addButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },

    qtyBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        borderRadius: 30,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 20,
    },
    qtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    qtyText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "600",
        minWidth: 40,
        textAlign: "center",
    },
});