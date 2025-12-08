# Changelog - LUKO Amazon Content Manager

All notable changes to this project will be documented in this file.

## [2.1.1] - 2025-12-08

### 🔧 Critical Fixes

#### Fixed "Missing required credentials" Error
- **Problem**: Cloud Function was rejecting requests due to missing credentials
- **Root Cause**: `getCredentials()` function in Apps Script was looking for exact key names that might not match Config sheet
- **Solution**:
  - Added fallback support for multiple key name variations (`LWA Client ID`, `lwaClientId`, `Client ID`)
  - Added comprehensive validation with detailed error messages
  - Added helpful error message showing exactly which credentials are missing
- **Impact**: Users can now use different naming conventions in Config sheet
- **File**: `apps-script/LukoAmazonManager.gs:1727-1766`

### ✨ New Features

#### Extended Bullet Points Support (9 instead of 5)
- **What**: Amazon supports up to 9 bullet points per language, we were only extracting 5
- **Added**:
  - `extractProductDataFromMain()` now extracts `bulletPoint6_${lang}` through `bulletPoint9_${lang}`
  - SpreadsheetGenerator now creates columns for all 9 bullet points
  - Cloud Function already supported 9 (no changes needed)
- **Impact**: Full bullet point capacity now available
- **Files**:
  - `apps-script/LukoAmazonManager.gs:509-519`
  - `apps-script/SpreadsheetGenerator.gs:165-168`

#### Platinum Keywords Support (1-5)
- **What**: Premium sellers can use platinum keywords for better search visibility
- **Added**:
  - Extraction of `platinumKeywords1_${lang}` through `platinumKeywords5_${lang}` in Apps Script
  - SpreadsheetGenerator creates 5 platinum keyword columns per language (40 columns total)
  - Cloud Function already supported (no changes needed)
- **Impact**: Premium sellers can now manage platinum keywords
- **Files**:
  - `apps-script/LukoAmazonManager.gs:522-527`
  - `apps-script/SpreadsheetGenerator.gs:176-179`

#### Manufacturer Field (Multi-Language)
- **What**: EU GPSR compliance requires manufacturer info per language
- **Added**:
  - Extraction of `manufacturer_${lang}` for all 8 languages
  - SpreadsheetGenerator creates manufacturer columns
  - Cloud Function already supported (no changes needed)
- **Impact**: Better GPSR compliance support
- **Files**:
  - `apps-script/LukoAmazonManager.gs:508`
  - `apps-script/SpreadsheetGenerator.gs:162-163`

#### Additional Language-Specific Fields
- **Added**:
  - `targetAudienceKeywords_${lang}` - Target specific customer groups
  - `legalDisclaimer_${lang}` - Legal disclaimers per language
  - `safetyWarning_${lang}` - Safety warnings per language
- **Impact**: Full SP-API Listings field coverage
- **Files**:
  - `apps-script/LukoAmazonManager.gs:529-532`
  - `apps-script/SpreadsheetGenerator.gs:181-188`

#### Pricing, Inventory, Compliance, Dimensions Support
- **What**: Support for all non-language-specific product attributes
- **Added to extractProductDataFromMain()**:
  - **Pricing**: `ourPrice`, `currency`, `discountedPrice`, `discountStartDate`, `discountEndDate`
  - **Inventory**: `quantity`, `fulfillmentChannel`
  - **Compliance**: `countryOfOrigin`, `batteriesRequired`, `isLithiumBattery`, `supplierDeclaredDgHzRegulation`, `adultProduct`
  - **Dimensions**: `itemLength`, `itemWidth`, `itemHeight`, `itemWeight`, `packageLength`, `packageWidth`, `packageHeight`, `packageWeight`
  - **Product Info**: `modelNumber`, `releaseDate`, `packageQuantity`
- **Added to SpreadsheetGenerator**:
  - All above fields now generated as columns
  - Organized in logical groups (pricing, inventory, compliance, dimensions)
- **Impact**: Complete product data management
- **Files**:
  - `apps-script/LukoAmazonManager.gs:552-603`
  - `apps-script/SpreadsheetGenerator.gs:239-261`

### 📚 New Documentation

#### SETUP-CONFIG-SHEET.md
- **What**: Complete guide for setting up Config sheet
- **Includes**:
  - Step-by-step instructions to get Amazon SP-API credentials
  - How to create SP-API app in Seller Central
  - How to generate Refresh Token
  - Exact Config sheet structure required
  - Troubleshooting common credential errors
- **Location**: `/SETUP-CONFIG-SHEET.md`

#### GCP-DEPLOYMENT-GUIDE.md
- **What**: Complete guide for deploying Cloud Function to Google Cloud Platform
- **Includes**:
  - Prerequisites checklist
  - Two deployment methods (Console & CLI)
  - Step-by-step screenshots/instructions
  - Security configuration options
  - Monitoring and logging setup
  - Cost estimation
  - Troubleshooting deployment issues
  - Update/redeploy procedures
- **Location**: `/GCP-DEPLOYMENT-GUIDE.md`

#### SAFE-TESTING-GUIDE.md
- **What**: Best practices for testing without risking live products
- **Includes**:
  - Production safety rules (DO NOT TOUCH during season!)
  - 3-phase testing strategy (read-only → test products → production)
  - How to create test products
  - Testing checklist
  - What to do if something goes wrong
  - Emergency rollback procedures
  - Team training guide
  - Go-live checklist
- **Location**: `/SAFE-TESTING-GUIDE.md`

### 🔄 Code Quality Improvements

#### Better Error Messages
- `getCredentials()` now shows exactly which credentials are missing
- Includes helpful hints on where to find each credential
- Validation errors are more descriptive

#### Backwards Compatibility
- Multiple key name variations supported in Config sheet
- Existing setups continue to work
- New setups have more flexibility

### 🐛 Bug Fixes

#### Fixed Dimension Field Names
- **Problem**: Dimension fields had `_cm` and `_kg` suffixes in SpreadsheetGenerator but not in extraction code
- **Fixed**: Normalized to simple names (`itemLength` not `itemLength_cm`)
- **Impact**: Consistent naming across all components
- **File**: `apps-script/SpreadsheetGenerator.gs:190-203`

#### Fixed Missing Model Number, Release Date, Package Quantity
- **Problem**: These fields were in Cloud Function but not extracted by Apps Script
- **Fixed**: Added to dimensions array in SpreadsheetGenerator
- **Impact**: All product attributes now supported
- **File**: `apps-script/SpreadsheetGenerator.gs:200-202`

### 📊 Statistics

**Lines of Code Changed**:
- `apps-script/LukoAmazonManager.gs`: +80 lines (credentials validation + field extraction)
- `apps-script/SpreadsheetGenerator.gs`: +70 lines (new columns)
- New documentation: +1200 lines (3 new guides)

**New Columns Added to ProductsMain**:
- Bullet points 6-9: 32 columns (4 × 8 languages)
- Platinum keywords 1-5: 40 columns (5 × 8 languages)
- Manufacturer: 8 columns (1 × 8 languages)
- Target audience, legal, safety: 24 columns (3 × 8 languages)
- Pricing: 5 columns
- Inventory: 2 columns
- Compliance: 5 columns
- **Total new columns**: ~116 columns

**Fields Now Supported**:
- Before: ~80 fields
- After: ~196 fields
- Coverage: ~95% of Amazon Listings API

---

## [2.1.0] - 2025-01-19 (Previous Release)

### Phase 2: Extended Features
- GPSR Compliance management
- Documents management
- Product Customization
- Brand Strip
- Brand Store
- Videos management

(See previous CHANGELOG entries for details)

---

## [2.0.0] - 2024-12-XX (Initial Release)

### Phase 1: Core Product Management
- Multi-language content management (10 EU marketplaces)
- Basic product fields (title, brand, bullets 1-5, description, keywords)
- Images management
- Product variants
- Data validation
- Import from Amazon
- Spreadsheet generator

---

## Notes

**Version Numbering**:
- MAJOR.MINOR.PATCH (semantic versioning)
- MAJOR = breaking changes
- MINOR = new features (backwards compatible)
- PATCH = bug fixes only

**Next Release (2.2.0) - Planned**:
- AI content generation
- Automated translation
- BSR tracking
- Multi-language UI switcher
- Caching optimization
