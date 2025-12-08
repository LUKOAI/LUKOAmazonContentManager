# LUKO-ACM Extended Features Documentation

**Version:** 2.1.0
**Phase:** 2 - Extended Features Implementation
**Date:** 2025-01-19

---

## Overview

This document describes the 6 new extended features added to LUKO Amazon Content Manager in Phase 2. These features extend the core product management capabilities with advanced compliance, documentation, personalization, and branding tools.

## Table of Contents

1. [GPSR Compliance](#1-gpsr-compliance)
2. [Documents Management](#2-documents-management)
3. [Product Customization](#3-product-customization)
4. [Brand Strip](#4-brand-strip)
5. [Brand Store](#5-brand-store)
6. [Videos Management](#6-videos-management)

---

## 1. GPSR Compliance

### Overview
Manage **General Product Safety Regulation (GPSR)** compliance data for EU markets. GPSR became mandatory on December 13, 2024, requiring all products sold in the EU to display responsible party information and safety documentation.

### Sheet: `GPSR Compliance`

**Location:** Amazon Manager → Extended Features → GPSR Compliance

### Columns (27 total):

#### Core Fields
- **☑️ Export** - Checkbox to mark for export
- **ASIN** - Amazon Standard Identification Number (required)
- **SKU** - Stock Keeping Unit (required)
- **GPSR Compliant** - Dropdown: Yes/No/Pending

#### Manufacturer Information
- **Manufacturer Name** - Company name
- **Manufacturer Address** - Full address
- **Manufacturer Email** - Contact email
- **Manufacturer Phone** - Contact phone

#### Importer Information
- **Importer Name** - Company name
- **Importer Address** - Full address
- **Importer Email** - Contact email
- **Importer Phone** - Contact phone

#### Responsible Person
- **Responsible Person Name** - EU representative name
- **Responsible Person Address** - EU representative address
- **Responsible Person Email** - Contact email
- **Responsible Person Phone** - Contact phone

#### Safety Documentation URLs
- **Product Safety Label Image URL** - Safety label image
- **Safety Instructions PDF URL** - User safety guide
- **CE/Conformity Certificate PDF URL** - CE marking certificate
- **Test Reports PDF URL** - Product test results
- **Risk Assessment PDF URL** - Risk analysis document
- **Declaration of Conformity PDF URL** - DoC document

#### Status Tracking
- **Export Status** - PENDING/DONE/FAILED
- **Export DateTime** - Timestamp of export
- **Last Modified** - Last update timestamp
- **Modified By** - User who made changes
- **Error Messages** - Export error details

### Features

#### Validation (`lukoValidateGpsrData`)
- Validates ASIN format (B followed by 9 alphanumeric)
- Requires at least one responsible party (Manufacturer, Importer, or Responsible Person)
- Validates email formats
- Validates all URL formats
- Warns if compliant products lack documentation

#### Export (`lukoExportGpsrToAmazon`)
- Exports compliance data to Amazon SP-API
- Individual row status tracking
- Batch processing with detailed results

#### Reporting (`lukoGenerateGpsrReport`)
- **Summary statistics:**
  - Total products
  - Compliant/Non-Compliant/Pending breakdown
  - Documentation coverage percentage
  - Responsible parties coverage
- **Products needing attention list** with specific issues

#### Bulk Operations
- `lukoBulkUpdateGpsrStatus` - Set compliance status for multiple products
- `lukoCopyManufacturerToAllParties` - Copy manufacturer info to importer and responsible person fields

### Best Practices

1. **At least one responsible party required** when marked as compliant
2. **Upload all safety documentation** to public URLs (S3, Google Drive, etc.)
3. **Use HTTPS URLs** for all documents for security
4. **Maintain up-to-date contact information** for all parties
5. **Run validation** before export to catch errors early

---

## 2. Documents Management

### Overview
Manage product documentation (user manuals, warranties, technical specs, compliance certificates) and upload them to Amazon for customer access.

### Sheet: `Documents`

**Location:** Amazon Manager → Extended Features → Documents

### Columns (17 total):

#### Core Fields
- **☑️ Export** - Checkbox to mark for export
- **ASIN** - Product identifier (required)
- **SKU** - Stock Keeping Unit (required)
- **Document Type** - Dropdown with 10 types (required)
- **Language** - Document language (required)

#### Document Information
- **Document Title** - User-facing title (max 200 chars recommended)
- **File Name** - PDF filename (must end with .pdf)
- **PDF URL** - Direct link to PDF file (required)
- **Description** - Document description (max 500 chars recommended)

#### Visibility & Metadata
- **Visible to Customer** - Yes/No dropdown
- **Upload Date** - Date document was created/uploaded
- **File Size (MB)** - File size in megabytes

#### Status Tracking
- **Export Status** - PENDING/DONE/FAILED
- **Export DateTime** - Timestamp of export
- **Last Modified** - Last update timestamp
- **Modified By** - User who made changes
- **Error Messages** - Export error details

### Document Types

1. **User Manual / Instructions** - Complete product guide
2. **Quick Start Guide** - Getting started instructions
3. **Warranty Information** - Warranty terms and conditions
4. **Technical Specifications** - Detailed tech specs
5. **Compliance Certificates** - Regulatory certifications
6. **Safety Data Sheet (SDS)** - Chemical safety information
7. **Care Instructions** - Maintenance and care guide
8. **Assembly Instructions** - Product assembly steps
9. **Troubleshooting Guide** - Problem-solving guide
10. **Installation Guide** - Installation instructions

### Features

#### Validation (`lukoValidateDocuments`)
- Validates ASIN and SKU format
- Ensures document type is from valid list
- Validates language codes
- Checks PDF URL format and HTTPS recommendation
- Validates file name ends with .pdf
- Detects duplicate documents (same ASIN + Type + Language)

#### Export (`lukoExportDocumentsToAmazon`)
- Uploads document metadata to Amazon
- Updates upload date on successful export
- Individual row status tracking

#### Bulk Operations
- `lukoBulkUploadDocuments` - Scan Google Drive folder and auto-create entries
- `lukoOrganizeDocumentsByProduct` - Sort by ASIN and Document Type
- `lukoGenerateDocumentCoverageReport` - Shows which products have which docs
- `lukoBulkSetDocumentVisibility` - Set visibility for multiple docs

### Best Practices

1. **Use descriptive titles** - Clear, user-friendly names
2. **Host on reliable CDN** - S3, CloudFront, or Google Cloud Storage
3. **HTTPS URLs only** - Security requirement
4. **Optimize file sizes** - Keep PDFs under 10 MB
5. **Provide multi-language docs** - Cover all target markets
6. **One document per type per language** - Avoid duplicates

---

## 3. Product Customization

### Overview
Enable product personalization features including text engraving, surface customization, and image uploads. Allows customers to personalize products before purchase.

### Sheet: `Customization`

**Location:** Amazon Manager → Extended Features → Customization

### Columns (58 total):

#### Core Fields
- **☑️ Export** - Checkbox to mark for export
- **ASIN** - Product identifier
- **SKU** - Stock Keeping Unit
- **Customization Enabled** - Yes/No

#### Text Customization (3 fields × 6 columns = 18 columns)
For each field (1, 2, 3):
- **Enabled** - Yes/No
- **Label** - Field label (e.g., "Your Name")
- **Max Characters** - Character limit (1-100)
- **Placeholder** - Placeholder text
- **Required** - Yes/No
- **Price** - Additional charge ($)

#### Surface Customization (5 options × 3 columns = 15 columns)
- **Surface Custom Enabled** - Master toggle
- For each surface (1-5):
  - **Name** - Surface option name (e.g., "Matte Finish")
  - **Enabled** - Yes/No
  - **Price** - Additional charge ($)

#### Image Upload Customization (7 columns)
- **Image Upload Enabled** - Yes/No
- **Min Width (px)** - Minimum image width
- **Min Height (px)** - Minimum image height
- **Max File Size (MB)** - File size limit
- **Allowed Formats** - JPG, PNG, PDF, etc.
- **Instructions** - Upload instructions for customer
- **Price** - Additional charge ($)

#### Pricing & Options (6 columns)
- **Customization Fee** - Base fee for any customization
- **Max Customization Price** - Price cap
- **Processing Time (days)** - Extra handling time
- **Allow Gift Message** - Yes/No
- **Gift Message Max Chars** - Character limit
- **Allow Gift Wrap** - Yes/No
- **Gift Wrap Price** - Gift wrap charge

#### Preview & Instructions (2 columns)
- **Preview Image URL** - Preview of customized product
- **Instructions Text** - General customization instructions

#### Status Tracking (5 columns)
- **Export Status** - PENDING/DONE/FAILED
- **Export DateTime** - Export timestamp
- **Last Modified** - Last update timestamp
- **Modified By** - User who made changes
- **Error Messages** - Export error details

### Features

#### Validation (`lukoValidateCustomization`)
- Validates at least one customization type enabled
- Checks text field max characters (1-100)
- Validates surface names for enabled surfaces
- Validates image upload dimensions and file size
- Checks all pricing fields are numeric and non-negative
- Validates processing time is reasonable (<30 days warning)

#### Export (`lukoExportCustomizationToAmazon`)
- Sends complete customization configuration to Amazon
- Handles all 3 customization types
- Individual product status tracking

#### Template Management (`lukoApplyCustomizationTemplate`)
**Pre-built templates:**

1. **Text Engraving Only**
   - 1 text field: "Engraving Text" (30 chars, $5.00)
   - 3 days processing

2. **Full Personalization**
   - Text Field 1: "Name" (20 chars, required, free)
   - Text Field 2: "Message" (50 chars, $3.00)
   - 3 Surfaces: Matte ($2), Glossy ($2), Wood Grain ($5)
   - Image Upload: 300×300px min, 5MB max ($10.00)
   - $5.00 base fee, 5 days processing

3. **Image Upload Only**
   - High-res image upload (800×800px, 10MB max)
   - JPG, PNG, PDF formats
   - $15.00 fee, 7 days processing

#### Bulk Operations
- `lukoBulkEnableCustomization` - Enable for multiple products
- `lukoBulkDisableCustomization` - Disable for multiple products

#### Pricing Calculator (`lukoCalculatePricing`)
- Shows pricing breakdown for all enabled options
- Calculates minimum price (required options only)
- Calculates maximum price (all options selected)
- Validates against max price limit
- Shows processing time

### Best Practices

1. **Clear labels** - Use customer-friendly field names
2. **Reasonable character limits** - 20-30 chars for names, 50-100 for messages
3. **Competitive pricing** - Research competitor customization fees
4. **Realistic processing times** - Account for production and shipping
5. **High-quality preview images** - Show what customization looks like
6. **Test all combinations** - Ensure pricing calculator works correctly

---

## 4. Brand Strip

### Overview
Create brand strips (banners) that appear at the top of product detail pages. Available in two types: Classic (logo + headline) and Enhanced (hero image + product showcase).

### Sheet: `Brand Strip`

**Location:** Amazon Manager → Extended Features → Brand Strip

### Columns (28 total):

#### Core Fields
- **☑️ Export** - Checkbox to mark for export
- **ASIN** - Product identifier
- **SKU** - Stock Keeping Unit
- **Strip Enabled** - Yes/No
- **Strip Type** - Classic or Enhanced

#### Classic Strip (6 columns)
- **Logo URL** - Brand logo image
- **Headline** - Text headline (max 100 chars)
- **Headline Color** - Hex color (#RRGGBB)
- **Background Color** - Hex color (#RRGGBB)
- **CTA Text** - Call-to-action button text
- **CTA URL** - Button destination URL

#### Enhanced Strip (12 columns)
- **Hero Image URL** - Large banner image
- **Hero Image Alt Text** - Accessibility text
- **Product Image 1-4** - Product showcase images
- **Product Title 1-4** - Captions for showcase products
- **Video URL** - Background/hero video
- **Video Thumbnail** - Video poster image
- **Brand Story** - Short brand description

#### Status Tracking (5 columns)
- **Export Status** - PENDING/DONE/FAILED
- **Export DateTime** - Export timestamp
- **Last Modified** - Last update
- **Modified By** - User
- **Error Messages** - Errors

### Strip Types

#### Classic Strip
- **Logo** - Brand logo (required)
- **Headline** - Text message
- **Colors** - Customizable headline and background
- **CTA Button** - Optional call-to-action

**Best for:** Simple branding, minimal design

#### Enhanced Strip
- **Hero Image** - Full-width banner
- **Product Showcase** - Up to 4 product images with titles
- **Video** - Background or hero video
- **Brand Story** - Rich text description

**Best for:** Premium products, brand storytelling

### Features

#### Validation
- `lukoValidateBrandStrip` - Validates all fields based on strip type
- Validates URL formats
- Checks color hex format (#RRGGBB)
- Warns about missing alt text
- Validates at least one product image for Enhanced

#### Export
- `lukoExportBrandStripToAmazon` - Exports to Amazon A+ Content API
- Individual product status tracking

### Best Practices

1. **High-quality images** - Minimum 1200px width for hero images
2. **Alt text for accessibility** - Always provide descriptive alt text
3. **Readable colors** - Ensure good contrast for headlines
4. **Consistent branding** - Match your brand guidelines
5. **Mobile-friendly** - Test on mobile devices
6. **Fast-loading videos** - Keep videos under 20 seconds

---

## 5. Brand Store

### Overview
Build multi-page Amazon Brand Stores with modular page construction. Create a dedicated branded shopping experience with multiple pages and 15 different module types.

### Sheets (4 total):
1. `BrandStore-Config` - Store-level configuration
2. `BrandStore-Homepage` - Homepage modules
3. `BrandStore-Page2` - Second page modules
4. `BrandStore-Page3` - Third page modules

**Location:** Amazon Manager → Extended Features → Brand Store

### BrandStore-Config Sheet (15 columns)

#### Store Configuration
- **Store Enabled** - Yes/No
- **Store Name** - Brand store name
- **Brand Logo URL** - Main logo
- **Brand Logo Alt Text** - Accessibility text
- **Primary Color** - Hex color (#RRGGBB)
- **Secondary Color** - Hex color (#RRGGBB)
- **Font Family** - Typography choice
- **Store Description** - Brief description

#### SEO & Metadata
- **Meta Title** - SEO title (50-60 chars)
- **Meta Description** - SEO description (150-160 chars)
- **Meta Keywords** - Comma-separated keywords
- **Favicon URL** - Browser icon
- **Header Image URL** - Store header
- **Footer Text** - Footer copyright/text

#### Status
- **Export Status** - PENDING/DONE/FAILED

### Page Sheets (BrandStore-Homepage, Page2, Page3) - 38 columns each

#### Module Core (4 columns)
- **☑ Include** - Checkbox to include module
- **Module Order** - Sort order (1, 2, 3...)
- **Module Type** - Dropdown with 15 types
- **Module Title** - Module heading

#### Images (9 columns)
- **Image URL** - Main image
- **Image Alt Text** - Accessibility text
- **Image 2-4 URL** - Additional images

#### Text Content (4 columns)
- **Headline Text** - Module headline
- **Body Text** - Main content
- **CTA Text** - Button text
- **CTA URL** - Button link

#### Product References (6 columns)
- **Product ASIN 1-6** - Products to showcase

#### Video (4 columns)
- **Video URL** - Video source
- **Video Thumbnail** - Poster image
- **Autoplay** - Yes/No
- **Loop** - Yes/No

#### Layout (6 columns)
- **Layout Type** - 1-Column, 2-Column, 3-Column, Grid
- **Column Count** - Number of columns (1-4)
- **Image Position** - Left, Right, Top, Bottom
- **Alignment** - Left, Center, Right
- **Background Color** - Hex color
- **Text Color** - Hex color

#### Advanced (3 columns)
- **Custom CSS** - Advanced styling
- **Animation Effect** - None, Fade, Slide, Zoom
- **Mobile Hidden** - Yes/No

#### Status (5 columns)
- **Export Status** - PENDING/DONE/FAILED
- **Export DateTime** - Timestamp
- **Last Modified** - Last update
- **Modified By** - User
- **Error Messages** - Errors

### Module Types (15 total)

1. **Hero Image** - Full-width banner
2. **Featured Products Grid** - Product grid (requires ASINs)
3. **Image & Text** - Side-by-side layout
4. **Product Gallery** - Product showcase
5. **Video** - Embedded video player
6. **Image Tiles** - Multi-image grid
7. **Shoppable Images** - Clickable product images
8. **Background Video** - Video with overlay
9. **Slider/Carousel** - Image carousel (min 2 images)
10. **Product Showcase** - Featured products
11. **Text Block** - Rich text content
12. **Category Links** - Navigation links
13. **Brand Story** - About section
14. **Social Proof** - Reviews/testimonials
15. **Newsletter Signup** - Email capture

### Features

#### Validation
- `lukoValidateBrandStoreConfig` - Validates store-level settings
- `lukoValidateBrandStoreHomepage` - Validates homepage modules
- `lukoValidateBrandStorePage2` - Validates page 2 modules
- `lukoValidateBrandStorePage3` - Validates page 3 modules

**Checks:**
- Module type-specific requirements
- Image URLs for image modules
- ASINs for product modules
- Video URLs for video modules
- Minimum 2 images for carousels
- Color hex format
- Module order uniqueness

#### Export
- `lukoExportBrandStoreToAmazon` - Exports complete store with all pages
- Validates config before export
- Collects all included modules from all pages
- Sorts modules by order
- Single transaction for entire store

#### Module Management
- `lukoAddModuleToBrandStorePage` - Interactive module creation
- Pre-fills template based on module type
- Auto-assigns next available order number

### Best Practices

1. **Plan your store structure** - Sketch layout before building
2. **Use consistent module order** - Keep logical flow
3. **High-quality images** - Minimum 1200px width
4. **Mobile-first design** - Test on mobile devices
5. **Limit modules per page** - 8-12 modules optimal
6. **Use module titles** - Helps with organization
7. **Test all ASINs** - Verify products exist
8. **Optimize performance** - Minimize large videos
9. **SEO optimization** - Complete all meta fields
10. **Brand consistency** - Use brand colors and fonts

---

## 6. Videos Management

### Overview
Manage product videos with comprehensive metadata. Support up to 3 videos per product with complete metadata including titles, descriptions, types, and languages.

### Sheet: `Videos`

**Location:** Amazon Manager → Extended Features → Videos

### Columns (29 total):

#### Core Fields
- **☑️ Export** - Checkbox to mark for export
- **ASIN** - Product identifier
- **SKU** - Stock Keeping Unit

#### Video 1 (7 columns)
- **Video 1 URL** - Video source URL (required)
- **Thumbnail** - Poster image URL
- **Duration** - Length (e.g., "1:30", "90")
- **Title** - Video title (max 100 chars)
- **Description** - Video description (max 500 chars)
- **Type** - Video type dropdown (10 types)
- **Language** - Video language

#### Video 2 (7 columns)
- Same structure as Video 1

#### Video 3 (7 columns)
- Same structure as Video 1

#### Summary & Status (5 columns)
- **Total Videos** - Count of videos (1-3)
- **Export Status** - PENDING/DONE/FAILED
- **Export DateTime** - Export timestamp
- **Last Modified** - Last update
- **Modified By** - User
- **Error Messages** - Export errors

### Video Types

1. **Product Demo** - Product in action
2. **How-To / Tutorial** - Usage instructions
3. **Unboxing** - Unpacking experience
4. **Customer Review** - User testimonials
5. **360° View** - Product rotation
6. **Lifestyle** - Product in real-world context
7. **Comparison** - vs competitors
8. **Installation Guide** - Setup instructions
9. **Features Overview** - Key features highlight
10. **Brand Story** - Brand narrative

### Features

#### Validation (`lukoValidateVideos`)
- Validates ASIN and SKU format
- Requires Video 1 URL (Videos 2-3 optional)
- Validates URL formats (HTTP/HTTPS)
- Recommends HTTPS for security
- Checks thumbnail URLs
- Validates duration format
- Warns about missing titles/descriptions
- Checks file sizes (<50MB recommended)
- Detects duplicate videos (same ASIN + Type + Language)

#### Export (`lukoExportVideosToAmazon`)
- Uploads all videos for each product
- Updates video metadata
- Individual product status tracking
- Batch processing

#### Bulk Operations
- `lukoAutoCalculateVideoCount` - Auto-fills "Total Videos" column
- `lukoBulkSetVideoType` - Set type for multiple videos
- `lukoBulkSetVideoLanguage` - Set language for multiple videos

#### Reporting
- `lukoGenerateVideoCoverageReport` - Comprehensive report:
  - Total products with/without videos
  - Average videos per product
  - Video types breakdown (%)
  - Language breakdown (%)

- `lukoCheckMissingVideoMetadata` - Quality check:
  - Identifies missing thumbnails
  - Flags missing durations
  - Finds missing titles
  - Lists up to 20 issues

### Best Practices

1. **Video Quality**
   - Minimum 1080p resolution
   - MP4 format recommended
   - Maximum 50MB file size
   - 15-90 seconds duration optimal

2. **Thumbnails**
   - High-quality poster images
   - Minimum 1200×675px (16:9 aspect ratio)
   - Representative of video content
   - Bright, clear, engaging

3. **Metadata**
   - Descriptive titles (under 100 chars)
   - Detailed descriptions (under 500 chars)
   - Accurate video types
   - Correct language codes

4. **Multiple Videos**
   - Use different video types (Demo + How-To + 360°)
   - Cover different use cases
   - Different languages for global markets
   - Order: Demo first, then Tutorial, then Lifestyle

5. **Hosting**
   - Use fast CDN (CloudFront, Vimeo, YouTube)
   - Direct video URLs (not embed codes)
   - HTTPS required
   - Test playback on mobile

6. **Compliance**
   - Follow Amazon video guidelines
   - No competitor mentions
   - Professional quality
   - Accurate product representation

---

## File Structure

### Apps Script Files (New)

```
apps-script/
├── SheetGeneratorExtension.gs  # 6 sheet generators
├── GpsrManager.gs               # GPSR compliance functions
├── DocumentsManager.gs          # Documents management
├── CustomizationManager.gs      # Product customization
├── BrandContentManager.gs       # Brand Strip + Brand Store
└── MediaManager.gs              # Videos management
```

### Cloud Function Updates

```
cloud-function/
└── index.js                     # Added 6 new endpoint handlers
    ├── exportGpsr
    ├── exportDocuments
    ├── exportCustomization
    ├── exportBrandStrip
    ├── exportBrandStore
    └── exportVideos
```

### Menu Structure

```
Amazon Manager Menu
└── Extended Features
    ├── GPSR Compliance
    │   ├── Validate GPSR Data
    │   ├── Export GPSR to Amazon
    │   ├── Generate GPSR Report
    │   ├── Bulk Update Status
    │   └── Copy Manufacturer to All Parties
    ├── Documents
    │   ├── Validate Documents
    │   ├── Export Documents to Amazon
    │   ├── Bulk Upload from Folder
    │   ├── Organize by Product
    │   ├── Generate Coverage Report
    │   └── Bulk Set Visibility
    ├── Customization
    │   ├── Validate Customization
    │   ├── Export Customization to Amazon
    │   ├── Apply Template
    │   ├── Bulk Enable
    │   ├── Bulk Disable
    │   └── Calculate Pricing
    ├── Brand Strip
    │   ├── Validate Brand Strip
    │   └── Export Brand Strip to Amazon
    ├── Brand Store
    │   ├── Validate Store Config
    │   ├── Validate Homepage
    │   ├── Validate Page 2
    │   ├── Validate Page 3
    │   ├── Export Complete Store to Amazon
    │   └── Add Module to Page
    └── Videos
        ├── Validate Videos
        ├── Export Videos to Amazon
        ├── Auto-Calculate Video Count
        ├── Bulk Set Video Type
        ├── Bulk Set Language
        ├── Generate Coverage Report
        └── Check Missing Metadata
```

---

## Naming Conventions

### ✅ DO (luko prefix in code)
- Function names: `lukoValidateGpsrData()`, `lukoExportDocuments()`
- Variable names: `lukoConfig`, `lukoResults`
- Script files: `LukoAmazonManager.gs`

### ❌ DON'T (no LUKO in UI)
- Sheet names: `GPSR Compliance` (not `LUKO GPSR`)
- Column headers: `ASIN`, `Export Status` (not `LUKO ASIN`)
- Menu items: `Extended Features` (not `LUKO Extended Features`)

**Reason:** "luko" is a technical namespace, "LUKO" in UI is redundant branding.

---

## Workflow

### Standard Workflow for All Features

1. **Fill Data** - Enter product data in the appropriate sheet
2. **Validate** - Run validation function to catch errors
3. **Fix Errors** - Correct any validation errors
4. **Mark for Export** - Check the ☑️ Export checkbox
5. **Export** - Run export function
6. **Monitor Status** - Check Export Status column (PENDING → DONE/FAILED)
7. **Review Errors** - Check Error Messages column for failures
8. **Re-export Failed** - Fix errors and re-export failed rows

### Example: GPSR Compliance Workflow

```
1. Open sheet: GPSR Compliance
2. Fill in ASIN, SKU, mark GPSR Compliant = Yes
3. Enter Manufacturer info (name, address, email, phone)
4. Add safety document URLs
5. Run: Amazon Manager → Extended Features → GPSR Compliance → Validate GPSR Data
6. Fix any errors shown in validation report
7. Check ☑️ Export checkbox for rows to export
8. Run: Export GPSR to Amazon
9. Monitor Export Status column (DONE = success)
10. Generate report: Generate GPSR Report
```

---

## Error Handling

### Validation Errors
- **Red highlights** - Invalid data in cells
- **Error messages** - Specific issues listed
- **Warnings** - Non-critical issues (yellow)

### Export Errors
- **Export Status = FAILED** - Export failed
- **Error Messages column** - Specific API error
- **ErrorLog sheet** - Centralized error log

### Common Errors

1. **Invalid ASIN format**
   - Fix: ASIN must be B followed by 9 alphanumeric (e.g., B08XYZ1234)

2. **Missing required fields**
   - Fix: Fill all required columns (marked in validation)

3. **Invalid URL format**
   - Fix: URLs must start with http:// or https://

4. **Invalid email format**
   - Fix: Use valid email format (user@domain.com)

5. **Cloud Function not configured**
   - Fix: Set Cloud Function URL in Config sheet

6. **API credentials invalid**
   - Fix: Update LWA credentials in Config sheet

---

## Testing

### Pre-Export Checklist

- [ ] Run validation on all data
- [ ] Fix all validation errors
- [ ] Check Cloud Function URL is configured
- [ ] Verify API credentials are current
- [ ] Test with 1-2 products first
- [ ] Monitor Export Status column
- [ ] Review any error messages
- [ ] Check ErrorLog sheet for issues

### Post-Export Verification

- [ ] Verify Export Status = DONE
- [ ] Check product on Amazon (ProductLink column)
- [ ] Confirm data appears correctly
- [ ] Test customer-facing features
- [ ] Verify mobile display (for Brand Store/Strip)
- [ ] Run coverage reports to verify completeness

---

## Support & Troubleshooting

### FAQ

**Q: Why is my export stuck on PENDING?**
A: Check Cloud Function logs. Verify credentials and network connectivity.

**Q: How do I bulk upload 100+ documents?**
A: Use `lukoBulkUploadDocuments` to scan a Google Drive folder.

**Q: Can I customize the validation rules?**
A: Yes, edit validation functions in manager .gs files.

**Q: How do I add custom module types to Brand Store?**
A: Edit `validModuleTypes` array in BrandContentManager.gs and SheetGeneratorExtension.gs.

**Q: What if Amazon API endpoints change?**
A: Update endpoint paths in index.js Cloud Function handlers.

### Getting Help

1. **Check ErrorLog sheet** - Detailed error messages
2. **Review validation reports** - Specific field issues
3. **Check Cloud Function logs** - API communication errors
4. **Consult Amazon SP-API docs** - API-specific requirements
5. **File GitHub issue** - Report bugs or request features

---

## Version History

### v2.1.0 (2025-01-19) - Phase 2: Extended Features
- ✅ Added GPSR Compliance management
- ✅ Added Documents management
- ✅ Added Product Customization
- ✅ Added Brand Strip
- ✅ Added Brand Store builder
- ✅ Added Videos management
- ✅ 6 new Apps Script files
- ✅ 10 new sheets (including Brand Store pages)
- ✅ 50+ new menu items
- ✅ 6 new Cloud Function endpoints

### v2.0.0 (Previous)
- Multi-marketplace support
- Template system
- Validation engine
- Phase 1 export functionality

---

## License

Copyright © 2025 LUKO-ACM Project
All rights reserved.

---

**End of Extended Features Documentation**
