# Amazon A+ Content Modules - Complete Specification

## Module Types Overview

Based on Amazon SP-API A+ Content v2020-11-01

### A+ Basic Modules (Standard)

1. **STANDARD_TEXT** - Simple text block
2. **STANDARD_SINGLE_SIDE_IMAGE** - Text with side image
3. **STANDARD_HEADER_IMAGE_TEXT** - Header with image and paragraphs
4. **STANDARD_COMPANY_LOGO** - Company logo with description
5. **STANDARD_IMAGE_TEXT_OVERLAY** - Image with text overlay
6. **STANDARD_SINGLE_IMAGE_HIGHLIGHTS** - Image with bullet points
7. **STANDARD_MULTIPLE_IMAGE_TEXT** - Multiple images with text
8. **STANDARD_FOUR_IMAGE_TEXT** - Four images with text
9. **STANDARD_FOUR_IMAGE_TEXT_QUADRANT** - Four images in quadrants
10. **STANDARD_THREE_IMAGE_TEXT** - Three images with text
11. **STANDARD_COMPARISON_TABLE** - Product comparison table
12. **STANDARD_PRODUCT_DESCRIPTION** - Detailed product description
13. **STANDARD_SINGLE_IMAGE_SPECS_DETAIL** - Image with specifications
14. **STANDARD_IMAGE_SIDEBAR** - Sidebar with image
15. **STANDARD_TECH_SPECS** - Technical specifications table

### A+ Premium Modules

1. **PREMIUM_TEXT** - Premium text formatting
2. **PREMIUM_IMAGE_TEXT** - Premium image with text
3. **PREMIUM_FULL_BACKGROUND_TEXT** - Full background with text
4. **PREMIUM_FULL_BACKGROUND_IMAGE** - Full background image
5. **PREMIUM_IMAGE_CAROUSEL** - Image carousel

## Field Structure Rules

### Text Component Types

| Component Type | Structure | Usage |
|---------------|-----------|-------|
| **TextComponent** | `{value: "text", decoratorSet: []}` | headline, heading, title fields |
| **ParagraphComponent** | `{textList: [{value: "text", decoratorSet: []}]}` | body, description, paragraph fields |

### Decorator Types

- `STYLE_BOLD` - Bold text
- `STYLE_ITALIC` - Italic text
- `STYLE_UNDERLINE` - Underlined text
- `LIST_ORDERED` - Ordered list
- `LIST_UNORDERED` - Unordered list
- `LIST_ITEM` - List item

## Column Naming Convention

Format: `aplus_[type]_m[number]_[field]_[language]`

- `type`: `basic` or `premium`
- `number`: Module number (1-7 for basic, 1-3 for premium)
- `field`: Field name (headline, body, image1_url, etc.)
- `language`: DE, EN, FR, IT, ES, NL, PL, SE

### Common Fields

- `headline_[LANG]` - Main heading (TextComponent)
- `body_[LANG]` - Main body text (ParagraphComponent)
- `[field]_image_url` - Image URL for upload
- `[field]_image_id` - Amazon uploadDestinationId after upload

## Module-Specific Field Definitions

### 1. STANDARD_TEXT

**Text Fields:**
- `headline_[LANG]` - Headline (max 160 chars)
- `body_[LANG]` - Body text (max 5000 chars)

**Images:** None

**Column Examples:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_headline_EN
aplus_basic_m1_body_DE
aplus_basic_m1_body_EN
```

### 2. STANDARD_SINGLE_SIDE_IMAGE

**Text Fields:**
- `headline_[LANG]` - Headline
- `body_[LANG]` - Body text

**Images:**
- `image_url` - Side image URL
- `image_id` - Upload destination ID
- `imagePositionType` - LEFT or RIGHT

**Column Examples:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_imagePositionType
```

### 3. STANDARD_HEADER_IMAGE_TEXT

**Text Fields:**
- `headline_[LANG]` - Main heading
- `body_[LANG]` - Body paragraph

**Images:**
- `image_url` - Header image URL
- `image_id` - Upload destination ID

**Column Examples:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
```

### 4. STANDARD_COMPANY_LOGO

**Text Fields:**
- `companyDescription_[LANG]` - Company description (ParagraphComponent)

**Images:**
- `companyLogo_url` - Logo image URL
- `companyLogo_id` - Upload destination ID

**Column Examples:**
```
aplus_basic_m1_companyDescription_DE
aplus_basic_m1_companyLogo_url
aplus_basic_m1_companyLogo_id
```

### 5. STANDARD_IMAGE_TEXT_OVERLAY

**Text Fields:**
- `headline_[LANG]` - Overlay headline
- `body_[LANG]` - Overlay body text

**Images:**
- `image_url` - Background image URL
- `image_id` - Upload destination ID
- `overlayColorType` - BLACK or WHITE

**Column Examples:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
aplus_basic_m1_overlayColorType
```

### 6. STANDARD_SINGLE_IMAGE_HIGHLIGHTS

**Text Fields:**
- `headline_[LANG]` - Main headline
- `highlight1_[LANG]` - First bullet point
- `highlight2_[LANG]` - Second bullet point
- `highlight3_[LANG]` - Third bullet point
- `highlight4_[LANG]` - Fourth bullet point

**Images:**
- `image_url` - Main image URL
- `image_id` - Upload destination ID

**Column Examples:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_highlight1_DE
aplus_basic_m1_highlight2_DE
aplus_basic_m1_highlight3_DE
aplus_basic_m1_highlight4_DE
aplus_basic_m1_image_url
aplus_basic_m1_image_id
```

### 7. STANDARD_MULTIPLE_IMAGE_TEXT

**Text Fields:**
- `headline_[LANG]` - Main headline
- `body_[LANG]` - Main body text

**Images (up to 4):**
- `image1_url` through `image4_url`
- `image1_id` through `image4_id`

**Column Examples:**
```
aplus_basic_m1_headline_DE
aplus_basic_m1_body_DE
aplus_basic_m1_image1_url
aplus_basic_m1_image1_id
aplus_basic_m1_image2_url
aplus_basic_m1_image2_id
```

### 8. STANDARD_FOUR_IMAGE_TEXT

**Text Fields:**
- `headline_[LANG]` - Main headline
- `block1_headline_[LANG]` through `block4_headline_[LANG]`
- `block1_body_[LANG]` through `block4_body_[LANG]`

**Images (4 required):**
- `image1_url` through `image4_url`
- `image1_id` through `image4_id`

### 9. STANDARD_FOUR_IMAGE_TEXT_QUADRANT

**Text Fields:**
- `headline_[LANG]` - Main headline
- `block1_headline_[LANG]` through `block4_headline_[LANG]`
- `block1_body_[LANG]` through `block4_body_[LANG]`

**Images (4 required):**
- `image1_url` through `image4_url`
- `image1_id` through `image4_id`

### 10. STANDARD_THREE_IMAGE_TEXT

**Text Fields:**
- `headline_[LANG]` - Main headline
- `block1_headline_[LANG]` through `block3_headline_[LANG]`
- `block1_body_[LANG]` through `block3_body_[LANG]`

**Images (3 required):**
- `image1_url` through `image3_url`
- `image1_id` through `image3_id`

### 11. STANDARD_COMPARISON_TABLE

**Text Fields:**
- `productName1_[LANG]` through `productName6_[LANG]`
- `metricHeading1_[LANG]` through `metricHeading10_[LANG]`
- `metric1_product1_[LANG]` through `metric10_product6_[LANG]`

**Images (up to 6 products):**
- `productImage1_url` through `productImage6_url`
- `productImage1_id` through `productImage6_id`

### 12. STANDARD_PRODUCT_DESCRIPTION

**Text Fields:**
- `headline_[LANG]` - Product headline
- `body_[LANG]` - Product description

**Images:** None (text-only module)

### 13. STANDARD_SINGLE_IMAGE_SPECS_DETAIL

**Text Fields:**
- `headline_[LANG]` - Main headline
- `spec1_name_[LANG]` through `spec8_name_[LANG]`
- `spec1_value_[LANG]` through `spec8_value_[LANG]`

**Images:**
- `image_url` - Product image URL
- `image_id` - Upload destination ID

### 14. STANDARD_IMAGE_SIDEBAR

**Text Fields:**
- `headline_[LANG]` - Main headline
- `body_[LANG]` - Body text

**Images:**
- `image_url` - Sidebar image URL
- `image_id` - Upload destination ID
- `sidebarPosition` - LEFT or RIGHT

### 15. STANDARD_TECH_SPECS

**Text Fields:**
- `headline_[LANG]` - Table headline
- `spec1_name_[LANG]` through `spec12_name_[LANG]`
- `spec1_value_[LANG]` through `spec12_value_[LANG]`

**Images:** None

### 16. PREMIUM_TEXT

**Text Fields:**
- `headline_[LANG]` - Premium headline (enhanced formatting)
- `body_[LANG]` - Premium body (enhanced formatting)

**Images:** None

### 17. PREMIUM_IMAGE_TEXT

**Text Fields:**
- `headline_[LANG]` - Premium headline
- `body_[LANG]` - Premium body text

**Images:**
- `image_url` - Premium image URL
- `image_id` - Upload destination ID

### 18. PREMIUM_FULL_BACKGROUND_TEXT

**Text Fields:**
- `headline_[LANG]` - Headline on background
- `body_[LANG]` - Body on background

**Images:**
- `backgroundImage_url` - Full background image URL
- `backgroundImage_id` - Upload destination ID

### 19. PREMIUM_FULL_BACKGROUND_IMAGE

**Images:**
- `backgroundImage_url` - Full page background image URL
- `backgroundImage_id` - Upload destination ID

**Text Fields:** Optional overlay text

### 20. PREMIUM_IMAGE_CAROUSEL

**Images (up to 8):**
- `image1_url` through `image8_url`
- `image1_id` through `image8_id`

**Text Fields:** Optional captions per image

## Image Upload Process

1. Get upload destination: `POST /contentAssets/2020-11-01/contentDocumentAsinRelations`
2. Upload to S3 using `uploadDestinationId`
3. Store `uploadDestinationId` in `[field]_id` column
4. Use `uploadDestinationId` when creating A+ Content

## Status Check

Use `GET /aplus/2020-11-01/contentDocuments/{contentReferenceKey}` to check status:

- `APPROVED` - Published and live
- `DRAFT` - Saved but not submitted
- `SUBMITTED` - Under review
- `REJECTED` - Rejected (check error reasons)

## Character Limits

- Headlines: 80-160 characters (varies by module)
- Body text: Up to 5000 characters
- Bullet points: Up to 200 characters each

## Best Practices

1. Always provide content in marketplace's primary language
2. Use high-quality images (minimum 300 DPI)
3. Test with `validateContentDocumentAsinRelations` before submission
4. Keep headline text concise and impactful
5. Use bullet points for key features
6. Maintain consistent branding across modules
