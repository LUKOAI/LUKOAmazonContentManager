/**
 * A+ Content S3 Direct Upload - Experimental
 *
 * This module attempts to replicate the S3 upload that Seller Central uses
 * Endpoint discovered: https://aplus-media-library-service-media-upload.s3.amazonaws.com/
 */

/**
 * Attempt 1: Try direct S3 POST upload with minimal fields
 * This will likely fail but will show us what's required
 */
function testS3DirectUpload() {
  try {
    const ui = SpreadsheetApp.getUi();

    // For testing, we'll use a small test image
    const testImageUrl = ui.prompt(
      'Test S3 Upload',
      'Enter image URL to test upload:',
      ui.ButtonSet.OK_CANCEL
    );

    if (testImageUrl.getSelectedButton() !== ui.Button.OK) {
      return;
    }

    const imageUrl = testImageUrl.getResponseText();

    Logger.log('Fetching image from URL...');
    const imageResponse = UrlFetchApp.fetch(imageUrl);
    const imageBlob = imageResponse.getBlob();

    Logger.log(`Image fetched: ${imageBlob.getContentType()}, size: ${imageBlob.getBytes().length}`);

    // S3 endpoint discovered from browser
    const s3Endpoint = 'https://aplus-media-library-service-media-upload.s3.amazonaws.com/';

    // Generate a UUID for the filename (similar to what we saw in browser)
    const uuid = Utilities.getUuid();
    const extension = imageBlob.getContentType().split('/')[1] || 'jpg';
    const filename = `${uuid}.${extension}`;

    Logger.log(`Generated filename: ${filename}`);

    // Attempt 1: Simple POST without AWS signature
    // This will fail but show us what's required
    Logger.log('Attempt 1: Simple POST without authentication...');

    const simpleOptions = {
      method: 'post',
      payload: {
        'file': imageBlob,
        'key': filename
      },
      muteHttpExceptions: true
    };

    const response1 = UrlFetchApp.fetch(s3Endpoint, simpleOptions);
    const code1 = response1.getResponseCode();
    const body1 = response1.getContentText();
    const headers1 = response1.getAllHeaders();

    Logger.log(`Simple POST Response Code: ${code1}`);
    Logger.log(`Response Body: ${body1}`);
    Logger.log(`Response Headers: ${JSON.stringify(headers1)}`);

    if (code1 === 204) {
      const location = headers1['Location'] || headers1['location'];
      Logger.log(`✅ SUCCESS! Location: ${location}`);
      ui.alert('Success!', `Image uploaded to: ${location}`, ui.ButtonSet.OK);
      return location;
    }

    // Attempt 2: Try with SP-API access token
    Logger.log('Attempt 2: With SP-API access token...');

    const client = getActiveClient();
    const accessToken = getActiveAccessToken();

    const tokenOptions = {
      method: 'post',
      headers: {
        'x-amz-access-token': accessToken
      },
      payload: {
        'file': imageBlob,
        'key': filename
      },
      muteHttpExceptions: true
    };

    const response2 = UrlFetchApp.fetch(s3Endpoint, tokenOptions);
    const code2 = response2.getResponseCode();
    const body2 = response2.getContentText();
    const headers2 = response2.getAllHeaders();

    Logger.log(`Token POST Response Code: ${code2}`);
    Logger.log(`Response Body: ${body2}`);
    Logger.log(`Response Headers: ${JSON.stringify(headers2)}`);

    if (code2 === 204) {
      const location = headers2['Location'] || headers2['location'];
      Logger.log(`✅ SUCCESS! Location: ${location}`);
      ui.alert('Success!', `Image uploaded to: ${location}`, ui.ButtonSet.OK);
      return location;
    }

    // Show summary
    let message = 'S3 Upload Tests Failed\n\n';
    message += `Attempt 1 (Simple POST): ${code1}\n`;
    message += `Attempt 2 (With Token): ${code2}\n\n`;
    message += `To make this work, we need:\n`;
    message += `1. AWS Signature V4 fields from browser\n`;
    message += `2. Policy document\n`;
    message += `3. Temporary credentials\n\n`;
    message += `Check Execution Log for details.`;

    ui.alert('Upload Test Results', message, ui.ButtonSet.OK);

  } catch (error) {
    Logger.log(`Error in testS3DirectUpload: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Upload Test Error: ' + error.toString());
  }
}

/**
 * AWS Signature V4 helper - generates signature for S3 POST
 * Based on AWS documentation: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-post-example.html
 */
function generateAWSSignatureV4(secretKey, region, date, stringToSign) {
  function hmacSHA256(key, data) {
    return Utilities.computeHmacSha256Signature(Utilities.newBlob(data).getBytes(), key);
  }

  const kDate = hmacSHA256(Utilities.newBlob('AWS4' + secretKey).getBytes(), date);
  const kRegion = hmacSHA256(kDate, region);
  const kService = hmacSHA256(kRegion, 's3');
  const kSigning = hmacSHA256(kService, 'aws4_request');
  const signature = hmacSHA256(kSigning, stringToSign);

  return Utilities.base64Encode(signature);
}

/**
 * Attempt S3 upload with AWS Signature V4
 * This requires AWS credentials (access key + secret key)
 *
 * NOTE: We don't have AWS credentials - SP-API uses LWA tokens, not AWS IAM
 * This is here for documentation purposes
 */
function attemptS3WithAWSSignature(imageBlob, awsAccessKey, awsSecretKey) {
  const s3Endpoint = 'https://aplus-media-library-service-media-upload.s3.amazonaws.com/';
  const region = 'us-east-1'; // Guess based on S3 endpoint
  const bucket = 'aplus-media-library-service-media-upload';

  // Generate upload credentials
  const now = new Date();
  const dateStamp = Utilities.formatDate(now, 'UTC', 'yyyyMMdd');
  const amzDate = Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

  const uuid = Utilities.getUuid();
  const extension = imageBlob.getContentType().split('/')[1] || 'jpg';
  const key = `${uuid}.${extension}`;

  // Policy document
  const policy = {
    'expiration': Utilities.formatDate(new Date(now.getTime() + 3600000), 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    'conditions': [
      {'bucket': bucket},
      ['starts-with', '$key', ''],
      {'acl': 'private'},
      ['starts-with', '$Content-Type', 'image/'],
      {'x-amz-algorithm': 'AWS4-HMAC-SHA256'},
      {'x-amz-credential': `${awsAccessKey}/${dateStamp}/${region}/s3/aws4_request`},
      {'x-amz-date': amzDate}
    ]
  };

  const policyBase64 = Utilities.base64Encode(JSON.stringify(policy));
  const signature = generateAWSSignatureV4(awsSecretKey, region, dateStamp, policyBase64);

  // Build POST form data
  const formData = {
    'key': key,
    'acl': 'private',
    'Content-Type': imageBlob.getContentType(),
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-credential': `${awsAccessKey}/${dateStamp}/${region}/s3/aws4_request`,
    'x-amz-date': amzDate,
    'Policy': policyBase64,
    'x-amz-signature': signature,
    'file': imageBlob
  };

  const options = {
    method: 'post',
    payload: formData,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(s3Endpoint, options);

  Logger.log(`AWS Signature upload response: ${response.getResponseCode()}`);
  Logger.log(`Response body: ${response.getContentText()}`);

  return response;
}

/**
 * Check if we can find an endpoint that provides S3 upload credentials
 * Similar to how Uploads API works, but specifically for Asset Library
 */
function searchForS3CredentialEndpoints() {
  try {
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();
    const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
    const endpoint = marketplaceConfig.endpoint;
    const marketplaceId = marketplaceConfig.marketplaceId;

    const results = [];

    // Possible endpoints that might return S3 upload credentials
    const endpointsToTest = [
      {
        name: 'A+ Assets Upload Credentials',
        url: `${endpoint}/aplus/2020-11-01/assets/uploadCredentials?marketplaceId=${marketplaceId}`,
        method: 'post',
        body: {contentType: 'image/jpeg'}
      },
      {
        name: 'A+ Media Upload',
        url: `${endpoint}/aplus/2020-11-01/media/upload?marketplaceId=${marketplaceId}`,
        method: 'post',
        body: {contentType: 'image/jpeg'}
      },
      {
        name: 'A+ Assets Create',
        url: `${endpoint}/aplus/2020-11-01/assets?marketplaceId=${marketplaceId}`,
        method: 'post',
        body: {assetType: 'IMAGE', contentType: 'image/jpeg'}
      },
      {
        name: 'Content Media Upload',
        url: `${endpoint}/content/2020-11-01/media/upload?marketplaceId=${marketplaceId}`,
        method: 'post',
        body: {contentType: 'image/jpeg'}
      }
    ];

    Logger.log('========================================');
    Logger.log('Searching for S3 Credential Endpoints');
    Logger.log('========================================');

    for (const test of endpointsToTest) {
      Logger.log(`\n--- Testing: ${test.name} ---`);
      Logger.log(`URL: ${test.url}`);

      try {
        const options = {
          method: test.method,
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify(test.body),
          muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(test.url, options);
        const responseCode = response.getResponseCode();
        const responseBody = response.getContentText();

        Logger.log(`Response Code: ${responseCode}`);
        Logger.log(`Response: ${responseBody.substring(0, 500)}`);

        results.push({
          name: test.name,
          code: responseCode,
          response: responseBody.substring(0, 200)
        });

      } catch (error) {
        Logger.log(`Error: ${error.toString()}`);
        results.push({
          name: test.name,
          error: error.toString()
        });
      }

      Utilities.sleep(1000);
    }

    Logger.log('\n========================================');
    Logger.log('Results Summary');
    Logger.log('========================================');

    results.forEach(r => {
      Logger.log(`${r.name}: ${r.code || 'ERROR'}`);
    });

    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'S3 Credential Endpoint Search Complete',
      'Check Execution Log for results.\n\nExtensions → Apps Script → Executions',
      ui.ButtonSet.OK
    );

    return results;

  } catch (error) {
    Logger.log(`Error in searchForS3CredentialEndpoints: ${error.toString()}`);
    SpreadsheetApp.getUi().alert('Search Error: ' + error.toString());
  }
}

/**
 * PRACTICAL SOLUTION: Image Library Management System
 *
 * Since direct S3 upload requires credentials we don't have,
 * this implements a practical workaround:
 *
 * 1. Maintain a library of uploadDestinationIds synced from existing A+ Content
 * 2. Allow manual upload through Seller Central with tracking
 * 3. Map images by URL or hash to their uploadDestinationId
 */
function createImageLibrarySheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Check if sheet exists
    let sheet = ss.getSheetByName('A+ Image Library');

    if (!sheet) {
      sheet = ss.insertSheet('A+ Image Library');
      Logger.log('Created new A+ Image Library sheet');
    }

    // Set up headers
    // Columns: A=uploadDestinationId, B=image_url, C=image_hash, D=alt_text, E=width, F=height,
    //          G=source_content_key, H=module_type, I=date_synced, J=status, K=notes, L=original_filename, M=tags
    const headers = [
      'uploadDestinationId',
      'image_url',
      'image_hash',
      'alt_text',
      'width',
      'height',
      'source_content_key',
      'module_type',
      'date_synced',
      'status',
      'notes',
      'original_filename',
      'tags'  // User-defined tags for categorization (comma-separated)
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    SpreadsheetApp.getUi().alert(
      'Image Library Created',
      'A+ Image Library sheet created.\n\nUse "Sync A+ Images" to populate it with uploadDestinationIds from existing A+ Content.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return sheet;

  } catch (error) {
    Logger.log(`Error in createImageLibrarySheet: ${error.toString()}`);
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Enhanced sync that populates the Image Library sheet
 */
function syncImagesToLibrary() {
  try {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create library sheet
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    showProgress('Syncing images from A+ Content...');

    // Get client and token
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();

    // Search for all A+ Content documents
    const documents = searchAPlusContentDocuments(accessToken, client.marketplace);

    Logger.log(`Found ${documents.length} A+ Content documents`);

    if (documents.length === 0) {
      hideProgress();
      ui.alert('No A+ Content found');
      return;
    }

    const libraryData = [];
    let totalImages = 0;

    // Process each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const contentRefKey = doc.contentReferenceKey;

      showProgress(`Processing ${i + 1}/${documents.length}: ${contentRefKey}...`);

      try {
        // Get full document with content
        const fullDocument = getAPlusContentDocument(contentRefKey, accessToken, client.marketplace);

        // Extract images
        const images = extractImageIdsFromContentDocument(fullDocument);

        // Add to library data
        images.forEach(img => {
          // Extract filename from uploadDestinationId
          const parts = (img.uploadDestinationId || '').split('/');
          const filename = parts[parts.length - 1] || '';

          libraryData.push([
            img.uploadDestinationId,
            '', // image_url - to be filled manually or via lookup
            '', // image_hash
            img.altText || '',
            img.width || '', // width from imageCropSpecification
            img.height || '', // height from imageCropSpecification
            contentRefKey,
            img.moduleType,
            new Date(),
            'ACTIVE',
            `Synced from ${contentRefKey}`,
            filename,  // original_filename
            ''         // tags
          ]);
          totalImages++;
        });

      } catch (error) {
        Logger.log(`Error processing ${contentRefKey}: ${error.toString()}`);
      }

      Utilities.sleep(500); // Rate limiting
    }

    hideProgress();

    // Write to library sheet
    if (libraryData.length > 0) {
      const startRow = librarySheet.getLastRow() + 1;
      librarySheet.getRange(startRow, 1, libraryData.length, libraryData[0].length).setValues(libraryData);

      ui.alert(
        'Sync Complete',
        `Added ${totalImages} images to library from ${documents.length} A+ Content documents.\n\nCheck "A+ Image Library" sheet.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('No images found in A+ Content documents.');
    }

  } catch (error) {
    hideProgress();
    Logger.log(`Error in syncImagesToLibrary: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Sync Error: ' + error.toString());
  }
}

/**
 * Look up uploadDestinationId from library by image URL or hash
 */
function lookupUploadDestinationId(imageUrl) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      Logger.log('Image library not found. Run syncImagesToLibrary() first.');
      return null;
    }

    const data = librarySheet.getDataRange().getValues();

    // Search by URL (column 2)
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === imageUrl) {
        Logger.log(`Found uploadDestinationId for ${imageUrl}: ${data[i][0]}`);
        return data[i][0];
      }
    }

    Logger.log(`No uploadDestinationId found for ${imageUrl}`);
    return null;

  } catch (error) {
    Logger.log(`Error in lookupUploadDestinationId: ${error.toString()}`);
    return null;
  }
}

/**
 * Look up alt_text from library by uploadDestinationId
 * @param {string} uploadDestinationId - The uploadDestinationId to search for
 * @returns {string|null} - alt_text or null if not found
 *
 * Image Library columns: 0=uploadDestinationId, 3=alt_text
 */
function lookupImageAltText(uploadDestinationId) {
  try {
    if (!uploadDestinationId) return null;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      return null;
    }

    const data = librarySheet.getDataRange().getValues();

    // Search by uploadDestinationId (column 0), return alt_text (column 3)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === uploadDestinationId) {
        const altText = data[i][3] ? data[i][3].toString() : '';
        if (altText) {
          Logger.log(`Found alt_text for ${uploadDestinationId.substring(0, 30)}...: "${altText}"`);
          return altText;
        }
      }
    }

    return null;

  } catch (error) {
    Logger.log(`Error in lookupImageAltText: ${error.toString()}`);
    return null;
  }
}

/**
 * Look up placeholder uploadDestinationId from library by image size
 * @param {string} size - Expected size in format "WIDTHxHEIGHT" (e.g., "300x300", "970x600")
 * @returns {string|null} - uploadDestinationId or null if not found
 *
 * Image Library columns:
 * 0: uploadDestinationId
 * 1: image_url
 * 2: image_hash
 * 3: alt_text
 * 4: width
 * 5: height
 * 6: source_content_key
 * 7: module_type
 * 8: date_synced
 * 9: status (should be "PLACEHOLDER")
 * 10: notes
 * 11: original_filename
 * 12: tags (user-defined, comma-separated)
 */
function lookupPlaceholderBySize(size) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      Logger.log('Image library not found. Run createImageLibrarySheet() first.');
      return null;
    }

    const data = librarySheet.getDataRange().getValues();

    // Parse size string
    const sizeParts = size.split('x');
    if (sizeParts.length !== 2) {
      Logger.log(`Invalid size format: ${size}. Expected WIDTHxHEIGHT`);
      return null;
    }
    const targetWidth = parseInt(sizeParts[0], 10);
    const targetHeight = parseInt(sizeParts[1], 10);
    const sizePattern = `${targetWidth}x${targetHeight}`;
    const sizePatternSpaced = `${targetWidth} x ${targetHeight}`;
    const sizePatternUnderscore = `${targetWidth}_${targetHeight}`;

    Logger.log(`Looking for placeholder with size ${sizePattern}`);

    // Search for placeholder with matching size
    // Columns: 0=uploadDestinationId, 1=image_url, 2=image_hash, 3=alt_text, 4=width, 5=height,
    //          6=source_content_key, 7=module_type, 8=date_synced, 9=status, 10=notes, 11=original_filename
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const uploadDestinationId = row[0] ? row[0].toString() : '';
      const altText = row[3] ? row[3].toString() : '';
      const width = parseInt(row[4], 10) || 0;
      const height = parseInt(row[5], 10) || 0;
      const status = row[9] ? row[9].toString() : '';
      const notes = row[10] ? row[10].toString() : '';
      const originalFilename = row[11] ? row[11].toString() : '';

      // Check if this is a placeholder (multiple detection methods)
      const isPlaceholder = status === 'PLACEHOLDER' ||
                           status.toLowerCase().includes('placeholder') ||
                           altText.toLowerCase().includes('placeholder') ||
                           notes.toLowerCase().includes('placeholder') ||
                           uploadDestinationId.toLowerCase().includes('placeholder') ||
                           originalFilename.toLowerCase().includes('placeholder');

      if (!isPlaceholder) continue;

      // Method 1: Exact width/height match
      if (width === targetWidth && height === targetHeight) {
        Logger.log(`✅ Found placeholder for ${size} by dimensions: ${uploadDestinationId}`);
        return uploadDestinationId;
      }

      // Method 2: Size pattern in original_filename (e.g., "placeholder_970x600.jpg")
      if (originalFilename.includes(sizePattern) ||
          originalFilename.includes(sizePatternUnderscore)) {
        Logger.log(`✅ Found placeholder for ${size} by original_filename "${originalFilename}": ${uploadDestinationId}`);
        return uploadDestinationId;
      }

      // Method 3: Size pattern in uploadDestinationId (e.g., "placeholder_970x600.jpg")
      if (uploadDestinationId.includes(sizePattern) ||
          uploadDestinationId.includes(sizePatternUnderscore)) {
        Logger.log(`✅ Found placeholder for ${size} in ID: ${uploadDestinationId}`);
        return uploadDestinationId;
      }

      // Method 4: Size pattern in alt_text
      if (altText.includes(sizePattern) || altText.includes(sizePatternSpaced)) {
        Logger.log(`✅ Found placeholder for ${size} by alt_text: ${uploadDestinationId}`);
        return uploadDestinationId;
      }

      // Method 5: Size pattern in notes
      if (notes.includes(sizePattern) || notes.includes(sizePatternSpaced)) {
        Logger.log(`✅ Found placeholder for ${size} by notes: ${uploadDestinationId}`);
        return uploadDestinationId;
      }
    }

    // Second pass: find closest match by aspect ratio
    Logger.log(`No exact placeholder found for ${size}, searching for close matches...`);

    let closestMatch = null;
    let closestDiff = Infinity;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const uploadDestinationId = row[0] ? row[0].toString() : '';
      const altText = row[3] ? row[3].toString() : '';
      const width = parseInt(row[4], 10) || 0;
      const height = parseInt(row[5], 10) || 0;
      const status = row[9] ? row[9].toString() : '';
      const notes = row[10] ? row[10].toString() : '';
      const originalFilename = row[11] ? row[11].toString() : '';

      const isPlaceholder = status === 'PLACEHOLDER' ||
                           status.toLowerCase().includes('placeholder') ||
                           altText.toLowerCase().includes('placeholder') ||
                           notes.toLowerCase().includes('placeholder') ||
                           uploadDestinationId.toLowerCase().includes('placeholder') ||
                           originalFilename.toLowerCase().includes('placeholder');

      if (isPlaceholder && width > 0 && height > 0) {
        // Calculate similarity (aspect ratio match is important)
        const targetRatio = targetWidth / targetHeight;
        const ratio = width / height;
        const ratioDiff = Math.abs(targetRatio - ratio);
        const sizeDiff = Math.abs(width - targetWidth) + Math.abs(height - targetHeight);
        const totalDiff = ratioDiff * 1000 + sizeDiff;

        if (totalDiff < closestDiff) {
          closestDiff = totalDiff;
          closestMatch = uploadDestinationId;
        }
      }
    }

    if (closestMatch && closestDiff < 500) {
      Logger.log(`Using closest placeholder match for ${size}: ${closestMatch} (diff: ${closestDiff})`);
      return closestMatch;
    }

    Logger.log(`❌ No placeholder found for size ${size}. Make sure placeholders are synced to Image Library.`);
    return null;

  } catch (error) {
    Logger.log(`Error in lookupPlaceholderBySize: ${error.toString()}`);
    return null;
  }
}

/**
 * Look up images from library by module type
 * Returns array of images that match the module type
 *
 * @param {string} moduleType - The module type (e.g., "STANDARD_HEADER_IMAGE_TEXT")
 * @param {string} sourceContentKey - Optional: filter by source content key
 * @returns {Array} - Array of image objects with all metadata
 */
function lookupImagesByModuleType(moduleType, sourceContentKey) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      Logger.log('Image library not found.');
      return [];
    }

    const data = librarySheet.getDataRange().getValues();
    const headers = data[0];
    const results = [];

    // Column indices based on library structure
    const COL = {
      uploadDestinationId: 0,
      image_url: 1,
      image_hash: 2,
      alt_text: 3,
      width: 4,
      height: 5,
      source_content_key: 6,
      module_type: 7,
      date_synced: 8,
      status: 9,
      notes: 10
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowModuleType = row[COL.module_type];
      const rowSourceKey = row[COL.source_content_key];
      const status = row[COL.status];

      // Skip non-active images
      if (status && status !== 'ACTIVE') continue;

      // Match module type
      if (rowModuleType === moduleType) {
        // If sourceContentKey provided, also filter by that
        if (sourceContentKey && rowSourceKey !== sourceContentKey) {
          continue;
        }

        results.push({
          uploadDestinationId: row[COL.uploadDestinationId],
          imageUrl: row[COL.image_url],
          imageHash: row[COL.image_hash],
          altText: row[COL.alt_text],
          width: row[COL.width] || null,
          height: row[COL.height] || null,
          sourceContentKey: row[COL.source_content_key],
          moduleType: row[COL.module_type],
          dateSynced: row[COL.date_synced],
          status: row[COL.status],
          notes: row[COL.notes],
          filename: extractFilename(row[COL.uploadDestinationId])
        });
      }
    }

    Logger.log(`Found ${results.length} images for module type ${moduleType}${sourceContentKey ? ` (source: ${sourceContentKey})` : ''}`);
    return results;

  } catch (error) {
    Logger.log(`Error in lookupImagesByModuleType: ${error.toString()}`);
    return [];
  }
}

/**
 * Get first available image for a module type
 * Useful for auto-selecting images
 *
 * @param {string} moduleType - The module type
 * @param {string} sourceContentKey - Optional: filter by source content key
 * @returns {Object|null} - Image object or null if not found
 */
function getFirstImageForModuleType(moduleType, sourceContentKey) {
  const images = lookupImagesByModuleType(moduleType, sourceContentKey);
  return images.length > 0 ? images[0] : null;
}

/**
 * Get image metadata by uploadDestinationId
 * Returns full metadata for an image from the library
 *
 * @param {string} uploadDestinationId - The Amazon uploadDestinationId
 * @returns {Object|null} - Image metadata object or null if not found
 */
function getImageMetadata(uploadDestinationId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet || !uploadDestinationId) {
      return null;
    }

    const data = librarySheet.getDataRange().getValues();

    // Column indices
    const COL = {
      uploadDestinationId: 0,
      image_url: 1,
      image_hash: 2,
      alt_text: 3,
      width: 4,
      height: 5,
      source_content_key: 6,
      module_type: 7,
      date_synced: 8,
      status: 9,
      notes: 10
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[COL.uploadDestinationId] === uploadDestinationId) {
        return {
          uploadDestinationId: row[COL.uploadDestinationId],
          imageUrl: row[COL.image_url],
          imageHash: row[COL.image_hash],
          altText: row[COL.alt_text],
          width: row[COL.width] || null,
          height: row[COL.height] || null,
          sourceContentKey: row[COL.source_content_key],
          moduleType: row[COL.module_type],
          dateSynced: row[COL.date_synced],
          status: row[COL.status],
          notes: row[COL.notes],
          filename: extractFilename(row[COL.uploadDestinationId])
        };
      }
    }

    return null;

  } catch (error) {
    Logger.log(`Error in getImageMetadata: ${error.toString()}`);
    return null;
  }
}

/**
 * Extract filename from uploadDestinationId
 * e.g., "aplus-media-library-service-media/3444de6d-44c9-4a69-9567-9acaba9798ce.jpg"
 *       -> "3444de6d-44c9-4a69-9567-9acaba9798ce.jpg"
 *
 * @param {string} uploadDestinationId - The full uploadDestinationId
 * @returns {string} - Just the filename portion
 */
function extractFilename(uploadDestinationId) {
  if (!uploadDestinationId) return '';

  // Handle different formats
  const parts = uploadDestinationId.split('/');
  return parts[parts.length - 1] || uploadDestinationId;
}

/**
 * Get all unique module types in the image library
 * Useful for understanding what images are available
 *
 * @returns {Array} - Array of unique module types
 */
function getLibraryModuleTypes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      return [];
    }

    const data = librarySheet.getDataRange().getValues();
    const moduleTypes = new Set();

    for (let i = 1; i < data.length; i++) {
      const moduleType = data[i][7]; // module_type column
      if (moduleType) {
        moduleTypes.add(moduleType);
      }
    }

    return Array.from(moduleTypes).sort();

  } catch (error) {
    Logger.log(`Error in getLibraryModuleTypes: ${error.toString()}`);
    return [];
  }
}

/**
 * Get image count summary by module type
 * @returns {Object} - Object with module types as keys and counts as values
 */
function getImageCountByModuleType() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      return {};
    }

    const data = librarySheet.getDataRange().getValues();
    const counts = {};

    for (let i = 1; i < data.length; i++) {
      const moduleType = data[i][7]; // module_type column
      const status = data[i][9]; // status column

      if (moduleType && status === 'ACTIVE') {
        counts[moduleType] = (counts[moduleType] || 0) + 1;
      }
    }

    return counts;

  } catch (error) {
    Logger.log(`Error in getImageCountByModuleType: ${error.toString()}`);
    return {};
  }
}

/**
 * Auto-suggest images for A+ Content based on module types
 * Returns a map of field names to suggested uploadDestinationIds
 *
 * @param {string} moduleType - The module type being built
 * @param {string} sourceContentKey - Optional: prefer images from this source
 * @returns {Object} - Map of field names to uploadDestinationIds
 */
function suggestImagesForModule(moduleType, sourceContentKey) {
  const suggestions = {};
  const images = lookupImagesByModuleType(moduleType, sourceContentKey);

  if (images.length === 0) {
    // Try without source filter
    const allImages = lookupImagesByModuleType(moduleType);
    if (allImages.length > 0) {
      Logger.log(`No images found for source ${sourceContentKey}, using any available for ${moduleType}`);
      images.push(...allImages);
    }
  }

  // Module-specific field mapping
  switch (moduleType) {
    case 'STANDARD_HEADER_IMAGE_TEXT':
    case 'STANDARD_IMAGE_TEXT_OVERLAY':
    case 'STANDARD_SINGLE_IMAGE_SPECS_DETAIL':
    case 'STANDARD_IMAGE_SIDEBAR':
      if (images[0]) suggestions.image_id = images[0].uploadDestinationId;
      break;

    case 'STANDARD_SINGLE_SIDE_IMAGE':
      if (images[0]) suggestions.image_id = images[0].uploadDestinationId;
      break;

    case 'STANDARD_COMPANY_LOGO':
      if (images[0]) suggestions.companyLogo_id = images[0].uploadDestinationId;
      break;

    case 'STANDARD_SINGLE_IMAGE_HIGHLIGHTS':
      if (images[0]) suggestions.image_id = images[0].uploadDestinationId;
      // Bullet icons
      for (let i = 1; i <= 4 && i < images.length; i++) {
        suggestions[`bulleted_list_${i}_icon_id`] = images[i].uploadDestinationId;
      }
      break;

    case 'STANDARD_MULTIPLE_IMAGE_TEXT':
    case 'STANDARD_FOUR_IMAGE_TEXT':
    case 'STANDARD_FOUR_IMAGE_TEXT_QUADRANT':
      for (let i = 0; i < Math.min(4, images.length); i++) {
        suggestions[`image${i + 1}_id`] = images[i].uploadDestinationId;
      }
      break;

    case 'STANDARD_THREE_IMAGE_TEXT':
      for (let i = 0; i < Math.min(3, images.length); i++) {
        suggestions[`image${i + 1}_id`] = images[i].uploadDestinationId;
      }
      break;

    case 'STANDARD_COMPARISON_TABLE':
      for (let i = 0; i < Math.min(6, images.length); i++) {
        suggestions[`productImage${i + 1}_id`] = images[i].uploadDestinationId;
      }
      break;

    case 'PREMIUM_SINGLE_IMAGE':
    case 'PREMIUM_IMAGE_TEXT':
      if (images[0]) suggestions.image_id = images[0].uploadDestinationId;
      break;

    case 'PREMIUM_FULL_BACKGROUND_IMAGE':
    case 'PREMIUM_FULL_BACKGROUND_TEXT':
      if (images[0]) suggestions.backgroundImage_id = images[0].uploadDestinationId;
      break;

    default:
      // Generic: assign first image to image_id
      if (images[0]) suggestions.image_id = images[0].uploadDestinationId;
  }

  Logger.log(`Suggested ${Object.keys(suggestions).length} images for ${moduleType}`);
  return suggestions;
}

/**
 * Upload placeholder images to Amazon and save to Image Library
 * Menu function: LUKO Amazon → A+ Content → Upload Placeholder Images
 *
 * User provides image URLs (one per line), the function:
 * 1. Downloads each image
 * 2. Uploads to Amazon (gets uploadDestinationId)
 * 3. Saves to Image Library with: uploadDestinationId, original_filename, width, height, status=PLACEHOLDER
 */
function uploadPlaceholderImages() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Get image URLs from user
    const response = ui.prompt(
      '📤 Upload Placeholder Images',
      'Wklej URL-e obrazów (jeden na linię).\n\n' +
      'Nazwa pliku powinna zawierać rozmiar, np.:\n' +
      '  placeholder_970x600.png\n' +
      '  amazon_aplus_300x300.jpg\n\n' +
      'Program automatycznie:\n' +
      '✓ Uploaduje do Amazon\n' +
      '✓ Pobiera wymiary\n' +
      '✓ Zapisuje w Image Library\n\n' +
      'URL-e (po jednym w linii):',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) {
      return;
    }

    const urls = response.getResponseText().trim().split('\n').filter(url => url.trim());

    if (urls.length === 0) {
      ui.alert('Błąd', 'Nie podano żadnych URL-ów.', ui.ButtonSet.OK);
      return;
    }

    // Get client credentials
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();
    const marketplace = client.marketplace;

    // Get or create library sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    showProgress(`Uploading ${urls.length} placeholder images...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const imageUrl = urls[i].trim();
      if (!imageUrl) continue;

      showProgress(`Uploading ${i + 1}/${urls.length}: ${imageUrl.substring(0, 50)}...`);

      try {
        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        const originalFilename = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params

        // Extract dimensions from filename (e.g., "placeholder_970x600.png" -> 970, 600)
        const sizeMatch = originalFilename.match(/(\d+)x(\d+)/);
        let expectedWidth = 0;
        let expectedHeight = 0;
        if (sizeMatch) {
          expectedWidth = parseInt(sizeMatch[1], 10);
          expectedHeight = parseInt(sizeMatch[2], 10);
        }

        Logger.log(`Uploading: ${originalFilename} (expected size: ${expectedWidth}x${expectedHeight})`);

        // Upload to Amazon
        const uploadResult = uploadImageToAmazon(imageUrl, originalFilename, accessToken, marketplace);

        if (uploadResult.success) {
          const uploadDestinationId = uploadResult.uploadDestinationId;

          // Add to library
          // Columns: A=uploadDestinationId, B=image_url, C=image_hash, D=alt_text, E=width, F=height,
          //          G=source_content_key, H=module_type, I=date_synced, J=status, K=notes, L=original_filename
          librarySheet.appendRow([
            uploadDestinationId,     // uploadDestinationId
            imageUrl,                // image_url
            '',                      // image_hash
            `Placeholder ${expectedWidth}x${expectedHeight}`, // alt_text
            expectedWidth,           // width
            expectedHeight,          // height
            'PLACEHOLDER_UPLOAD',    // source_content_key
            '',                      // module_type (empty for placeholders)
            new Date(),              // date_synced
            'PLACEHOLDER',           // status
            `Uploaded as placeholder for size ${expectedWidth}x${expectedHeight}`, // notes
            originalFilename         // original_filename
          ]);

          results.push({
            filename: originalFilename,
            uploadDestinationId: uploadDestinationId,
            width: expectedWidth,
            height: expectedHeight,
            success: true
          });
          successCount++;

          Logger.log(`✅ Uploaded: ${originalFilename} → ${uploadDestinationId}`);
        } else {
          results.push({
            filename: originalFilename,
            error: uploadResult.error,
            success: false
          });
          errorCount++;

          Logger.log(`❌ Failed: ${originalFilename} - ${uploadResult.error}`);
        }

      } catch (error) {
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];

        results.push({
          filename: filename,
          error: error.toString(),
          success: false
        });
        errorCount++;

        Logger.log(`❌ Error: ${filename} - ${error.toString()}`);
      }

      // Small delay between uploads to avoid rate limiting
      Utilities.sleep(500);
    }

    hideProgress();

    // Show summary
    let summary = `📤 Upload Placeholder Images - Results\n\n`;
    summary += `✅ Sukces: ${successCount}\n`;
    summary += `❌ Błędy: ${errorCount}\n\n`;

    if (successCount > 0) {
      summary += `Uploadowane placeholdery:\n`;
      results.filter(r => r.success).forEach(r => {
        summary += `• ${r.filename} (${r.width}x${r.height})\n`;
        summary += `  ID: ${r.uploadDestinationId}\n`;
      });
    }

    if (errorCount > 0) {
      summary += `\nBłędy:\n`;
      results.filter(r => !r.success).forEach(r => {
        summary += `• ${r.filename}: ${r.error}\n`;
      });
    }

    ui.alert('Upload Placeholder Images', summary, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    Logger.log(`Error in uploadPlaceholderImages: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Add placeholder to library manually (without upload)
 * For when you already have the uploadDestinationId from Amazon
 */
function addPlaceholderToLibrary() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Get uploadDestinationId
    const idResponse = ui.prompt(
      '➕ Add Placeholder to Library',
      'Wklej uploadDestinationId z Amazon:\n' +
      '(np. "aplus-media-library-service-media/abc123-def456.png")',
      ui.ButtonSet.OK_CANCEL
    );

    if (idResponse.getSelectedButton() !== ui.Button.OK) return;
    const uploadDestinationId = idResponse.getResponseText().trim();

    if (!uploadDestinationId || !uploadDestinationId.includes('/')) {
      ui.alert('Błąd', 'Nieprawidłowy uploadDestinationId. Musi zawierać "/" (np. aplus-media-library-service-media/UUID.ext)', ui.ButtonSet.OK);
      return;
    }

    // Get original filename
    const filenameResponse = ui.prompt(
      'Oryginalna nazwa pliku',
      'Podaj oryginalną nazwę pliku (z rozmiarem):\n' +
      '(np. "placeholder_970x600.png")',
      ui.ButtonSet.OK_CANCEL
    );

    if (filenameResponse.getSelectedButton() !== ui.Button.OK) return;
    const originalFilename = filenameResponse.getResponseText().trim();

    // Extract dimensions from filename
    const sizeMatch = originalFilename.match(/(\d+)x(\d+)/);
    let width = 0;
    let height = 0;
    if (sizeMatch) {
      width = parseInt(sizeMatch[1], 10);
      height = parseInt(sizeMatch[2], 10);
    } else {
      // Ask for dimensions manually
      const sizeResponse = ui.prompt(
        'Rozmiar obrazu',
        'Nie udało się wyciągnąć rozmiaru z nazwy. Podaj rozmiar:\n' +
        '(np. "970x600")',
        ui.ButtonSet.OK_CANCEL
      );

      if (sizeResponse.getSelectedButton() !== ui.Button.OK) return;
      const sizeStr = sizeResponse.getResponseText().trim();
      const manualMatch = sizeStr.match(/(\d+)x(\d+)/);
      if (manualMatch) {
        width = parseInt(manualMatch[1], 10);
        height = parseInt(manualMatch[2], 10);
      }
    }

    // Get or create library sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    // Check if already exists
    const existingData = librarySheet.getDataRange().getValues();
    const existingIds = existingData.slice(1).map(row => row[0]);
    if (existingIds.includes(uploadDestinationId)) {
      ui.alert('Info', 'Ten uploadDestinationId już istnieje w bibliotece.', ui.ButtonSet.OK);
      return;
    }

    // Add to library
    librarySheet.appendRow([
      uploadDestinationId,
      '',  // image_url
      '',  // image_hash
      `Placeholder ${width}x${height}`,  // alt_text
      width,
      height,
      'MANUAL_ADD',  // source_content_key
      '',  // module_type
      new Date(),
      'PLACEHOLDER',  // status
      `Manually added placeholder for size ${width}x${height}`,
      originalFilename,
      'placeholder'  // tags
    ]);

    ui.alert('Sukces',
      `✅ Dodano placeholder do biblioteki:\n\n` +
      `ID: ${uploadDestinationId}\n` +
      `Nazwa: ${originalFilename}\n` +
      `Rozmiar: ${width}x${height}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log(`Error in addPlaceholderToLibrary: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ========================================
 * ASSET LIBRARY SYNC - FULL IMPLEMENTATION
 * ========================================
 *
 * Amazon SP-API does NOT have a direct endpoint to list Asset Library.
 * We must extract asset IDs from existing A+ Content documents.
 *
 * This enhanced version:
 * 1. Fetches ALL A+ Content documents (not just first 5)
 * 2. Extracts uploadDestinationId with full metadata
 * 3. Detects duplicates before adding
 * 4. Stores original filename pattern if detectable
 */

/**
 * Full sync of all images from A+ Content documents to Image Library
 * Enhanced version with deduplication and better metadata extraction
 */
function syncAllImagesToLibrary() {
  try {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create library sheet
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    // Get existing IDs to avoid duplicates
    const existingData = librarySheet.getDataRange().getValues();
    const existingIds = new Set();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0]) {
        existingIds.add(existingData[i][0]);
      }
    }
    Logger.log(`Existing images in library: ${existingIds.size}`);

    showProgress('Syncing ALL images from A+ Content...');

    // Get client and token
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();
    const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
    const endpoint = marketplaceConfig.endpoint;
    const marketplaceId = marketplaceConfig.marketplaceId;

    // Fetch ALL A+ Content documents with pagination
    let allDocuments = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 20; // Safety limit

    do {
      showProgress(`Fetching A+ Content documents (page ${pageCount + 1})...`);

      let url = `${endpoint}/aplus/2020-11-01/contentDocuments?marketplaceId=${marketplaceId}&pageSize=20`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const options = {
        method: 'get',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();

      if (responseCode !== 200) {
        throw new Error(`API Error ${responseCode}: ${response.getContentText()}`);
      }

      const result = JSON.parse(response.getContentText());
      const documents = result.contentMetadataRecords || [];
      allDocuments = allDocuments.concat(documents);

      pageToken = result.nextPageToken;
      pageCount++;

      Logger.log(`Page ${pageCount}: Found ${documents.length} documents, total: ${allDocuments.length}`);
      Utilities.sleep(500); // Rate limiting

    } while (pageToken && pageCount < maxPages);

    Logger.log(`Total A+ Content documents found: ${allDocuments.length}`);

    if (allDocuments.length === 0) {
      hideProgress();
      ui.alert('No A+ Content found', 'No A+ Content documents found in your account.', ui.ButtonSet.OK);
      return;
    }

    // Process each document and extract images
    const newImages = [];
    let processedDocs = 0;
    let skippedDuplicates = 0;

    for (const doc of allDocuments) {
      const contentRefKey = doc.contentReferenceKey;
      processedDocs++;

      showProgress(`Processing ${processedDocs}/${allDocuments.length}: ${contentRefKey.substring(0, 30)}...`);

      try {
        // Get full document with content
        const fullDocument = getAPlusContentDocument(contentRefKey, accessToken, client.marketplace);

        // Extract images with full metadata
        const images = extractImageIdsFromContentDocument(fullDocument);

        for (const img of images) {
          // Skip duplicates
          if (existingIds.has(img.uploadDestinationId)) {
            skippedDuplicates++;
            continue;
          }

          // Extract filename from uploadDestinationId
          // Format: "aplus-media-library-service-media/uuid.ext"
          const parts = img.uploadDestinationId.split('/');
          const filename = parts[parts.length - 1] || '';

          newImages.push([
            img.uploadDestinationId,     // A: uploadDestinationId
            '',                          // B: image_url
            '',                          // C: image_hash
            img.altText || '',           // D: alt_text
            img.width || '',             // E: width
            img.height || '',            // F: height
            contentRefKey,               // G: source_content_key
            img.moduleType || '',        // H: module_type
            new Date(),                  // I: date_synced
            'ACTIVE',                    // J: status
            `Synced from A+ Content`,    // K: notes
            filename,                    // L: original_filename (UUID from Amazon)
            ''                           // M: tags (user can add manually)
          ]);

          existingIds.add(img.uploadDestinationId);
        }

      } catch (error) {
        Logger.log(`Error processing ${contentRefKey}: ${error.toString()}`);
      }

      // Rate limiting
      if (processedDocs % 5 === 0) {
        Utilities.sleep(500);
      }
    }

    hideProgress();

    // Write new images to library
    if (newImages.length > 0) {
      const startRow = librarySheet.getLastRow() + 1;
      librarySheet.getRange(startRow, 1, newImages.length, newImages[0].length).setValues(newImages);
    }

    // Show summary
    let summary = `📚 Full Image Library Sync Complete\n\n`;
    summary += `📄 Documents processed: ${processedDocs}\n`;
    summary += `🖼️ New images added: ${newImages.length}\n`;
    summary += `⏭️ Duplicates skipped: ${skippedDuplicates}\n`;
    summary += `📊 Total in library: ${existingIds.size}\n\n`;

    if (newImages.length > 0) {
      summary += `New images have been added to "A+ Image Library" sheet.\n`;
    } else {
      summary += `No new images found (all were already in library).\n`;
    }

    ui.alert('Sync Complete', summary, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    Logger.log(`Error in syncAllImagesToLibrary: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Sync Error: ' + error.toString());
  }
}

/**
 * ========================================
 * PLACEHOLDER MAPPING FUNCTIONS
 * ========================================
 *
 * Since Amazon doesn't provide original filenames, users must manually map
 * their placeholder filenames to the uploadDestinationId from Amazon.
 *
 * Workflow:
 * 1. Upload placeholder images to Seller Central Asset Library
 * 2. In Seller Central, note the uploadDestinationId for each image
 * 3. Use these functions to map filename -> uploadDestinationId
 */

/**
 * Map a single placeholder filename to its Amazon uploadDestinationId
 * Opens a dialog for user to enter the mapping
 */
function mapSinglePlaceholder() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Step 1: Get the original filename
    const filenameResponse = ui.prompt(
      '🗺️ Map Placeholder to Amazon ID - Step 1/2',
      'Podaj oryginalną nazwę pliku placeholder:\n\n' +
      'Przykład: amazon_a_plus_placeholder_970x600_header.png\n\n' +
      'Nazwa pliku:',
      ui.ButtonSet.OK_CANCEL
    );

    if (filenameResponse.getSelectedButton() !== ui.Button.OK) return;
    const originalFilename = filenameResponse.getResponseText().trim();

    if (!originalFilename) {
      ui.alert('Błąd', 'Nazwa pliku nie może być pusta.', ui.ButtonSet.OK);
      return;
    }

    // Step 2: Get the uploadDestinationId from Amazon
    const idResponse = ui.prompt(
      '🗺️ Map Placeholder to Amazon ID - Step 2/2',
      `Plik: ${originalFilename}\n\n` +
      'Wklej uploadDestinationId z Amazon Seller Central:\n\n' +
      'Gdzie znaleźć:\n' +
      '1. Seller Central → A+ Content Manager\n' +
      '2. Otwórz istniejący A+ Content używający tego obrazu\n' +
      '3. Sprawdź URL obrazu lub użyj Developer Tools\n' +
      '4. ID ma format: aplus-media-library-service-media/UUID.ext\n\n' +
      'uploadDestinationId:',
      ui.ButtonSet.OK_CANCEL
    );

    if (idResponse.getSelectedButton() !== ui.Button.OK) return;
    const uploadDestinationId = idResponse.getResponseText().trim();

    // Validate the uploadDestinationId format
    if (!uploadDestinationId.includes('/') || !uploadDestinationId.startsWith('aplus')) {
      ui.alert(
        'Nieprawidłowy format',
        'uploadDestinationId powinien wyglądać tak:\n' +
        'aplus-media-library-service-media/UUID.ext\n\n' +
        'Podana wartość: ' + uploadDestinationId,
        ui.ButtonSet.OK
      );
      return;
    }

    // Extract dimensions from filename if present
    const sizeMatch = originalFilename.match(/(\d+)x(\d+)/);
    let width = 0;
    let height = 0;
    if (sizeMatch) {
      width = parseInt(sizeMatch[1], 10);
      height = parseInt(sizeMatch[2], 10);
    }

    // Get or create library sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    // Check if already exists
    const existingData = librarySheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === uploadDestinationId) {
        // Update existing entry
        librarySheet.getRange(i + 1, 12).setValue(originalFilename); // Update original_filename
        if (width && height) {
          librarySheet.getRange(i + 1, 5).setValue(width);
          librarySheet.getRange(i + 1, 6).setValue(height);
        }
        librarySheet.getRange(i + 1, 10).setValue('PLACEHOLDER'); // Update status

        ui.alert('Zaktualizowano',
          `Zaktualizowano istniejący wpis:\n\n` +
          `ID: ${uploadDestinationId}\n` +
          `Nazwa: ${originalFilename}\n` +
          `Rozmiar: ${width}x${height}`,
          ui.ButtonSet.OK
        );
        return;
      }
    }

    // Add new entry
    librarySheet.appendRow([
      uploadDestinationId,                           // A: uploadDestinationId
      '',                                            // B: image_url
      '',                                            // C: image_hash
      `Placeholder ${width}x${height}`,              // D: alt_text
      width,                                         // E: width
      height,                                        // F: height
      'PLACEHOLDER_MAPPING',                         // G: source_content_key
      '',                                            // H: module_type
      new Date(),                                    // I: date_synced
      'PLACEHOLDER',                                 // J: status
      `Manually mapped from: ${originalFilename}`,   // K: notes
      originalFilename,                              // L: original_filename
      'placeholder'                                  // M: tags
    ]);

    ui.alert('Sukces',
      `✅ Dodano mapowanie placeholder:\n\n` +
      `Nazwa pliku: ${originalFilename}\n` +
      `Amazon ID: ${uploadDestinationId}\n` +
      `Rozmiar: ${width}x${height}\n\n` +
      `Teraz eksport A+ z placeholderami znajdzie ten obraz.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log(`Error in mapSinglePlaceholder: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Bulk map placeholders from a text input
 * User provides pairs of: filename|uploadDestinationId (one per line)
 */
function bulkMapPlaceholders() {
  const ui = SpreadsheetApp.getUi();

  try {
    const response = ui.prompt(
      '📋 Bulk Map Placeholders',
      'Wklej mapowania w formacie:\n' +
      'nazwa_pliku|uploadDestinationId\n\n' +
      'Przykład:\n' +
      'placeholder_970x600.png|aplus-media-library-service-media/abc123.png\n' +
      'placeholder_300x300.jpg|aplus-media-library-service-media/def456.jpg\n\n' +
      'Każde mapowanie w nowej linii:',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) return;

    const lines = response.getResponseText().trim().split('\n').filter(l => l.trim());

    if (lines.length === 0) {
      ui.alert('Błąd', 'Nie podano żadnych mapowań.', ui.ButtonSet.OK);
      return;
    }

    // Get or create library sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    // Get existing IDs
    const existingData = librarySheet.getDataRange().getValues();
    const existingIds = new Set();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0]) {
        existingIds.add(existingData[i][0]);
      }
    }

    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length !== 2) {
        errors.push(`Invalid format: ${line}`);
        errorCount++;
        continue;
      }

      const originalFilename = parts[0].trim();
      const uploadDestinationId = parts[1].trim();

      // Validate
      if (!uploadDestinationId.includes('/') || !uploadDestinationId.startsWith('aplus')) {
        errors.push(`Invalid ID for ${originalFilename}: ${uploadDestinationId}`);
        errorCount++;
        continue;
      }

      // Extract dimensions
      const sizeMatch = originalFilename.match(/(\d+)x(\d+)/);
      let width = 0;
      let height = 0;
      if (sizeMatch) {
        width = parseInt(sizeMatch[1], 10);
        height = parseInt(sizeMatch[2], 10);
      }

      // Check if exists
      if (existingIds.has(uploadDestinationId)) {
        // Update existing
        for (let i = 1; i < existingData.length; i++) {
          if (existingData[i][0] === uploadDestinationId) {
            librarySheet.getRange(i + 1, 12).setValue(originalFilename);
            if (width && height) {
              librarySheet.getRange(i + 1, 5).setValue(width);
              librarySheet.getRange(i + 1, 6).setValue(height);
            }
            librarySheet.getRange(i + 1, 10).setValue('PLACEHOLDER');
            updatedCount++;
            break;
          }
        }
      } else {
        // Add new
        librarySheet.appendRow([
          uploadDestinationId,
          '',
          '',
          `Placeholder ${width}x${height}`,
          width,
          height,
          'BULK_MAPPING',
          '',
          new Date(),
          'PLACEHOLDER',
          `Bulk mapped from: ${originalFilename}`,
          originalFilename,
          'placeholder'  // M: tags
        ]);
        existingIds.add(uploadDestinationId);
        addedCount++;
      }
    }

    // Show summary
    let summary = `📋 Bulk Mapping Complete\n\n`;
    summary += `✅ Dodano: ${addedCount}\n`;
    summary += `🔄 Zaktualizowano: ${updatedCount}\n`;
    summary += `❌ Błędy: ${errorCount}\n\n`;

    if (errors.length > 0) {
      summary += `Błędy:\n${errors.slice(0, 5).join('\n')}`;
      if (errors.length > 5) {
        summary += `\n... i ${errors.length - 5} więcej`;
      }
    }

    ui.alert('Bulk Mapping', summary, ui.ButtonSet.OK);

  } catch (error) {
    Logger.log(`Error in bulkMapPlaceholders: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Generate a list of required placeholder sizes for the current A+ Content
 * Helps user know which placeholders they need to upload
 */
function listRequiredPlaceholderSizes() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Check both APlusBasic and APlusPremium sheets
    const sheetNames = ['APlusBasic', 'APlusPremium'];
    const requiredSizes = new Map(); // size -> [module types]

    for (const sheetName of sheetNames) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;

      // Get module types from the sheet (assuming column with module_type)
      const data = sheet.getDataRange().getValues();
      const headers = data[2]; // Headers in row 3

      const moduleTypeCol = headers.findIndex(h =>
        h && h.toString().toLowerCase().includes('module_type'));

      if (moduleTypeCol === -1) continue;

      for (let i = 3; i < data.length; i++) {
        const moduleType = data[i][moduleTypeCol];
        if (!moduleType) continue;

        // Get sizes for this module type
        const sizes = APLUS_IMAGE_SIZES[moduleType];
        if (!sizes) continue;

        for (const [field, size] of Object.entries(sizes)) {
          if (!requiredSizes.has(size)) {
            requiredSizes.set(size, new Set());
          }
          requiredSizes.get(size).add(`${moduleType}.${field}`);
        }
      }
    }

    // Check which sizes are already in library
    const librarySheet = ss.getSheetByName('A+ Image Library');
    const existingPlaceholders = new Map(); // size -> uploadDestinationId

    if (librarySheet) {
      const libraryData = librarySheet.getDataRange().getValues();
      for (let i = 1; i < libraryData.length; i++) {
        const status = libraryData[i][9];
        if (status !== 'PLACEHOLDER') continue;

        const width = libraryData[i][4];
        const height = libraryData[i][5];
        const uploadId = libraryData[i][0];

        if (width && height && uploadId) {
          existingPlaceholders.set(`${width}x${height}`, uploadId);
        }
      }
    }

    // Build report
    let report = `📐 Required Placeholder Sizes\n\n`;
    report += `Based on modules in APlusBasic and APlusPremium sheets:\n\n`;

    const sortedSizes = Array.from(requiredSizes.keys()).sort((a, b) => {
      const [aw, ah] = a.split('x').map(Number);
      const [bw, bh] = b.split('x').map(Number);
      return (bw * bh) - (aw * ah); // Sort by area, largest first
    });

    for (const size of sortedSizes) {
      const hasPlaceholder = existingPlaceholders.has(size);
      const status = hasPlaceholder ? '✅' : '❌';
      const uploadId = hasPlaceholder ? `\n   ID: ${existingPlaceholders.get(size).substring(0, 40)}...` : '';

      report += `${status} ${size}${uploadId}\n`;

      // List module types using this size (max 3)
      const moduleTypes = Array.from(requiredSizes.get(size));
      const displayTypes = moduleTypes.slice(0, 3).join(', ');
      if (moduleTypes.length > 3) {
        report += `   Used by: ${displayTypes}, +${moduleTypes.length - 3} more\n`;
      } else {
        report += `   Used by: ${displayTypes}\n`;
      }
      report += '\n';
    }

    const missingCount = sortedSizes.filter(s => !existingPlaceholders.has(s)).length;

    report += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total: ${sortedSizes.length} sizes needed\n`;
    report += `✅ Have: ${sortedSizes.length - missingCount}\n`;
    report += `❌ Missing: ${missingCount}\n`;

    if (missingCount > 0) {
      report += `\n💡 Use "Map Placeholder" to add missing placeholders.`;
    }

    ui.alert('Required Placeholders', report, ui.ButtonSet.OK);

  } catch (error) {
    Logger.log(`Error in listRequiredPlaceholderSizes: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Show placeholder coverage - which sizes have placeholders and which don't
 */
function showPlaceholderCoverage() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      ui.alert('Info', 'Image Library nie istnieje. Utwórz ją najpierw.', ui.ButtonSet.OK);
      return;
    }

    const data = librarySheet.getDataRange().getValues();
    const placeholders = [];

    // Collect all placeholders
    for (let i = 1; i < data.length; i++) {
      const status = data[i][9];
      const uploadId = data[i][0];
      const width = data[i][4];
      const height = data[i][5];
      const originalFilename = data[i][11];
      const notes = data[i][10];

      const isPlaceholder = status === 'PLACEHOLDER' ||
                           (notes && notes.toLowerCase().includes('placeholder')) ||
                           (originalFilename && originalFilename.toLowerCase().includes('placeholder'));

      if (isPlaceholder && uploadId) {
        placeholders.push({
          uploadId: uploadId,
          width: width || 0,
          height: height || 0,
          size: width && height ? `${width}x${height}` : 'unknown',
          filename: originalFilename || 'N/A',
          isValidId: uploadId.includes('/') && uploadId.startsWith('aplus')
        });
      }
    }

    // Build report
    let report = `🎭 Placeholder Coverage Report\n\n`;
    report += `Total placeholders found: ${placeholders.length}\n\n`;

    if (placeholders.length === 0) {
      report += `❌ Brak placeholderów w bibliotece!\n\n`;
      report += `Aby dodać placeholdery:\n`;
      report += `1. Wgraj obrazy do Seller Central Asset Library\n`;
      report += `2. Użyj "Map Placeholder" aby zmapować\n`;
    } else {
      // Group by validity
      const valid = placeholders.filter(p => p.isValidId);
      const invalid = placeholders.filter(p => !p.isValidId);

      if (valid.length > 0) {
        report += `✅ Valid placeholders (${valid.length}):\n`;
        for (const p of valid.slice(0, 10)) {
          report += `   ${p.size}: ${p.filename}\n`;
        }
        if (valid.length > 10) {
          report += `   ... i ${valid.length - 10} więcej\n`;
        }
        report += '\n';
      }

      if (invalid.length > 0) {
        report += `⚠️ Invalid IDs (${invalid.length}) - need remapping:\n`;
        for (const p of invalid.slice(0, 5)) {
          report += `   ${p.filename}: ${p.uploadId.substring(0, 30)}...\n`;
        }
        if (invalid.length > 5) {
          report += `   ... i ${invalid.length - 5} więcej\n`;
        }
        report += '\n';
        report += `Te wpisy mają nazwy plików zamiast Amazon ID.\n`;
        report += `Użyj "Map Placeholder" aby poprawić.\n`;
      }

      // Size coverage
      const allSizesNeeded = new Set();
      for (const moduleType in APLUS_IMAGE_SIZES) {
        const sizes = APLUS_IMAGE_SIZES[moduleType];
        for (const size of Object.values(sizes)) {
          allSizesNeeded.add(size);
        }
      }

      const coveredSizes = new Set(valid.map(p => p.size).filter(s => s !== 'unknown'));
      const missingSizes = Array.from(allSizesNeeded).filter(s => !coveredSizes.has(s));

      report += `\n📐 Size Coverage:\n`;
      report += `   All A+ sizes: ${allSizesNeeded.size}\n`;
      report += `   Covered: ${coveredSizes.size}\n`;
      report += `   Missing: ${missingSizes.length}\n`;

      if (missingSizes.length > 0) {
        report += `\n   Missing sizes: ${missingSizes.slice(0, 5).join(', ')}`;
        if (missingSizes.length > 5) {
          report += `, +${missingSizes.length - 5} more`;
        }
      }
    }

    ui.alert('Placeholder Coverage', report, ui.ButtonSet.OK);

  } catch (error) {
    Logger.log(`Error in showPlaceholderCoverage: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Fix invalid placeholder entries in the library
 * Finds entries that have filenames instead of uploadDestinationId
 * and prompts user to provide correct IDs
 */
function fixInvalidPlaceholders() {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const librarySheet = ss.getSheetByName('A+ Image Library');

    if (!librarySheet) {
      ui.alert('Info', 'Image Library nie istnieje.', ui.ButtonSet.OK);
      return;
    }

    const data = librarySheet.getDataRange().getValues();
    const invalidEntries = [];

    // Find invalid entries
    for (let i = 1; i < data.length; i++) {
      const uploadId = data[i][0];
      const status = data[i][9];
      const originalFilename = data[i][11];
      const notes = data[i][10];

      // Check if this is supposed to be a placeholder
      const isPlaceholder = status === 'PLACEHOLDER' ||
                           (notes && notes.toLowerCase().includes('placeholder')) ||
                           (uploadId && uploadId.toLowerCase().includes('placeholder'));

      if (!isPlaceholder) continue;

      // Check if the ID is invalid (doesn't have Amazon format)
      const isValidId = uploadId && uploadId.includes('/') && uploadId.startsWith('aplus');

      if (!isValidId) {
        invalidEntries.push({
          row: i + 1,
          currentId: uploadId,
          filename: originalFilename || uploadId,
          width: data[i][4],
          height: data[i][5]
        });
      }
    }

    if (invalidEntries.length === 0) {
      ui.alert('✅ Wszystko OK', 'Wszystkie placeholdery mają prawidłowe Amazon ID.', ui.ButtonSet.OK);
      return;
    }

    // Show list and offer to fix
    let message = `Znaleziono ${invalidEntries.length} nieprawidłowych wpisów:\n\n`;

    for (const entry of invalidEntries.slice(0, 10)) {
      const size = entry.width && entry.height ? ` (${entry.width}x${entry.height})` : '';
      message += `Row ${entry.row}: ${entry.filename}${size}\n`;
    }

    if (invalidEntries.length > 10) {
      message += `... i ${invalidEntries.length - 10} więcej\n`;
    }

    message += `\nCzy chcesz naprawić pierwszy wpis teraz?`;

    const fixResponse = ui.alert('Nieprawidłowe placeholdery', message, ui.ButtonSet.YES_NO);

    if (fixResponse !== ui.Button.YES) return;

    // Fix the first invalid entry
    const entry = invalidEntries[0];

    const idResponse = ui.prompt(
      `Napraw: ${entry.filename}`,
      `Podaj prawidłowy uploadDestinationId dla:\n` +
      `Plik: ${entry.filename}\n` +
      `Rozmiar: ${entry.width}x${entry.height}\n\n` +
      `Format: aplus-media-library-service-media/UUID.ext`,
      ui.ButtonSet.OK_CANCEL
    );

    if (idResponse.getSelectedButton() !== ui.Button.OK) return;

    const newId = idResponse.getResponseText().trim();

    if (!newId.includes('/') || !newId.startsWith('aplus')) {
      ui.alert('Błąd', 'Nieprawidłowy format ID.', ui.ButtonSet.OK);
      return;
    }

    // Update the entry
    librarySheet.getRange(entry.row, 1).setValue(newId); // Column A: uploadDestinationId
    librarySheet.getRange(entry.row, 12).setValue(entry.filename); // Column L: original_filename
    librarySheet.getRange(entry.row, 10).setValue('PLACEHOLDER'); // Column J: status

    ui.alert('Sukces',
      `✅ Naprawiono:\n\n` +
      `Plik: ${entry.filename}\n` +
      `Nowy ID: ${newId}\n\n` +
      `Pozostało do naprawy: ${invalidEntries.length - 1}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log(`Error in fixInvalidPlaceholders: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}
