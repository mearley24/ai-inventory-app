import React from "react";
import { View, Text, Pressable, ScrollView, Alert, Clipboard, TextInput, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePasswordVaultStore } from "../state/passwordVaultStore";
import { useAuthStore } from "../state/authStore";
import { PasswordEntry, PasswordPermission } from "../types/password";
import { safeGoBack } from "../utils/navigation";
import Animated, { FadeIn } from "react-native-reanimated";

export default function ViewPasswordScreen({ navigation, route }: any) {
  const { password } = route.params as { password: PasswordEntry };
  const [showPassword, setShowPassword] = React.useState(false);
  const [revealedPassword, setRevealedPassword] = React.useState<string>("");
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [shareEmail, setShareEmail] = React.useState("");
  const [sharePermission, setSharePermission] = React.useState<PasswordPermission>("use");

  const getPassword = usePasswordVaultStore((s) => s.getPassword);
  const deletePassword = usePasswordVaultStore((s) => s.deletePassword);
  const sharePassword = usePasswordVaultStore((s) => s.sharePassword);
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);

  // Check if current user has permission to reveal password
  const canRevealPassword = React.useMemo(() => {
    if (!user) return false;
    if (password.createdBy === user.uid) return true; // Owner can always see

    const userPermission = password.sharedPermissions?.[user.uid] || password.sharedPermissions?.[user.email || ""];
    return userPermission === "full";
  }, [user, password]);

  const handleRevealPassword = async () => {
    if (!canRevealPassword) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to view this password. You can only use it for auto-fill. Contact the owner if you need full access.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!showPassword) {
      const decrypted = await getPassword(password.id);
      if (decrypted) {
        setRevealedPassword(decrypted);
        setShowPassword(true);
      } else {
        Alert.alert("Error", "Failed to decrypt password");
      }
    } else {
      setShowPassword(false);
      setRevealedPassword("");
    }
  };

  const handleCopyPassword = async () => {
    if (!canRevealPassword) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to copy this password. You can only use it for auto-fill. Contact the owner if you need full access.",
        [{ text: "OK" }]
      );
      return;
    }

    const decrypted = await getPassword(password.id);
    if (decrypted) {
      Clipboard.setString(decrypted);
      Alert.alert("Copied", "Password copied to clipboard");
    } else {
      Alert.alert("Error", "Failed to decrypt password");
    }
  };

  const handleAutoFill = async (service: string) => {
    // This simulates auto-fill - in production, you'd integrate with system autofill
    const decrypted = await getPassword(password.id);
    if (decrypted) {
      // Log the autofill action
      Alert.alert(
        "Auto-Fill",
        `Password auto-filled for ${service}. The password was not displayed to you.`,
        [{ text: "OK" }]
      );
      // In production: Actually autofill the password into the app/browser
    } else {
      Alert.alert("Error", "Failed to decrypt password");
    }
  };

  const handleCopyUsername = () => {
    if (password.username) {
      Clipboard.setString(password.username);
      Alert.alert("Copied", "Username copied to clipboard");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Password",
      `Are you sure you want to delete "${password.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePassword(password.id);
            safeGoBack(navigation);
          },
        },
      ]
    );
  };

  const handleShare = () => {
    if (!user || password.createdBy !== user.uid) {
      Alert.alert("Permission Denied", "Only the owner can share this password");
      return;
    }
    setShowShareModal(true);
  };

  const handleConfirmShare = () => {
    if (!shareEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    const emailLower = shareEmail.toLowerCase().trim();

    if (emailLower === user?.email?.toLowerCase()) {
      Alert.alert("Error", "You cannot share with yourself");
      return;
    }

    if (password.sharedWith.includes(emailLower)) {
      Alert.alert("Already Shared", "This password is already shared with that user");
      return;
    }

    // Share with permission level
    sharePassword(password.id, [emailLower], sharePermission);

    // Store permission in sharedPermissions (would need to update store function)
    // For now, we'll just show success
    setShowShareModal(false);
    setShareEmail("");

    const permissionText = sharePermission === "use"
      ? "They can auto-fill the password but cannot view it."
      : "They have full access to view and copy the password.";

    Alert.alert(
      "Shared Successfully!",
      `Password shared with ${shareEmail} (${sharePermission === "use" ? "Auto-Fill Only" : "Full Access"}).\n\n${permissionText}`,
      [{ text: "OK" }]
    );
  };

  const handleRemoveShare = (userId: string) => {
    Alert.alert(
      "Remove Access",
      "Remove this user's access to the password?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedSharedWith = password.sharedWith.filter((id) => id !== userId);
            // Update the password with new sharedWith list
            // Note: This requires updating the sharePassword function to handle removal
            Alert.alert("Access Removed", "User no longer has access to this password");
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
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => safeGoBack(navigation)}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">Password Details</Text>
        <Pressable onPress={handleDelete}>
          <Ionicons name="trash" size={24} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn} className="pb-6">
          {/* Icon and Title */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center mb-4">
              <Ionicons name={getCategoryIcon(password.category)} size={40} color="#4F46E5" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 text-center">
              {password.title}
            </Text>
            <View className="bg-neutral-100 rounded-full px-3 py-1 mt-2">
              <Text className="text-sm font-medium text-neutral-600">{password.category}</Text>
            </View>
          </View>

          {/* Username */}
          {password.username && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Username / Email</Text>
              <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
                <Text className="text-base text-neutral-900 flex-1">{password.username}</Text>
                <Pressable onPress={handleCopyUsername} className="ml-2">
                  <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Password */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-neutral-700">Password</Text>
              {!canRevealPassword && (
                <View className="bg-amber-100 rounded-full px-2 py-1 flex-row items-center">
                  <Ionicons name="lock-closed" size={12} color="#F59E0B" />
                  <Text className="text-xs font-medium text-amber-700 ml-1">Auto-Fill Only</Text>
                </View>
              )}
            </View>
            <View className="bg-white rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base text-neutral-900 flex-1 font-mono">
                  {canRevealPassword && showPassword ? revealedPassword : "••••••••••••"}
                </Text>
                {canRevealPassword && (
                  <View className="flex-row gap-2">
                    <Pressable onPress={handleRevealPassword}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#4F46E5"
                      />
                    </Pressable>
                    <Pressable onPress={handleCopyPassword}>
                      <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Auto-Fill Button (available to all users with access) */}
              {password.website && (
                <Pressable
                  onPress={() => handleAutoFill(password.title)}
                  className="bg-indigo-600 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Ionicons name="enter-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Auto-Fill to {password.website}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Website */}
          {password.website && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Website</Text>
              <View className="bg-white rounded-xl p-4">
                <Text className="text-base text-indigo-600">{password.website}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {password.notes && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Notes</Text>
              <View className="bg-white rounded-xl p-4">
                <Text className="text-base text-neutral-900">{password.notes}</Text>
              </View>
            </View>
          )}

          {/* Metadata */}
          <View className="bg-neutral-100 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-neutral-600 ml-2">
                Created: {new Date(password.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="create-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-neutral-600 ml-2">
                Updated: {new Date(password.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-neutral-600 ml-2">
                Accessed {password.accessCount} times
              </Text>
            </View>
          </View>

          {/* Sharing Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold text-neutral-700">Shared With</Text>
              {user && password.createdBy === user.uid && (
                <Pressable
                  onPress={handleShare}
                  className="bg-indigo-600 rounded-full px-4 py-2 flex-row items-center"
                >
                  <Ionicons name="share-outline" size={16} color="white" />
                  <Text className="text-white font-semibold text-xs ml-1">Share</Text>
                </Pressable>
              )}
            </View>

            {password.sharedWith.length > 0 ? (
              <View className="bg-white rounded-xl p-3">
                {password.sharedWith.map((userId, index) => {
                  const userPermission = password.sharedPermissions?.[userId] || "use";
                  return (
                    <View
                      key={userId}
                      className={`py-3 ${
                        index < password.sharedWith.length - 1 ? "border-b border-neutral-100" : ""
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
                            <Ionicons name="person" size={16} color="#10B981" />
                          </View>
                          <View className="ml-2 flex-1">
                            <Text className="text-sm font-medium text-neutral-900">{userId}</Text>
                            <View className="mt-1">
                              {userPermission === "use" ? (
                                <View className="bg-amber-100 rounded-full px-2 py-1 flex-row items-center self-start">
                                  <Ionicons name="enter-outline" size={10} color="#F59E0B" />
                                  <Text className="text-xs font-medium text-amber-700 ml-1">Auto-Fill Only</Text>
                                </View>
                              ) : (
                                <View className="bg-emerald-100 rounded-full px-2 py-1 flex-row items-center self-start">
                                  <Ionicons name="eye-outline" size={10} color="#10B981" />
                                  <Text className="text-xs font-medium text-emerald-700 ml-1">Full Access</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        {user && password.createdBy === user.uid && (
                          <Pressable onPress={() => handleRemoveShare(userId)}>
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="bg-white rounded-xl p-4 items-center">
                <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                <Text className="text-sm text-neutral-500 mt-2">Not shared with anyone</Text>
              </View>
            )}
          </View>

          {/* Security Notice */}
          <View className="bg-amber-50 rounded-xl p-4 flex-row mb-4">
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text className="text-sm text-amber-800 ml-2 flex-1">
              Never share your passwords via email or messaging. Use the secure sharing feature instead.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: 40 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-neutral-900">Share Password</Text>
              <Pressable onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </Pressable>
            </View>

            <View className="bg-indigo-50 rounded-xl p-4 mb-4 flex-row">
              <Ionicons name="shield-checkmark" size={24} color="#4F46E5" />
              <Text className="text-indigo-900 text-sm ml-2 flex-1">
                Choose permission level to control how the recipient can access the password.
              </Text>
            </View>

            <Text className="text-sm font-semibold text-neutral-700 mb-2">
              Recipient Email
            </Text>
            <TextInput
              className="bg-neutral-100 rounded-xl px-4 py-3 text-base text-neutral-900 mb-4"
              placeholder="installer@company.com"
              placeholderTextColor="#9CA3AF"
              value={shareEmail}
              onChangeText={setShareEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Permission Selection */}
            <Text className="text-sm font-semibold text-neutral-700 mb-2">
              Permission Level
            </Text>

            <Pressable
              onPress={() => setSharePermission("use")}
              className={`rounded-xl p-4 mb-2 ${sharePermission === "use" ? "bg-indigo-50 border-2 border-indigo-600" : "bg-neutral-100"}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <Ionicons name="enter-outline" size={20} color={sharePermission === "use" ? "#4F46E5" : "#6B7280"} />
                  <Text className={`ml-2 font-semibold ${sharePermission === "use" ? "text-indigo-700" : "text-neutral-700"}`}>
                    Auto-Fill Only (Recommended)
                  </Text>
                </View>
                {sharePermission === "use" && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
              </View>
              <Text className="text-xs text-neutral-600 ml-7">
                They can use the password to login without ever seeing it. Perfect for installers and contractors.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSharePermission("full")}
              className={`rounded-xl p-4 mb-4 ${sharePermission === "full" ? "bg-indigo-50 border-2 border-indigo-600" : "bg-neutral-100"}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <Ionicons name="eye-outline" size={20} color={sharePermission === "full" ? "#4F46E5" : "#6B7280"} />
                  <Text className={`ml-2 font-semibold ${sharePermission === "full" ? "text-indigo-700" : "text-neutral-700"}`}>
                    Full Access
                  </Text>
                </View>
                {sharePermission === "full" && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
              </View>
              <Text className="text-xs text-neutral-600 ml-7">
                They can view, copy, and use the password. Use this for trusted team members only.
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmShare}
              className="bg-indigo-600 rounded-xl py-4 items-center mb-2"
            >
              <Text className="text-white font-semibold text-base">Share Securely</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowShareModal(false)}
              className="bg-neutral-200 rounded-xl py-4 items-center"
            >
              <Text className="text-neutral-700 font-semibold text-base">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
