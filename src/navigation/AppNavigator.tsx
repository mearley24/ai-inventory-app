import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import InventoryScreen from "../screens/InventoryScreen";
import ScannerScreen from "../screens/ScannerScreen";
import TimeTrackerScreen from "../screens/TimeTrackerScreen";
import PasswordVaultScreen from "../screens/PasswordVaultScreen";
import AddItemScreen from "../screens/AddItemScreen";
import EditItemScreen from "../screens/EditItemScreen";
import ImportScreen from "../screens/ImportScreen";
import InvoiceUploadScreen from "../screens/InvoiceUploadScreen";
import AddPasswordScreen from "../screens/AddPasswordScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { useAuthStore } from "../state/authStore";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Inventory") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "Scanner") {
            iconName = focused ? "scan" : "scan-outline";
          } else if (route.name === "PasswordVault") {
            iconName = focused ? "lock-closed" : "lock-closed-outline";
          } else if (route.name === "TimeTracker") {
            iconName = focused ? "timer" : "timer-outline";
          }

          if (route.name === "Scanner" && focused) {
            return (
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{
                  marginBottom: 20,
                  shadowColor: "#4F46E5",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  className="w-14 h-14 rounded-full items-center justify-center"
                >
                  <Ionicons name={iconName} size={28} color="white" />
                </LinearGradient>
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ tabBarLabel: "Inventory" }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ tabBarLabel: "Scan" }}
      />
      <Tab.Screen
        name="PasswordVault"
        component={PasswordVaultScreen}
        options={{ tabBarLabel: "Vault" }}
      />
      <Tab.Screen
        name="TimeTracker"
        component={TimeTrackerScreen}
        options={{ tabBarLabel: "Time" }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  React.useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // App Stack
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="AddItem"
            component={AddItemScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="EditItem"
            component={EditItemScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="Import"
            component={ImportScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="InvoiceUpload"
            component={InvoiceUploadScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="AddPassword"
            component={AddPasswordScreen}
            options={{ presentation: "modal" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
