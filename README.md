# NetAnaliza Amazon Content Manager

**Version 3.0.0** - Direct SP-API Integration

## 🚀 What's New in v3.0

### Major Changes

1. **✅ REMOVED Google Cloud Function** - Now using direct Amazon SP-API connections
2. **✅ Multi-Client Support** - Manage multiple Amazon seller accounts in one spreadsheet
3. **✅ New "Client Settings" Sheet** - All configuration in one place
4. **✅ Renamed Menu: "NetAnaliza Manager"**
5. **✅ Client Visibility** - Always see which account data comes from

### Benefits

- **Faster** - No intermediary (Cloud Function)
- **More Secure** - Direct connection to Amazon
- **Simpler** - No Google Cloud configuration needed
- **Multi-Client** - Support multiple clients simultaneously
- **Transparent** - Always know which account data flows from

---

## 📋 Quick Start

### 1. Open Google Sheets

Copy or open the spreadsheet with NetAnaliza Amazon Content Manager code.

### 2. Generate Sheets (First Run)

```
Menu → Tools → 🎨 Generate Spreadsheet
```

This will create all necessary sheets, including **Client Settings**.

### 3. Configure Your First Client

#### Option A: Migrate from Old Config (if you have one)

```
Menu → Client Management → 📥 Migrate from Old Config
```

#### Option B: Add New Client

```
Menu → Client Management → ➕ Add New Client
```

Provide:
- **Client Name**: Client name (e.g., "ABC Company Ltd.")
- **Client Email**: Client email (optional)
- **Seller ID**: Amazon Seller ID (e.g., `A3EXAMPLE123456`)
- **Marketplace**: Marketplace (e.g., `DE`, `FR`, `UK`)
- **Refresh Token**: Amazon SP-API Refresh Token
- **LWA Client ID**: Amazon LWA Client ID
- **LWA Client Secret**: Amazon LWA Client Secret

### 4. Activate Client

Click on **Client Settings** sheet and check the **✓ Active** checkbox for the client you want to use.

**IMPORTANT**: Only one client can be active at a time!

### 5. Done!

You can now use all tool features.

---

## 🎮 How to Use

### Switch Between Clients

```
Menu → Client Management → 🔄 Switch Active Client
```

Select client number from the list.

### Check Active Client

```
Menu → Client Management → 📋 Show Active Client
```

Shows currently active client.

### Add New Client

```
Menu → Client Management → ➕ Add New Client
```

### Export Products to Amazon

1. Open **ProductsMain** sheet
2. Fill in product data
3. Check **☑️ Export** checkbox for products
4. Click:
   ```
   Menu → Export to Amazon → 📤 Export Products
   ```

**Status Column** will show:
```
DONE [Client Name - Seller ID]
```

This way you always know which account you exported from!

### Import Products from Amazon

#### Import by ASIN:
```
Menu → Import from Amazon → 📦 Import by ASIN(s)
```

#### Search by Keyword:
```
Menu → Import from Amazon → 🔍 Search Products by Keyword
```

### A+ Content Management

#### Supported Modules

The tool supports **ALL 36 Amazon A+ Content modules**:

**Basic Modules (17):**
- STANDARD_TEXT
- STANDARD_SINGLE_SIDE_IMAGE
- STANDARD_HEADER_IMAGE_TEXT
- STANDARD_COMPANY_LOGO
- STANDARD_IMAGE_TEXT_OVERLAY
- STANDARD_SINGLE_IMAGE_HIGHLIGHTS
- STANDARD_MULTIPLE_IMAGE_TEXT
- STANDARD_FOUR_IMAGE_TEXT
- STANDARD_FOUR_IMAGE_TEXT_QUADRANT
- STANDARD_THREE_IMAGE_TEXT
- STANDARD_COMPARISON_TABLE
- STANDARD_PRODUCT_DESCRIPTION
- STANDARD_SINGLE_IMAGE_SPECS_DETAIL
- STANDARD_IMAGE_SIDEBAR
- STANDARD_TECH_SPECS
- Plus 2 additional legacy modules

**Premium Modules (19):**
- PREMIUM_TEXT
- PREMIUM_SINGLE_IMAGE_TEXT
- PREMIUM_BACKGROUND_IMAGE_TEXT
- PREMIUM_FULL_IMAGE
- PREMIUM_DUAL_IMAGES_TEXT
- PREMIUM_FOUR_IMAGES_TEXT
- PREMIUM_COMPARISON_TABLE_1/2/3
- PREMIUM_HOTSPOTS_1/2
- PREMIUM_NAVIGATION_CAROUSEL
- PREMIUM_REGIMEN_CAROUSEL
- PREMIUM_SIMPLE_IMAGE_CAROUSEL
- PREMIUM_VIDEO_IMAGE_CAROUSEL
- PREMIUM_FULL_VIDEO
- PREMIUM_VIDEO_WITH_TEXT
- PREMIUM_QA
- PREMIUM_TECHNICAL_SPECIFICATIONS

#### A+ Content Workflow

1. **Fill in content** in **APlusBasic** or **APlusPremium** sheets
2. **Select moduleType** from dropdown (all 36 modules available)
3. **Check ☑️ Export** checkbox for modules to publish
4. Click:
   ```
   Menu → Export to Amazon → 📋 Publish A+ Content
   ```
5. Choose: **Basic** or **Premium**
6. System will:
   - ✅ Group modules by ASIN
   - ✅ Publish all modules for each ASIN as one A+ Content document
   - ✅ Update **Status** → DONE (green) or FAILED (red)
   - ✅ Set **ExportDateTime** in German format (DD.MM.YYYY HH:mm:ss)
   - ✅ Change **☑️ Export** → **DONE** (green background)
   - ✅ Auto-generate **contentReferenceKey** (ASIN_module{N}_{timestamp})

#### Multi-Language Support

All text fields support **8 European languages**:
- 🇩🇪 German (DE)
- 🇬🇧 English (EN)
- 🇫🇷 French (FR)
- 🇮🇹 Italian (IT)
- 🇪🇸 Spanish (ES)
- 🇳🇱 Dutch (NL)
- 🇵🇱 Polish (PL)
- 🇸🇪 Swedish (SE)

#### Placeholder Images System

**18 unique image sizes** + **3 video types** supported across all modules.

Complete specifications available in:
```
docs/APLUS_PLACEHOLDER_IMAGES_SPEC.md
```

**Standard Image Sizes (Basic):**
- 135x135 px - Quadrant images
- 150x300 px - Comparison table products
- 220x220 px - Additional square image
- 300x300 px - Square images (most common)
- 300x400 px - Vertical images
- 350x175 px - Additional horizontal image
- 600x180 px - Company logo
- 970x300 px - Overlay banner
- 970x600 px - Header image

**Premium Image Sizes:**
- 200x225 px - Premium Comparison Table 1
- 300x225 px - Premium Comparison Table 2/3
- 650x350 px - Premium Single/Dual Images
- 1464x600 px - Premium desktop
- 1940x600 px - Premium Background Text
- 600x450 px - Premium mobile
- 800x600 px - Video with Text thumbnail
- 1920x1080 px - Full Video thumbnail
- 960x540 px - Video Carousel min

**Video Support:**
- MP4 format, H.264 codec
- Max 1920x1080 resolution
- Video with thumbnail support

**Workflow:**
1. Create 18 placeholder images with correct dimensions
2. Upload to Amazon Asset Library
3. Copy **uploadDestinationId** for each image
4. Use in A+ Content modules

**Three Export Options:**
- a) **Text only** - no images
- b) **Text + real images** - from your library
- c) **Text + placeholder images** - using atrap placeholders

#### Status Management

The system tracks A+ Content publishing with:

**Status Column** (color-coded):
- 🟡 **PENDING** - Ready to publish (yellow)
- 🟢 **DONE** - Successfully published (green)
- 🔴 **FAILED** - Publishing error (red)
- ⚪ **SKIPPED** - Intentionally skipped (gray)

**ExportDateTime Column:**
- German format: DD.MM.YYYY HH:mm:ss
- Auto-set on publish attempt

**ErrorMessage Column:**
- Shows error details if FAILED
- Includes client name for multi-client tracking

**Export Column:**
- ☑️ Checkbox → Select for publishing
- Automatically changes to **DONE** (green) after successful publish

---

## 📊 Client Settings Sheet

### Column Structure

| Column | Description | Required |
|--------|-------------|----------|
| ✓ Active | Checkbox - only one can be checked | ✅ |
| Client Name | Client name | ✅ |
| Client Email | Client email | ❌ |
| Seller ID | Amazon Seller ID | ✅ |
| Marketplace | Marketplace code (DE, FR, UK...) | ✅ |
| Marketplace ID | Amazon Marketplace ID | ✅ |
| Refresh Token | SP-API Refresh Token | ✅ |
| LWA Client ID | Login with Amazon Client ID | ✅ |
| LWA Client Secret | Login with Amazon Client Secret | ✅ |
| Notes | Notes | ❌ |
| Created Date | Creation date | Auto |
| Last Used | Last used | Auto |

### Marketplace IDs

Most commonly used:

| Marketplace | Code | Marketplace ID |
|-------------|------|----------------|
| Germany | DE | A1PA6795UKMFR9 |
| France | FR | A13V1IB3VIYZZH |
| Italy | IT | APJ6JRA9NG5V4 |
| Spain | ES | A1RKKUPIHCS9HS |
| United Kingdom | UK | A1F83G8C2ARO7P |
| Netherlands | NL | A1805IZSGTT6HS |
| Poland | PL | A1C3SOZRARQ6R3 |
| Sweden | SE | A2NODRKZP88ZB9 |

---

## 🔑 How to Get Client Settings Data?

### 1. Seller ID

1. Log in to Amazon Seller Central
2. Menu → Settings → Account Info
3. Find **Merchant Token** or **Seller ID**

### 2. LWA Client ID, Secret + Refresh Token

#### Step 1: Create Application in Amazon Developer Console

1. Go to: https://developer.amazon.com/settings/console/registration
2. Log in with the same account as Seller Central
3. Click **Create New Client**
4. Select **SP-API**
5. Enter **Allowed Return URLs**: `https://ads.netanaliza.com/amazon-callback`
6. Save **Client ID** and **Client Secret**

#### Step 2: Authorize Application and Get Refresh Token

**Automatically (via Email):**

```
Menu → SP-API Auth → 📧 Setup Email Automation
```

Then send authorization link to client. Token will be saved automatically.

**Manually:**

1. Generate authorization link:
   ```
   https://sellercentral.amazon.de/apps/authorize/consent?application_id={CLIENT_ID}&state=test&version=beta
   ```

2. Open in browser and authorize

3. From callback URL copy `spapi_oauth_code=...`

4. Paste code in SP-API Auth sheet

5. Click:
   ```
   Menu → SP-API Auth → 📝 Manual: Exchange Auth Code
   ```

---

## 🚨 FAQ

### ❓ Can I have multiple clients in one spreadsheet?

**YES!** This is the main feature of v3.0. Add any number of clients and switch between them.

### ❓ What happened to Cloud Function?

**Removed!** We now use direct connections to Amazon SP-API. It's faster and simpler.

### ❓ What happened to "Config" and "Settings" sheets?

**Replaced** by **Client Settings**. All settings are now in one place.

You can migrate old data:
```
Menu → Client Management → 📥 Migrate from Old Config
```

### ❓ Can I use two clients simultaneously?

**NO.** Only one client can be active at a time. But you can switch quickly:
```
Menu → Client Management → 🔄 Switch Active Client
```

### ❓ How to check which client is active?

```
Menu → Client Management → 📋 Show Active Client
```

Or see **Status** column after export - shows client name.

### ❓ Is data secure?

**YES.** All data is stored in your private Google Sheets.

**NEVER** share the Client Settings sheet with anyone!

### ❓ What to do if "No active client selected"?

Check the **✓ Active** checkbox for one of the clients in **Client Settings** sheet.

---

## 🛠️ Troubleshooting

### Problem: "Client Settings sheet not found"

**Solution:**
```
Menu → Tools → 🎨 Generate Spreadsheet
```

or

```
Menu → Client Management → 🔧 Setup Client Settings
```

### Problem: "No active client selected"

**Solution:**

1. Open **Client Settings** sheet
2. Check **✓ Active** checkbox for one client
3. Uncheck all other checkboxes

### Problem: "Missing required credentials"

**Solution:**

1. Open **Client Settings** sheet
2. Verify all required fields are filled:
   - Client Name
   - Seller ID
   - Marketplace
   - Marketplace ID
   - Refresh Token
   - LWA Client ID
   - LWA Client Secret

### Problem: "Token refresh failed"

**Solution:**

Refresh Token expired or is invalid.

1. Generate new Refresh Token (see "How to Get Data" section)
2. Paste in **Client Settings → Refresh Token**
3. Try again

---

## 📝 Version Differences

### Version 2.0 (old) vs 3.0 (new)

| Feature | v2.0 | v3.0 |
|---------|------|------|
| Connection | Google Cloud Function | Direct SP-API ✅ |
| Multi-Client | ❌ | ✅ Yes |
| Configuration | Config + Settings | Client Settings ✅ |
| Menu | Amazon Manager | NetAnaliza Manager ✅ |
| Client Visibility | ❌ | ✅ Everywhere |
| Speed | Slower | Faster ✅ |

---

## 🎯 Use Cases

### Scenario 1: Managing 3 Clients

```
1. Add 3 clients via Menu → Client Management → Add New Client

2. Activate client 1 (✓ Active checkbox)

3. Export client 1 products

4. Switch to client 2:
   Menu → Client Management → Switch Active Client

5. Export client 2 products

6. etc.
```

### Scenario 2: Import Competitor Products

```
1. Menu → Import from Amazon → Search Products by Keyword

2. Enter phrase: "wireless mouse"

3. Marketplace: DE

4. Products will be imported to "ImportedProducts" sheet

5. You can copy data to your products
```

### Scenario 3: Test Connection

```
1. Menu → Tools → 🔌 Test API Connection

2. Verify everything works:
   - Configuration: ✅
   - Token Refresh: ✅
   - API Call: ✅
```

---

## 📞 Support

If you have questions or problems:

1. Check **Logs** sheet - all operations are logged
2. Check **ErrorLog** sheet - errors are listed
3. Use test function:
   ```
   Menu → Tools → Test API Connection
   ```

---

## ✅ Summary

NetAnaliza Amazon Content Manager 3.0 is:

- ✅ **Direct connection** to Amazon SP-API
- ✅ **Multi-client** - manage multiple accounts
- ✅ **Transparent** - always know which account data comes from
- ✅ **Fast** - no intermediary
- ✅ **Simple** - everything in one spreadsheet

**Ready to use!** 🚀

---

## 📄 License

© 2025 NetAnaliza. All rights reserved.

This tool is intended for use by NetAnaliza and its clients only.

**NEVER share this tool with third parties without NetAnaliza's consent.**
