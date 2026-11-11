import { db } from "@/firebase/config";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import InAppNotification from "@/components/InAppNotification";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import auth from "@react-native-firebase/auth";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      try {
        setUser(currentUser);
      } catch (error) {
        console.log("Auth state error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    const checkUserProfile = async () => {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();

        if (!userDoc.exists() || !userDoc.data()?.profileCompleted) {
          if (firstSegment !== "personal-info") {
            router.replace("/personal-info");
          }
          return;
        }

        const addressSnapshot = await db
          .collection("addresses")
          .where("userId", "==", user.uid)
          .limit(1)
          .get();

        if (addressSnapshot.empty) {
          if (firstSegment !== "add-address") {
            router.replace({
              pathname: "/add-address",
              params: { onboarding: "true" },
            });
          }
          return;
        }

        if (inAuthGroup) {
          router.replace("/(tabs)/home");
        }
      } catch (error) {
        console.log("Profile navigation error:", error);
      }
    };

    checkUserProfile();
  }, [user, loading, segments]);

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
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
                    <Stack.Screen name="(auth)/login" />
                    <Stack.Screen name="(auth)/signup" />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="product/[id]"
                      options={{ presentation: "transparentModal" }}
                    />
                    <Stack.Screen name="add-address" />
                    <Stack.Screen name="edit-address" />
                    <Stack.Screen name="personal-info" />
                    <Stack.Screen name="notification-permission" />
                  </>
                )}
              </Stack>

              <InAppNotification />
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
