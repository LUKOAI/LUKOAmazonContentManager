/**
 * SP-API Research Integration for AmazonListingAutomation
 * Adds SP-API data collection alongside existing PA-API functionality
 *
 * Features:
 * - Import products by ASIN to RESEARCH sheet
 * - Search products by keywords
 * - Auto-resume on timeout
 * - Duplicate detection
 *
 * Copy this file to AmazonListingAutomation project
 * Configure Script Properties: SP_API_CLIENT_ID, SP_API_CLIENT_SECRET, SP_API_REFRESH_TOKEN
 */

// ========================================
// MARKETPLACE CONFIGURATION
// ========================================

const SP_API_MARKETPLACES = {
  'DE': {
    marketplaceId: 'A1PA6795UKMFR9',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'de-DE',
    currency: 'EUR',
    domain: 'www.amazon.de'
  },
  'FR': {
    marketplaceId: 'A13V1IB3VIYZZH',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'fr-FR',
    currency: 'EUR',
    domain: 'www.amazon.fr'
  },
  'IT': {
    marketplaceId: 'APJ6JRA9NG5V4',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'it-IT',
    currency: 'EUR',
    domain: 'www.amazon.it'
  },
  'ES': {
    marketplaceId: 'A1RKKUPIHCS9HS',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'es-ES',
    currency: 'EUR',
    domain: 'www.amazon.es'
  },
  'UK': {
    marketplaceId: 'A1F83G8C2ARO7P',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'en-GB',
    currency: 'GBP',
    domain: 'www.amazon.co.uk'
  },
  'NL': {
    marketplaceId: 'A1805IZSGTT6HS',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'nl-NL',
    currency: 'EUR',
    domain: 'www.amazon.nl'
  },
  'BE': {
    marketplaceId: 'AMEN7PMS3EDWL',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'nl-NL',
    currency: 'EUR',
    domain: 'www.amazon.com.be'
  },
  'PL': {
    marketplaceId: 'A1C3SOZRARQ6R3',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'pl-PL',
    currency: 'PLN',
    domain: 'www.amazon.pl'
  },
  'SE': {
    marketplaceId: 'A2NODRKZP88ZB9',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'sv-SE',
    currency: 'SEK',
    domain: 'www.amazon.se'
  },
  'IE': {
    marketplaceId: 'A1QA6N5NQHZ0EW',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com',
    region: 'eu-west-1',
    primary: 'en-GB',
    currency: 'EUR',
    domain: 'www.amazon.ie'
  }
};

// ========================================
// MENU INTEGRATION
// ========================================

/**
 * Add SP-API menu items to existing menu
 * Call this from onOpen() in your main script
 */
function addSPApiMenuItems(menu) {
  menu.addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('SP-API Data Collection')
      .addItem('Import by ASIN', 'spApiImportByASIN')
      .addItem('Search by Keywords', 'spApiSearchProducts')
      .addSeparator()
      .addItem('Cancel Auto-Resume', 'spApiCancelAutoResume')
      .addItem('Test API Connection', 'spApiTestConnection'));
  return menu;
}

/**
 * Standalone menu creator - use if not integrating with existing menu
 */
function createSPApiMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SP-API Data Collection')
    .addItem('Import by ASIN', 'spApiImportByASIN')
    .addItem('Search by Keywords', 'spApiSearchProducts')
    .addSeparator()
    .addItem('Cancel Auto-Resume', 'spApiCancelAutoResume')
    .addItem('Test API Connection', 'spApiTestConnection')
    .addToUi();
}

// ========================================
// AUTHENTICATION
// ========================================

/**
 * Get SP-API credentials from Script Properties
 * Configure in: File > Project properties > Script properties
 */
function getSPApiCredentials() {
  const props = PropertiesService.getScriptProperties();

  return {
    clientId: props.getProperty('SP_API_CLIENT_ID'),
    clientSecret: props.getProperty('SP_API_CLIENT_SECRET'),
    refreshToken: props.getProperty('SP_API_REFRESH_TOKEN')
  };
}

/**
 * Get access token from refresh token
 */
function getSPApiAccessToken() {
  const credentials = getSPApiCredentials();

  if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
    throw new Error('SP-API credentials not configured. Set SP_API_CLIENT_ID, SP_API_CLIENT_SECRET, SP_API_REFRESH_TOKEN in Script Properties.');
  }

  const url = 'https://api.amazon.com/auth/o2/token';

  const payload = {
    'grant_type': 'refresh_token',
    'refresh_token': credentials.refreshToken,
    'client_id': credentials.clientId,
    'client_secret': credentials.clientSecret
  };

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': payload,
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    const error = JSON.parse(responseBody);
    throw new Error('Token refresh failed: ' + (error.error_description || error.error || 'Unknown error'));
  }

  const tokens = JSON.parse(responseBody);
  return tokens.access_token;
}

// ========================================
// SP-API CALL HELPER
// ========================================

function callSPApiEndpoint(method, path, marketplaceId, params, accessToken) {
  const marketplaceConfig = Object.values(SP_API_MARKETPLACES).find(m => m.marketplaceId === marketplaceId) || SP_API_MARKETPLACES['DE'];
  const endpoint = marketplaceConfig.endpoint;

  let url = endpoint + path;

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

  Logger.log(`[SP-API] ${method} ${url}`);

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

// ========================================
// IMPORT BY ASIN
// ========================================

function spApiImportByASIN() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'SP-API: Import by ASIN',
    'Enter ASIN(s) to import:\n\n' +
    'Single: B08N5WRWNW\n' +
    'Multiple: B08N5WRWNW, B07XJ8C8F5, B09PMHKQXR\n\n' +
    'Separate multiple ASINs with commas.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const input = response.getResponseText().trim();
  if (!input) {
    ui.alert('Error', 'No ASIN provided', ui.ButtonSet.OK);
    return;
  }

  const asins = input.split(',').map(asin => asin.trim()).filter(asin => asin.length > 0);

  if (asins.length === 0) {
    ui.alert('Error', 'No valid ASINs found', ui.ButtonSet.OK);
    return;
  }

  const marketplace = showSPApiMarketplaceDialog();
  if (!marketplace) return;

  const confirmMsg = `Import ${asins.length} product(s) from Amazon ${marketplace}?\n\n` +
    `ASINs: ${asins.slice(0, 5).join(', ')}${asins.length > 5 ? '...' : ''}\n\n` +
    `Data will be added to RESEARCH sheet.`;

  const confirm = ui.alert('Confirm Import', confirmMsg, ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  showSPApiProgress(`Importing ${asins.length} products from Amazon ${marketplace}...`);

  try {
    const results = spApiImportProducts(asins, marketplace, {});

    let resultMsg = `Imported: ${results.success}\n` +
      `Errors: ${results.failed}\n` +
      `Skipped (duplicates): ${results.skipped}`;

    if (results.autoResumeScheduled) {
      resultMsg += `\n\nRemaining: ${results.remaining}`;
      resultMsg += `\nAuto-resume in 1 minute...`;
    }

    const title = results.autoResumeScheduled ? 'Import in progress...' : 'Import complete';
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, title, 30);

  } catch (error) {
    ui.alert('Error', `Import failed: ${error.message}`, ui.ButtonSet.OK);
    Logger.log(`[SP-API] Error: ${error.message}\n${error.stack}`);
  }
}

function spApiImportProducts(asins, marketplace, options) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('RESEARCH');

  if (!sheet) {
    sheet = ss.insertSheet('RESEARCH');
    initializeResearchSheet(sheet);
  }

  const marketplaceConfig = SP_API_MARKETPLACES[marketplace];
  if (!marketplaceConfig) {
    throw new Error(`Invalid marketplace: ${marketplace}`);
  }

  const accessToken = getSPApiAccessToken();
  const isAutoResume = options.isAutoResume || false;

  // Get existing ASINs to skip duplicates
  const existingAsins = new Set();
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  const headers = data[0];
  const asinCol = headers.indexOf('ASIN');

  if (asinCol >= 0) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][asinCol]) {
        existingAsins.add(data[i][asinCol].toString());
      }
    }
  }

  const asinsToImport = asins.filter(asin => !existingAsins.has(asin));
  const skippedCount = asins.length - asinsToImport.length;

  if (skippedCount > 0 && !isAutoResume) {
    showSPApiProgress(`Skipping ${skippedCount} already imported ASINs...`);
  }

  if (asinsToImport.length === 0) {
    clearSPApiImportState();
    return { success: 0, failed: 0, skipped: skippedCount, message: 'All ASINs already imported!' };
  }

  let success = 0;
  let failed = 0;
  const startTime = new Date().getTime();
  const maxExecutionTime = 4.5 * 60 * 1000; // 4.5 minutes

  for (let i = 0; i < asinsToImport.length; i++) {
    const asin = asinsToImport[i];

    const elapsed = new Date().getTime() - startTime;
    if (elapsed > maxExecutionTime) {
      const remainingAsins = asinsToImport.slice(i);
      Logger.log(`[SP-API] Timeout after ${Math.round(elapsed/1000)}s. ${remainingAsins.length} ASINs remaining.`);

      scheduleSPApiContinuation(remainingAsins, marketplace, options);
      showSPApiProgress(`Timeout! Imported ${success}. Auto-resume in 1 min (${remainingAsins.length} remaining)...`);

      return { success, failed, skipped: skippedCount, autoResumeScheduled: true, remaining: remainingAsins.length };
    }

    try {
      showSPApiProgress(`Fetching ${asin}... (${i + 1}/${asinsToImport.length})`);

      const productData = fetchSPApiProduct(asin, marketplaceConfig, accessToken);

      Utilities.sleep(300);

      // Fetch pricing
      try {
        const pricing = fetchSPApiPricing(asin, marketplaceConfig, accessToken);
        productData.listPrice = pricing.listPrice || productData.catalogListPrice || '';
        productData.currentPrice = pricing.currentPrice || '';
        productData.currency = pricing.currency || productData.catalogCurrency || '';
      } catch (e) {
        Logger.log(`[SP-API] Pricing error for ${asin}: ${e.message}`);
        productData.listPrice = productData.catalogListPrice || '';
        productData.currentPrice = '';
        productData.currency = productData.catalogCurrency || '';
      }

      // Add to RESEARCH sheet
      appendProductToResearchSheet(sheet, productData, marketplace);
      success++;

    } catch (error) {
      Logger.log(`[SP-API] Failed to import ${asin}: ${error.message}`);
      failed++;
    }

    Utilities.sleep(500);
  }

  clearSPApiImportState();
  return { success, failed, skipped: skippedCount };
}

// ========================================
// SEARCH BY KEYWORDS
// ========================================

function spApiSearchProducts() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'SP-API: Search Products',
    'Enter search keywords:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const searchTerm = response.getResponseText().trim();
  if (!searchTerm) {
    ui.alert('Error', 'No search term provided', ui.ButtonSet.OK);
    return;
  }

  const marketplace = showSPApiMarketplaceDialog();
  if (!marketplace) return;

  showSPApiProgress(`Searching for "${searchTerm}" in Amazon ${marketplace}...`);

  try {
    const accessToken = getSPApiAccessToken();
    const marketplaceConfig = SP_API_MARKETPLACES[marketplace];

    const searchResults = searchSPApiProducts(searchTerm, marketplaceConfig, accessToken);

    if (searchResults.length === 0) {
      ui.alert('No Results', `No products found for "${searchTerm}"`, ui.ButtonSet.OK);
      return;
    }

    const resultsList = searchResults.slice(0, 10).map(p =>
      `${p.asin} - ${p.title.substring(0, 50)}...`
    ).join('\n');

    ui.alert('Search Results', `Found ${searchResults.length} products:\n\n${resultsList}\n\n${searchResults.length > 10 ? '...and more' : ''}`, ui.ButtonSet.OK);

    const countResponse = ui.prompt(
      'How many to import?',
      `Found: ${searchResults.length} products\n\n` +
      'Enter number to import (or "all"):',
      ui.ButtonSet.OK_CANCEL
    );

    if (countResponse.getSelectedButton() !== ui.Button.OK) return;

    let countInput = countResponse.getResponseText().trim().toLowerCase();
    let importCount = searchResults.length;

    if (countInput && countInput !== 'all') {
      const parsed = parseInt(countInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        importCount = Math.min(parsed, searchResults.length);
      }
    }

    const asinsToImport = searchResults.slice(0, importCount).map(p => p.asin);
    showSPApiProgress(`Importing ${importCount} products...`);

    const results = spApiImportProducts(asinsToImport, marketplace, {});

    let resultMsg = `Imported: ${results.success}\n` +
      `Errors: ${results.failed}\n` +
      `Skipped: ${results.skipped}`;

    if (results.autoResumeScheduled) {
      resultMsg += `\n\nRemaining: ${results.remaining}`;
      resultMsg += `\nAuto-resume in 1 minute...`;
    }

    const title = results.autoResumeScheduled ? 'Import in progress...' : 'Import complete';
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, title, 30);

  } catch (error) {
    ui.alert('Error', `Search failed: ${error.message}`, ui.ButtonSet.OK);
    Logger.log(`[SP-API] Search error: ${error.message}\n${error.stack}`);
  }
}

function searchSPApiProducts(searchTerm, marketplaceConfig, accessToken) {
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

    Logger.log(`[SP-API] Search page ${pageCount + 1} for "${searchTerm}"...`);
    const response = callSPApiEndpoint('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    const items = response.items || [];
    allItems = allItems.concat(items);

    nextToken = response.pagination?.nextToken;
    pageCount++;

    if (nextToken) Utilities.sleep(300);

  } while (nextToken && pageCount < maxPages);

  return allItems.map(item => ({
    asin: item.asin,
    title: item.summaries?.[0]?.itemName || 'Unknown Title'
  }));
}

// ========================================
// FETCH PRODUCT DATA
// ========================================

function fetchSPApiProduct(asin, marketplaceConfig, accessToken) {
  const path = `/catalog/2022-04-01/items/${asin}`;
  const params = {
    marketplaceIds: marketplaceConfig.marketplaceId,
    includedData: 'attributes,images,productTypes,salesRanks,summaries,dimensions,identifiers,relationships,classifications'
  };

  const response = callSPApiEndpoint('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

  const item = response;
  const attributes = item.attributes || {};
  const summaries = item.summaries || [];
  const images = item.images || [];
  const dimensions = item.dimensions || [];
  const identifiers = item.identifiers || [];
  const salesRanks = item.salesRanks || [];

  const summary = summaries[0] || {};

  const getAttr = (name) => attributes[name]?.[0]?.value || '';
  const getAttrArray = (name) => (attributes[name] || []).map(a => a.value).filter(v => v);

  // Extract list_price from attributes
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
  }

  // Extract identifiers
  const identifiersData = {};
  for (const idGroup of identifiers) {
    if (idGroup.marketplaceId === marketplaceConfig.marketplaceId) {
      const ids = idGroup.identifiers || [];
      for (const id of ids) {
        if (id.identifierType === 'EAN') identifiersData.ean = id.identifier;
        if (id.identifierType === 'UPC') identifiersData.upc = id.identifier;
        if (id.identifierType === 'GTIN') identifiersData.gtin = id.identifier;
      }
      break;
    }
  }

  // Extract images
  const imageGroup = images[0]?.images || [];
  const mainImageURL = imageGroup.find(i => i.variant === 'MAIN')?.link || imageGroup[0]?.link || '';
  const additionalImages = imageGroup.filter(i => i.variant !== 'MAIN');

  // Extract sales rank
  let salesRank = '';
  let salesRankCategory = '';
  for (const rankGroup of salesRanks) {
    if (rankGroup.marketplaceId === marketplaceConfig.marketplaceId) {
      const classRanks = rankGroup.classificationRanks || [];
      if (classRanks.length > 0) {
        salesRank = classRanks[0]?.rank || '';
        salesRankCategory = classRanks[0]?.title || '';
      }
      break;
    }
  }

  // Extract dimensions
  const dimensionsData = {};
  for (const dim of dimensions) {
    if (dim.marketplaceId === marketplaceConfig.marketplaceId) {
      const itemDims = dim.item || {};
      const packageDims = dim.package || {};

      dimensionsData.itemWeight = itemDims.weight?.value || '';
      dimensionsData.itemWeightUnit = itemDims.weight?.unit || '';
      dimensionsData.packageWeight = packageDims.weight?.value || '';
      dimensionsData.packageWeightUnit = packageDims.weight?.unit || '';
      break;
    }
  }

  return {
    asin: asin,
    title: summary.itemName || getAttr('item_name'),
    brand: summary.brand || getAttr('brand'),
    manufacturer: getAttr('manufacturer'),
    productType: item.productTypes?.[0]?.productType || '',

    ean: identifiersData.ean || '',
    upc: identifiersData.upc || '',
    gtin: identifiersData.gtin || '',

    bulletPoint1: attributes.bullet_point?.[0]?.value || '',
    bulletPoint2: attributes.bullet_point?.[1]?.value || '',
    bulletPoint3: attributes.bullet_point?.[2]?.value || '',
    bulletPoint4: attributes.bullet_point?.[3]?.value || '',
    bulletPoint5: attributes.bullet_point?.[4]?.value || '',

    description: getAttr('product_description'),

    mainImageURL: mainImageURL,
    additionalImage1: additionalImages[0]?.link || '',
    additionalImage2: additionalImages[1]?.link || '',
    additionalImage3: additionalImages[2]?.link || '',
    additionalImage4: additionalImages[3]?.link || '',
    totalImageCount: imageGroup.length,

    catalogListPrice: catalogListPrice,
    catalogCurrency: catalogCurrency,

    salesRank: salesRank,
    salesRankCategory: salesRankCategory,

    color: getAttr('color') || getAttr('color_name') || '',
    size: getAttr('size') || getAttr('size_name') || '',
    material: getAttr('material') || getAttr('material_type') || '',

    itemWeight: dimensionsData.itemWeight || '',
    itemWeightUnit: dimensionsData.itemWeightUnit || '',

    parentAsin: getAttr('parent_asin') || '',

    importDate: new Date(),
    dataSource: 'SP-API'
  };
}

function fetchSPApiPricing(asin, marketplaceConfig, accessToken) {
  const path = `/products/pricing/v0/items/${asin}/offers`;
  const params = {
    MarketplaceId: marketplaceConfig.marketplaceId,
    ItemCondition: 'New'
  };

  const response = callSPApiEndpoint('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

  const payload = response.payload || response;
  const summary = payload.Summary || payload.summary || {};

  let listPrice = '';
  let currentPrice = '';
  let currency = 'EUR';

  const lowestPrices = summary.LowestPrices || [];

  if (lowestPrices.length > 0) {
    const fbaPrice = lowestPrices.find(p => p.fulfillmentChannel === 'Amazon');
    const merchantPrice = lowestPrices.find(p => p.fulfillmentChannel === 'Merchant');
    const bestPrice = fbaPrice || merchantPrice || lowestPrices[0];

    currentPrice = bestPrice.LandedPrice?.Amount || bestPrice.ListingPrice?.Amount || '';
    currency = bestPrice.LandedPrice?.CurrencyCode || bestPrice.ListingPrice?.CurrencyCode || 'EUR';
    listPrice = bestPrice.ListingPrice?.Amount || '';
  }

  if (!currentPrice && summary.BuyBoxPrices && summary.BuyBoxPrices.length > 0) {
    const buyBox = summary.BuyBoxPrices[0];
    currentPrice = buyBox.LandedPrice?.Amount || buyBox.ListingPrice?.Amount || '';
    currency = buyBox.LandedPrice?.CurrencyCode || currency;
  }

  return { listPrice, currentPrice, currency };
}

// ========================================
// RESEARCH SHEET OPERATIONS
// ========================================

function initializeResearchSheet(sheet) {
  const headers = [
    'Data_Source',
    'Import_Date',
    'Marketplace',
    'ASIN',
    'EAN',
    'Title',
    'Brand',
    'Manufacturer',
    'Product_Type',
    'Bullet_1',
    'Bullet_2',
    'Bullet_3',
    'Bullet_4',
    'Bullet_5',
    'Description',
    'Main_Image',
    'Image_2',
    'Image_3',
    'Image_4',
    'Image_5',
    'Image_Count',
    'List_Price',
    'Current_Price',
    'Currency',
    'Sales_Rank',
    'Sales_Rank_Category',
    'Color',
    'Size',
    'Material',
    'Weight',
    'Parent_ASIN',
    'Link'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setWrap(true);

  sheet.setFrozenRows(1);
  sheet.setColumnWidth(6, 300); // Title
  sheet.setColumnWidth(15, 400); // Description

  Logger.log(`[SP-API] RESEARCH sheet initialized with ${headers.length} columns`);
}

function appendProductToResearchSheet(sheet, productData, marketplace) {
  const germanDate = Utilities.formatDate(
    productData.importDate,
    'Europe/Berlin',
    'dd.MM.yyyy HH:mm:ss'
  );

  const link = `https://${SP_API_MARKETPLACES[marketplace].domain}/dp/${productData.asin}`;

  const rowData = [
    productData.dataSource || 'SP-API',
    germanDate,
    marketplace,
    productData.asin,
    productData.ean || '',
    productData.title || '',
    productData.brand || '',
    productData.manufacturer || '',
    productData.productType || '',
    productData.bulletPoint1 || '',
    productData.bulletPoint2 || '',
    productData.bulletPoint3 || '',
    productData.bulletPoint4 || '',
    productData.bulletPoint5 || '',
    productData.description || '',
    productData.mainImageURL || '',
    productData.additionalImage1 || '',
    productData.additionalImage2 || '',
    productData.additionalImage3 || '',
    productData.additionalImage4 || '',
    productData.totalImageCount || '',
    productData.listPrice || productData.catalogListPrice || '',
    productData.currentPrice || '',
    productData.currency || productData.catalogCurrency || '',
    productData.salesRank || '',
    productData.salesRankCategory || '',
    productData.color || '',
    productData.size || '',
    productData.material || '',
    productData.itemWeight ? `${productData.itemWeight} ${productData.itemWeightUnit}` : '',
    productData.parentAsin || '',
    link
  ];

  sheet.appendRow(rowData);
}

// ========================================
// AUTO-RESUME FUNCTIONS
// ========================================

function scheduleSPApiContinuation(remainingAsins, marketplace, options) {
  const props = PropertiesService.getScriptProperties();

  const state = {
    asins: remainingAsins,
    marketplace: marketplace,
    options: options,
    scheduledAt: new Date().toISOString()
  };

  props.setProperty('SP_API_IMPORT_RESUME_STATE', JSON.stringify(state));
  Logger.log(`[SP-API] Saved state with ${remainingAsins.length} ASINs`);

  deleteSPApiImportTriggers();

  ScriptApp.newTrigger('spApiAutoResumeImport')
    .timeBased()
    .after(60 * 1000)
    .create();

  Logger.log(`[SP-API] Trigger scheduled for 1 minute from now`);
}

function spApiAutoResumeImport() {
  Logger.log(`[SP-API] Auto-resume triggered...`);

  const props = PropertiesService.getScriptProperties();
  const stateJson = props.getProperty('SP_API_IMPORT_RESUME_STATE');

  if (!stateJson) {
    Logger.log(`[SP-API] No saved state found.`);
    deleteSPApiImportTriggers();
    return;
  }

  try {
    const state = JSON.parse(stateJson);
    Logger.log(`[SP-API] Resuming with ${state.asins.length} ASINs for ${state.marketplace}`);

    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Auto-resume: ${state.asins.length} ASINs to import...`,
        'Import continuing',
        10
      );
    } catch (e) {}

    const options = state.options || {};
    options.isAutoResume = true;

    const results = spApiImportProducts(state.asins, state.marketplace, options);

    Logger.log(`[SP-API] Batch complete: ${results.success} success, ${results.failed} failed`);

    if (!results.autoResumeScheduled) {
      try {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `Import complete! ${results.success} products imported.`,
          'Success!',
          10
        );
      } catch (e) {}
    }

  } catch (error) {
    Logger.log(`[SP-API] Auto-resume error: ${error.message}`);
    clearSPApiImportState();
  }
}

function clearSPApiImportState() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('SP_API_IMPORT_RESUME_STATE');
  deleteSPApiImportTriggers();
  Logger.log(`[SP-API] State cleared`);
}

function deleteSPApiImportTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'spApiAutoResumeImport') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`[SP-API] Deleted trigger: ${trigger.getUniqueId()}`);
    }
  }
}

function spApiCancelAutoResume() {
  clearSPApiImportState();
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto-resume cancelled.', 'Cancelled', 5);
  Logger.log(`[SP-API] Manually cancelled by user`);
}

// ========================================
// TEST CONNECTION
// ========================================

function spApiTestConnection() {
  const ui = SpreadsheetApp.getUi();

  ui.alert('Testing SP-API Connection', 'Testing credentials and connectivity...', ui.ButtonSet.OK);

  try {
    const credentials = getSPApiCredentials();

    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
      throw new Error('Missing credentials. Configure SP_API_CLIENT_ID, SP_API_CLIENT_SECRET, SP_API_REFRESH_TOKEN in Script Properties.');
    }

    const startTime = new Date().getTime();
    const accessToken = getSPApiAccessToken();

    const marketplaceConfig = SP_API_MARKETPLACES['DE'];
    const response = callSPApiEndpoint(
      'GET',
      '/catalog/2022-04-01/items',
      marketplaceConfig.marketplaceId,
      {
        marketplaceIds: marketplaceConfig.marketplaceId,
        keywords: 'laptop',
        pageSize: 1
      },
      accessToken
    );

    const responseTime = new Date().getTime() - startTime;

    ui.alert(
      'SP-API Connection Successful!',
      `Configuration: OK\n` +
      `Token Refresh: OK\n` +
      `API Call: OK\n\n` +
      `Response Time: ${responseTime}ms\n\n` +
      `Your SP-API connection is working!`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert(
      'SP-API Connection Failed',
      `Error: ${error.message}\n\n` +
      `Please check Script Properties:\n` +
      `- SP_API_CLIENT_ID\n` +
      `- SP_API_CLIENT_SECRET\n` +
      `- SP_API_REFRESH_TOKEN`,
      ui.ButtonSet.OK
    );
    Logger.log(`[SP-API] Test failed: ${error.message}`);
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function showSPApiMarketplaceDialog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Select Marketplace',
    'Enter marketplace code:\n\n' +
    'DE - Germany (default)\n' +
    'FR - France\n' +
    'UK - United Kingdom\n' +
    'IT - Italy\n' +
    'ES - Spain\n' +
    'NL - Netherlands\n' +
    'BE - Belgium\n' +
    'PL - Poland\n' +
    'SE - Sweden\n' +
    'IE - Ireland',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return null;

  let marketplace = response.getResponseText().trim().toUpperCase();
  if (!marketplace) marketplace = 'DE';

  const validMarketplaces = Object.keys(SP_API_MARKETPLACES);
  if (!validMarketplaces.includes(marketplace)) {
    ui.alert('Error', `Invalid marketplace: ${marketplace}\n\nValid: ${validMarketplaces.join(', ')}`, ui.ButtonSet.OK);
    return null;
  }

  return marketplace;
}

function showSPApiProgress(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'SP-API Processing...', 30);
}
