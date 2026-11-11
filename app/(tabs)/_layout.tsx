import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { Platform } from "react-native";
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
      tabBarLabelStyle: { fontSize: 9, fontWeight: "600", marginTop: -3, marginBottom: 0 },
      tabBarItemStyle: { height: 48, paddingTop: 1 },
      tabBarStyle: {
        position: "absolute", width: "78%", left: "11%", right: "11%", bottom: 10, height: 54,
        paddingTop: 2, paddingBottom: 2, borderRadius: 28, borderTopWidth: 0,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.88)",
        backgroundColor: "transparent", overflow: "hidden",
        elevation: 12, shadowColor: "#000000", shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12, shadowRadius: 16,
      },
      tabBarBackground: () => (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Platform.OS === "ios" ? (
            <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" tintColor="#F5F7FC" />
          ) : (
            <>
              <BlurView intensity={96} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.androidGlassBase} />
            </>
          )}
          <LinearGradient
            colors={["rgba(255,255,255,0.78)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0.34)"]}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassRim} />
          <View style={styles.glassReflection} />
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
  androidGlassBase: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(238,244,255,0.30)", borderRadius: 28 },
  glassRim: { ...StyleSheet.absoluteFillObject, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.62)" },
  glassReflection: { position: "absolute", top: 2, left: 18, right: 18, height: 1, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.96)" },
});
