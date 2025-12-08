# LUKO-ACM Spreadsheet Structure

Complete documentation of all sheet tabs and column structures for the LUKO Amazon Content Manager.

## CRITICAL: Naming Conventions

**NO "LUKO" prefix in:**
- Sheet tab names (✓ `Content-DE` ✗ `LUKO-Content-DE`)
- Column headers (✓ `Title [de-DE]` ✗ `LUKO Title [de-DE]`)
- User-facing elements

**Use "LUKO" prefix ONLY in:**
- Project name (LUKO-ACM)
- Code files (LukoAmazonManager.gs)
- Function names

---

## Sheet Overview

Total: 25+ tabs organized into 7 categories

### Administration (3 tabs)
- Config
- Marketplaces
- Logs

### Products (3 tabs)
- Products-Master
- Variants
- Customization

### Content (10 tabs - one per marketplace)
- Content-DE, Content-FR, Content-IT, Content-ES, Content-UK
- Content-NL, Content-BE, Content-PL, Content-SE, Content-IE

### Premium Content (4 tabs)
- APlus-Basic
- APlus-Premium
- BrandStore
- BrandStrip

### Media (3 tabs)
- Images
- Images-360
- Videos

### Promotions (3 tabs)
- Coupons
- Promotions
- Deals

### Templates (3 tabs)
- Templates-Content
- Templates-APlus
- Translation-Queue

---

## Detailed Sheet Structures

### Tab: Config

Purpose: Store API credentials and system configuration

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| Setting Name | Text | LWA Client ID | Setting identifier |
| Value | Text/Encrypted | amzn1.application-oa2-client... | Actual value |
| Description | Text | Login with Amazon credentials | User-friendly description |
| Status | Status | Active | Active/Inactive |

**Key Settings:**
- LWA Client ID
- LWA Client Secret
- Refresh Token
- Seller ID
- Cloud Function URL
- Default Marketplace
- Rate Limit Buffer
- Auto-Retry Failed

---

### Tab: Marketplaces

Purpose: Configure marketplace and language combinations

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| Marketplace | Text | DE | 2-letter code |
| Marketplace ID | Text | A1PA6795UKMFR9 | Amazon marketplace ID |
| Language Code | Text | de-DE | ISO language code |
| Language Name | Text | Deutsch | Display name |
| Primary | Checkbox | ✓ | Default language for marketplace |
| Export Active | Checkbox | ✓ | Include in exports |
| Content Status | Dropdown | Complete | Complete/Partial/Pending/Not Started |
| Last Sync | Date | 2024-01-15 | Last successful sync |

**Total Rows:** ~50 (10 marketplaces × ~5 languages each)

---

### Tab: Products-Master

Purpose: Central product registry across all marketplaces

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| ☑️ | Checkbox | ☑ | Select for operations |
| ASIN | Text | B08XYZ1234 | Amazon Standard ID |
| Parent ASIN | Text | B08XYZ0000 | If this is a variant |
| SKU | Text | PROD-001-RED-L | Seller SKU |
| Product Type | Text | PRODUCT | Amazon product type |
| Brand | Text | YourBrand | Brand name |
| Marketplaces Active | Text | DE,FR,UK | Active marketplaces |
| Has Variations | Checkbox | ✓ | Has child ASINs |
| Is Customizable | Checkbox | | Personalization enabled |
| Has APlus | Checkbox | ✓ | Has A+ content |
| Has Video | Checkbox | | Has product video |
| FBA/MFN | Dropdown | FBA | Fulfillment method |
| Status | Dropdown | Active | Active/Inactive/Suspended |
| Created Date | Date | 2024-01-01 | Creation timestamp |
| Last Modified | Date | 2024-01-15 | Last edit timestamp |
| Action | Dropdown | SYNC | SYNC/CREATE/DELETE |

---

### Tab: Content-{Marketplace}

Purpose: Store all content for one marketplace in all its languages

Example: **Content-DE** (German marketplace)

#### Fixed Columns

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | Select for sync |
| ASIN | Text | Product identifier |
| SKU | Text | Seller SKU |
| Product Type | Text | Amazon product type |

#### Repeated for Each Language (de-DE, en-GB, pl-PL, tr-TR, cs-CZ, da-DK)

**Title Section**
- `Title [de-DE]` - Text, max 200 chars
- `Title [en-GB]` - Text, max 200 chars
- `Title [pl-PL]` - Text, max 200 chars
- ... (one column per active language)

**Brand Section**
- `Brand [de-DE]` - Text, max 50 chars
- `Brand [en-GB]` - Text, max 50 chars
- ... (one column per active language)

**Bullet Points Section**
- `Bullet1 [de-DE]` - Text, max 500 chars
- `Bullet1 [en-GB]` - Text, max 500 chars
- ... (repeat for Bullet2-5 per language)

**Description Section**
- `Description [de-DE]` - Text, max 2000 chars
- `Description [en-GB]` - Text, max 2000 chars
- ... (one column per active language)

**Keywords Section**
- `Keywords [de-DE]` - Text, max 250 bytes
- `Keywords [en-GB]` - Text, max 250 bytes
- ... (one column per active language)

**About Brand Section**
- `About Brand [de-DE]` - Text, max 500 chars
- `About Brand [en-GB]` - Text, max 500 chars
- ... (one column per active language)

**Target Audience Section**
- `Target Audience [de-DE]` - Text, max 500 chars
- `Target Audience [en-GB]` - Text, max 500 chars
- ... (one column per active language)

#### Metadata Columns

| Column | Data Type | Notes |
|--------|-----------|-------|
| Languages Completed | Text | de-DE, en-GB |
| Languages Synced | Text | de-DE |
| Last Sync Date | Date | Last successful sync |
| Status | Dropdown | Complete/Partial/Pending/Error |
| Errors | Text | Error messages |
| Action | Dropdown | SYNC/SKIP |

**Total Columns:** ~45 (4 fixed + ~40 language-specific + 6 metadata)

---

### Tab: Variants

Purpose: Manage parent-child product relationships

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| ☑️ | Checkbox | ☑ | Select for operations |
| Parent ASIN | Text | B08XYZ0000 | Parent product |
| Parent Title | Text | Classic T-Shirt | Parent name |
| Child ASIN | Text | B08XYZ1234 | Variant ASIN |
| Child SKU | Text | TSHIRT-RED-L | Variant SKU |
| Variation Theme | Text | SizeColor | Variation type |
| Size | Text | L | Size value |
| Color | Text | Red | Color value |
| Style | Text | Classic | Style value |
| Material | Text | Cotton | Material value |
| Pattern | Text | Solid | Pattern value |
| ColorMap (HEX) | Text | #FF0000 | Hex color code |
| Size Standard | Text | EU | Size standard |
| Relative Price (+/-) | Number | +5.00 | Price difference |
| Relative Shipping (+/-) | Number | 0 | Shipping difference |
| Child Image URL | URL | https://... | Variant-specific image |
| Specific Attributes | JSON | {"fit":"slim"} | Additional attrs |
| Inventory Qty | Number | 150 | Stock level |
| Status | Dropdown | Active | Status |
| Action | Dropdown | SYNC | Operation |

---

### Tab: Customization

Purpose: Configure product personalization options

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| ☑️ | Checkbox | ☑ | |
| ASIN | Text | B08XYZ1234 | |
| SKU | Text | PROD-001 | |
| Customization Enabled | Checkbox | ✓ | |
| Customization Type | Dropdown | Text+Graphics | Text/Graphics/Both |

**Text Field 1**
- `Text Field 1 Name [lang]` - Multi-language field names
- `Text Field 1 Max Chars` - Number, max length
- `Text Field 1 Required` - Checkbox

**Text Field 2** (same structure)
**Text Field 3** (same structure)

**Graphics Options**
- `Allow Custom Graphics` - Checkbox
- `Max File Size MB` - Number
- `Allowed Formats` - Text (JPG,PNG,PDF)

**Customization Options**
- `Surface Type` - Dropdown (Engraved/Printed/Embroidered)
- `Available Colors` - Text (Red,Blue,Green)
- `Available Fonts` - Text (Arial,Times,etc)
- `Preview Template URL` - URL

**Pricing**
- `Base Price` - Number
- `Price Per Character` - Number
- `Graphics Upload Fee` - Number
- `Rush Order Available` - Checkbox
- `Rush Fee` - Number
- `Lead Time Days` - Number

**Instructions**
- `Customization Instructions [lang]` - Multi-language instructions
- `Example Images` - URL
- `Status` - Dropdown
- `Action` - Dropdown

---

### Tab: Images

Purpose: Manage product images across all marketplaces

| Column | Data Type | Example | Notes |
|--------|-----------|---------|-------|
| ☑️ | Checkbox | ☑ | |
| ASIN | Text | B08XYZ1234 | |
| SKU | Text | PROD-001 | |
| Marketplace | Dropdown | DE | |
| Main Image URL | URL | https://... | Primary image |
| Main Image Status | Status | Uploaded | |

**For each additional image (1-8):**
- `Alt Image [N] URL` - URL
- `Alt Text [N] [lang]` - Multi-language alt text
- `Status [N]` - Status

**Metadata**
- `Last Upload` - Date
- `Errors` - Text
- `Action` - Dropdown

**Total Columns:** ~75 (5 fixed + 8×8 images + 3 metadata)

---

### Tab: Images-360

Purpose: Manage 360° product views

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| ASIN | Text | |
| SKU | Text | |
| 360° View Enabled | Checkbox | |
| Frame 1 URL...Frame 36 URL | URL | 36 image frames |
| Rotation Direction | Dropdown | CW/CCW |
| Speed | Number | Rotation speed |
| Auto-Start | Checkbox | Auto-play |
| Preview Image | URL | Thumbnail |
| Upload Status | Status | |
| Action | Dropdown | |

---

### Tab: Videos

Purpose: Manage product videos

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| ASIN | Text | |
| SKU | Text | |
| Marketplace | Dropdown | |
| Video URL | URL | Video location |
| Video Type | Dropdown | Main/Related |
| Thumbnail URL | URL | Video thumbnail |
| Duration (sec) | Number | Length in seconds |
| Video Title [lang] | Text | Multi-language titles |
| Video Description [lang] | Text | Multi-language descriptions |
| Upload Date | Date | |
| Status | Status | |
| Platform | Dropdown | YouTube/Amazon |
| Action | Dropdown | |

---

### Tab: APlus-Basic

Purpose: Manage A+ Basic Content modules

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| ASIN | Text | |
| Content ID | Text | Unique content ID |
| Module Number | Number | Module order (1-7) |
| Module Type | Dropdown | Module template type |
| Language | Dropdown | Content language |
| Status | Status | |

**Module Content (per language)**
- `Heading [lang]` - Text, max 100 chars
- `Subheading [lang]` - Text, max 100 chars
- `Body Text [lang]` - Text, max 2000 chars
- `Body Text 2 [lang]` - Text, max 2000 chars

**Images**
- `Image 1 URL` - URL
- `Image 1 Alt [lang]` - Multi-language alt text
- (Repeat for Image 2-4)

**Call to Action**
- `CTA Text [lang]` - Text
- `CTA Link` - URL

**Metadata**
- `Module Order` - Number
- `Last Modified` - Date
- `Action` - Dropdown

**Supported Module Types:**
1. Standard Company Logo
2. Standard Image & Text
3. Standard Multiple Images (4-grid)
4. Standard Text
5. Standard Single Image & Highlights
6. Standard Comparison Table
7. Standard Four Images & Text
8. Standard Tech Specs
9. Standard Image & Light Text

---

### Tab: APlus-Premium

Purpose: Manage A+ Premium Brand Story content

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| ASIN | Text | |
| Brand Story ID | Text | Unique ID |
| Module Type | Dropdown | Module type |
| Language | Dropdown | |

**Hero Section**
- `Hero Image URL` - URL
- `Hero Video URL` - URL
- `Brand Logo URL` - URL
- `Tagline [lang]` - Multi-language tagline

**Story Modules (1-7)**
For each module:
- `Module [N] Type` - Dropdown
- `Module [N] Heading [lang]` - Text
- `Module [N] Text [lang]` - Text
- `Module [N] Image 1-3` - URLs
- `Module [N] Video URL` - URL

**Carousel**
- `Carousel Image 1-7` - URLs
- `Carousel Caption [lang] 1-7` - Multi-language captions

**Metadata**
- `Status` - Status
- `Published Date` - Date
- `Action` - Dropdown

---

### Tab: BrandStore

Purpose: Manage Amazon Brand Store pages

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Store ID | Text | Unique store ID |
| Brand | Text | Brand name |
| Marketplace | Dropdown | |
| Language | Dropdown | |

**Store Structure**
For each page (1-10):
- `Page [N] Name [lang]` - Multi-language page names
- `Page [N] URL` - Text (slug)
- `Page [N] Template` - Dropdown

**Navigation**
- `Nav Logo URL` - URL
- `Nav Menu Items [lang]` - Multi-language menu

**Homepage**
- `Hero Banner URL` - URL
- `Hero Text [lang]` - Multi-language text
- `Hero CTA [lang]` - Multi-language CTA
- `Featured Category 1-6` - Text

**Content Tiles (1-20)**
For each tile:
- `Tile [N] Image` - URL
- `Tile [N] Title [lang]` - Multi-language titles
- `Tile [N] ASINs` - Text (comma-separated)

**Metadata**
- `Status` - Status
- `Last Published` - Date
- `Action` - Dropdown

---

### Tab: BrandStrip

Purpose: Manage brand header/footer banners

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| ASIN | Text | |
| Marketplace | Dropdown | |
| Language | Dropdown | |
| Strip Type | Dropdown | Header/Footer |
| Image URL | URL | Banner image |
| Background Color (HEX) | Text | Hex color code |
| Text [lang] | Text | Multi-language text |
| CTA Text [lang] | Text | Multi-language CTA |
| CTA Link | URL | |
| Mobile Image URL | URL | Mobile-optimized |
| Desktop Image URL | URL | Desktop-optimized |
| Status | Status | |
| Action | Dropdown | |

---

### Tab: Coupons

Purpose: Configure Amazon coupons

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Coupon ID | Text | System-generated |
| ASIN | Text | |
| SKU | Text | |
| Marketplace | Dropdown | |
| Coupon Type | Dropdown | Percentage/Money Off/BOGO |

**Discount**
- `Discount Value` - Number (10 or 10.00)
- `Min Purchase Amount` - Number
- `Max Discount Cap` - Number
- `Currency` - Dropdown (EUR/GBP/PLN/SEK)
- `Apply To` - Dropdown (Item/Shipping/Both)

**Eligibility**
- `Customer Type` - Dropdown (All/Prime/New)
- `Tier` - Dropdown (Silver/Gold/VIP)

**Duration**
- `Start Date` - Date
- `Start Time` - Time
- `End Date` - Date
- `End Time` - Time
- `Timezone` - Dropdown

**Budget**
- `Total Budget` - Number
- `Budget Per Customer` - Number
- `Redemption Limit` - Number
- `Current Usage` - Number (auto-calculated)
- `Remaining Budget` - Number (auto-calculated)

**Display**
- `Badge Text [lang]` - Multi-language badge text
- `Badge Color` - Dropdown (Red/Orange/Blue)
- `Show On Product Page` - Checkbox

**Metadata**
- `Status` - Status
- `Created Date` - Date
- `Action` - Dropdown

---

### Tab: Promotions

Purpose: Set up promotional campaigns

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Promotion ID | Text | System ID |
| Name [lang] | Text | Multi-language promo name |
| Type | Dropdown | Promotion type |
| Marketplace | Dropdown | |

**Promotion Mechanics**
- `Promotion Type` - Dropdown (Lightning Deal/Best Deal/Deal of Day/Prime Day)

**Qualifying Products**
- `ASIN 1-20` - Text (multiple ASINs)
- `Quantity Required` - Number
- `Min Purchase` - Number

**Rewards**
- `Discount Type` - Dropdown (%/Fixed/Free Shipping/BOGO)
- `Reward Value` - Number
- `Max Discount` - Number
- `Free Item ASIN` - Text

**Schedule**
- `Start Date/Time` - DateTime
- `End Date/Time` - DateTime
- `Timezone` - Dropdown
- `Deal Price` - Number
- `Deal Stock Qty` - Number
- `Deal Limit Per Customer` - Number

**Visibility**
- `Show Deal Badge` - Checkbox
- `Deal Badge Text [lang]` - Multi-language
- `Deal Category` - Dropdown
- `Push Notification` - Checkbox
- `Email Alert` - Checkbox

**Performance**
- `Target Impressions` - Number
- `Target Click-Through` - Number
- `Target Conversion` - Number
- `Current Views` - Number (auto-updated)
- `Current Orders` - Number (auto-updated)
- `ROI` - Percent (auto-calculated)

**Metadata**
- `Status` - Status
- `Action` - Dropdown

---

### Tab: Deals

Purpose: Manage time-limited deals

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Deal ID | Text | Amazon deal ID |
| ASIN | Text | |
| Deal Type | Dropdown | Lightning/Best/7-Day |
| Marketplace | Dropdown | |

**Deal Setup**
- `Deal Name [lang]` - Multi-language names
- `Deal Description [lang]` - Multi-language descriptions
- `Original Price` - Number
- `Deal Price` - Number
- `Discount %` - Percent (auto-calculated)
- `Savings` - Number (auto-calculated)

**Inventory**
- `Deal Units Total` - Number
- `Units Sold` - Number (auto-updated)
- `Units Remaining` - Number (auto-calculated)
- `Max Per Customer` - Number
- `Inventory Source` - Dropdown (FBA/MFN)

**Timing**
- `Submission Date` - Date
- `Review Status` - Dropdown (Pending/Approved/Rejected)
- `Approval Date` - Date
- `Live Start` - DateTime
- `Live End` - DateTime
- `Total Duration Hours` - Number (auto-calculated)
- `Pre-Deal Reminder` - Checkbox
- `Post-Deal Follow-up` - Checkbox

**Requirements**
- `Min Rating Required` - Number (4.0)
- `Min Reviews Required` - Number (15)
- `Current Rating` - Number (auto-fetched)
- `Current Reviews` - Number (auto-fetched)
- `Eligible` - Checkbox (auto-calculated)

**Fees**
- `Deal Fee` - Number
- `Fee Currency` - Dropdown
- `Fee Payment Status` - Status

**Performance**
- `Projected Units` - Number
- `Actual Units` - Number (auto-updated)
- `Conversion Rate` - Percent (auto-calculated)
- `Revenue` - Number (auto-calculated)
- `Profit` - Number (auto-calculated)
- `ROI %` - Percent (auto-calculated)

**Metadata**
- `Status` - Status
- `Action` - Dropdown

---

### Tab: Templates-Content

Purpose: Reusable content templates

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Template Name | Text | Template identifier |
| Product Category | Dropdown | Category this applies to |
| Language | Dropdown | Template language |

**Title Templates**
- `Title Format` - Text with variables
- `Title Variables` - Text (comma-separated)
- `Title Example` - Text (preview)

**Bullets Templates**
For each bullet (1-5):
- `Bullet [N] Format` - Text with variables
- `Bullet [N] Variables` - Text

**Description Template**
- `Description Format` - Text with variables
- `Description Variables` - Text

**Keywords Template**
- `Keyword Strategy` - Text
- `Keyword Format` - Text

**Metadata**
- `Usage Count` - Number (auto-tracked)
- `Last Used` - Date
- `Action` - Dropdown

**Available Variables:**
- `{BRAND}` - Brand name
- `{PRODUCT_NAME}` - Product name
- `{SIZE}` - Size
- `{COLOR}` - Color
- `{MATERIAL}` - Material
- `{KEY_FEATURE_1}` - Feature 1
- `{KEY_FEATURE_2}` - Feature 2
- `{USP}` - Unique selling proposition
- `{TARGET_AUDIENCE}` - Target audience
- `{WARRANTY}` - Warranty info
- `{CERTIFICATION}` - Certifications

**Example Template:**
```
Title Format: {BRAND} {PRODUCT_NAME} - {KEY_FEATURE_1} | {SIZE} | {WARRANTY}
Result: YourBrand Classic T-Shirt - 100% Cotton | Large | 2 Year Warranty
```

---

### Tab: Templates-APlus

Purpose: Reusable A+ Content templates

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Template Name | Text | Template identifier |
| Module Type | Dropdown | A+ module type |
| Industry | Dropdown | Industry/category |
| Language | Dropdown | Template language |

**Modules (1-7)**
For each module:
- `Module [N] Type` - Dropdown
- `Module [N] Heading Template` - Text with variables
- `Module [N] Text Template` - Text with variables
- `Module [N] Image Slots` - Number (1-4)

**Variables & Preview**
- `Template Variables` - Text (list of variables)
- `Preview URL` - URL (mockup)
- `Usage Count` - Number
- `Action` - Dropdown

---

### Tab: Translation-Queue

Purpose: Manage translation workflow

| Column | Data Type | Notes |
|--------|-----------|-------|
| ☑️ | Checkbox | |
| Queue ID | Text | Unique queue ID |
| ASIN | Text | |
| Content Type | Dropdown | Title/Bullets/Description/APlus |
| Source Language | Dropdown | Original language |
| Target Languages | Multi-select | Languages to translate to |
| Priority | Dropdown | High/Medium/Low |
| Requested Date | Date | |
| Deadline | Date | |

**Source Content**
- `Source Title` - Text
- `Source Bullets` - Text
- `Source Description` - Text

**Translation Status**
For each marketplace language:
- `DE Status` - Status (Pending/In Progress/Complete)
- `FR Status` - Status
- `IT Status` - Status
- ... (one per marketplace)

**Translation Details**
- `Translation Method` - Dropdown (Manual/API/Hybrid)
- `Translator Assigned` - Text (user email)
- `Progress %` - Percent (auto-calculated)
- `Completed Date` - Date
- `Quality Score` - Number (1-5)
- `Reviewer` - Text (user email)
- `Action` - Dropdown

---

### Tab: Logs

Purpose: System operation logs and audit trail

| Column | Data Type | Notes |
|--------|-----------|-------|
| Timestamp | DateTime | Operation time |
| User | Text | User email |
| Marketplace | Text | Target marketplace |
| Language | Text | Language code |
| ASIN | Text | Product identifier |
| Operation Type | Text | SYNC_PRODUCTS/UPLOAD_IMAGES/etc |
| Details | JSON | Full operation details |
| Status | Status | SUCCESS/ERROR |
| Response Code | Number | HTTP response code |
| Response Message | Text | Error message if failed |
| Duration (ms) | Number | Operation duration |
| Retry Count | Number | Number of retries |
| Error Details | Text | Detailed error info |
| Resolution | Text | How it was fixed |

**Auto-populated by system**

---

## Data Validation Rules

### ASIN Format
- Pattern: `^[A-Z0-9]{10}$`
- Example: `B08XYZ1234`

### SKU Format
- Max length: 40 characters
- Allowed: Alphanumeric, hyphen, underscore
- Example: `PROD-001-RED-L`

### Language Codes
- Format: ISO 639-1 + ISO 3166-1 (e.g., `de-DE`, `en-GB`)

### URLs
- Must start with `http://` or `https://`
- Image URLs should point to accessible images

### Character Limits

| Field | Max Characters |
|-------|----------------|
| Title | 200 |
| Brand | 50 |
| Bullet Point | 500 |
| Description | 2000 |
| Keywords | 250 bytes |
| About Brand | 500 |

---

## Conditional Formatting

### Status Colors
- **Green**: Complete, SUCCESS, Active
- **Yellow**: Partial, Pending, In Progress
- **Red**: ERROR, Failed, Suspended
- **Gray**: Not Started, Inactive

### Data Completeness
- **Green**: All required fields filled
- **Yellow**: Some required fields missing
- **Red**: Critical fields missing

### Character Count
- **Green**: < 80% of limit
- **Yellow**: 80-95% of limit
- **Red**: > 95% of limit

---

## Sheet Protection

### Read-Only Columns
- System IDs (auto-generated)
- Auto-calculated fields (e.g., ROI, Remaining Budget)
- Timestamps (auto-updated)
- Status fields (updated by system)

### User-Editable Columns
- All content fields
- Configuration settings
- Actions/operations

---

## Notes

1. **Multi-language columns** follow the pattern: `FieldName [lang-CODE]`
2. **Checkboxes** in first column for row selection
3. **Dropdown validation** enforced on all dropdown fields
4. **Auto-calculated fields** use formulas, don't edit manually
5. **Required fields** highlighted with bold headers

---

For implementation questions, see `DEPLOYMENT.md`
For API details, see `API_REFERENCE.md`
For user instructions, see `USER_GUIDE.md`
