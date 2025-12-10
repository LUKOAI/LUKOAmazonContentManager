/**
 * A+ Content Image Management - Extract IDs from Product Listings
 * Uses existing product images in A+ Content
 */

/**
 * Get product listing with images
 */
function getProductImages(asin, sellerId, accessToken, marketplace) {
  const marketplaceConfig = MARKETPLACE_LANGUAGES[marketplace];
  const endpoint = marketplaceConfig.endpoint;
  const marketplaceId = marketplaceConfig.marketplaceId;

  const url = `${endpoint}/listings/2021-08-01/items/${sellerId}/${asin}?marketplaceIds=${marketplaceId}`;

  const options = {
    method: 'get',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  Logger.log(`Getting product images for ASIN: ${asin}`);
  Logger.log(`Request URL: ${url}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log(`Response Code: ${responseCode}`);
  Logger.log(`Response Body: ${responseBody}`);

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(`Failed to get product images: ${responseBody}`);
  }

  const result = JSON.parse(responseBody);

  // Extract images from listing
  const images = [];
  const summaries = result.summaries || [];

  for (const summary of summaries) {
    if (summary.images && summary.images.length > 0) {
      for (const image of summary.images) {
        images.push({
          url: image.link,
          uploadDestinationId: image.uploadDestinationId,
          variant: image.variant || 'MAIN'
        });
      }
    }
  }

  return images;
}

/**
 * Extract uploadDestinationId from Amazon image URL
 * Amazon image URLs contain the ID in the path
 */
function extractImageIdFromUrl(imageUrl) {
  // Amazon image URL format: https://m.media-amazon.com/images/I/{IMAGE_ID}.jpg
  const match = imageUrl.match(/\/images\/I\/([^.]+)\./);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Match image URL to uploadDestinationId from product listing
 */
function matchImageUrlToId(imageUrl, productImages) {
  // Try exact URL match first
  for (const image of productImages) {
    if (image.url === imageUrl) {
      return image.uploadDestinationId;
    }
  }

  // Try matching by extracted ID
  const urlImageId = extractImageIdFromUrl(imageUrl);
  if (urlImageId) {
    for (const image of productImages) {
      const productImageId = extractImageIdFromUrl(image.url);
      if (productImageId === urlImageId) {
        return image.uploadDestinationId;
      }
    }
  }

  return null;
}

/**
 * Menu function: Extract Image IDs from Product Listings
 */
function lukoExtractImageIds() {
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

    // Get ASIN
    const asinIndex = headers.findIndex(h => h === 'ASIN');
    if (asinIndex === -1) {
      SpreadsheetApp.getUi().alert('ASIN column not found');
      return;
    }

    const asin = values[asinIndex];
    if (!asin) {
      SpreadsheetApp.getUi().alert('ASIN is empty in this row');
      return;
    }

    // Get access token and marketplace
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();

    showProgress('Extracting image IDs from product listing...');

    // Get product images
    Logger.log(`Getting images for ASIN: ${asin}`);
    const productImages = getProductImages(asin, client.sellerId, accessToken, client.marketplace);

    Logger.log(`Found ${productImages.length} images in product listing`);

    let matchCount = 0;
    const results = [];

    // Find all image URL columns and match to IDs
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
            // Check if already filled
            if (values[idColumnIndex]) {
              Logger.log(`Image ID already exists for ${header}: ${values[idColumnIndex]}`);
              continue;
            }

            // Match URL to ID
            const uploadDestinationId = matchImageUrlToId(imageUrl, productImages);

            if (uploadDestinationId) {
              // Write uploadDestinationId to _id column
              sheet.getRange(row, idColumnIndex + 1).setValue(uploadDestinationId);
              matchCount++;
              results.push(`✓ ${header}: ${uploadDestinationId.substring(0, 20)}...`);
              Logger.log(`Matched ${imageUrl} to ${uploadDestinationId}`);
            } else {
              results.push(`✗ ${header}: No match found in product listing`);
              Logger.log(`No match found for ${imageUrl}`);
            }
          }
        }
      }
    }

    hideProgress();

    const ui = SpreadsheetApp.getUi();
    let message = `Extracted ${matchCount} image ID(s) from product listing\n\n`;

    if (matchCount === 0) {
      message += `No matches found. Make sure:\n`;
      message += `1. The image URLs match exactly with product images\n`;
      message += `2. The ASIN has images uploaded\n`;
      message += `3. You have access to this product\n\n`;
    }

    message += results.join('\n');

    ui.alert('Image ID Extraction Complete', message, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    Logger.log(`Error extracting image IDs: ${error.toString()}`);
    Logger.log(`Error stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Error extracting image IDs: ' + error.toString());
  }
}
