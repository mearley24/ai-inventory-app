# AI Inventory Tracker

A beautiful, AI-powered inventory management app with barcode scanning and time tracking for projects.

## Features

### 🗂️ Inventory Management
- View all inventory items in a clean, card-based interface
- Search and filter items by name, description, and category
- Add items manually or through barcode scanning
- Edit item details with intuitive +/- quantity controls
- Price tracking for each item
- Delete items with a simple tap
- Low stock alerts to keep track of inventory levels
- Category-based organization (Electronics, Food, Clothing, Tools, Office, General)
- **Bulk CSV/Excel import** for loading large price lists

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
- Automatic category suggestions
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
- **Styling:** NativeWind (TailwindCSS for React Native)
- **Animations:** React Native Reanimated v3
- **AI:** OpenAI GPT-4o-mini for product identification
- **Camera:** Expo Camera for barcode scanning
- **Icons:** Expo Vector Icons (Ionicons)

## Project Structure

```
src/
├── components/         # Reusable components (future)
├── screens/           # All app screens
│   ├── InventoryScreen.tsx      # Main inventory list
│   ├── ScannerScreen.tsx        # Barcode scanner
│   ├── TimeTrackerScreen.tsx    # Time tracking
│   ├── AddItemScreen.tsx        # Add new items
│   ├── EditItemScreen.tsx       # Edit existing items
│   └── ImportScreen.tsx         # CSV/Excel import
├── navigation/        # Navigation configuration
│   └── AppNavigator.tsx         # Tab and stack navigators
├── state/            # Zustand stores
│   ├── inventoryStore.ts        # Inventory state
│   └── timeTrackerStore.ts      # Time tracking state
└── types/            # TypeScript types
    └── inventory.ts             # Data models
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
- Description (optional)
- Low stock threshold (optional)
- Creation and update timestamps

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

### Planned Features:
- **Team Collaboration & Accounts**: Multi-user support with login system for teams to collaborate on jobs
- Export inventory to CSV/PDF
- Inventory analytics and charts
- Photo capture for items
- Bulk barcode scanning
- Time tracking reports and exports
- Project analytics and insights
- Cloud sync across devices
- Role-based permissions for team members
- Job assignment and tracking

## Notes

- The app is optimized for iOS
- Requires camera permissions for barcode scanning
- AI features require an OpenAI API key (pre-configured in Vibecode environment)
- All data is stored locally on the device
