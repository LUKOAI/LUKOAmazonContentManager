# Google Forms → APlusBasic/APlusPremium Auto-Import Integration v2.0

## Overview

Automated system that imports A+ Content data from Google Form submissions directly into the appropriate sheet:
- **STANDARD modules** → `APlusBasic` sheet
- **PREMIUM modules** → `APlusPremium` sheet

Claude can submit A+ Content modules via Google Forms, and they automatically populate your spreadsheet based on module type.

## How It Works

```
Claude → Google Form → ClaudeAPlusQueue → Apps Script → APlusBasic OR APlusPremium
```

1. **Claude submits form** with JSON payload
2. **Response recorded** in `ClaudeAPlusQueue` sheet
3. **Trigger fires** `onFormSubmit()` function
4. **JSON parsed** and validated
5. **Modules separated** by type (STANDARD vs PREMIUM)
6. **Modules written** to appropriate sheet at first empty row
7. **☑️ Export set to TRUE** automatically for new imports
8. **Notification shown** with success/error details

## Form Structure

**Form URL:** https://docs.google.com/forms/d/1LDysIzwc5kfSBG3cAT7cDKnWlx6w-Sj9vJw2YhbrYI8/edit

**Response Sheet:** `ClaudeAPlusQueue`
- Column A: Timestamp (auto-generated)
- Column B: JSON payload (from Claude)

---

## JSON Format

### Basic Structure

Claude submits JSON with column **names** (not just letters):

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_SINGLE_SIDE_IMAGE",
        "aplus_basic_m1_headline_DE": "Deutsche Überschrift",
        "aplus_basic_m1_headline_EN": "English Headline",
        "aplus_basic_m1_body_DE": "Deutscher Text hier...",
        "aplus_basic_m1_body_EN": "English body text here...",
        "aplus_basic_m1_image_id": "aplus-media-library-service-media/uuid.jpg",
        "aplus_basic_m1_imagePositionType": "RIGHT"
      }
    }
  ]
}
```

### Routing Rules

| Module Type prefix | Target Sheet | Columns prefix |
|---|---|---|
| `STANDARD_...` | APlusBasic | `aplus_basic_m1_...` |
| `PREMIUM_...` | APlusPremium | `aplus_premium_m1_...` |

**CRITICAL:** The `Module Type` value determines which sheet receives the data!

---

## APlusBasic Column Names

### Base Columns (all modules)
```
☑️ Export
ASIN
Module Number
Module Type
contentReferenceKey
Status
ExportDateTime
ErrorMessage
```

### Module 1 Content Columns
```
aplus_basic_m1_headline_DE
aplus_basic_m1_headline_EN
aplus_basic_m1_headline_FR
aplus_basic_m1_headline_IT
aplus_basic_m1_headline_ES
aplus_basic_m1_headline_NL
aplus_basic_m1_headline_PL
aplus_basic_m1_headline_SE
aplus_basic_m1_body_DE
aplus_basic_m1_body_EN
aplus_basic_m1_body_FR
aplus_basic_m1_body_IT
aplus_basic_m1_body_ES
aplus_basic_m1_body_NL
aplus_basic_m1_body_PL
aplus_basic_m1_body_SE
```

### Module 1 Image Columns
```
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_imagePositionType
aplus_basic_m1_companyLogo_url
aplus_basic_m1_companyLogo_id
aplus_basic_m1_overlayColorType
aplus_basic_m1_image1_url
aplus_basic_m1_image1_id
aplus_basic_m1_image2_url
aplus_basic_m1_image2_id
aplus_basic_m1_image3_url
aplus_basic_m1_image3_id
aplus_basic_m1_image4_url
aplus_basic_m1_image4_id
```

### Module 1 Additional Columns
```
aplus_basic_m1_companyDescription_DE
aplus_basic_m1_companyDescription_EN
aplus_basic_m1_highlight1_DE
aplus_basic_m1_highlight1_EN
aplus_basic_m1_highlight2_DE
aplus_basic_m1_highlight2_EN
aplus_basic_m1_highlight3_DE
aplus_basic_m1_highlight3_EN
aplus_basic_m1_highlight4_DE
aplus_basic_m1_highlight4_EN
aplus_basic_m1_block1_headline_DE
aplus_basic_m1_block1_headline_EN
aplus_basic_m1_block1_body_DE
aplus_basic_m1_block1_body_EN
(repeat for block2, block3, block4)
```

### Modules 2-7
Same pattern with `m2_`, `m3_`, etc. prefix.

---

## APlusPremium Column Names

### Base Columns (all modules)
```
☑️ Export
ASIN
Module Number
Module Type
contentReferenceKey
Status
ExportDateTime
ErrorMessage
```

### Module 1 Content Columns (8 languages)
```
aplus_premium_m1_headline_DE
aplus_premium_m1_headline_EN
aplus_premium_m1_headline_FR
aplus_premium_m1_headline_IT
aplus_premium_m1_headline_ES
aplus_premium_m1_headline_NL
aplus_premium_m1_headline_PL
aplus_premium_m1_headline_SE
aplus_premium_m1_body_DE
aplus_premium_m1_body_EN
aplus_premium_m1_body_FR
aplus_premium_m1_body_IT
aplus_premium_m1_body_ES
aplus_premium_m1_body_NL
aplus_premium_m1_body_PL
aplus_premium_m1_body_SE
```

### Module 1 Image Columns
```
aplus_premium_m1_image_url
aplus_premium_m1_image_id
aplus_premium_m1_backgroundImage_url
aplus_premium_m1_backgroundImage_id
aplus_premium_m1_image1_url
aplus_premium_m1_image1_id
aplus_premium_m1_image2_url
aplus_premium_m1_image2_id
aplus_premium_m1_image3_url
aplus_premium_m1_image3_id
aplus_premium_m1_image4_url
aplus_premium_m1_image4_id
aplus_premium_m1_image5_url
aplus_premium_m1_image5_id
aplus_premium_m1_image6_url
aplus_premium_m1_image6_id
aplus_premium_m1_image7_url
aplus_premium_m1_image7_id
aplus_premium_m1_image8_url
aplus_premium_m1_image8_id
```

### Module 2 (DE/EN only)
```
aplus_premium_m2_headline_DE
aplus_premium_m2_headline_EN
aplus_premium_m2_body_DE
aplus_premium_m2_body_EN
aplus_premium_m2_image_url
aplus_premium_m2_image_id
aplus_premium_m2_backgroundImage_url
aplus_premium_m2_backgroundImage_id
aplus_premium_m2_image1_url ... aplus_premium_m2_image8_id
```

### Module 3 (DE only)
```
aplus_premium_m3_headline_DE
aplus_premium_m3_body_DE
aplus_premium_m3_image_url
aplus_premium_m3_image_id
aplus_premium_m3_backgroundImage_url
aplus_premium_m3_backgroundImage_id
```

---

## JSON Examples

### Example 1: STANDARD_TEXT (Basic)

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_TEXT",
        "aplus_basic_m1_headline_DE": "Natürliche Wärme für kalte Tage",
        "aplus_basic_m1_headline_EN": "Natural Warmth for Cold Days",
        "aplus_basic_m1_body_DE": "Unsere Merinowolle bietet hervorragende Wärmeisolierung bei gleichzeitiger Atmungsaktivität.",
        "aplus_basic_m1_body_EN": "Our merino wool offers excellent thermal insulation while remaining breathable."
      }
    }
  ]
}
```

### Example 2: STANDARD_SINGLE_SIDE_IMAGE (Basic)

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_SINGLE_SIDE_IMAGE",
        "aplus_basic_m1_headline_DE": "Premium Qualität",
        "aplus_basic_m1_headline_EN": "Premium Quality",
        "aplus_basic_m1_body_DE": "86% Merinowolle für höchsten Tragekomfort.",
        "aplus_basic_m1_body_EN": "86% merino wool for ultimate wearing comfort.",
        "aplus_basic_m1_image_id": "aplus-media-library-service-media/uuid-here.jpg",
        "aplus_basic_m1_imagePositionType": "RIGHT"
      }
    }
  ]
}
```

### Example 3: STANDARD_FOUR_IMAGE_TEXT (Basic)

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 2,
        "Module Type": "STANDARD_FOUR_IMAGE_TEXT",
        "aplus_basic_m2_headline_DE": "4 Gründe für ULLMYS",
        "aplus_basic_m2_headline_EN": "4 Reasons for ULLMYS",
        "aplus_basic_m2_block1_headline_DE": "Natürlich warm",
        "aplus_basic_m2_block1_body_DE": "Merinowolle reguliert die Temperatur.",
        "aplus_basic_m2_image1_id": "aplus-media-library-service-media/feature1.jpg",
        "aplus_basic_m2_block2_headline_DE": "Antibakteriell",
        "aplus_basic_m2_block2_body_DE": "Lanolin wirkt natürlich antibakteriell.",
        "aplus_basic_m2_image2_id": "aplus-media-library-service-media/feature2.jpg",
        "aplus_basic_m2_block3_headline_DE": "Feuchtigkeitsregulierend",
        "aplus_basic_m2_block3_body_DE": "Absorbiert bis zu 30% Feuchtigkeit.",
        "aplus_basic_m2_image3_id": "aplus-media-library-service-media/feature3.jpg",
        "aplus_basic_m2_block4_headline_DE": "Made in Europe",
        "aplus_basic_m2_block4_body_DE": "Produziert in der EU.",
        "aplus_basic_m2_image4_id": "aplus-media-library-service-media/feature4.jpg"
      }
    }
  ]
}
```

### Example 4: PREMIUM_IMAGE_CAROUSEL (Premium)

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "PREMIUM_IMAGE_CAROUSEL",
        "aplus_premium_m1_headline_DE": "Entdecken Sie alle Vorteile",
        "aplus_premium_m1_headline_EN": "Discover All Benefits",
        "aplus_premium_m1_body_DE": "Premium Merinowolle für höchsten Komfort.",
        "aplus_premium_m1_body_EN": "Premium merino wool for ultimate comfort.",
        "aplus_premium_m1_image1_id": "aplus-media-library-service-media/carousel1.jpg",
        "aplus_premium_m1_image2_id": "aplus-media-library-service-media/carousel2.jpg",
        "aplus_premium_m1_image3_id": "aplus-media-library-service-media/carousel3.jpg",
        "aplus_premium_m1_image4_id": "aplus-media-library-service-media/carousel4.jpg",
        "aplus_premium_m1_image5_id": "aplus-media-library-service-media/carousel5.jpg",
        "aplus_premium_m1_image6_id": "aplus-media-library-service-media/carousel6.jpg"
      }
    }
  ]
}
```

### Example 5: PREMIUM_FULL_BACKGROUND_TEXT (Premium)

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "PREMIUM_FULL_BACKGROUND_TEXT",
        "aplus_premium_m1_headline_DE": "Premium Merinowolle",
        "aplus_premium_m1_headline_EN": "Premium Merino Wool",
        "aplus_premium_m1_body_DE": "Erleben Sie den Unterschied von echtem Merino.",
        "aplus_premium_m1_body_EN": "Experience the difference of real merino.",
        "aplus_premium_m1_backgroundImage_id": "aplus-media-library-service-media/background.jpg"
      }
    }
  ]
}
```

### Example 6: Multiple Modules (Mixed)

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "PREMIUM_IMAGE_CAROUSEL",
        "aplus_premium_m1_headline_DE": "Hero Carousel",
        "aplus_premium_m1_image1_id": "aplus-media-library-service-media/img1.jpg",
        "aplus_premium_m1_image2_id": "aplus-media-library-service-media/img2.jpg"
      }
    },
    {
      "row": null,
      "columns": {
        "☑️ Export": true,
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 2,
        "Module Type": "PREMIUM_IMAGE_TEXT",
        "aplus_premium_m2_headline_DE": "Zweites Modul",
        "aplus_premium_m2_body_DE": "Beschreibung hier...",
        "aplus_premium_m2_image_id": "aplus-media-library-service-media/img3.jpg"
      }
    }
  ]
}
```

---

## Module Types Reference

### Basic Module Types (15)

| Module Type | Description | Required Images |
|---|---|---|
| `STANDARD_TEXT` | Text only | None |
| `STANDARD_SINGLE_SIDE_IMAGE` | Image + text side by side | 1x 300x300 |
| `STANDARD_HEADER_IMAGE_TEXT` | Header image + text below | 1x 970x600 |
| `STANDARD_COMPANY_LOGO` | Logo + description | 1x 600x180 |
| `STANDARD_IMAGE_TEXT_OVERLAY` | Image with text overlay | 1x 970x300 |
| `STANDARD_SINGLE_IMAGE_HIGHLIGHTS` | Image + 4 bullet points | 1x 300x300 |
| `STANDARD_MULTIPLE_IMAGE_TEXT` | Text + up to 4 images | 4x 220x220 |
| `STANDARD_FOUR_IMAGE_TEXT` | 4 images with text blocks | 4x 220x220 |
| `STANDARD_FOUR_IMAGE_TEXT_QUADRANT` | 4 images in grid | 4x 135x135 |
| `STANDARD_THREE_IMAGE_TEXT` | 3 images with text blocks | 3x 300x300 |
| `STANDARD_COMPARISON_TABLE` | Product comparison | 6x 150x300 |
| `STANDARD_PRODUCT_DESCRIPTION` | Long text description | None |
| `STANDARD_SINGLE_IMAGE_SPECS_DETAIL` | Image + specs table | 1x 300x400 |
| `STANDARD_IMAGE_SIDEBAR` | Text + sidebar image | 1x 300x300 |
| `STANDARD_TECH_SPECS` | Technical specifications | None |

### Premium Module Types (19)

| Module Type | Description | Required Images |
|---|---|---|
| `PREMIUM_TEXT` | Enhanced text | None |
| `PREMIUM_SINGLE_IMAGE` | Large single image | 1x 1464x600 |
| `PREMIUM_IMAGE_TEXT` | Image + text | 1x 1464x600 |
| `PREMIUM_FULL_BACKGROUND_TEXT` | Background + overlay text | 1x 1940x600 |
| `PREMIUM_FULL_BACKGROUND_IMAGE` | Background only | 1x 1940x600 |
| `PREMIUM_IMAGE_CAROUSEL` | Up to 8 carousel images | 8x 362x453 |
| `PREMIUM_FOUR_IMAGE_CAROUSEL` | 4 carousel images | 4x 362x453 |
| `PREMIUM_THREE_IMAGE_TEXT` | 3 images with text | 3x 362x453 |
| `PREMIUM_FOUR_IMAGE_TEXT` | 4 images with text | 4x 362x453 |
| `PREMIUM_COMPARISON_CHART` | Product comparison | 6x 220x220 |
| `PREMIUM_HOTSPOT_IMAGE` | Interactive hotspots | 1x 1940x600 |
| `PREMIUM_NAVIGATION_CAROUSEL` | Multi-panel carousel | 5x 1464x600 |
| `PREMIUM_REGIMEN_CAROUSEL` | Step-by-step carousel | 5x 1464x600 |
| `PREMIUM_SIMPLE_IMAGE_CAROUSEL` | Auto-rotating images | 8x 1464x600 |
| `PREMIUM_VIDEO_IMAGE_CAROUSEL` | Video + images | 6x 800x600 |
| `PREMIUM_FULL_VIDEO` | Full-width video | Video + thumbnail |
| `PREMIUM_VIDEO_WITH_TEXT` | Video + text | Video + thumbnail |
| `PREMIUM_QA` | Q&A section | 6x 300x300 (optional) |
| `PREMIUM_TECHNICAL_SPECIFICATIONS` | Enhanced tech specs | None |

---

## JSON Formatting Rules

### CRITICAL: ASCII Characters Only!

**NEVER use these characters:**
- ❌ German quotes: `„` (U+201E), `"` (U+201C), `"` (U+201D)
- ❌ Smart quotes: `'` (U+2018), `'` (U+2019)
- ❌ Em dash: `—` (U+2014)
- ❌ En dash: `–` (U+2013)

**ALWAYS use these instead:**
- ✅ Straight double quotes: `"`
- ✅ Regular apostrophe: `'`
- ✅ Regular hyphen: `-`

### Example - WRONG:
```json
{
  "aplus_basic_m1_body_DE": "Das sagen Kunden: „Perfekt" – sehr gut"
}
```

### Example - CORRECT:
```json
{
  "aplus_basic_m1_body_DE": "Das sagen Kunden: 'Perfekt' - sehr gut"
}
```

---

## Setup Instructions

### 1. Deploy Script

```bash
cd C:\Users\user\Desktop\NetAnaliza-Deploy

curl -k -L -o FormImport.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/fix-session-loading-pmhJ8/apps-script/FormImport.gs

clasp push --force
```

### 2. Create Trigger

1. Open spreadsheet → **Extensions → Apps Script**
2. Click **Triggers** (clock icon)
3. Click **+ Add Trigger**
4. Configure:
   - Function: `onFormSubmit`
   - Deployment: `Head`
   - Event source: `From spreadsheet`
   - Event type: `On form submit`
5. Click **Save** and authorize

### 3. Verify

Run `testFormImport()` in Apps Script editor to test.

---

## Features

### ✅ Automatic Sheet Routing
- Detects `Module Type` value
- Routes `STANDARD_*` to APlusBasic
- Routes `PREMIUM_*` to APlusPremium
- Creates APlusPremium sheet if missing

### ✅ Column Name Mapping
- Uses actual column names from row 3 headers
- Supports both letter codes (A, B, C) and names
- Handles all columns from A to ZZ

### ✅ Automatic Checkbox Setting
- Sets `☑️ Export` to TRUE for new imports
- Sets `Status` to PENDING
- Ready for immediate publishing

### ✅ Error Handling
- Invalid JSON → Clear error message
- Missing sheet → Auto-creates APlusPremium
- Unknown columns → Logged and skipped

---

## Troubleshooting

### Modules Go to Wrong Sheet
**Cause:** Wrong `Module Type` value
**Solution:** Ensure `Module Type` starts with `STANDARD_` or `PREMIUM_`

### Column Not Found Warning
**Cause:** Column name doesn't match sheet headers
**Solution:** Check exact column names in row 3 of target sheet

### JSON Parse Error
**Cause:** Smart quotes or special characters
**Solution:** Use only ASCII characters, validate at jsonlint.com

### ☑️ Export Not Checked
**Cause:** Old script version
**Solution:** Update FormImport.gs - new version sets ☑️ Export = TRUE automatically

---

## Best Practices for Claude

1. **Always validate JSON** before submitting
2. **Use column names** instead of letters when possible
3. **Include Module Type** with correct prefix
4. **Use ASCII characters** only in text values
5. **Test with single module** before submitting multiple
6. **Check uploadDestinationIds** are correct format

---

**Version:** 2.0
**Last Updated:** 2025-12-15
**Changes from v1.0:**
- Added APlusPremium routing
- Added column name support
- Added automatic ☑️ Export = TRUE
- Added automatic Status = PENDING
