# Google Forms to APlusBasic/APlusPremium Auto-Import Integration v3.0

## CRITICAL: Simplified Column Format (NO Language Suffixes!)

**Version 3.0 uses SIMPLIFIED column names WITHOUT language suffixes.**

The language is controlled by a separate "Language" dropdown field in the form, NOT by column name suffixes.

## Overview

```
Claude -> Google Form -> ClaudeAPlusQueue -> Apps Script -> APlusBasic OR APlusPremium
```

1. Claude submits form with JSON payload + Marketplace + Language dropdowns
2. Response recorded in ClaudeAPlusQueue sheet
3. Trigger fires onFormSubmit() function
4. JSON parsed and validated
5. Marketplace/Language injected into each module from form fields
6. Modules written to appropriate sheet at first empty row
7. Export checkbox set to TRUE automatically

## Form Structure

**Form URL:** https://docs.google.com/forms/d/1LDysIzwc5kfSBG3cAT7cDKnWlx6w-Sj9vJw2YhbrYI8/edit

**Response Sheet:** ClaudeAPlusQueue

| Column | Field | Description |
|--------|-------|-------------|
| A | Timestamp | Auto-generated |
| B | JSON | Module data payload |
| C | Marketplace | Dropdown: DE, UK, FR, IT, ES, NL, PL, SE |
| D | Language | Dropdown: DE, EN, FR, IT, ES, NL, PL, SE |

**IMPORTANT:** Marketplace and Language are injected from form dropdowns, NOT from JSON!

---

## JSON Format (v3 - SIMPLIFIED)

### Basic Structure

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_HEADER_IMAGE_TEXT",
        "m1_headline": "Your Headline Here",
        "m1_body": "Your body text with **bold** and *italic* formatting.",
        "m1_image_id": "amazon_a_plus_placeholder_970x600_header.png"
      }
    }
  ]
}
```

### Routing Rules

| Module Type prefix | Target Sheet |
|---|---|
| `STANDARD_...` | APlusBasic |
| `PREMIUM_...` | APlusPremium |

---

## APlusBasic Column Names (SIMPLIFIED)

### Base Columns
```
ASIN
Module Number
Module Type
contentReferenceKey
Marketplace        (auto-filled from form)
Language           (auto-filled from form)
Status
ExportDateTime
ErrorMessage
```

### Module 1 Columns (m1_)
```
m1_headline
m1_subheadline
m1_body
m1_image_url
m1_image_id
m1_image_altText
m1_imagePositionType
m1_companyLogo_url
m1_companyLogo_id
m1_companyDescription
m1_overlayColorType
m1_highlight1
m1_highlight2
m1_highlight3
m1_highlight4
m1_image1_url
m1_image1_id
m1_image2_url
m1_image2_id
m1_image3_url
m1_image3_id
m1_image4_url
m1_image4_id
m1_block1_headline
m1_block1_body
m1_block2_headline
m1_block2_body
m1_block3_headline
m1_block3_body
m1_block4_headline
m1_block4_body
```

### Module 2-7 Columns
Same pattern with `m2_`, `m3_`, `m4_`, `m5_`, `m6_`, `m7_` prefix.

---

## APlusPremium Column Names (SIMPLIFIED)

### Base Columns
```
ASIN
Module Number
Module Type
contentReferenceKey
Marketplace        (auto-filled from form)
Language           (auto-filled from form)
Status
ExportDateTime
ErrorMessage
```

### Module 1 Columns (m1_)
```
m1_headline
m1_body
m1_image_url
m1_image_id
m1_backgroundImage_url
m1_backgroundImage_id
m1_image1_url
m1_image1_id
m1_image2_url
m1_image2_id
m1_image3_url
m1_image3_id
m1_image4_url
m1_image4_id
m1_image5_url
m1_image5_id
m1_image6_url
m1_image6_id
m1_image7_url
m1_image7_id
m1_image8_url
m1_image8_id
```

### Module 2-3 Columns
Same pattern with `m2_`, `m3_` prefix.

---

## JSON Examples

### Example 1: STANDARD_HEADER_IMAGE_TEXT

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_HEADER_IMAGE_TEXT",
        "m1_headline": "Fur Manner, die wissen, was gute Socken ausmacht",
        "m1_body": "Es gibt Dinge, bei denen sich Qualitat nicht verstecken lasst. **Jeden Tag. Bei jedem Schritt.**",
        "m1_image_id": "amazon_a_plus_placeholder_970x600_header.png"
      }
    }
  ]
}
```

### Example 2: STANDARD_FOUR_IMAGE_TEXT

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 2,
        "Module Type": "STANDARD_FOUR_IMAGE_TEXT",
        "m2_headline": "4 Grunde fur ULLMYS",
        "m2_block1_headline": "Naturliche Warme",
        "m2_block1_body": "80% Merinowolle isoliert bei Kalte und kuhlt bei Warme.",
        "m2_image1_id": "amazon_a_plus_placeholder_220x220_multiple.png",
        "m2_block2_headline": "Angenehmer Halt",
        "m2_block2_body": "Der offene Rand halt ohne zu kneifen.",
        "m2_image2_id": "amazon_a_plus_placeholder_220x220_multiple.png",
        "m2_block3_headline": "Schlank im Schuh",
        "m2_block3_body": "Normale Starke statt dicker Wintersocken.",
        "m2_image3_id": "amazon_a_plus_placeholder_220x220_multiple.png",
        "m2_block4_headline": "Made in Europe",
        "m2_block4_body": "Gefertigt in Lettland unter fairen Bedingungen.",
        "m2_image4_id": "amazon_a_plus_placeholder_220x220_multiple.png"
      }
    }
  ]
}
```

### Example 3: STANDARD_SINGLE_SIDE_IMAGE

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 3,
        "Module Type": "STANDARD_SINGLE_SIDE_IMAGE",
        "m3_headline": "Die Zusammensetzung, die den Unterschied macht",
        "m3_body": "**80% Merinowolle:** Warmt bei Kalte, kuhlt bei Warme.\n\n**18% Baumwolle:** Weichheit und Formstabilitat.\n\n**2% Elastan:** Perfekter Sitz ohne Verrutschen.",
        "m3_image_id": "amazon_a_plus_placeholder_300x300_square.png",
        "m3_imagePositionType": "LEFT"
      }
    }
  ]
}
```

### Example 4: STANDARD_THREE_IMAGE_TEXT

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 4,
        "Module Type": "STANDARD_THREE_IMAGE_TEXT",
        "m4_headline": "Vom Meeting bis zum Feierabend",
        "m4_block1_headline": "9:00 - Im Buro",
        "m4_block1_body": "Klimaanlage, lange Sitzungen, enge Schuhe. Merinowolle reguliert.",
        "m4_image1_id": "amazon_a_plus_placeholder_300x300_square.png",
        "m4_block2_headline": "14:00 - Unterwegs",
        "m4_block2_body": "Termine, Treppen, Kilometer. Die Socke sitzt noch genauso.",
        "m4_image2_id": "amazon_a_plus_placeholder_300x300_square.png",
        "m4_block3_headline": "19:00 - Nach der Arbeit",
        "m4_block3_body": "Ihre Fusse sind immer noch frisch.",
        "m4_image3_id": "amazon_a_plus_placeholder_300x300_square.png"
      }
    }
  ]
}
```

### Example 5: STANDARD_TEXT

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 5,
        "Module Type": "STANDARD_TEXT",
        "m5_headline": "ULLMYS - Weil Details den Unterschied machen",
        "m5_body": "Manche Dinge merkt man erst, wenn sie fehlen.\n\n**Was Sie bekommen:**\n\n- Socken aus **80% Merinowolle**\n- Einen offenen Bund, der halt ohne zu wurgen\n- Europaische Fertigung\n\n**Tag fur Tag. Schritt fur Schritt.**"
      }
    }
  ]
}
```

### Example 6: Complete 5-Module Basic A+ Set

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_HEADER_IMAGE_TEXT",
        "m1_headline": "Fur Manner, die wissen, was gute Socken ausmacht",
        "m1_body": "ULLMYS Merino-Socken werden aus 80% feinster Merinowolle in Europa gefertigt.",
        "m1_image_id": "amazon_a_plus_placeholder_970x600_header.png"
      }
    },
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 2,
        "Module Type": "STANDARD_FOUR_IMAGE_TEXT",
        "m2_headline": "Was ULLMYS anders macht",
        "m2_block1_headline": "80% echte Merinowolle",
        "m2_block1_body": "Das ist der Unterschied zwischen Marketing und Material.",
        "m2_image1_id": "amazon_a_plus_placeholder_220x220_multiple.png",
        "m2_block2_headline": "Der offene Bund",
        "m2_block2_body": "Die Socke bleibt oben, Ihr Bein bleibt frei.",
        "m2_image2_id": "amazon_a_plus_placeholder_220x220_multiple.png",
        "m2_block3_headline": "Normale Dicke",
        "m2_block3_body": "Passt in jeden Schuh, den Sie besitzen.",
        "m2_image3_id": "amazon_a_plus_placeholder_220x220_multiple.png",
        "m2_block4_headline": "Gefertigt in Lettland",
        "m2_block4_body": "Europaische Handwerkskunst, faire Bedingungen.",
        "m2_image4_id": "amazon_a_plus_placeholder_220x220_multiple.png"
      }
    },
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 3,
        "Module Type": "STANDARD_SINGLE_SIDE_IMAGE",
        "m3_headline": "Die Zusammensetzung",
        "m3_body": "**80% Merinowolle** - **18% Baumwolle** - **2% Elastan**\n\n98% Naturfasern. Made in Europe.",
        "m3_image_id": "amazon_a_plus_placeholder_300x300_square.png",
        "m3_imagePositionType": "LEFT"
      }
    },
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 4,
        "Module Type": "STANDARD_THREE_IMAGE_TEXT",
        "m4_headline": "Vom Meeting bis zum Feierabend",
        "m4_block1_headline": "9:00 - Im Buro",
        "m4_block1_body": "Merinowolle reguliert, wahrend Sie arbeiten.",
        "m4_image1_id": "amazon_a_plus_placeholder_300x300_square.png",
        "m4_block2_headline": "14:00 - Unterwegs",
        "m4_block2_body": "Die Socke sitzt noch genauso wie heute Morgen.",
        "m4_image2_id": "amazon_a_plus_placeholder_300x300_square.png",
        "m4_block3_headline": "19:00 - Nach der Arbeit",
        "m4_block3_body": "Ihre Fusse sind immer noch frisch.",
        "m4_image3_id": "amazon_a_plus_placeholder_300x300_square.png"
      }
    },
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 5,
        "Module Type": "STANDARD_TEXT",
        "m5_headline": "ULLMYS - Weil Details den Unterschied machen",
        "m5_body": "Wir haben ULLMYS fur Manner entwickelt, die keine Lust auf Kompromisse haben.\n\n**98% Naturfasern. Made in Europe.**"
      }
    }
  ]
}
```

### Example 7: PREMIUM_IMAGE_CAROUSEL

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "PREMIUM_IMAGE_CAROUSEL",
        "m1_headline": "Entdecken Sie alle Vorteile",
        "m1_body": "Premium Merinowolle fur hochsten Komfort.",
        "m1_image1_id": "amazon_a_plus_placeholder_800x600_video_with_text_thumbnail.png",
        "m1_image2_id": "amazon_a_plus_placeholder_800x600_video_with_text_thumbnail.png",
        "m1_image3_id": "amazon_a_plus_placeholder_800x600_video_with_text_thumbnail.png"
      }
    }
  ]
}
```

### Example 8: PREMIUM_FULL_BACKGROUND_TEXT

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 2,
        "Module Type": "PREMIUM_FULL_BACKGROUND_TEXT",
        "m2_headline": "Premium Merinowolle",
        "m2_body": "Erleben Sie den Unterschied von echtem Merino.",
        "m2_backgroundImage_id": "amazon_a_plus_placeholder_1940x600_premium_background.png"
      }
    }
  ]
}
```

### Example 9: PREMIUM_IMAGE_TEXT

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 3,
        "Module Type": "PREMIUM_IMAGE_TEXT",
        "m3_headline": "Europaische Qualitat",
        "m3_body": "Made in Europe steht fur hochste Qualitatsstandards.",
        "m3_image_id": "amazon_a_plus_placeholder_650x350_premium_single_dual.png"
      }
    }
  ]
}
```

---

## Module Types Reference

### Basic Module Types (15) - API-SUPPORTED

| Module Type | Description | Key Columns |
|---|---|---|
| `STANDARD_TEXT` | Text only | headline, body |
| `STANDARD_SINGLE_SIDE_IMAGE` | Image + text | headline, body, image_id, imagePositionType |
| `STANDARD_HEADER_IMAGE_TEXT` | Header image + text | headline, body, image_id |
| `STANDARD_COMPANY_LOGO` | Logo + description | headline, companyLogo_id, companyDescription |
| `STANDARD_IMAGE_TEXT_OVERLAY` | Image with overlay | headline, body, image_id, overlayColorType |
| `STANDARD_SINGLE_IMAGE_HIGHLIGHTS` | Image + bullets | headline, image_id, highlight1-4 |
| `STANDARD_MULTIPLE_IMAGE_TEXT` | Text + 4 images | headline, body, image1-4_id |
| `STANDARD_FOUR_IMAGE_TEXT` | 4 image blocks | headline, block1-4_headline, block1-4_body, image1-4_id |
| `STANDARD_FOUR_IMAGE_TEXT_QUADRANT` | 4 image grid | headline, image1-4_id |
| `STANDARD_THREE_IMAGE_TEXT` | 3 image blocks | headline, block1-3_headline, block1-3_body, image1-3_id |
| `STANDARD_COMPARISON_TABLE` | Product comparison | (complex structure) |
| `STANDARD_PRODUCT_DESCRIPTION` | Long description | headline, body |
| `STANDARD_SINGLE_IMAGE_SPECS_DETAIL` | Image + specs | headline, image_id, spec1-5 |
| `STANDARD_IMAGE_SIDEBAR` | Text + sidebar image | headline, body, image_id |
| `STANDARD_TECH_SPECS` | Technical specs | headline, body |

### Premium Module Types (5) - API-SUPPORTED

| Module Type | Description | Key Columns |
|---|---|---|
| `PREMIUM_TEXT` | Enhanced text | headline, body |
| `PREMIUM_IMAGE_TEXT` | Image + text | headline, body, image_id |
| `PREMIUM_FULL_BACKGROUND_TEXT` | Background + overlay | headline, body, backgroundImage_id |
| `PREMIUM_FULL_BACKGROUND_IMAGE` | Background only | backgroundImage_id |
| `PREMIUM_IMAGE_CAROUSEL` | Up to 8 images | headline, body, image1-8_id |

---

## Text Formatting Support

Claude prompts can include formatting markers:

| Input | Output |
|-------|--------|
| `**bold text**` | STYLE_BOLD |
| `*italic text*` | STYLE_ITALIC |
| `- item` (at line start) | LIST_ITEM (bullet) |
| `1. item` (at line start) | LIST_ORDERED |

Example:
```
This is **bold** and *italic* text with a list:
- First bullet point
- Second bullet point
1. Numbered item one
2. Numbered item two
```

---

## JSON Formatting Rules

### ASCII Characters Only!

**NEVER use:**
- German quotes: (U+201E), (U+201C), (U+201D)
- Smart quotes: (U+2018), (U+2019)
- Em dash: (U+2014)
- En dash: (U+2013)

**ALWAYS use:**
- Straight double quotes: `"`
- Regular apostrophe: `'`
- Regular hyphen: `-`

### Example - WRONG:
```json
{
  "m1_body": "Das sagen Kunden: 'Perfekt' - sehr gut"
}
```

### Example - CORRECT:
```json
{
  "m1_body": "Das sagen Kunden: 'Perfekt' - sehr gut"
}
```

---

## Migration from v2.0

### OLD Format (v2.0 - DO NOT USE):
```json
{
  "columns": {
    "aplus_basic_m1_headline_DE": "German headline",
    "aplus_basic_m1_headline_EN": "English headline",
    "aplus_basic_m1_body_DE": "German body"
  }
}
```

### NEW Format (v3.0 - USE THIS):
```json
{
  "columns": {
    "m1_headline": "Headline in target language",
    "m1_body": "Body in target language"
  }
}
```

**Key differences:**
1. NO `aplus_basic_` or `aplus_premium_` prefix
2. NO `_DE`, `_EN`, etc. language suffix
3. Language controlled by form dropdown field
4. Simpler, cleaner column names

---

## Troubleshooting

### "Column name not found in headers" Warning
**Cause:** Using old column names with language suffixes
**Solution:** Use simplified names: `m1_headline` instead of `aplus_basic_m1_headline_DE`

### Modules Go to Wrong Sheet
**Cause:** Wrong Module Type value
**Solution:** Ensure Module Type starts with `STANDARD_` or `PREMIUM_`

### JSON Parse Error
**Cause:** Smart quotes or special characters
**Solution:** Use only ASCII characters

---

## Best Practices

1. **Use simplified column names** - `m1_headline`, NOT `aplus_basic_m1_headline_DE`
2. **Set language via form dropdown** - NOT in column names
3. **Use ASCII characters only** in text values
4. **Include Module Type** with correct prefix (STANDARD_ or PREMIUM_)
5. **Validate JSON** at jsonlint.com before submitting

---

**Version:** 3.0
**Last Updated:** 2024-12-17
**Breaking Changes:** Simplified column names (no language suffixes)
**Status:** Production Ready
