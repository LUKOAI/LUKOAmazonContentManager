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
    .addSubMenu(ui.createMenu('🔑 SP-API Auth')
      .addItem('📧 Setup Email Automation', 'setupEmailAutomationTrigger')
      .addItem('🔄 Process Emails Now', 'processActivationEmails')
      .addItem('✋ Stop Email Automation', 'removeEmailAutomationTrigger')
      .addSeparator()
      .addItem('📝 Manual: Exchange Auth Code', 'exchangeAuthorizationCode')
      .addItem('🔄 Manual: Refresh Token', 'refreshAccessToken'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Export to Amazon')
      .addItem('📤 Export Products (ProductsMain)', 'lukoExportProducts')
      .addItem('⚙️ Export Advanced (Partial/Full Update)', 'lukoExportProductsAdvanced')
      .addSeparator()
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
      .addItem('📥 Import Reverse Feed CSV', 'lukoImportReverseFeed')
      .addSeparator()
      .addItem('🔍 Search Products by Keyword', 'lukoSearchProducts')
      .addItem('📦 Import by ASIN(s)', 'lukoImportByASIN')
      .addSeparator()
      .addItem('Import Products (Full Catalog)', 'lukoImportProducts')
      .addItem('Import Pricing', 'lukoImportPricing')
      .addItem('Import Inventory', 'lukoImportInventory')
      .addItem('Import A+ Content', 'lukoImportAPlus'))

    .addSubMenu(ui.createMenu('Validation')
      .addItem('✅ Validate Selected Products', 'lukoValidateSelectedProducts')
      .addItem('Clear Error Highlights', 'lukoClearErrorHighlights')
      .addSeparator()
      .addItem('View ErrorLog Sheet', 'lukoViewErrorLog'))

    .addSubMenu(ui.createMenu('Templates')
      .addItem('📋 Template Selector', 'lukoShowTemplateSelector')
      .addItem('Apply Template Highlighting', 'lukoApplyTemplateHighlighting')
      .addItem('Clear Template Highlighting', 'lukoClearTemplateHighlighting')
      .addSeparator()
      .addItem('View Templates Sheet', 'lukoViewTemplates'))

    .addSubMenu(ui.createMenu('Tools')
      .addItem('🔌 Test API Connection', 'lukoTestAPIConnection')
      .addSeparator()
      .addItem('🎨 Generate Spreadsheet', 'lukoGenerateFullSpreadsheet')
      .addItem('🔧 Regenerate Config Only', 'lukoRegenerateConfigOnly')
      .addSeparator()
      .addItem('Translate Content', 'lukoTranslateContent')
      .addItem('Generate Variants', 'lukoGenerateVariants')
      .addSeparator()
      .addItem('Refresh Status', 'lukoRefreshStatus'))

    .addSubMenu(ui.createMenu('Reports')
      .addItem('Content Completion Report', 'lukoReportCompletion')
      .addItem('Language Coverage Report', 'lukoReportLanguageCoverage')
      .addItem('View Recent Logs', 'lukoViewLogs')
      .addItem('View Error Log', 'lukoViewErrorLog'))

    .addSubMenu(ui.createMenu('Extended Features')
      .addSubMenu(ui.createMenu('GPSR Compliance')
        .addItem('Validate GPSR Data', 'lukoValidateGpsrData')
        .addItem('Export GPSR to Amazon', 'lukoExportGpsrToAmazon')
        .addItem('Generate GPSR Report', 'lukoGenerateGpsrReport')
        .addSeparator()
        .addItem('Bulk Update Status', 'lukoBulkUpdateGpsrStatus')
        .addItem('Copy Manufacturer to All Parties', 'lukoCopyManufacturerToAllParties'))
      .addSubMenu(ui.createMenu('Documents')
        .addItem('Validate Documents', 'lukoValidateDocuments')
        .addItem('Export Documents to Amazon', 'lukoExportDocumentsToAmazon')
        .addSeparator()
        .addItem('Bulk Upload from Folder', 'lukoBulkUploadDocuments')
        .addItem('Organize by Product', 'lukoOrganizeDocumentsByProduct')
        .addItem('Generate Coverage Report', 'lukoGenerateDocumentCoverageReport')
        .addItem('Bulk Set Visibility', 'lukoBulkSetDocumentVisibility'))
      .addSubMenu(ui.createMenu('Customization')
        .addItem('Validate Customization', 'lukoValidateCustomization')
        .addItem('Export Customization to Amazon', 'lukoExportCustomizationToAmazon')
        .addSeparator()
        .addItem('Apply Template', 'lukoApplyCustomizationTemplate')
        .addItem('Bulk Enable', 'lukoBulkEnableCustomization')
        .addItem('Bulk Disable', 'lukoBulkDisableCustomization')
        .addItem('Calculate Pricing', 'lukoCalculatePricing'))
      .addSubMenu(ui.createMenu('Brand Strip')
        .addItem('Validate Brand Strip', 'lukoValidateBrandStrip')
        .addItem('Export Brand Strip to Amazon', 'lukoExportBrandStripToAmazon'))
      .addSubMenu(ui.createMenu('Brand Store')
        .addItem('Validate Store Config', 'lukoValidateBrandStoreConfig')
        .addItem('Validate Homepage', 'lukoValidateBrandStoreHomepage')
        .addItem('Validate Page 2', 'lukoValidateBrandStorePage2')
        .addItem('Validate Page 3', 'lukoValidateBrandStorePage3')
        .addSeparator()
        .addItem('Export Complete Store to Amazon', 'lukoExportBrandStoreToAmazon')
        .addSeparator()
        .addItem('Add Module to Page', 'lukoAddModuleToBrandStorePage'))
      .addSubMenu(ui.createMenu('Videos')
        .addItem('Validate Videos', 'lukoValidateVideos')
        .addItem('Export Videos to Amazon', 'lukoExportVideosToAmazon')
        .addSeparator()
        .addItem('Auto-Calculate Video Count', 'lukoAutoCalculateVideoCount')
        .addItem('Bulk Set Video Type', 'lukoBulkSetVideoType')
        .addItem('Bulk Set Language', 'lukoBulkSetVideoLanguage')
        .addItem('Generate Coverage Report', 'lukoGenerateVideoCoverageReport')
        .addItem('Check Missing Metadata', 'lukoCheckMissingVideoMetadata')))

    .addSubMenu(ui.createMenu('Help & Settings')
      .addItem('How to Get Reverse Feed', 'showReverseFeedHelp')
      .addItem('General Help', 'lukoShowHelp')
      .addSeparator()
      .addItem('Settings', 'lukoShowSettings')
      .addItem('About', 'lukoShowAbout'))
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

/**
 * Export products from ProductsMain sheet to Amazon
 * Checks ☑️ Export column, updates Status (PENDING → DONE/FAILED)
 * Auto-generates ProductLink and tracks ExportDateTime
 */
function lukoExportProducts() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductsMain');

    if (!sheet) {
      showError('ProductsMain sheet not found. Please generate spreadsheet first.');
      return;
    }

    // Get all rows where ☑️ Export checkbox is TRUE
    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('No products selected for export. Check the ☑️ Export boxes first.');
      return;
    }

    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Export Products to Amazon',
      `Export ${selectedRows.length} products to Amazon?\n\nNote: This will update products across all marketplaces based on available translations.`,
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) return;

    showProgress(`Exporting ${selectedRows.length} products to Amazon...`);

    const results = [];
    const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0]; // Row 3 contains headers

    for (const row of selectedRows) {
      try {
        // Set status to PENDING before export
        const statusCol = headers.indexOf('Status') + 1;
        if (statusCol > 0) {
          sheet.getRange(row, statusCol).setValue('PENDING');
        }

        // Extract product data
        const productData = extractProductDataFromMain(sheet, row, headers);

        // Determine primary marketplace (based on which translations are available)
        const marketplace = detectPrimaryMarketplace(productData);
        const marketplaceConfig = getMarketplaceConfig(marketplace);

        if (!marketplaceConfig) {
          throw new Error(`Invalid marketplace: ${marketplace}`);
        }

        // Export to Amazon
        const result = syncProductToAmazon(productData, marketplace, marketplaceConfig);
        result.marketplace = marketplace;
        results.push(result);

        // Update row status
        updateRowStatus(sheet, row, result);

        SpreadsheetApp.flush(); // Force update to spreadsheet

      } catch (error) {
        Logger.log(`Error exporting row ${row}: ${error.message}`);
        results.push({
          row: row,
          status: 'ERROR',
          message: error.toString(),
          marketplace: 'N/A'
        });
        updateRowStatus(sheet, row, {
          status: 'ERROR',
          message: error.toString(),
          marketplace: 'DE'
        });
      }
    }

    // Log all operations
    logOperations(results, 'ALL', 'EXPORT_PRODUCTS');

    // Show summary
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;

    ui.alert(
      'Export Complete',
      `✅ Success: ${successCount}\n❌ Failed: ${errorCount}\n\nCheck Status column and Logs sheet for details.`,
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().toast('Export complete', 'Success', 3);

  } catch (error) {
    handleError('lukoExportProducts', error);
  }
}

/**
 * Extract product data from ProductsMain sheet
 * Uses naming pattern: productTitle_DE, bulletPoint1_DE, etc.
 */
function extractProductDataFromMain(sheet, rowNumber, headers) {
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];

  const product = {
    asin: getColumnValue(values, headers, 'ASIN'),
    sku: getColumnValue(values, headers, 'SKU'),
    productType: getColumnValue(values, headers, 'Product Type') || 'PRODUCT',
    action: 'UPDATE', // Always UPDATE for exports (CREATE requires API call)
    content: {}
  };

  // Extract multi-language content
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of languages) {
    const title = getColumnValue(values, headers, `productTitle_${lang}`);

    // Only include language if it has at least a title
    if (title) {
      product.content[lang] = {
        title: title,
        brand: getColumnValue(values, headers, `brand_${lang}`),
        manufacturer: getColumnValue(values, headers, `manufacturer_${lang}`),
        bulletPoints: [
          getColumnValue(values, headers, `bulletPoint1_${lang}`),
          getColumnValue(values, headers, `bulletPoint2_${lang}`),
          getColumnValue(values, headers, `bulletPoint3_${lang}`),
          getColumnValue(values, headers, `bulletPoint4_${lang}`),
          getColumnValue(values, headers, `bulletPoint5_${lang}`),
          getColumnValue(values, headers, `bulletPoint6_${lang}`),
          getColumnValue(values, headers, `bulletPoint7_${lang}`),
          getColumnValue(values, headers, `bulletPoint8_${lang}`),
          getColumnValue(values, headers, `bulletPoint9_${lang}`)
        ].filter(b => b && b.trim()),
        description: getColumnValue(values, headers, `productDescription_${lang}`),
        keywords: getColumnValue(values, headers, `genericKeywords_${lang}`),
        // Platinum Keywords (1-5)
        platinumKeywords1: getColumnValue(values, headers, `platinumKeywords1_${lang}`),
        platinumKeywords2: getColumnValue(values, headers, `platinumKeywords2_${lang}`),
        platinumKeywords3: getColumnValue(values, headers, `platinumKeywords3_${lang}`),
        platinumKeywords4: getColumnValue(values, headers, `platinumKeywords4_${lang}`),
        platinumKeywords5: getColumnValue(values, headers, `platinumKeywords5_${lang}`),
        // Additional language-specific fields
        targetAudienceKeywords: getColumnValue(values, headers, `targetAudienceKeywords_${lang}`),
        legalDisclaimer: getColumnValue(values, headers, `legalDisclaimer_${lang}`),
        safetyWarning: getColumnValue(values, headers, `safetyWarning_${lang}`)
      };
    }
  }

  // Extract images
  product.images = {
    main: getColumnValue(values, headers, 'mainImageURL'),
    additional: [
      getColumnValue(values, headers, 'additionalImage1_URL'),
      getColumnValue(values, headers, 'additionalImage2_URL'),
      getColumnValue(values, headers, 'additionalImage3_URL'),
      getColumnValue(values, headers, 'additionalImage4_URL'),
      getColumnValue(values, headers, 'additionalImage5_URL')
    ].filter(img => img && img.trim())
  };

  // Extract variation info
  product.parentSKU = getColumnValue(values, headers, 'Parent SKU');
  product.parentASIN = getColumnValue(values, headers, 'Parent ASIN');

  // Extract model number, release date, package quantity
  product.modelNumber = getColumnValue(values, headers, 'modelNumber') || getColumnValue(values, headers, 'Model Number');
  product.releaseDate = getColumnValue(values, headers, 'releaseDate') || getColumnValue(values, headers, 'Release Date');
  product.packageQuantity = getColumnValue(values, headers, 'packageQuantity') || getColumnValue(values, headers, 'Package Quantity');

  // Extract pricing info
  const ourPrice = getColumnValue(values, headers, 'ourPrice') || getColumnValue(values, headers, 'Price');
  if (ourPrice) {
    product.pricing = {
      ourPrice: ourPrice,
      currency: getColumnValue(values, headers, 'currency') || 'EUR',
      discountedPrice: getColumnValue(values, headers, 'discountedPrice'),
      discountStartDate: getColumnValue(values, headers, 'discountStartDate'),
      discountEndDate: getColumnValue(values, headers, 'discountEndDate')
    };
  }

  // Extract inventory info
  const quantity = getColumnValue(values, headers, 'quantity') || getColumnValue(values, headers, 'Quantity');
  if (quantity) {
    product.inventory = {
      quantity: quantity,
      fulfillmentChannel: getColumnValue(values, headers, 'fulfillmentChannel') || 'DEFAULT'
    };
  }

  // Extract compliance info
  const countryOfOrigin = getColumnValue(values, headers, 'countryOfOrigin') || getColumnValue(values, headers, 'Country of Origin');
  if (countryOfOrigin) {
    product.compliance = {
      countryOfOrigin: countryOfOrigin,
      batteriesRequired: getColumnValue(values, headers, 'batteriesRequired'),
      isLithiumBattery: getColumnValue(values, headers, 'isLithiumBattery'),
      supplierDeclaredDgHzRegulation: getColumnValue(values, headers, 'supplierDeclaredDgHzRegulation'),
      adultProduct: getColumnValue(values, headers, 'adultProduct')
    };
  }

  // Extract dimensions
  const itemLength = getColumnValue(values, headers, 'itemLength') || getColumnValue(values, headers, 'Item Length');
  if (itemLength) {
    product.dimensions = {
      itemLength: itemLength,
      itemWidth: getColumnValue(values, headers, 'itemWidth') || getColumnValue(values, headers, 'Item Width'),
      itemHeight: getColumnValue(values, headers, 'itemHeight') || getColumnValue(values, headers, 'Item Height'),
      itemWeight: getColumnValue(values, headers, 'itemWeight') || getColumnValue(values, headers, 'Item Weight'),
      packageLength: getColumnValue(values, headers, 'packageLength') || getColumnValue(values, headers, 'Package Length'),
      packageWidth: getColumnValue(values, headers, 'packageWidth') || getColumnValue(values, headers, 'Package Width'),
      packageHeight: getColumnValue(values, headers, 'packageHeight') || getColumnValue(values, headers, 'Package Height'),
      packageWeight: getColumnValue(values, headers, 'packageWeight') || getColumnValue(values, headers, 'Package Weight')
    };
  }

  return product;
}

/**
 * Detect primary marketplace based on available translations
 * Priority: DE > EN (UK) > FR > IT > ES > NL > PL > SE
 */
function detectPrimaryMarketplace(productData) {
  const priority = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of priority) {
    if (productData.content[lang] && productData.content[lang].title) {
      // Map language to marketplace
      const langToMarketplace = {
        'DE': 'DE',
        'EN': 'UK',
        'FR': 'FR',
        'IT': 'IT',
        'ES': 'ES',
        'NL': 'NL',
        'PL': 'PL',
        'SE': 'SE'
      };
      return langToMarketplace[lang] || 'DE';
    }
  }

  return 'DE'; // Default to Germany
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
    content: {},

    // Non-language-specific fields
    modelNumber: getColumnValue(values, headers, 'modelNumber') || getColumnValue(values, headers, 'Model Number'),
    releaseDate: getColumnValue(values, headers, 'releaseDate') || getColumnValue(values, headers, 'Release Date'),
    packageQuantity: getColumnValue(values, headers, 'packageQuantity') || getColumnValue(values, headers, 'Package Quantity')
  };

  // Extract multi-language content
  for (const lang of activeLanguages) {
    product.content[lang] = {
      title: getColumnValue(values, headers, `Title [${lang}]`),
      brand: getColumnValue(values, headers, `Brand [${lang}]`),
      manufacturer: getColumnValue(values, headers, `Manufacturer [${lang}]`),
      bulletPoints: [
        getColumnValue(values, headers, `Bullet1 [${lang}]`),
        getColumnValue(values, headers, `Bullet2 [${lang}]`),
        getColumnValue(values, headers, `Bullet3 [${lang}]`),
        getColumnValue(values, headers, `Bullet4 [${lang}]`),
        getColumnValue(values, headers, `Bullet5 [${lang}]`),
        getColumnValue(values, headers, `Bullet6 [${lang}]`),
        getColumnValue(values, headers, `Bullet7 [${lang}]`),
        getColumnValue(values, headers, `Bullet8 [${lang}]`),
        getColumnValue(values, headers, `Bullet9 [${lang}]`)
      ].filter(b => b),
      description: getColumnValue(values, headers, `Description [${lang}]`),
      keywords: getColumnValue(values, headers, `Keywords [${lang}]`),

      // Additional keyword fields
      platinumKeywords1: getColumnValue(values, headers, `PlatinumKeywords1 [${lang}]`),
      platinumKeywords2: getColumnValue(values, headers, `PlatinumKeywords2 [${lang}]`),
      platinumKeywords3: getColumnValue(values, headers, `PlatinumKeywords3 [${lang}]`),
      platinumKeywords4: getColumnValue(values, headers, `PlatinumKeywords4 [${lang}]`),
      platinumKeywords5: getColumnValue(values, headers, `PlatinumKeywords5 [${lang}]`),
      targetAudienceKeywords: getColumnValue(values, headers, `TargetAudienceKeywords [${lang}]`),

      // EU compliance text fields
      legalDisclaimer: getColumnValue(values, headers, `LegalDisclaimer [${lang}]`),
      safetyWarning: getColumnValue(values, headers, `SafetyWarning [${lang}]`),

      aboutBrand: getColumnValue(values, headers, `About Brand [${lang}]`),
      targetAudience: getColumnValue(values, headers, `Target Audience [${lang}]`)
    };
  }

  // Extract pricing data
  const ourPrice = getColumnValue(values, headers, 'ourPrice') || getColumnValue(values, headers, 'Price');
  const discountedPrice = getColumnValue(values, headers, 'discountedPrice') || getColumnValue(values, headers, 'Discounted Price');
  if (ourPrice || discountedPrice) {
    product.pricing = {
      ourPrice: ourPrice,
      discountedPrice: discountedPrice,
      discountStartDate: getColumnValue(values, headers, 'discountStartDate'),
      discountEndDate: getColumnValue(values, headers, 'discountEndDate'),
      currency: getColumnValue(values, headers, 'currency') || 'EUR'
    };
  }

  // Extract inventory data
  const quantity = getColumnValue(values, headers, 'quantity') || getColumnValue(values, headers, 'Quantity');
  if (quantity !== undefined && quantity !== '') {
    product.inventory = {
      quantity: quantity,
      fulfillmentChannelCode: getColumnValue(values, headers, 'fulfillmentChannelCode') || 'DEFAULT',
      leadTimeToShipMaxDays: getColumnValue(values, headers, 'leadTimeToShipMaxDays') || 3
    };
  }

  // Extract EU compliance data
  const countryOfOrigin = getColumnValue(values, headers, 'countryOfOrigin') || getColumnValue(values, headers, 'Country of Origin');
  if (countryOfOrigin) {
    product.compliance = {
      countryOfOrigin: countryOfOrigin,
      batteriesRequired: getColumnValue(values, headers, 'batteriesRequired') === true || getColumnValue(values, headers, 'Batteries Required') === 'Yes',
      isLithiumBattery: getColumnValue(values, headers, 'isLithiumBattery') === true || getColumnValue(values, headers, 'Lithium Battery') === 'Yes',
      supplierDeclaredDgHzRegulation: getColumnValue(values, headers, 'supplierDeclaredDgHzRegulation'),
      adultProduct: getColumnValue(values, headers, 'adultProduct') === true || getColumnValue(values, headers, 'Adult Product') === 'Yes'
    };
  }

  // Extract dimensions
  const itemLength = getColumnValue(values, headers, 'itemLength_cm') || getColumnValue(values, headers, 'Item Length (cm)');
  if (itemLength) {
    product.dimensions = {
      itemLength: itemLength,
      itemWidth: getColumnValue(values, headers, 'itemWidth_cm') || getColumnValue(values, headers, 'Item Width (cm)'),
      itemHeight: getColumnValue(values, headers, 'itemHeight_cm') || getColumnValue(values, headers, 'Item Height (cm)'),
      itemWeight: getColumnValue(values, headers, 'itemWeight_kg') || getColumnValue(values, headers, 'Item Weight (kg)'),
      packageLength: getColumnValue(values, headers, 'packageLength_cm') || getColumnValue(values, headers, 'Package Length (cm)'),
      packageWidth: getColumnValue(values, headers, 'packageWidth_cm') || getColumnValue(values, headers, 'Package Width (cm)'),
      packageHeight: getColumnValue(values, headers, 'packageHeight_cm') || getColumnValue(values, headers, 'Package Height (cm)'),
      packageWeight: getColumnValue(values, headers, 'packageWeight_kg') || getColumnValue(values, headers, 'Package Weight (kg)')
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

    // Add optional fields if present
    if (productData.modelNumber) payload.modelNumber = productData.modelNumber;
    if (productData.releaseDate) payload.releaseDate = productData.releaseDate;
    if (productData.packageQuantity) payload.packageQuantity = productData.packageQuantity;
    if (productData.pricing) payload.pricing = productData.pricing;
    if (productData.inventory) payload.inventory = productData.inventory;
    if (productData.compliance) payload.compliance = productData.compliance;
    if (productData.dimensions) payload.dimensions = productData.dimensions;

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
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Import Pricing',
    'Enter SKU or ASIN to import pricing:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const identifier = response.getResponseText().trim();
  if (!identifier) {
    showError('No SKU or ASIN provided');
    return;
  }

  const marketplaceResponse = ui.prompt(
    'Select Marketplace',
    'Enter marketplace code (e.g., DE, FR, UK):',
    ui.ButtonSet.OK_CANCEL
  );

  if (marketplaceResponse.getSelectedButton() !== ui.Button.OK) return;

  const marketplace = marketplaceResponse.getResponseText().trim().toUpperCase();
  const marketplaceConfig = getMarketplaceConfig(marketplace);

  if (!marketplaceConfig) {
    showError(`Invalid marketplace: ${marketplace}`);
    return;
  }

  showProgress(`Importing pricing for ${identifier}...`);

  try {
    const credentials = getCredentials();
    const config = getConfig();
    const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

    // Fetch pricing using Product Pricing API
    const pricing = fetchProductPricing(identifier, marketplaceConfig, tokens.access_token);

    ui.alert(
      'Pricing Information',
      `Product: ${identifier}\n` +
      `Marketplace: ${marketplace}\n\n` +
      `List Price: ${pricing.listPrice} ${pricing.currency}\n` +
      `Current Price: ${pricing.currentPrice} ${pricing.currency}\n` +
      `Buy Box Price: ${pricing.buyBoxPrice} ${pricing.currency}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    handleError('lukoImportPricing', error);
  }
}

function lukoImportInventory() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Import Inventory',
    'Enter SKU to import inventory:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const sku = response.getResponseText().trim();
  if (!sku) {
    showError('No SKU provided');
    return;
  }

  const marketplaceResponse = ui.prompt(
    'Select Marketplace',
    'Enter marketplace code (e.g., DE, FR, UK):',
    ui.ButtonSet.OK_CANCEL
  );

  if (marketplaceResponse.getSelectedButton() !== ui.Button.OK) return;

  const marketplace = marketplaceResponse.getResponseText().trim().toUpperCase();
  const marketplaceConfig = getMarketplaceConfig(marketplace);

  if (!marketplaceConfig) {
    showError(`Invalid marketplace: ${marketplace}`);
    return;
  }

  showProgress(`Importing inventory for ${sku}...`);

  try {
    const credentials = getCredentials();
    const config = getConfig();
    const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

    // Fetch inventory using FBA Inventory API
    const inventory = fetchInventoryBySKU(sku, marketplaceConfig, tokens.access_token);

    ui.alert(
      'Inventory Information',
      `SKU: ${sku}\n` +
      `Marketplace: ${marketplace}\n\n` +
      `Available Quantity: ${inventory.quantity}\n` +
      `Fulfillment Channel: ${inventory.fulfillmentChannel}\n` +
      `Condition: ${inventory.condition}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    handleError('lukoImportInventory', error);
  }
}

function lukoImportAPlus() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Import A+ Content',
    'Enter ASIN to import A+ content:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const asin = response.getResponseText().trim();
  if (!asin) {
    showError('No ASIN provided');
    return;
  }

  const marketplaceResponse = ui.prompt(
    'Select Marketplace',
    'Enter marketplace code (e.g., DE, FR, UK):',
    ui.ButtonSet.OK_CANCEL
  );

  if (marketplaceResponse.getSelectedButton() !== ui.Button.OK) return;

  const marketplace = marketplaceResponse.getResponseText().trim().toUpperCase();
  const marketplaceConfig = getMarketplaceConfig(marketplace);

  if (!marketplaceConfig) {
    showError(`Invalid marketplace: ${marketplace}`);
    return;
  }

  showProgress(`Importing A+ content for ${asin}...`);

  try {
    const credentials = getCredentials();
    const config = getConfig();
    const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

    // Fetch A+ content using APlusContent API
    const aplusContent = fetchAPlusContent(asin, marketplaceConfig, tokens.access_token);

    if (!aplusContent || !aplusContent.contentDocument) {
      ui.alert('No A+ Content Found', `No A+ content found for ASIN ${asin} in ${marketplace}`, ui.ButtonSet.OK);
      return;
    }

    // Show summary and offer to import to sheet
    const confirmMsg = `Found A+ content for ${asin}:\n\n` +
      `Content ID: ${aplusContent.contentReferenceKey}\n` +
      `Status: ${aplusContent.status}\n` +
      `Modules: ${aplusContent.contentDocument.contentModuleList?.length || 0}\n\n` +
      `Import to APlus sheet?`;

    const confirm = ui.alert('A+ Content Found', confirmMsg, ui.ButtonSet.YES_NO);

    if (confirm === ui.Button.YES) {
      importAPlusToSheet(asin, aplusContent, marketplace);
      ui.alert('Success', 'A+ content imported to APlus-Basic sheet', ui.ButtonSet.OK);
    }

  } catch (error) {
    handleError('lukoImportAPlus', error);
  }
}

function fetchInventoryBySKU(sku, marketplaceConfig, accessToken) {
  try {
    const path = `/fba/inventory/v1/summaries`;
    const params = {
      details: true,
      granularityType: 'Marketplace',
      granularityId: marketplaceConfig.marketplaceId,
      sellerSkus: sku
    };

    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    const inventories = response.inventorySummaries || [];
    if (inventories.length > 0) {
      const inv = inventories[0];
      return {
        quantity: inv.totalQuantity || 0,
        fulfillmentChannel: inv.fulfillmentChannelCode || 'AMAZON_NA',
        condition: inv.condition || 'NewItem'
      };
    }

    return { quantity: 0, fulfillmentChannel: 'N/A', condition: 'N/A' };

  } catch (error) {
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }
}

function fetchAPlusContent(asin, marketplaceConfig, accessToken) {
  try {
    const path = `/aplus/2020-11-01/contentDocuments`;
    const params = {
      marketplaceId: marketplaceConfig.marketplaceId,
      asins: asin,
      pageSize: 10
    };

    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    const contentDocuments = response.contentMetadataRecords || [];
    if (contentDocuments.length > 0) {
      return contentDocuments[0];
    }

    return null;

  } catch (error) {
    throw new Error(`Failed to fetch A+ content: ${error.message}`);
  }
}

function importAPlusToSheet(asin, aplusContent, marketplace) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('APlus-Basic');

  if (!sheet) {
    showError('APlus-Basic sheet not found. Please generate spreadsheet first.');
    return;
  }

  // Extract content modules
  const modules = aplusContent.contentDocument?.contentModuleList || [];

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];

    sheet.appendRow([
      false, // checkbox
      asin,
      aplusContent.contentReferenceKey,
      i + 1, // module number
      module.contentModuleType || 'STANDARD_IMAGE_TEXT_OVERLAY',
      marketplace,
      '', // heading
      '', // body text
      '', // image 1
      '', // image 2
      '', // image 3
      '', // image 4
      'PENDING',
      new Date()
    ]);
  }
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

function getMarketplaceDomain(marketplace) {
  const domains = {
    'DE': 'amazon.de',
    'FR': 'amazon.fr',
    'IT': 'amazon.it',
    'ES': 'amazon.es',
    'UK': 'amazon.co.uk',
    'NL': 'amazon.nl',
    'BE': 'amazon.com.be',
    'PL': 'amazon.pl',
    'SE': 'amazon.se',
    'IE': 'amazon.ie'
  };
  return domains[marketplace] || 'amazon.de'; // Default to DE
}

function getCredentials() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.config);
  if (!sheet) {
    throw new Error('Config sheet not found. Please create Config sheet first.');
  }

  const data = sheet.getDataRange().getValues();

  // Build credentials map from Config sheet (Column A = Key, Column B = Value)
  const credentials = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      credentials[data[i][0]] = data[i][1];
    }
  }

  // Try multiple key name variations for backwards compatibility
  const lwaClientId = credentials['LWA Client ID'] || credentials['lwaClientId'] || credentials['Client ID'];
  const lwaClientSecret = credentials['LWA Client Secret'] || credentials['lwaClientSecret'] || credentials['Client Secret'];
  const refreshToken = credentials['Refresh Token'] || credentials['refreshToken'];
  const sellerId = credentials['Seller ID'] || credentials['sellerId'] || credentials['Merchant ID'];

  // Validate that all required credentials are present
  const missing = [];
  if (!lwaClientId) missing.push('LWA Client ID');
  if (!lwaClientSecret) missing.push('LWA Client Secret');
  if (!refreshToken) missing.push('Refresh Token');
  if (!sellerId) missing.push('Seller ID');

  if (missing.length > 0) {
    throw new Error(`Missing required credentials in Config sheet: ${missing.join(', ')}\n\nPlease fill in Config sheet with:\n- LWA Client ID (from Amazon SP-API)\n- LWA Client Secret (from Amazon SP-API)\n- Refresh Token (from Amazon SP-API)\n- Seller ID (your Merchant ID)`);
  }

  return {
    lwaClientId: lwaClientId,
    lwaClientSecret: lwaClientSecret,
    refreshToken: refreshToken,
    sellerId: sellerId
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
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Find column indices
  const statusCol = headers.indexOf('Status') + 1;
  const errorCol = headers.indexOf('ErrorMessage') + 1;
  const exportDateTimeCol = headers.indexOf('ExportDateTime') + 1;
  const productLinkCol = headers.indexOf('ProductLink') + 1;
  const lastModifiedCol = headers.indexOf('LastModified') + 1;
  const modifiedByCol = headers.indexOf('ModifiedBy') + 1;
  const asinCol = headers.indexOf('ASIN') + 1;

  // Convert status to spec format: SUCCESS → DONE, ERROR → FAILED
  const status = result.status === 'SUCCESS' ? 'DONE' : result.status === 'ERROR' ? 'FAILED' : result.status;

  // Update Status column
  if (statusCol > 0) {
    sheet.getRange(rowNumber, statusCol).setValue(status);
  }

  // Update ErrorMessage column (only on failure)
  if (errorCol > 0) {
    if (status === 'FAILED') {
      sheet.getRange(rowNumber, errorCol).setValue(result.message || '');
    } else {
      sheet.getRange(rowNumber, errorCol).setValue(''); // Clear error on success
    }
  }

  // Update ExportDateTime with EU format (dd.MM.yyyy HH:mm:ss)
  if (exportDateTimeCol > 0 && status === 'DONE') {
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
    sheet.getRange(rowNumber, exportDateTimeCol).setValue(dateStr);
  }

  // Auto-generate ProductLink (https://www.amazon.{domain}/dp/{ASIN})
  if (productLinkCol > 0 && asinCol > 0 && status === 'DONE') {
    const asin = values[asinCol - 1];
    const marketplace = result.marketplace || 'DE';
    const domain = getMarketplaceDomain(marketplace);

    if (asin && domain) {
      const productLink = `https://www.${domain}/dp/${asin}`;
      sheet.getRange(rowNumber, productLinkCol).setValue(productLink);
    }
  }

  // Update LastModified timestamp
  if (lastModifiedCol > 0) {
    sheet.getRange(rowNumber, lastModifiedCol).setValue(new Date());
  }

  // Update ModifiedBy with user email
  if (modifiedByCol > 0) {
    sheet.getRange(rowNumber, modifiedByCol).setValue(Session.getActiveUser().getEmail());
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

function lukoViewErrorLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const errorLogSheet = ss.getSheetByName('ErrorLog');
  if (errorLogSheet) {
    ss.setActiveSheet(errorLogSheet);
    SpreadsheetApp.getActiveSpreadsheet().toast('Viewing ErrorLog sheet', 'Success', 2);
  } else {
    const ui = SpreadsheetApp.getUi();
    ui.alert('ErrorLog sheet not found. Generate spreadsheet first.', ui.ButtonSet.OK);
  }
}

function lukoViewTemplates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const templatesSheet = ss.getSheetByName('Templates');
  if (templatesSheet) {
    ss.setActiveSheet(templatesSheet);
    SpreadsheetApp.getActiveSpreadsheet().toast('Viewing Templates sheet', 'Success', 2);
  } else {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Templates sheet not found. Generate spreadsheet first.', ui.ButtonSet.OK);
  }
}

// ========================================
// EXTENDED FEATURES - BRAND STORE WRAPPERS
// ========================================

/**
 * Wrapper functions for Brand Store page validation
 * (Each menu item calls the generic function with specific page name)
 */
function lukoValidateBrandStoreHomepage() {
  lukoValidateBrandStorePage('BrandStore-Homepage');
}

function lukoValidateBrandStorePage2() {
  lukoValidateBrandStorePage('BrandStore-Page2');
}

function lukoValidateBrandStorePage3() {
  lukoValidateBrandStorePage('BrandStore-Page3');
}
