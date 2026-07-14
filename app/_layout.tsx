import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import {
  Stack,
} from "expo-router";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  StatusBar,
} from "expo-status-bar";

import React, {
  useEffect,
  useState,
} from "react";

import "react-native-reanimated";

import {
  auth,
} from "../firebase/config";

import {
  useColorScheme,
} from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme =
    useColorScheme();

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(
            currentUser
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack
        screenOptions={{
          headerShown:
            false,
        }}
      >
        {!user ? (
          <Stack.Screen
            name="login"
          />
        ) : (
          <Stack.Screen
            name="(tabs)"
          />
        )}
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}