# AI Inventory Tracker

A beautiful, AI-powered inventory management app with barcode scanning, time tracking, **multi-user team collaboration**, and **secure password vault** built for SnapAV/Snap One professionals.

## Features

### 👥 **Multi-User Authentication & Collaboration**
- Secure login with email/password via Firebase
- Company-based account system
- User roles: Owner, Admin, Manager, Field Worker
- Team assignments for organizing field staff
- Cloud-synced inventory (ready for implementation)
- Persistent login across app restarts

### 🔐 **Secure Password Vault** ⭐ NEW!
- Encrypted password storage for client systems
- **Copy passwords without ever seeing them**
- Share credentials with team members securely
- Category-based organization (Network, Control4, Security Systems, etc.)
- Access logging and audit trails
- Perfect for field technicians accessing client systems
- See [PASSWORD_VAULT.md](./PASSWORD_VAULT.md) for details

### 🗂️ Inventory Management
- View all inventory items in a clean, card-based interface
- Search and filter items by name, description, and category
- **⭐ Star favorite/everyday items** for quick access and alerts
- **📊 In Stock vs All Items Tabs** - Separate views for items with stock vs. full inventory
- Add items manually or through barcode scanning
- Edit item details with intuitive +/- quantity controls
- Price tracking for each item
- Delete items with a simple tap
- **Low stock alerts** to keep track of inventory levels
- **Special alerts for starred items** - get notified when everyday items run low
- **SnapAV/Snap One category system** (Control4, Audio, Cables, Networking, Surveillance, etc.)
- **🎯 Subcategory Support** - Precise categorization (e.g., "Audio > Amplifiers", "Control4 > Controllers")
- **🤖 AI-Powered Recategorization** - Automatically match items to correct categories & subcategories
- **Bulk CSV/Excel import** for loading large price lists
- **📄 AI-Powered Invoice Upload** - Scan/upload invoices (images & PDFs) to auto-populate inventory
- **📁 Invoice Folder System** ⭐ NEW! - Drop invoices in a folder for automatic batch processing
- **🔄 Duplicate Finder** - Automatically merge duplicate items and reset quantities
- Smart category matching during import

### 📷 Barcode Scanner
- Fast, reliable barcode scanning using the device camera
- Supports multiple barcode formats: QR codes, UPC, EAN, Code 39, Code 128, PDF417
- AI-powered product identification from barcodes using GPT-4
- Automatically suggests product names and categories
- Instantly adds scanned items to inventory
- Beautiful scanning interface with visual frame guidance

### ⏱️ Time Tracker
- Create and manage multiple projects
- Start/stop timers with a single tap
- Real-time timer display with precise second tracking
- Automatic time logging per project
- Color-coded projects for easy identification
- Total time tracking across all sessions
- Clean, minimalist interface with large, readable time displays

### 🤖 AI Features
- Smart product identification from barcodes
- **AI-powered invoice parsing** using GPT-4o Vision
- Extract line items automatically from invoice photos
- **AI-powered recategorization** - Automatically update all items to match supplier website categories
- Automatic category and subcategory suggestions
- Context-aware item naming

## Design

The app features a professional, modern design inspired by Apple's Human Interface Guidelines:

**Color Palette:**
- Primary: Indigo-600 (#4F46E5) to Purple-600 gradient
- Background: Soft neutral gray (#FAFAFA)
- Accent colors for status indicators (emerald for success, amber for warnings)
- Card-based UI with subtle shadows

**Animations:**
- Smooth fade-in animations for list items
- Scale animations for button interactions
- Slide transitions for modals
- Real-time pulse effects for active timers

**Typography:**
- Large, bold headers for hierarchy
- Clean, readable body text
- Monospace numbers for time displays

## Tech Stack

- **Framework:** React Native 0.76.7 with Expo SDK 53
- **Navigation:** React Navigation with bottom tabs and native stack
- **State Management:** Zustand with AsyncStorage persistence
- **Authentication:** Firebase Auth with email/password
- **Database:** Firestore (cloud-synced, ready for implementation)
- **Styling:** NativeWind (TailwindCSS for React Native)
- **Animations:** React Native Reanimated v3
- **AI:** OpenAI GPT-4o for invoice parsing, GPT-4o-mini for product identification
- **Camera:** Expo Camera for barcode scanning
- **Image Picker:** Expo Image Picker for invoice photos
- **Excel/CSV:** XLSX library for file imports
- **Icons:** Expo Vector Icons (Ionicons)

## Project Structure

```
src/
├── components/         # Reusable components (future)
├── screens/           # All app screens
│   ├── LoginScreen.tsx          # User login
│   ├── RegisterScreen.tsx       # Company + user registration
│   ├── InventoryScreen.tsx      # Main inventory list
│   ├── ScannerScreen.tsx        # Barcode scanner
│   ├── TimeTrackerScreen.tsx    # Time tracking
│   ├── PasswordVaultScreen.tsx  # Password management
│   ├── AddItemScreen.tsx        # Add new items
│   ├── EditItemScreen.tsx       # Edit existing items
│   ├── ImportScreen.tsx         # CSV/Excel import
│   ├── InvoiceUploadScreen.tsx  # AI invoice parsing
│   ├── InvoiceFolderScreen.tsx  # Invoice folder management
│   ├── RecategorizeScreen.tsx   # AI recategorization
│   ├── DuplicateFinderScreen.tsx # Duplicate item finder
│   └── AddPasswordScreen.tsx    # Add new passwords
├── navigation/        # Navigation configuration
│   └── AppNavigator.tsx         # Tab, stack, and auth navigators
├── state/            # Zustand stores
│   ├── authStore.ts             # Authentication state
│   ├── inventoryStore.ts        # Inventory state
│   ├── passwordVaultStore.ts    # Password vault state
│   └── timeTrackerStore.ts      # Time tracking state
├── types/            # TypeScript types
│   ├── auth.ts                  # User, Company, Team types
│   ├── inventory.ts             # Inventory & invoice data models
│   └── password.ts              # Password vault types
├── api/              # API integrations
│   ├── invoice-parser.ts        # GPT-4o Vision + Claude PDF parsing
│   ├── openai.ts                # OpenAI client
│   ├── anthropic.ts             # Anthropic client
│   └── chat-service.ts          # LLM text generation
├── services/         # Background services
│   ├── invoiceScanner.ts        # Invoice folder scanning logic
│   ├── invoiceScannerTask.ts    # Background task for hourly scans
│   ├── recategorizer.ts         # AI recategorization with subcategories
│   └── recategorizationTask.ts  # Background job system for recategorization
├── config/           # Configuration
│   └── firebase.ts              # Firebase initialization
└── utils/            # Utility functions
    ├── categories.ts            # SnapAV category matching
    ├── encryption.ts            # Password encryption/decryption
    └── navigation.ts            # Safe navigation helpers
```

## Key Features Explained

### Inventory Items
Each inventory item includes:
- Unique ID
- Name
- Barcode (optional, from scanning)
- Quantity
- **Price** (optional, for tracking costs/selling prices)
- Category
- **Subcategory** (optional, for precise classification)
- Description (optional)
- Low stock threshold (optional)
- **Starred/Favorite flag** (for everyday items)
- Creation and update timestamps

## AI-Powered Invoice Upload & Folder System ⭐ NEW!

Automatically populate inventory from invoice photos and PDFs with two convenient methods:

### Method 1: Individual Invoice Upload

**How it Works:**
1. Tap the "Invoice" button in the Inventory screen
2. Choose:
   - Take a photo with camera
   - Select from photo library
   - Upload a PDF or image file
3. AI parses the invoice and extracts all line items with:
   - Product descriptions
   - Quantities
   - Unit prices
   - Total prices
   - SKU/barcode numbers
4. Review extracted items (all selected by default)
5. Tap items to deselect any you don't want to import
6. Tap "Add to Inventory" to import selected items

**Supported Formats:**
- Images: PNG, JPEG, GIF, WEBP (via OpenAI GPT-4o Vision)
- PDFs: Native support (via Claude Sonnet 4 API)

### Method 2: Invoice Folder System (Batch Processing) ⭐ NEW!

**Automatic Scanning:**
- Drop invoices into a dedicated folder
- System automatically scans every hour
- All new invoices are parsed and added to inventory
- No manual intervention required

**Manual Scanning:**
1. Tap the "Folder" button in the Inventory screen
2. View all invoices in the folder
3. Tap "Scan Now" to immediately process all new invoices
4. See real-time progress and results

**Features:**
- **Auto-Scan Toggle** - Enable/disable hourly background scanning
- **Processing History** - Tracks which files have been processed
- **Batch Processing** - Handles multiple invoices at once
- **File Management** - View, delete, and manage invoice files
- **Statistics** - Track total files, processed count, and pending items
- **Clear History** - Reset processing to re-scan files if needed

**Folder Location:**
The invoice folder is created automatically at app startup. Access it via the folder icon in the Invoice Folder screen to see the exact path.

**Best Practices:**
- Take clear, well-lit photos of invoices
- Ensure all text is readable
- Works best with standard invoice formats
- Supports SnapAV and major distributor invoices
- PDF support for digital invoices

## AI-Powered Recategorization ⭐ NEW!

Automatically update all inventory items to match precise categories and subcategories from any supplier website. **Runs in the background** - you can continue using the app!

**How it Works:**
1. Navigate to Inventory screen → Tap the "⚙️" menu → Select "Recategorize"
2. Enter the supplier website URL (e.g., snapav.com, adorama.com, bhphotovideo.com)
3. Tap "Auto-Recategorize All"
4. Process starts in the background:
   - Extract category structure from the website (or use predefined categories)
   - Analyze all inventory items by name and description
   - Automatically assign correct category AND subcategory to each item
   - Apply all changes immediately
5. Continue using the app - you'll get a notification when complete!

**Supported Suppliers:**
- **SnapAV/Snap One** - 18 main categories with 5-7 subcategories each:
  - Control4 (Controllers, Keypads, Interfaces, Dimmers & Switches, etc.)
  - Audio (Amplifiers, Receivers, Speakers, Subwoofers, etc.)
  - Networking (Switches, Routers, Access Points, etc.)
  - Surveillance (IP Cameras, NVRs, DVRs, etc.)
  - And 14 more categories...
- **Generic Categories** - For any other supplier

**Features:**
- **Background Processing** - Navigate away and keep using the app while AI works
- **Fully Automatic** - No manual review needed, changes apply immediately
- **Subcategory Support** - Items get both main category and precise subcategory
- **Batch Processing** - Handles large inventories efficiently (20 items at a time)
- **Real-time Progress** - See status updates as AI processes your items
- **Smart Matching** - Uses GPT-4o-mini to analyze product names and descriptions
- **Job Persistence** - If you close the app, the job continues where it left off

**Best Use Cases:**
- Just imported a large invoice or CSV and need to organize everything
- Switching from one supplier's category system to another
- Initial setup of inventory with proper categorization
- Maintaining consistency across your entire inventory

## CSV/Excel Import

The app includes a powerful import feature to load large price lists quickly:

**How to Import:**
1. Tap the "Import" button in the Inventory screen header
2. Prepare a CSV file with columns like: Name, Price, Quantity, Category, Description, Barcode
3. Select your CSV file using the file picker
4. Items are automatically parsed and added to your inventory

**Supported Column Names:**
- Name, Item, Product (for item name)
- Price, Cost (for pricing)
- Quantity, Qty, Stock (for quantity)
- Category, Type (for categorization)
- Description, Desc (for notes)
- Barcode, SKU, UPC (for barcodes)

The import parser is flexible and will recognize common variations of these column names.

## Starred Items & Low Stock Alerts ⭐ NEW!

**Mark Everyday Items as Favorites:**
- Star frequently used items like cables, connectors, and common components
- Quick filter to view only starred items
- Visual star indicator on inventory cards

**Smart Low Stock Alerts:**
- Set custom low stock thresholds for any item
- **Automatic alerts for starred items** when they run low
- Alert badge shows count of starred items needing restock
- Get notified when opening the app if favorites are low
- Perfect for tracking everyday items that need consistent restocking

**How to Use:**
1. Edit any item and toggle "Mark as Favorite"
2. Set a low stock threshold (e.g., alert when below 10)
3. App automatically alerts you when starred items hit threshold
4. Use the star filter to quickly check your everyday items
5. Star icon appears on item cards for quick identification

This feature is essential for field techs who need to maintain stock of common items like:
- Wire and connectors
- Mounting hardware
- Common cables
- Frequently replaced components

### Projects & Time Tracking
Each project tracks:
- Name and description
- Color coding for visual identification
- Total accumulated time
- Individual time entries with start/end timestamps

### AI Product Identification
When scanning a barcode:
1. Camera detects and reads the barcode
2. System checks if item already exists
3. If new, AI analyzes the barcode number
4. Suggests product name and category
5. Pre-fills the add item form
6. User can accept or modify suggestions

## State Persistence

The app uses Zustand with AsyncStorage to persist:
- All inventory items
- All projects and time entries
- Active timer state (survives app restart)

## Future Enhancements

### Ready to Implement (Once Firebase is Configured):
- **Real-time Cloud Sync**: Inventory syncs across all team members in real-time
- **Team Management**: Create teams, invite users, assign roles
- **User Management**: Admin dashboard to manage company users
- **Offline Mode**: Work offline, sync when back online
- **Activity Logs**: Track who added/modified inventory items

### Planned Features:
- Export inventory to CSV/PDF
- Inventory analytics and charts
- Photo capture for items
- Bulk barcode scanning mode
- Time tracking reports and exports
- Project analytics and insights
- Advanced role-based permissions
- Job assignment and tracking
- Push notifications for low stock
- Barcode label printing

## Notes

- The app is optimized for iOS
- Requires camera permissions for barcode scanning
- AI features require an OpenAI API key (pre-configured in Vibecode environment)
- **Authentication requires Firebase setup** - see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for instructions
- All data is stored locally until Firebase is configured for cloud sync
- Built specifically for SnapAV/Snap One product categories
