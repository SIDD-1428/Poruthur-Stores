import messaging from "@react-native-firebase/messaging";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import auth from "@react-native-firebase/auth";

export default function NotificationPermissionScreen() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    try {
      if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
        setGranted(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
      } else {
        const status = await messaging().hasPermission();
        setGranted(status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL);
      }
    } catch (error) {
      console.warn("Notification permission check failed:", error);
      setGranted(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const continueToApp = async (skip: boolean) => {
    const uid = auth().currentUser?.uid;
    if (uid && skip) await AsyncStorage.setItem(`notification-permission-skipped:${uid}`, "true");
    router.replace("/(tabs)/home");
  };

  const request = async () => {
    setBusy(true);
    try {
      let allowed = false;
      if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        allowed = result === PermissionsAndroid.RESULTS.GRANTED;
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert("Notifications are blocked", "Enable notifications for BonMart in your device settings.", [
            { text: "Not now", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]);
        }
      } else {
        const result = await messaging().requestPermission();
        allowed = result === messaging.AuthorizationStatus.AUTHORIZED || result === messaging.AuthorizationStatus.PROVISIONAL;
        if (!allowed) {
          Alert.alert("Notifications are disabled", "You can enable them later in device settings.", [
            { text: "Not now", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]);
        }
      }
      setGranted(allowed);
      if (allowed) {
        const uid = auth().currentUser?.uid;
        if (uid) await AsyncStorage.removeItem(`notification-permission-skipped:${uid}`);
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.warn("Notification permission request failed:", error);
      Alert.alert("Unable to request permission", "Please try again or enable notifications in device settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.icon}><Ionicons name="notifications-outline" size={42} color="#111" /></View>
      <Text style={styles.title}>{granted ? "Notifications are enabled" : "Stay updated with BonMart"}</Text>
      <Text style={styles.copy}>{granted ? "You're ready to receive BonMart notifications." : "Enable notifications for order confirmations, delivery updates and important alerts. You can change this anytime in device settings."}</Text>
      {granted === null ? <ActivityIndicator size="large" color="#111" /> : granted ? (
        <TouchableOpacity style={styles.primary} onPress={() => continueToApp(false)}><Text style={styles.primaryText}>Continue to BonMart</Text></TouchableOpacity>
      ) : <>
        <TouchableOpacity style={styles.primary} onPress={request} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Enable Notifications</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => continueToApp(true)}><Text style={styles.secondaryText}>Not now</Text></TouchableOpacity>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 28 },
  icon: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#f2f2f2", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  title: { color: "#111", fontSize: 25, lineHeight: 32, fontWeight: "800", textAlign: "center" },
  copy: { color: "#666", fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 14, marginBottom: 30 },
  primary: { minHeight: 52, width: "100%", borderRadius: 14, backgroundColor: "#111", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondary: { minHeight: 48, justifyContent: "center", paddingHorizontal: 20, marginTop: 8 },
  secondaryText: { color: "#666", fontSize: 14, fontWeight: "600" },
});