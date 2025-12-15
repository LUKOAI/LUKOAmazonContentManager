/**
 * A+ Content Synchronization - Pobieranie uploadDestinationId z istniejących A+ Content
 *
 * Ten moduł próbuje pobrać uploadDestinationId obrazów z istniejących A+ Content documents
 */

/**
 * Pobierz listę wszystkich A+ Content documents
 */
function searchAPlusContentDocuments(accessToken, marketplace) {
  const marketplaceConfig = MARKETPLACE_LANGUAGES[marketplace];
  const endpoint = marketplaceConfig.endpoint;
  const marketplaceId = marketplaceConfig.marketplaceId;

  // API endpoint dla wyszukiwania A+ Content
  const url = `${endpoint}/aplus/2020-11-01/contentDocuments?marketplaceId=${marketplaceId}&pageSize=20`;

  const options = {
    method: 'get',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  Logger.log(`Searching A+ Content documents`);
  Logger.log(`URL: ${url}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log(`Search Response Code: ${responseCode}`);
  Logger.log(`Search Response: ${responseBody}`);

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(`Failed to search content documents: ${responseBody}`);
  }

  const result = JSON.parse(responseBody);
  return result.contentMetadataRecords || [];
}

/**
 * Pobierz szczegóły konkretnego A+ Content document
 */
function getAPlusContentDocument(contentReferenceKey, accessToken, marketplace) {
  const marketplaceConfig = MARKETPLACE_LANGUAGES[marketplace];
  const endpoint = marketplaceConfig.endpoint;
  const marketplaceId = marketplaceConfig.marketplaceId;

  // includedDataSet określa jakie dane mają być zwrócone
  const url = `${endpoint}/aplus/2020-11-01/contentDocuments/${contentReferenceKey}?marketplaceId=${marketplaceId}&includedDataSet=CONTENTS,METADATA`;

  const options = {
    method: 'get',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  Logger.log(`Getting A+ Content document: ${contentReferenceKey}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log(`Get Document Response Code: ${responseCode}`);
  Logger.log(`Get Document Response: ${JSON.stringify(JSON.parse(responseBody), null, 2)}`);

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(`Failed to get content document: ${responseBody}`);
  }

  return JSON.parse(responseBody);
}

/**
 * Wyciągnij uploadDestinationId z modułów A+ Content
 */
function extractImageIdsFromContentDocument(contentDocument) {
  const images = [];

  try {
    const modules = contentDocument.contentRecord?.contentDocument?.contentModuleList || [];

    for (const module of modules) {
      const moduleType = module.contentModuleType;
      Logger.log(`Processing module type: ${moduleType}`);

      // STANDARD_SINGLE_SIDE_IMAGE
      if (module.standardSingleSideImage?.block?.image) {
        const img = module.standardSingleSideImage.block.image;
        images.push({
          moduleType: moduleType,
          uploadDestinationId: img.uploadDestinationId,
          altText: img.altText
        });
      }

      // STANDARD_HEADER_IMAGE_TEXT
      if (module.standardHeaderImageText?.block?.image) {
        const img = module.standardHeaderImageText.block.image;
        images.push({
          moduleType: moduleType,
          uploadDestinationId: img.uploadDestinationId,
          altText: img.altText
        });
      }

      // Dodaj więcej typów modułów jeśli potrzeba
    }
  } catch (error) {
    Logger.log(`Error extracting images: ${error.toString()}`);
  }

  return images;
}

/**
 * Menu function: Synchronizuj obrazy z istniejących A+ Content
 * Pobiera uploadDestinationId z już opublikowanych A+ Content
 */
function lukoSyncAPlusImages() {
  try {
    const ui = SpreadsheetApp.getUi();

    // Get client and token
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();

    showProgress('Searching for A+ Content documents...');

    // Step 1: Pobierz listę wszystkich A+ Content
    const documents = searchAPlusContentDocuments(accessToken, client.marketplace);

    Logger.log(`Found ${documents.length} A+ Content documents`);

    if (documents.length === 0) {
      hideProgress();
      ui.alert('No A+ Content found', 'No A+ Content documents found in your account.', ui.ButtonSet.OK);
      return;
    }

    // Step 2: Dla każdego dokumentu - pobierz szczegóły i wyciągnij uploadDestinationId
    let totalImages = 0;
    const results = [];

    for (let i = 0; i < Math.min(documents.length, 5); i++) {  // Limit to first 5 for testing
      const doc = documents[i];
      const contentRefKey = doc.contentReferenceKey;

      showProgress(`Processing document ${i + 1}/${Math.min(documents.length, 5)}...`);

      try {
        // Pobierz pełny dokument z zawartością
        const fullDocument = getAPlusContentDocument(contentRefKey, accessToken, client.marketplace);

        // Wyciągnij uploadDestinationId
        const images = extractImageIdsFromContentDocument(fullDocument);

        if (images.length > 0) {
          totalImages += images.length;
          results.push(`Document: ${contentRefKey}\n  Images: ${images.length}`);

          images.forEach(img => {
            Logger.log(`  - Module: ${img.moduleType}, ID: ${img.uploadDestinationId}`);
          });
        }
      } catch (error) {
        Logger.log(`Error processing ${contentRefKey}: ${error.toString()}`);
      }
    }

    hideProgress();

    // Show results
    let message = `Analyzed ${Math.min(documents.length, 5)} A+ Content documents\n\n`;
    message += `Found ${totalImages} images with uploadDestinationId\n\n`;

    if (totalImages > 0) {
      message += `Check Execution Log for details:\n`;
      message += `Extensions → Apps Script → Executions\n\n`;
      message += results.join('\n');
    } else {
      message += `No images found in analyzed documents.\n`;
      message += `This could mean:\n`;
      message += `1. Documents don't contain images\n`;
      message += `2. API doesn't return uploadDestinationId\n`;
      message += `3. Different module types need to be checked`;
    }

    ui.alert('A+ Content Image Sync Complete', message, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    Logger.log(`Error in lukoSyncAPlusImages: ${error.toString()}`);
    Logger.log(`Error stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Error syncing A+ images: ' + error.toString());
  }
}
