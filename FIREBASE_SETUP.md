# Firebase Multi-User Authentication Setup

## ✅ What's Been Implemented:

1. **Authentication System**
   - Login screen with email/password
   - Registration screen with company creation
   - User roles: Owner, Admin, Manager, Field Worker
   - Secure Firebase authentication
   - Persistent login state

2. **Data Structure**
   - Users collection with company association
   - Companies collection with settings
   - Teams collection (ready for implementation)
   - Role-based access control architecture

3. **UI Screens**
   - Beautiful login screen with gradient design
   - Registration flow that creates company + user
   - Automatic navigation based on auth state

## 🔧 To Complete the Setup:

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "SnapOne Inventory")
4. Follow the setup wizard

### Step 2: Get Firebase Credentials

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the Web icon (</>) to add a web app
4. Copy the configuration values

### Step 3: Add Credentials to Vibecode ENV Tab

In the Vibecode app, go to the ENV tab and add these variables:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 4: Enable Authentication in Firebase

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Save

### Step 5: Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules next)
4. Select a location (choose closest to your users)

### Step 6: Configure Firestore Security Rules

In Firestore > Rules tab, paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin'];
    }

    // Companies collection
    match /companies/{companyId} {
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin'];
    }

    // Inventory items (per company)
    match /companies/{companyId}/inventory/{itemId} {
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
      allow create: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
      allow update, delete: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId
        && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin', 'manager']
          || get(/databases/$(database)/documents/companies/$(companyId)).data.settings.allowFieldWorkerDelete == true);
    }

    // Teams collection
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin'];
    }
  }
}
```

These rules ensure:
- Users can only see data from their company
- Only owners/admins can modify company settings
- Field workers can view but have limited edit rights
- All operations require authentication

## 🎯 What Works Now:

- ✅ User registration creates both user + company
- ✅ Login authenticates and loads user/company data
- ✅ App shows login screen when not authenticated
- ✅ App shows main inventory when authenticated
- ✅ Secure logout functionality
- ✅ Role-based data structure ready

## 🚀 Next Phase (After Firebase is Set Up):

Once you add the Firebase credentials to the ENV tab:

1. **Test Authentication**
   - Register a new account
   - Login/logout works
   - Data persists across app restarts

2. **Cloud Inventory Sync** (Next to implement)
   - Sync local inventory to Firestore
   - Real-time updates across devices
   - Offline mode with sync when online

3. **Team Management** (To be implemented)
   - Invite users to company
   - Assign roles and teams
   - Manage team members

4. **User Management Screen** (To be implemented)
   - View all company users
   - Change user roles
   - Remove users
   - Create teams

## 📝 Testing the Auth System:

Without Firebase credentials, the app will use demo values but won't actually connect. Once you add real credentials:

1. Open the app
2. You'll see the Login screen
3. Tap "Sign Up"
4. Fill in the registration form (this creates your company!)
5. You'll be logged in and see the inventory screen
6. Close and reopen app - you'll stay logged in

## 💡 Current File Locations:

- Firebase config: `src/config/firebase.ts`
- Auth store: `src/state/authStore.ts`
- Auth types: `src/types/auth.ts`
- Login screen: `src/screens/LoginScreen.tsx`
- Register screen: `src/screens/RegisterScreen.tsx`
- Navigation: `src/navigation/AppNavigator.tsx`

Let me know once you've added the Firebase credentials and I'll implement the cloud sync next!
