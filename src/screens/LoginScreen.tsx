import React from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../state/authStore";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const signIn = useAuthStore((s) => s.signIn);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      // Navigation will be handled by App.tsx based on auth state
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-8 pb-12">
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="w-20 h-20 rounded-3xl bg-indigo-600 items-center justify-center mb-6">
                <Ionicons name="cube" size={40} color="white" />
              </View>
              <Text className="text-4xl font-bold text-neutral-900 mb-2">
                Welcome Back
              </Text>
              <Text className="text-lg text-neutral-500">
                Sign in to access your inventory
              </Text>
            </Animated.View>
          </View>

          {/* Form */}
          <View className="flex-1 px-6">
            <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Email</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
              <Text className="text-sm font-semibold text-neutral-700 mb-2">Password</Text>
              <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-8">
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                className="rounded-xl overflow-hidden"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Text className="text-white text-lg font-bold">
                    {loading ? "Signing in..." : "Sign In"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <View className="flex-row items-center justify-center">
                <Text className="text-neutral-500">{"Don't have an account? "}</Text>
                <Pressable onPress={() => navigation.navigate("Register")}>
                  <Text className="text-indigo-600 font-semibold">Sign Up</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>

          {/* Footer */}
          <View className="px-6 py-6">
            <Text className="text-center text-sm text-neutral-400">
              Secure cloud-synced inventory management
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
