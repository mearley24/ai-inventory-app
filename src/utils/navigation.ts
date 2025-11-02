/**
 * Safe navigation helper to handle going back or to main screen
 * Use this instead of navigation.goBack() to avoid navigation errors
 */
export const safeGoBack = (navigation: any) => {
  try {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If can't go back, navigate to Main screen
      navigation.navigate('Main');
    }
  } catch (error) {
    // Last resort - try to navigate to Main
    try {
      navigation.navigate('Main');
    } catch (e) {
      console.error('Navigation error:', e);
    }
  }
};
