# LUKO-ACM (LUKO Amazon Content Manager)

Enterprise Multi-Language Content Management System for Amazon Sellers

## Overview

LUKO-ACM is a comprehensive solution for managing ALL product content across ALL European Amazon marketplaces in MULTIPLE LANGUAGES through Google Sheets. This system provides a centralized interface for managing:

- Basic product content (titles, bullets, descriptions)
- Images & media (main, additional, 360°, videos)
- Premium content (A+ Basic, A+ Premium, Brand Stores)
- Product variations (parent-child relationships)
- Customizable products (personalization options)
- Promotions & pricing (coupons, deals, promotions)
- Multi-language support (40+ languages across 10 EU marketplaces)

## 🎯 CRITICAL: Naming Conventions

### ✅ Use "LUKO" prefix in:
- **Project name**: LUKO-ACM (LUKO Amazon Content Manager)
- **Repository**: LUKO-amazon-content-manager
- **Code files**: `LukoAmazonManager.gs`
- **Function names**: `lukoSyncToAmazon()`, `lukoImportProducts()`
- **Cloud Functions**: `luko-sp-api-handler`
- **Config files**: `luko.config.json`

### ❌ DO NOT use "LUKO" prefix in:
- Sheet tab names (use: `Content-DE` NOT `LUKO-Content-DE`)
- Column headers (use: `Title [de-DE]` NOT `LUKO Title [de-DE]`)
- User-facing menu items
- UI elements

## Supported Marketplaces & Languages

### European Amazon Marketplaces (10)

| Marketplace | ID | Primary Language | All Supported Languages | Currency |
|-------------|-----|------------------|------------------------|----------|
| **DE** (Germany) | A1PA6795UKMFR9 | de-DE | de-DE, en-GB, pl-PL, tr-TR, cs-CZ, da-DK | EUR |
| **FR** (France) | A13V1IB3VIYZZH | fr-FR | fr-FR, en-GB, de-DE, es-ES, it-IT | EUR |
| **IT** (Italy) | APJ6JRA9NG5V4 | it-IT | it-IT, en-GB, de-DE, fr-FR | EUR |
| **ES** (Spain) | A1RKKUPIHCS9HS | es-ES | es-ES, en-GB, ca-ES, eu-ES | EUR |
| **UK** (United Kingdom) | A1F83G8C2ARO7P | en-GB | en-GB, de-DE, fr-FR, es-ES, it-IT, pl-PL | GBP |
| **NL** (Netherlands) | A1805IZSGTT6HS | nl-NL | nl-NL, en-GB, de-DE, fr-FR | EUR |
| **BE** (Belgium) | AMEN7PMS3EDWL | nl-NL | nl-NL, fr-FR, en-GB, de-DE | EUR |
| **PL** (Poland) | A1C3SOZRARQ6R3 | pl-PL | pl-PL, en-GB, de-DE | PLN |
| **SE** (Sweden) | A2NODRKZP88ZB9 | sv-SE | sv-SE, en-GB, de-DE, fi-FI, da-DK | SEK |
| **IE** (Ireland) | A1QA6N5NQHZ0EW | en-GB | en-GB, ga-IE | EUR |

**Total**: 10 marketplaces × 40+ unique language combinations

## Content Management Scope

### 1. Basic Product Content
- Product titles (200 chars max per language)
- Bullet points (5 × 500 chars per language)
- Product descriptions (2000 chars per language)
- Backend search terms (keywords per language)
- Brand information
- Manufacturer details
- Product attributes (product-type specific)

### 2. Images & Media
- Main product image
- Additional images (up to 8)
- 360° product views (36 frames)
- Product videos (main + related)
- Image alt text (per language, accessibility)
- Video thumbnails

### 3. Premium Content
- **A+ Content Basic**: 9 standard module types
- **A+ Content Premium**: Brand Story modules with video
- **Brand Store**: Multi-page store content
- **Brand Strip**: Header/footer banners

### 4. Product Variations
- Parent-child ASIN relationships
- Variation themes (Size, Color, Style, etc.)
- Variation-specific images
- Price modifiers per variant
- Inventory per variant

### 5. Customizable Products
- Text personalization fields (up to 3)
- Custom graphics upload options
- Customization preview templates
- Price per character/graphics
- Lead times & rush orders

### 6. Promotions & Pricing
- **Coupons**: Percentage, fixed amount, Buy X Get Y
- **Promotions**: Lightning Deals, Best Deals, Deal of the Day
- **Prime Exclusive Discounts**
- **Business Pricing**: B2B quantity discounts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Sheets Interface                   │
│  (Master Spreadsheet with 25+ tabs for all content types)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Apps Script (LukoAmazonManager.gs)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud Function (Node.js)                 │
│                  (luko-sp-api-handler)                      │
│                                                             │
│  • Authentication (LWA OAuth)                               │
│  • API request formatting                                   │
│  • Rate limiting & retry logic                              │
│  • Response handling                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/REST
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Amazon SP-API (Selling Partner)               │
│                                                             │
│  • Listings API (product content)                           │
│  • Uploads API (images, videos)                             │
│  • A+ Content API (enhanced content)                        │
│  • Promotions API (coupons, deals)                          │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
LUKO-amazon-content-manager/
├── apps-script/
│   ├── LukoAmazonManager.gs          # Main Apps Script
│   ├── Helpers.gs                     # Helper functions
│   ├── Validation.gs                  # Data validation
│   └── UI.gs                          # UI components
│
├── cloud-function/
│   ├── index.js                       # Main Cloud Function
│   ├── package.json                   # Dependencies
│   ├── auth.js                        # LWA authentication
│   ├── listings.js                    # Listings API
│   ├── images.js                      # Images API
│   ├── aplus.js                       # A+ Content API
│   └── promotions.js                  # Promotions API
│
├── docs/
│   ├── SPREADSHEET_STRUCTURE.md       # Complete sheet structure
│   ├── API_REFERENCE.md               # SP-API usage guide
│   ├── DEPLOYMENT.md                  # Deployment instructions
│   └── USER_GUIDE.md                  # End-user documentation
│
├── config/
│   ├── luko.config.json               # Configuration template
│   └── marketplaces.json              # Marketplace definitions
│
├── templates/
│   ├── spreadsheet-template.xlsx      # Google Sheets template
│   └── content-templates.json         # Content templates
│
└── README.md                          # This file
```

## Quick Start

### Prerequisites

1. **Google Account** with Google Sheets access
2. **Amazon Seller Central** account (Professional plan)
3. **Amazon SP-API Developer Account**
4. **Google Cloud Platform** account (for Cloud Functions)

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/LUKO-amazon-content-manager.git
   cd LUKO-amazon-content-manager
   ```

2. **Set Up Amazon SP-API**
   - Register as developer in [Amazon Solution Provider Portal](https://developer-docs.amazon.com/sp-api/)
   - Create app with required roles:
     - Listings management
     - Uploads
     - A+ Content
     - Promotions
   - Obtain LWA credentials (Client ID, Client Secret, Refresh Token)

3. **Deploy Cloud Function**
   ```bash
   cd cloud-function
   gcloud functions deploy luko-sp-api-handler \
     --runtime nodejs20 \
     --trigger-http \
     --allow-unauthenticated \
     --region europe-west1
   ```

4. **Create Google Sheets**
   - Create new Google Sheet named "LUKO-Master"
   - Copy structure from `templates/spreadsheet-template.xlsx`
   - Create all required tabs (see SPREADSHEET_STRUCTURE.md)

5. **Add Apps Script**
   - In Google Sheets: Extensions → Apps Script
   - Copy code from `apps-script/LukoAmazonManager.gs`
   - Save and authorize

6. **Configure Credentials**
   - Fill in `Config` sheet with:
     - LWA Client ID
     - LWA Client Secret
     - Refresh Token
     - Seller ID
     - Cloud Function URL

7. **Test Connection**
   - Refresh Google Sheets
   - Click: Amazon Manager → Tools → Validate Data
   - Should show "✅ Configuration valid"

## Spreadsheet Structure (25+ Tabs)

### Administration
- **Config**: Credentials, endpoints, settings
- **Marketplaces**: Marketplace × language matrix
- **Logs**: Operation history & errors

### Products
- **Products-Master**: Main ASIN/SKU list
- **Variants**: Parent-child relationships
- **Customization**: Personalization options

### Content (per marketplace)
- **Content-DE**: All German marketplace languages
- **Content-FR**: All French marketplace languages
- **Content-IT**: All Italian marketplace languages
- **Content-ES**: All Spanish marketplace languages
- **Content-UK**: All UK marketplace languages
- **Content-NL**: All Netherlands marketplace languages
- **Content-BE**: All Belgium marketplace languages
- **Content-PL**: All Poland marketplace languages
- **Content-SE**: All Sweden marketplace languages
- **Content-IE**: All Ireland marketplace languages

### Premium Content
- **APlus-Basic**: A+ Basic Content modules
- **APlus-Premium**: A+ Premium Brand Story
- **BrandStore**: Amazon Store pages
- **BrandStrip**: Brand strips/headers

### Media
- **Images**: Main + additional images
- **Images-360**: 360° product views
- **Videos**: Product videos

### Promotions
- **Coupons**: Coupon configuration
- **Promotions**: Promotion setup
- **Deals**: Lightning/Best Deals

### Templates
- **Templates-Content**: Description templates
- **Templates-APlus**: A+ Content templates
- **Translation-Queue**: Translation workflow

## Key Features

### 🌍 Multi-Marketplace Management
- Manage 10 European marketplaces from one interface
- Sync to selected marketplaces with one click
- Marketplace-specific language configuration

### 🗣️ Multi-Language Support
- 40+ language combinations across EU
- Side-by-side language columns for easy comparison
- Translation queue integration
- Language-specific character limits

### 📦 Comprehensive Content Types
- All Amazon content types in one system
- Basic content, images, premium content, promotions
- Variants and customizable products
- Videos and 360° views

### ✅ Data Validation
- Real-time validation of all fields
- Character count enforcement
- ASIN/SKU format checking
- Image URL validation

### 🔄 Bidirectional Sync
- Export: Google Sheets → Amazon
- Import: Amazon → Google Sheets
- Conflict detection and resolution

### 📊 Reporting & Analytics
- Content completion reports
- Language coverage analysis
- Sync status tracking
- Error logs and troubleshooting

### 🎨 Template System
- Content templates for faster creation
- A+ Content module templates
- Variable substitution ({{BRAND}}, {{SIZE}}, etc.)
- Template library per product category

### 🔐 Security
- Encrypted credential storage
- Role-based access control (via Google Sheets permissions)
- Audit logging
- Rate limiting protection

## Usage Examples

### Sync Products to Amazon

1. Navigate to `Content-DE` sheet
2. Check boxes next to products to sync
3. Click: **Amazon Manager → Export to Amazon → Sync Selected Products**
4. Monitor progress in status column
5. Check `Logs` sheet for details

### Upload Images

1. Navigate to `Images` sheet
2. Fill in image URLs
3. Add alt text for each language
4. Check boxes next to products
5. Click: **Amazon Manager → Export to Amazon → Upload Images**

### Create A+ Content

1. Navigate to `APlus-Basic` or `APlus-Premium` sheet
2. Fill in module content for each language
3. Add image URLs
4. Check boxes next to content to publish
5. Click: **Amazon Manager → Export to Amazon → Publish A+ Content**

### Launch Coupon

1. Navigate to `Coupons` sheet
2. Configure coupon (type, value, dates, budget)
3. Add badge text for each language
4. Check box next to coupon
5. Click: **Amazon Manager → Export to Amazon → Create Coupons**

### Import Products from Amazon

1. Click: **Amazon Manager → Import from Amazon → Import Products**
2. Select marketplace (e.g., DE)
3. System imports all products to `Products-Master` and `Content-DE`
4. Review and edit content as needed

## API Operations

### Listings API
- `PUT /listings/2021-08-01/items/{sku}` - Create listing
- `PATCH /listings/2021-08-01/items/{sku}` - Update listing
- `DELETE /listings/2021-08-01/items/{sku}` - Delete listing
- `GET /listings/2021-08-01/items/{sku}` - Get listing details

### Uploads API
- `POST /uploads/2020-11-01/uploadDestinations` - Get upload URL
- `PUT {uploadUrl}` - Upload file to S3

### A+ Content API
- `POST /aplus/2020-11-01/contentDocuments` - Create A+ content
- `PUT /aplus/2020-11-01/contentDocuments/{contentReferenceKey}` - Update
- `GET /aplus/2020-11-01/contentDocuments/{contentReferenceKey}` - Get details

### Promotions API
- `POST /coupons/2022-03-01/coupons` - Create coupon
- `GET /coupons/2022-03-01/coupons` - List coupons

## Rate Limits

Amazon SP-API enforces rate limits:
- **Listings API**: 5 requests/second (burst: 10)
- **Uploads API**: 10 requests/second (burst: 20)
- **A+ Content API**: 10 requests/second (burst: 20)
- **Promotions API**: 1 request/second (burst: 5)

Our system includes:
- Automatic rate limiting
- Exponential backoff on errors
- Request queuing
- Retry logic (up to 3 attempts)

## Error Handling

### Common Errors

1. **Authentication Failed**
   - Check LWA credentials in `Config` sheet
   - Verify refresh token is valid
   - Re-authorize if needed

2. **Rate Limit Exceeded**
   - System automatically retries
   - Reduce batch size
   - Increase delay between operations

3. **Invalid Data**
   - Run: **Amazon Manager → Tools → Validate Data**
   - Fix highlighted errors
   - Re-sync

4. **Image Upload Failed**
   - Verify image URLs are accessible
   - Check image dimensions (min 1000px)
   - Ensure format is JPEG/PNG

## Support & Documentation

- **User Guide**: `docs/USER_GUIDE.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Spreadsheet Structure**: `docs/SPREADSHEET_STRUCTURE.md`

## Version History

- **v2.0.0** (2024-01) - Complete rewrite with corrected naming structure
  - Multi-language support for all EU marketplaces
  - Premium content management (A+, Brand Store)
  - Customizable products support
  - Comprehensive promotions management
  - Template system
  - Enhanced validation

- **v1.0.0** (2023-12) - Initial release
  - Basic product content management
  - Single marketplace support

## License

Proprietary - All Rights Reserved

## Credits

Developed for enterprise Amazon sellers managing multi-marketplace operations.

## Contact

For support or inquiries, please contact: [your-email@domain.com]

---

**LUKO-ACM** - Enterprise Amazon Content Management Made Simple
