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
  aplusBasic: 'APlusBasic',
  aplusPremium: 'APlusPremium',
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

  ui.createMenu('NetAnaliza Manager')
    .addSubMenu(ui.createMenu('👥 Client Management')
      .addItem('📋 Show Active Client', 'showActiveClientInfo')
      .addItem('🔄 Switch Active Client', 'switchActiveClient')
      .addItem('➕ Add New Client', 'addNewClient')
      .addSeparator()
      .addItem('📊 View Client Settings Sheet', 'viewClientSettings')
      .addItem('🔧 Setup Client Settings', 'generateClientSettingsSheet')
      .addItem('📥 Migrate from Old Config', 'migrateFromOldConfig'))
    .addSubMenu(ui.createMenu('🔑 SP-API Auth')
      .addItem('📖 How to Get Auth Code', 'showAuthorizationInstructions')
      .addSeparator()
      .addItem('📝 Exchange Auth Code', 'exchangeAuthorizationCode')
      .addItem('🔄 Refresh Access Token', 'refreshAccessToken'))
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
      .addSeparator()
      .addItem('📝 Publish A+ (Text Only)', 'lukoPublishAPlusTextOnly')
      .addItem('🖼️ Publish A+ (Text + Images)', 'lukoPublishAPlusWithImages')
      .addItem('🎭 Publish A+ (Text + Placeholders)', 'lukoPublishAPlusWithPlaceholders')
      .addSeparator()
      .addItem('✅ Check A+ Status', 'lukoCheckAPlusStatus')
      .addSeparator()
      .addItem('📚 Create Image Library', 'createImageLibrarySheet')
      .addItem('🔄 Sync ALL Images to Library', 'syncAllImagesToLibrary')
      .addItem('🔄 Quick Sync (first 5 docs)', 'syncImagesToLibrary')
      .addSeparator()
      .addItem('🗺️ Map Single Placeholder', 'mapSinglePlaceholder')
      .addItem('📋 Bulk Map Placeholders', 'bulkMapPlaceholders')
      .addItem('➕ Add Placeholder Manually', 'addPlaceholderToLibrary')
      .addSeparator()
      .addItem('📐 List Required Sizes', 'listRequiredPlaceholderSizes')
      .addItem('🎭 Show Placeholder Coverage', 'showPlaceholderCoverage')
      .addItem('🔧 Fix Invalid Placeholders', 'fixInvalidPlaceholders')
      .addSeparator()
      .addItem('🧪 Test New API Permissions', 'testNewAPIPermissions')
      // EXPERIMENTAL/DIAGNOSTIC FUNCTIONS - Zakomentowane bo nie działają (brak dostępu do Amazon S3 bucket)
      // Te funkcje testują endpoint S3 i Asset Library API, które zwracają 403 Forbidden
      // Zostawione w kodzie do celów diagnostycznych i dokumentacji
      // Aby aktywować: odkomentuj poniższe linie
      // .addSeparator()
      // .addItem('🧪 Test S3 Direct Upload', 'testS3DirectUpload')
      // .addItem('🧪 Search S3 Credential Endpoints', 'searchForS3CredentialEndpoints')
      // .addItem('🧪 Test Asset Library API', 'testAssetLibraryEndpoints')
      // .addItem('🧪 Test A+ Parameters', 'testAPlusDocumentParameters')
      .addSeparator()
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
      .addItem('📋 Setup Google Forms Import', 'showGoogleFormsSetupInstructions')
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
  // Use new direct SP-API call (no Cloud Function)
  return syncProductToAmazonDirect(productData, marketplace, marketplaceConfig);
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

    throw new Error(
      'Image upload via direct SP-API is not yet available in v3.0.\n' +
      'Please use Amazon Seller Central to upload images.'
    );

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
    throw new Error(
      'Video upload via direct SP-API is not yet available in v3.0.\n' +
      'Please use Amazon Seller Central to upload videos.'
    );

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

    if (!sheet) {
      showError(`Sheet "${sheetName}" not found!\n\nPlease generate the spreadsheet first:\nMenu → Tools → Generate Spreadsheet`);
      return;
    }

    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Please select A+ content to publish (check the ☑️ Export column)');
      return;
    }

    // GROUP MODULES BY ASIN
    // Each ASIN gets ONE A+ Content document with MULTIPLE modules
    const modulesByAsin = {};

    Logger.log('=== Grouping modules by ASIN ===');

    for (const row of selectedRows) {
      const aplusData = extractAPlusData(sheet, row, contentType);

      if (!modulesByAsin[aplusData.asin]) {
        modulesByAsin[aplusData.asin] = [];
        Logger.log(`Created group for ASIN: ${aplusData.asin}`);
      }

      modulesByAsin[aplusData.asin].push({
        row: row,
        data: aplusData
      });

      Logger.log(`  Added module ${aplusData.moduleNumber} (${aplusData.moduleType}) to ${aplusData.asin}`);
    }

    const asinCount = Object.keys(modulesByAsin).length;
    Logger.log(`Total ASINs: ${asinCount}`);

    showProgress(`Publishing ${asinCount} A+ Content document(s) with ${selectedRows.length} total modules...`);

    // PUBLISH EACH ASIN AS ONE A+ CONTENT WITH MULTIPLE MODULES
    const results = [];

    for (const asin in modulesByAsin) {
      const modules = modulesByAsin[asin];

      Logger.log(`\n=== Publishing ${asin} with ${modules.length} modules ===`);

      // Publish all modules for this ASIN as ONE A+ Content
      const result = publishMultiModuleAPlusContent(modules, contentType);

      results.push(result);

      // Update status for ALL rows of this ASIN
      for (const module of modules) {
        updateRowStatus(sheet, module.row, result);
      }
    }

    logOperations(results, 'ALL', `PUBLISH_APLUS_${contentType}`);
    hideProgress();

    // Enhanced summary
    let summary = `A+ Content Publishing Results\n\n`;
    summary += `✅ Published: ${asinCount} A+ Content document(s)\n`;
    summary += `📦 Total modules: ${selectedRows.length}\n\n`;
    summary += `Breakdown by ASIN:\n`;

    for (const asin in modulesByAsin) {
      const modules = modulesByAsin[asin];
      summary += `  ${asin}: ${modules.length} module(s)\n`;
    }

    ui.alert('Publishing Complete', summary, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    handleError('lukoPublishAPlus', error);
  }
}

// ========================================
// A+ CONTENT - 3 EXPORT MODES
// ========================================

/**
 * TEXT ONLY MODULES (no images required):
 * - STANDARD_TEXT
 * - STANDARD_PRODUCT_DESCRIPTION
 * - STANDARD_TECH_SPECS
 */
const TEXT_ONLY_MODULES = [
  'STANDARD_TEXT',
  'STANDARD_PRODUCT_DESCRIPTION',
  'STANDARD_TECH_SPECS'
];

/**
 * MODULES REQUIRING IMAGES:
 * All other modules that have image fields
 */
const IMAGE_MODULES = [
  'STANDARD_SINGLE_SIDE_IMAGE',
  'STANDARD_HEADER_IMAGE_TEXT',
  'STANDARD_COMPANY_LOGO',
  'STANDARD_IMAGE_TEXT_OVERLAY',
  'STANDARD_SINGLE_IMAGE_HIGHLIGHTS',
  'STANDARD_MULTIPLE_IMAGE_TEXT',
  'STANDARD_FOUR_IMAGE_TEXT',
  'STANDARD_FOUR_IMAGE_TEXT_QUADRANT',
  'STANDARD_THREE_IMAGE_TEXT',
  'STANDARD_COMPARISON_TABLE',
  'STANDARD_SINGLE_IMAGE_SPECS_DETAIL',
  'STANDARD_IMAGE_SIDEBAR'
];

/**
 * Mode 1: Publish A+ Text Only
 * Only exports modules that don't require images
 */
function lukoPublishAPlusTextOnly() {
  lukoPublishAPlusWithMode('TEXT_ONLY');
}

/**
 * Mode 2: Publish A+ with Real Images
 * Exports all modules with real uploadDestinationIds from Image Library
 */
function lukoPublishAPlusWithImages() {
  lukoPublishAPlusWithMode('WITH_IMAGES');
}

/**
 * Mode 3: Publish A+ with Placeholders
 * Exports all modules using placeholder images from library
 * Placeholders are marked with 'placeholder' in notes column of Image Library
 */
function lukoPublishAPlusWithPlaceholders() {
  lukoPublishAPlusWithMode('WITH_PLACEHOLDERS');
}

/**
 * Main A+ publish function with mode selection
 * @param {string} exportMode - 'TEXT_ONLY', 'WITH_IMAGES', or 'WITH_PLACEHOLDERS'
 */
function lukoPublishAPlusWithMode(exportMode) {
  try {
    const ui = SpreadsheetApp.getUi();

    // Mode descriptions
    const modeDescriptions = {
      'TEXT_ONLY': '📝 Tylko tekst (moduły bez obrazów)',
      'WITH_IMAGES': '🖼️ Tekst + obrazy (z prawdziwymi ID obrazów)',
      'WITH_PLACEHOLDERS': '🎭 Tekst + atrapy (z placeholder obrazami)'
    };

    const response = ui.alert(
      `Publish A+ Content - ${modeDescriptions[exportMode]}`,
      'Wybierz typ treści:\nTAK = Basic\nNIE = Premium\nANULUJ = Przerwij',
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

    if (!sheet) {
      showError(`Arkusz "${sheetName}" nie znaleziony!\n\nWygeneruj arkusz najpierw:\nMenu → Tools → Generate Spreadsheet`);
      return;
    }

    const selectedRows = getSelectedCheckboxRows(sheet);

    if (selectedRows.length === 0) {
      showError('Wybierz treści A+ do publikacji (zaznacz ☑️ Export)');
      return;
    }

    // FILTER MODULES BY EXPORT MODE
    const filteredRows = [];
    const skippedModules = [];

    for (const row of selectedRows) {
      const aplusData = extractAPlusData(sheet, row, contentType);
      const moduleType = aplusData.moduleType;

      if (exportMode === 'TEXT_ONLY') {
        // Only allow text-only modules
        if (TEXT_ONLY_MODULES.includes(moduleType)) {
          filteredRows.push(row);
        } else {
          skippedModules.push(`Row ${row}: ${moduleType} (wymaga obrazów)`);
        }
      } else {
        // For WITH_IMAGES and WITH_PLACEHOLDERS, allow all modules
        filteredRows.push(row);
      }
    }

    // Show warning if some modules were skipped
    if (exportMode === 'TEXT_ONLY' && skippedModules.length > 0) {
      const continueResponse = ui.alert(
        '⚠️ Pominięte moduły',
        `Następujące moduły zostaną pominięte (wymagają obrazów):\n\n${skippedModules.join('\n')}\n\nKontynuować z modułami tekstowymi?`,
        ui.ButtonSet.YES_NO
      );
      if (continueResponse !== ui.Button.YES) {
        return;
      }
    }

    if (filteredRows.length === 0) {
      showError('Brak modułów do eksportu po filtrowaniu.\n\nW trybie "Tylko tekst" dostępne są tylko moduły:\n- STANDARD_TEXT\n- STANDARD_PRODUCT_DESCRIPTION\n- STANDARD_TECH_SPECS');
      return;
    }

    // GROUP MODULES BY ASIN
    const modulesByAsin = {};

    Logger.log(`=== Grouping modules by ASIN (Mode: ${exportMode}) ===`);

    for (const row of filteredRows) {
      const aplusData = extractAPlusData(sheet, row, contentType);

      // For placeholder mode, inject placeholder image IDs
      if (exportMode === 'WITH_PLACEHOLDERS') {
        aplusData.usePlaceholders = true;
      }

      if (!modulesByAsin[aplusData.asin]) {
        modulesByAsin[aplusData.asin] = [];
        Logger.log(`Created group for ASIN: ${aplusData.asin}`);
      }

      modulesByAsin[aplusData.asin].push({
        row: row,
        data: aplusData
      });

      Logger.log(`  Added module ${aplusData.moduleNumber} (${aplusData.moduleType}) to ${aplusData.asin}`);
    }

    const asinCount = Object.keys(modulesByAsin).length;
    Logger.log(`Total ASINs: ${asinCount}`);

    // PREFLIGHT CHECK FOR PLACEHOLDER MODE
    if (exportMode === 'WITH_PLACEHOLDERS') {
      Logger.log('=== Preflight placeholder check ===');

      // Collect all modules for preflight
      const allModules = [];
      for (const asin in modulesByAsin) {
        allModules.push(...modulesByAsin[asin]);
      }

      const preflightReport = preflightPlaceholderCheck(allModules);

      if (!preflightReport.ready) {
        hideProgress();

        const reportMessage = formatPlaceholderReport(preflightReport);
        const continueAnyway = ui.alert(
          '⚠️ Brakujące placeholdery',
          reportMessage + '\n\nCzy kontynuować mimo to?\n(Moduły bez placeholderów mogą spowodować błąd)',
          ui.ButtonSet.YES_NO
        );

        if (continueAnyway !== ui.Button.YES) {
          Logger.log('User cancelled due to missing placeholders');
          return;
        }

        Logger.log('User chose to continue despite missing placeholders');
      } else {
        Logger.log('Preflight check passed - all placeholders available');
      }
    }

    showProgress(`Publikowanie ${asinCount} dokumentów A+ z ${filteredRows.length} modułami (tryb: ${exportMode})...`);

    // PUBLISH EACH ASIN AS ONE A+ CONTENT WITH MULTIPLE MODULES
    const results = [];

    for (const asin in modulesByAsin) {
      const modules = modulesByAsin[asin];

      Logger.log(`\n=== Publishing ${asin} with ${modules.length} modules (${exportMode}) ===`);

      // Publish all modules for this ASIN as ONE A+ Content
      const result = publishMultiModuleAPlusContent(modules, contentType, exportMode);

      results.push(result);

      // Update status for ALL rows of this ASIN
      for (const module of modules) {
        updateRowStatus(sheet, module.row, result);
      }
    }

    logOperations(results, 'ALL', `PUBLISH_APLUS_${contentType}_${exportMode}`);
    hideProgress();

    // Count successes and failures
    const successResults = results.filter(r => r.success === true);
    const failedResults = results.filter(r => r.success !== true);

    // Enhanced summary
    let summary = `A+ Content Publishing Results (${modeDescriptions[exportMode]})\n\n`;

    if (successResults.length > 0) {
      summary += `✅ Opublikowano: ${successResults.length} dokumentów A+\n`;
    }
    if (failedResults.length > 0) {
      summary += `❌ Błędy: ${failedResults.length} dokumentów\n`;
    }
    summary += `📦 Łącznie modułów: ${filteredRows.length}\n`;
    if (skippedModules.length > 0) {
      summary += `⏭️ Pominięto: ${skippedModules.length} modułów\n`;
    }
    summary += `\nRozkład wg ASIN:\n`;

    for (const asin in modulesByAsin) {
      const modules = modulesByAsin[asin];
      const asinResult = results.find(r => r.asin === asin);
      const status = asinResult?.success ? '✅' : '❌';
      summary += `  ${status} ${asin}: ${modules.length} moduł(ów)`;
      if (asinResult && !asinResult.success && asinResult.error) {
        summary += ` - ${asinResult.error.substring(0, 50)}...`;
      }
      summary += `\n`;
    }

    const dialogTitle = failedResults.length > 0 ? 'Publikowanie zakończone z błędami' : 'Publikowanie zakończone';
    ui.alert(dialogTitle, summary, ui.ButtonSet.OK);

  } catch (error) {
    hideProgress();
    handleError('lukoPublishAPlusWithMode', error);
  }
}

/**
 * Sync placeholder images from Amazon Asset Library to Image Library sheet
 * User can either:
 * 1. Enter a specific uploadDestinationId to add directly
 * 2. Enter a prefix to search for in existing A+ Content
 * 3. Leave empty to sync ALL images from A+ Content
 */
function syncPlaceholderImagesToLibrary() {
  try {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create library sheet
    let librarySheet = ss.getSheetByName('A+ Image Library');
    if (!librarySheet) {
      librarySheet = createImageLibrarySheet();
    }

    // Prompt for what to sync
    const response = ui.prompt(
      'Sync Placeholder Images',
      'Opcje:\n' +
      '1. Wklej pełny uploadDestinationId (np. "aplus-media-library-service-media/abc123.png")\n' +
      '2. Wpisz prefiks do wyszukania (np. "placeholder_")\n' +
      '3. Zostaw puste aby zsynchronizować WSZYSTKIE obrazy z A+ Content\n\n' +
      'Co chcesz zrobić?',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) {
      return;
    }

    const input = response.getResponseText().trim();

    // Check if input looks like a full uploadDestinationId
    if (input.includes('aplus-media-library-service-media/') || input.includes('/') && input.includes('.')) {
      // Direct ID - add it to library
      addDirectUploadDestinationId(librarySheet, input, ui);
      return;
    }

    // Otherwise, search through A+ Content
    const prefix = input;

    showProgress('Szukam obrazów w A+ Content...');

    // Get client and token
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();

    // Search for A+ Content documents
    const documents = searchAPlusContentDocuments(accessToken, client.marketplace);

    Logger.log(`Found ${documents.length} A+ Content documents`);

    if (documents.length === 0) {
      hideProgress();
      ui.alert('Brak dokumentów', 'Nie znaleziono żadnych A+ Content dokumentów.', ui.ButtonSet.OK);
      return;
    }

    const placeholderData = [];

    // Process each document to find images
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const contentRefKey = doc.contentReferenceKey;
      const contentType = doc.badgeSet || [];

      // Skip BRAND content (Brand Story) - API doesn't support fetching these
      if (contentType.includes('BRAND')) {
        Logger.log(`Skipping BRAND content: ${contentRefKey}`);
        continue;
      }

      showProgress(`Przetwarzam ${i + 1}/${documents.length}: ${contentRefKey}...`);

      try {
        const fullDocument = getAPlusContentDocument(contentRefKey, accessToken, client.marketplace);
        const images = extractImageIdsFromContentDocument(fullDocument);

        Logger.log(`Found ${images.length} images in ${contentRefKey}`);

        // Check if any image matches criteria
        for (const img of images) {
          let shouldAdd = false;

          if (prefix === '') {
            // Empty prefix = add ALL images
            shouldAdd = true;
          } else {
            // Check if matches prefix or placeholder indicators
            shouldAdd = img.altText?.toLowerCase().includes('placeholder') ||
                       img.altText?.toLowerCase().includes('atrapa') ||
                       img.uploadDestinationId?.includes(prefix) ||
                       img.altText?.toLowerCase().includes(prefix.toLowerCase());
          }

          if (shouldAdd) {
            placeholderData.push([
              img.uploadDestinationId,
              '', // image_url
              '', // image_hash
              img.altText || (prefix === '' ? 'SYNCED' : 'PLACEHOLDER'),
              '', // width
              '', // height
              contentRefKey,
              img.moduleType,
              new Date(),
              prefix === '' ? 'ACTIVE' : 'PLACEHOLDER',
              `Synced from ${contentRefKey}`
            ]);
          }
        }

      } catch (error) {
        Logger.log(`Error processing ${contentRefKey}: ${error.toString()}`);
        // Continue with next document
      }

      Utilities.sleep(500);
    }

    hideProgress();

    if (placeholderData.length > 0) {
      // Check for duplicates before adding
      const existingData = librarySheet.getDataRange().getValues();
      const existingIds = new Set(existingData.slice(1).map(row => row[0]));

      const newData = placeholderData.filter(row => !existingIds.has(row[0]));

      if (newData.length > 0) {
        const startRow = librarySheet.getLastRow() + 1;
        librarySheet.getRange(startRow, 1, newData.length, newData[0].length).setValues(newData);

        ui.alert(
          'Sync Complete',
          `Dodano ${newData.length} nowych obrazów do biblioteki.\n` +
          `(${placeholderData.length - newData.length} duplikatów pominięto)\n\n` +
          'Sprawdź arkusz "A+ Image Library".',
          ui.ButtonSet.OK
        );
      } else {
        ui.alert('Brak nowych', 'Wszystkie znalezione obrazy już są w bibliotece.', ui.ButtonSet.OK);
      }
    } else {
      ui.alert(
        'Brak obrazów',
        'Nie znaleziono obrazów pasujących do kryteriów.\n\n' +
        'Sprawdź czy:\n' +
        '1. Masz A+ Content z obrazami\n' +
        '2. Prefiks jest poprawny\n' +
        '3. Obrazy mają odpowiedni altText',
        ui.ButtonSet.OK
      );
    }

  } catch (error) {
    hideProgress();
    Logger.log(`Error in syncPlaceholderImagesToLibrary: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Błąd', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Add a specific uploadDestinationId directly to the Image Library
 */
function addDirectUploadDestinationId(librarySheet, uploadDestinationId, ui) {
  try {
    // Check if already exists
    const existingData = librarySheet.getDataRange().getValues();
    const existingIds = existingData.slice(1).map(row => row[0]);

    if (existingIds.includes(uploadDestinationId)) {
      ui.alert('Już istnieje', `Ten uploadDestinationId już jest w bibliotece:\n${uploadDestinationId}`, ui.ButtonSet.OK);
      return;
    }

    // Ask for additional info
    const sizeResponse = ui.prompt(
      'Rozmiar obrazu',
      'Podaj rozmiar obrazu (np. "970x600" lub "300x300"):\n\n' +
      'Popularne rozmiary:\n' +
      '• 970x600 - Header Image\n' +
      '• 300x300 - Side Image\n' +
      '• 135x135 - Icon\n' +
      '• 1464x600 - Premium Image',
      ui.ButtonSet.OK_CANCEL
    );

    if (sizeResponse.getSelectedButton() !== ui.Button.OK) {
      return;
    }

    const sizeStr = sizeResponse.getResponseText().trim();
    let width = '';
    let height = '';

    if (sizeStr.includes('x')) {
      const parts = sizeStr.split('x');
      width = parts[0].trim();
      height = parts[1].trim();
    }

    // Add to library
    const newRow = [
      uploadDestinationId,
      '', // image_url
      '', // image_hash
      'PLACEHOLDER ' + sizeStr,
      width,
      height,
      'manual',
      'MANUAL_ENTRY',
      new Date(),
      'PLACEHOLDER',
      'Manually added placeholder'
    ];

    const startRow = librarySheet.getLastRow() + 1;
    librarySheet.getRange(startRow, 1, 1, newRow.length).setValues([newRow]);

    ui.alert(
      'Dodano',
      `Placeholder dodany do biblioteki:\n${uploadDestinationId}\n\nRozmiar: ${sizeStr || '(nie podano)'}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log(`Error in addDirectUploadDestinationId: ${error.toString()}`);
    ui.alert('Błąd', error.toString(), ui.ButtonSet.OK);
  }
}

function extractAPlusData(sheet, rowNumber, contentType) {
  const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = range.getValues()[0];
  // Headers are in row 3, not row 1
  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Debug: Log first few values
  Logger.log(`Row ${rowNumber}: ${values.slice(0, 5).join(' | ')}`);
  Logger.log(`Headers (row 3): ${headers.slice(0, 5).join(' | ')}`);

  const asin = getColumnValue(values, headers, 'ASIN');
  const moduleNumber = getColumnValue(values, headers, 'Module Number');
  const moduleType = getColumnValue(values, headers, 'Module Type');

  Logger.log(`Extracted - ASIN: "${asin}", Module: "${moduleNumber}", Type: "${moduleType}"`);

  if (!asin || asin === '') {
    throw new Error(`ASIN is empty in row ${rowNumber}. Please fill in the ASIN column.`);
  }

  if (!moduleNumber || moduleNumber === '') {
    throw new Error(`Module Number is empty in row ${rowNumber}. Please fill in the Module Number column.`);
  }

  if (!moduleType || moduleType === '') {
    throw new Error(`Module Type is empty in row ${rowNumber}. Please fill in the Module Type column.`);
  }

  // Extract multi-language content for all available languages
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];
  const moduleContent = {};

  // Determine if this is a Premium module based on Module Type
  const isPremium = moduleType && moduleType.toString().toUpperCase().startsWith('PREMIUM');

  // Build prefix for this module (e.g., aplus_basic_m1_ or aplus_premium_m1_)
  const prefix = isPremium
    ? `aplus_premium_m${moduleNumber}_`
    : `aplus_basic_m${moduleNumber}_`;

  Logger.log(`Using prefix: ${prefix} (isPremium: ${isPremium})`);


  for (const lang of languages) {
    const langContent = {};

    // Extract all fields for this language
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (header && header.startsWith(prefix) && header.endsWith(`_${lang}`)) {
        // Extract field name without prefix and language suffix
        const fieldName = header.substring(prefix.length, header.length - 3);
        const value = values[i];
        if (value && value !== '') {
          langContent[fieldName] = value;
        }
      }
    }

    // Only add if there's content for this language
    if (Object.keys(langContent).length > 0) {
      moduleContent[lang] = langContent;
    }
  }

  // Extract image URLs and IDs (language-independent)
  const images = {};
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header && header.startsWith(prefix)) {
      // Match: _url, _id, _imagePositionType, _overlayColorType, etc.
      if (header.includes('_url') || header.includes('_id') ||
          header.includes('_imagePositionType') || header.includes('_overlayColorType')) {
        const fieldName = header.substring(prefix.length);
        const value = values[i];
        if (value && value !== '') {
          images[fieldName] = value;
        }
      }
    }
  }

  Logger.log(`Module content languages: ${Object.keys(moduleContent).join(', ')}`);
  Logger.log(`Images: ${Object.keys(images).join(', ')}`);

  return {
    asin: asin,
    moduleNumber: moduleNumber,
    moduleType: moduleType,
    moduleContent: moduleContent,
    images: images
  };
}

/**
 * Publish MULTIPLE modules for ONE ASIN as a SINGLE A+ Content document
 * @param {Array} modules - Array of {row, data} objects for same ASIN
 * @param {string} contentType - 'BASIC' or 'PREMIUM'
 * @param {string} exportMode - 'TEXT_ONLY', 'WITH_IMAGES', or 'WITH_PLACEHOLDERS' (optional)
 * @returns {Object} - Result object
 */
function publishMultiModuleAPlusContent(modules, contentType, exportMode) {
  try {
    const client = getActiveClient();
    const marketplace = client.marketplace || 'DE';
    const marketplaceConfig = getMarketplaceConfig(marketplace);

    if (!marketplaceConfig) {
      throw new Error(`Invalid marketplace: ${marketplace}`);
    }

    if (!modules || modules.length === 0) {
      throw new Error('No modules provided');
    }

    // All modules are for the same ASIN
    const asin = modules[0].data.asin;
    const moduleCount = modules.length;

    Logger.log(`Building multi-module A+ Content for ${asin} with ${moduleCount} modules (mode: ${exportMode || 'DEFAULT'})`);

    const accessToken = getActiveAccessToken();

    // Get first language to determine locale (all modules should use same language)
    const firstModule = modules[0].data;
    const firstLang = Object.keys(firstModule.moduleContent)[0];
    const locale = convertMarketplaceToLocale(marketplace);

    // Build content document with ALL modules
    const contentRefKey = `${asin}_complete_${Date.now()}`;

    // Detect if ANY module is Premium - then use PREMIUM contentSubType
    const hasPremiumModule = modules.some(m => m.data.moduleType && m.data.moduleType.startsWith('PREMIUM'));
    const contentSubType = hasPremiumModule ? 'PREMIUM' : 'STANDARD';

    Logger.log(`Content subtype: ${contentSubType} (hasPremiumModule: ${hasPremiumModule})`);

    const contentDocument = {
      name: contentRefKey,
      contentType: 'EBC',  // Enhanced Brand Content
      contentSubType: contentSubType,
      locale: locale,
      contentModuleList: []
    };

    // Build each module and add to contentModuleList
    for (let i = 0; i < modules.length; i++) {
      const moduleData = modules[i].data;

      // Pass export mode to module data
      if (exportMode) {
        moduleData.exportMode = exportMode;
      }

      Logger.log(`  Building module ${moduleData.moduleNumber}: ${moduleData.moduleType} (mode: ${exportMode || 'DEFAULT'})`);

      // Use existing buildAPlusContentDocumentComplete from APlusModuleBuilder.gs
      const moduleDoc = buildAPlusContentDocumentComplete(moduleData, marketplace);

      // Extract the module from the built document
      if (moduleDoc.contentModuleList && moduleDoc.contentModuleList.length > 0) {
        const module = moduleDoc.contentModuleList[0];
        contentDocument.contentModuleList.push(module);
        Logger.log(`    ✅ Added ${moduleData.moduleType} to content document`);
      } else {
        Logger.log(`    ⚠️ WARNING: Module ${moduleData.moduleNumber} produced empty contentModuleList`);
      }
    }

    Logger.log(`Content document has ${contentDocument.contentModuleList.length} modules`);

    // Create A+ Content
    const result = createAPlusContent(contentDocument, contentRefKey, marketplaceConfig, accessToken);

    return {
      asin: asin,
      moduleNumbers: modules.map(m => m.data.moduleNumber).join(', '),
      moduleCount: moduleCount,
      contentReferenceKey: contentRefKey,
      status: 'SUCCESS',
      success: true,
      message: `A+ Content with ${moduleCount} modules submitted successfully`,
      timestamp: new Date()
    };

  } catch (error) {
    Logger.log(`ERROR in publishMultiModuleAPlusContent: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);

    return {
      asin: modules[0].data.asin,
      moduleNumbers: modules.map(m => m.data.moduleNumber).join(', '),
      moduleCount: modules.length,
      status: 'ERROR',
      success: false,
      error: error.toString(),
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

/**
 * Publish SINGLE module (legacy function - kept for compatibility)
 */
function publishAPlusContent(aplusData, contentType) {
  try {
    const client = getActiveClient();
    const marketplace = client.marketplace || 'DE';
    const marketplaceConfig = getMarketplaceConfig(marketplace);

    if (!marketplaceConfig) {
      throw new Error(`Invalid marketplace: ${marketplace}`);
    }

    // Call direct SP-API function
    return publishAPlusContentDirect(aplusData, marketplace, marketplaceConfig);

  } catch (error) {
    return {
      asin: aplusData.asin,
      moduleNumber: aplusData.moduleNumber,
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
    throw new Error(
      'Coupon creation via direct SP-API is not yet available in v3.0.\n' +
      'Please use Amazon Seller Central to create coupons.'
    );

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
    throw new Error(
      'Promotion launch via direct SP-API is not yet available in v3.0.\n' +
      'Please use Amazon Seller Central to launch promotions.'
    );

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

    throw new Error(
      'Full catalog import via direct SP-API is not yet available in v3.0.\n\n' +
      'Please use:\n' +
      '• Menu → Import → Search Products by Keyword\n' +
      '• Menu → Import → Import from ASIN List\n\n' +
      'These alternatives allow you to import specific products.'
    );

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
    const config = {
      clientId: credentials.lwaClientId,
      clientSecret: credentials.lwaClientSecret
    };
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
    const config = {
      clientId: credentials.lwaClientId,
      clientSecret: credentials.lwaClientSecret
    };
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
    const config = {
      clientId: credentials.lwaClientId,
      clientSecret: credentials.lwaClientSecret
    };
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
    // A+ Content API - search for content by ASIN
    // First, try to find if this ASIN has A+ content
    const searchPath = `/aplus/2020-11-01/contentDocuments`;
    const searchParams = {
      marketplaceId: marketplaceConfig.marketplaceId,
      pageSize: 20
    };

    const searchResponse = callSPAPI('GET', searchPath, marketplaceConfig.marketplaceId, searchParams, accessToken);

    const contentRecords = searchResponse.contentMetadataRecords || [];

    // Search through records to find one that contains our ASIN
    for (const record of contentRecords) {
      const asins = record.asinMetadataSet || [];
      const hasOurAsin = asins.some(asinObj => asinObj.asin === asin);

      if (hasOurAsin) {
        Logger.log(`Found A+ content for ${asin}: ${record.contentReferenceKey}`);
        return record;
      }
    }

    // If not found in first page, ASIN might not have A+ content
    // or it's on another page (would need pagination)
    Logger.log(`No A+ content found for ${asin} in first ${contentRecords.length} records`);
    return null;

  } catch (error) {
    Logger.log(`Failed to fetch A+ content for ${asin}: ${error.message}`);
    // Don't throw - return null instead so import can continue
    return null;
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
  throw new Error(
    'Translation via Cloud Function is not available in v3.0.\n\n' +
    'Please use Google Translate or Amazon\'s translation services directly.'
  );
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
  const sheetName = sheet.getName();
  const data = sheet.getDataRange().getValues();

  // Determine header row based on sheet type
  // APlusBasic, APlusPremium use row 3 for headers
  // Other sheets use row 1
  let headerRowIndex = 0; // 0-indexed, so row 1
  let dataStartIndex = 1; // Start from row 2

  if (sheetName === 'APlusBasic' || sheetName === 'APlusPremium' || sheetName.startsWith('APlus')) {
    headerRowIndex = 2; // 0-indexed, so row 3
    dataStartIndex = 3; // Start from row 4
  }

  // Find ☑️ Export column in headers
  const headers = data[headerRowIndex] || [];
  let checkboxCol = -1;

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toString() || '';
    if (header.includes('☑️ Export') || header.includes('Export') || header === '☑️') {
      checkboxCol = i;
      break;
    }
  }

  // Fallback to column 0 if not found
  if (checkboxCol === -1) {
    checkboxCol = 0;
    Logger.log(`WARNING: ☑️ Export column not found in ${sheetName}, using column 0`);
  } else {
    Logger.log(`Found ☑️ Export column at index ${checkboxCol} in ${sheetName}`);
  }

  const selectedRows = [];
  for (let i = dataStartIndex; i < data.length; i++) {
    const cellValue = data[i][checkboxCol];

    // Check for various true values: boolean true, string 'TRUE', 'true', 'PRAWDA', checkbox value
    const isChecked = cellValue === true ||
                      cellValue === 'TRUE' ||
                      cellValue === 'true' ||
                      cellValue === 'PRAWDA' ||
                      cellValue === 1 ||
                      cellValue === '1';

    // Also check it's not 'DONE' (already exported)
    const isDone = cellValue === 'DONE' || cellValue === 'done';

    if (isChecked && !isDone) {
      selectedRows.push(i + 1); // Convert to 1-based row number
      Logger.log(`Row ${i + 1} selected (value: ${cellValue})`);
    }
  }

  Logger.log(`getSelectedCheckboxRows(${sheetName}): Found ${selectedRows.length} selected rows`);
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
  // New version: Get credentials from active client
  const client = getActiveClient();

  return {
    lwaClientId: client.lwaClientId,
    lwaClientSecret: client.lwaClientSecret,
    refreshToken: client.refreshToken,
    sellerId: client.sellerId
  };
}

// ========================================
// REMOVED: callCloudFunction
// Now using direct SP-API calls via SPApiDirect.gs
// ========================================

// Helper functions for menu actions
function viewClientSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Client Settings');

  if (!sheet) {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Client Settings Not Found',
      'Client Settings sheet does not exist.\n\nWould you like to create it now?',
      ui.ButtonSet.OK
    );
    generateClientSettingsSheet();
  } else {
    ss.setActiveSheet(sheet);
  }
}

function updateRowStatus(sheet, rowNumber, result) {
  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Find column indices
  const exportCol = headers.indexOf('☑️ Export') + 1;
  const statusCol = headers.indexOf('Status') + 1;
  const errorCol = headers.indexOf('ErrorMessage') + 1;
  const exportDateTimeCol = headers.indexOf('ExportDateTime') + 1;
  const productLinkCol = headers.indexOf('ProductLink') + 1;
  const lastModifiedCol = headers.indexOf('LastModified') + 1;
  const modifiedByCol = headers.indexOf('ModifiedBy') + 1;
  const asinCol = headers.indexOf('ASIN') + 1;
  const contentReferenceKeyCol = headers.indexOf('contentReferenceKey') + 1;

  // Convert status to spec format: SUCCESS → DONE, ERROR → FAILED
  const status = result.status === 'SUCCESS' ? 'DONE' : result.status === 'ERROR' ? 'FAILED' : result.status;

  // Update ☑️ Export column: TRUE → DONE on success, keep TRUE on failure
  // This replaces the checkbox with "DONE" text after successful export
  if (exportCol > 0) {
    if (status === 'DONE') {
      sheet.getRange(rowNumber, exportCol).setValue('DONE');
    } else if (status === 'FAILED') {
      // Keep checkbox checked on failure so user can retry
      sheet.getRange(rowNumber, exportCol).setValue(true);
    }
  }

  // Update Status column - include client info (for logging/tracking purposes)
  if (statusCol > 0) {
    let statusText = status;
    if (result.clientName && result.sellerId) {
      statusText = `${status} [${result.clientName} - ${result.sellerId}]`;
    }
    sheet.getRange(rowNumber, statusCol).setValue(statusText);
  }

  // Update ErrorMessage column (only on failure)
  if (errorCol > 0) {
    if (status === 'FAILED') {
      let errorMsg = result.message || '';
      if (result.clientName) {
        errorMsg = `[${result.clientName}] ${errorMsg}`;
      }
      sheet.getRange(rowNumber, errorCol).setValue(errorMsg);
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

  // Update contentReferenceKey (for A+ Content)
  if (contentReferenceKeyCol > 0 && result.contentReferenceKey && status === 'DONE') {
    sheet.getRange(rowNumber, contentReferenceKeyCol).setValue(result.contentReferenceKey);
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
    const modifiedBy = Session.getActiveUser().getEmail();
    let modifiedByText = modifiedBy;
    if (result.clientName) {
      modifiedByText = `${modifiedBy} [Client: ${result.clientName}]`;
    }
    sheet.getRange(rowNumber, modifiedByCol).setValue(modifiedByText);
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
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Processing...', 5);
}

function hideProgress() {
  SpreadsheetApp.getActiveSpreadsheet().toast('');
}

function showError(message) {
  SpreadsheetApp.getUi().alert('Error', message, SpreadsheetApp.getUi().ButtonSet.OK);
  hideProgress();
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
