import CategoryCard from "@/components/CategoryCard";
import FloatingCart from "@/components/FloatingCart";
import ProductCard from "@/components/ProductCard";
import PromotionalBannerSlider from "@/components/PromotionalBannerSlider";
import { calculateDistance } from "@/utils/calculateDistance";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image as ExpoImage } from "expo-image";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../firebase/config";

const { width } = Dimensions.get("window");
const Colors = {
  background: "#FFFFFF", card: "#FFFFFF", surface: "#F5F5F5",
  textPrimary: "#000000", textSecondary: "#666666", muted: "#999999",
  separator: "#E8E8E8", primary: "#000000", primaryLight: "#00000010",
  accent: "#333333", success: "#34C759", warning: "#FF9500", danger: "#FF3B30",
};

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [productGroups, setProductGroups] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [deliveryAllowed, setDeliveryAllowed] = useState<boolean | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(true);
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    const name = auth().currentUser?.displayName?.split(" ")[0] || "there";
    if (hour < 12) setGreeting(`Good morning, ${name}`);
    else if (hour < 17) setGreeting(`Good afternoon, ${name}`);
    else setGreeting(`Good evening, ${name}`);
  }, []);

  // Product catalogue stays live so stock, price and availability remain current.
  useEffect(() => db.collection("products").onSnapshot(
    snapshot => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.log("Products listener:", error.message)
  ), []);

  useEffect(() => db.collection("productGroups").onSnapshot(
    snapshot => setProductGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.log("Product groups listener:", error.message)
  ), []);

  useEffect(() => db.collection("brands").onSnapshot(
    snapshot => setBrands(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((brand: any) => brand.isActive !== false)),
    error => console.log("Brands listener:", error.message)
  ), []);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    return db.collection("addresses").where("userId", "==", user.uid).where("isDefault", "==", true).onSnapshot(
      snapshot => setAddress(snapshot.empty ? null : snapshot.docs[0].data()),
      error => console.log("Address listener:", error.message)
    );
  }, []);

  useEffect(() => db.collection("categories").orderBy("position").onSnapshot(
    snapshot => setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    error => console.log("Categories listener:", error.message)
  ), []);

  useEffect(() => {
    if (!address?.pincode) { setCheckingDelivery(false); setDeliveryAllowed(false); return; }
    return db.collection("settings").doc("delivery").onSnapshot(snapshot => {
      if (!snapshot.exists) return;
      const data = snapshot.data() as any;
      if (!data) return;
      const distance = calculateDistance(data.shopLatitude, data.shopLongitude, address.latitude, address.longitude);
      const insideRadius = distance <= data.radiusKm;
      const insidePincode = data.serviceablePincodes?.includes(String(address.pincode)) ?? false;
      setDeliveryAllowed(insideRadius && insidePincode);
      setCheckingDelivery(false);
    }, error => console.log("Delivery settings listener:", error.message));
  }, [address]);

  const visibleProducts = useMemo(() => products.filter((product: any) => {
    if (!product.groupId) return true;
    const group = productGroups.find((item: any) => item.id === product.groupId);
    return !group?.standardProductId || product.id === group.standardProductId;
  }), [products, productGroups]);

  const popularity = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product: any) => {
      counts[product.id] = Math.max(0, Number(product.popularityCount) || 0);
    });
    return counts;
  }, [products]);

  // Deterministic ranking avoids re-randomizing the whole rail on every
  // Firestore snapshot, reducing unnecessary work and visual movement.
  const recommendedProducts = useMemo(() => [...visibleProducts]
    .filter((product: any) => Number(product.stock) > 0)
    .sort((a: any, b: any) =>
      (popularity[b.id] || 0) - (popularity[a.id] || 0) ||
      String(a.name).localeCompare(String(b.name))
    )
    .slice(0, 12), [visibleProducts, popularity]);

  const optionsByGroup = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    products.forEach((product: any) => {
      if (!product.groupId) return;
      (grouped[product.groupId] ||= []).push(product);
    });
    return grouped;
  }, [products]);

  const visibleCategories = useMemo(() => {
    const used = new Set(products.map((product: any) => product.category));
    return categories.filter((category: any) => category.isVisible !== false && used.has(category.name));
  }, [categories, products]);

  const categoryLimit = showMoreCategories ? 15 : 6;
  const displayedCategories = visibleCategories.slice(0, categoryLimit);

  const brandPopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product: any) => {
      if (product.brandId) counts[product.brandId] = (counts[product.brandId] || 0) + Math.max(0, Number(product.popularityCount) || 0);
    });
    return counts;
  }, [products]);

  const sortedBrands = useMemo(() => [...brands].sort((a: any, b: any) =>
    (brandPopularity[b.id] || 0) - (brandPopularity[a.id] || 0) || String(a.name).localeCompare(String(b.name))
  ), [brands, brandPopularity]);

  const handleAddressPress = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/address"); };
  const handleSearchPress = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/search"); };
  const handleSectionPress = (sectionTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/section/[name]", params: { name: sectionTitle } });
  };
  const handleBrandPress = (brand: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/brand/[id]", params: { id: brand.id, name: brand.name } });
  };

  if (checkingDelivery) return <View style={styles.centerContainer}><Text style={styles.statusTitle}>Checking delivery availability to your area...<Text style={styles.statusSubtitle}>\nHang on...</Text></Text></View>;
  if (!deliveryAllowed) return (
    <View style={styles.centerContainer}>
      <Ionicons name="location-outline" size={70} color={Colors.danger} />
      <Text style={styles.statusTitle}>Delivery Unavailable</Text>
      <Text style={styles.statusSubtitle}>We currently don't deliver to your selected address. Please choose another delivery address.</Text>
      <TouchableOpacity style={styles.changeAddressButton} onPress={() => router.push("/address")}><Text style={styles.changeAddressText}>Change Address</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header, address and search are intentionally unchanged. */}
      <LinearGradient colors={[Colors.primary, Colors.accent]} style={[styles.headerGradient, { paddingTop: insets.top + 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={styles.header}>
          <View><Text style={styles.greeting}>{greeting}</Text><Text style={styles.welcomeText}>Welcome to BonMart</Text></View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push("/profile")}><Ionicons name="person-outline" size={22} color="#FFFFFF" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addressContainer} onPress={handleAddressPress} activeOpacity={0.8}>
          <Ionicons name="location-outline" size={18} color="#FFFFFF" />
          <Text style={styles.addressText} numberOfLines={1}>{address ? `${address.type}: ${address.address}` : "Add delivery address"}</Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity style={styles.searchBox} onPress={handleSearchPress} activeOpacity={0.9}>
        <Ionicons name="search-outline" size={20} color={Colors.muted} /><Text style={styles.searchText}>Search for products</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
        <PromotionalBannerSlider />
        {/* Recommendations */}
        <View style={styles.sectionHeading}>
          <View style={styles.headingCopy}><Text style={styles.sectionTitle}>Recommended for you</Text><Text style={styles.sectionSubtitle}>Popular picks, refreshed as people shop</Text></View>
        </View>
        {recommendedProducts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationRail}>
            {Array.from({ length: Math.ceil(recommendedProducts.length / 2) }, (_, columnIndex) => (
              <View key={columnIndex} style={styles.recommendationColumn}>
                {[recommendedProducts[columnIndex * 2], recommendedProducts[columnIndex * 2 + 1]].filter(Boolean).map((item: any) => (
                  <View key={item.id} style={styles.recommendationCard}>
                    <ProductCard id={item.id} name={item.name} price={Number(item.price) || 0} mrp={Number(item.mrp ?? item.price)} stock={Number(item.stock) || 0} image={item.image || ""} thumbnailUrl={item.thumbnailUrl} protext={item.protext ?? item.description ?? ""} rating={Number(item.rating) || 0} unit={item.unit || ""} width={94} compactCard maxOrderQty={item.maxOrderQty} availableOptions={item.groupId ? optionsByGroup[item.groupId] ?? [] : []} />
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : <Text style={styles.emptyHint}>Fresh recommendations will appear as products become available.</Text>}

        {/* Category grid */}
        <View style={[styles.sectionHeading, styles.categoryHeading]}>
          <View style={styles.headingCopy}><Text style={styles.sectionTitle}>Shop by Category</Text><Text style={styles.sectionSubtitle}>Find what you need, faster</Text></View>
          <Text style={styles.countLabel}>{visibleCategories.length} categories</Text>
        </View>
        <View style={styles.categoryGrid}>
          {displayedCategories.map((category: any) => (
            <CategoryCard key={category.id} title={category.name} subtitle={category.subtitle ?? ""} image={category.image ?? ""} compact onPress={() => handleSectionPress(category.name)} />
          ))}
        </View>
        {visibleCategories.length > 6 && (
          <TouchableOpacity style={styles.showMoreButton} onPress={() => { Haptics.selectionAsync(); setShowMoreCategories(value => !value); }}>
            <Text style={styles.showMoreText}>{showMoreCategories ? "Show fewer categories" : `Show more categories (+${Math.min(9, visibleCategories.length - 6)})`}</Text>
            <Ionicons name={showMoreCategories ? "chevron-up" : "chevron-down"} size={17} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}

        {/* Brand discovery */}
        {sortedBrands.length > 0 && <>
          <View style={[styles.sectionHeading, styles.brandHeading]}>
            <View style={styles.headingCopy}><Text style={styles.sectionTitle}>Shop by Favourite Brands</Text><Text style={styles.sectionSubtitle}>Discover the brands you love</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRail}>
            {sortedBrands.map((brand: any) => (
              <TouchableOpacity key={brand.id} style={styles.brandTile} activeOpacity={0.84} onPress={() => handleBrandPress(brand)}>
                {brand.imageUrl ? <View style={styles.brandImageBackground}>
                  <ExpoImage source={{ uri: brand.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                  <LinearGradient colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.78)"]} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.brandImageGradient}>
                    <Text style={styles.brandImageName} numberOfLines={1}>{brand.name}</Text>
                  </LinearGradient>
                </View> : <View style={styles.brandFallback}>
                  <View style={styles.brandMonogram}><Text style={styles.brandMonogramText}>{String(brand.name || "B").trim().charAt(0).toUpperCase()}</Text></View>
                  <View style={styles.brandTileCopy}><Text style={styles.brandName} numberOfLines={1}>{brand.name}</Text></View>
                </View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>}
      </ScrollView>
      <FloatingCart />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 14, color: "#FFFFFF", opacity: 0.8, marginBottom: 2 },
  welcomeText: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  addressContainer: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30, alignSelf: "flex-start" },
  addressText: { fontSize: 13, color: "#FFFFFF", fontWeight: "500", maxWidth: width - 120 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, marginHorizontal: 16, marginTop: -15, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: Colors.separator },
  searchText: { flex: 1, fontSize: 15, color: Colors.muted },
  scrollContent: { paddingBottom: 20, paddingTop: 2 },
  sectionHeading: { paddingHorizontal: 18, marginTop: 8, marginBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headingCopy: { flex: 1 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.45 },
  sectionSubtitle: { fontSize: 11, color: Colors.muted, marginTop: 3 },
  recommendationRail: { paddingHorizontal: 16, paddingBottom: 8 },
  recommendationColumn: { width: 102, marginRight: 8, gap: 6 },
  recommendationCard: { width: 94 },
  emptyHint: { color: Colors.muted, fontSize: 12, paddingHorizontal: 18, paddingVertical: 18 },
  categoryHeading: { marginTop: 16 },
  countLabel: { color: Colors.muted, fontSize: 10, fontWeight: "600" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", paddingHorizontal: 12, paddingTop: 2 },
  showMoreButton: { marginHorizontal: 18, marginTop: 2, marginBottom: 14, paddingVertical: 12, borderRadius: 13, borderWidth: 1, borderColor: Colors.separator, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  showMoreText: { color: Colors.textPrimary, fontSize: 12, fontWeight: "700" },
  brandHeading: { marginTop: 18 },
  brandRail: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  brandTile: { width: (width - 42) / 2, height: 78, borderRadius: 14, overflow: "hidden", backgroundColor: "#F7F7F7", borderWidth: 1, borderColor: "#E8E8E8" },
  brandImageBackground: { flex: 1, width: "100%", height: "100%" },
  brandImage: { borderRadius: 13 },
  brandImageGradient: { flex: 1, justifyContent: "flex-end", padding: 9 },
  brandImageName: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", textShadowColor: "#00000088", textShadowRadius: 5 },
  brandFallback: { flex: 1, paddingHorizontal: 9, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  brandMonogram: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E6E6E6", alignItems: "center", justifyContent: "center" },
  brandMonogramText: { fontSize: 20, fontWeight: "900", color: "#111111" },
  brandTileCopy: { flex: 1, minWidth: 0 },
  brandName: { color: "#111111", fontSize: 16, fontWeight: "900" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30, backgroundColor: Colors.background },
  statusTitle: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary, marginTop: 20, textAlign: "center" },
  statusSubtitle: { marginTop: 10, fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  changeAddressButton: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  changeAddressText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
