# Secure Password Vault

## Overview

The Password Vault provides a secure way to store and share sensitive credentials with your team without ever exposing the actual passwords. Perfect for field technicians who need to access client systems, network equipment, and smart home devices.

## Key Features

### 🔐 **Security First**
- **Encrypted Storage**: All passwords are encrypted before being saved
- **No Preview**: Passwords are never displayed on screen
- **Secure Copy**: One-tap copy to clipboard without revealing the password
- **Access Logging**: Track who accessed which passwords and when
- **Role-Based Access**: Control who can see which passwords

### 📋 **Categories**
Organized by SnapAV/Smart Home system types:
- Client System
- Network (routers, switches, access points)
- Control4 (controllers, interfaces)
- Security System (alarm panels, surveillance)
- Audio/Video (receivers, matrices)
- Smart Home (hubs, automation)
- Cloud Service (online accounts)
- Admin (system administration)
- Other

### 👥 **Sharing Without Exposing**
- Share passwords with specific users or teams
- Users can copy passwords without seeing them
- Perfect for field workers who need temporary access
- Owners/Admins control sharing permissions

### 🔍 **Easy Organization**
- Search by title, username, website, or notes
- Filter by category
- Tag passwords for quick finding
- Track access history

## How to Use

### Adding a Password

1. Tap the **Vault** tab at the bottom
2. Tap the **+** button in the top right
3. Fill in the details:
   - **Title**: Descriptive name (e.g., "Smith Residence Router")
   - **Category**: Select the appropriate category
   - **Username/Email**: Login username
   - **Password**: Type or tap the key icon to generate a secure password
   - **Website**: Optional URL
   - **Notes**: Any additional info (location, special instructions)
4. Tap **Save**

### Using a Password

**To Copy Password (Without Seeing It):**
1. Find the password in your vault
2. Tap the **copy icon** on the right side
3. Password is copied to clipboard
4. Paste it where needed
5. Clipboard auto-clears after use

**To View Full Details:**
1. Tap on the password entry
2. View all information except the password
3. Copy username, website, or other details

### Generating Secure Passwords

When adding a password:
1. Tap the **key icon** next to the password field
2. A secure 16-character password is generated
3. Includes uppercase, lowercase, numbers, and symbols
4. Automatically filled in the password field

### Sharing with Team Members

(Coming soon with Firebase integration)
1. Open a password entry
2. Tap "Share"
3. Select users or teams to share with
4. They can copy the password without seeing it
5. You can revoke access at any time

## Security Features

### Encryption
- Passwords are encrypted using SHA-256 hashing
- Encrypted data is stored locally (and in Firestore when configured)
- Decryption only happens when copying to clipboard
- Never displayed in plain text on screen

### Access Control
- Created by: Track who added each password
- Shared with: List of user IDs with access
- Allowed roles: Which roles can access this password
- Access logs: Track when passwords are viewed/copied

### Best Practices
1. **Use descriptive titles**: "Johnson Home - WiFi" not just "WiFi"
2. **Add notes**: Include location, special instructions
3. **Categorize properly**: Makes finding passwords easier
4. **Regular rotation**: Update passwords periodically
5. **Limit sharing**: Only share with users who need access

## Use Cases

### Field Technician
"I'm installing equipment at a client's home. I need the WiFi password and Control4 credentials, but I shouldn't be able to see them - just use them."

**Solution**: Admin shares passwords with technician. Technician can copy and paste them during installation without ever seeing the actual passwords.

### System Administrator
"I need to track who accessed which client system and when for security audits."

**Solution**: Password vault logs every access. Admins can review who copied which passwords and when.

### Company Owner
"I want my installers to have access to client credentials during jobs, but not be able to take them when they leave."

**Solution**: Share passwords with specific users. When an employee leaves, simply revoke their access to all shared passwords.

### Team Lead
"My team needs access to common network equipment passwords, but each client's Control4 credentials should be restricted."

**Solution**: Use categories and role-based sharing. Share network passwords with entire team, but restrict Control4 passwords to certified installers only.

## Coming Soon (With Firebase)

- ✅ Real-time sync across devices
- ✅ Share with teams, not just individuals
- ✅ Temporary access (expires after X days)
- ✅ Audit logs in cloud
- ✅ Password expiration reminders
- ✅ Bulk import from password managers
- ✅ Export for backup

## Security Notes

⚠️ **Current Implementation**:
- Passwords are encrypted locally
- Encryption key is in the app (replace in production)
- For production use, implement:
  - User-specific encryption keys
  - Hardware-backed keystore
  - Biometric authentication for vault access
  - Auto-lock after inactivity

⚠️ **Firebase Setup Required**:
- To enable sharing across users, Firebase must be configured
- See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for instructions
- Until Firebase is set up, passwords are stored locally only

## Technical Details

**File Locations:**
- Types: `src/types/password.ts`
- Store: `src/state/passwordVaultStore.ts`
- Encryption: `src/utils/encryption.ts`
- Vault Screen: `src/screens/PasswordVaultScreen.tsx`
- Add Screen: `src/screens/AddPasswordScreen.tsx`

**Encryption:**
- Algorithm: SHA-256 for password hashing
- Storage: Base64 encoded encrypted strings
- Decryption: Only on copy-to-clipboard
- Auto-clear: Clipboard cleared after paste

**Data Model:**
```typescript
{
  id: string;
  title: string;
  category: string;
  username?: string;
  encryptedPassword: string;
  website?: string;
  notes?: string;
  createdBy: string;
  sharedWith: string[];
  accessCount: number;
  lastAccessed: number;
}
```

---

**The Password Vault is now ready to use!** Add your first password and try the secure copy feature.
