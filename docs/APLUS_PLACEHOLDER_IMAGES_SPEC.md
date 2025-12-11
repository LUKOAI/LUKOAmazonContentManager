# Amazon A+ Content - Placeholder Images Specifications

## Purpose
This document lists ALL image fields across ALL A+ Content modules (Basic and Premium) with exact dimensions required by Amazon. Use this to create placeholder images that can be uploaded to Amazon Asset Library and reused across multiple A+ Content projects.

## Naming Convention for Placeholders

Format: `aplus_placeholder_[module]_[field]_[width]x[height].jpg`

Examples:
- `aplus_placeholder_single_image_300x300.jpg`
- `aplus_placeholder_header_970x600.jpg`
- `aplus_placeholder_logo_600x180.jpg`

## General Image Requirements

- **Format:** JPEG or PNG (JPEG recommended for placeholders)
- **Max file size:** 2 MB per image
- **Resolution:** 72 DPI minimum (300 DPI recommended for quality)
- **Color space:** RGB only
- **Background:** Use neutral gray or branded color for easy identification as placeholder

---

# BASIC A+ CONTENT MODULES

## 1. STANDARD_TEXT
**Images:** None (text-only module)

---

## 2. STANDARD_SINGLE_SIDE_IMAGE

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 300 x 300 px | `aplus_placeholder_single_side_300x300.jpg` | Square image, positioned LEFT or RIGHT |

**Sheet columns:**
- `aplus_basic_m[N]_image_url`
- `aplus_basic_m[N]_image_id`
- `aplus_basic_m[N]_imagePositionType` (LEFT or RIGHT)

---

## 3. STANDARD_HEADER_IMAGE_TEXT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 970 x 600 px | `aplus_placeholder_header_970x600.jpg` | Wide header image |

**Sheet columns:**
- `aplus_basic_m[N]_image_url`
- `aplus_basic_m[N]_image_id`

---

## 4. STANDARD_COMPANY_LOGO

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `companyLogo` | 600 x 180 px | `aplus_placeholder_logo_600x180.jpg` | Horizontal logo format |

**Sheet columns:**
- `aplus_basic_m[N]_companyLogo_url`
- `aplus_basic_m[N]_companyLogo_id`

---

## 5. STANDARD_IMAGE_TEXT_OVERLAY

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 970 x 300 px | `aplus_placeholder_overlay_970x300.jpg` | Wide banner with text overlay |

**Sheet columns:**
- `aplus_basic_m[N]_image_url`
- `aplus_basic_m[N]_image_id`
- `aplus_basic_m[N]_overlayColorType` (BLACK or WHITE)

---

## 6. STANDARD_SINGLE_IMAGE_HIGHLIGHTS

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 300 x 400 px | `aplus_placeholder_highlights_300x400.jpg` | Vertical image with bullet points |

**Sheet columns:**
- `aplus_basic_m[N]_image_url`
- `aplus_basic_m[N]_image_id`

---

## 7. STANDARD_MULTIPLE_IMAGE_TEXT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 300 x 300 px | `aplus_placeholder_multi_img1_300x300.jpg` | First image |
| `image2` | 300 x 300 px | `aplus_placeholder_multi_img2_300x300.jpg` | Second image |
| `image3` | 300 x 300 px | `aplus_placeholder_multi_img3_300x300.jpg` | Third image |
| `image4` | 300 x 300 px | `aplus_placeholder_multi_img4_300x300.jpg` | Fourth image |

**Sheet columns:**
- `aplus_basic_m[N]_image1_url` through `image4_url`
- `aplus_basic_m[N]_image1_id` through `image4_id`

**Note:** Up to 4 images supported

---

## 8. STANDARD_FOUR_IMAGE_TEXT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 300 x 300 px | `aplus_placeholder_four_img1_300x300.jpg` | Block 1 image |
| `image2` | 300 x 300 px | `aplus_placeholder_four_img2_300x300.jpg` | Block 2 image |
| `image3` | 300 x 300 px | `aplus_placeholder_four_img3_300x300.jpg` | Block 3 image |
| `image4` | 300 x 300 px | `aplus_placeholder_four_img4_300x300.jpg` | Block 4 image |

**Sheet columns:**
- `aplus_basic_m[N]_image1_url` through `image4_url`
- `aplus_basic_m[N]_image1_id` through `image4_id`

**Note:** All 4 images recommended for best layout

---

## 9. STANDARD_FOUR_IMAGE_TEXT_QUADRANT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 135 x 135 px | `aplus_placeholder_quad_img1_135x135.jpg` | Top-left quadrant |
| `image2` | 135 x 135 px | `aplus_placeholder_quad_img2_135x135.jpg` | Top-right quadrant |
| `image3` | 135 x 135 px | `aplus_placeholder_quad_img3_135x135.jpg` | Bottom-left quadrant |
| `image4` | 135 x 135 px | `aplus_placeholder_quad_img4_135x135.jpg` | Bottom-right quadrant |

**Sheet columns:**
- `aplus_basic_m[N]_image1_url` through `image4_url`
- `aplus_basic_m[N]_image1_id` through `image4_id`

**Note:** Small images in 2x2 grid layout

---

## 10. STANDARD_THREE_IMAGE_TEXT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 300 x 300 px | `aplus_placeholder_three_img1_300x300.jpg` | Block 1 image |
| `image2` | 300 x 300 px | `aplus_placeholder_three_img2_300x300.jpg` | Block 2 image |
| `image3` | 300 x 300 px | `aplus_placeholder_three_img3_300x300.jpg` | Block 3 image |

**Sheet columns:**
- `aplus_basic_m[N]_image1_url` through `image3_url`
- `aplus_basic_m[N]_image1_id` through `image3_id`

---

## 11. STANDARD_COMPARISON_TABLE

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `productImage1` | 150 x 300 px | `aplus_placeholder_comparison_prod1_150x300.jpg` | Product 1 |
| `productImage2` | 150 x 300 px | `aplus_placeholder_comparison_prod2_150x300.jpg` | Product 2 |
| `productImage3` | 150 x 300 px | `aplus_placeholder_comparison_prod3_150x300.jpg` | Product 3 |
| `productImage4` | 150 x 300 px | `aplus_placeholder_comparison_prod4_150x300.jpg` | Product 4 |
| `productImage5` | 150 x 300 px | `aplus_placeholder_comparison_prod5_150x300.jpg` | Product 5 |
| `productImage6` | 150 x 300 px | `aplus_placeholder_comparison_prod6_150x300.jpg` | Product 6 |

**Sheet columns:**
- `aplus_basic_m[N]_productImage1_url` through `productImage6_url`
- `aplus_basic_m[N]_productImage1_id` through `productImage6_id`

**Note:** Up to 6 product images supported, vertical format

---

## 12. STANDARD_PRODUCT_DESCRIPTION
**Images:** None (text-only module)

---

## 13. STANDARD_SINGLE_IMAGE_SPECS_DETAIL

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 300 x 400 px | `aplus_placeholder_specs_300x400.jpg` | Product image with specs list |

**Sheet columns:**
- `aplus_basic_m[N]_image_url`
- `aplus_basic_m[N]_image_id`

---

## 14. STANDARD_IMAGE_SIDEBAR

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 300 x 300 px | `aplus_placeholder_sidebar_300x300.jpg` | Sidebar image, LEFT or RIGHT position |

**Sheet columns:**
- `aplus_basic_m[N]_image_url`
- `aplus_basic_m[N]_image_id`
- `aplus_basic_m[N]_sidebarPosition` (LEFT or RIGHT)

---

## 15. STANDARD_TECH_SPECS
**Images:** None (specifications table only)

---

# PREMIUM A+ CONTENT MODULES

## 16. PREMIUM_TEXT
**Images:** None (text-only module with premium formatting)

---

## 17. PREMIUM_IMAGE_TEXT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 650 x 350 px | `aplus_placeholder_premium_img_650x350.jpg` | Premium image with enhanced layout |

**Sheet columns:**
- `aplus_premium_m[N]_image_url`
- `aplus_premium_m[N]_image_id`

---

## 18. PREMIUM_FULL_BACKGROUND_TEXT

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `backgroundImage` (Desktop) | 1940 x 600 px | `aplus_placeholder_premium_bg_desktop_1940x600.jpg` | Desktop background |
| `backgroundImage` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_bg_mobile_600x450.jpg` | Mobile background |

**Sheet columns:**
- `aplus_premium_m[N]_backgroundImage_url`
- `aplus_premium_m[N]_backgroundImage_id`

**Note:** Amazon may accept single image and auto-crop, but best practice is desktop size (1940x600)

---

## 19. PREMIUM_FULL_BACKGROUND_IMAGE

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `backgroundImage` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_fullbg_desktop_1464x600.jpg` | Full-page background desktop |
| `backgroundImage` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_fullbg_mobile_600x450.jpg` | Full-page background mobile |

**Sheet columns:**
- `aplus_premium_m[N]_backgroundImage_url`
- `aplus_premium_m[N]_backgroundImage_id`

**Note:** Image-only module with optional overlay text

---

## 20. PREMIUM_IMAGE_CAROUSEL

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 300 x 300 px | `aplus_placeholder_carousel_img1_300x300.jpg` | Carousel slide 1 |
| `image2` | 300 x 300 px | `aplus_placeholder_carousel_img2_300x300.jpg` | Carousel slide 2 |
| `image3` | 300 x 300 px | `aplus_placeholder_carousel_img3_300x300.jpg` | Carousel slide 3 |
| `image4` | 300 x 300 px | `aplus_placeholder_carousel_img4_300x300.jpg` | Carousel slide 4 |
| `image5` | 300 x 300 px | `aplus_placeholder_carousel_img5_300x300.jpg` | Carousel slide 5 |
| `image6` | 300 x 300 px | `aplus_placeholder_carousel_img6_300x300.jpg` | Carousel slide 6 |
| `image7` | 300 x 300 px | `aplus_placeholder_carousel_img7_300x300.jpg` | Carousel slide 7 |
| `image8` | 300 x 300 px | `aplus_placeholder_carousel_img8_300x300.jpg` | Carousel slide 8 |

**Sheet columns:**
- `aplus_premium_m[N]_image1_url` through `image8_url`
- `aplus_premium_m[N]_image1_id` through `image8_id`

**Note:** Up to 8 carousel images supported

---

# PREMIUM VIDEO MODULES

## PREMIUM_FULL_VIDEO

### Video Fields:
| Field Name | Specifications | Placeholder Filename | Notes |
|------------|---------------|---------------------|-------|
| `video` | **Resolution:** 1920 x 1080 px (1080p HD)<br>**Alternative:** 1280 x 720 px (720p HD)<br>**Format:** MP4 or MOV<br>**Codec:** H.264<br>**Max file size:** 5 GB<br>**Duration:** 15 seconds to 3 minutes<br>**Frame rate:** 23.976, 24, 25, or 29.97 fps | `aplus_placeholder_video_1920x1080.mp4` | Premium video with thumbnail |
| `video_thumbnail` | 1920 x 1080 px (JPEG/PNG) | `aplus_placeholder_video_thumb_1920x1080.jpg` | Video thumbnail image |

**Sheet columns:**
- `aplus_premium_m[N]_video_url` (video file URL)
- `aplus_premium_m[N]_video_id` (uploadDestinationId for video)
- `aplus_premium_m[N]_video_thumbnail_url`
- `aplus_premium_m[N]_video_thumbnail_id`

**Video Requirements:**
- Audio: AAC codec, 128 kbps minimum
- Bitrate: 5-10 Mbps recommended
- Must include captions/subtitles for accessibility
- No third-party branding or logos (only your brand)

---

# SUMMARY: ALL UNIQUE IMAGE SIZES NEEDED

Create one placeholder for each unique size below:

## Standard Sizes (Basic Modules)
1. **135 x 135 px** - Quadrant images (4 needed)
2. **150 x 300 px** - Comparison table products (6 needed)
3. **300 x 300 px** - Square images (most common, ~20+ uses)
4. **300 x 400 px** - Vertical images (highlights, specs)
5. **600 x 180 px** - Company logo
6. **970 x 300 px** - Overlay banner
7. **970 x 600 px** - Header image

## Premium Sizes (Premium Modules)
8. **650 x 350 px** - Premium image text
9. **1464 x 600 px** - Premium full background (desktop)
10. **1940 x 600 px** - Premium background text (desktop)
11. **600 x 450 px** - Premium mobile backgrounds
12. **1920 x 1080 px** - Video thumbnail

**Total unique placeholder images needed: 12**

---

# WORKFLOW: Creating Placeholders

## Step 1: Create Placeholder Images

For each size above, create a placeholder with:
- Correct dimensions (exact pixels)
- Neutral background (light gray #CCCCCC or branded color)
- Text overlay showing dimensions (e.g., "300 x 300 px")
- Your brand watermark/logo (subtle)
- Save as JPEG, optimize to <500 KB

## Step 2: Upload to Amazon Asset Library

1. Go to Seller Central → Advertising → A+ Content Manager
2. Create or edit any A+ Content document
3. Select a module that supports images
4. Click "Upload from computer"
5. Upload all 12 placeholder images
6. Amazon assigns each an `uploadDestinationId`

## Step 3: Extract uploadDestinationIds

**Method A - Use Image Library Sync:**
1. Create test A+ Content using all placeholders
2. Publish to any ASIN (can be test ASIN)
3. In Google Sheets: Export to Amazon → 🔄 Sync Images to Library
4. This extracts all uploadDestinationIds

**Method B - Browser Network Tab:**
1. Upload image in Seller Central
2. Open Developer Tools → Network tab
3. Look for POST to `s3.amazonaws.com`
4. Response Location header contains the UUID
5. Format: `aplus-media-library-service-media/[UUID].jpg`

## Step 4: Add to Placeholder Reference Sheet

Create new sheet `A+ Placeholders` with columns:
- `placeholder_name` (e.g., "300x300_square")
- `dimensions` (300 x 300)
- `module_types` (which modules use this size)
- `uploadDestinationId` (from Amazon)
- `filename` (aplus_placeholder_...)
- `notes`

## Step 5: Use in Export Configuration

When user selects "Export with placeholder images" (option C), system:
1. Reads placeholder uploadDestinationIds from `A+ Placeholders` sheet
2. Maps image fields to appropriate placeholder by size
3. Generates A+ Content with all image fields populated
4. Seller sees complete module structure with placeholders
5. Seller only needs to replace images (not rebuild modules)

---

# ALT TEXT FOR PLACEHOLDERS

Each placeholder image should have descriptive alt text:

```
aplus_basic_m1_image_altText: "Product feature placeholder - replace with actual product image"
aplus_basic_m1_companyLogo_altText: "Company logo placeholder - replace with your brand logo"
aplus_basic_m1_productImage1_altText: "Comparison product 1 placeholder - replace with product image"
```

---

# QUESTIONS?

See also:
- `docs/APLUS_IMAGE_WORKFLOW.md` - Image upload workflow
- `docs/APLUS_MODULES_SPECIFICATION.md` - Module field specifications
- `docs/GOOGLE_FORMS_INTEGRATION.md` - Auto-import from Claude AI

For troubleshooting, check Apps Script execution logs.
