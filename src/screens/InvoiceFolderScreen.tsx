import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getInvoiceFiles,
  scanAndParseInvoices,
  deleteInvoiceFromFolder,
  getProcessedFiles,
  clearProcessedFiles,
  INVOICE_FOLDER_PATH,
} from "../services/invoiceScanner";
import {
  registerInvoiceScannerTask,
  unregisterInvoiceScannerTask,
  isInvoiceScannerTaskRegistered,
} from "../services/invoiceScannerTask";
import * as Sharing from "expo-sharing";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function InvoiceFolderScreen({ navigation }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);

  useEffect(() => {
    loadFiles();
    checkAutoScanStatus();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const invoiceFiles = await getInvoiceFiles();
      setFiles(invoiceFiles);
    } catch (error) {
      console.error("Error loading files:", error);
      Alert.alert("Error", "Failed to load invoice files");
    } finally {
      setLoading(false);
    }
  };

  const checkAutoScanStatus = async () => {
    const registered = await isInvoiceScannerTaskRegistered();
    setAutoScanEnabled(registered);
  };

  const handleScanNow = async () => {
    setScanning(true);
    setScanProgress("Starting scan...");

    try {
      const results = await scanAndParseInvoices((message) => {
        setScanProgress(message);
      });

      Alert.alert(
        "Scan Complete",
        `Total: ${results.total} files\nProcessed: ${results.processed}\nSkipped: ${results.skipped}\nErrors: ${results.errors}\nNew Items: ${results.newItems}`,
        [{ text: "OK" }]
      );

      await loadFiles();
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Scan Error",
        error instanceof Error ? error.message : "Failed to scan invoices"
      );
    } finally {
      setScanning(false);
      setScanProgress("");
    }
  };

  const handleToggleAutoScan = async () => {
    try {
      if (autoScanEnabled) {
        await unregisterInvoiceScannerTask();
        setAutoScanEnabled(false);
        Alert.alert(
          "Auto-Scan Disabled",
          "Background scanning has been turned off"
        );
      } else {
        await registerInvoiceScannerTask();
        setAutoScanEnabled(true);
        Alert.alert(
          "Auto-Scan Enabled",
          "Invoices will be scanned automatically every hour"
        );
      }
    } catch (error) {
      console.error("Error toggling auto-scan:", error);
      Alert.alert("Error", "Failed to toggle auto-scan");
    }
  };

  const handleDeleteFile = (filename: string) => {
    Alert.alert(
      "Delete Invoice",
      `Are you sure you want to delete ${filename}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInvoiceFromFolder(filename);
              await loadFiles();
              Alert.alert("Success", "Invoice deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete invoice");
            }
          },
        },
      ]
    );
  };

  const handleClearProcessedTracking = () => {
    Alert.alert(
      "Clear Processing History",
      "This will allow all files to be re-processed on next scan. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearProcessedFiles();
            Alert.alert("Success", "Processing history cleared");
          },
        },
      ]
    );
  };

  const handleShareFolder = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Folder Path",
          `Copy this path to access invoices:\n\n${INVOICE_FOLDER_PATH}`,
          [{ text: "OK" }]
        );
        return;
      }

      Alert.alert(
        "Folder Location",
        `Invoice folder:\n${INVOICE_FOLDER_PATH}\n\nAdd PDF or image files to this folder, then tap "Scan Now"`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error sharing folder:", error);
    }
  };

  const processedFiles = getProcessedFiles();

  return (
    <LinearGradient
      colors={["#6366f1", "#8b5cf6", "#a855f7"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-semibold">
            Invoice Folder
          </Text>
          <Pressable
            onPress={handleShareFolder}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="folder-open" size={24} color="white" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Auto-Scan Toggle */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-white text-lg font-semibold">
                  Auto-Scan
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Scan folder hourly
                </Text>
              </View>
              <Pressable
                onPress={handleToggleAutoScan}
                className={`w-14 h-8 rounded-full ${autoScanEnabled ? "bg-green-500" : "bg-white/30"} justify-center`}
              >
                <View
                  className={`w-6 h-6 bg-white rounded-full ${autoScanEnabled ? "ml-7" : "ml-1"}`}
                />
              </Pressable>
            </View>
          </View>

          {/* Scan Now Button */}
          <Pressable
            onPress={handleScanNow}
            disabled={scanning}
            className="bg-white rounded-2xl p-4 items-center mb-4"
          >
            {scanning ? (
              <View className="flex-col items-center">
                <ActivityIndicator color="#8b5cf6" size="large" />
                <Text className="text-purple-600 font-semibold mt-2">
                  {scanProgress}
                </Text>
              </View>
            ) : (
              <>
                <Ionicons name="scan" size={32} color="#8b5cf6" />
                <Text className="text-purple-600 text-lg font-semibold mt-2">
                  Scan Now
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Parse all new invoices
                </Text>
              </>
            )}
          </Pressable>

          {/* Stats */}
          <View className="bg-white/20 rounded-2xl p-4 mb-4">
            <Text className="text-white text-base font-semibold mb-2">
              Statistics
            </Text>
            <Text className="text-white/90 text-sm">
              Total Files: {files.length}
            </Text>
            <Text className="text-white/90 text-sm">
              Processed: {processedFiles.size}
            </Text>
            <Text className="text-white/90 text-sm">
              Pending: {files.length - processedFiles.size}
            </Text>
          </View>

          {/* Clear Processing History */}
          <Pressable
            onPress={handleClearProcessedTracking}
            className="bg-white/20 rounded-xl p-3 items-center mb-4"
          >
            <Text className="text-white font-medium">
              Clear Processing History
            </Text>
          </Pressable>

          {/* Files List */}
          <Text className="text-white text-lg font-semibold mb-3">
            Invoice Files ({files.length})
          </Text>

          {loading ? (
            <ActivityIndicator color="white" size="large" />
          ) : files.length === 0 ? (
            <View className="bg-white/20 rounded-2xl p-6 items-center">
              <Ionicons name="folder-open-outline" size={48} color="white" />
              <Text className="text-white text-base mt-4 text-center">
                No invoice files found
              </Text>
              <Text className="text-white/70 text-sm mt-2 text-center">
                Add PDF or image files to the invoice folder
              </Text>
            </View>
          ) : (
            files.map((file, index) => {
              const isProcessed = processedFiles.has(file);
              return (
                <View
                  key={index}
                  className="bg-white/20 rounded-xl p-4 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center">
                      <Ionicons
                        name={
                          file.toLowerCase().endsWith(".pdf")
                            ? "document-text"
                            : "image"
                        }
                        size={20}
                        color="white"
                      />
                      <Text className="text-white text-sm font-medium ml-2 flex-1">
                        {file}
                      </Text>
                    </View>
                    {isProcessed && (
                      <Text className="text-green-300 text-xs mt-1">
                        ✓ Processed
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleDeleteFile(file)}
                    className="w-10 h-10 items-center justify-center"
                  >
                    <Ionicons name="trash" size={20} color="#ff6b6b" />
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
