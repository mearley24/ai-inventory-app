# Local Development Setup

## Running the App Locally (For Offline Testing)

### Prerequisites
- Node.js 18+ or Bun
- iOS device with Expo Go app installed
- Git

### Steps

1. **Clone the repository:**
```bash
git clone https://github.com/mearley24/ai-inventory-app.git
cd ai-inventory-app
```

2. **Install dependencies:**
```bash
npm install
# or if you have bun installed:
bun install
```

3. **Create a .env file** (optional, for API features):
```bash
# Copy these into a .env file in the root directory
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key_here
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_key_here
# ... other API keys as needed
```

4. **Start the development server:**
```bash
npm start
# or
expo start
```

5. **Connect your iPhone:**
   - Open Expo Go app on your iPhone
   - Scan the QR code displayed in your terminal
   - The app will load on your device

6. **Test offline mode:**
   - Once the app is loaded, turn off WiFi/cellular data on your phone
   - The app will continue to work offline since all data is stored locally in AsyncStorage

## Building a Standalone App (No Expo Go Required)

If you want a completely standalone app that doesn't require Expo Go:

### Using EAS Build (Cloud Build - No Mac Required)

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Build for iOS:**
```bash
eas build --platform ios --profile development
```

4. **Install on device:**
   - EAS will provide a download link
   - Open the link on your iPhone
   - Install the app directly (requires device to be registered)

### Local Build (Requires Mac with Xcode)

1. **Install CocoaPods:**
```bash
sudo gem install cocoapods
```

2. **Generate native iOS project:**
```bash
npx expo prebuild --platform ios
```

3. **Install iOS dependencies:**
```bash
cd ios && pod install && cd ..
```

4. **Open in Xcode:**
```bash
open ios/aiinventorytracker.xcworkspace
```

5. **Build and run:**
   - Connect your iPhone via USB
   - Select your device in Xcode
   - Click the "Play" button to build and install

## Offline Capabilities

The app is designed to work fully offline:
- All inventory data stored in AsyncStorage (local device storage)
- Firebase sync can be disabled
- Barcode scanning works without internet
- Time tracking works offline

**Note:** AI features (invoice parsing, product identification) require internet connection as they call external APIs.
