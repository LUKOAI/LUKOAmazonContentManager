/**
 * A+ Content Image Management - Extract IDs from Amazon Image URLs
 * Uses IMAGE_ID from Amazon image URLs directly as uploadDestinationId
 *
 * Amazon image URL format: https://m.media-amazon.com/images/I/{IMAGE_ID}.jpg
 * We extract IMAGE_ID and use it as uploadDestinationId for A+ Content
 */

/**
 * Extract IMAGE_ID from Amazon image URL
 * Amazon image URL format: https://m.media-amazon.com/images/I/{IMAGE_ID}.jpg
 *
 * Example:
 * Input: https://m.media-amazon.com/images/I/71v93yjSQXL.jpg
 * Output: 71v93yjSQXL
 */
function extractImageIdFromUrl(imageUrl) {
  // Try standard Amazon image URL format
  let match = imageUrl.match(/\/images\/I\/([^._]+)/);
  if (match) {
    return match[1];
  }

  // Try alternative formats (images-na.ssl-images-amazon.com, etc.)
  match = imageUrl.match(/images-[^\/]+\/images\/I\/([^._]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * Menu function: Extract Image IDs from Amazon Image URLs
 * Extracts IMAGE_ID from Amazon image URLs and uses it as uploadDestinationId
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

    showProgress('Extracting image IDs from URLs...');

    let extractCount = 0;
    const results = [];

    // Find all image URL columns and extract IDs
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
              results.push(`⊙ ${header}: Already filled (${values[idColumnIndex].substring(0, 20)}...)`);
              continue;
            }

            // Extract IMAGE_ID from URL
            const imageId = extractImageIdFromUrl(imageUrl);

            if (imageId) {
              // Write IMAGE_ID to _id column
              sheet.getRange(row, idColumnIndex + 1).setValue(imageId);
              extractCount++;
              results.push(`✓ ${header}: ${imageId}`);
              Logger.log(`Extracted IMAGE_ID from ${imageUrl}: ${imageId}`);
            } else {
              results.push(`✗ ${header}: Could not extract IMAGE_ID from URL`);
              Logger.log(`Failed to extract IMAGE_ID from: ${imageUrl}`);
            }
          } else {
            results.push(`⚠ ${header}: No matching _id column found`);
            Logger.log(`No _id column found for: ${header}`);
          }
        }
      }
    }

    hideProgress();

    const ui = SpreadsheetApp.getUi();
    let message = `Extracted ${extractCount} image ID(s) from Amazon URLs\n\n`;

    if (extractCount === 0) {
      message += `No IDs extracted. Make sure:\n`;
      message += `1. Image URLs are valid Amazon image URLs\n`;
      message += `2. URL format: https://m.media-amazon.com/images/I/{IMAGE_ID}.jpg\n`;
      message += `3. Corresponding _id columns exist\n\n`;
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
