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
- **📍 Location Tracking** - Track exact storage location for each item (Shelf A-3, Bin 12, Truck, etc.)
- **🗺️ Location Filtering** - Filter inventory by storage location for easy procurement
- Add items manually or through barcode scanning
- Edit item details with intuitive +/- quantity controls
- Price tracking for each item
- Delete items with a simple tap
- **Low stock alerts** to keep track of inventory levels
- **Special alerts for starred items** - get notified when everyday items run low
- **SnapAV/Snap One category system** (Control4, Audio, Cables, Networking, Surveillance, etc.)
- **🎯 Subcategory Support** - Precise categorization (e.g., "Audio > Amplifiers", "Control4 > Controllers")
- **🤖 AI-Powered Recategorization** - Automatically match items to correct categories & subcategories
- **🔧 D-Tools Integration** - Import BOMs directly from D-Tools SI exports
- **Bulk CSV/Excel import** with auto-merge and quantity reset option
- **📄 AI-Powered Invoice Upload** - Auto-merges duplicates and adds quantities
- **📁 Invoice Folder System** ⭐ NEW! - Drop invoices in a folder for automatic batch processing
- **🔄 Auto-Merge System** - Duplicates are automatically handled on all imports
- Smart category matching during import

### 📷 Barcode Scanner
- Fast, reliable barcode scanning using the device camera
- Supports multiple barcode formats: QR codes, UPC, EAN, Code 39, Code 128, PDF417
- AI-powered product identification from barcodes using GPT-4
- **🧠 Smart Barcode Learning** - Automatically links barcodes to existing items
- Automatically suggests product names and categories
- Instantly adds scanned items to inventory
- Beautiful scanning interface with visual frame guidance

**Barcode Learning System:**
- Scan a barcode → System checks if it matches any existing item (by name, description, or SKU)
- If matches found → Choose which item to link the barcode to
- Next scan → Goes directly to that item!
- Import barcodes from D-Tools (Model/Part Number) or CSV files (Barcode/SKU/UPC columns)
- Manual barcode entry in item edit screen

### ⏱️ Time Tracker
- Create and manage multiple projects
- Start/stop timers with a single tap
- Real-time timer display with precise second tracking
- Automatic time logging per project
- Color-coded projects for easy identification
- Total time tracking across all sessions
- Clean, minimalist interface with large, readable time displays
- **🔗 Assign inventory items to projects** - Track which products are used for each job
- View assigned item counts on each project card

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

## Performance Optimizations ⚡ UPDATED!

The app has been optimized for maximum speed and responsiveness:

**Ultra-Fast List Design:**
- **Compact list layout** - Simple borders instead of cards with shadows
- **No animations** - Instant rendering without fade/scale effects
- **Smaller item height** - 64px per item (down from 96px) = more items visible
- **Efficient layout** - Border separators instead of cards with margins
- **Text truncation** - `numberOfLines={1}` prevents layout thrashing

**FlatList Performance:**
- **Optimized virtualization** - Renders 20 items at a time (up from 10)
- `removeClippedSubviews={true}` - Unmounts off-screen components
- `getItemLayout` - Pre-calculated heights for instant scrolling
- `maxToRenderPerBatch={20}` - Larger batches for smoother scrolling
- `windowSize={10}` - Keeps more items in memory
- `updateCellsBatchingPeriod={50}` - Fast update throttling

**State Management:**
- **Individual Zustand selectors** - Prevents re-render cascades
- **Memoized computations** - Expensive filters/sorts only run when data changes
- **Optimized dependencies** - Reduced unnecessary useEffect triggers
- **No expensive lookups** - Removed project lookups from render loop

**Visual Optimizations:**
- Removed rounded corners and shadows (expensive to render)
- Inline icons instead of background circles
- Simple border-based separators
- Reduced padding and margins

**Import Optimizations:**
- **Removed auto-merge on startup** - No longer runs duplicate cleanup on app launch (was causing slowdown)
- **Removed cleanup after imports** - No duplicate scanning after CSV/invoice imports
- **Manual cleanup available** - Red trash button in top-right to clear all inventory
- **Faster imports** - CSV, D-Tools, and invoice imports complete instantly without post-processing
- **Offline support** - Full offline functionality with local storage persistence

These optimizations make scrolling through 1000+ items buttery smooth and imports nearly instant.

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
│   ├── DToolsImportScreen.tsx   # D-Tools BOM import
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
│   ├── recategorizationTask.ts  # Background job system for recategorization
│   └── dtoolsParser.ts          # D-Tools BOM parser
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
- **Location** (optional, physical storage location like "Shelf A-3", "Bin 12", "Truck")
- Low stock threshold (optional)
- **Starred/Favorite flag** (for everyday items)
- **Supplier** (optional, tracks which supplier/source the item is from)
- **Assigned Project** (optional, links item to a specific project/job)
- Creation and update timestamps

## AI-Powered Invoice Upload & Folder System ⭐ NEW!

Automatically populate inventory from invoice photos and PDFs with automatic duplicate merging:

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
6. Tap "Add to Inventory" - duplicates are automatically merged!

**Auto-Merge Behavior:**
- **Adds Quantities**: For existing items, quantities are added together
- **Updates Info**: Price and barcode are updated if provided
- **New Items**: Items that don't exist are added automatically
- **No Manual Review**: Everything happens in the background

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

The app includes a powerful import feature with automatic duplicate handling:

**How to Import:**
1. Tap the "CSV" button in the Inventory screen
2. Prepare a CSV file with columns like: Name, Price, Quantity, Category, Description, Barcode
3. Choose whether to reset quantities to 0 (recommended for price lists)
4. Select your CSV file using the file picker
5. Items are automatically merged with existing inventory

**Auto-Merge Behavior:**
- **Duplicate Detection**: Items with the same name are automatically detected
- **Smart Merging**: Existing items are updated with new data (price, barcode, category)
- **Quantity Handling**:
  - Check "Reset all quantities to 0" for price lists (default)
  - Uncheck to preserve quantities from the CSV file
- **New Items**: Items that don't exist are added automatically
- **No Manual Review**: Everything happens in the background instantly

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

## Project-Based Inventory Tracking ⭐ NEW!

Assign inventory items to specific projects to track which products are allocated for each job.

**How it Works:**
1. Edit any inventory item
2. Scroll to "Assign to Project" section
3. Select a project from your Time Tracker projects
4. Save the item

**Benefits:**
- **Job Costing** - Know exactly which items were used for each project
- **Inventory Allocation** - See which items are assigned vs available
- **Project Overview** - View item count directly on project cards in Time Tracker
- **Visual Indicators** - Assigned items show a colored project badge in inventory list
- **Easy Management** - Reassign or unassign items anytime

**Visual Features:**
- Project badges appear on inventory item cards with project color and name
- Time Tracker shows "X items assigned" under each project
- Items can only be assigned to one project at a time
- Deleting a project automatically unassigns all its items

**Perfect for:**
- Tracking materials allocated for specific installations
- Keeping client-specific inventory separate
- Estimating job costs based on used inventory
- Organizing multi-project workflows

## D-Tools Integration ⭐ NEW!

Import Bill of Materials (BOM) exports from D-Tools System Integrator (SI) with one tap.

**How it Works:**
1. Export your BOM from D-Tools SI as CSV or Excel
2. In the app, tap "D-Tools" on the Inventory screen
3. Select your D-Tools export file
4. Review the parsed items and projects
5. Tap "Import to Inventory"

**What Gets Imported:**
- **Inventory Items:**
  - Product names (with manufacturer and model)
  - Quantities from BOM
  - Unit prices
  - Categories (auto-mapped to app categories)
  - Model numbers (stored as barcodes)
  - Notes and descriptions

- **Projects:**
  - Automatically created from Location/Room fields
  - Each project shows item count
  - Color-coded for easy identification
  - Ready for time tracking

**Smart Features:**
- **Category Mapping** - D-Tools categories automatically mapped to SnapAV categories
- **Manufacturer Integration** - Combines manufacturer + model with product name
- **Location-Based Projects** - Each unique location/room becomes a project
- **Error Handling** - Shows warnings for any parsing issues
- **Duplicate Prevention** - Works with existing duplicate detection

**Supported D-Tools Columns:**
- Item/Product Name (required)
- Quantity
- Unit Price/Cost
- Category/Type/System
- Location/Room/Area (for projects)
- Manufacturer/Brand
- Model/Part Number
- Notes/Description

**Perfect for:**
- Quick import of entire project BOMs
- Maintaining accurate inventory from D-Tools designs
- Syncing quantities with D-Tools proposals
- Creating projects from D-Tools locations
- Eliminating manual data entry

**File Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

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
