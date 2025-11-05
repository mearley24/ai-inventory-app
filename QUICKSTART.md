# Quick Start Guide

Get the AI Inventory Tracker running on iOS in 5 minutes!

## TL;DR

```bash
# 1. Install dependencies
bun install

# 2. Add your OpenAI API key to .env
echo "EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here" >> .env

# 3. Set up Firebase (see below)

# 4. Start the app
bun start
# Scan QR code with Expo Go app on your iOS device
```

## Minimum Setup

### 1. Install Dependencies
```bash
bun install
```

### 2. Get OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create new key
- Copy it

### 3. Configure .env
Edit `.env` file:
```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here
```

### 4. Firebase Setup (5 minutes)

#### A. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it (e.g., "inventory-app")
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### B. Enable Authentication
1. Click "Authentication" in sidebar
2. Click "Get Started"
3. Click "Email/Password"
4. Toggle "Email/Password" to **Enabled**
5. Click "Save"

#### C. Get Firebase Config
1. Click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app (name: "inventory-tracker")
5. Copy the config values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456",
  appId: "1:123456:web:abc123"
};
```

6. Add them to `.env`:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

### 5. Run the App

#### Option 1: iOS Device with Expo Go (Easiest)
```bash
bun start
```
- Install "Expo Go" from App Store
- Scan QR code with Camera app
- App opens in Expo Go

#### Option 2: iOS Simulator
```bash
bun ios
```
- Requires Xcode installed
- Opens in iOS Simulator

### 6. Create Account
1. Open app
2. Tap "Sign Up"
3. Enter:
   - Company: "Your Business"
   - Email: your@email.com
   - Password: (make it secure)
   - Name: Your Name
4. Select role: "Owner"
5. Tap "Create Account"

## What Works Without API Keys?

- ✅ Login/Register
- ✅ Manual inventory management
- ✅ Time tracking
- ✅ Password vault
- ✅ CSV/Excel imports
- ✅ Manual barcode entry

## What Needs API Keys?

- 🤖 AI invoice parsing → Needs OpenAI
- 🤖 AI barcode identification → Needs OpenAI
- 🤖 Auto-recategorization → Needs OpenAI
- 🤖 PDF parsing → Needs Anthropic (optional)

## Common Issues

**"OpenAI API key not found"**
- Check `.env` has `EXPO_PUBLIC_OPENAI_API_KEY=...`
- Restart dev server: `Ctrl+C` then `bun start`

**"Login Failed"**
- Check Firebase config in `.env`
- Verify Email/Password is enabled in Firebase Console

**Can't scan QR code**
- Use Camera app (not Photos)
- Make sure phone is on same WiFi as computer

## Next Steps

See [SETUP.md](./SETUP.md) for:
- Development builds
- Production deployment
- Customization options
- Feature details

## Need Help?

Check the full [README.md](./README.md) for:
- Complete feature list
- App usage instructions
- Architecture details
