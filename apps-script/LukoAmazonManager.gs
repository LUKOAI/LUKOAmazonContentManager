/**
 * LUKO Amazon Content Manager - Main Apps Script
 * Version: 2.0.0 - Enterprise Multi-Language
 *
 * NAMING CONVENTIONS:
 * - Function names: Use "luko" prefix (e.g., lukoSyncToAmazon)
 * - Sheet names: NO "LUKO" prefix (e.g., "Content-DE" not "LUKO-Content-DE")
 * - Column headers: NO "LUKO" prefix
 * - Menu items: NO "LUKO" prefix (user-facing)
 */

// ========================================
// CONFIGURATION & GLOBALS
// ========================================

const CONFIG = {
  cloudFunctionUrl: '', // Set from Config sheet
  version: '2.0.0',
  maxRetries: 3,
  retryDelay: 2000,
  batchSize: 50
};

const SHEETS = {
  config: 'Config',
  marketplaces: 'Marketplaces',
  productsMaster: 'Products-Master',
  logs: 'Logs',

  // Dynamic content sheets
  getContentSheet: (marketplace) => `Content-${marketplace}`,

  // Other sheets
  variants: 'Variants',
  customization: 'Customization',
  images: 'Images',
  images360: 'Images-360',
  videos: 'Videos',
  aplusBasic: 'APlus-Basic',
  aplusPremium: 'APlus-Premium',
  brandStore: 'BrandStore',
  brandStrip: 'BrandStrip',
  coupons: 'Coupons',
  promotions: 'Promotions',
  deals: 'Deals',
  templatesContent: 'Templates-Content',
  templatesAPlus: 'Templates-APlus',
  translationQueue: 'Translation-Queue'
};

const MARKETPLACE_LANGUAGES = {
  'DE': {
    marketplaceId: 'A1PA6795UKMFR9',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['de-DE', 'en-GB', 'pl-PL', 'tr-TR', 'cs-CZ', 'da-DK'],
    primary: 'de-DE',
    currency: 'EUR'
  },
  'FR': {
    marketplaceId: 'A13V1IB3VIYZZH',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['fr-FR', 'en-GB', 'de-DE', 'es-ES', 'it-IT'],
    primary: 'fr-FR',
    currency: 'EUR'
  },
  'IT': {
    marketplaceId: 'APJ6JRA9NG5V4',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['it-IT', 'en-GB', 'de-DE', 'fr-FR'],
    primary: 'it-IT',
    currency: 'EUR'
  },
  'ES': {
    marketplaceId: 'A1RKKUPIHCS9HS',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['es-ES', 'en-GB', 'ca-ES', 'eu-ES'],
    primary: 'es-ES',
    currency: 'EUR'
  },
  'UK': {
    marketplaceId: 'A1F83G8C2ARO7P',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pl-PL'],
    primary: 'en-GB',
    currency: 'GBP'
  },
  'NL': {
    marketplaceId: 'A1805IZSGTT6HS',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['nl-NL', 'en-GB', 'de-DE', 'fr-FR'],
    primary: 'nl-NL',
    currency: 'EUR'
  },
  'BE': {
    marketplaceId: 'AMEN7PMS3EDWL',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['nl-NL', 'fr-FR', 'en-GB', 'de-DE'],
    primary: 'nl-NL',
    currency: 'EUR'
  },
  'PL': {
    marketplaceId: 'A1C3SOZRARQ6R3',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['pl-PL', 'en-GB', 'de-DE'],
    primary: 'pl-PL',
    currency: 'PLN'
  },
  'SE': {
    marketplaceId: 'A2NODRKZP88ZB9',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['sv-SE', 'en-GB', 'de-DE', 'fi-FI', 'da-DK'],
    primary: 'sv-SE',
    currency: 'SEK'
  },
  'IE': {
    marketplaceId: 'A1QA6N5NQHZ0EW',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    languages: ['en-GB', 'ga-IE'],
    primary: 'en-GB',
    currency: 'EUR'
  }
};

// ========================================
// MENU CREATION
// ========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Amazon Manager')
    .addSubMenu(ui.createMenu('Export to Amazon')
      .addItem('Sync Selected Products', 'lukoSyncSelectedProducts')
      .addItem('Sync All Marketplaces', 'lukoSyncAllMarketplaces')
      .addItem('Sync Current Marketplace', 'lukoSyncCurrentMarketplace')
      .addSeparator()
      .addItem('Upload Images', 'lukoUploadImages')
      .addItem('Upload Videos', 'lukoUploadVideos')
      .addItem('Publish A+ Content', 'lukoPublishAPlus')
      .addItem('Create Coupons', 'lukoCreateCoupons')
      .addItem('Launch Promotions', 'lukoLaunchPromotions'))

    .addSubMenu(ui.createMenu('Import from Amazon')
      .addItem('Import Products', 'lukoImportProducts')
      .addItem('Import Pricing', 'lukoImportPricing')
      .addItem('Import Inventory', 'lukoImportInventory')
      .addItem('Import A+ Content', 'lukoImportAPlus'))

    .addSubMenu(ui.createMenu('Tools')
      .addItem('Validate Data', 'lukoValidateData')
      .addItem('Apply Template', 'lukoApplyTemplate')
      .addItem('Translate Content', 'lukoTranslateContent')
      .addItem('Generate Variants', 'lukoGenerateVariants')
      .addSeparator()
      .addItem('Clear Errors', 'lukoClearErrors')
      .addItem('Refresh Status', 'lukoRefreshStatus'))

    .addSubMenu(ui.createMenu('Reports')
      .addItem('Content Completion Report', 'lukoReportCompletion')
      .addItem('Language Coverage Report', 'lukoReportLanguageCoverage')
      .addItem('View Recent Logs', 'lukoViewLogs')
      .addItem('Show Errors', 'lukoShowErrors'))

    .addSeparator()
    .addItem('Settings', 'lukoShowSettings')
    .addItem('Help', 'lukoShowHelp')
    .addItem('About', 'lukoShowAbout')
    .addToUi();
}

// ========================================
// CORE SYNC FUNCTIONS
// ========================================

function lukoSyncSelectedProducts() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetName = sheet.getName();

    // Determine if this is a content sheet
    if (!sheetName.startsWith('Content-')) {
      showError('Please select products from a Content-{Marketplace} sheet');
      return;
    }

    const marketplace = sheetName.replace('Content-', '');
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select products by checking the boxes');
      return;
    }

    showProgress(`Syncing ${selectedRows.length} products to Amazon ${marketplace}...`);

    // Get marketplace configuration
    const marketplaceConfig = getMarketplaceConfig(marketplace);
    const activeLanguages = getActiveLanguages(marketplace);

    // Process each selected product
    const results = [];
    for (const row of selectedRows) {
      const productData = extractProductData(sheet, row, activeLanguages);
      const result = syncProductToAmazon(productData, marketplace, marketplaceConfig);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    // Log results
    logOperations(results, marketplace, 'SYNC_PRODUCTS');

    // Show summary
    showSummary(results);

  } catch (error) {
    handleError('lukoSyncSelectedProducts', error);
  }
}

function lukoSyncAllMarketplaces() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Sync All Marketplaces',
      'This will sync all checked products across ALL active marketplaces. This may take several minutes. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    const marketplaces = getActiveMarketplaces();
    const totalResults = [];

    for (const marketplace of marketplaces) {
      showProgress(`Processing ${marketplace}...`);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(`Content-${marketplace}`);
      if (!sheet) continue;

      const selectedRows = getSelectedCheckboxRows(sheet);

      for (const row of selectedRows) {
        const activeLanguages = getActiveLanguages(marketplace);
        const productData = extractProductData(sheet, row, activeLanguages);
        const result = syncProductToAmazon(productData, marketplace, getMarketplaceConfig(marketplace));
        totalResults.push(result);
        updateRowStatus(sheet, row, result);
      }
    }

    logOperations(totalResults, 'ALL', 'SYNC_ALL_MARKETPLACES');
    showSummary(totalResults);

  } catch (error) {
    handleError('lukoSyncAllMarketplaces', error);
  }
}

function lukoSyncCurrentMarketplace() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetName = sheet.getName();

    if (!sheetName.startsWith('Content-')) {
      showError('Please activate a Content-{Marketplace} sheet');
      return;
    }

    const marketplace = sheetName.replace('Content-', '');
    const allRows = getAllCheckboxRows(sheet);

    if (allRows.length === 0) {
      showError('No products selected in this marketplace');
      return;
    }

    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      `Sync ${marketplace} Marketplace`,
      `This will sync ${allRows.length} products. Continue?`,
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    showProgress(`Syncing ${allRows.length} products to Amazon ${marketplace}...`);

    const marketplaceConfig = getMarketplaceConfig(marketplace);
    const activeLanguages = getActiveLanguages(marketplace);
    const results = [];

    for (const row of allRows) {
      const productData = extractProductData(sheet, row, activeLanguages);
      const result = syncProductToAmazon(productData, marketplace, marketplaceConfig);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    logOperations(results, marketplace, 'SYNC_CURRENT_MARKETPLACE');
    showSummary(results);

  } catch (error) {
    handleError('lukoSyncCurrentMarketplace', error);
  }
}

// ========================================
// DATA EXTRACTION FUNCTIONS
// ========================================

function extractProductData(sheet, rowNumber, activeLanguages) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const product = {
    asin: getColumnValue(values, headers, 'ASIN'),
    sku: getColumnValue(values, headers, 'SKU'),
    productType: getColumnValue(values, headers, 'Product Type'),
    action: getColumnValue(values, headers, 'Action') || 'UPDATE',
    content: {}
  };

  // Extract multi-language content
  for (const lang of activeLanguages) {
    product.content[lang] = {
      title: getColumnValue(values, headers, `Title [${lang}]`),
      brand: getColumnValue(values, headers, `Brand [${lang}]`),
      bulletPoints: [
        getColumnValue(values, headers, `Bullet1 [${lang}]`),
        getColumnValue(values, headers, `Bullet2 [${lang}]`),
        getColumnValue(values, headers, `Bullet3 [${lang}]`),
        getColumnValue(values, headers, `Bullet4 [${lang}]`),
        getColumnValue(values, headers, `Bullet5 [${lang}]`)
      ].filter(b => b),
      description: getColumnValue(values, headers, `Description [${lang}]`),
      keywords: getColumnValue(values, headers, `Keywords [${lang}]`),
      aboutBrand: getColumnValue(values, headers, `About Brand [${lang}]`),
      targetAudience: getColumnValue(values, headers, `Target Audience [${lang}]`)
    };
  }

  return product;
}

function syncProductToAmazon(productData, marketplace, marketplaceConfig) {
  try {
    // Prepare payload for Cloud Function
    const payload = {
      operation: productData.action.toLowerCase(),
      marketplace: marketplace,
      marketplaceId: marketplaceConfig.marketplaceId,
      asin: productData.asin,
      sku: productData.sku,
      productType: productData.productType,
      content: productData.content,
      credentials: getCredentials()
    };

    // Call Cloud Function
    const response = callCloudFunction(payload);

    return {
      asin: productData.asin,
      marketplace: marketplace,
      status: response.status,
      message: response.message,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: productData.asin,
      marketplace: marketplace,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

// ========================================
// IMAGES & MEDIA MANAGEMENT
// ========================================

function lukoUploadImages() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.images);
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select images to upload');
      return;
    }

    showProgress(`Uploading ${selectedRows.length} image sets...`);

    const results = [];
    for (const row of selectedRows) {
      const imageData = extractImageData(sheet, row);
      const result = uploadImagesToAmazon(imageData);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    logOperations(results, 'ALL', 'UPLOAD_IMAGES');
    showSummary(results);

  } catch (error) {
    handleError('lukoUploadImages', error);
  }
}

function lukoUploadVideos() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.videos);
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select videos to upload');
      return;
    }

    showProgress(`Uploading ${selectedRows.length} videos...`);

    const results = [];
    for (const row of selectedRows) {
      const videoData = extractVideoData(sheet, row);
      const result = uploadVideosToAmazon(videoData);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    logOperations(results, 'ALL', 'UPLOAD_VIDEOS');
    showSummary(results);

  } catch (error) {
    handleError('lukoUploadVideos', error);
  }
}

function extractImageData(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const images = {
    asin: getColumnValue(values, headers, 'ASIN'),
    sku: getColumnValue(values, headers, 'SKU'),
    marketplace: getColumnValue(values, headers, 'Marketplace'),
    mainImage: {
      url: getColumnValue(values, headers, 'Main Image URL'),
      altText: {}
    },
    additionalImages: []
  };

  // Extract alt text for all languages
  const languages = getActiveLanguages(images.marketplace);
  for (const lang of languages) {
    images.mainImage.altText[lang] = getColumnValue(values, headers, `Main Image Alt [${lang}]`);
  }

  // Extract additional images (1-8)
  for (let i = 1; i <= 8; i++) {
    const imgUrl = getColumnValue(values, headers, `Alt Image ${i} URL`);
    if (imgUrl) {
      const altTexts = {};
      for (const lang of languages) {
        altTexts[lang] = getColumnValue(values, headers, `Alt Text ${i} [${lang}]`);
      }
      images.additionalImages.push({
        url: imgUrl,
        altText: altTexts
      });
    }
  }

  return images;
}

function extractVideoData(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  return {
    asin: getColumnValue(values, headers, 'ASIN'),
    sku: getColumnValue(values, headers, 'SKU'),
    marketplace: getColumnValue(values, headers, 'Marketplace'),
    videoUrl: getColumnValue(values, headers, 'Video URL'),
    videoType: getColumnValue(values, headers, 'Video Type'),
    thumbnailUrl: getColumnValue(values, headers, 'Thumbnail URL'),
    duration: getColumnValue(values, headers, 'Duration (sec)'),
    platform: getColumnValue(values, headers, 'Platform')
  };
}

function uploadImagesToAmazon(imageData) {
  try {
    const payload = {
      operation: 'upload_images',
      marketplace: imageData.marketplace,
      asin: imageData.asin,
      sku: imageData.sku,
      images: imageData,
      credentials: getCredentials()
    };

    const response = callCloudFunction(payload);

    return {
      asin: imageData.asin,
      marketplace: imageData.marketplace,
      status: response.status,
      message: response.message,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: imageData.asin,
      marketplace: imageData.marketplace,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

function uploadVideosToAmazon(videoData) {
  try {
    const payload = {
      operation: 'upload_videos',
      marketplace: videoData.marketplace,
      asin: videoData.asin,
      sku: videoData.sku,
      video: videoData,
      credentials: getCredentials()
    };

    const response = callCloudFunction(payload);

    return {
      asin: videoData.asin,
      marketplace: videoData.marketplace,
      status: response.status,
      message: response.message,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: videoData.asin,
      marketplace: videoData.marketplace,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

// ========================================
// A+ CONTENT MANAGEMENT
// ========================================

function lukoPublishAPlus() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Publish A+ Content',
      'Choose content type:\nYES = Basic\nNO = Premium\nCANCEL = Abort',
      ui.ButtonSet.YES_NO_CANCEL
    );

    let contentType;
    if (response === ui.Button.YES) {
      contentType = 'BASIC';
    } else if (response === ui.Button.NO) {
      contentType = 'PREMIUM';
    } else {
      return;
    }

    const sheetName = contentType === 'BASIC' ? SHEETS.aplusBasic : SHEETS.aplusPremium;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select A+ content to publish');
      return;
    }

    showProgress(`Publishing ${selectedRows.length} A+ ${contentType} modules...`);

    const results = [];
    for (const row of selectedRows) {
      const aplusData = extractAPlusData(sheet, row, contentType);
      const result = publishAPlusContent(aplusData, contentType);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    logOperations(results, 'ALL', `PUBLISH_APLUS_${contentType}`);
    showSummary(results);

  } catch (error) {
    handleError('lukoPublishAPlus', error);
  }
}

function extractAPlusData(sheet, rowNumber, contentType) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const aplus = {
    asin: getColumnValue(values, headers, 'ASIN'),
    contentId: getColumnValue(values, headers, 'Content ID'),
    moduleNumber: getColumnValue(values, headers, 'Module Number'),
    moduleType: getColumnValue(values, headers, 'Module Type'),
    language: getColumnValue(values, headers, 'Language'),
    content: {}
  };

  // Extract module-specific content based on type
  if (contentType === 'BASIC') {
    aplus.content = {
      heading: getColumnValue(values, headers, `Heading [${aplus.language}]`),
      subheading: getColumnValue(values, headers, `Subheading [${aplus.language}]`),
      bodyText: getColumnValue(values, headers, `Body Text [${aplus.language}]`),
      images: [
        { url: getColumnValue(values, headers, 'Image 1 URL'), alt: getColumnValue(values, headers, `Image 1 Alt [${aplus.language}]`) },
        { url: getColumnValue(values, headers, 'Image 2 URL'), alt: getColumnValue(values, headers, `Image 2 Alt [${aplus.language}]`) },
        { url: getColumnValue(values, headers, 'Image 3 URL'), alt: getColumnValue(values, headers, `Image 3 Alt [${aplus.language}]`) },
        { url: getColumnValue(values, headers, 'Image 4 URL'), alt: getColumnValue(values, headers, `Image 4 Alt [${aplus.language}]`) }
      ].filter(img => img.url),
      cta: {
        text: getColumnValue(values, headers, `CTA Text [${aplus.language}]`),
        link: getColumnValue(values, headers, 'CTA Link')
      }
    };
  } else {
    // Premium content structure
    aplus.content = {
      heroImage: getColumnValue(values, headers, 'Hero Image URL'),
      heroVideo: getColumnValue(values, headers, 'Hero Video URL'),
      brandLogo: getColumnValue(values, headers, 'Brand Logo URL'),
      tagline: getColumnValue(values, headers, `Tagline [${aplus.language}]`)
    };
  }

  return aplus;
}

function publishAPlusContent(aplusData, contentType) {
  try {
    const payload = {
      operation: 'publish_aplus',
      contentType: contentType,
      data: aplusData,
      credentials: getCredentials()
    };

    const response = callCloudFunction(payload);

    return {
      asin: aplusData.asin,
      contentId: aplusData.contentId,
      status: response.status,
      message: response.message,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: aplusData.asin,
      contentId: aplusData.contentId,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

// ========================================
// COUPONS & PROMOTIONS
// ========================================

function lukoCreateCoupons() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.coupons);
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select coupons to create');
      return;
    }

    showProgress(`Creating ${selectedRows.length} coupons...`);

    const results = [];
    for (const row of selectedRows) {
      const couponData = extractCouponData(sheet, row);
      const result = createCouponOnAmazon(couponData);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    logOperations(results, 'ALL', 'CREATE_COUPONS');
    showSummary(results);

  } catch (error) {
    handleError('lukoCreateCoupons', error);
  }
}

function lukoLaunchPromotions() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.promotions);
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select promotions to launch');
      return;
    }

    showProgress(`Launching ${selectedRows.length} promotions...`);

    const results = [];
    for (const row of selectedRows) {
      const promoData = extractPromotionData(sheet, row);
      const result = launchPromotionOnAmazon(promoData);
      results.push(result);
      updateRowStatus(sheet, row, result);
    }

    logOperations(results, 'ALL', 'LAUNCH_PROMOTIONS');
    showSummary(results);

  } catch (error) {
    handleError('lukoLaunchPromotions', error);
  }
}

function extractCouponData(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  return {
    couponId: getColumnValue(values, headers, 'Coupon ID'),
    asin: getColumnValue(values, headers, 'ASIN'),
    sku: getColumnValue(values, headers, 'SKU'),
    marketplace: getColumnValue(values, headers, 'Marketplace'),
    couponType: getColumnValue(values, headers, 'Coupon Type'),
    discountValue: getColumnValue(values, headers, 'Discount Value'),
    minPurchase: getColumnValue(values, headers, 'Min Purchase Amount'),
    maxDiscount: getColumnValue(values, headers, 'Max Discount Cap'),
    currency: getColumnValue(values, headers, 'Currency'),
    customerType: getColumnValue(values, headers, 'Customer Type'),
    startDate: getColumnValue(values, headers, 'Start Date'),
    endDate: getColumnValue(values, headers, 'End Date'),
    totalBudget: getColumnValue(values, headers, 'Total Budget'),
    redemptionLimit: getColumnValue(values, headers, 'Redemption Limit')
  };
}

function extractPromotionData(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  return {
    promotionId: getColumnValue(values, headers, 'Promotion ID'),
    asin: getColumnValue(values, headers, 'ASIN'),
    marketplace: getColumnValue(values, headers, 'Marketplace'),
    promotionType: getColumnValue(values, headers, 'Promotion Type'),
    discountType: getColumnValue(values, headers, 'Discount Type'),
    discountValue: getColumnValue(values, headers, 'Discount Value'),
    startDate: getColumnValue(values, headers, 'Start Date'),
    endDate: getColumnValue(values, headers, 'End Date')
  };
}

function createCouponOnAmazon(couponData) {
  try {
    const payload = {
      operation: 'create_coupon',
      marketplace: couponData.marketplace,
      coupon: couponData,
      credentials: getCredentials()
    };

    const response = callCloudFunction(payload);

    return {
      asin: couponData.asin,
      couponId: response.couponId || couponData.couponId,
      marketplace: couponData.marketplace,
      status: response.status,
      message: response.message,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: couponData.asin,
      couponId: couponData.couponId,
      marketplace: couponData.marketplace,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

function launchPromotionOnAmazon(promoData) {
  try {
    const payload = {
      operation: 'launch_promotion',
      marketplace: promoData.marketplace,
      promotion: promoData,
      credentials: getCredentials()
    };

    const response = callCloudFunction(payload);

    return {
      asin: promoData.asin,
      promotionId: response.promotionId || promoData.promotionId,
      marketplace: promoData.marketplace,
      status: response.status,
      message: response.message,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: promoData.asin,
      promotionId: promoData.promotionId,
      marketplace: promoData.marketplace,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

// ========================================
// IMPORT FUNCTIONS
// ========================================

function lukoImportProducts() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(
      'Import Products from Amazon',
      'Enter Marketplace (e.g., DE, FR, UK):',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) return;

    const marketplace = response.getResponseText().trim().toUpperCase();
    const marketplaceConfig = getMarketplaceConfig(marketplace);

    if (!marketplaceConfig) {
      showError(`Invalid marketplace: ${marketplace}`);
      return;
    }

    showProgress(`Importing products from Amazon ${marketplace}...`);

    const payload = {
      operation: 'import_products',
      marketplace: marketplace,
      marketplaceId: marketplaceConfig.marketplaceId,
      credentials: getCredentials()
    };

    const response2 = callCloudFunction(payload);
    const products = response2.products || [];

    // Insert products into Products-Master and Content sheets
    populateProductsSheet(products, marketplace);

    ui.alert(`Imported ${products.length} products from Amazon ${marketplace}`);

  } catch (error) {
    handleError('lukoImportProducts', error);
  }
}

function lukoImportPricing() {
  showInfo('Import Pricing feature coming soon!');
}

function lukoImportInventory() {
  showInfo('Import Inventory feature coming soon!');
}

function lukoImportAPlus() {
  showInfo('Import A+ Content feature coming soon!');
}

function populateProductsSheet(products, marketplace) {
  const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.productsMaster);
  const contentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(`Content-${marketplace}`);

  if (!contentSheet) {
    showError(`Content-${marketplace} sheet not found`);
    return;
  }

  const startRow = masterSheet.getLastRow() + 1;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Insert into Products-Master
    masterSheet.appendRow([
      false, // checkbox
      product.asin,
      product.parentAsin || '',
      product.sku,
      product.productType || 'PRODUCT',
      product.brand || '',
      marketplace,
      false, // has variations
      false, // is customizable
      false, // has A+
      false, // has video
      'FBA',
      'Active',
      new Date(),
      new Date(),
      'SYNC'
    ]);
  }
}

// ========================================
// VARIANTS MANAGEMENT
// ========================================

function lukoGenerateVariants() {
  try {
    const ui = SpreadsheetApp.getUi();

    const response = ui.prompt(
      'Generate Variants',
      'Enter Parent ASIN:',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) return;

    const parentAsin = response.getResponseText().trim();
    if (!parentAsin) {
      showError('Please enter a valid Parent ASIN');
      return;
    }

    // Prompt for variation attributes
    const variationResponse = ui.prompt(
      'Variation Configuration',
      'Enter variations (format: Size:S,M,L,XL|Color:Red,Blue,Green):',
      ui.ButtonSet.OK_CANCEL
    );

    if (variationResponse.getSelectedButton() !== ui.Button.OK) return;

    const variationConfig = parseVariationConfig(variationResponse.getResponseText());
    const variants = generateVariantCombinations(parentAsin, variationConfig);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.variants);

    // Insert variants into sheet
    for (const variant of variants) {
      sheet.appendRow([
        false, // checkbox
        parentAsin,
        'Parent Title', // will be filled by user
        '', // child ASIN (to be generated)
        '', // child SKU (to be generated)
        Object.keys(variationConfig).join(','),
        variant.Size || '',
        variant.Color || '',
        variant.Style || '',
        variant.Material || '',
        variant.Pattern || '',
        '', // color map
        '', // size standard
        0, // price delta
        0, // shipping delta
        '', // child image
        '', // specific attributes
        0, // inventory
        'Pending',
        'CREATE'
      ]);
    }

    ui.alert(`Generated ${variants.length} variants for ${parentAsin}`);

  } catch (error) {
    handleError('lukoGenerateVariants', error);
  }
}

function parseVariationConfig(configString) {
  const config = {};
  const attributes = configString.split('|');

  for (const attr of attributes) {
    const [key, values] = attr.split(':');
    config[key.trim()] = values.split(',').map(v => v.trim());
  }

  return config;
}

function generateVariantCombinations(parentAsin, config) {
  const attributes = Object.keys(config);
  const variants = [];

  function generate(current, index) {
    if (index === attributes.length) {
      variants.push({...current});
      return;
    }

    const attr = attributes[index];
    for (const value of config[attr]) {
      current[attr] = value;
      generate(current, index + 1);
    }
  }

  generate({ parentAsin }, 0);

  return variants;
}

// ========================================
// TRANSLATION & TEMPLATES
// ========================================

function lukoTranslateContent() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const ui = SpreadsheetApp.getUi();

    // Get selected range
    const selection = sheet.getActiveRange();
    const selectedText = selection.getValue();

    if (!selectedText || typeof selectedText !== 'string') {
      showError('Please select a cell with text to translate');
      return;
    }

    // Detect source language from column header
    const colHeader = sheet.getRange(1, selection.getColumn()).getValue();
    const sourceLangMatch = colHeader.match(/\[([a-z]{2}-[A-Z]{2})\]/);

    if (!sourceLangMatch) {
      showError('Cannot detect source language from column header');
      return;
    }

    const sourceLang = sourceLangMatch[1];

    // Get target languages
    const targetLangsResponse = ui.prompt(
      'Translate Content',
      `Translate from ${sourceLang} to (comma-separated, e.g., de-DE, fr-FR, it-IT):`,
      ui.ButtonSet.OK_CANCEL
    );

    if (targetLangsResponse.getSelectedButton() !== ui.Button.OK) return;

    const targetLangs = targetLangsResponse.getResponseText().split(',').map(l => l.trim());

    showProgress(`Translating to ${targetLangs.length} languages...`);

    // Call translation API
    const translations = translateText(selectedText, sourceLang, targetLangs);

    // Insert translations into adjacent columns
    for (const targetLang of targetLangs) {
      const targetCol = findColumnByHeader(sheet, `[${targetLang}]`);
      if (targetCol > 0) {
        sheet.getRange(selection.getRow(), targetCol).setValue(translations[targetLang]);
      }
    }

    ui.alert('Translation complete!');

  } catch (error) {
    handleError('lukoTranslateContent', error);
  }
}

function translateText(text, sourceLang, targetLangs) {
  const payload = {
    operation: 'translate',
    text: text,
    sourceLang: sourceLang,
    targetLangs: targetLangs
  };

  const response = callCloudFunction(payload);
  return response.translations || {};
}

function lukoApplyTemplate() {
  showInfo('Apply Template feature coming soon!');
}

// ========================================
// VALIDATION
// ========================================

function lukoValidateData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetName = sheet.getName();

    showProgress('Validating data...');

    let validationRules;
    if (sheetName.startsWith('Content-')) {
      validationRules = getContentValidationRules();
    } else if (sheetName === SHEETS.images) {
      validationRules = getImageValidationRules();
    } else {
      showError('Validation not available for this sheet');
      return;
    }

    const errors = validateSheet(sheet, validationRules);

    if (errors.length === 0) {
      SpreadsheetApp.getUi().alert('Validation Passed', 'All data is valid!', SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      highlightErrors(sheet, errors);
      showValidationReport(errors);
    }

  } catch (error) {
    handleError('lukoValidateData', error);
  }
}

function getContentValidationRules() {
  return {
    'ASIN': { required: true, pattern: /^[A-Z0-9]{10}$/, message: 'ASIN must be 10 alphanumeric characters' },
    'SKU': { required: true, maxLength: 40, message: 'SKU is required (max 40 chars)' },
    'Title ': { maxLength: 200, message: 'Title must be 200 characters or less' },
    'Bullet': { maxLength: 500, message: 'Bullet point must be 500 characters or less' },
    'Description ': { maxLength: 2000, message: 'Description must be 2000 characters or less' }
  };
}

function getImageValidationRules() {
  return {
    'ASIN': { required: true, pattern: /^[A-Z0-9]{10}$/, message: 'ASIN must be 10 alphanumeric characters' },
    'Main Image URL': { required: true, pattern: /^https?:\/\/.+/, message: 'Must be valid URL' }
  };
}

function validateSheet(sheet, rules) {
  const errors = [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let row = 1; row < data.length; row++) {
    for (let col = 0; col < headers.length; col++) {
      const header = headers[col];
      const value = data[row][col];

      // Find applicable rule
      const ruleKey = Object.keys(rules).find(key => header.includes(key));
      if (!ruleKey) continue;

      const rule = rules[ruleKey];
      const error = validateCell(value, rule, header);

      if (error) {
        errors.push({
          row: row + 1,
          col: col + 1,
          header: header,
          value: value,
          error: error
        });
      }
    }
  }

  return errors;
}

function validateCell(value, rule, header) {
  if (rule.required && (!value || value === '')) {
    return rule.message || `${header} is required`;
  }

  if (value && rule.pattern && !rule.pattern.test(value)) {
    return rule.message || `${header} format is invalid`;
  }

  if (value && rule.maxLength && value.toString().length > rule.maxLength) {
    return rule.message || `${header} exceeds maximum length of ${rule.maxLength}`;
  }

  return null;
}

function highlightErrors(sheet, errors) {
  // Clear previous highlighting
  sheet.getDataRange().setBackground(null);

  // Highlight error cells in red
  for (const error of errors) {
    sheet.getRange(error.row, error.col).setBackground('#ffcccc');
  }
}

function showValidationReport(errors) {
  const ui = SpreadsheetApp.getUi();
  const errorSummary = errors.slice(0, 10).map(e =>
    `Row ${e.row}, ${e.header}: ${e.error}`
  ).join('\n');

  ui.alert(
    'Validation Errors',
    `Found ${errors.length} errors:\n\n${errorSummary}\n\n${errors.length > 10 ? '... and more' : ''}`,
    ui.ButtonSet.OK
  );
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function lukoClearErrors() {
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.getDataRange().setBackground(null);
  showInfo('Errors cleared');
}

function lukoRefreshStatus() {
  showInfo('Status refresh feature coming soon!');
}

// ========================================
// REPORTS
// ========================================

function lukoReportCompletion() {
  showInfo('Content Completion Report coming soon!');
}

function lukoReportLanguageCoverage() {
  showInfo('Language Coverage Report coming soon!');
}

function lukoViewLogs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.logs);
  SpreadsheetApp.setActiveSheet(sheet);
}

function lukoShowErrors() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.logs);
  SpreadsheetApp.setActiveSheet(sheet);
  sheet.getRange('A1').autoFilter();
  showInfo('Filter Status column for ERROR to see errors');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getSelectedCheckboxRows(sheet) {
  const data = sheet.getDataRange().getValues();
  const checkboxCol = 0; // Assuming first column

  const selectedRows = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][checkboxCol] === true) {
      selectedRows.push(i + 1);
    }
  }

  return selectedRows;
}

function getAllCheckboxRows(sheet) {
  return getSelectedCheckboxRows(sheet);
}

function getColumnValue(values, headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? values[index] : '';
}

function findColumnByHeader(sheet, headerText) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const index = headers.findIndex(h => h && h.toString().includes(headerText));
  return index >= 0 ? index + 1 : -1;
}

function getActiveMarketplaces() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.marketplaces);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const marketplaceCol = headers.indexOf('Marketplace');
  const exportCol = headers.indexOf('Export Active');

  if (marketplaceCol === -1) return [];

  const activeMarketplaces = [];
  for (let i = 1; i < data.length; i++) {
    if (exportCol >= 0 && data[i][exportCol] === true) {
      const mp = data[i][marketplaceCol];
      if (!activeMarketplaces.includes(mp)) {
        activeMarketplaces.push(mp);
      }
    }
  }

  return activeMarketplaces;
}

function getActiveLanguages(marketplace) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.marketplaces);
  if (!sheet) {
    // Fallback to hardcoded config
    return MARKETPLACE_LANGUAGES[marketplace]?.languages || [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const marketplaceCol = headers.indexOf('Marketplace');
  const languageCol = headers.indexOf('Language Code');
  const exportCol = headers.indexOf('Export Active');

  const activeLanguages = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][marketplaceCol] === marketplace && data[i][exportCol] === true) {
      activeLanguages.push(data[i][languageCol]);
    }
  }

  return activeLanguages.length > 0 ? activeLanguages : MARKETPLACE_LANGUAGES[marketplace]?.languages || [];
}

function getMarketplaceConfig(marketplace) {
  return MARKETPLACE_LANGUAGES[marketplace] || null;
}

function getCredentials() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.config);
  if (!sheet) {
    throw new Error('Config sheet not found');
  }

  const data = sheet.getDataRange().getValues();

  const credentials = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      credentials[data[i][0]] = data[i][1];
    }
  }

  return {
    lwaClientId: credentials['LWA Client ID'],
    lwaClientSecret: credentials['LWA Client Secret'],
    refreshToken: credentials['Refresh Token'],
    sellerId: credentials['Seller ID']
  };
}

function callCloudFunction(payload) {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.config);
  if (!configSheet) {
    throw new Error('Config sheet not found');
  }

  const data = configSheet.getDataRange().getValues();
  let cloudFunctionUrl = '';

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'Cloud Function URL') {
      cloudFunctionUrl = data[i][1];
      break;
    }
  }

  if (!cloudFunctionUrl) {
    throw new Error('Cloud Function URL not configured');
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(cloudFunctionUrl, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      throw new Error(result.error || result.message || 'Cloud Function error');
    }

    return result;

  } catch (error) {
    Logger.log(`Cloud Function Error: ${error.toString()}`);
    throw error;
  }
}

function updateRowStatus(sheet, rowNumber, result) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf('Status') + 1;
  const errorCol = headers.indexOf('Errors') + 1;
  const lastSyncCol = headers.indexOf('Last Sync Date') + 1;

  if (statusCol > 0) {
    sheet.getRange(rowNumber, statusCol).setValue(result.status);
  }

  if (errorCol > 0 && result.status === 'ERROR') {
    sheet.getRange(rowNumber, errorCol).setValue(result.message);
  }

  if (lastSyncCol > 0 && result.status === 'SUCCESS') {
    sheet.getRange(rowNumber, lastSyncCol).setValue(new Date());
  }
}

function logOperations(results, marketplace, operationType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.logs);
  if (!sheet) return;

  const user = Session.getActiveUser().getEmail();

  for (const result of results) {
    sheet.appendRow([
      new Date(),
      user,
      marketplace,
      result.language || '',
      result.asin || result.sku || '',
      operationType,
      JSON.stringify(result).substring(0, 500),
      result.status,
      '',
      result.message || ''
    ]);
  }
}

function showProgress(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Processing...', -1);
}

function showError(message) {
  SpreadsheetApp.getUi().alert('Error', message, SpreadsheetApp.getUi().ButtonSet.OK);
  SpreadsheetApp.getActiveSpreadsheet().toast('');
}

function showInfo(message) {
  SpreadsheetApp.getUi().alert('Info', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

function showSummary(results) {
  const success = results.filter(r => r.status === 'SUCCESS').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  const message = `
Successful: ${success}
Errors: ${errors}
Total: ${results.length}
  `.trim();

  SpreadsheetApp.getUi().alert('Operation Complete', message, SpreadsheetApp.getUi().ButtonSet.OK);
  SpreadsheetApp.getActiveSpreadsheet().toast('');
}

function handleError(functionName, error) {
  Logger.log(`Error in ${functionName}: ${error.toString()}`);
  Logger.log(error.stack);

  showError(`An error occurred: ${error.message}\n\nPlease check the logs for details.`);
}

// ========================================
// UI HELPERS
// ========================================

function lukoShowSettings() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Settings',
    'Configure settings in the Config and Marketplaces sheets.',
    ui.ButtonSet.OK
  );
}

function lukoShowHelp() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Help',
    'LUKO Amazon Content Manager v2.0.0\n\nFor documentation, visit:\nhttps://github.com/your-org/LUKO-amazon-content-manager\n\nMenu Options:\n- Export: Sync content to Amazon\n- Import: Import from Amazon\n- Tools: Validation, translation, variants\n- Reports: Analytics and logs',
    ui.ButtonSet.OK
  );
}

function lukoShowAbout() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'LUKO Amazon Content Manager',
    `Version: ${CONFIG.version}\n\nEnterprise Multi-Language Content Management for Amazon Sellers\n\nDeveloped for managing ALL product content across European Amazon marketplaces.`,
    ui.ButtonSet.OK
  );
}
