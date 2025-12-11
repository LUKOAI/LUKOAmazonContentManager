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

# PREMIUM A+ CONTENT MODULES (19 modules)

## 1. PREMIUM_TEXT (AI Ready)
**Images:** None (text-only module with premium formatting)

**Text Fields:**
- `headline_[LANG]` - 80 characters max
- `body_[LANG]` - 300 characters max

---

## 2. PREMIUM_SINGLE_IMAGE_TEXT (Premium Single Image with Text) (AI Ready)

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image` | 650 x 350 px | `aplus_placeholder_premium_single_650x350.jpg` | Premium image with enhanced text layout |

**Sheet columns:**
- `aplus_premium_m[N]_image_url`
- `aplus_premium_m[N]_image_id`

**Text Fields:**
- `headline_[LANG]` - 80 characters
- `body_[LANG]` - 300 characters

---

## 3. PREMIUM_BACKGROUND_IMAGE_TEXT (Premium Background Image with Text) (AI Ready)

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `backgroundImage` (Desktop) | 1940 x 600 px | `aplus_placeholder_premium_bg_text_desktop_1940x600.jpg` | Desktop background |
| `backgroundImage` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_bg_text_mobile_600x450.jpg` | Mobile background |

**Sheet columns:**
- `aplus_premium_m[N]_backgroundImage_url`
- `aplus_premium_m[N]_backgroundImage_id`

**Text Fields:**
- `headline_[LANG]` - 80 characters
- `body_[LANG]` - 300 characters

**Note:** Text overlay on full background image

---

## 4. PREMIUM_FULL_IMAGE (Premium Full Image) (AI Ready)

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `backgroundImage` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_fullimg_desktop_1464x600.jpg` | Full-page image desktop |
| `backgroundImage` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_fullimg_mobile_600x450.jpg` | Full-page image mobile |

**Sheet columns:**
- `aplus_premium_m[N]_backgroundImage_url`
- `aplus_premium_m[N]_backgroundImage_id`

**Note:** Image-only module with optional overlay text

---

## 5. PREMIUM_DUAL_IMAGES_TEXT (Premium Dual Images with Text)

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 650 x 350 px | `aplus_placeholder_premium_dual_img1_650x350.jpg` | First image |
| `image2` | 650 x 350 px | `aplus_placeholder_premium_dual_img2_650x350.jpg` | Second image |

**Sheet columns:**
- `aplus_premium_m[N]_image1_url`, `image2_url`
- `aplus_premium_m[N]_image1_id`, `image2_id`

**Text Fields:**
- `headline_[LANG]` - Module headline
- `block1_headline_[LANG]`, `block1_body_[LANG]`
- `block2_headline_[LANG]`, `block2_body_[LANG]`

---

## 6. PREMIUM_FOUR_IMAGES_TEXT (Premium Four Images & Text)

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 300 x 225 px | `aplus_placeholder_premium_four_img1_300x225.jpg` | Image 1 |
| `image2` | 300 x 225 px | `aplus_placeholder_premium_four_img2_300x225.jpg` | Image 2 |
| `image3` | 300 x 225 px | `aplus_placeholder_premium_four_img3_300x225.jpg` | Image 3 |
| `image4` | 300 x 225 px | `aplus_placeholder_premium_four_img4_300x225.jpg` | Image 4 |

**Sheet columns:**
- `aplus_premium_m[N]_image1_url` through `image4_url`
- `aplus_premium_m[N]_image1_id` through `image4_id`

---

## 7. PREMIUM_COMPARISON_TABLE_1

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `productImage1` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod1_200x225.jpg` | Product 1 |
| `productImage2` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod2_200x225.jpg` | Product 2 |
| `productImage3` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod3_200x225.jpg` | Product 3 |
| `productImage4` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod4_200x225.jpg` | Product 4 |
| `productImage5` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod5_200x225.jpg` | Product 5 (optional) |
| `productImage6` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod6_200x225.jpg` | Product 6 (optional) |
| `productImage7` | 200 x 225 px | `aplus_placeholder_premium_comp1_prod7_200x225.jpg` | Product 7 (optional) |

**Sheet columns:**
- `aplus_premium_m[N]_productImage1_url` through `productImage7_url`
- `aplus_premium_m[N]_productImage1_id` through `productImage7_id`

**Specifications:**
- Products: 4 minimum - 7 maximum
- Features: 5 minimum - 12 maximum
- Module headline: 80 characters
- Image headline: 25 characters per product
- Includes "Add to Cart" buttons

---

## 8. PREMIUM_COMPARISON_TABLE_2

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `productImage1` | 300 x 225 px | `aplus_placeholder_premium_comp2_prod1_300x225.jpg` | Product 1 |
| `productImage2` | 300 x 225 px | `aplus_placeholder_premium_comp2_prod2_300x225.jpg` | Product 2 |
| `productImage3` | 300 x 225 px | `aplus_placeholder_premium_comp2_prod3_300x225.jpg` | Product 3 (optional) |

**Sheet columns:**
- `aplus_premium_m[N]_productImage1_url` through `productImage3_url`
- `aplus_premium_m[N]_productImage1_id` through `productImage3_id`

**Specifications:**
- Products: 2 minimum - 3 maximum
- Features: 2 minimum - 5 maximum
- Larger images than Table 1
- Module headline: 80 characters
- Image headline: 30 characters per product

---

## 9. PREMIUM_COMPARISON_TABLE_3

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `productImage1` | 300 x 225 px | `aplus_placeholder_premium_comp3_prod1_300x225.jpg` | Product 1 |
| `productImage2` | 300 x 225 px | `aplus_placeholder_premium_comp3_prod2_300x225.jpg` | Product 2 |
| `productImage3` | 300 x 225 px | `aplus_placeholder_premium_comp3_prod3_300x225.jpg` | Product 3 |

**Sheet columns:**
- `aplus_premium_m[N]_productImage1_url` through `productImage3_url`
- `aplus_premium_m[N]_productImage1_id` through `productImage3_id`

**Specifications:**
- Products: Exactly 3 products
- Features: 2 minimum - 5 maximum
- Chart headline: 25 characters

---

## 10. PREMIUM_HOTSPOTS_1

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `backgroundImage` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_hotspots1_desktop_1464x600.jpg` | Desktop background |
| `backgroundImage` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_hotspots1_mobile_600x450.jpg` | Mobile background |

**Sheet columns:**
- `aplus_premium_m[N]_backgroundImage_url`
- `aplus_premium_m[N]_backgroundImage_id`

**Specifications:**
- Up to 6 hotspots (clickable points on image)
- Hotspot headline: 50 characters each
- Hotspot body: 200 characters each
- NO module headline (use Hotspots 2 for that)

---

## 11. PREMIUM_HOTSPOTS_2

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `backgroundImage` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_hotspots2_desktop_1464x600.jpg` | Desktop background |
| `backgroundImage` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_hotspots2_mobile_600x450.jpg` | Mobile background |

**Sheet columns:**
- `aplus_premium_m[N]_backgroundImage_url`
- `aplus_premium_m[N]_backgroundImage_id`

**Specifications:**
- Same as Hotspots 1 BUT with module headline and body text
- Up to 6 hotspots
- Module headline: 80 characters
- Module body: 300 characters

---

## 12. PREMIUM_NAVIGATION_CAROUSEL

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_navcarousel_img1_desktop_1464x600.jpg` | Panel 1 desktop |
| `image1` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_navcarousel_img1_mobile_600x450.jpg` | Panel 1 mobile |
| `image2` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_navcarousel_img2_desktop_1464x600.jpg` | Panel 2 desktop |
| `image2` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_navcarousel_img2_mobile_600x450.jpg` | Panel 2 mobile |
| ... up to 5 panels | | | |

**Sheet columns:**
- `aplus_premium_m[N]_image1_url` through `image5_url`
- `aplus_premium_m[N]_image1_id` through `image5_id`

**Specifications:**
- Panels: 2 minimum - 5 maximum
- Navigation text: 20 characters per panel (horizontal navigation bar)
- Headline: 80 characters per panel
- Body: 300 characters per panel

---

## 13. PREMIUM_REGIMEN_CAROUSEL

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` (Desktop) | 1464 x 600 px | `aplus_placeholder_premium_regimen_img1_desktop_1464x600.jpg` | Step 1 desktop |
| `image1` (Mobile) | 600 x 450 px | `aplus_placeholder_premium_regimen_img1_mobile_600x450.jpg` | Step 1 mobile |
| ... up to 5 steps | | | |

**Sheet columns:**
- `aplus_premium_m[N]_image1_url` through `image5_url`
- `aplus_premium_m[N]_image1_id` through `image5_id`

**Specifications:**
- Panels: 2 minimum - 5 maximum
- VERTICAL navigation (steps/regimen format)
- Perfect for skincare routines, setup instructions
- Headline: 80 characters per step
- Body: 300 characters per step

---

## 14. PREMIUM_SIMPLE_IMAGE_CAROUSEL

### Image Fields:
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `image1` | 1464 x 600 px | `aplus_placeholder_premium_simplecarousel_img1_1464x600.jpg` | Carousel image 1 |
| `image2` | 1464 x 600 px | `aplus_placeholder_premium_simplecarousel_img2_1464x600.jpg` | Carousel image 2 |
| ... up to 8 images | | | |

**Sheet columns:**
- `aplus_premium_m[N]_image1_url` through `image8_url`
- `aplus_premium_m[N]_image1_id` through `image8_id`

**Specifications:**
- Images: Up to 8 images
- Simple carousel without text overlays
- Auto-rotating slideshow

---

## 15. PREMIUM_VIDEO_IMAGE_CAROUSEL

### Image/Video Fields:
| Field Name | Specifications | Placeholder Filename | Notes |
|------------|---------------|---------------------|-------|
| `panel1_video` | 960 x 540 px minimum, MP4 | `aplus_placeholder_premium_vidcarousel_vid1.mp4` | Panel 1 video |
| `panel1_image` | 1464 x 600 px | `aplus_placeholder_premium_vidcarousel_img1_1464x600.jpg` | OR image instead |
| ... up to 6 panels | | | |

**Sheet columns:**
- `aplus_premium_m[N]_panel1_video_url` through `panel6_video_url`
- `aplus_premium_m[N]_panel1_image_url` through `panel6_image_url`

**Specifications:**
- Panels: Up to 6 panels
- Each panel can be video OR image
- Headline: 80 characters per panel
- Subheadline: 50 characters per panel
- Body: 300 characters per panel

---

## 16. PREMIUM_FULL_VIDEO

### Video Fields:
| Field Name | Specifications | Placeholder Filename | Notes |
|------------|---------------|---------------------|-------|
| `video` | **Resolution:** 1920 x 1080 px (1080p HD)<br>**Alternative:** 1280 x 720 px (720p HD)<br>**Format:** MP4 or MOV<br>**Codec:** H.264<br>**Max file size:** 5 GB<br>**Duration:** 15 seconds to 3 minutes<br>**Frame rate:** 23.976, 24, 25, or 29.97 fps | `aplus_placeholder_premium_fullvideo_1920x1080.mp4` | Full-width video |
| `video_thumbnail` | 1920 x 1080 px (JPEG/PNG) | `aplus_placeholder_premium_fullvideo_thumb_1920x1080.jpg` | Video thumbnail |

**Sheet columns:**
- `aplus_premium_m[N]_video_url`
- `aplus_premium_m[N]_video_id`
- `aplus_premium_m[N]_video_thumbnail_url`
- `aplus_premium_m[N]_video_thumbnail_id`

**Video Requirements:**
- Audio: AAC codec, 128 kbps minimum
- Bitrate: 5-10 Mbps recommended
- Minimum resolution: 960 x 540 px

---

## 17. PREMIUM_VIDEO_WITH_TEXT

### Video Fields:
| Field Name | Specifications | Placeholder Filename | Notes |
|------------|---------------|---------------------|-------|
| `video` | **Resolution:** 800 x 600 px minimum<br>**Format:** MP4<br>**Duration:** 15 seconds to 3 minutes | `aplus_placeholder_premium_vidtext_800x600.mp4` | Video with text beside |
| `video_thumbnail` | 800 x 600 px | `aplus_placeholder_premium_vidtext_thumb_800x600.jpg` | Video thumbnail |

**Sheet columns:**
- `aplus_premium_m[N]_video_url`
- `aplus_premium_m[N]_video_id`
- `aplus_premium_m[N]_video_thumbnail_url`
- `aplus_premium_m[N]_video_thumbnail_id`

**Text Fields:**
- `headline_[LANG]` - 80 characters
- `body_[LANG]` - 300 characters (displayed beside video)

---

## 18. PREMIUM_QA (Premium Q&A)

### Image Fields (Optional):
| Field Name | Dimensions | Placeholder Filename | Notes |
|------------|------------|---------------------|-------|
| `qa1_image` | 300 x 300 px | `aplus_placeholder_premium_qa_img1_300x300.jpg` | Image for Q&A pair 1 |
| `qa2_image` | 300 x 300 px | `aplus_placeholder_premium_qa_img2_300x300.jpg` | Image for Q&A pair 2 |
| ... up to 6 Q&A pairs | | | |

**Sheet columns:**
- `aplus_premium_m[N]_qa1_image_url` through `qa6_image_url`
- `aplus_premium_m[N]_qa1_image_id` through `qa6_image_id`

**Text Fields:**
- `qa1_question_[LANG]`, `qa1_answer_[LANG]`
- Up to 6 Q&A pairs
- Unlike Basic Q&A, can include images with answers

---

## 19. PREMIUM_TECHNICAL_SPECIFICATIONS

**Images:** None (specifications table only)

**Text Fields:**
- `headline_[LANG]` - Table headline
- `spec1_name_[LANG]` through `spec15_name_[LANG]`
- `spec1_value_[LANG]` through `spec15_value_[LANG]`

**Note:** More specs supported than Standard Tech Specs (15 vs 12)

---

# SUMMARY: ALL UNIQUE IMAGE SIZES NEEDED

Create one placeholder for each unique size below:

## Standard Sizes (Basic Modules)
1. **135 x 135 px** - Quadrant images (4 needed for STANDARD_FOUR_IMAGE_TEXT_QUADRANT)
2. **150 x 300 px** - Comparison table products (6 needed for STANDARD_COMPARISON_TABLE)
3. **220 x 220 px** - Additional square image (minimum)
4. **300 x 300 px** - Square images (most common, ~20+ uses across multiple modules)
5. **300 x 400 px** - Vertical images (STANDARD_SINGLE_IMAGE_HIGHLIGHTS, STANDARD_SINGLE_IMAGE_SPECS_DETAIL)
6. **350 x 175 px** - Additional horizontal image (minimum)
7. **600 x 180 px** - Company logo (STANDARD_COMPANY_LOGO)
8. **970 x 300 px** - Overlay banner (STANDARD_IMAGE_TEXT_OVERLAY)
9. **970 x 600 px** - Header image (STANDARD_HEADER_IMAGE_TEXT)

## Premium Sizes (Premium Modules)
10. **200 x 225 px** - Premium Comparison Table 1 products (up to 7 products)
11. **300 x 225 px** - Premium Comparison Table 2 & 3, Premium Four Images & Text
12. **650 x 350 px** - Premium Single Image with Text, Premium Dual Images
13. **1464 x 600 px** - Premium desktop images (Hotspots, Navigation Carousel, Regimen, Full Image, Simple Carousel)
14. **1940 x 600 px** - Premium Background Image with Text (desktop)
15. **600 x 450 px** - Premium mobile backgrounds (all carousel/hotspot modules)
16. **800 x 600 px** - Premium Video with Text thumbnail
17. **1920 x 1080 px** - Premium Full Video thumbnail
18. **960 x 540 px** - Premium Video Image Carousel (minimum video resolution)

**Total unique placeholder images needed: 18**
**Total unique placeholder videos needed: 3** (Full Video, Video with Text, Video Carousel)

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
5. Upload all 16 placeholder images (+ 3 video placeholders)
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
