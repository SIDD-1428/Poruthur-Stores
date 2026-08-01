import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from "../../firebase/config";

const Colors = {
  background: "#FFFFFF",
  card: "#FFFFFF",
  surface: "#F5F5F5",
  textPrimary: "#000000",
  textSecondary: "#666666",
  muted: "#999999",
  separator: "#E8E8E8",
  primary: "#000000",
  primaryLight: "#00000010",
  accent: "#333333",
  danger: "#FF3B30",
};

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) return;

    const unsubscribe = db
      .collection("users")
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        },
        (error) => {
          console.log("User listener:", error.message);
        }
      );

    return unsubscribe;
  }, []);
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await auth().signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.log(error);
              Alert.alert("Error", "Failed to logout");
            }
          },
        },
      ]
    );
  };

  const handleNavigation = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const menuItems = [
    { icon: "bag-outline", title: "My Orders", route: "/orders" },
    { icon: "location-outline", title: "Delivery Address", route: "/address" },
    { icon: "help-circle-outline", title: "Help & Support", route: "/support" },
    { icon: "shield-checkmark-outline", title: "Privacy Policy", route: "/privacy" },
    { icon: "document-text-outline", title: "Terms & Conditions", route: "/terms" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.accent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* User Card */}
      <View style={styles.userCard}>
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>
            {(userData?.fullName?.charAt(0) ?? "U").toUpperCase()}
          </Text>
        </LinearGradient>

        <View style={styles.userInfo}>
          <Text style={styles.name}>
            {userData?.fullName ?? "User"}
          </Text>
          <View style={styles.emailContainer}>
            <Ionicons name="mail-outline" size={14} color={Colors.muted} />
            <Text style={styles.email}>{userData?.email ?? "No Email"}</Text>
          </View>

          <View style={styles.emailContainer}>
            <Ionicons
              name="call-outline"
              size={14}
              color={Colors.muted}
            />
            <Text style={styles.email}>
              {userData?.phone ?? "No Phone"}
            </Text>
          </View>
          <View style={styles.uidContainer}>
            <Ionicons name="finger-print-outline" size={12} color={Colors.muted} />
            <Text style={styles.uid} numberOfLines={1}>
              ID: {userData?.uid?.slice(0, 12)}...
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleNavigation(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>


      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.danger, "#E53935"]}
          style={styles.logoutGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },

  // User Card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: -25,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  uidContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  uid: {
    fontSize: 10,
    color: Colors.muted,
  },

  // Menu Section
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  // App Info
  appInfo: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 4,
  },
  appCopy: {
    fontSize: 10,
    color: Colors.muted,
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});