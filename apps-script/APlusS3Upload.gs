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
      'notes'
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
          libraryData.push([
            img.uploadDestinationId,
            '', // image_url - to be filled manually or via lookup
            '', // image_hash
            img.altText || '',
            '', // width
            '', // height
            contentRefKey,
            img.moduleType,
            new Date(),
            'ACTIVE',
            `Synced from ${contentRefKey}`
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

    Logger.log(`Looking for placeholder with size ${targetWidth}x${targetHeight}`);

    // Search for placeholder with matching size
    // Columns: 0=id, 4=width, 5=height, 9=status
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[9];
      const width = parseInt(row[4], 10) || 0;
      const height = parseInt(row[5], 10) || 0;

      // Check if this is a placeholder
      const isPlaceholder = status === 'PLACEHOLDER' ||
                           (row[3] && row[3].toString().toLowerCase().includes('placeholder')) ||
                           (row[10] && row[10].toString().toLowerCase().includes('placeholder'));

      if (isPlaceholder) {
        // Check if size matches
        if (width === targetWidth && height === targetHeight) {
          Logger.log(`Found placeholder for ${size}: ${row[0]}`);
          return row[0];
        }

        // Also check if alt_text contains size info
        const altText = row[3] || '';
        if (altText.includes(`${targetWidth}x${targetHeight}`) ||
            altText.includes(`${targetWidth} x ${targetHeight}`)) {
          Logger.log(`Found placeholder by alt_text for ${size}: ${row[0]}`);
          return row[0];
        }
      }
    }

    // If exact size not found, try to find closest match
    Logger.log(`No exact placeholder found for ${size}, searching for close matches...`);

    let closestMatch = null;
    let closestDiff = Infinity;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[9];
      const width = parseInt(row[4], 10) || 0;
      const height = parseInt(row[5], 10) || 0;

      const isPlaceholder = status === 'PLACEHOLDER' ||
                           (row[3] && row[3].toString().toLowerCase().includes('placeholder')) ||
                           (row[10] && row[10].toString().toLowerCase().includes('placeholder'));

      if (isPlaceholder && width > 0 && height > 0) {
        // Calculate similarity (aspect ratio match is important)
        const targetRatio = targetWidth / targetHeight;
        const ratio = width / height;
        const ratioDiff = Math.abs(targetRatio - ratio);
        const sizeDiff = Math.abs(width - targetWidth) + Math.abs(height - targetHeight);
        const totalDiff = ratioDiff * 1000 + sizeDiff;

        if (totalDiff < closestDiff) {
          closestDiff = totalDiff;
          closestMatch = row[0];
        }
      }
    }

    if (closestMatch && closestDiff < 500) { // Only use if reasonably close
      Logger.log(`Using closest placeholder match for ${size}: ${closestMatch} (diff: ${closestDiff})`);
      return closestMatch;
    }

    Logger.log(`No placeholder found for size ${size}`);
    return null;

  } catch (error) {
    Logger.log(`Error in lookupPlaceholderBySize: ${error.toString()}`);
    return null;
  }
}
