import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
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
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { db } from "../../firebase/config";
import { getProductById } from "../../services/products";

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
            thumbnailUrl: product.thumbnailUrl,
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

            {/* Product image hero */}
            <View style={styles.hero}>
                <Animated.View style={[styles.heroImageWrap, { transform: [{ scale: imageScale }] }]}>
                    <Image
                        source={{ uri: product.image }}
                        style={styles.image}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={150}
                        onLoadStart={() => setImageLoaded(false)}
                        onLoadEnd={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={42} color="#C5C9C3" />
                        </View>
                    )}
                </Animated.View>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.75}>
                        <Ionicons name="close" size={21} color="#17251D" />
                    </TouchableOpacity>
                </View>
                <View style={styles.heroBottomShade} />
            </View>


            {/* SCROLLABLE DETAILS */}
            <ScrollView
                style={styles.detailsScroll}
                contentContainerStyle={styles.detailsContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                directionalLockEnabled={true}
            >

                <View style={styles.productIntro}>
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
                <Text style={styles.name}>{product.name}</Text>


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
                </View>

                {/* PRODUCT SIZE / VARIANT SELECTOR */}
                {groupVariants.length > 1 && (
                    <View style={styles.variantSection}>
                        <View style={styles.variantHeadingRow}>
                            <Text style={styles.sectionTitle}>Available sizes</Text>
                            <Text style={styles.variantHint}>SELECT SIZE</Text>
                        </View>
                        <View style={styles.variantRail}>
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
                                            activeOpacity={0.8}
                                            style={[
                                                styles.variantOption,
                                                selected && styles.variantOptionSelected,
                                                unavailable && styles.variantOptionDisabled,
                                            ]}
                                        >
                                            <Text style={[styles.variantUnit, selected && styles.variantTextSelected]} numberOfLines={1}>
                                                {variant.unit || variant.name}
                                            </Text>
                                            <Text style={[styles.variantPrice, selected && styles.variantTextSelected]}>
                                                ₹{Number(variant.price || 0).toFixed(2)}
                                            </Text>
                                            {unavailable && <Text style={styles.variantUnavailable}>Unavailable</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {/* PRICE HIGHLIGHT */}
                <View style={styles.pricePanel}>
                    <View style={styles.priceMainRow}>
                        <View>
                            <Text style={styles.priceEyebrow}>OUR PRICE</Text>
                            <View style={styles.priceLine}>
                                <Text style={styles.price}>₹{productPrice.toFixed(2)}</Text>
                                {productMrp > productPrice ? <Text style={styles.mrp}>MRP ₹{productMrp.toFixed(2)}</Text> : null}
                            </View>
                        </View>
                        {productMrp > productPrice ? (
                            <View style={styles.savingsPill}>
                                <Ionicons name="pricetag" size={13} color="#24734A" />
                                <Text style={styles.savings}>SAVE ₹{totalSavings.toFixed(2)}</Text>
                            </View>
                        ) : (
                            <View style={styles.priceUnitPill}>
                                <Text style={styles.priceUnitText}>Per {product.unit}</Text>
                            </View>
                        )}
                    </View>
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
            <View style={styles.bottomContainer}>
                {isOutOfStock ? (
                    <View style={styles.outOfStockButton}>
                        <Ionicons name="close-circle-outline" size={19} color="#9A9F9B" />
                        <Text style={styles.outOfStockButtonText}>Currently unavailable</Text>
                    </View>
                ) : !itemInCart ? (

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddToCart}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["#111111", "#145A3A"]}
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

        </Animated.View>

    </View>
);
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(10,18,13,0.38)",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F7F8F5",
    },
    loadingIcon: {
        width: 76,
        height: 76,
        borderRadius: 26,
        backgroundColor: "#F1F1F1",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    loadingText: { fontSize: 14, color: "#778078", fontWeight: "500" },
    card: {
        width: width * 0.93,
        height: height * 0.89,
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#07140C",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 20,
    },
    cardContent: { flex: 1 },
    detailsScroll: { flex: 1 },
    detailsContent: { paddingBottom: 24 },
    hero: {
        height: 252,
        backgroundColor: "#F2F7F3",
        overflow: "hidden",
    },
    heroImageWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 12,
    },
    image: {
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
    },
    imagePlaceholder: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F2F7F3",
    },
    heroTopRow: {
        position: "absolute",
        top: 15,
        left: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 5,
    },
    heroBottomShade: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "rgba(0,0,0,0.07)",
    },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.92)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#173A2A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    productIntro: {
        paddingHorizontal: 20,
        paddingTop: 17,
    },
    stockBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 10,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 30,
        gap: 6,
    },
    outOfStockBadge: { backgroundColor: "#FFF0EF" },
    lowStockBadge: { backgroundColor: "#FFF5E6" },
    outOfStockText: { fontSize: 11, fontWeight: "700", color: "#D83C32" },
    lowStockText: { fontSize: 11, fontWeight: "700", color: "#B66A13" },
    name: {
        fontSize: 23,
        lineHeight: 29,
        fontWeight: "800",
        color: "#173A2A",
        letterSpacing: -0.55,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 9,
        gap: 9,
    },
    unitContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F3F3F3",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    unit: { fontSize: 11, color: "#5F7568", fontWeight: "600" },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FFF7E9",
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },
    rating: { fontSize: 11, fontWeight: "800", color: "#B87519" },
    pricePanel: {
        marginHorizontal: 20,
        marginTop: 17,
        paddingHorizontal: 15,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: "#F4F8F4",
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    priceMainRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    priceEyebrow: {
        fontSize: 9,
        color: "#888888",
        fontWeight: "800",
        letterSpacing: 1.1,
        marginBottom: 3,
    },
    priceLine: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    price: {
        fontSize: 27,
        fontWeight: "900",
        color: "#173A2A",
        letterSpacing: -0.8,
    },
    mrp: {
        fontSize: 13,
        color: "#9AA29B",
        textDecorationLine: "line-through",
        fontWeight: "500",
    },
    savingsPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#EAEAEA",
        borderRadius: 30,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    savings: { color: "#145A3A", fontSize: 10, fontWeight: "800" },
    priceUnitPill: {
        backgroundColor: "#EEEEEE",
        borderRadius: 30,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    priceUnitText: { fontSize: 10, color: "#5F7568", fontWeight: "700" },
    variantSection: {
        marginHorizontal: 20,
        marginTop: 20,
    },
    variantHeadingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    variantHint: {
        color: "#87978C",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 1,
    },
    variantRail: {
        backgroundColor: "#F1F1F1",
        borderRadius: 15,
        padding: 4,
        borderWidth: 1,
        borderColor: "#E2ECE4",
    },
    variantOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "stretch",
        gap: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#173A2A",
        marginBottom: 2,
        letterSpacing: -0.2,
    },
    variantOption: {
        width: "23%",
        minWidth: 0,
        maxWidth: "23%",
        paddingHorizontal: 3,
        paddingVertical: 9,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    variantOptionSelected: {
        backgroundColor: "#234B35",
        shadowColor: "#173A2A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        elevation: 2,
    },
    variantOptionDisabled: { opacity: 0.38 },
    variantUnit: {
        color: "#145A3A",
        fontSize: 11,
        fontWeight: "700",
        textAlign: "center",
    },
    variantPrice: {
        color: "#777777",
        fontSize: 10,
        marginTop: 4,
        fontWeight: "600",
        textAlign: "center",
    },
    variantTextSelected: { color: "#FFFFFF" },
    variantUnavailable: {
        color: "#D94A42",
        fontSize: 8,
        marginTop: 4,
        fontWeight: "600",
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F7F3",
        marginHorizontal: 20,
        marginTop: 15,
        padding: 12,
        borderRadius: 14,
        gap: 9,
        borderWidth: 1,
        borderColor: "#EBEBEB",
    },
    infoText: { fontSize: 11, color: "#667168", flex: 1, fontWeight: "500" },
    descriptionSection: {
        marginHorizontal: 20,
        marginTop: 19,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },
    description: { fontSize: 13, color: "#68736A", lineHeight: 21, marginTop: 5 },
    bottomContainer: {
        minHeight: 86,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        backgroundColor: "rgba(255,255,255,0.98)",
        justifyContent: "center",
    },
    addButton: {
        borderRadius: 17,
        overflow: "hidden",
        shadowColor: "#173A2A",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 5,
    },
    addButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        gap: 9,
    },
    addButtonText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.1 },
    qtyBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        minWidth: 180,
        backgroundColor: "#234B35",
        borderRadius: 17,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 22,
    },
    qtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
    },
    qtyText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", minWidth: 28, textAlign: "center" },
    outOfStockButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 15,
        borderRadius: 17,
        backgroundColor: "#F1F3F0",
    },
    outOfStockButtonText: { color: "#89928A", fontSize: 14, fontWeight: "700" },
});
