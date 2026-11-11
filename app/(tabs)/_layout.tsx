import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useCart } from "../../context/CartContext";

export default function TabLayout() {
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "#777777",
        tabBarStyle: {
          position: "absolute",
          left: "10%",
          right: "10%",
          width: undefined,
          bottom: 18,
          height: 64,
          paddingTop: 7,
          paddingBottom: 7,
          borderRadius: 32,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.72)",
          backgroundColor: "transparent",
          overflow: "hidden",
          shadowColor: "#172033",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 18,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={100}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.glassTint} />
            <View pointerEvents="none" style={styles.glassHighlight} />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: 1,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: totalQty > 0 ? totalQty : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 249, 255, 0.12)",
  },
  glassHighlight: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
});
