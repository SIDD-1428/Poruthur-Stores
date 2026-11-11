import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useCart } from "../../context/CartContext";

export default function TabLayout(){
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return(
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#111111",
      tabBarInactiveTintColor: "#777777",
      tabBarStyle: {
        position: "absolute",
        alignSelf: "center",
        width: "80%",
        bottom: 18,
        height: 62,
        paddingTop: 6,
        paddingBottom: 6,
        borderRadius: 32,
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.82)",
        backgroundColor: "transparent",
        overflow: "hidden",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 22,
        elevation: 14,
      },
      tabBarBackground: () => (
        <BlurView
          intensity={95}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, styles.glassBackground]}
        />
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
    }}>
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
  glassBackground: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
});
