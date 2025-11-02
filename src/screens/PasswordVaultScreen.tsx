import React from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { usePasswordVaultStore } from "../state/passwordVaultStore";
import { useAuthStore } from "../state/authStore";
import { PasswordEntry, PasswordCategory } from "../types/password";
import Animated, { FadeInDown } from "react-native-reanimated";

const CATEGORIES = [
  "All",
  "Client System",
  "Network",
  "Control4",
  "Security System",
  "Audio/Video",
  "Smart Home",
  "Cloud Service",
  "Admin",
  "Other",
] as const;

type CategoryFilter = "All" | PasswordCategory;

const getCategoryIcon = (category: PasswordCategory): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case "Client System": return "desktop-outline";
    case "Network": return "wifi-outline";
    case "Control4": return "home-outline";
    case "Security System": return "shield-checkmark-outline";
    case "Audio/Video": return "musical-notes-outline";
    case "Smart Home": return "bulb-outline";
    case "Cloud Service": return "cloud-outline";
    case "Admin": return "key-outline";
    default: return "lock-closed-outline";
  }
};

export default function PasswordVaultScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryFilter>("All");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const passwords = usePasswordVaultStore((s) => s.passwords);
  const deletePassword = usePasswordVaultStore((s) => s.deletePassword);
  const getPassword = usePasswordVaultStore((s) => s.getPassword);
  const logAccess = usePasswordVaultStore((s) => s.logAccess);
  const user = useAuthStore((s) => s.user);

  const filteredPasswords = passwords.filter((pwd) => {
    const matchesSearch = pwd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pwd.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pwd.website?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || pwd.category === selectedCategory;

    // Check if user has access
    const hasAccess = pwd.createdBy === user?.uid ||
      pwd.sharedWith.includes(user?.uid || "") ||
      pwd.allowedRoles.includes(user?.role || "");

    return matchesSearch && matchesCategory && hasAccess;
  });

  const handleCopyPassword = async (passwordEntry: PasswordEntry) => {
    try {
      const plainPassword = await getPassword(passwordEntry.id);
      if (plainPassword) {
        await Clipboard.setStringAsync(plainPassword);
        logAccess(passwordEntry.id, "copied");
        setCopiedId(passwordEntry.id);
        setTimeout(() => setCopiedId(null), 2000);

        // Show subtle feedback
        Alert.alert("Copied", "Password copied to clipboard", [{ text: "OK" }]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to copy password");
    }
  };

  const handleCopyUsername = async (username: string) => {
    await Clipboard.setStringAsync(username);
    Alert.alert("Copied", "Username copied to clipboard");
  };

  return (
    <View className="flex-1 bg-neutral-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-neutral-900">Password Vault</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("AddPassword")}
              className="bg-indigo-600 rounded-full w-10 h-10 items-center justify-center"
              style={{
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
          <Text className="text-base text-neutral-500">
            {filteredPasswords.length} secure {filteredPasswords.length === 1 ? "password" : "passwords"}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-neutral-900"
              placeholder="Search passwords..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full flex-row items-center ${
                selectedCategory === category
                  ? "bg-indigo-600"
                  : "bg-white"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              {category !== "All" && (
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={16}
                  color={selectedCategory === category ? "white" : "#6B7280"}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                className={`font-medium text-sm ${
                  selectedCategory === category
                    ? "text-white"
                    : "text-neutral-700"
                }`}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Passwords List */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {filteredPasswords.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="lock-closed-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-medium text-neutral-400 mt-4">
                {searchQuery ? "No passwords found" : "No passwords yet"}
              </Text>
              <Text className="text-sm text-neutral-400 mt-1">
                {searchQuery ? "Try a different search" : "Add passwords to get started"}
              </Text>
            </View>
          ) : (
            filteredPasswords.map((password, index) => (
              <Animated.View
                key={password.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  onPress={() => navigation.navigate("ViewPassword", { password })}
                  className="bg-white rounded-2xl p-4 mb-3"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-start">
                    {/* Icon */}
                    <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center">
                      <Ionicons
                        name={getCategoryIcon(password.category)}
                        size={24}
                        color="#4F46E5"
                      />
                    </View>

                    {/* Content */}
                    <View className="flex-1 ml-4">
                      <Text className="text-lg font-semibold text-neutral-900 mb-1">
                        {password.title}
                      </Text>
                      {password.username && (
                        <Pressable
                          onPress={() => handleCopyUsername(password.username!)}
                          className="flex-row items-center mb-1"
                        >
                          <Ionicons name="person-outline" size={14} color="#6B7280" />
                          <Text className="text-sm text-neutral-600 ml-1">{password.username}</Text>
                        </Pressable>
                      )}
                      <View className="flex-row items-center flex-wrap gap-2 mt-1">
                        <View className="bg-neutral-100 rounded-full px-2 py-1">
                          <Text className="text-xs font-medium text-neutral-600">
                            {password.category}
                          </Text>
                        </View>
                        {password.sharedWith.length > 0 && (
                          <View className="bg-emerald-100 rounded-full px-2 py-1 flex-row items-center">
                            <Ionicons name="people" size={10} color="#059669" />
                            <Text className="text-xs font-medium text-emerald-700 ml-1">
                              Shared
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Copy Button */}
                    <Pressable
                      onPress={() => handleCopyPassword(password)}
                      className="w-10 h-10 items-center justify-center ml-2"
                    >
                      <Ionicons
                        name={copiedId === password.id ? "checkmark-circle" : "copy-outline"}
                        size={24}
                        color={copiedId === password.id ? "#10B981" : "#4F46E5"}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
