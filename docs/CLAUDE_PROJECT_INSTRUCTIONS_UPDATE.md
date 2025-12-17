# Claude Project Instructions - Required Updates

## CRITICAL: Column Name Changes (v3.0)

The spreadsheet now uses **SIMPLIFIED column names** without language suffixes.
The language is controlled by a separate form dropdown field.

## What Changed

### OLD Format (v2.0) - DO NOT USE:
```
aplus_basic_m1_headline_DE
aplus_basic_m1_headline_EN
aplus_basic_m1_body_DE
aplus_basic_m1_body_EN
aplus_basic_m1_image_id
```

### NEW Format (v3.0) - USE THIS:
```
m1_headline
m1_body
m1_image_id
```

## Changes Required in Claude Project Instructions

### 1. Replace JSON Examples

**OLD:**
```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_HEADER_IMAGE_TEXT",
        "aplus_basic_m1_headline_DE": "Deutsche Uberschrift",
        "aplus_basic_m1_headline_EN": "English Headline",
        "aplus_basic_m1_body_DE": "Deutscher Text hier...",
        "aplus_basic_m1_body_EN": "English body text here...",
        "aplus_basic_m1_image_id": "placeholder.png"
      }
    }
  ]
}
```

**NEW:**
```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "ASIN": "B0FNRLYQ3G",
        "Module Number": 1,
        "Module Type": "STANDARD_HEADER_IMAGE_TEXT",
        "m1_headline": "Headline in target language",
        "m1_body": "Body text in target language",
        "m1_image_id": "placeholder.png"
      }
    }
  ]
}
```

### 2. Replace Column Reference Lists

**Remove these sections:**
```
#### APlusBasic Module 1 Content Columns
aplus_basic_m1_headline_DE
aplus_basic_m1_headline_EN
aplus_basic_m1_headline_FR
...
```

**Replace with:**
```
#### Module 1 Columns (m1_)
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

### 3. Add Language Dropdown Note

Add this note at the beginning of the JSON section:

```
## IMPORTANT: Language Selection

The language is controlled by a **separate form dropdown field**, NOT by column name suffixes.

When submitting the form:
- Select target language from "Language" dropdown (DE, EN, FR, IT, ES, NL, PL, SE)
- Write all content in that selected language
- Do NOT include language codes in column names

Example: For German content, select "DE" in form dropdown and use:
- "m1_headline": "Deutsche Uberschrift"
- NOT: "aplus_basic_m1_headline_DE": "..."
```

### 4. Update Form Structure Description

**OLD:**
```
Form Fields:
- Timestamp
- JSON payload
```

**NEW:**
```
Form Fields:
- Column A: Timestamp (auto-generated)
- Column B: JSON payload (from Claude)
- Column C: Marketplace dropdown (DE, UK, FR, IT, ES, NL, PL, SE)
- Column D: Language dropdown (DE, EN, FR, IT, ES, NL, PL, SE)
```

### 5. Remove Multi-Language Column References

Remove all references to generating content in multiple languages within the same JSON submission.
Each form submission should be for ONE language only (selected via dropdown).

## Summary of Key Changes

| Aspect | OLD (v2.0) | NEW (v3.0) |
|--------|-----------|-----------|
| Column prefix | `aplus_basic_m1_` | `m1_` |
| Language suffix | `_DE`, `_EN`, etc. | None |
| Language selection | In column name | Form dropdown |
| Multi-language | Multiple columns | Multiple submissions |
| Module number in column | `m1_`, `m2_`, etc. | Same |

## Test Example

Use this JSON to test (select "DE" in Language dropdown):

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
    }
  ]
}
```

## Reference Document

See `docs/GOOGLE_FORMS_INTEGRATION_V3.md` for complete column reference and JSON examples.
