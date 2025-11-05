# Download Instructions

## Option 1: Use Git Clone (Easiest if you have Git)

If this project is in a Git repository, you can clone it:

```bash
git clone [repository-url]
cd [project-folder]
bun install
```

## Option 2: Download as ZIP

If you're using a platform like GitHub, GitLab, or similar:

1. Look for a "Download" or "Clone" button
2. Click "Download ZIP"
3. Extract the ZIP file on your computer
4. Open Terminal/Command Prompt
5. Navigate to the folder:
   ```bash
   cd path/to/extracted/folder
   bun install
   ```

## Option 3: Download Archive from This Sandbox

I've created a compressed archive for you at:
```
/home/user/inventory-app.tar.gz (5.3MB)
```

To download this file from the remote sandbox:

### If you have SSH/SCP access:
```bash
scp user@remote-host:/home/user/inventory-app.tar.gz ~/Downloads/
```

### If you're using a cloud IDE or web-based environment:
- Look for a "Download" option in the file browser
- Navigate to `/home/user/inventory-app.tar.gz`
- Right-click and select "Download"

### After downloading:
```bash
# Extract the archive
tar -xzf inventory-app.tar.gz
cd workspace

# Install dependencies
bun install

# Start the app
bun start
```

## Option 4: Copy Files Manually (Last Resort)

If none of the above work, you can recreate the project structure:

1. Create a new folder on your computer
2. Copy all the files from this sandbox to your local machine
3. Make sure to include:
   - All `.ts` and `.tsx` files in `src/`
   - `package.json`
   - `app.json`
   - `.env` (with your API keys)
   - `tsconfig.json`
   - `tailwind.config.js`
   - `babel.config.js`
   - `metro.config.js`
   - `index.ts`
   - `App.tsx`
   - `global.css`
   - `nativewind-env.d.ts`
   - All files in `assets/` folder

## After Download - Next Steps

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Configure environment variables** (`.env` file):
   ```bash
   EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key
   EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. **Set up Firebase** (see QUICKSTART.md)

4. **Start the dev server**:
   ```bash
   bun start
   ```

5. **Scan QR code with Expo Go** on your iPhone!

## Need Help?

See QUICKSTART.md for detailed setup instructions.
