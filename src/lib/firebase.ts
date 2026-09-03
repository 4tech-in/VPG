import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { apiRequest } from "./api-client";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
// We check if it is supported to avoid errors in environments that don't support it (e.g., SSR)
export const messaging = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

// Send Token to Backend
export const registerTokenWithBackend = async (token: string) => {
  try {
    const response = await apiRequest("notifications/token", {
      method: "POST",
      body: JSON.stringify({
        token: token,
        platform: "web",
        browser: navigator.userAgent
      })
    });
    console.log("FCM Token registered with backend.");
  } catch (error) {
    console.error("Error registering token with backend:", error);
  }
};

// Request Notification Permission & Get FCM Token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const msg = await messaging();
      if (!msg) {
         console.warn("Messaging is not supported on this browser.");
         return;
      }
      const token = await getToken(msg, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
      });
      
      if (token) {
        console.log("FCM Token retrieved.");
        localStorage.setItem("fcm_token", token);
        // Send this token to the backend
        await registerTokenWithBackend(token);
        return token;
      } else {
        console.log("No registration token available.");
      }
    } else {
      console.log("Notification permission denied.");
    }
  } catch (error) {
    console.error("An error occurred while retrieving FCM token: ", error);
  }
};

// Unregister Token (On Logout)
export const unregisterTokenOnLogout = async () => {
  try {
    const token = localStorage.getItem("fcm_token");
    if (!token) return;
    
    await apiRequest("notifications/token", {
      method: "DELETE",
      body: JSON.stringify({ token })
    });
    localStorage.removeItem("fcm_token");
    console.log("FCM Token unregistered.");
  } catch (error) {
    console.error("Error unregistering token:", error);
  }
};
