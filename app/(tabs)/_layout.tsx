import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useCart } from "../../context/CartContext";

export default function TabLayout() {
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#111111",
      tabBarInactiveTintColor: "#858585",
      tabBarShowLabel: true,
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: -2, marginBottom: 2 },
      tabBarItemStyle: { height: 54, paddingTop: 4 },
      tabBarStyle: {
        position: "absolute", left: 14, right: 14, bottom: 8, height: 66,
        paddingTop: 5, paddingBottom: 5, borderRadius: 25, borderTopWidth: 0,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.78)",
        backgroundColor: "rgba(255,255,255,0.72)", overflow: "hidden",
        elevation: 12, shadowColor: "#000000", shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12, shadowRadius: 16,
      },
      tabBarBackground: () => (
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={82} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.glassWash} />
        </View>
      ),
    }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarBadge: totalQty > 0 ? totalQty : undefined, tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glassWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.24)", borderRadius: 25 },
});
