import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./src/navigation/AppNavigator";
import React from "react";
import { initializeInvoiceFolder } from "./src/services/invoiceScanner";
import { registerInvoiceScannerTask } from "./src/services/invoiceScannerTask";
import { initializeDToolsFolder } from "./src/services/dtoolsScanner";
import { useInventoryStore } from "./src/state/inventoryStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  // Force navigation to reset on mount - don't persist state
  const [navigationKey, setNavigationKey] = React.useState(0);
  const autoMergeAllDuplicates = useInventoryStore((s) => s.autoMergeAllDuplicates);

  React.useEffect(() => {
    // Reset navigation on mount
    setNavigationKey(Date.now());

    // Initialize invoice folder and background scanning
    const initializeInvoiceServices = async () => {
      try {
        await initializeInvoiceFolder();
        console.log("Invoice folder initialized");

        // Register background task for hourly scanning
        await registerInvoiceScannerTask();
        console.log("Invoice scanner background task registered");
      } catch (error) {
        console.error("Error initializing invoice services:", error);
      }
    };

    // Initialize D-Tools folder
    const initializeDToolsServices = async () => {
      try {
        await initializeDToolsFolder();
        console.log("D-Tools folder initialized");
      } catch (error) {
        console.error("Error initializing D-Tools services:", error);
      }
    };

    initializeInvoiceServices();
    initializeDToolsServices();
    // REMOVED: Auto-merge duplicates on startup - was causing performance issues
    // Users can manually clear inventory if needed
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer key={navigationKey}>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
