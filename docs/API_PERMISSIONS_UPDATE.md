# Amazon API Permissions Update - December 2025

## New Permissions Approved by Amazon

**Date:** December 11, 2025
**Status:** ✅ APPROVED

Amazon has approved the following new permissions for our SP-API application:

1. **✅ A+ Content Manager** - Enhanced A+ Content API access
2. **✅ Image Management** - Asset Library read/write permissions
3. **✅ Upload and Manage Videos** - Video upload and management

---

## What This Means

Previously, our SP-API application had **403 Forbidden** errors when attempting:

### Previously Failed (403 Forbidden):
- ❌ Direct image upload via Uploads API endpoint
- ❌ Asset Library API endpoints (read/write)
- ❌ Video upload endpoints
- ❌ S3 upload credential generation

### Now Potentially Available:
With the new **Image Management** and **Upload and Manage Videos** permissions, we may now have access to:

- ✅ `/uploads/2020-11-01/uploadDestinations` - Create upload destination for images/videos
- ✅ `/aplus/2020-11-01/assets` - Asset Library management
- ✅ Asset Library list/search endpoints
- ✅ Video upload endpoints
- ✅ S3 upload credentials generation

---

## Testing Plan

### Phase 1: Test Uploads API (HIGH PRIORITY)

**Endpoint:** `POST /uploads/2020-11-01/uploadDestinations`

**Test with:**
```javascript
{
  "resource": "aplus/2020-11-01/contentDocuments",
  "contentMD5": "[MD5 hash of image]",
  "contentType": "image/jpeg"
}
```

**Expected Result (if permissions work):**
```javascript
{
  "uploadDestinationId": "aplus-media-library-service-media/[UUID].jpg",
  "url": "https://aplus-media-library-service-media-upload.s3.amazonaws.com/",
  "headers": {
    "x-amz-server-side-encryption": "AES256",
    // ... S3 upload fields
  }
}
```

**If successful:** This gives us programmatic image upload! 🎉

**Existing test function:**
- Menu: Export to Amazon → 🧪 Test S3 Direct Upload
- File: `apps-script/APlusS3Upload.gs`

### Phase 2: Test Asset Library API (MEDIUM PRIORITY)

**Endpoints to test:**

1. **List Assets**
   ```
   GET /aplus/2020-11-01/assets
   Query: marketplaceId=A1PA6795UKMFR9
   ```

2. **Search Assets**
   ```
   GET /aplus/2020-11-01/assets/search
   Query: marketplaceId=A1PA6795UKMFR9&query=product
   ```

3. **Get Asset Details**
   ```
   GET /aplus/2020-11-01/assets/{assetId}
   ```

**If successful:** We can list and search Asset Library programmatically!

**Existing test function:**
- Menu: Export to Amazon → 🧪 Test Asset Library API
- File: `apps-script/APlusAssetLibraryTest.gs`

### Phase 3: Test Video Upload (MEDIUM PRIORITY)

**Endpoint:** `POST /uploads/2020-11-01/uploadDestinations`

**Test with:**
```javascript
{
  "resource": "aplus/2020-11-01/contentDocuments",
  "contentMD5": "[MD5 hash of video]",
  "contentType": "video/mp4"
}
```

**Video specs (from APLUS_PLACEHOLDER_IMAGES_SPEC.md):**
- Format: MP4
- Codec: H.264
- Max resolution: 1920x1080
- Three types:
  1. Full Video (1920x1080) - PREMIUM_FULL_VIDEO
  2. Video with Text (800x600) - PREMIUM_VIDEO_WITH_TEXT
  3. Video Carousel (960x540 min) - PREMIUM_VIDEO_IMAGE_CAROUSEL

### Phase 4: Integration (LOW PRIORITY - only if above tests pass)

**If Uploads API now works**, implement:

1. **New function:** `uploadImageToAssetLibrary(imageUrl, contentType)`
   - Download image from URL
   - Calculate MD5 hash
   - Request upload destination
   - Upload to S3
   - Return uploadDestinationId

2. **New function:** `uploadVideoToAssetLibrary(videoUrl, contentType)`
   - Similar to image upload
   - Handle video-specific validation

3. **Update APlusModuleBuilder.gs:**
   - Auto-upload images if `image_url` provided but no `image_id`
   - Store uploadDestinationId in Image Library for reuse

4. **Update workflow:**
   - Option A: Text only (existing)
   - Option B: Text + real images (manual upload → existing)
   - Option C: Text + placeholder images (manual upload → existing)
   - **Option D: Text + auto-uploaded images (NEW!)** ✨

---

## How to Test

### Step 1: Update SP-API Application Credentials

1. Go to Amazon Developer Console: https://developer.amazon.com/
2. Log in with your seller account
3. Navigate to your SP-API application
4. Verify the new permissions are listed:
   - A+ Content Manager ✅
   - Image Management ✅
   - Upload and Manage Videos ✅

### Step 2: Regenerate Refresh Token (CRITICAL!)

**IMPORTANT:** New permissions require re-authorization!

1. Generate new authorization link:
   ```
   https://sellercentral.amazon.de/apps/authorize/consent
     ?application_id={CLIENT_ID}
     &state=test
     &version=beta
   ```

2. Open in browser and authorize **again** (this grants new permissions)

3. Exchange auth code for new Refresh Token

4. Update **Client Settings** sheet with new Refresh Token

5. **Access Token will now include new permissions!**

### Step 3: Run Tests

**Test Uploads API:**
```
Menu → Export to Amazon → 🧪 Test S3 Direct Upload
```

**Test Asset Library API:**
```
Menu → Export to Amazon → 🧪 Test Asset Library API
```

**Check logs:**
```
Extensions → Apps Script → Executions
```

**Look for:**
- ✅ **200 OK** responses (SUCCESS! Permissions work!)
- ❌ **403 Forbidden** (Permissions not yet active, wait or re-authorize)
- ❌ **401 Unauthorized** (Need to regenerate Refresh Token with new permissions)

---

## Expected Timeline

### Immediate (after re-authorization):
- Test existing functions to see if 403 errors are gone
- Document which endpoints now work

### Short-term (if tests pass):
- Implement image upload function
- Implement video upload function
- Update Image Library to auto-upload

### Medium-term:
- Full automation: provide image URL → auto-upload → publish A+ Content
- Video upload workflow
- Placeholder image upload automation

---

## Risks & Considerations

### Risk 1: Permissions not yet active
**Possibility:** Amazon approved but hasn't activated permissions yet.
**Solution:** Wait 24-48 hours, then test again.

### Risk 2: Require re-authorization
**Possibility:** New permissions require user to re-authorize app.
**Solution:** Generate new Refresh Token (see Step 2 above).

### Risk 3: Limited permissions
**Possibility:** "Image Management" gives read-only access, not upload.
**Solution:** Test to confirm scope, contact Amazon if upload still fails.

### Risk 4: Different endpoints
**Possibility:** New permissions use different endpoint paths.
**Solution:** Check Amazon SP-API documentation for Image Management API spec.

---

## Documentation to Update (if successful)

### If Uploads API works:

1. **Update:** `docs/APLUS_IMAGE_WORKFLOW.md`
   - Add section "✅ NEW: Programmatic Image Upload"
   - Update workflow diagram
   - Add auto-upload instructions

2. **Update:** `README.md`
   - Add "✅ Automatic image upload via API"
   - Update A+ Content workflow section

3. **Create:** `docs/IMAGE_UPLOAD_API_GUIDE.md`
   - Step-by-step guide for image upload
   - API reference
   - Error handling

4. **Update:** `docs/PROGRESS_REPORT.md`
   - Mark "Badanie nowych uprawnień API" as DONE
   - Add section about successful image upload

---

## Quick Reference: Before vs After

### Before (Manual Upload):
```
1. Create image (300x300px)
2. Go to Seller Central
3. Navigate to A+ Content Manager
4. Create/edit A+ Content
5. Upload image to Asset Library (manual)
6. Note uploadDestinationId (difficult to find!)
7. Add to Image Library sheet (manual)
8. Fill APlusBasic sheet with image_id
9. Publish A+ Content
```

### After (if API works):
```
1. Create image (300x300px)
2. Upload to your CDN/server
3. Fill APlusBasic sheet with image_url
4. Publish A+ Content
5. System auto-uploads and publishes ✨
```

**Time saved:** ~10 minutes per image!
**Error reduction:** No manual copy-paste of uploadDestinationId!

---

## Next Steps

1. ✅ Document new permissions (this file)
2. ⏳ **Re-authorize SP-API application** to activate new permissions
3. ⏳ **Test Uploads API** - see if 403 is gone
4. ⏳ **Test Asset Library API** - see if we can list assets
5. ⏳ **Test Video Upload** - if image upload works
6. ⏳ **Implement auto-upload** - if tests pass
7. ⏳ **Update all documentation** - reflect new capabilities

---

## Status Tracking

| Task | Status | Date | Notes |
|------|--------|------|-------|
| Document permissions | ✅ DONE | 2025-12-11 | This file |
| Re-authorize app | ⏳ TODO | - | Need new Refresh Token |
| Test Uploads API | ⏳ TODO | - | Check for 200 OK |
| Test Asset Library | ⏳ TODO | - | List/search assets |
| Test Video Upload | ⏳ TODO | - | MP4 upload |
| Implement upload function | ⏳ TODO | - | Only if tests pass |
| Update documentation | ⏳ TODO | - | Multiple files |

---

## Contact Amazon Support (if needed)

**If tests still fail after re-authorization:**

1. Go to: https://developer.amazon.com/support/contact-us
2. Select: SP-API Support
3. Subject: "Image Management permissions - still getting 403"
4. Include:
   - Application ID
   - Seller ID
   - Marketplace ID
   - Error message
   - Timestamp of failed request
   - Request ID from response headers

---

**Last updated:** 2025-12-11
**Author:** Claude (Amazon Content Manager Development)
**Related docs:**
- `docs/APLUS_IMAGE_WORKFLOW.md` - Current hybrid workflow
- `docs/APLUS_PLACEHOLDER_IMAGES_SPEC.md` - Image specifications
- `apps-script/APlusS3Upload.gs` - Upload test functions
- `apps-script/APlusAssetLibraryTest.gs` - Asset Library tests
