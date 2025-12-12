# A+ Content Image Upload Workflow

---

## 🎉 UPDATE: December 11, 2025

**Amazon has approved new API permissions!**

- ✅ **A+ Content Manager** - Enhanced A+ Content API access
- ✅ **Image Management** - Asset Library read/write permissions
- ✅ **Upload and Manage Videos** - Video upload and management

**This may enable programmatic image/video upload!** 🚀

**See:** `docs/API_PERMISSIONS_UPDATE.md` for testing plan and integration steps.

**Action required:**
1. Re-authorize SP-API application to activate new permissions
2. Test Uploads API endpoint (previously returned 403)
3. Test Asset Library endpoints
4. If successful, implement auto-upload functionality

---

## Problem Summary (Historical)

Amazon's A+ Content requires images to be uploaded to the **Asset Library** (separate from Product Images). The SP-API Uploads endpoint **previously returned 403 Unauthorized**, preventing programmatic image uploads.

**Note:** With new permissions, this may now work! See update above.

## Current Status

### ✅ Working:
- Publishing A+ Content with **text-only modules**
- **Retrieving uploadDestinationId** from existing A+ Content documents
- **Image Library system** to track and reuse uploadDestinationIds

### ❌ Not Working:
- Direct image upload via SP-API Uploads endpoint (403 Unauthorized)
- All Asset Library API endpoints (403 Forbidden - exist but require additional permissions)
- Direct S3 upload (requires AWS credentials/signature we don't have)

## Discovered Endpoints

### S3 Direct Upload (Browser)
```
URL: https://aplus-media-library-service-media-upload.s3.amazonaws.com/
Method: POST
Content-Type: multipart/form-data
Response: 204 No Content
Location: https://aplus-media-library-service-media-upload.s3.amazonaws.com/[UUID].jpg
```

This is the endpoint Seller Central uses. The UUID from the Location header becomes the uploadDestinationId:
```
uploadDestinationId: aplus-media-library-service-media/[UUID].jpg
```

### Asset Library API Endpoints (All 403)
All tested endpoints return `403 Forbidden` with message "Access to requested resource is denied":
- `/aplus/2020-11-01/assets`
- `/aplus/2020-11-01/mediaLibrary`
- `/aplus/2020-11-01/contentAssets`
- `/media/2020-11-01/assets`
- `/assets/2020-11-01/library`
- `/content/2020-11-01/media`
- `/creative/2020-11-01/assets`

**Note**: 403 (not 404) means endpoints exist but our API application lacks permissions.

## Workaround Solution: Image Library System

Since programmatic upload isn't available, we've implemented a **hybrid workflow**:

### 1. Create Image Library Sheet

**Menu**: Export to Amazon → 📚 Create Image Library

This creates a new sheet `A+ Image Library` with columns:
- `uploadDestinationId` - The Amazon uploadDestinationId
- `image_url` - Your image URL (for matching)
- `image_hash` - Image hash (for deduplication)
- `alt_text` - Alt text from A+ Content
- `width` / `height` - Image dimensions
- `source_content_key` - Which A+ Content this came from
- `module_type` - Module type (STANDARD_SINGLE_SIDE_IMAGE, etc.)
- `date_synced` - When synced
- `status` - ACTIVE, ARCHIVED, etc.
- `notes` - Additional notes

### 2. Sync Images from Existing A+ Content

**Menu**: Export to Amazon → 🔄 Sync Images to Library

This function:
1. Searches all existing A+ Content documents
2. Retrieves full document details with `includedDataSet=CONTENTS,METADATA`
3. Extracts `uploadDestinationId` from image fields
4. Populates the Image Library sheet

**Example uploadDestinationId retrieved**:
```
aplus-media-library-service-media/3444de6d-44c9-4a69-9567-9acaba9798ce.jpg
```

### 3. Manual Upload & Tracking

For new images not yet in A+ Content:

1. **Upload manually** to Seller Central:
   - Go to: Seller Central → Advertising → A+ Content Manager
   - Click any A+ Content → Edit → Select module with image
   - Upload image to Asset Library
   - Note the image identifier

2. **Add to Image Library sheet**:
   - Add row with uploadDestinationId and image_url
   - This allows automatic lookup when publishing new A+ Content

### 4. Publish A+ Content with Images

The system now has **two ways** to get uploadDestinationId:

**Option A: Direct uploadDestinationId in sheet**
```
Column: image_id
Value: aplus-media-library-service-media/3444de6d-44c9-4a69-9567-9acaba9798ce.jpg
```

**Option B: Automatic library lookup by URL**
```
Column: image_url
Value: https://example.com/product-image.jpg
```

The system will:
1. Check for direct `image_id` value
2. If not found, lookup in Image Library using `image_url`
3. Log warning if no uploadDestinationId found

## Sheet Structure for A+ Content with Images

### Required Columns

**APlusBasic / APlusPremium sheets:**

**Text columns** (existing):
- `asin`
- `moduleNumber`
- `moduleType`
- `headline_de-DE`, `headline_en-GB`, etc.
- `body_de-DE`, `body_en-GB`, etc.

**Image columns** (new):
```
image_url          - URL to your image (for library lookup)
image_id           - Direct uploadDestinationId (optional, overrides library)
image_altText      - Alt text for accessibility
imagePositionType  - LEFT or RIGHT (for STANDARD_SINGLE_SIDE_IMAGE)
```

**Example row for STANDARD_SINGLE_SIDE_IMAGE:**
```
asin: B08XYZ1234
moduleNumber: 1
moduleType: STANDARD_SINGLE_SIDE_IMAGE
headline_de-DE: Premium Qualität
body_de-DE: Unsere Produkte sind...
image_url: https://mycdn.com/images/product1.jpg
image_altText: Premium product showcase
imagePositionType: RIGHT
```

### uploadDestinationId Format

**IMPORTANT**: uploadDestinationId has a specific format:
```
aplus-media-library-service-media/[UUID].[extension]
```

**Correct examples**:
```
aplus-media-library-service-media/3444de6d-44c9-4a69-9567-9acaba9798ce.jpg
aplus-media-library-service-media/7152724c-5731-4aed-9d81-7c98b41627f0.png
```

**WRONG - these will NOT work**:
```
71v93yjSQXL                    ← This is IMAGE_ID from CDN URL, not uploadDestinationId
https://m.media-amazon.com/... ← This is CDN URL, not uploadDestinationId
```

### Key Distinction: IMAGE_ID vs uploadDestinationId

**IMAGE_ID** (from product images):
- Format: `71v93yjSQXL` (alphanumeric, 11 chars)
- Location: CDN URL `https://m.media-amazon.com/images/I/71v93yjSQXL.jpg`
- Used for: Product main images (MAIN, PT01, PT02, etc.)
- **CANNOT be used in A+ Content**

**uploadDestinationId** (for A+ Content):
- Format: `aplus-media-library-service-media/[UUID].jpg`
- Location: Asset Library (separate from product images)
- Used for: A+ Content modules only
- **Required format** - API will reject other formats

## Testing & Debugging Functions

### 🧪 Test S3 Direct Upload
**Menu**: Export to Amazon → 🧪 Test S3 Direct Upload

Attempts to upload directly to S3 endpoint with various authentication strategies:
1. Simple POST (no auth)
2. With SP-API access token
3. With AWS Signature V4 (requires AWS credentials)

**Expected result**: All fail, but logs show what's needed.

### 🧪 Search S3 Credential Endpoints
**Menu**: Export to Amazon → 🧪 Search S3 Credential Endpoints

Tests possible endpoints that might return S3 upload credentials:
- `/aplus/2020-11-01/assets/uploadCredentials`
- `/aplus/2020-11-01/media/upload`
- `/content/2020-11-01/media/upload`

**Expected result**: All return 403, but documents what was tried.

### 🧪 Test Asset Library API
**Menu**: Export to Amazon → 🧪 Test Asset Library API

Tests various Asset Library endpoints. All return 403 but useful to see which exist.

## Future Possibilities

### Option 1: Request Additional API Permissions
Contact Amazon Developer Support to request:
- Asset Library read/write permissions
- Media upload permissions for A+ Content

**Risk**: May require re-registering SP-API application (2-3 weeks, possible rejection)

### Option 2: Reverse-Engineer S3 Upload
Capture complete POST request from browser including:
- AWS Signature V4 fields
- Policy document
- Temporary credentials

**Challenge**: These are likely session-specific and time-limited.

### Option 3: Browser Automation
Use automation (Puppeteer, Selenium) to:
1. Login to Seller Central
2. Navigate to Asset Library
3. Upload images programmatically
4. Extract uploadDestinationId from response

**Challenge**: Against Amazon TOS, high maintenance.

### Option 4: Continue with Hybrid Workflow
Current solution:
- Manual upload for new images
- Track in Image Library
- Automatic lookup when publishing
- Reuse existing uploadDestinationIds

**Benefit**: Works now, low risk, uses official APIs.

## Workflow Diagram

```
┌─────────────────────────────────────────────┐
│  New Image Needed for A+ Content            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Is image already in A+ Image Library?      │
└─────┬─────────────────────┬─────────────────┘
      │ YES                 │ NO
      │                     │
      ▼                     ▼
┌─────────────────┐   ┌──────────────────────┐
│ Use existing    │   │ Upload manually to   │
│ uploadDest ID   │   │ Seller Central       │
│ from library    │   │ Asset Library        │
└─────────────────┘   └─────────┬────────────┘
                                │
                                ▼
                      ┌──────────────────────┐
                      │ Note the upload      │
                      │ DestinationId        │
                      └─────────┬────────────┘
                                │
                                ▼
                      ┌──────────────────────┐
                      │ Add to Image Library │
                      │ sheet (URL + ID)     │
                      └─────────┬────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────┐
│  Fill sheet with image_url or image_id      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Run: Publish A+ Content                    │
│  System auto-looks up uploadDestinationId   │
└─────────────────────────────────────────────┘
```

## Quick Start Guide

### First Time Setup

1. **Create Image Library**
   - Menu: Export to Amazon → 📚 Create Image Library
   - This creates the "A+ Image Library" sheet

2. **Sync Existing Images**
   - Menu: Export to Amazon → 🔄 Sync Images to Library
   - This populates library with images from existing A+ Content

3. **Review Library**
   - Open "A+ Image Library" sheet
   - You'll see uploadDestinationIds extracted from your published A+ Content

### Publishing New A+ Content with Images

1. **Check if image is in library**
   - Look in "A+ Image Library" sheet
   - Match by image_url if available

2. **If NOT in library - Manual upload required**
   - Go to Seller Central → A+ Content Manager
   - Create/edit any A+ Content
   - Upload image to Asset Library
   - Amazon will show the uploaded image in library
   - Note: You can't easily see the uploadDestinationId in UI

3. **Get uploadDestinationId for new uploads**
   - **Option A**: Publish simple test A+ Content with the image
   - Then run "Sync Images to Library" to extract the ID
   - **Option B**: Use browser Network tab to capture S3 response Location header

4. **Fill A+ Content sheet**
   ```
   Either:
   - image_url: https://mycdn.com/image.jpg  (system looks up in library)

   Or:
   - image_id: aplus-media-library-service-media/[UUID].jpg  (direct)
   ```

5. **Publish**
   - Menu: Export to Amazon → 📤 Publish A+ Content
   - System will lookup uploadDestinationId automatically
   - Check Execution Log for any warnings

## Troubleshooting

### Error: "No uploadDestinationId found in library"

**Cause**: Image URL not in library, no direct image_id provided

**Solution**:
1. Check if image_url matches exactly (case-sensitive)
2. Add image to library manually or via sync
3. Or provide direct uploadDestinationId in image_id column

### Error: "MEDIA_FAILED_VALIDATION"

**Cause**: Wrong dimensions for module type

**Solutions**:
- STANDARD_SINGLE_SIDE_IMAGE: 300x300 pixels
- STANDARD_HEADER_IMAGE_TEXT: 970x600 pixels
- Upload correct size to Asset Library

### Error: "image.altText: must not be null"

**Cause**: altText is required for all images

**Solution**: Fill `image_altText` column with descriptive text

### Warning: "Access to requested resource is denied" (403)

**Cause**: SP-API application lacks permissions for:
- Uploads API
- Asset Library endpoints

**Solutions**:
1. Use hybrid workflow (current solution)
2. Contact Amazon Developer Support for additional permissions (risky)

## API Reference

### Successful Endpoints

**getContentDocument** - Retrieve A+ Content with images
```
GET /aplus/2020-11-01/contentDocuments/{contentReferenceKey}
Query params:
  - marketplaceId: A1PA6795UKMFR9
  - includedDataSet: CONTENTS,METADATA

Response includes:
  contentRecord.contentDocument.contentModuleList[].standardSingleSideImage.block.image.uploadDestinationId
```

### Failed Endpoints (403 Unauthorized)

**createUploadDestination** - Upload API
```
POST /uploads/2020-11-01/uploadDestinations
Body: {
  resource: "aplus/2020-11-01/contentDocuments",
  contentType: "image/jpeg"
}

Response: 403 - Access to requested resource is denied
```

**S3 Direct Upload** - Browser endpoint
```
POST https://aplus-media-library-service-media-upload.s3.amazonaws.com/
Content-Type: multipart/form-data

Requires: AWS Signature V4 (credentials we don't have)
```

## Files

### Created Files

- `apps-script/APlusS3Upload.gs` - S3 upload experiments and Image Library system
- `apps-script/APlusContentSync.gs` - Sync uploadDestinationIds from existing A+ Content
- `apps-script/APlusAssetLibraryTest.gs` - Test Asset Library endpoints
- `docs/APLUS_IMAGE_WORKFLOW.md` - This documentation

### Modified Files

- `apps-script/LukoAmazonManager.gs` - Added menu items
- `apps-script/APlusModuleBuilder.gs` - Enhanced getImageId() with library lookup

## Support

For questions or issues:
1. Check Execution Log: Extensions → Apps Script → Executions
2. Review this documentation
3. Test with simple text-only A+ Content first
4. Use Image Library for image tracking and reuse
