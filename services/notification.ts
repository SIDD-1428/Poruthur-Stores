import { showNotification } from "@/context/NotificationContext";
import { db } from "@/firebase/config";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";

export async function initializeNotifications() {
  try {
    // Check current permission
    let authStatus = await messaging().hasPermission();

    if (
      authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
      authStatus !== messaging.AuthorizationStatus.PROVISIONAL
    ) {
      authStatus = await messaging().requestPermission();
    }

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("Notification permission denied");
      return;
    }

    const token = await messaging().getToken();
    console.log("FCM Token:", token);

    const user = auth().currentUser;
    if (!user) return;

    await db.collection("users").doc(user.uid).update({
      fcmToken: token,
      notificationEnabled: true,
      tokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Token refresh listener
    messaging().onTokenRefresh(async (newToken) => {
      console.log("FCM Token Refreshed:", newToken);

      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await db.collection("users").doc(currentUser.uid).update({
        fcmToken: newToken,
        tokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });

    // Foreground notification
    messaging().onMessage(async (remoteMessage) => {

      console.log("Foreground Notification:", remoteMessage);

      showNotification({
        title: remoteMessage.notification?.title ?? "Notification",
        body: remoteMessage.notification?.body ?? "",
        orderId: String(remoteMessage.data?.orderId ?? ""),
      });

    });

    // App opened from notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Opened from notification:", remoteMessage);

      // Later we'll navigate to the relevant screen here.
    });

    // App launched from a notification
    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      console.log("Opened app from quit state:", initialNotification);

      // Navigation logic will be added later.
    }

  } catch (error) {
    console.log("Notification Init Error:", error);
  }
}