import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";

import InAppNotification from "@/components/InAppNotification";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { initializeNotifications } from "@/services/notification";
import auth from "@react-native-firebase/auth";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(
      async (currentUser) => {
        try {
          setUser(currentUser);

          if (currentUser) {
            try {
              await initializeNotifications();
            } catch (notificationError) {
              console.log(
                "Notification initialization error:",
                notificationError
              );
            }
          }
        } catch (error) {
          console.log("Auth state error:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];

    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";

    // User is NOT logged in
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }

      return;
    }

    // User IS logged in
    // If they somehow land on the login/signup screens,
    // send them to the main app.
    if (inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments]);

  // Wait until Firebase has determined the authentication state.
  // This prevents the app from briefly showing the login screen
  // before restoring the existing session.
  if (loading) {
    return null;
  }

  return (
    <NotificationProvider>
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
                    presentation: "transparentModal",
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

          <InAppNotification />
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}