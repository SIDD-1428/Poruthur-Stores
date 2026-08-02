import FloatingCart from "@/components/FloatingCart";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProductCard from "../../components/ProductCard";
import { db } from "../../firebase/config";
import { getProducts } from "../../services/products";

export default function SectionScreen() {
  const { name } = useLocalSearchParams();
  

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const sidebarRef=useRef<FlatList<any>>(null);

  useEffect(() => {
  const unsubscribe = db
    .collection("products")
    .onSnapshot(
      (snapshot) => {
        const allProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredProducts = allProducts.filter(
          (item: any) => item.category === name
        );

        setProducts(filteredProducts);
      },
      (error) => {
        console.log("Products listener:", error.message);
      }
    );

  return unsubscribe;
}, [name]);
    
  useEffect(() => {
    loadCategories();
}, [name]);



  const loadCategories = async () => {
  try {
    const snapshot = await db
      .collection("categories")
      .get();

    const allProducts = await getProducts();

    const usedCategories = new Set(
      allProducts.map((item: any) => item.category)
    );

    const data = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(
        (item: any) =>
          item.isVisible &&
          usedCategories.has(item.name)
      )
      .sort(
        (a: any, b: any) =>
          (a.position ?? 0) - (b.position ?? 0)
      );

    setCategories(data);

    const selectedIndex = data.findIndex(
      (item: any) => item.name === name
    );

    if (selectedIndex !== -1) {
      setTimeout(() => {
        sidebarRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  } catch (error) {
    console.log(error);
  }
};


  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#000000", "#333333"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.subtitle}>{products.length} items</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <FlatList 
            ref={sidebarRef}
            data={categories}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.sidebarContent}
            onScrollToIndexFailed={(info)=>{
              sidebarRef.current?.scrollToOffset({
                offset:info.averageItemLength*info.index,
                animated:true,
              });
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryButton,
                  item.name === name && styles.selectedCategory,
                ]}
                onPress={async()=>{
                  if(item.name===name)return;
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace(`/section/${item.name}`)
                }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.categoryImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.categoryEmoji}>📦</Text>
                )}

                <Text
                  numberOfLines={1}
                  style={[
                    styles.categoryName,
                    item.name === name && styles.selectedCategoryName,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Products */}
        <View style={styles.products}>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={true}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ProductCard
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  stock={item.stock}
                  image={item.image}
                  protext={item.protext ?? item.description}
                  rating={item.rating}
                  unit={item.unit}
                  maxOrderQty={item.maxOrderQty}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found in this category</Text>
              </View>
            }
          />
          
        </View>
       
      </View>

      {/* ── Floating Cart ── */}
      <FloatingCart />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // ── Header ──
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },

  // ── Content ──
  content: {
    flex: 1,
    flexDirection: "row",
    paddingTop: 12,
  },

  // ── Sidebar ──
  sidebar: {
    width: 80,
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  sidebarContent: {
    paddingBottom: 20,
  },
  categoryButton: {
    width: 68,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    minHeight: 70,
    justifyContent: "center",
  },
  selectedCategory: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  categoryImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 9,
    textAlign: "center",
    color: "#444444",
    lineHeight: 12,
    maxWidth: 60,
  },
  selectedCategoryName: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ── Products ──
  products: {
    flex: 1,
    paddingHorizontal: 4,
  },
  productList: {
    paddingBottom: 30,
    paddingRight: 4,
  },
  row: {
    justifyContent: "flex-start",
    gap: 10,
  },
  cardWrapper: {
    width: "47%",
    marginBottom: 12,
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
  },
});
