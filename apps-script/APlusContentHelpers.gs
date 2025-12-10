/**
 * A+ Content Helper Functions
 * Status checking, image upload, and management
 */

/**
 * Get A+ Content status by contentReferenceKey
 * Returns status: APPROVED, DRAFT, SUBMITTED, REJECTED, etc.
 */
function getAPlusContentStatus(contentReferenceKey, accessToken, marketplace) {
  const marketplaceConfig = MARKETPLACE_LANGUAGES[marketplace];
  const endpoint = marketplaceConfig.endpoint;
  const url = `${endpoint}/aplus/2020-11-01/contentDocuments/${contentReferenceKey}`;

  const options = {
    method: 'get',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  Logger.log(`Checking A+ Content status: ${contentReferenceKey}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log(`Status API Response Code: ${responseCode}`);
  Logger.log(`Status API Response: ${responseBody}`);

  if (responseCode < 200 || responseCode >= 300) {
    let errorMessage = `SP-API Error ${responseCode}`;
    try {
      const error = JSON.parse(responseBody);
      errorMessage = error.errors?.[0]?.message || error.message || responseBody;
    } catch (e) {
      errorMessage = responseBody;
    }
    throw new Error(errorMessage);
  }

  const result = JSON.parse(responseBody);

  return {
    contentReferenceKey: contentReferenceKey,
    status: result.contentRecord?.contentMetadata?.status || 'UNKNOWN',
    lastUpdateDate: result.contentRecord?.contentMetadata?.updateTime || null,
    asinSet: result.contentRecord?.asinMetadataSet?.map(a => a.asin) || [],
    rejectionReasons: result.contentRecord?.contentMetadata?.badgeSet || []
  };
}

/**
 * Get upload destination for Content Assets (images/videos)
 */
function getUploadDestinationId(filename, contentType, accessToken, marketplace) {
  const marketplaceConfig = MARKETPLACE_LANGUAGES[marketplace];
  const endpoint = marketplaceConfig.endpoint;
  const marketplaceId = marketplaceConfig.marketplaceId;

  const url = `${endpoint}/aplus/2020-11-01/contentAsinValidations`;

  const payload = {
    marketplaceId: marketplaceId,
    contentType: 'IMAGE',  // or 'VIDEO'
    contentSubType: 'STANDARD'
  };

  const options = {
    method: 'post',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log(`Getting upload destination for: ${filename}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode < 200 || responseCode >= 300) {
    let errorMessage = `SP-API Error ${responseCode}`;
    try {
      const error = JSON.parse(responseBody);
      errorMessage = error.errors?.[0]?.message || error.message || responseBody;
    } catch (e) {
      errorMessage = responseBody;
    }
    throw new Error(errorMessage);
  }

  const result = JSON.parse(responseBody);

  return result.uploadDestinationId;
}

/**
 * Upload image to Amazon Content Assets
 */
function uploadImageToAmazon(imageUrl, filename, accessToken, marketplace) {
  try {
    // Step 1: Download image from URL
    Logger.log(`Downloading image from: ${imageUrl}`);
    const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
    const contentType = imageBlob.getContentType();

    // Step 2: Get upload destination from Amazon
    const uploadDestinationId = getUploadDestinationId(filename, contentType, accessToken, marketplace);

    Logger.log(`Upload destination ID: ${uploadDestinationId}`);

    return {
      success: true,
      uploadDestinationId: uploadDestinationId,
      filename: filename
    };
  } catch (error) {
    Logger.log(`Error uploading image: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Menu function: Check A+ Content Status
 */
function lukoCheckAPlusStatus() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const selection = sheet.getActiveRange();
    const row = selection.getRow();

    if (row < 4) {
      SpreadsheetApp.getUi().alert('Please select a row with A+ Content (row 4 or later)');
      return;
    }

    // Get headers and row data
    const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Find contentReferenceKey column
    const contentRefKeyIndex = headers.findIndex(h => h === 'contentReferenceKey' || h === 'Content Reference Key');
    if (contentRefKeyIndex === -1) {
      SpreadsheetApp.getUi().alert('contentReferenceKey column not found');
      return;
    }

    const contentReferenceKey = values[contentRefKeyIndex];
    if (!contentReferenceKey) {
      SpreadsheetApp.getUi().alert('This row does not have a contentReferenceKey yet. Publish A+ Content first.');
      return;
    }

    // Get access token and marketplace
    const client = getActiveClient();
    const accessToken = getAccessToken(client);

    showProgress('Checking A+ Content status...');

    const statusInfo = getAPlusContentStatus(contentReferenceKey, accessToken, client.marketplace);

    hideProgress();

    // Display status
    const ui = SpreadsheetApp.getUi();
    let message = `Content Reference Key: ${statusInfo.contentReferenceKey}\n\n`;
    message += `Status: ${statusInfo.status}\n`;
    message += `Last Update: ${statusInfo.lastUpdateDate || 'N/A'}\n`;
    message += `ASINs: ${statusInfo.asinSet.join(', ') || 'None'}\n`;

    if (statusInfo.rejectionReasons && statusInfo.rejectionReasons.length > 0) {
      message += `\nRejection Reasons:\n${statusInfo.rejectionReasons.join('\n')}`;
    }

    ui.alert('A+ Content Status', message, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    Logger.log(`Error checking A+ Content status: ${error.toString()}`);
    SpreadsheetApp.getUi().alert('Error checking status: ' + error.toString());
  }
}

/**
 * Menu function: Upload Images for A+ Content
 */
function lukoUploadAPlusImages() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const selection = sheet.getActiveRange();
    const row = selection.getRow();

    if (row < 4) {
      SpreadsheetApp.getUi().alert('Please select a row with A+ Content (row 4 or later)');
      return;
    }

    // Get headers and row data
    const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Get access token and marketplace
    const client = getActiveClient();
    const accessToken = getAccessToken(client);

    showProgress('Uploading images to Amazon...');

    let uploadCount = 0;
    const results = [];

    // Find all image URL columns and upload them
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];

      // Look for columns ending with _url (not _id)
      if (header && header.includes('_url') && !header.includes('_id')) {
        const imageUrl = values[i];

        if (imageUrl && imageUrl.startsWith('http')) {
          // Find corresponding _id column
          const idColumnName = header.replace('_url', '_id');
          const idColumnIndex = headers.findIndex(h => h === idColumnName);

          if (idColumnIndex !== -1) {
            // Check if already uploaded
            if (values[idColumnIndex]) {
              Logger.log(`Image already uploaded for ${header}: ${values[idColumnIndex]}`);
              continue;
            }

            // Upload image
            const filename = imageUrl.split('/').pop().split('?')[0];
            const result = uploadImageToAmazon(imageUrl, filename, accessToken, client.marketplace);

            if (result.success) {
              // Write uploadDestinationId to _id column
              sheet.getRange(row, idColumnIndex + 1).setValue(result.uploadDestinationId);
              uploadCount++;
              results.push(`✓ ${header}: ${result.uploadDestinationId.substring(0, 20)}...`);
            } else {
              results.push(`✗ ${header}: ${result.error}`);
            }
          }
        }
      }
    }

    hideProgress();

    const ui = SpreadsheetApp.getUi();
    let message = `Uploaded ${uploadCount} image(s)\n\n`;
    message += results.join('\n');

    ui.alert('Image Upload Complete', message, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    Logger.log(`Error uploading images: ${error.toString()}`);
    SpreadsheetApp.getUi().alert('Error uploading images: ' + error.toString());
  }
}
