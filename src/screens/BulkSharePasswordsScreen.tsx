import React from "react";
import { View, Text, Pressable, ScrollView, Alert, TextInput, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePasswordVaultStore } from "../state/passwordVaultStore";
import { useAuthStore } from "../state/authStore";
import { PasswordEntry, PasswordPermission } from "../types/password";
import { safeGoBack } from "../utils/navigation";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function BulkSharePasswordsScreen({ navigation }: any) {
  const [selectedPasswords, setSelectedPasswords] = React.useState<string[]>([]);
  const [shareEmail, setShareEmail] = React.useState("");
  const [sharePermission, setSharePermission] = React.useState<PasswordPermission>("use");

  const passwords = usePasswordVaultStore((s) => s.passwords);
  const shareMultiplePasswords = usePasswordVaultStore((s) => s.shareMultiplePasswords);
  const user = useAuthStore((s) => s.user);

  // Only show passwords owned by current user
  const ownedPasswords = passwords.filter((pwd) => pwd.createdBy === user?.uid);

  const togglePassword = (passwordId: string) => {
    setSelectedPasswords((prev) =>
      prev.includes(passwordId)
        ? prev.filter((id) => id !== passwordId)
        : [...prev, passwordId]
    );
  };

  const selectAll = () => {
    setSelectedPasswords(ownedPasswords.map((p) => p.id));
  };

  const deselectAll = () => {
    setSelectedPasswords([]);
  };

  const handleBulkShare = () => {
    if (!shareEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    if (selectedPasswords.length === 0) {
      Alert.alert("Error", "Please select at least one password to share");
      return;
    }

    const emailLower = shareEmail.toLowerCase().trim();

    if (emailLower === user?.email?.toLowerCase()) {
      Alert.alert("Error", "You cannot share with yourself");
      return;
    }

    const passwordNames = ownedPasswords
      .filter((p) => selectedPasswords.includes(p.id))
      .map((p) => p.title)
      .join(", ");

    Alert.alert(
      "Confirm Bulk Share",
      `Share ${selectedPasswords.length} password(s) with ${shareEmail}?\n\nPasswords: ${passwordNames}\n\nPermission: ${sharePermission === "use" ? "Auto-Fill Only" : "Full Access"}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share All",
          onPress: () => {
            shareMultiplePasswords(selectedPasswords, emailLower, sharePermission);

            const permissionText = sharePermission === "use"
              ? "They can auto-fill all passwords but cannot view them."
              : "They have full access to view and copy all passwords.";

            Alert.alert(
              "Success!",
              `${selectedPasswords.length} password(s) shared with ${shareEmail}.\n\n${permissionText}`,
              [{ text: "OK", onPress: () => safeGoBack(navigation) }]
            );
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Client System":
        return "desktop";
      case "Network":
        return "wifi";
      case "Control4":
        return "home";
      case "Security System":
        return "shield-checkmark";
      case "Audio/Video":
        return "musical-notes";
      case "Smart Home":
        return "bulb";
      case "Cloud Service":
        return "cloud";
      case "Admin":
        return "key";
      default:
        return "lock-closed";
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => safeGoBack(navigation)}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-xl font-bold text-neutral-900">Share Multiple</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text className="text-sm text-neutral-600 mb-4">
          Select passwords to share with an installer or team member
        </Text>

        {/* Quick Actions */}
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={selectAll}
            className="flex-1 bg-indigo-100 rounded-xl py-2 items-center"
          >
            <Text className="text-indigo-700 font-semibold text-sm">Select All</Text>
          </Pressable>
          <Pressable
            onPress={deselectAll}
            className="flex-1 bg-neutral-200 rounded-xl py-2 items-center"
          >
            <Text className="text-neutral-700 font-semibold text-sm">Clear</Text>
          </Pressable>
        </View>

        {selectedPasswords.length > 0 && (
          <View className="bg-indigo-50 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
            <Text className="text-indigo-700 font-medium ml-2">
              {selectedPasswords.length} password{selectedPasswords.length > 1 ? "s" : ""} selected
            </Text>
          </View>
        )}
      </View>

      {/* Password List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {ownedPasswords.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="lock-closed-outline" size={64} color="#9CA3AF" />
            <Text className="text-neutral-500 text-base mt-4">No passwords to share</Text>
          </View>
        ) : (
          ownedPasswords.map((password, index) => {
            const isSelected = selectedPasswords.includes(password.id);
            return (
              <Animated.View
                key={password.id}
                entering={FadeInDown.delay(index * 30).springify()}
              >
                <Pressable
                  onPress={() => togglePassword(password.id)}
                  className={`mb-3 rounded-2xl p-4 flex-row items-center ${
                    isSelected ? "bg-indigo-50 border-2 border-indigo-600" : "bg-white"
                  }`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? "bg-indigo-600" : "bg-neutral-100"}`}>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={24} color="white" />
                    ) : (
                      <Ionicons name={getCategoryIcon(password.category)} size={20} color="#6B7280" />
                    )}
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-neutral-900">{password.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <View className="bg-neutral-200 rounded-full px-2 py-1">
                        <Text className="text-xs font-medium text-neutral-600">{password.category}</Text>
                      </View>
                      {password.username && (
                        <Text className="text-xs text-neutral-500 ml-2">{password.username}</Text>
                      )}
                    </View>
                  </View>

                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? "#4F46E5" : "#D1D5DB"}
                  />
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Section */}
      <View className="px-6 py-4 bg-white border-t border-neutral-200">
        <Text className="text-sm font-semibold text-neutral-700 mb-2">Recipient Email</Text>
        <TextInput
          className="bg-neutral-100 rounded-xl px-4 py-3 text-base text-neutral-900 mb-3"
          placeholder="installer@company.com"
          placeholderTextColor="#9CA3AF"
          value={shareEmail}
          onChangeText={setShareEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text className="text-sm font-semibold text-neutral-700 mb-2">Permission Level</Text>

        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={() => setSharePermission("use")}
            className={`flex-1 rounded-xl p-3 ${sharePermission === "use" ? "bg-indigo-600" : "bg-neutral-200"}`}
          >
            <View className="items-center">
              <Ionicons name="enter-outline" size={20} color={sharePermission === "use" ? "white" : "#6B7280"} />
              <Text className={`text-xs font-semibold mt-1 ${sharePermission === "use" ? "text-white" : "text-neutral-700"}`}>
                Auto-Fill Only
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setSharePermission("full")}
            className={`flex-1 rounded-xl p-3 ${sharePermission === "full" ? "bg-indigo-600" : "bg-neutral-200"}`}
          >
            <View className="items-center">
              <Ionicons name="eye-outline" size={20} color={sharePermission === "full" ? "white" : "#6B7280"} />
              <Text className={`text-xs font-semibold mt-1 ${sharePermission === "full" ? "text-white" : "text-neutral-700"}`}>
                Full Access
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={handleBulkShare}
          disabled={selectedPasswords.length === 0 || !shareEmail.trim()}
          className={`rounded-xl py-4 items-center ${
            selectedPasswords.length === 0 || !shareEmail.trim()
              ? "bg-neutral-300"
              : "bg-indigo-600"
          }`}
        >
          <Text className={`font-semibold text-base ${
            selectedPasswords.length === 0 || !shareEmail.trim()
              ? "text-neutral-500"
              : "text-white"
          }`}>
            Share {selectedPasswords.length > 0 ? `${selectedPasswords.length} ` : ""}Password{selectedPasswords.length !== 1 ? "s" : ""}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
