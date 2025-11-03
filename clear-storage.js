// This script should be run from within the app's context
// Add this temporarily to App.tsx to clear everything

const clearAllStorage = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  try {
    await AsyncStorage.clear();
    console.log('✅ All AsyncStorage cleared!');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// Call this on app start
clearAllStorage();
