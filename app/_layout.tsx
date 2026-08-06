import { Stack } from "expo-router";
import React, {
  useEffect,
  useState,
} from "react";

import InAppNotification from "@/components/InAppNotification";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { initializeNotifications } from "@/services/notification";
import auth from "@react-native-firebase/auth";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      auth().onAuthStateChanged(
        async (currentUser) => {
          setUser(currentUser);
          if(currentUser){
            await initializeNotifications();
          }
          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NotificationProvider>
    {/*<NotificationBanner />*/}
    <AuthProvider>
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="(auth)/login"
            />

            <Stack.Screen
              name="(auth)/signup"
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="(tabs)"
            />

            <Stack.Screen
              name="product/[id]"
              options={{
                presentation:
                  "transparentModal",
              }}
            />

            <Stack.Screen
              name="add-address"
            />

            <Stack.Screen
              name="edit-address"
            />
          </>
        )}
      </Stack>
    <InAppNotification/>
    </CartProvider>
    </AuthProvider>
    </NotificationProvider>
  );
}