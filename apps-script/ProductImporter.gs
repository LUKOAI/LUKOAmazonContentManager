/**
 * LUKO Amazon Product Importer & API Tester
 * Comprehensive product import functionality with API testing
 *
 * Features:
 * - Test API connection
 * - Import products by ASIN (single or batch)
 * - Search products by keywords
 * - Import product details with ALL available fields
 * - Fetch seller information
 * - Duplicate check: ASIN + Marketplace (same ASIN in different marketplace = new row)
 */

// ========================================
// API CONNECTION TEST
// ========================================

/**
 * Test SP-API connection and credentials
 * Displays detailed diagnostic information
 */
function lukoTestAPIConnection() {
  const ui = SpreadsheetApp.getUi();

  ui.alert('Testing API Connection', 'Testing SP-API credentials and connectivity...\n\nThis may take a few seconds.', ui.ButtonSet.OK);

  try {
    // Step 1: Check credentials
    const testResults = {
      configCheck: '❌',
      tokenRefresh: '❌',
      apiCall: '❌',
      marketplace: '',
      sellerId: '',
      responseTime: 0
    };

    // Check Config sheet
    try {
      const credentials = getCredentials();
      testResults.configCheck = '✅';
      testResults.sellerId = credentials.sellerId || 'N/A';
    } catch (error) {
      throw new Error(`Config Check Failed: ${error.message}`);
    }

    // Test token refresh
    const startTime = new Date().getTime();
    try {
      const config = getConfig();
      const refreshToken = getCredentials().refreshToken;
      const tokens = getAccessTokenFromRefresh(refreshToken, config);
      testResults.tokenRefresh = '✅';

      // Test actual API call (simple search to verify API works)
      testResults.marketplace = 'A1PA6795UKMFR9'; // DE marketplace

      // Use search instead of specific ASIN to avoid "not found" errors
      const apiResult = callSPAPI(
        'GET',
        '/catalog/2022-04-01/items',
        testResults.marketplace,
        {
          marketplaceIds: testResults.marketplace,
          keywords: 'laptop',
          pageSize: 1
        },
        tokens.access_token
      );

      testResults.apiCall = '✅';
      testResults.responseTime = new Date().getTime() - startTime;

    } catch (error) {
      if (error.message.includes('Token refresh failed')) {
        throw new Error(`Token Refresh Failed: ${error.message}`);
      } else {
        throw new Error(`API Call Failed: ${error.message}`);
      }
    }

    // Show success dialog
    ui.alert(
      '✅ API Connection Successful!',
      `Configuration: ${testResults.configCheck}\n` +
      `Token Refresh: ${testResults.tokenRefresh}\n` +
      `API Call: ${testResults.apiCall}\n\n` +
      `Seller ID: ${testResults.sellerId}\n` +
      `Marketplace: ${testResults.marketplace}\n` +
      `Response Time: ${testResults.responseTime}ms\n\n` +
      `Your SP-API connection is working correctly!`,
      ui.ButtonSet.OK
    );

    // Log test results
    logAPITest(testResults, 'SUCCESS');

  } catch (error) {
    ui.alert(
      '❌ API Connection Failed',
      `Error: ${error.message}\n\n` +
      `Please check:\n` +
      `1. Config sheet has all required credentials\n` +
      `2. LWA Client ID and Secret are correct\n` +
      `3. Refresh Token is valid\n` +
      `4. Seller ID is correct\n\n` +
      `See Logs sheet for details.`,
      ui.ButtonSet.OK
    );

    logAPITest({error: error.message}, 'FAILED');
    Logger.log(`API Test Failed: ${error.message}`);
  }
}

/**
 * Call SP-API with proper authentication
 */
function callSPAPI(method, path, marketplaceId, params, accessToken) {
  const marketplaceConfig = MARKETPLACE_LANGUAGES['DE']; // Default to DE
  const endpoint = marketplaceConfig.endpoint;

  let url = endpoint + path;

  // Add query parameters
  if (Object.keys(params).length > 0) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    url += '?' + queryString;
  }

  const options = {
    method: method.toLowerCase(),
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  Logger.log(`Calling SP-API: ${method} ${url}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    let errorMessage = `SP-API Error ${responseCode}`;
    try {
      const error = JSON.parse(responseBody);
      errorMessage = error.errors?.[0]?.message || error.message || errorMessage;
    } catch (e) {
      errorMessage = responseBody;
    }
    throw new Error(errorMessage);
  }

  return JSON.parse(responseBody);
}

function logAPITest(results, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logsSheet = ss.getSheetByName('Logs');

  if (!logsSheet) return;

  logsSheet.appendRow([
    new Date(),
    Session.getActiveUser().getEmail(),
    'ALL',
    '',
    '',
    'API_CONNECTION_TEST',
    JSON.stringify(results).substring(0, 500),
    status,
    '',
    status === 'SUCCESS' ? 'API connection test passed' : results.error || 'API connection test failed'
  ]);
}

// ========================================
// IMPORT BY ASIN
// ========================================

/**
 * Import product(s) by ASIN
 * Supports single ASIN or comma-separated list
 */
function lukoImportByASIN() {
  const ui = SpreadsheetApp.getUi();

  // Prompt for ASIN(s)
  const response = ui.prompt(
    'Import Products by ASIN',
    'Enter ASIN(s) to import:\n\n' +
    'Single: B08N5WRWNW\n' +
    'Multiple: B08N5WRWNW, B07XJ8C8F5, B09PMHKQXR\n\n' +
    'Separate multiple ASINs with commas.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const input = response.getResponseText().trim();
  if (!input) {
    showError('No ASIN provided');
    return;
  }

  // Parse ASINs
  const asins = input.split(',').map(asin => asin.trim()).filter(asin => asin.length > 0);

  if (asins.length === 0) {
    showError('No valid ASINs found');
    return;
  }

  // Ask for marketplace using dropdown
  const marketplace = showMarketplaceDropdown();
  if (!marketplace) return; // User cancelled

  const marketplaceConfig = getMarketplaceConfig(marketplace);

  // Ask about A+ checking (it's slow!)
  const aplusConfirm = ui.alert(
    'Sprawdzanie A+ Content',
    'Czy sprawdzać A+ Content?\n\n' +
    '⚠️ Spowalnia import (~2 sek/produkt)\n' +
    'A+ działa tylko dla produktów TWOJEJ marki.\n\n' +
    'Tak = Sprawdzaj A+\n' +
    'Nie = Pomiń A+ (szybciej)',
    ui.ButtonSet.YES_NO
  );

  const skipAPlus = (aplusConfirm !== ui.Button.YES);

  // Confirm import
  const confirmMsg = `Zaimportować ${asins.length} produkt(ów) z Amazon ${marketplace}?\n\n` +
    `ASIN: ${asins.slice(0, 5).join(', ')}${asins.length > 5 ? '...' : ''}\n\n` +
    `A+ Content: ${skipAPlus ? 'POMINIĘTE' : 'SPRAWDZANE'}\n` +
    `Duplikaty: Pomijane automatycznie (ASIN + Marketplace)`;

  const confirm = ui.alert('Potwierdź import', confirmMsg, ui.ButtonSet.YES_NO);

  if (confirm !== ui.Button.YES) return;

  // Import products
  showProgress(`Importuję ${asins.length} produktów z Amazon ${marketplace}...`);

  try {
    const results = importProductsByASIN(asins, marketplace, marketplaceConfig, { skipAPlus });

    // Show results
    let resultMsg = `✅ Zaimportowano: ${results.success}\n` +
      `❌ Błędy: ${results.failed}\n` +
      `⚠️ Ostrzeżenia: ${results.warnings}`;

    if (results.skipped > 0) {
      resultMsg += `\n⏭️ Pominięte (duplikaty ASIN+${marketplace}): ${results.skipped}`;
    }

    if (results.autoResumeScheduled) {
      resultMsg += `\n\n⏳ POZOSTAŁO: ${results.remaining} produktów`;
      resultMsg += `\n🔄 Auto-wznowienie za 1 minutę...`;
      resultMsg += `\n\n(Możesz zamknąć arkusz - import będzie kontynuowany automatycznie)`;
    }

    if (results.message) {
      resultMsg += `\n\n${results.message}`;
    }

    // Use toast instead of alert to avoid blocking the script execution
    const title = results.autoResumeScheduled ? 'Import w toku...' : 'Import zakończony';
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, title, 30);
    Logger.log(`[IMPORT] ${title}: ${resultMsg.replace(/\n/g, ' | ')}`);

  } catch (error) {
    handleError('lukoImportByASIN', error);
  }
}

function importProductsByASIN(asins, marketplace, marketplaceConfig, options = {}) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ImportedProducts');

  if (!sheet) {
    // Create ImportedProducts sheet if it doesn't exist
    sheet = generateImportedProductsSheet(ss);
  }

  const credentials = getCredentials();
  const config = getConfig();
  const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

  // Options with defaults
  const skipAPlus = options.skipAPlus || false;
  const skipExisting = options.skipExisting !== false; // default true
  const isAutoResume = options.isAutoResume || false;

  // ============================================================
  // DUPLICATE CHECK: ASIN + Marketplace (FIX)
  // Same ASIN in different marketplace = allowed (new row)
  // Same ASIN in same marketplace = skipped (duplicate)
  // ============================================================
  let existingAsinMarketplace = new Set();
  if (skipExisting) {
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    const marketplaceCol = 3; // Column D (0-indexed = 3) is Marketplace
    const asinCol = 4;        // Column E (0-indexed = 4) is ASIN
    for (let i = 1; i < data.length; i++) { // Skip header
      if (data[i][asinCol]) {
        const asinValue = data[i][asinCol].toString().trim();
        const mpValue = (data[i][marketplaceCol] || '').toString().trim().toUpperCase();
        const key = `${asinValue}|${mpValue}`;
        existingAsinMarketplace.add(key);
      }
    }
    Logger.log(`[IMPORT] Found ${existingAsinMarketplace.size} existing ASIN+Marketplace pairs in sheet`);
  }

  // Filter out already imported ASINs for THIS marketplace
  const asinsToImport = asins.filter(asin => !existingAsinMarketplace.has(`${asin}|${marketplace}`));
  const skippedCount = asins.length - asinsToImport.length;

  if (skippedCount > 0) {
    Logger.log(`[IMPORT] Skipping ${skippedCount} already imported ASINs for marketplace ${marketplace}`);
    if (!isAutoResume) showProgress(`Pomijam ${skippedCount} już zaimportowanych ASIN dla ${marketplace}...`);
  }

  if (asinsToImport.length === 0) {
    clearImportState(); // Clear any pending auto-resume
    return { success: 0, failed: 0, warnings: 0, skipped: skippedCount, message: `Wszystkie ASIN-y już zaimportowane dla ${marketplace}!` };
  }

  // Pre-fetch A+ content list ONCE if A+ checking is enabled
  let aplusCache = null;
  if (!skipAPlus) {
    try {
      if (!isAutoResume) showProgress('Pobieranie listy A+ Content (jednorazowo)...');
      aplusCache = fetchAPlusContentList(marketplaceConfig, tokens.access_token);
      Logger.log(`[IMPORT] A+ cache loaded with ${aplusCache.allRecords.length} documents and ${Object.keys(aplusCache.asinToContent).length} ASIN mappings`);
    } catch (e) {
      Logger.log(`[IMPORT] Could not pre-fetch A+ content list: ${e.message}`);
      aplusCache = { allRecords: [], asinToContent: {} };
    }
  }

  let success = 0;
  let failed = 0;
  let warnings = 0;
  const startTime = new Date().getTime();
  const maxExecutionTime = 4.5 * 60 * 1000; // 4.5 minutes (safe for both 6min and 30min accounts)

  for (let i = 0; i < asinsToImport.length; i++) {
    const asin = asinsToImport[i];

    // Check if we're running out of time
    const elapsed = new Date().getTime() - startTime;
    if (elapsed > maxExecutionTime) {
      const remainingAsins = asinsToImport.slice(i);
      Logger.log(`[IMPORT] Timeout after ${Math.round(elapsed/1000)}s. ${remainingAsins.length} ASINs remaining. Scheduling auto-resume...`);

      // Schedule automatic continuation
      scheduleImportContinuation(remainingAsins, marketplace, { skipAPlus });
      showProgress(`Timeout! Zaimportowano ${success}. Auto-wznowienie za 1 min (pozostało: ${remainingAsins.length})...`);

      return { success, failed, warnings, skipped: skippedCount, autoResumeScheduled: true, remaining: remainingAsins.length };
    }

    try {
      showProgress(`Pobieram ${asin}... (${success + failed + 1}/${asinsToImport.length})`);

      // Fetch product data from SP-API
      const productData = fetchProductByASIN(asin, marketplaceConfig, tokens.access_token);

      // Rate limiting: wait 300ms between product fetches
      Utilities.sleep(300);

      // Fetch seller information (may fail due to permissions - that's OK)
      try {
        const sellerInfo = fetchSellerByASIN(asin, marketplaceConfig, tokens.access_token);
        productData.sellerId = sellerInfo.sellerId || '';
        productData.sellerName = sellerInfo.sellerName || '';
      } catch (e) {
        Logger.log(`Could not fetch seller info for ${asin}: ${e.message}`);
        productData.sellerId = '';
        productData.sellerName = '';
      }

      // Rate limiting: wait 200ms
      Utilities.sleep(200);

      // Fetch pricing (may hit rate limits - that's OK)
      try {
        const pricing = fetchProductPricing(asin, marketplaceConfig, tokens.access_token);
        productData.listPrice = pricing.listPrice || productData.catalogListPrice || '';
        productData.currentPrice = pricing.currentPrice || '';
        productData.currency = pricing.currency || productData.catalogCurrency || '';
      } catch (e) {
        Logger.log(`Could not fetch pricing for ${asin}: ${e.message}`);
        productData.listPrice = productData.catalogListPrice || '';
        productData.currentPrice = '';
        productData.currency = productData.catalogCurrency || '';
        warnings++;
      }

      // A+ Content - use cache if available, skip if disabled
      if (!skipAPlus && aplusCache) {
        const aplusData = getAPlusFromCache(asin, aplusCache, marketplaceConfig, tokens.access_token);
        productData.hasAPlus = aplusData.hasAPlus || false;
        productData.aplusType = aplusData.aplusType || '';
        productData.aplusStatus = aplusData.aplusStatus || '';
        productData.aplusContentId = aplusData.aplusContentId || '';
        productData.aplusName = aplusData.aplusName || '';
        productData.aplusModuleCount = aplusData.aplusModuleCount || 0;
        productData.aplusModuleTypes = aplusData.aplusModuleTypes || '';
        productData.aplusHeadline = aplusData.aplusHeadline || '';
        productData.aplusText1 = aplusData.aplusText1 || '';
        productData.aplusText2 = aplusData.aplusText2 || '';
        productData.aplusText3 = aplusData.aplusText3 || '';
        productData.aplusImageUrl1 = aplusData.aplusImageUrl1 || '';
        productData.aplusImageUrl2 = aplusData.aplusImageUrl2 || '';
        productData.aplusImageUrl3 = aplusData.aplusImageUrl3 || '';
        productData.aplusImageUrl4 = aplusData.aplusImageUrl4 || '';
        productData.hasBrandStory = aplusData.hasBrandStory || false;
        productData.brandStoryHeadline = aplusData.brandStoryHeadline || '';
        productData.brandStoryText = aplusData.brandStoryText || '';
        productData.brandStoryImageUrl = aplusData.brandStoryImageUrl || '';
      } else {
        // A+ skipped - mark as not checked
        productData.hasAPlus = null; // Will show "Nie sprawdzono"
        productData.aplusType = '';
        productData.aplusStatus = '';
        productData.aplusContentId = '';
        productData.aplusName = '';
        productData.aplusModuleCount = '';
        productData.aplusModuleTypes = '';
        productData.aplusHeadline = '';
        productData.aplusText1 = '';
        productData.aplusText2 = '';
        productData.aplusText3 = '';
        productData.aplusImageUrl1 = '';
        productData.aplusImageUrl2 = '';
        productData.aplusImageUrl3 = '';
        productData.aplusImageUrl4 = '';
        productData.hasBrandStory = null;
        productData.brandStoryHeadline = '';
        productData.brandStoryText = '';
        productData.brandStoryImageUrl = '';
      }

      // Add to sheet
      appendProductToImportedSheet(sheet, productData, marketplace);
      success++;

    } catch (error) {
      Logger.log(`Failed to import ${asin}: ${error.message}`);
      failed++;

      // Log error
      try {
        logOperations([{
          asin: asin,
          marketplace: marketplace,
          status: 'ERROR',
          message: error.message
        }], marketplace, 'IMPORT_BY_ASIN');
      } catch (logError) {
        Logger.log(`Could not log error: ${logError.message}`);
      }
    }

    // Rate limiting between products: wait 500ms
    Utilities.sleep(500);
  }

  // All done - clear any pending auto-resume state
  clearImportState();

  return { success, failed, warnings, skipped: skippedCount };
}

// ========================================
// AUTO-RESUME FUNCTIONS
// ========================================

/**
 * Schedule automatic continuation of import after timeout
 */
function scheduleImportContinuation(remainingAsins, marketplace, options) {
  const props = PropertiesService.getScriptProperties();

  // Save state for continuation
  const state = {
    asins: remainingAsins,
    marketplace: marketplace,
    options: options,
    scheduledAt: new Date().toISOString()
  };

  props.setProperty('IMPORT_RESUME_STATE', JSON.stringify(state));
  Logger.log(`[AUTO-RESUME] Saved state with ${remainingAsins.length} ASINs`);

  // Delete any existing triggers first
  deleteImportTriggers();

  // Create a new trigger to run in 1 minute
  ScriptApp.newTrigger('autoResumeImport')
    .timeBased()
    .after(60 * 1000) // 1 minute
    .create();

  Logger.log(`[AUTO-RESUME] Trigger scheduled for 1 minute from now`);
}

/**
 * Auto-resume function called by trigger
 */
function autoResumeImport() {
  Logger.log(`[AUTO-RESUME] Trigger fired - resuming import...`);

  const props = PropertiesService.getScriptProperties();
  const stateJson = props.getProperty('IMPORT_RESUME_STATE');

  if (!stateJson) {
    Logger.log(`[AUTO-RESUME] No saved state found. Nothing to resume.`);
    deleteImportTriggers();
    return;
  }

  try {
    const state = JSON.parse(stateJson);
    Logger.log(`[AUTO-RESUME] Resuming with ${state.asins.length} ASINs for marketplace ${state.marketplace}`);

    const marketplaceConfig = getMarketplaceConfig(state.marketplace);
    if (!marketplaceConfig) {
      Logger.log(`[AUTO-RESUME] Invalid marketplace: ${state.marketplace}`);
      clearImportState();
      return;
    }

    // Show toast notification
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Auto-wznowienie: ${state.asins.length} ASIN-ów do zaimportowania...`,
        'Import kontynuowany',
        10
      );
    } catch (e) {
      // Toast may fail if no active user
    }

    // Resume import with isAutoResume flag
    const options = state.options || {};
    options.isAutoResume = true;

    const results = importProductsByASIN(state.asins, state.marketplace, marketplaceConfig, options);

    Logger.log(`[AUTO-RESUME] Batch complete: ${results.success} success, ${results.failed} failed`);

    if (results.autoResumeScheduled) {
      Logger.log(`[AUTO-RESUME] Another batch scheduled`);
    } else {
      Logger.log(`[AUTO-RESUME] Import fully completed!`);

      // Show completion notification
      try {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `Import zakończony! ${results.success} produktów zaimportowanych.`,
          'Sukces!',
          10
        );
      } catch (e) {
        // Toast may fail
      }
    }

  } catch (error) {
    Logger.log(`[AUTO-RESUME] Error: ${error.message}`);
    clearImportState();
  }
}

/**
 * Clear saved import state and triggers
 */
function clearImportState() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('IMPORT_RESUME_STATE');
  deleteImportTriggers();
  Logger.log(`[AUTO-RESUME] State cleared`);
}

/**
 * Delete all import-related triggers
 */
function deleteImportTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'autoResumeImport') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`[AUTO-RESUME] Deleted trigger: ${trigger.getUniqueId()}`);
    }
  }
}

/**
 * Manual function to cancel any pending auto-resume
 */
function lukoCancelAutoResume() {
  clearImportState();
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto-wznowienie anulowane.', 'Anulowano', 5);
  Logger.log(`[AUTO-RESUME] Manually cancelled by user`);
}

function fetchProductByASIN(asin, marketplaceConfig, accessToken) {
  const path = `/catalog/2022-04-01/items/${asin}`;
  const params = {
    marketplaceIds: marketplaceConfig.marketplaceId,
    includedData: 'attributes,images,productTypes,salesRanks,summaries,dimensions,identifiers,relationships,classifications'
  };

  const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

  // Extract product data
  const item = response;
  const attributes = item.attributes || {};
  const summaries = item.summaries || [];
  const images = item.images || [];
  const dimensions = item.dimensions || [];
  const identifiers = item.identifiers || [];
  const salesRanks = item.salesRanks || [];
  const relationships = item.relationships || [];
  const classifications = item.classifications || [];

  const summary = summaries[0] || {};

  // Helper function to get attribute value
  const getAttr = (name) => attributes[name]?.[0]?.value || '';
  const getAttrArray = (name) => (attributes[name] || []).map(a => a.value).filter(v => v);
  const getAttrWithLanguage = (name, lang) => {
    const attrs = attributes[name] || [];
    const found = attrs.find(a => a.language_tag === lang || a.marketplace_id === marketplaceConfig.marketplaceId);
    return found?.value || attrs[0]?.value || '';
  };

  // DEBUG: Log available attributes to help diagnose missing fields
  const attrKeys = Object.keys(attributes);
  Logger.log(`[FETCH DEBUG] ASIN: ${asin}`);
  Logger.log(`[FETCH DEBUG] Available attributes (${attrKeys.length}): ${attrKeys.join(', ')}`);

  // Log specific attributes we're interested in
  if (attributes.product_description) {
    Logger.log(`[FETCH DEBUG] product_description: ${JSON.stringify(attributes.product_description).substring(0, 200)}`);
  }
  if (attributes.list_price) {
    Logger.log(`[FETCH DEBUG] list_price: ${JSON.stringify(attributes.list_price)}`);
  }
  if (attributes.product_site_launch_date) {
    Logger.log(`[FETCH DEBUG] product_site_launch_date: ${JSON.stringify(attributes.product_site_launch_date)}`);
  }

  // Extract list_price from attributes (more reliable than Pricing API)
  let catalogListPrice = '';
  let catalogCurrency = '';
  if (attributes.list_price && attributes.list_price[0]) {
    const priceData = attributes.list_price[0];
    if (priceData.value_with_tax !== undefined) {
      const rawValue = priceData.value_with_tax;
      if (Number.isInteger(rawValue) && rawValue > 100) {
        catalogListPrice = (rawValue / 100).toFixed(2);
      } else {
        catalogListPrice = parseFloat(rawValue).toFixed(2);
      }
    } else if (priceData.value) {
      catalogListPrice = priceData.value;
    }
    catalogCurrency = priceData.currency || 'EUR';
    Logger.log(`[FETCH DEBUG] Extracted list_price from catalog: ${catalogListPrice} ${catalogCurrency}`);
  }

  // Extract first available date from product_site_launch_date
  let firstAvailableFromCatalog = '';
  if (attributes.product_site_launch_date && attributes.product_site_launch_date[0]) {
    firstAvailableFromCatalog = attributes.product_site_launch_date[0].value || '';
    Logger.log(`[FETCH DEBUG] Extracted launch date: ${firstAvailableFromCatalog}`);
  }

  // Extract identifiers (EAN, UPC, ISBN, GTIN, etc.)
  const identifiersData = {};
  for (const idGroup of identifiers) {
    if (idGroup.marketplaceId === marketplaceConfig.marketplaceId) {
      const ids = idGroup.identifiers || [];
      for (const id of ids) {
        if (id.identifierType === 'EAN') identifiersData.ean = id.identifier;
        if (id.identifierType === 'UPC') identifiersData.upc = id.identifier;
        if (id.identifierType === 'ISBN') identifiersData.isbn = id.identifier;
        if (id.identifierType === 'GTIN') identifiersData.gtin = id.identifier;
        if (id.identifierType === 'ASIN') identifiersData.asinIdentifier = id.identifier;
        if (id.identifierType === 'GCID') identifiersData.gcid = id.identifier;
        if (id.identifierType === 'MINSAN') identifiersData.minsan = id.identifier;
        if (id.identifierType === 'PZN') identifiersData.pzn = id.identifier;
      }
      break;
    }
  }

  // Extract dimensions from dimensions array (if available)
  const dimensionsData = {};
  for (const dim of dimensions) {
    if (dim.marketplaceId === marketplaceConfig.marketplaceId) {
      const itemDims = dim.item || {};
      const packageDims = dim.package || {};

      dimensionsData.itemLength = itemDims.length?.value || '';
      dimensionsData.itemLengthUnit = itemDims.length?.unit || '';
      dimensionsData.itemWidth = itemDims.width?.value || '';
      dimensionsData.itemWidthUnit = itemDims.width?.unit || '';
      dimensionsData.itemHeight = itemDims.height?.value || '';
      dimensionsData.itemHeightUnit = itemDims.height?.unit || '';
      dimensionsData.itemWeight = itemDims.weight?.value || '';
      dimensionsData.itemWeightUnit = itemDims.weight?.unit || '';

      dimensionsData.packageLength = packageDims.length?.value || '';
      dimensionsData.packageLengthUnit = packageDims.length?.unit || '';
      dimensionsData.packageWidth = packageDims.width?.value || '';
      dimensionsData.packageWidthUnit = packageDims.width?.unit || '';
      dimensionsData.packageHeight = packageDims.height?.value || '';
      dimensionsData.packageHeightUnit = packageDims.height?.unit || '';
      dimensionsData.packageWeight = packageDims.weight?.value || '';
      dimensionsData.packageWeightUnit = packageDims.weight?.unit || '';
      break;
    }
  }

  // Extract sales ranks
  const salesRanksData = {};
  for (const rankGroup of salesRanks) {
    if (rankGroup.marketplaceId === marketplaceConfig.marketplaceId) {
      const classRanks = rankGroup.classificationRanks || [];
      if (classRanks.length > 0) {
        salesRanksData.salesRank1 = classRanks[0]?.rank || '';
        salesRanksData.salesRank1Title = classRanks[0]?.title || '';
        salesRanksData.salesRank1Link = classRanks[0]?.link || '';
        if (classRanks.length > 1) {
          salesRanksData.salesRank2 = classRanks[1]?.rank || '';
          salesRanksData.salesRank2Title = classRanks[1]?.title || '';
        }
        if (classRanks.length > 2) {
          salesRanksData.salesRank3 = classRanks[2]?.rank || '';
          salesRanksData.salesRank3Title = classRanks[2]?.title || '';
        }
      }

      const displayRanks = rankGroup.displayGroupRanks || [];
      if (displayRanks.length > 0) {
        salesRanksData.displayGroupRank = displayRanks[0]?.rank || '';
        salesRanksData.displayGroupTitle = displayRanks[0]?.title || '';
        salesRanksData.displayGroupLink = displayRanks[0]?.link || '';
      }
      break;
    }
  }

  // Extract relationships (parent/child, variations)
  const relationshipsData = {};
  for (const relGroup of relationships) {
    if (relGroup.marketplaceId === marketplaceConfig.marketplaceId) {
      const rels = relGroup.relationships || [];

      const parentRel = rels.find(r => r.type === 'VARIATION' && r.parentAsins);
      if (parentRel && parentRel.parentAsins?.length > 0) {
        relationshipsData.parentAsin = parentRel.parentAsins[0];
      }

      const childRels = rels.filter(r => r.type === 'VARIATION' && r.childAsins);
      if (childRels.length > 0) {
        const allChildAsins = childRels.flatMap(r => r.childAsins || []);
        relationshipsData.childAsins = allChildAsins.slice(0, 10).join(', ');
        relationshipsData.childCount = allChildAsins.length;
      }

      const variationRel = rels.find(r => r.variationTheme);
      if (variationRel) {
        relationshipsData.variationTheme = variationRel.variationTheme.attributes?.join(', ') || '';
      }
      break;
    }
  }

  // Extract classifications (browse nodes)
  const classificationsData = {};
  for (const classGroup of classifications) {
    if (classGroup.marketplaceId === marketplaceConfig.marketplaceId) {
      const nodes = classGroup.classifications || [];
      if (nodes.length > 0) {
        classificationsData.browseNodeId = nodes[0]?.classificationId || '';
        classificationsData.browseNodeName = nodes[0]?.displayName || '';

        const categoryPath = nodes.map(n => n.displayName).join(' > ');
        classificationsData.categoryPath = categoryPath;

        if (nodes.length > 1) {
          classificationsData.browseNode2Id = nodes[1]?.classificationId || '';
          classificationsData.browseNode2Name = nodes[1]?.displayName || '';
        }
        if (nodes.length > 2) {
          classificationsData.browseNode3Id = nodes[2]?.classificationId || '';
          classificationsData.browseNode3Name = nodes[2]?.displayName || '';
        }
      }
      break;
    }
  }

  // Extract all images with variants
  const imagesData = {};
  const imageGroup = images[0]?.images || [];
  imagesData.mainImageURL = imageGroup.find(i => i.variant === 'MAIN')?.link || imageGroup[0]?.link || '';
  imagesData.mainImageHeight = imageGroup.find(i => i.variant === 'MAIN')?.height || '';
  imagesData.mainImageWidth = imageGroup.find(i => i.variant === 'MAIN')?.width || '';

  const additionalImages = imageGroup.filter(i => i.variant !== 'MAIN');
  for (let i = 0; i < 8; i++) {
    imagesData[`additionalImage${i + 1}`] = additionalImages[i]?.link || '';
    imagesData[`additionalImage${i + 1}Variant`] = additionalImages[i]?.variant || '';
  }

  imagesData.totalImageCount = imageGroup.length;

  return {
    asin: asin,
    sku: getAttr('sku'),
    title: summary.itemName || getAttr('item_name'),
    brand: summary.brand || getAttr('brand'),
    manufacturer: getAttr('manufacturer'),
    productType: item.productTypes?.[0]?.productType || 'PRODUCT',

    // === IDENTIFIERS ===
    ean: identifiersData.ean || getAttr('externally_assigned_product_identifier') || '',
    upc: identifiersData.upc || '',
    isbn: identifiersData.isbn || '',
    gtin: identifiersData.gtin || '',
    gcid: identifiersData.gcid || '',
    pzn: identifiersData.pzn || '',
    minsan: identifiersData.minsan || '',
    partNumber: getAttr('part_number') || getAttr('manufacturer_part_number') || '',
    itemModelNumber: getAttr('item_model_number') || '',

    // === BULLET POINTS ===
    bulletPoint1: attributes.bullet_point?.[0]?.value || '',
    bulletPoint2: attributes.bullet_point?.[1]?.value || '',
    bulletPoint3: attributes.bullet_point?.[2]?.value || '',
    bulletPoint4: attributes.bullet_point?.[3]?.value || '',
    bulletPoint5: attributes.bullet_point?.[4]?.value || '',
    bulletPoint6: attributes.bullet_point?.[5]?.value || '',
    bulletPoint7: attributes.bullet_point?.[6]?.value || '',
    bulletPoint8: attributes.bullet_point?.[7]?.value || '',
    bulletPoint9: attributes.bullet_point?.[8]?.value || '',

    // === DESCRIPTIONS ===
    description: getAttr('product_description') || getAttr('item_description') || getAttrWithLanguage('product_description', 'de_DE') || '',
    shortDescription: getAttr('short_description') || getAttr('product_description_short') || '',
    longDescription: getAttr('long_description') || getAttr('product_description_long') || '',

    // === IMAGES ===
    mainImageURL: imagesData.mainImageURL,
    mainImageHeight: imagesData.mainImageHeight,
    mainImageWidth: imagesData.mainImageWidth,
    additionalImage1: imagesData.additionalImage1,
    additionalImage2: imagesData.additionalImage2,
    additionalImage3: imagesData.additionalImage3,
    additionalImage4: imagesData.additionalImage4,
    additionalImage5: imagesData.additionalImage5,
    additionalImage6: imagesData.additionalImage6,
    additionalImage7: imagesData.additionalImage7,
    additionalImage8: imagesData.additionalImage8,
    totalImageCount: imagesData.totalImageCount,

    // === DIMENSIONS ===
    itemLength: dimensionsData.itemLength || getAttr('item_length'),
    itemLengthUnit: dimensionsData.itemLengthUnit || '',
    itemWidth: dimensionsData.itemWidth || getAttr('item_width'),
    itemWidthUnit: dimensionsData.itemWidthUnit || '',
    itemHeight: dimensionsData.itemHeight || getAttr('item_height'),
    itemHeightUnit: dimensionsData.itemHeightUnit || '',
    itemWeight: dimensionsData.itemWeight || getAttr('item_weight'),
    itemWeightUnit: dimensionsData.itemWeightUnit || '',
    packageLength: dimensionsData.packageLength || getAttr('package_length'),
    packageLengthUnit: dimensionsData.packageLengthUnit || '',
    packageWidth: dimensionsData.packageWidth || getAttr('package_width'),
    packageWidthUnit: dimensionsData.packageWidthUnit || '',
    packageHeight: dimensionsData.packageHeight || getAttr('package_height'),
    packageHeightUnit: dimensionsData.packageHeightUnit || '',
    packageWeight: dimensionsData.packageWeight || getAttr('package_weight'),
    packageWeightUnit: dimensionsData.packageWeightUnit || '',

    // === SALES RANKS ===
    salesRank1: salesRanksData.salesRank1 || '',
    salesRank1Category: salesRanksData.salesRank1Title || '',
    salesRank2: salesRanksData.salesRank2 || '',
    salesRank2Category: salesRanksData.salesRank2Title || '',
    salesRank3: salesRanksData.salesRank3 || '',
    salesRank3Category: salesRanksData.salesRank3Title || '',
    displayGroupRank: salesRanksData.displayGroupRank || '',
    displayGroupName: salesRanksData.displayGroupTitle || '',

    // === CLASSIFICATIONS (BROWSE NODES) ===
    browseNodeId: classificationsData.browseNodeId || '',
    browseNodeName: classificationsData.browseNodeName || '',
    categoryPath: classificationsData.categoryPath || '',
    browseNode2Id: classificationsData.browseNode2Id || '',
    browseNode2Name: classificationsData.browseNode2Name || '',

    // === RELATIONSHIPS ===
    parentASIN: relationshipsData.parentAsin || getAttr('parent_asin') || '',
    childAsins: relationshipsData.childAsins || '',
    childCount: relationshipsData.childCount || '',
    variationTheme: relationshipsData.variationTheme || getAttr('variation_theme') || '',

    // === PRODUCT DETAILS ===
    color: getAttr('color') || getAttr('color_name') || '',
    colorMap: getAttr('color_map') || '',
    size: getAttr('size') || getAttr('size_name') || '',
    sizeMap: getAttr('size_map') || '',
    material: getAttr('material') || getAttr('material_type') || '',
    style: getAttr('style') || getAttr('style_name') || '',
    pattern: getAttr('pattern') || getAttr('pattern_name') || '',

    // === ADDITIONAL ATTRIBUTES ===
    modelNumber: getAttr('model_number') || getAttr('model') || '',
    releaseDate: getAttr('release_date') || getAttr('item_release_date') || '',
    firstAvailableDate: firstAvailableFromCatalog || getAttr('first_available_date') || '',

    // === CATALOG PRICE (from attributes) ===
    catalogListPrice: catalogListPrice,
    catalogCurrency: catalogCurrency,
    packageQuantity: getAttr('package_quantity') || getAttr('number_of_items') || '',
    unitCount: getAttr('unit_count') || '',
    unitCountType: getAttr('unit_count_type') || '',
    countryOfOrigin: getAttr('country_of_origin') || '',

    // === WARRANTY & SUPPORT ===
    warranty: getAttr('warranty_description') || getAttr('warranty') || '',
    warrantyType: getAttr('warranty_type') || '',
    legalDisclaimer: getAttr('legal_disclaimer') || '',

    // === SAFETY & COMPLIANCE ===
    safetyWarning: getAttr('safety_warning') || '',
    hazmatType: getAttr('hazmat_type') || getAttr('hazardous_material_type') || '',
    batteryType: getAttr('battery_type') || '',
    batteryWeight: getAttr('battery_weight') || '',
    numberOfBatteries: getAttr('number_of_batteries') || '',
    lithiumBatteryWeight: getAttr('lithium_battery_weight') || '',
    lithiumBatteryEnergyContent: getAttr('lithium_battery_energy_content') || '',

    // === TARGET AUDIENCE ===
    targetGender: getAttr('target_gender') || '',
    ageRangeDescription: getAttr('age_range_description') || getAttr('target_audience_age') || '',
    recommendedAge: getAttr('recommended_age') || '',
    itemFormType: getAttr('item_form') || getAttr('item_form_type') || '',

    // === PRODUCT TYPE SPECIFIC ===
    department: getAttr('department') || '',
    genericKeywords: getAttrArray('generic_keyword').join(', ') || '',
    platinumKeywords: getAttrArray('platinum_keywords').join(', ') || '',
    searchTerms: getAttr('search_terms') || '',

    // === SHIPPING ===
    isGiftWrapAvailable: getAttr('is_gift_wrap_available') || '',
    isDiscontinuedByManufacturer: getAttr('is_discontinued_by_manufacturer') || '',
    itemCondition: getAttr('item_condition') || getAttr('condition_type') || '',

    // === SUMMARY FIELDS ===
    contributors: summary.contributors?.map(c => `${c.role}: ${c.value}`).join('; ') || '',
    itemClassification: summary.itemClassification || '',
    websiteDisplayGroup: summary.websiteDisplayGroup || '',
    websiteDisplayGroupName: summary.websiteDisplayGroupName || '',

    // === METADATA ===
    importDate: new Date(),
    importedBy: Session.getActiveUser().getEmail()
  };
}

/**
 * Fetch seller information for an ASIN
 */
function fetchSellerByASIN(asin, marketplaceConfig, accessToken) {
  try {
    const path = `/products/pricing/v0/items/${asin}/offers`;
    const params = {
      MarketplaceId: marketplaceConfig.marketplaceId,
      ItemCondition: 'New'
    };

    Logger.log(`[SELLER DEBUG] Fetching seller info for ${asin}...`);
    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    const payload = response.payload || response;
    const offers = payload.Offers || payload.offers || [];

    Logger.log(`[SELLER DEBUG] Found ${offers.length} offers`);

    if (offers.length > 0) {
      const offer = offers[0];
      Logger.log(`[SELLER DEBUG] First offer keys: ${Object.keys(offer).join(', ')}`);

      const sellerId = offer.SellerId || offer.sellerId || '';
      const isFBA = offer.IsFulfilledByAmazon || offer.isFulfilledByAmazon || false;
      const rating = offer.SellerFeedbackRating?.SellerPositiveFeedbackRating;

      let sellerInfo = '';
      if (isFBA && rating) {
        sellerInfo = `FBA, ${rating}%`;
      } else if (isFBA) {
        sellerInfo = 'FBA';
      } else if (rating) {
        sellerInfo = `${rating}%`;
      }

      Logger.log(`[SELLER DEBUG] Extracted: sellerId=${sellerId}, sellerInfo=${sellerInfo}`);

      return { sellerId, sellerName: sellerInfo };
    }

  } catch (error) {
    Logger.log(`[SELLER DEBUG] Error: ${error.message}`);
  }

  return { sellerId: '', sellerName: '' };
}

/**
 * Fetch pricing information for an ASIN
 */
function fetchProductPricing(asin, marketplaceConfig, accessToken) {
  try {
    const path = `/products/pricing/v0/items/${asin}/offers`;
    const params = {
      MarketplaceId: marketplaceConfig.marketplaceId,
      ItemCondition: 'New'
    };

    Logger.log(`[PRICE DEBUG] Fetching pricing for ${asin}...`);
    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    const payload = response.payload || response;
    const summary = payload.Summary || payload.summary || {};

    Logger.log(`[PRICE DEBUG] Summary keys: ${Object.keys(summary).join(', ')}`);

    let listPrice = '';
    let currentPrice = '';
    let currency = 'EUR';

    const lowestPrices = summary.LowestPrices || [];
    Logger.log(`[PRICE DEBUG] LowestPrices count: ${lowestPrices.length}`);

    if (lowestPrices.length > 0) {
      const fbaPrice = lowestPrices.find(p => p.fulfillmentChannel === 'Amazon');
      const merchantPrice = lowestPrices.find(p => p.fulfillmentChannel === 'Merchant');

      const bestPrice = fbaPrice || merchantPrice || lowestPrices[0];

      currentPrice = bestPrice.LandedPrice?.Amount || bestPrice.ListingPrice?.Amount || '';
      currency = bestPrice.LandedPrice?.CurrencyCode || bestPrice.ListingPrice?.CurrencyCode || 'EUR';
      listPrice = bestPrice.ListingPrice?.Amount || '';

      Logger.log(`[PRICE DEBUG] Best price from ${bestPrice.fulfillmentChannel}: ${currentPrice} ${currency}`);
    }

    if (!currentPrice && summary.BuyBoxPrices && summary.BuyBoxPrices.length > 0) {
      const buyBox = summary.BuyBoxPrices[0];
      currentPrice = buyBox.LandedPrice?.Amount || buyBox.ListingPrice?.Amount || '';
      currency = buyBox.LandedPrice?.CurrencyCode || currency;
    }

    Logger.log(`[PRICE DEBUG] Final: listPrice=${listPrice}, currentPrice=${currentPrice}, currency=${currency}`);

    return { listPrice, currentPrice, currency };

  } catch (error) {
    Logger.log(`[PRICE DEBUG] Error: ${error.message}`);
    throw error;
  }
}

function fetchProductInventory(asin, marketplaceConfig, accessToken) {
  return { quantity: '' };
}

// ========================================
// A+ CONTENT API
// ========================================

/**
 * Pre-fetch ALL A+ content documents and build ASIN mapping cache
 */
function fetchAPlusContentList(marketplaceConfig, accessToken) {
  const cache = {
    allRecords: [],
    asinToContent: {}
  };

  try {
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 10;

    do {
      const path = '/aplus/2020-11-01/contentDocuments';
      const params = { marketplaceId: marketplaceConfig.marketplaceId };
      if (pageToken) params.pageToken = pageToken;

      Logger.log(`[A+ CACHE] Fetching content list (page ${pageCount + 1})...`);
      const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

      const contentRecords = response.contentMetadataRecords || [];
      cache.allRecords = cache.allRecords.concat(contentRecords);

      pageToken = response.nextPageToken;
      pageCount++;

      if (pageToken) Utilities.sleep(100);
    } while (pageToken && pageCount < maxPages);

    Logger.log(`[A+ CACHE] Total content documents: ${cache.allRecords.length}`);

    for (let i = 0; i < cache.allRecords.length; i++) {
      const record = cache.allRecords[i];
      const contentKey = record.contentReferenceKey;

      try {
        const asinsPath = `/aplus/2020-11-01/contentDocuments/${contentKey}/asins`;
        const asinsParams = { marketplaceId: marketplaceConfig.marketplaceId };
        const asinsResponse = callSPAPI('GET', asinsPath, marketplaceConfig.marketplaceId, asinsParams, accessToken);

        const asinMetadataSet = asinsResponse.asinMetadataSet || [];
        for (const asinMeta of asinMetadataSet) {
          cache.asinToContent[asinMeta.asin] = contentKey;
        }

        Utilities.sleep(50);
      } catch (e) {
        Logger.log(`[A+ CACHE] Error fetching ASINs for ${contentKey}: ${e.message}`);
      }

      if ((i + 1) % 10 === 0) {
        showProgress(`Buduję cache A+: ${i + 1}/${cache.allRecords.length}...`);
      }
    }

    Logger.log(`[A+ CACHE] Cache built: ${Object.keys(cache.asinToContent).length} ASIN mappings`);

  } catch (error) {
    Logger.log(`[A+ CACHE] Error building cache: ${error.message}`);
  }

  return cache;
}

/**
 * Get A+ content for ASIN from pre-built cache
 */
function getAPlusFromCache(asin, cache, marketplaceConfig, accessToken) {
  const emptyResult = {
    hasAPlus: false,
    aplusType: '', aplusStatus: '', aplusContentId: '', aplusName: '',
    aplusModuleCount: 0, aplusModuleTypes: '', aplusHeadline: '',
    aplusText1: '', aplusText2: '', aplusText3: '',
    aplusImageUrl1: '', aplusImageUrl2: '', aplusImageUrl3: '', aplusImageUrl4: '',
    hasBrandStory: false, brandStoryHeadline: '', brandStoryText: '', brandStoryImageUrl: ''
  };

  const contentKey = cache.asinToContent[asin];
  if (!contentKey) {
    Logger.log(`[A+ CACHE] No A+ content for ASIN ${asin} (not in cache)`);
    return emptyResult;
  }

  try {
    Logger.log(`[A+ CACHE] Found A+ content for ${asin}: ${contentKey}`);
    const contentPath = `/aplus/2020-11-01/contentDocuments/${contentKey}`;
    const contentParams = { marketplaceId: marketplaceConfig.marketplaceId, includedDataSet: 'CONTENTS' };
    const contentResponse = callSPAPI('GET', contentPath, marketplaceConfig.marketplaceId, contentParams, accessToken);

    const record = cache.allRecords.find(r => r.contentReferenceKey === contentKey);
    return parseAPlusContentDocument(contentResponse, record);
  } catch (e) {
    Logger.log(`[A+ CACHE] Error fetching A+ content for ${asin}: ${e.message}`);
    return emptyResult;
  }
}

/**
 * Parse A+ Content document into structured data
 */
function parseAPlusContentDocument(contentResponse, metadata) {
  Logger.log(`[A+ PARSE] Starting parse. Metadata: ${JSON.stringify(metadata).substring(0, 300)}`);

  const contentRecord = contentResponse.contentRecord || {};
  const contentDocument = contentRecord.contentDocument || contentResponse.contentDocument || {};
  const contentModuleList = contentDocument.contentModuleList || [];

  Logger.log(`[A+ PARSE] Found ${contentModuleList.length} modules`);

  const aplusData = {
    hasAPlus: true,
    aplusType: contentDocument.contentType || metadata?.contentType || 'STANDARD',
    aplusStatus: metadata?.contentMetadata?.status || metadata?.status || '',
    aplusContentId: contentDocument.contentReferenceKey || contentRecord.contentReferenceKey || metadata?.contentReferenceKey || '',
    aplusName: contentDocument.name || metadata?.contentMetadata?.name || metadata?.name || '',
    aplusModuleCount: contentModuleList.length,
    aplusModuleTypes: contentModuleList.map(m => m.contentModuleType).filter(t => t).join(', '),
    aplusHeadline: '',
    aplusText1: '',
    aplusText2: '',
    aplusText3: '',
    aplusImageUrl1: '',
    aplusImageUrl2: '',
    aplusImageUrl3: '',
    aplusImageUrl4: '',
    hasBrandStory: false,
    brandStoryHeadline: '',
    brandStoryText: '',
    brandStoryImageUrl: ''
  };

  let textIndex = 1;
  let imageIndex = 1;

  for (const module of contentModuleList) {
    const moduleType = module.contentModuleType || '';

    if (moduleType.includes('BRAND') || moduleType.includes('HERO')) {
      aplusData.hasBrandStory = true;
    }

    if (module.standardHeaderText?.headline?.value && !aplusData.aplusHeadline) {
      aplusData.aplusHeadline = module.standardHeaderText.headline.value;
    }

    const textSources = [
      module.standardText?.headline?.value,
      module.standardText?.body?.textList?.[0]?.value,
      module.standardHeaderText?.headline?.value,
      module.standardHeaderText?.body?.textList?.[0]?.value,
      module.standardComparisonTable?.headline?.value,
      module.standardSingleImageHighlights?.headline?.value,
      module.standardImageSidebar?.descriptionTextBlock?.body?.textList?.[0]?.value,
      module.standardMultipleImageText?.headline?.value,
      module.standardProductDescription?.body?.textList?.[0]?.value
    ];

    for (const text of textSources) {
      if (text && textIndex <= 3) {
        aplusData[`aplusText${textIndex}`] = text.substring(0, 1000);
        textIndex++;
      }
    }

    const imageSources = [
      module.standardSingleImageHighlights?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardImageTextOverlay?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardImageSidebar?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardHeaderImageText?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardSingleSideImage?.imageCropSpecification?.optimizedImage?.link,
      module.standardSingleSideImage?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardCompanyLogo?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardTechSpecs?.image?.imageCropSpecification?.optimizedImage?.link,
      ...(module.standardFourImageText?.fourImageTextList || []).map(i => i.image?.imageCropSpecification?.optimizedImage?.link),
      ...(module.standardMultipleImageText?.imageTextList || []).map(i => i.image?.imageCropSpecification?.optimizedImage?.link),
      ...(module.standardThreeImageText?.imageTextList || []).map(i => i.image?.imageCropSpecification?.optimizedImage?.link)
    ];

    for (const img of imageSources) {
      if (img && imageIndex <= 4) {
        aplusData[`aplusImageUrl${imageIndex}`] = img;
        imageIndex++;
      }
    }
  }

  return aplusData;
}

// ========================================
// SEARCH BY KEYWORD
// ========================================

/**
 * Search products by keyword on Amazon
 */
function lukoSearchProducts() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Search Products',
    'Enter search term (e.g., "laptop", "water bottle", "bluetooth speaker"):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const searchTerm = response.getResponseText().trim();
  if (!searchTerm) {
    showError('No search term provided');
    return;
  }

  // Ask for marketplace using dropdown
  const marketplace = showMarketplaceDropdown();
  if (!marketplace) return;

  const marketplaceConfig = getMarketplaceConfig(marketplace);

  showProgress(`Searching for "${searchTerm}" in Amazon ${marketplace}...`);

  try {
    const credentials = getCredentials();
    const config = getConfig();
    const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

    const searchResults = searchProductsByKeyword(searchTerm, marketplaceConfig, tokens.access_token);

    if (searchResults.length === 0) {
      ui.alert('Brak wyników', `Nie znaleziono produktów dla "${searchTerm}"`, ui.ButtonSet.OK);
      return;
    }

    const resultsList = searchResults.slice(0, 10).map(p =>
      `${p.asin} - ${p.title.substring(0, 50)}...`
    ).join('\n');

    const infoMsg = `Znaleziono ${searchResults.length} produktów:\n\n${resultsList}\n\n` +
      `${searchResults.length > 10 ? '...i więcej\n\n' : ''}`;

    ui.alert('Wyniki wyszukiwania', infoMsg, ui.ButtonSet.OK);

    const countResponse = ui.prompt(
      'Ile produktów zaimportować?',
      `Znaleziono: ${searchResults.length} produktów\n\n` +
      `Wpisz liczbę produktów do zaimportowania:\n` +
      `- Wpisz liczbę (np. 10, 50, 100)\n` +
      `- Wpisz "all" lub zostaw puste aby zaimportować wszystkie\n` +
      `- Wpisz "0" aby anulować`,
      ui.ButtonSet.OK_CANCEL
    );

    if (countResponse.getSelectedButton() !== ui.Button.OK) return;

    let countInput = countResponse.getResponseText().trim().toLowerCase();
    let importCount = searchResults.length;

    if (countInput === '0') {
      return;
    } else if (countInput && countInput !== 'all' && countInput !== '') {
      const parsed = parseInt(countInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        importCount = Math.min(parsed, searchResults.length);
      }
    }

    const aplusConfirm = ui.alert(
      'Sprawdzanie A+ Content',
      'Czy sprawdzać A+ Content dla każdego produktu?\n\n' +
      '⚠️ UWAGA: Spowalnia import (~2 sekundy na produkt)\n' +
      'A+ działa tylko dla produktów TWOJEJ marki.\n\n' +
      'Tak = Sprawdzaj A+ (wolniej)\n' +
      'Nie = Pomiń A+ (szybciej)',
      ui.ButtonSet.YES_NO
    );

    const skipAPlus = (aplusConfirm !== ui.Button.YES);

    const confirmMsg = `Zaimportować ${importCount} z ${searchResults.length} produktów?\n\n` +
      `A+ Content: ${skipAPlus ? 'POMINIĘTE (szybki import)' : 'SPRAWDZANE (wolniejszy import)'}`;
    const confirm = ui.alert('Potwierdź import', confirmMsg, ui.ButtonSet.YES_NO);

    if (confirm !== ui.Button.YES) return;

    const asinsToImport = searchResults.slice(0, importCount).map(p => p.asin);
    showProgress(`Importuję ${importCount} produktów...`);

    const results = importProductsByASIN(asinsToImport, marketplace, marketplaceConfig, { skipAPlus });

    let searchResultMsg = `✅ Zaimportowano: ${results.success}\n` +
      `❌ Błędy: ${results.failed}\n` +
      `⚠️ Ostrzeżenia: ${results.warnings}`;

    if (results.skipped > 0) {
      searchResultMsg += `\n⏭️ Pominięte (duplikaty ASIN+${marketplace}): ${results.skipped}`;
    }

    if (results.autoResumeScheduled) {
      searchResultMsg += `\n\n⏳ POZOSTAŁO: ${results.remaining} produktów`;
      searchResultMsg += `\n🔄 Auto-wznowienie za 1 minutę...`;
    }

    const searchTitle = results.autoResumeScheduled ? 'Import w toku...' : 'Import zakończony';
    SpreadsheetApp.getActiveSpreadsheet().toast(searchResultMsg, searchTitle, 30);
    Logger.log(`[SEARCH] ${searchTitle}: ${searchResultMsg.replace(/\n/g, ' | ')}`);

  } catch (error) {
    handleError('lukoSearchProducts', error);
  }
}

/**
 * Search products by keyword with pagination
 */
function searchProductsByKeyword(searchTerm, marketplaceConfig, accessToken) {
  const path = '/catalog/2022-04-01/items';
  let allItems = [];
  let nextToken = null;
  let pageCount = 0;
  const maxPages = 10;

  do {
    const params = {
      marketplaceIds: marketplaceConfig.marketplaceId,
      keywords: searchTerm,
      pageSize: 20,
      includedData: 'summaries'
    };

    if (nextToken) {
      params.pageToken = nextToken;
    }

    Logger.log(`[SEARCH] Fetching page ${pageCount + 1} for "${searchTerm}"...`);
    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    const items = response.items || [];
    allItems = allItems.concat(items);

    nextToken = response.pagination?.nextToken;
    pageCount++;

    Logger.log(`[SEARCH] Page ${pageCount}: Found ${items.length} items. Total so far: ${allItems.length}`);

    if (nextToken) {
      Utilities.sleep(300);
    }

  } while (nextToken && pageCount < maxPages);

  Logger.log(`[SEARCH] Total items found: ${allItems.length}`);

  return allItems.map(item => ({
    asin: item.asin,
    title: item.summaries?.[0]?.itemName || 'Unknown Title'
  }));
}

// ========================================
// IMPORTED PRODUCTS SHEET
// ========================================

/**
 * Generate ImportedProducts sheet with ALL available fields
 */
function generateImportedProductsSheet(ss) {
  let sheet = ss.getSheetByName('ImportedProducts');

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('ImportedProducts');
  sheet.setFrozenColumns(0);

  const headers = getImportedProductsHeaders();

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(20, 300);
  sheet.setColumnWidth(24, 400);
  sheet.setColumnWidth(33, 400);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(5);

  const checkboxRange = sheet.getRange('A2:A1000');
  checkboxRange.insertCheckboxes();

  Logger.log(`ImportedProducts sheet generated with ${headers.length} columns`);

  return sheet;
}

/**
 * Get headers array for ImportedProducts sheet
 * Extracted to separate function so it can be reused
 */
function getImportedProductsHeaders() {
  return [
    // === CONTROL ===
    '☑️ Use', 'Import Date', 'Imported By', 'Marketplace',

    // === PRIMARY IDENTIFIERS ===
    'ASIN', 'SKU', 'EAN', 'UPC', 'ISBN', 'GTIN', 'GCID', 'PZN', 'MINSAN', 'Part Number', 'Item Model Number',

    // === SELLER INFO ===
    'Seller ID', 'Seller Name',

    // === BASIC INFO ===
    'Product Type', 'Title', 'Brand', 'Manufacturer',

    // === BULLET POINTS ===
    'Bullet Point 1', 'Bullet Point 2', 'Bullet Point 3', 'Bullet Point 4', 'Bullet Point 5',
    'Bullet Point 6', 'Bullet Point 7', 'Bullet Point 8', 'Bullet Point 9',

    // === DESCRIPTIONS ===
    'Description', 'Short Description', 'Long Description',

    // === IMAGES ===
    'Main Image URL', 'Main Image Height', 'Main Image Width',
    'Additional Image 1', 'Additional Image 2', 'Additional Image 3', 'Additional Image 4',
    'Additional Image 5', 'Additional Image 6', 'Additional Image 7', 'Additional Image 8',
    'Total Image Count',

    // === PRICING ===
    'List Price', 'Current Price', 'Currency',

    // === INVENTORY ===
    'Available Quantity',

    // === ITEM DIMENSIONS ===
    'Item Length', 'Item Length Unit', 'Item Width', 'Item Width Unit',
    'Item Height', 'Item Height Unit', 'Item Weight', 'Item Weight Unit',

    // === PACKAGE DIMENSIONS ===
    'Package Length', 'Package Length Unit', 'Package Width', 'Package Width Unit',
    'Package Height', 'Package Height Unit', 'Package Weight', 'Package Weight Unit',

    // === SALES RANKS ===
    'Sales Rank 1', 'Sales Rank 1 Category', 'Sales Rank 2', 'Sales Rank 2 Category',
    'Sales Rank 3', 'Sales Rank 3 Category', 'Display Group Rank', 'Display Group Name',

    // === BROWSE NODES / CLASSIFICATIONS ===
    'Browse Node ID', 'Browse Node Name', 'Category Path', 'Browse Node 2 ID', 'Browse Node 2 Name',

    // === VARIATIONS / RELATIONSHIPS ===
    'Parent ASIN', 'Child ASINs', 'Child Count', 'Variation Theme',

    // === PRODUCT ATTRIBUTES ===
    'Color', 'Color Map', 'Size', 'Size Map', 'Material', 'Style', 'Pattern',

    // === ADDITIONAL INFO ===
    'Model Number', 'Release Date', 'First Available Date', 'Package Quantity',
    'Unit Count', 'Unit Count Type', 'Country of Origin',

    // === WARRANTY & SUPPORT ===
    'Warranty', 'Warranty Type', 'Legal Disclaimer',

    // === SAFETY & COMPLIANCE ===
    'Safety Warning', 'Hazmat Type', 'Battery Type', 'Battery Weight',
    'Number of Batteries', 'Lithium Battery Weight', 'Lithium Battery Energy Content',

    // === TARGET AUDIENCE ===
    'Target Gender', 'Age Range', 'Recommended Age', 'Item Form Type',

    // === PRODUCT TYPE SPECIFIC ===
    'Department', 'Generic Keywords', 'Platinum Keywords', 'Search Terms',

    // === SHIPPING & AVAILABILITY ===
    'Is Gift Wrap Available', 'Is Discontinued', 'Item Condition',

    // === SUMMARY FIELDS ===
    'Contributors', 'Item Classification', 'Website Display Group', 'Website Display Group Name',

    // === A+ CONTENT ===
    'Has A+', 'A+ Type', 'A+ Status', 'A+ Content ID', 'A+ Name',
    'A+ Module Count', 'A+ Module Types', 'A+ Headline',
    'A+ Text 1', 'A+ Text 2', 'A+ Text 3',
    'A+ Image URL 1', 'A+ Image URL 2', 'A+ Image URL 3', 'A+ Image URL 4',

    // === BRAND STORY ===
    'Has Brand Story', 'Brand Story Headline', 'Brand Story Text', 'Brand Story Image URL',

    // === NOTES ===
    'Notes',

    // === LINK ===
    'Link'
  ];
}

function appendProductToImportedSheet(sheet, productData, marketplace) {
  const germanDate = Utilities.formatDate(
    productData.importDate,
    'Europe/Berlin',
    'dd.MM.yyyy HH:mm:ss'
  );

  const rowData = [
    // === CONTROL ===
    false,
    germanDate,
    productData.importedBy,
    marketplace,

    // === PRIMARY IDENTIFIERS ===
    productData.asin,
    productData.sku || '',
    productData.ean || '',
    productData.upc || '',
    productData.isbn || '',
    productData.gtin || '',
    productData.gcid || '',
    productData.pzn || '',
    productData.minsan || '',
    productData.partNumber || '',
    productData.itemModelNumber || '',

    // === SELLER INFO ===
    productData.sellerId || '',
    productData.sellerName || '',

    // === BASIC INFO ===
    productData.productType || '',
    productData.title || '',
    productData.brand || '',
    productData.manufacturer || '',

    // === BULLET POINTS ===
    productData.bulletPoint1 || '',
    productData.bulletPoint2 || '',
    productData.bulletPoint3 || '',
    productData.bulletPoint4 || '',
    productData.bulletPoint5 || '',
    productData.bulletPoint6 || '',
    productData.bulletPoint7 || '',
    productData.bulletPoint8 || '',
    productData.bulletPoint9 || '',

    // === DESCRIPTIONS ===
    productData.description || '',
    productData.shortDescription || '',
    productData.longDescription || '',

    // === IMAGES ===
    productData.mainImageURL || '',
    productData.mainImageHeight || '',
    productData.mainImageWidth || '',
    productData.additionalImage1 || '',
    productData.additionalImage2 || '',
    productData.additionalImage3 || '',
    productData.additionalImage4 || '',
    productData.additionalImage5 || '',
    productData.additionalImage6 || '',
    productData.additionalImage7 || '',
    productData.additionalImage8 || '',
    productData.totalImageCount || '',

    // === PRICING ===
    productData.listPrice || '',
    productData.currentPrice || '',
    productData.currency || '',

    // === INVENTORY ===
    productData.availableQuantity || '',

    // === ITEM DIMENSIONS ===
    productData.itemLength || '',
    productData.itemLengthUnit || '',
    productData.itemWidth || '',
    productData.itemWidthUnit || '',
    productData.itemHeight || '',
    productData.itemHeightUnit || '',
    productData.itemWeight || '',
    productData.itemWeightUnit || '',

    // === PACKAGE DIMENSIONS ===
    productData.packageLength || '',
    productData.packageLengthUnit || '',
    productData.packageWidth || '',
    productData.packageWidthUnit || '',
    productData.packageHeight || '',
    productData.packageHeightUnit || '',
    productData.packageWeight || '',
    productData.packageWeightUnit || '',

    // === SALES RANKS ===
    productData.salesRank1 || '',
    productData.salesRank1Category || '',
    productData.salesRank2 || '',
    productData.salesRank2Category || '',
    productData.salesRank3 || '',
    productData.salesRank3Category || '',
    productData.displayGroupRank || '',
    productData.displayGroupName || '',

    // === BROWSE NODES / CLASSIFICATIONS ===
    productData.browseNodeId || '',
    productData.browseNodeName || '',
    productData.categoryPath || '',
    productData.browseNode2Id || '',
    productData.browseNode2Name || '',

    // === VARIATIONS / RELATIONSHIPS ===
    productData.parentASIN || '',
    productData.childAsins || '',
    productData.childCount || '',
    productData.variationTheme || '',

    // === PRODUCT ATTRIBUTES ===
    productData.color || '',
    productData.colorMap || '',
    productData.size || '',
    productData.sizeMap || '',
    productData.material || '',
    productData.style || '',
    productData.pattern || '',

    // === ADDITIONAL INFO ===
    productData.modelNumber || '',
    productData.releaseDate || '',
    productData.firstAvailableDate || '',
    productData.packageQuantity || '',
    productData.unitCount || '',
    productData.unitCountType || '',
    productData.countryOfOrigin || '',

    // === WARRANTY & SUPPORT ===
    productData.warranty || '',
    productData.warrantyType || '',
    productData.legalDisclaimer || '',

    // === SAFETY & COMPLIANCE ===
    productData.safetyWarning || '',
    productData.hazmatType || '',
    productData.batteryType || '',
    productData.batteryWeight || '',
    productData.numberOfBatteries || '',
    productData.lithiumBatteryWeight || '',
    productData.lithiumBatteryEnergyContent || '',

    // === TARGET AUDIENCE ===
    productData.targetGender || '',
    productData.ageRangeDescription || '',
    productData.recommendedAge || '',
    productData.itemFormType || '',

    // === PRODUCT TYPE SPECIFIC ===
    productData.department || '',
    productData.genericKeywords || '',
    productData.platinumKeywords || '',
    productData.searchTerms || '',

    // === SHIPPING & AVAILABILITY ===
    productData.isGiftWrapAvailable || '',
    productData.isDiscontinuedByManufacturer || '',
    productData.itemCondition || '',

    // === SUMMARY FIELDS ===
    productData.contributors || '',
    productData.itemClassification || '',
    productData.websiteDisplayGroup || '',
    productData.websiteDisplayGroupName || '',

    // === A+ CONTENT ===
    productData.hasAPlus === null ? 'Nie sprawdzono' : (productData.hasAPlus ? 'Tak' : 'Brak dostępu'),
    productData.aplusType || '',
    productData.aplusStatus || '',
    productData.aplusContentId || '',
    productData.aplusName || '',
    productData.aplusModuleCount || '',
    productData.aplusModuleTypes || '',
    productData.aplusHeadline || '',
    productData.aplusText1 || '',
    productData.aplusText2 || '',
    productData.aplusText3 || '',
    productData.aplusImageUrl1 || '',
    productData.aplusImageUrl2 || '',
    productData.aplusImageUrl3 || '',
    productData.aplusImageUrl4 || '',

    // === BRAND STORY ===
    productData.hasBrandStory === null ? 'Nie sprawdzono' : (productData.hasBrandStory ? 'Tak' : 'Brak dostępu'),
    productData.brandStoryHeadline || '',
    productData.brandStoryText || '',
    productData.brandStoryImageUrl || '',

    // === NOTES ===
    '',

    // === LINK ===
    getAmazonProductLink(productData.asin, marketplace)
  ];

  sheet.appendRow(rowData);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Show marketplace selection dialog
 */
function showMarketplaceDropdown() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Wybierz Marketplace',
    'Wpisz kod marketplace:\n\n' +
    '🇩🇪 DE - Niemcy (domyślnie)\n' +
    '🇫🇷 FR - Francja\n' +
    '🇬🇧 UK - Wielka Brytania\n' +
    '🇮🇹 IT - Włochy\n' +
    '🇪🇸 ES - Hiszpania\n' +
    '🇳🇱 NL - Holandia\n' +
    '🇧🇪 BE - Belgia\n' +
    '🇵🇱 PL - Polska\n' +
    '🇸🇪 SE - Szwecja\n' +
    '🇮🇪 IE - Irlandia',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return null;

  let marketplace = response.getResponseText().trim().toUpperCase();
  if (!marketplace) marketplace = 'DE';

  const validMarketplaces = ['DE', 'FR', 'UK', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'IE'];
  if (!validMarketplaces.includes(marketplace)) {
    showError(`Nieprawidłowy marketplace: ${marketplace}\n\nDostępne: ${validMarketplaces.join(', ')}`);
    return null;
  }

  return marketplace;
}

/**
 * Get Amazon product link for an ASIN based on marketplace
 */
function getAmazonProductLink(asin, marketplace) {
  const domains = {
    'DE': 'www.amazon.de',
    'FR': 'www.amazon.fr',
    'UK': 'www.amazon.co.uk',
    'IT': 'www.amazon.it',
    'ES': 'www.amazon.es',
    'NL': 'www.amazon.nl',
    'BE': 'www.amazon.com.be',
    'PL': 'www.amazon.pl',
    'SE': 'www.amazon.se',
    'IE': 'www.amazon.ie'
  };
  const domain = domains[marketplace] || 'www.amazon.de';
  return `https://${domain}/dp/${asin}`;
}

function showProgress(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Processing...', 30);
}

function showError(message) {
  SpreadsheetApp.getUi().alert('Error', message, SpreadsheetApp.getUi().ButtonSet.OK);
  SpreadsheetApp.getActiveSpreadsheet().toast('');
}

function showInfo(message) {
  SpreadsheetApp.getUi().alert('Info', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

function handleError(functionName, error) {
  Logger.log(`Error in ${functionName}: ${error.message}`);
  Logger.log(error.stack);

  showError(`An error occurred: ${error.message}\n\nCheck Logs sheet for details.`);
}

// ========================================
// SHEET MAINTENANCE FUNCTIONS
// ========================================

/**
 * Fix/regenerate headers on existing ImportedProducts sheet
 * This preserves existing data!
 */
function lukoFixImportedProductsHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ImportedProducts');

  if (!sheet) {
    Logger.log('ERROR: ImportedProducts sheet not found!');
    return;
  }

  const headers = getImportedProductsHeaders();

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(5);

  Logger.log(`SUCCESS: Headers fixed! Total: ${headers.length} columns`);
}

/**
 * Regenerate ImportedProducts sheet (WARNING: deletes existing data!)
 */
function lukoRegenerateImportedProductsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('WARNING: Regenerating ImportedProducts sheet - existing data will be deleted!');

  generateImportedProductsSheet(ss);

  Logger.log('SUCCESS: ImportedProducts sheet has been regenerated with all columns including A+ Content and Brand Story.');
}
