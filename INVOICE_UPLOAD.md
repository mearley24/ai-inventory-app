# AI-Powered Invoice Upload Feature

## Overview

The invoice upload feature uses GPT-4o Vision AI to automatically extract line items from invoice photos and populate your inventory. This eliminates manual data entry when receiving shipments or restocking.

## How to Use

### Step 1: Access Invoice Upload
From the **Inventory** screen, tap the **"Invoice"** button in the top right corner (purple button with receipt icon).

### Step 2: Capture Invoice
You have two options:
- **Take Photo**: Use your camera to capture a photo of the invoice
- **Choose from Library**: Select an existing invoice image or screenshot

### Step 3: Parse with AI
After selecting an image:
1. Tap **"Parse Invoice with AI"**
2. Wait while GPT-4o Vision analyzes the invoice (usually 5-10 seconds)
3. The AI extracts:
   - Vendor name
   - Invoice number and date
   - All line items with descriptions, quantities, prices, and SKUs
   - Subtotal, tax, and total amounts

### Step 4: Review and Select
- All line items are **selected by default**
- **Tap any item** to deselect it if you don't want to import it
- Selected items appear in **white** with a purple checkbox
- Deselected items appear **dimmed** with an outline checkbox
- Review quantities, prices, and descriptions for accuracy

### Step 5: Import to Inventory
- Tap **"Add X Items to Inventory"** at the bottom
- Items are instantly added to your inventory
- Each item includes:
  - Product description as the name
  - Quantity from the invoice
  - Unit price
  - Automatically matched SnapAV category
  - Invoice reference in the description

## Features

### Intelligent Parsing
- **Multi-format Support**: Works with various invoice layouts
- **Table Detection**: Automatically identifies and parses line item tables
- **Smart Extraction**: Captures descriptions, quantities, prices, SKUs
- **Vendor Recognition**: Extracts vendor name and invoice details

### Category Matching
Line items are automatically matched to SnapAV categories:
- Control4
- Audio
- Cables
- Networking
- Surveillance
- And 14 more SnapAV categories

### Selective Import
- Review all items before importing
- Deselect items you already have in stock
- Only import what you need
- Prevents duplicate entries

## Best Practices

### Taking Photos
- **Good Lighting**: Ensure the invoice is well-lit and clearly visible
- **Flat Surface**: Lay invoice flat or hold camera parallel
- **Full Invoice**: Capture the entire invoice including header and line items
- **Clear Text**: Make sure all text is readable and not blurry
- **No Glare**: Avoid reflections or glare from lighting

### Invoice Types
Works best with:
- ✅ Standard commercial invoices
- ✅ SnapAV/Snap One invoices
- ✅ Distributor invoices (ADI, Anixter, etc.)
- ✅ Typed/printed invoices
- ⚠️ Handwritten invoices may have lower accuracy

### When to Use
Perfect for:
- Receiving shipments
- Restocking inventory
- Bulk purchases
- Tracking costs
- Maintaining stock levels

## Technical Details

### AI Model
- **Model**: OpenAI GPT-4o Vision
- **Temperature**: 0.0 (deterministic output)
- **Format**: Structured JSON extraction
- **Detail Level**: High (for complex layouts)

### Data Extracted
```json
{
  "vendor": "Vendor Name",
  "invoiceNumber": "INV-12345",
  "date": "2025-11-02",
  "lineItems": [
    {
      "description": "Product name",
      "quantity": 10,
      "unitPrice": 25.50,
      "totalPrice": 255.00,
      "sku": "SKU123",
      "category": "Cables"
    }
  ],
  "subtotal": 255.00,
  "tax": 20.40,
  "total": 275.40
}
```

### Privacy & Security
- Images are processed securely via OpenAI API
- No invoice images are stored permanently
- Only extracted data is saved to your inventory
- All processing happens in real-time

## Troubleshooting

### "No line items found in invoice"
- Ensure the invoice has a clear line item table
- Try taking a clearer photo with better lighting
- Make sure the entire line item section is visible

### Incorrect quantities or prices
- Review items before importing
- You can edit items after import using the Edit screen
- Try taking a clearer photo if text is blurry

### Wrong categories assigned
- Categories are automatically matched but can be edited
- Go to the item in inventory and tap to edit
- Select the correct category from the list

### AI parsing is slow
- Normal processing time is 5-10 seconds
- Complex invoices with many items may take longer
- Ensure you have a stable internet connection

## Comparison with CSV Import

| Feature | Invoice Upload | CSV Import |
|---------|---------------|------------|
| **Speed** | Fast for 1-20 items | Fast for 100+ items |
| **Setup** | None - just take photo | Requires CSV file prep |
| **Accuracy** | 95%+ with clear photos | 100% with clean data |
| **Use Case** | Receiving shipments | Bulk price list loads |
| **Vendor Info** | Captures vendor/invoice # | No vendor tracking |

## Examples

### Use Case 1: Receiving SnapAV Shipment
1. Unpack shipment, keep invoice
2. Take photo of invoice with your phone
3. Upload via Invoice button
4. Review 10 line items extracted
5. Deselect 2 items you already have
6. Import 8 new items in seconds

### Use Case 2: Restocking Common Items
1. Purchase wire and connectors from distributor
2. Screenshot email invoice on phone
3. Upload screenshot via library picker
4. AI extracts 5 bulk items with quantities
5. All items auto-matched to "Cables" category
6. Import and update inventory instantly

### Use Case 3: Tracking Project Costs
1. Buy specific items for a job
2. Keep invoice for cost tracking
3. Upload invoice to inventory
4. Items added with exact pricing
5. Use price data for job cost analysis
6. Invoice reference saved in description

## Tips for Maximum Efficiency

1. **Immediate Upload**: Upload invoices as soon as you receive shipments
2. **Batch Processing**: Take photos of multiple invoices, upload one by one
3. **Double Check**: Always review quantities before importing
4. **Set Low Stock**: After importing, star frequently used items and set thresholds
5. **Edit Later**: Don't worry about perfect accuracy - you can edit items anytime
6. **Use Both Methods**: Invoice upload for shipments, CSV import for price lists

## Related Features

- **Barcode Scanner**: Add individual items by scanning barcodes
- **CSV/Excel Import**: Bulk load entire price lists
- **Manual Add**: Add items one at a time with full control
- **Starred Items**: Mark imported items as favorites for tracking
- **Low Stock Alerts**: Set thresholds on imported items

## Future Enhancements

Coming soon:
- Multi-page invoice support (PDF)
- Invoice history and tracking
- Duplicate detection across invoices
- Auto-categorization learning
- Invoice export for accounting
