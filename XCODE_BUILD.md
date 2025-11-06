# Building with Xcode - Step by Step

## Prerequisites
- Mac with Xcode installed
- iPhone connected via USB
- Apple Developer account (free or paid)

## Step-by-Step Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/mearley24/ai-inventory-app.git
cd ai-inventory-app

# Install dependencies
npm install
# or if you prefer bun:
bun install
```

### 2. Generate Native iOS Project

```bash
# This creates the ios/ folder with native Xcode project
npx expo prebuild --platform ios
```

When prompted, press `Y` to continue.

### 3. Install CocoaPods Dependencies

```bash
# Navigate to ios folder
cd ios

# Install iOS native dependencies
pod install

# Go back to root
cd ..
```

### 4. Open Project in Xcode

```bash
# Open the workspace (NOT the .xcodeproj file)
open ios/aiinventorytracker.xcworkspace
```

### 5. Configure Signing in Xcode

1. In Xcode, select the **aiinventorytracker** project in the left sidebar
2. Select the **aiinventorytracker** target
3. Go to the **Signing & Capabilities** tab
4. **Check "Automatically manage signing"**
5. Select your **Team** (your Apple ID)
6. Xcode will automatically create a bundle identifier and provisioning profile

### 6. Connect Your iPhone

1. Connect your iPhone to your Mac via USB cable
2. Unlock your iPhone
3. If prompted on iPhone, tap **"Trust This Computer"**
4. In Xcode, at the top, next to the Play/Stop buttons, click the device dropdown
5. Select your iPhone from the list (it should show your device name)

### 7. Build and Run

1. Click the **Play button (▶️)** in Xcode's top toolbar
2. Xcode will:
   - Build the app
   - Install it on your iPhone
   - Launch it automatically

**First time only:** On your iPhone, you may see "Untrusted Developer". To fix:
- Go to **Settings → General → VPN & Device Management**
- Tap your Apple ID
- Tap **Trust "[Your Name]"**
- Go back to home screen and open the app

### 8. Test Offline Mode

Once the app is running on your iPhone:
1. Use the app normally (add some inventory items)
2. **Turn off WiFi and Cellular Data** on your iPhone
3. The app will continue to work fully offline!
4. All data is stored locally in AsyncStorage

## Troubleshooting

### "No provisioning profiles found"
- Make sure you're signed in to Xcode with your Apple ID
- Go to Xcode → Settings → Accounts → Add your Apple ID

### Build fails with CocoaPods errors
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### "Could not find iPhone"
- Make sure iPhone is unlocked
- Unplug and replug the USB cable
- Restart Xcode

### App crashes on launch
- Check Xcode console for error messages
- Make sure all dependencies installed correctly
- Try cleaning build: Product → Clean Build Folder (Shift + Cmd + K)

## Making Changes

After making code changes:
1. Xcode will automatically detect changes
2. Just press the Play button again to rebuild and run
3. For faster development, you can also run:
```bash
npm start
```
Then shake your device and tap "Reload" to see changes without rebuilding in Xcode.

## Building for Distribution (Optional)

To create an .ipa file for TestFlight or App Store:

1. In Xcode, select **Any iOS Device** as the build target
2. Go to **Product → Archive**
3. Once complete, click **Distribute App**
4. Follow the prompts to upload to App Store Connect or export for ad-hoc distribution

## Notes

- **Bundle Identifier:** Currently set to `com.yourcompany.aiinventory`
  - You can change this in app.json before running `expo prebuild`

- **App Name:** "AI Inventory Tracker"
  - Change in app.json if desired

- **Offline Features:**
  - ✅ All inventory management (add, edit, delete)
  - ✅ Barcode scanning
  - ✅ Time tracking
  - ✅ Password vault
  - ❌ AI invoice parsing (requires internet)
  - ❌ AI product identification from barcodes (requires internet)

- **Firebase:** Currently configured but can work fully offline without it
