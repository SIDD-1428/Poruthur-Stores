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
      headerShown:false,
      tabBarActiveTintColor: "#111111",
      tabBarInactiveTintColor: "#777777",
      tabBarStyle: {
        position: "absolute",
        left: "10%",
        width: "80%",
        bottom: 18,
        height: 58,
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: 30,
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.72)",
        backgroundColor: "rgba(255,255,255,0.48)",
        overflow: "hidden",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 10,
      },
      tabBarBackground: () => (
        <BlurView
          intensity={82}
          tint="light"
          style={StyleSheet.absoluteFill}
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
      {/*Home screen*/}
      <Tabs.Screen name="home"
      options={{
        title: "Home",
        tabBarIcon: ({color, size})=>(
            <Ionicons name="home" color={color} size={size}/>
        )
      }}/>
    
      {/*Cart screen*/}
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

      {/*order*/}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={24} color={color} />
          ),
        }}
      />

      {/*Profile screen*/}
      <Tabs.Screen name="profile"
      options={{
        title: "Profile",
        tabBarIcon: ({color, size})=>(
            <Ionicons name="person" color={color} size={size}/>
        )
      }} />
    </Tabs>
  );
}