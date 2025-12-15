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
 * COMPLETE VERSION - obsługuje wszystkie typy modułów STANDARD i PREMIUM
 */
function extractImageIdsFromContentDocument(contentDocument) {
  const images = [];

  // Helper function to extract image data including dimensions
  function addImage(moduleType, imageObj, fieldName) {
    if (imageObj && imageObj.uploadDestinationId) {
      // Extract width and height from imageCropSpecification
      const width = imageObj.imageCropSpecification?.size?.width?.value || null;
      const height = imageObj.imageCropSpecification?.size?.height?.value || null;

      images.push({
        moduleType: moduleType,
        fieldName: fieldName || 'image',
        uploadDestinationId: imageObj.uploadDestinationId,
        altText: imageObj.altText || '',
        width: width,
        height: height
      });
      Logger.log(`  Found image: ${fieldName || 'image'} = ${imageObj.uploadDestinationId}${width && height ? ` (${width}x${height})` : ''}`);
    }
  }

  try {
    const modules = contentDocument.contentRecord?.contentDocument?.contentModuleList || [];

    for (const module of modules) {
      const moduleType = module.contentModuleType;
      Logger.log(`Processing module type: ${moduleType}`);

      // ========== STANDARD MODULES ==========

      // STANDARD_SINGLE_SIDE_IMAGE
      if (module.standardSingleSideImage?.block?.image) {
        addImage(moduleType, module.standardSingleSideImage.block.image, 'image');
      }

      // STANDARD_HEADER_IMAGE_TEXT
      if (module.standardHeaderImageText?.block?.image) {
        addImage(moduleType, module.standardHeaderImageText.block.image, 'image');
      }

      // STANDARD_COMPANY_LOGO
      if (module.standardCompanyLogo?.companyLogo) {
        addImage(moduleType, module.standardCompanyLogo.companyLogo, 'companyLogo');
      }

      // STANDARD_IMAGE_TEXT_OVERLAY
      if (module.standardImageTextOverlay?.block?.image) {
        addImage(moduleType, module.standardImageTextOverlay.block.image, 'image');
      }

      // STANDARD_SINGLE_IMAGE_HIGHLIGHTS
      if (module.standardSingleImageHighlights?.image) {
        addImage(moduleType, module.standardSingleImageHighlights.image, 'image');
      }
      // Also check for bulleted list icons
      if (module.standardSingleImageHighlights?.bulletedListBlock) {
        const bulletedList = module.standardSingleImageHighlights.bulletedListBlock;
        for (let i = 0; i < bulletedList.length; i++) {
          if (bulletedList[i]?.icon) {
            addImage(moduleType, bulletedList[i].icon, `bulleted_list_${i+1}_icon`);
          }
        }
      }

      // STANDARD_MULTIPLE_IMAGE_TEXT (array of images)
      if (module.standardMultipleImageText?.image) {
        const imgArray = Array.isArray(module.standardMultipleImageText.image)
          ? module.standardMultipleImageText.image
          : [module.standardMultipleImageText.image];
        imgArray.forEach((img, idx) => {
          addImage(moduleType, img, `image${idx + 1}`);
        });
      }

      // STANDARD_FOUR_IMAGE_TEXT (block1-4)
      if (module.standardFourImageText) {
        for (let i = 1; i <= 4; i++) {
          const block = module.standardFourImageText[`block${i}`];
          if (block?.image) {
            addImage(moduleType, block.image, `image${i}`);
          }
        }
      }

      // STANDARD_FOUR_IMAGE_TEXT_QUADRANT (block1-4)
      if (module.standardFourImageTextQuadrant) {
        for (let i = 1; i <= 4; i++) {
          const block = module.standardFourImageTextQuadrant[`block${i}`];
          if (block?.image) {
            addImage(moduleType, block.image, `image${i}`);
          }
        }
      }

      // STANDARD_THREE_IMAGE_TEXT (block1-3)
      if (module.standardThreeImageText) {
        for (let i = 1; i <= 3; i++) {
          const block = module.standardThreeImageText[`block${i}`];
          if (block?.image) {
            addImage(moduleType, block.image, `image${i}`);
          }
        }
      }

      // STANDARD_COMPARISON_TABLE (product columns)
      if (module.standardComparisonTable?.productColumns) {
        module.standardComparisonTable.productColumns.forEach((col, idx) => {
          if (col?.image) {
            addImage(moduleType, col.image, `productImage${idx + 1}`);
          }
        });
      }

      // STANDARD_SINGLE_IMAGE_SPECS_DETAIL
      if (module.standardSingleImageSpecsDetail?.image) {
        addImage(moduleType, module.standardSingleImageSpecsDetail.image, 'image');
      }

      // STANDARD_IMAGE_SIDEBAR
      if (module.standardImageSidebar?.sidebarImage) {
        addImage(moduleType, module.standardImageSidebar.sidebarImage, 'image');
      }

      // ========== PREMIUM MODULES ==========

      // PREMIUM_SINGLE_IMAGE
      if (module.premiumSingleImage?.image) {
        addImage(moduleType, module.premiumSingleImage.image, 'image');
      }

      // PREMIUM_IMAGE_TEXT
      if (module.premiumImageText?.image) {
        addImage(moduleType, module.premiumImageText.image, 'image');
      }

      // PREMIUM_FULL_BACKGROUND_TEXT
      if (module.premiumFullBackgroundText?.backgroundImage) {
        addImage(moduleType, module.premiumFullBackgroundText.backgroundImage, 'backgroundImage');
      }

      // PREMIUM_FULL_BACKGROUND_IMAGE
      if (module.premiumFullBackgroundImage?.backgroundImage) {
        addImage(moduleType, module.premiumFullBackgroundImage.backgroundImage, 'backgroundImage');
      }

      // PREMIUM_IMAGE_CAROUSEL (array of carousel images)
      if (module.premiumImageCarousel?.carouselImages) {
        const carouselImages = module.premiumImageCarousel.carouselImages;
        carouselImages.forEach((img, idx) => {
          addImage(moduleType, img, `image${idx + 1}`);
        });
      }

      // PREMIUM_FOUR_IMAGE_CAROUSEL (same structure as IMAGE_CAROUSEL)
      if (module.premiumFourImageCarousel?.carouselImages) {
        const carouselImages = module.premiumFourImageCarousel.carouselImages;
        carouselImages.forEach((img, idx) => {
          addImage(moduleType, img, `image${idx + 1}`);
        });
      }

      // PREMIUM_COMPARISON_CHART (product columns)
      if (module.premiumComparisonChart?.productColumns) {
        module.premiumComparisonChart.productColumns.forEach((col, idx) => {
          if (col?.image) {
            addImage(moduleType, col.image, `image${idx + 1}`);
          }
        });
      }

      // PREMIUM_HOTSPOT_IMAGE
      if (module.premiumHotspotImage?.image) {
        addImage(moduleType, module.premiumHotspotImage.image, 'image');
      }

      // PREMIUM_THREE_IMAGE_TEXT (block1-3)
      if (module.premiumThreeImageText) {
        for (let i = 1; i <= 3; i++) {
          const block = module.premiumThreeImageText[`block${i}`];
          if (block?.image) {
            addImage(moduleType, block.image, `image${i}`);
          }
        }
      }

      // PREMIUM_FOUR_IMAGE_TEXT (block1-4)
      if (module.premiumFourImageText) {
        for (let i = 1; i <= 4; i++) {
          const block = module.premiumFourImageText[`block${i}`];
          if (block?.image) {
            addImage(moduleType, block.image, `image${i}`);
          }
        }
      }
    }

    Logger.log(`Total images extracted: ${images.length}`);

  } catch (error) {
    Logger.log(`Error extracting images: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
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
