# AI Inventory Tracker - iOS Setup Guide

This guide will help you run the AI Inventory Tracker app on iOS without Vibecode.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Bun** package manager
3. **Xcode** (for iOS development)
4. **Expo CLI** (will be installed via bun)
5. **Expo Go app** on your iOS device (for quick testing)

## Step 1: Install Dependencies

```bash
bun install
```

## Step 2: Configure Environment Variables

The app requires API keys for AI features. Edit the `.env` file in the root directory:

```bash
# Required for core AI features (invoice parsing, barcode scanning)
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key-here

# Optional: Required only if using Claude for PDF invoice parsing
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional: Only needed if using Grok AI features
EXPO_PUBLIC_GROK_API_KEY=your-grok-api-key-here

# Optional: Google API features
EXPO_PUBLIC_GOOGLE_API_KEY=your-google-api-key-here

# Optional: Voice features
EXPO_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

### Getting API Keys:

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Grok**: https://console.x.ai/

## Step 3: Configure Firebase Authentication

The app uses Firebase for user authentication. You need to set up a Firebase project:

### 3.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or use an existing project
3. Follow the setup wizard

### 3.2 Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click Save

### 3.3 Register iOS App

1. In Firebase Console, go to **Project Settings** → **Your apps**
2. Click the iOS icon to add an iOS app
3. Enter your iOS bundle ID: `com.yourcompany.aiinventory`
   - You can change this in `app.json` if needed
4. Download the `GoogleService-Info.plist` file
5. Place it in the root of your project

### 3.4 Get Firebase Config

1. In Firebase Console, go to **Project Settings** → **General**
2. Scroll down to "Your apps" and select your Web app (or create one)
3. Copy the Firebase configuration values
4. Add them to your `.env` file:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3.5 Enable Firestore (Optional - for cloud sync)

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location
5. Click Enable

**Note**: The app currently runs in local-only mode for maximum performance. To enable cloud sync, you'll need to uncomment the Firestore sync code in the store files.

## Step 4: Run the App

### Option A: Using Expo Go (Fastest)

1. Install Expo Go on your iOS device from the App Store
2. Start the development server:
   ```bash
   bun start
   ```
3. Scan the QR code with your iOS device Camera app
4. The app will open in Expo Go

### Option B: iOS Simulator

1. Open Xcode and install iOS Simulator if not already installed
2. Run:
   ```bash
   bun ios
   ```
3. This will build and launch the app in the iOS Simulator

### Option C: Development Build (For Native Features)

Some features may require a development build instead of Expo Go:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure EAS:
   ```bash
   eas build:configure
   ```

4. Build for iOS:
   ```bash
   eas build --platform ios --profile development
   ```

5. Install the build on your device when complete

## Step 5: Create Your First Account

1. Launch the app - you'll see the login screen
2. Tap "Sign Up" to create an account
3. Fill in:
   - Company Name (your business name)
   - Email (your email)
   - Password (secure password)
   - Display Name (your name)
4. Select your role (Owner, Admin, Manager, or Field Worker)
5. Tap "Create Account"
6. You'll be automatically logged in

## Features Overview

### Core Features (Work Offline)
- ✅ Inventory management
- ✅ Barcode scanning
- ✅ Time tracking
- ✅ Password vault
- ✅ Multi-user authentication
- ✅ Local data persistence

### AI-Powered Features (Require API Keys)
- 🤖 Invoice parsing (OpenAI + Anthropic)
- 🤖 Barcode product identification (OpenAI)
- 🤖 AI recategorization (OpenAI)
- 🤖 Proposal parsing (OpenAI + Anthropic)

## Troubleshooting

### "OpenAI API key not found"
- Check that your `.env` file has `EXPO_PUBLIC_OPENAI_API_KEY` set
- Restart the development server after changing `.env`

### "Login Failed" or Firebase errors
- Verify Firebase configuration in `.env`
- Check that Email/Password auth is enabled in Firebase Console
- Ensure your Firebase project has the iOS app registered

### Camera not working
- Grant camera permissions when prompted
- Check `app.json` has proper camera usage descriptions

### App won't build
- Clear cache: `bun start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`
- Check for TypeScript errors: `bun run typecheck`

## Customization

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Change Bundle Identifier
Edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    }
  }
}
```

**Important**: If you change the bundle ID, update it in Firebase Console too.

### Change Colors
Edit the color scheme in:
- `src/navigation/AppNavigator.tsx` - Tab bar colors
- Individual screen files - Gradient colors
- `tailwind.config.js` - Global color palette

## Production Deployment

When ready to deploy to the App Store:

1. Build production app:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```

3. Follow Apple's App Store guidelines for submission

## Support

For issues or questions:
- Check the main README.md for app features
- Review Firebase documentation: https://firebase.google.com/docs
- Review Expo documentation: https://docs.expo.dev/

## Security Notes

- Never commit your `.env` file to git (it's in `.gitignore`)
- Keep your API keys secure
- Use Firebase security rules to protect user data
- Consider enabling 2FA for admin users in production
