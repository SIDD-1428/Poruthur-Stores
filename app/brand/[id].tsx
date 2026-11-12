import FloatingCart from "@/components/FloatingCart";
import ProductCard from "@/components/ProductCard";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../firebase/config";

export default function BrandProductsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = db.collection("products").onSnapshot(snapshot => {
      setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, error => { console.log("Brand products listener:", error.message); setLoading(false); });
    const unsubGroups = db.collection("productGroups").onSnapshot(snapshot => setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => { unsubProducts(); unsubGroups(); };
  }, []);

  useEffect(() => {
    const standardByGroup = new Map(groups.map((group: any) => [group.id, group.standardProductId]));
    setProducts(allProducts.filter((product: any) => {
      if (product.brandId !== id) return false;
      if (!product.groupId) return true;
      const standardId = standardByGroup.get(String(product.groupId));
      return standardId ? product.id === standardId : true;
    }));
  }, [allProducts, groups, id]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#000000", "#333333"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={23} color="#FFFFFF" /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={styles.title} numberOfLines={1}>{name || "Brand"}</Text><Text style={styles.subtitle}>{products.length} products</Text></View>
        </View>
      </LinearGradient>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#000000" /></View> : (
        <FlatList data={products} keyExtractor={item => item.id} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <View style={styles.cardWrap}><ProductCard id={item.id} width="100%" categoryGridCard name={item.name} price={Number(item.price) || 0} mrp={Number(item.mrp ?? item.price)} stock={Number(item.stock) || 0} image={item.image || ""} thumbnailUrl={item.thumbnailUrl} protext={item.protext ?? item.description ?? ""} rating={Number(item.rating) || 0} unit={item.unit || ""} maxOrderQty={item.maxOrderQty} availableOptions={item.groupId ? allProducts.filter(option => option.groupId === item.groupId) : []} /></View>}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="pricetag-outline" size={44} color="#999999" /><Text style={styles.emptyTitle}>No products available</Text><Text style={styles.emptyText}>There are currently no products listed under this brand.</Text></View>}
        />
      )}
      <FloatingCart />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingTop: 54, paddingBottom: 18, paddingHorizontal: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF22", alignItems: "center", justifyContent: "center" },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "800" },
  subtitle: { color: "#FFFFFFAA", fontSize: 12, marginTop: 3 },
  list: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 110 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  cardWrap: { width: "48%" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 35, paddingTop: 100 },
  emptyTitle: { color: "#111111", fontSize: 17, fontWeight: "700", marginTop: 12 },
  emptyText: { color: "#999999", fontSize: 12, textAlign: "center", marginTop: 6, lineHeight: 18 },
});
