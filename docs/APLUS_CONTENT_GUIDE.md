# NetAnaliza Amazon A+ Content Manager - Complete Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Column Structure](#column-structure)
4. [All Module Types](#all-module-types)
5. [Working with Images](#working-with-images)
6. [Publishing Process](#publishing-process)
7. [Checking Status](#checking-status)
8. [Troubleshooting](#troubleshooting)

## Overview

NetAnaliza Amazon A+ Content Manager allows you to create and publish A+ Content directly from Google Sheets to Amazon SP-API.

### Key Features

- ✅ **All 20 Module Types** - Support for all A+ Basic and Premium modules
- ✅ **Multi-language Support** - DE, EN, FR, IT, ES, NL, PL, SE
- ✅ **Image Management** - Automatic upload to Amazon Content Assets
- ✅ **Status Tracking** - Real-time status checking
- ✅ **Multi-client** - Manage multiple Amazon seller accounts
- ✅ **Direct SP-API** - No Cloud Functions required

## Getting Started

### 1. Sheet Setup

Your sheet must have headers in **Row 3**. Structure:

```
Row 1: [Empty or title]
Row 2: [Empty or subtitle]
Row 3: Headers (☑️ Export | ASIN | Module Number | Module Type | ...)
Row 4+: Your data
```

### 2. Required Columns

Every module MUST have these columns:

| Column | Description | Example |
|--------|-------------|---------|
| ☑️ Export | Checkbox to mark for export | TRUE |
| ASIN | Product ASIN | B0FNRLYQ3G |
| Module Number | Module number (1-7) | 1 |
| Module Type | Type of module | STANDARD_TEXT |

### 3. Module-Specific Columns

Add columns based on your module type. See [Column Structure](#column-structure) below.

## Column Structure

### Naming Convention

Format: `aplus_basic_m{number}_{field}_{language}`

Examples:
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_EN
aplus_basic_m2_image1_url
aplus_basic_m2_image1_id
```

### Text Fields

#### Headline/Heading Fields (TextComponent)
- No textList wrapper
- Direct value + decoratorSet
- Used for: headline, heading, title
- Max length: 80-160 characters

```json
{
  "value": "Your headline text",
  "decoratorSet": []
}
```

#### Body/Description Fields (ParagraphComponent)
- Requires textList wrapper
- Array of value + decoratorSet objects
- Used for: body, description, paragraph
- Max length: 5000 characters

```json
{
  "textList": [
    {
      "value": "Your body text",
      "decoratorSet": []
    }
  ]
}
```

### Image Fields

For each image, you need TWO columns:

1. `{field}_url` - Image URL (for upload)
2. `{field}_id` - Amazon uploadDestinationId (auto-filled after upload)

Example:
```
aplus_basic_m1_image_url: https://example.com/image.jpg
aplus_basic_m1_image_id: [Auto-filled by system]
```

## All Module Types

### Basic Modules (Standard)

#### 1. STANDARD_TEXT
Simple text block without images.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_headline_EN
aplus_basic_m1_body_DE
aplus_basic_m1_body_EN
```

**Use case:** Product descriptions, feature explanations

---

#### 2. STANDARD_SINGLE_SIDE_IMAGE
Text with an image on the side.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_imagePositionType (LEFT or RIGHT)
```

**Use case:** Product features with supporting image

---

#### 3. STANDARD_HEADER_IMAGE_TEXT
Header image with text below.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
```

**Use case:** Hero sections, brand stories

---

#### 4. STANDARD_COMPANY_LOGO
Company logo with description.

**Columns:**
```
aplus_basic_m1_companyDescription_DE
aplus_basic_m1_companyLogo_url
aplus_basic_m1_companyLogo_id
```

**Use case:** Brand introduction, about us

---

#### 5. STANDARD_IMAGE_TEXT_OVERLAY
Image with text overlay.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_overlayColorType (BLACK or WHITE)
```

**Use case:** Lifestyle images with captions

---

#### 6. STANDARD_SINGLE_IMAGE_HIGHLIGHTS
Image with 4 bullet points.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_highlight1_DE
aplus_basic_m1_highlight2_DE
aplus_basic_m1_highlight3_DE
aplus_basic_m1_highlight4_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
```

**Use case:** Key features list with image

---

#### 7. STANDARD_MULTIPLE_IMAGE_TEXT
Headline + body text with up to 4 images.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image1_url
aplus_basic_m1_image1_id
aplus_basic_m1_image2_url
aplus_basic_m1_image2_id
(up to image4)
```

**Use case:** Product gallery with description

---

#### 8. STANDARD_FOUR_IMAGE_TEXT
Four images with individual headlines and descriptions.

**Columns:**
```
aplus_basic_m1_headline_DE (main headline)
aplus_basic_m1_block1_headline_DE
aplus_basic_m1_block1_body_DE
aplus_basic_m1_image1_url
aplus_basic_m1_image1_id
(repeat for block2-4)
```

**Use case:** Feature breakdown with visuals

---

#### 9. STANDARD_FOUR_IMAGE_TEXT_QUADRANT
Four images in quadrant layout.

**Columns:** Same as STANDARD_FOUR_IMAGE_TEXT

**Use case:** Side-by-side feature comparison

---

#### 10. STANDARD_THREE_IMAGE_TEXT
Three images with headlines and descriptions.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_block1_headline_DE
aplus_basic_m1_block1_body_DE
aplus_basic_m1_image1_url
aplus_basic_m1_image1_id
(repeat for block2-3)
```

**Use case:** Three-step process, benefits

---

#### 11. STANDARD_COMPARISON_TABLE
Product comparison table (up to 6 products, 10 metrics).

**Columns:**
```
aplus_basic_m1_productName1_DE
aplus_basic_m1_productImage1_url
aplus_basic_m1_productImage1_id
aplus_basic_m1_metricHeading1_DE
aplus_basic_m1_metric1_product1_DE
(repeat for all products and metrics)
```

**Use case:** Product line comparison

---

#### 12. STANDARD_PRODUCT_DESCRIPTION
Detailed text-only product description.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
```

**Use case:** Long-form product descriptions

---

#### 13. STANDARD_SINGLE_IMAGE_SPECS_DETAIL
Image with specification table (up to 8 specs).

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_spec1_name_DE
aplus_basic_m1_spec1_value_DE
(repeat for spec2-8)
```

**Use case:** Technical specifications with image

---

#### 14. STANDARD_IMAGE_SIDEBAR
Text with sidebar image.

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_sidebarPosition (LEFT or RIGHT)
```

**Use case:** Text-heavy content with visual

---

#### 15. STANDARD_TECH_SPECS
Technical specifications table (up to 12 specs).

**Columns:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_spec1_name_DE
aplus_basic_m1_spec1_value_DE
(repeat for spec2-12)
```

**Use case:** Detailed technical specifications

---

### Premium Modules

#### 16. PREMIUM_TEXT
Enhanced text formatting.

**Columns:**
```
aplus_premium_m1_headline_DE
aplus_premium_m1_body_DE
```

**Use case:** Premium text layout

---

#### 17. PREMIUM_IMAGE_TEXT
Premium image with text.

**Columns:**
```
aplus_premium_m1_headline_DE
aplus_premium_m1_body_DE
aplus_premium_m1_image_url
aplus_premium_m1_image_id
```

**Use case:** Premium visual storytelling

---

#### 18. PREMIUM_FULL_BACKGROUND_TEXT
Full background image with text overlay.

**Columns:**
```
aplus_premium_m1_headline_DE
aplus_premium_m1_body_DE
aplus_premium_m1_backgroundImage_url
aplus_premium_m1_backgroundImage_id
```

**Use case:** Immersive brand experience

---

#### 19. PREMIUM_FULL_BACKGROUND_IMAGE
Full-page background image.

**Columns:**
```
aplus_premium_m1_backgroundImage_url
aplus_premium_m1_backgroundImage_id
```

**Use case:** Visual impact, lifestyle

---

#### 20. PREMIUM_IMAGE_CAROUSEL
Image carousel (up to 8 images).

**Columns:**
```
aplus_premium_m1_image1_url
aplus_premium_m1_image1_id
(repeat for image2-8)
```

**Use case:** Product gallery, multiple angles

---

## Working with Images

### Image Requirements

- **Format:** JPG, PNG
- **Min Resolution:** 300 DPI
- **Min Size:** 600x600 pixels
- **Max File Size:** 5 MB
- **Color Mode:** RGB

### Upload Process

#### Option 1: Automatic Upload (Recommended)

1. Fill in `{field}_url` columns with your image URLs
2. Select the row
3. Click **LUKO** → **Upload A+ Images**
4. System automatically:
   - Downloads images
   - Uploads to Amazon
   - Fills `{field}_id` columns
5. Publish A+ Content

#### Option 2: Manual Upload

1. Upload images to Amazon Seller Central manually
2. Get `uploadDestinationId` from Amazon
3. Fill `{field}_id` columns manually
4. Publish A+ Content

### Image Column Pairs

Always create pairs of columns:

```
✓ aplus_basic_m1_image_url
✓ aplus_basic_m1_image_id

✗ aplus_basic_m1_image (wrong - needs both _url and _id)
```

## Publishing Process

### Step-by-Step

1. **Prepare Content**
   - Fill in all required columns
   - Check ASIN is valid
   - Set Module Number (1-7)
   - Set Module Type

2. **Upload Images** (if applicable)
   - Fill image_url columns
   - Run **LUKO** → **Upload A+ Images**
   - Verify image_id columns are filled

3. **Publish**
   - Check ☑️ Export checkbox
   - Select row(s) to publish
   - Click **LUKO** → **Publish A+ Content**

4. **Verify**
   - Check Cloud logs for status
   - Note `contentReferenceKey` in logs
   - Add `contentReferenceKey` column to track

### Multi-Module Publishing

You can have multiple modules per ASIN:

```
Row 4: ASIN B0FNRLYQ3G | Module 1 | STANDARD_TEXT
Row 5: ASIN B0FNRLYQ3G | Module 2 | STANDARD_SINGLE_SIDE_IMAGE
Row 6: ASIN B0FNRLYQ3G | Module 3 | STANDARD_SINGLE_IMAGE_HIGHLIGHTS
```

Amazon will combine all modules into one A+ Content document per ASIN.

## Checking Status

### Via Menu

1. Add column `contentReferenceKey` to your sheet
2. After publishing, copy `contentReferenceKey` from logs
3. Select the row
4. Click **LUKO** → **Check A+ Status**

### Status Values

| Status | Meaning |
|--------|---------|
| `DRAFT` | Saved but not submitted |
| `SUBMITTED` | Under Amazon review |
| `APPROVED` | Live on Amazon |
| `REJECTED` | Rejected by Amazon (check reasons) |

### Approval Timeline

- **Basic A+ Content:** 5-7 business days
- **Premium A+ Content:** 7-14 business days

Amazon does not send email notifications - you must check status manually.

## Troubleshooting

### Common Errors

#### "ASIN is empty"
**Solution:** Ensure ASIN column is filled in row 3 and data rows

#### "Module Type is invalid"
**Solution:** Use exact module type names from this guide (case-sensitive)

#### "body: must not be null"
**Solution:** Fill body field for text modules (required)

#### "unexpected property name: 'textList'"
**Solution:** Headlines use direct `{value, decoratorSet}`, NOT textList

#### "unexpected property name: 'decoratorSet', expected: [textList]"
**Solution:** Body fields require textList wrapper

#### "Image upload failed"
**Solution:**
- Check image URL is accessible
- Verify image meets requirements
- Try manual upload

### Content Rejected

If your content is rejected, check:

1. **Policy Violations**
   - No claims (best, #1, etc.)
   - No promotional language
   - No competitor mentions
   - Accurate product info only

2. **Image Quality**
   - High resolution (300 DPI)
   - No pixelation
   - Proper lighting
   - No watermarks

3. **Text Quality**
   - No spelling/grammar errors
   - Professional tone
   - Factual information
   - No HTML/special characters

### Getting Help

1. Check Cloud Logs: **Extensions** → **Apps Script** → **Executions**
2. Review API response messages
3. Verify column names match exactly
4. Test with simple STANDARD_TEXT module first

## Best Practices

### Content Strategy

1. **Start Simple** - Begin with STANDARD_TEXT to understand the workflow
2. **Plan Your Modules** - Sketch layout before creating content
3. **Consistent Branding** - Use same style across all modules
4. **Mobile-First** - Most shoppers view on mobile
5. **Focus on Benefits** - Not just features

### Image Strategy

1. **Professional Photos** - Invest in quality images
2. **Lifestyle Context** - Show product in use
3. **Consistent Style** - Same lighting/background across modules
4. **Alt Text** - Use descriptive headlines for accessibility
5. **Optimize Size** - Balance quality and file size

### Workflow Tips

1. **Template Rows** - Create template rows for each module type
2. **Batch Upload** - Upload all images before publishing
3. **Version Control** - Keep old content in separate sheet
4. **Track Status** - Always add contentReferenceKey column
5. **Test Marketplace** - Test in one marketplace before rolling out

## Example Sheet Structure

```
Row 1: NetAnaliza Amazon A+ Content
Row 2: 2024 Q4 Product Launch
Row 3: ☑️ Export | ASIN | Module Number | Module Type | aplus_basic_m1_headline_DE | aplus_basic_m1_body_DE | contentReferenceKey
Row 4: TRUE | B0FNRLYQ3G | 1 | STANDARD_TEXT | Premium Merino Socks | These socks are made from... | [filled after publish]
Row 5: TRUE | B0FNRLYQ3G | 2 | STANDARD_SINGLE_SIDE_IMAGE | All-Day Comfort | Breathable merino wool... | [filled after publish]
```

## Advanced Topics

### Multi-Language Support

The system supports 8 languages. For each text field, create columns for all target languages:

```
aplus_basic_m1_headline_DE (German)
aplus_basic_m1_headline_EN (English)
aplus_basic_m1_headline_FR (French)
aplus_basic_m1_headline_IT (Italian)
aplus_basic_m1_headline_ES (Spanish)
aplus_basic_m1_headline_NL (Dutch)
aplus_basic_m1_headline_PL (Polish)
aplus_basic_m1_headline_SE (Swedish)
```

When publishing, the system uses the marketplace's primary language. For DE marketplace, it uses `_DE` columns.

### Decorators (Text Formatting)

Currently, decoratorSet is empty `[]`. Future updates will support:

- **STYLE_BOLD** - Bold text
- **STYLE_ITALIC** - Italic text
- **STYLE_UNDERLINE** - Underlined text
- **LIST_ORDERED** - Numbered lists
- **LIST_UNORDERED** - Bullet lists

### API Rate Limits

Amazon SP-API has rate limits:
- **A+ Content:** 10 requests per second
- **Content Assets:** 5 requests per second

If you hit limits, the system will automatically retry.

## Support

For issues or questions:
- Check Cloud Logs first
- Review this guide
- Open issue on GitHub
- Contact NetAnaliza support

---

**Version:** 1.0.0
**Last Updated:** December 2024
**Author:** NetAnaliza Team
