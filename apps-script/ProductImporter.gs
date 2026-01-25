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

  // Confirm import
  const confirmMsg = `Import ${asins.length} product(s) from Amazon ${marketplace}?\n\n` +
    `ASINs: ${asins.slice(0, 5).join(', ')}${asins.length > 5 ? '...' : ''}\n\n` +
    `This will fetch ALL available product data including:\n` +
    `- Product details\n` +
    `- Images\n` +
    `- Dimensions\n` +
    `- Seller information\n` +
    `- Pricing\n` +
    `- Inventory`;

  const confirm = ui.alert('Confirm Import', confirmMsg, ui.ButtonSet.YES_NO);

  if (confirm !== ui.Button.YES) return;

  // Import products
  showProgress(`Importing ${asins.length} products from Amazon ${marketplace}...`);

  try {
    const results = importProductsByASIN(asins, marketplace, marketplaceConfig);

    // Show results
    ui.alert(
      'Import Complete',
      `✅ Successfully imported: ${results.success}\n` +
      `❌ Failed: ${results.failed}\n` +
      `⚠️ Warnings: ${results.warnings}\n\n` +
      `Products saved to "ImportedProducts" sheet.\n` +
      `Check Logs sheet for details.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    handleError('lukoImportByASIN', error);
  }
}

function importProductsByASIN(asins, marketplace, marketplaceConfig) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ImportedProducts');

  if (!sheet) {
    // Create ImportedProducts sheet if it doesn't exist
    sheet = generateImportedProductsSheet(ss);
  }

  const credentials = getCredentials();
  const config = getConfig();
  const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

  let success = 0;
  let failed = 0;
  let warnings = 0;

  for (const asin of asins) {
    try {
      showProgress(`Fetching ${asin}... (${success + failed + 1}/${asins.length})`);

      // Fetch product data from SP-API
      const productData = fetchProductByASIN(asin, marketplaceConfig, tokens.access_token);

      // Rate limiting: wait 500ms between product fetches
      Utilities.sleep(500);

      // Fetch seller information (may fail due to permissions - that's OK)
      try {
        const sellerInfo = fetchSellerByASIN(asin, marketplaceConfig, tokens.access_token);
        productData.sellerId = sellerInfo.sellerId || '';
        productData.sellerName = sellerInfo.sellerName || '';
      } catch (e) {
        Logger.log(`Could not fetch seller info for ${asin}: ${e.message}`);
        productData.sellerId = 'N/A (requires permission)';
        productData.sellerName = '';
      }

      // Rate limiting: wait 300ms
      Utilities.sleep(300);

      // Fetch pricing (may hit rate limits - that's OK)
      try {
        const pricing = fetchProductPricing(asin, marketplaceConfig, tokens.access_token);
        productData.listPrice = pricing.listPrice || '';
        productData.currentPrice = pricing.currentPrice || '';
        productData.currency = pricing.currency || '';
      } catch (e) {
        Logger.log(`Could not fetch pricing for ${asin}: ${e.message}`);
        productData.listPrice = '';
        productData.currentPrice = '';
        productData.currency = '';
        warnings++;
      }

      // Rate limiting: wait 300ms
      Utilities.sleep(300);

      // Fetch inventory (if available)
      try {
        const inventory = fetchProductInventory(asin, marketplaceConfig, tokens.access_token);
        productData.availableQuantity = inventory.quantity || '';
      } catch (e) {
        Logger.log(`Could not fetch inventory for ${asin}: ${e.message}`);
        productData.availableQuantity = '';
        warnings++;
      }

      // Rate limiting: wait 300ms
      Utilities.sleep(300);

      // Fetch A+ Content (may fail due to permissions - that's OK)
      try {
        showProgress(`Fetching A+ Content for ${asin}...`);
        const aplusData = fetchAPlusContentByASIN(asin, marketplaceConfig, tokens.access_token);

        // Merge A+ data into product data
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
      } catch (e) {
        Logger.log(`Could not fetch A+ content for ${asin}: ${e.message}`);
        productData.hasAPlus = false;
        productData.aplusType = '';
        productData.aplusStatus = '';
        productData.aplusContentId = '';
        productData.aplusName = '';
        productData.aplusModuleCount = 0;
        productData.aplusModuleTypes = '';
        productData.aplusHeadline = '';
        productData.aplusText1 = '';
        productData.aplusText2 = '';
        productData.aplusText3 = '';
        productData.aplusImageUrl1 = '';
        productData.aplusImageUrl2 = '';
        productData.aplusImageUrl3 = '';
        productData.aplusImageUrl4 = '';
        productData.hasBrandStory = false;
        productData.brandStoryHeadline = '';
        productData.brandStoryText = '';
        productData.brandStoryImageUrl = '';
        warnings++;
      }

      // Add to sheet
      appendProductToImportedSheet(sheet, productData, marketplace);

      success++;

    } catch (error) {
      Logger.log(`Failed to import ${asin}: ${error.message}`);
      failed++;

      // Log error
      logOperations([{
        asin: asin,
        marketplace: marketplace,
        status: 'ERROR',
        message: error.message
      }], marketplace, 'IMPORT_BY_ASIN');
    }

    // Rate limiting between products: wait 1 second
    if (success + failed < asins.length) {
      Utilities.sleep(1000);
    }
  }

  return { success, failed, warnings };
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
  if (attributes.item_description) {
    Logger.log(`[FETCH DEBUG] item_description: ${JSON.stringify(attributes.item_description).substring(0, 200)}`);
  }
  if (attributes.release_date) {
    Logger.log(`[FETCH DEBUG] release_date: ${JSON.stringify(attributes.release_date)}`);
  }
  if (attributes.first_available_date) {
    Logger.log(`[FETCH DEBUG] first_available_date: ${JSON.stringify(attributes.first_available_date)}`);
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

      // Item dimensions with units
      dimensionsData.itemLength = itemDims.length?.value || '';
      dimensionsData.itemLengthUnit = itemDims.length?.unit || '';
      dimensionsData.itemWidth = itemDims.width?.value || '';
      dimensionsData.itemWidthUnit = itemDims.width?.unit || '';
      dimensionsData.itemHeight = itemDims.height?.value || '';
      dimensionsData.itemHeightUnit = itemDims.height?.unit || '';
      dimensionsData.itemWeight = itemDims.weight?.value || '';
      dimensionsData.itemWeightUnit = itemDims.weight?.unit || '';

      // Package dimensions with units
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
      // Classification ranks (category-specific)
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

      // Display group ranks (department-level)
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

      // Find parent relationship
      const parentRel = rels.find(r => r.type === 'VARIATION' && r.parentAsins);
      if (parentRel && parentRel.parentAsins?.length > 0) {
        relationshipsData.parentAsin = parentRel.parentAsins[0];
      }

      // Find child variations
      const childRels = rels.filter(r => r.type === 'VARIATION' && r.childAsins);
      if (childRels.length > 0) {
        const allChildAsins = childRels.flatMap(r => r.childAsins || []);
        relationshipsData.childAsins = allChildAsins.slice(0, 10).join(', ');
        relationshipsData.childCount = allChildAsins.length;
      }

      // Variation theme
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

        // Build category path
        const categoryPath = nodes.map(n => n.displayName).join(' > ');
        classificationsData.categoryPath = categoryPath;

        // Additional browse nodes
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

  // Get additional images (non-MAIN variants)
  const additionalImages = imageGroup.filter(i => i.variant !== 'MAIN');
  for (let i = 0; i < 8; i++) {
    imagesData[`additionalImage${i + 1}`] = additionalImages[i]?.link || '';
    imagesData[`additionalImage${i + 1}Variant`] = additionalImages[i]?.variant || '';
  }

  // Count total images
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
    pzn: identifiersData.pzn || '',  // German pharmacy number
    minsan: identifiersData.minsan || '',  // Italian pharmacy number
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
    // Try multiple attribute names for description
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
    firstAvailableDate: getAttr('first_available_date') || '',
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
 * Note: This requires Product Pricing API access and may not always be available
 */
function fetchSellerByASIN(asin, marketplaceConfig, accessToken) {
  try {
    // Try the Offers endpoint from Pricing API
    const path = `/products/pricing/v0/listings/${asin}/offers`;
    const params = {
      MarketplaceId: marketplaceConfig.marketplaceId,
      ItemCondition: 'New'
    };

    Logger.log(`[SELLER DEBUG] Fetching seller info for ${asin}...`);
    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    // Log response structure
    Logger.log(`[SELLER DEBUG] Response keys: ${Object.keys(response).join(', ')}`);

    const offers = response.Offers || response.offers || [];
    if (offers.length > 0) {
      const offer = offers[0];
      Logger.log(`[SELLER DEBUG] First offer: ${JSON.stringify(offer).substring(0, 300)}`);
      return {
        sellerId: offer.SellerId || offer.sellerId || offer.SellerSKU || '',
        sellerName: offer.SellerFeedbackRating?.SellerPositiveFeedbackRating ? `Rating: ${offer.SellerFeedbackRating.SellerPositiveFeedbackRating}%` : ''
      };
    }

  } catch (error) {
    Logger.log(`[SELLER DEBUG] Error: ${error.message}`);
    // Seller API access may be restricted - this is expected
  }

  return { sellerId: '', sellerName: '' };
}

/**
 * Fetch pricing information for an ASIN
 * Uses Product Pricing API
 */
function fetchProductPricing(asin, marketplaceConfig, accessToken) {
  try {
    // Use the correct Pricing API endpoint
    const path = `/products/pricing/v0/items/${asin}/offers`;
    const params = {
      MarketplaceId: marketplaceConfig.marketplaceId,
      ItemCondition: 'New'
    };

    Logger.log(`[PRICE DEBUG] Fetching pricing for ${asin}...`);
    const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

    // Log response structure
    Logger.log(`[PRICE DEBUG] Response keys: ${Object.keys(response).join(', ')}`);
    Logger.log(`[PRICE DEBUG] Response: ${JSON.stringify(response).substring(0, 500)}`);

    // Try different response structures
    const summary = response.Summary || response.summary || {};
    const offers = response.Offers || response.offers || [];

    let listPrice = '';
    let currentPrice = '';
    let currency = '';

    // Extract from summary
    if (summary.ListPrice) {
      listPrice = summary.ListPrice.Amount || '';
      currency = summary.ListPrice.CurrencyCode || currency;
    }

    // Extract BuyBox price
    if (summary.BuyBoxPrices && summary.BuyBoxPrices.length > 0) {
      const buyBox = summary.BuyBoxPrices[0];
      currentPrice = buyBox.LandedPrice?.Amount || buyBox.ListingPrice?.Amount || '';
      currency = buyBox.LandedPrice?.CurrencyCode || currency;
    }

    // Fallback: try to get from offers
    if (!currentPrice && offers.length > 0) {
      const offer = offers[0];
      currentPrice = offer.ListingPrice?.Amount || offer.BuyingPrice?.Amount || '';
      currency = offer.ListingPrice?.CurrencyCode || offer.BuyingPrice?.CurrencyCode || currency;
    }

    Logger.log(`[PRICE DEBUG] Extracted: listPrice=${listPrice}, currentPrice=${currentPrice}, currency=${currency}`);

    return { listPrice, currentPrice, currency };

  } catch (error) {
    Logger.log(`[PRICE DEBUG] Error: ${error.message}`);
    throw error;
  }
}

function fetchProductInventory(asin, marketplaceConfig, accessToken) {
  // Note: Inventory requires FBA API or Inventory API
  // This is a placeholder - actual implementation depends on fulfillment type
  return { quantity: '' };
}

// ========================================
// A+ CONTENT API
// ========================================

/**
 * Fetch A+ Content for an ASIN
 * Uses the A+ Content Management API
 * @param {string} asin - The ASIN to fetch A+ content for
 * @param {Object} marketplaceConfig - Marketplace configuration
 * @param {string} accessToken - SP-API access token
 * @returns {Object} A+ content data
 */
function fetchAPlusContent(asin, marketplaceConfig, accessToken) {
  try {
    // Search for A+ content documents associated with this ASIN
    const searchPath = '/aplus/2020-11-01/contentDocuments';
    const searchParams = {
      marketplaceId: marketplaceConfig.marketplaceId,
      pageToken: ''
    };

    const searchResponse = callSPAPI('GET', searchPath, marketplaceConfig.marketplaceId, searchParams, accessToken);

    const contentDocuments = searchResponse.contentMetadataRecords || [];

    // Find content that includes our ASIN
    let aplusData = {
      hasAPlus: false,
      aplusType: '',
      aplusStatus: '',
      aplusContentId: '',
      aplusName: '',
      aplusModuleCount: 0,
      aplusModuleTypes: '',
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

    // Search through content documents to find one with this ASIN
    for (const record of contentDocuments) {
      const contentReferenceKey = record.contentReferenceKey;

      // Check if this content is associated with our ASIN
      // We need to get the full content document to see the ASINs
      try {
        const contentPath = `/aplus/2020-11-01/contentDocuments/${contentReferenceKey}`;
        const contentParams = {
          marketplaceId: marketplaceConfig.marketplaceId,
          includedDataSet: 'CONTENTS'
        };

        const contentResponse = callSPAPI('GET', contentPath, marketplaceConfig.marketplaceId, contentParams, accessToken);

        const contentDocument = contentResponse.contentDocument || {};
        const contentModuleList = contentDocument.contentModuleList || [];

        // Check if this document is for our ASIN by looking at associated ASINs
        // Note: The API might not return ASIN list directly, so we'll take what we find
        if (contentDocument.contentReferenceKey) {
          aplusData.hasAPlus = true;
          aplusData.aplusContentId = contentDocument.contentReferenceKey || '';
          aplusData.aplusName = contentDocument.name || '';
          aplusData.aplusStatus = record.status || '';
          aplusData.aplusType = contentDocument.contentType || 'STANDARD';
          aplusData.aplusModuleCount = contentModuleList.length;

          // Extract module types
          const moduleTypes = contentModuleList.map(m => m.contentModuleType).filter(t => t);
          aplusData.aplusModuleTypes = moduleTypes.join(', ');

          // Extract content from modules
          let textIndex = 1;
          let imageIndex = 1;

          for (const module of contentModuleList) {
            const moduleType = module.contentModuleType || '';

            // Check for Brand Story module
            if (moduleType.includes('BRAND_STORY') || moduleType === 'STANDARD_BRAND_CONTENT_HERO') {
              aplusData.hasBrandStory = true;

              // Extract Brand Story content
              if (module.standardHeaderImageText) {
                aplusData.brandStoryHeadline = module.standardHeaderImageText.headline?.value || '';
                aplusData.brandStoryText = module.standardHeaderImageText.block?.textList?.[0]?.value || '';
                aplusData.brandStoryImageUrl = module.standardHeaderImageText.image?.imageCropSpecification?.optimizedImage?.link || '';
              }
            }

            // Extract headline from header modules
            if (module.standardHeaderTextModule) {
              aplusData.aplusHeadline = module.standardHeaderTextModule.headline?.value || aplusData.aplusHeadline;
            }

            // Extract text from various module types
            if (module.standardTextModule && textIndex <= 3) {
              const text = module.standardTextModule.body?.textList?.[0]?.value || '';
              if (text) {
                aplusData[`aplusText${textIndex}`] = text;
                textIndex++;
              }
            }

            // Extract text from comparison tables, etc.
            if (module.standardComparisonTable) {
              const headline = module.standardComparisonTable.headline?.value || '';
              if (headline && textIndex <= 3) {
                aplusData[`aplusText${textIndex}`] = headline;
                textIndex++;
              }
            }

            // Extract images from various module types
            if (module.standardSingleImageHighlights && imageIndex <= 4) {
              const img = module.standardSingleImageHighlights.image?.imageCropSpecification?.optimizedImage?.link || '';
              if (img) {
                aplusData[`aplusImageUrl${imageIndex}`] = img;
                imageIndex++;
              }
            }

            if (module.standardImageTextOverlay && imageIndex <= 4) {
              const img = module.standardImageTextOverlay.image?.imageCropSpecification?.optimizedImage?.link || '';
              if (img) {
                aplusData[`aplusImageUrl${imageIndex}`] = img;
                imageIndex++;
              }
            }

            if (module.standardFourImageText && imageIndex <= 4) {
              const images = module.standardFourImageText.fourImageTextList || [];
              for (const item of images) {
                if (imageIndex > 4) break;
                const img = item.image?.imageCropSpecification?.optimizedImage?.link || '';
                if (img) {
                  aplusData[`aplusImageUrl${imageIndex}`] = img;
                  imageIndex++;
                }
              }
            }

            // Standard image and text modules
            if (module.standardImageSidebar && imageIndex <= 4) {
              const img = module.standardImageSidebar.image?.imageCropSpecification?.optimizedImage?.link || '';
              if (img) {
                aplusData[`aplusImageUrl${imageIndex}`] = img;
                imageIndex++;
              }
            }
          }

          // Found A+ content, break the loop (take first match)
          break;
        }
      } catch (innerError) {
        Logger.log(`Could not fetch content document ${contentReferenceKey}: ${innerError.message}`);
        continue;
      }

      // Rate limiting between document fetches
      Utilities.sleep(200);
    }

    return aplusData;

  } catch (error) {
    Logger.log(`Could not fetch A+ content for ${asin}: ${error.message}`);
    return {
      hasAPlus: false,
      aplusType: '',
      aplusStatus: '',
      aplusContentId: '',
      aplusName: '',
      aplusModuleCount: 0,
      aplusModuleTypes: '',
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
  }
}

/**
 * Fetch A+ Content by ASIN using content association
 * Searches through all content documents to find the one associated with this ASIN
 */
function fetchAPlusContentByASIN(asin, marketplaceConfig, accessToken) {
  const emptyResult = {
    hasAPlus: false,
    aplusType: '',
    aplusStatus: '',
    aplusContentId: '',
    aplusName: '',
    aplusModuleCount: 0,
    aplusModuleTypes: '',
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

  try {
    // Get ALL content documents with pagination
    let allContentRecords = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 5; // Safety limit

    do {
      const path = '/aplus/2020-11-01/contentDocuments';
      const params = {
        marketplaceId: marketplaceConfig.marketplaceId
      };
      if (pageToken) {
        params.pageToken = pageToken;
      }

      Logger.log(`[A+ DEBUG] Fetching A+ content list (page ${pageCount + 1})`);
      const response = callSPAPI('GET', path, marketplaceConfig.marketplaceId, params, accessToken);

      const contentRecords = response.contentMetadataRecords || [];
      allContentRecords = allContentRecords.concat(contentRecords);

      pageToken = response.nextPageToken;
      pageCount++;

      Logger.log(`[A+ DEBUG] Page ${pageCount}: Found ${contentRecords.length} records. Total so far: ${allContentRecords.length}`);

      // Rate limiting
      if (pageToken) {
        Utilities.sleep(100);
      }
    } while (pageToken && pageCount < maxPages);

    Logger.log(`[A+ DEBUG] Total content records found: ${allContentRecords.length}`);

    if (allContentRecords.length === 0) {
      Logger.log(`[A+ DEBUG] No A+ content documents found`);
      return emptyResult;
    }

    // Search through ALL content documents to find the one associated with our ASIN
    for (let i = 0; i < allContentRecords.length; i++) {
      const record = allContentRecords[i];
      const contentReferenceKey = record.contentReferenceKey;
      const contentName = record.contentMetadata?.name || contentReferenceKey;

      try {
        // Check which ASINs are associated with this content document
        const asinsPath = `/aplus/2020-11-01/contentDocuments/${contentReferenceKey}/asins`;
        const asinsParams = {
          marketplaceId: marketplaceConfig.marketplaceId
        };

        Logger.log(`[A+ DEBUG] [${i + 1}/${allContentRecords.length}] Checking: ${contentName}`);
        const asinsResponse = callSPAPI('GET', asinsPath, marketplaceConfig.marketplaceId, asinsParams, accessToken);

        const asinMetadataSet = asinsResponse.asinMetadataSet || [];
        const associatedAsins = asinMetadataSet.map(a => a.asin);

        // Check if our ASIN is in the list
        if (associatedAsins.includes(asin)) {
          Logger.log(`[A+ DEBUG] ✓ FOUND! "${contentName}" is associated with ASIN ${asin}`);

          // Fetch full content
          const contentPath = `/aplus/2020-11-01/contentDocuments/${contentReferenceKey}`;
          const contentParams = {
            marketplaceId: marketplaceConfig.marketplaceId,
            includedDataSet: 'CONTENTS'
          };

          const contentResponse = callSPAPI('GET', contentPath, marketplaceConfig.marketplaceId, contentParams, accessToken);
          return parseAPlusContentDocument(contentResponse, record);
        }

        // Rate limiting between API calls
        Utilities.sleep(50);

      } catch (innerError) {
        Logger.log(`[A+ DEBUG] Error checking content ${contentReferenceKey}: ${innerError.message}`);
        continue;
      }
    }

    Logger.log(`[A+ DEBUG] No A+ content found associated with ASIN ${asin} after checking ALL ${allContentRecords.length} documents`);
    return emptyResult;

  } catch (error) {
    Logger.log(`[A+ DEBUG] ERROR fetching A+ for ${asin}: ${error.message}`);
    return emptyResult;
  }
}

/**
 * Parse A+ Content document into structured data
 */
function parseAPlusContentDocument(contentResponse, metadata) {
  Logger.log(`[A+ PARSE] Starting parse. Metadata: ${JSON.stringify(metadata).substring(0, 300)}`);
  Logger.log(`[A+ PARSE] Top-level response keys: ${Object.keys(contentResponse).join(', ')}`);

  // API returns contentRecord.contentDocument, NOT contentDocument directly!
  const contentRecord = contentResponse.contentRecord || {};
  const contentDocument = contentRecord.contentDocument || contentResponse.contentDocument || {};

  Logger.log(`[A+ PARSE] contentRecord keys: ${Object.keys(contentRecord).join(', ')}`);
  Logger.log(`[A+ PARSE] contentDocument keys: ${Object.keys(contentDocument).join(', ')}`);

  const contentModuleList = contentDocument.contentModuleList || [];
  Logger.log(`[A+ PARSE] Found ${contentModuleList.length} modules`);

  if (contentModuleList.length > 0) {
    Logger.log(`[A+ PARSE] First module type: ${contentModuleList[0].contentModuleType}`);
    Logger.log(`[A+ PARSE] First module keys: ${Object.keys(contentModuleList[0]).join(', ')}`);
  }

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
    Logger.log(`[A+ PARSE] Processing module: ${moduleType}`);

    // Brand Story detection
    if (moduleType.includes('BRAND') || moduleType.includes('HERO')) {
      aplusData.hasBrandStory = true;
    }

    // Extract headline from various module types
    // API uses: standardText, standardHeaderText (NOT standardTextModule, standardHeaderTextModule!)
    if (module.standardHeaderText?.headline?.value && !aplusData.aplusHeadline) {
      aplusData.aplusHeadline = module.standardHeaderText.headline.value;
      Logger.log(`[A+ PARSE] Found headline in standardHeaderText: ${aplusData.aplusHeadline.substring(0, 50)}`);
    }

    // Extract texts from STANDARD_TEXT module
    // The actual API structure is: module.standardText.headline.value and module.standardText.body.textList[0].value
    const textSources = [
      // STANDARD_TEXT module
      module.standardText?.headline?.value,
      module.standardText?.body?.textList?.[0]?.value,
      // STANDARD_HEADER_TEXT module
      module.standardHeaderText?.headline?.value,
      module.standardHeaderText?.body?.textList?.[0]?.value,
      // Comparison table
      module.standardComparisonTable?.headline?.value,
      // Single image highlights
      module.standardSingleImageHighlights?.headline?.value,
      // Image sidebar
      module.standardImageSidebar?.descriptionTextBlock?.body?.textList?.[0]?.value,
      // Multiple image text
      module.standardMultipleImageText?.headline?.value,
      // Product description
      module.standardProductDescription?.body?.textList?.[0]?.value
    ];

    for (const text of textSources) {
      if (text && textIndex <= 3) {
        aplusData[`aplusText${textIndex}`] = text.substring(0, 1000);
        Logger.log(`[A+ PARSE] Found text ${textIndex}: ${text.substring(0, 50)}...`);
        textIndex++;
      }
    }

    // Extract images from various module types
    // Log module structure for debugging
    if (module.standardSingleSideImage) {
      Logger.log(`[A+ PARSE] standardSingleSideImage keys: ${JSON.stringify(Object.keys(module.standardSingleSideImage))}`);
      Logger.log(`[A+ PARSE] standardSingleSideImage content: ${JSON.stringify(module.standardSingleSideImage).substring(0, 500)}`);
    }

    // API uses different image structures - try multiple paths
    const imageSources = [
      // Single image highlights
      module.standardSingleImageHighlights?.image?.imageCropSpecification?.optimizedImage?.link,
      // Image text overlay
      module.standardImageTextOverlay?.image?.imageCropSpecification?.optimizedImage?.link,
      // Image sidebar
      module.standardImageSidebar?.image?.imageCropSpecification?.optimizedImage?.link,
      // Header image text
      module.standardHeaderImageText?.image?.imageCropSpecification?.optimizedImage?.link,

      // Single side image - try multiple paths
      module.standardSingleSideImage?.imageCropSpecification?.optimizedImage?.link,
      module.standardSingleSideImage?.image?.imageCropSpecification?.optimizedImage?.link,
      module.standardSingleSideImage?.imageLocator?.link,
      module.standardSingleSideImage?.altText ? `[Image: ${module.standardSingleSideImage.altText}]` : null,

      // Company logo
      module.standardCompanyLogo?.image?.imageCropSpecification?.optimizedImage?.link,

      // Tech specs image
      module.standardTechSpecs?.image?.imageCropSpecification?.optimizedImage?.link,

      // Four image text
      ...(module.standardFourImageText?.fourImageTextList || []).map(i => i.image?.imageCropSpecification?.optimizedImage?.link),

      // Multiple image text
      ...(module.standardMultipleImageText?.imageTextList || []).map(i => i.image?.imageCropSpecification?.optimizedImage?.link),

      // Three image text
      ...(module.standardThreeImageText?.imageTextList || []).map(i => i.image?.imageCropSpecification?.optimizedImage?.link)
    ];

    for (const img of imageSources) {
      if (img && imageIndex <= 4 && !img.startsWith('[Image:')) {
        aplusData[`aplusImageUrl${imageIndex}`] = img;
        Logger.log(`[A+ PARSE] Found image ${imageIndex}: ${img.substring(0, 60)}...`);
        imageIndex++;
      }
    }

    // Extract from four-image modules
    if (module.standardFourImageText?.fourImageTextList) {
      for (const item of module.standardFourImageText.fourImageTextList) {
        if (imageIndex > 4) break;
        const img = item.image?.imageCropSpecification?.optimizedImage?.link;
        if (img) {
          aplusData[`aplusImageUrl${imageIndex}`] = img;
          imageIndex++;
        }
      }
    }
  }

  Logger.log(`[A+ PARSE] Final result - Headline: ${aplusData.aplusHeadline?.substring(0, 30) || 'none'}, Texts: ${textIndex - 1}, Images: ${imageIndex - 1}`);

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
  if (!marketplace) return; // User cancelled

  const marketplaceConfig = getMarketplaceConfig(marketplace);

  showProgress(`Searching for "${searchTerm}" in Amazon ${marketplace}...`);

  try {
    const credentials = getCredentials();
    const config = getConfig();
    const tokens = getAccessTokenFromRefresh(credentials.refreshToken, config);

    // Search using Catalog API
    const searchResults = searchProductsByKeyword(searchTerm, marketplaceConfig, tokens.access_token);

    if (searchResults.length === 0) {
      ui.alert('Brak wyników', `Nie znaleziono produktów dla "${searchTerm}"`, ui.ButtonSet.OK);
      return;
    }

    // Show results and ask how many to import
    const resultsList = searchResults.slice(0, 10).map(p =>
      `${p.asin} - ${p.title.substring(0, 50)}...`
    ).join('\n');

    const infoMsg = `Znaleziono ${searchResults.length} produktów:\n\n${resultsList}\n\n` +
      `${searchResults.length > 10 ? '...i więcej\n\n' : ''}`;

    ui.alert('Wyniki wyszukiwania', infoMsg, ui.ButtonSet.OK);

    // Ask how many to import
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
    let importCount = searchResults.length; // Default: all

    if (countInput === '0') {
      return; // Cancel
    } else if (countInput && countInput !== 'all' && countInput !== '') {
      const parsed = parseInt(countInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        importCount = Math.min(parsed, searchResults.length);
      }
    }

    // Confirm import
    const confirmMsg = `Zaimportować ${importCount} z ${searchResults.length} produktów?`;
    const confirm = ui.alert('Potwierdź import', confirmMsg, ui.ButtonSet.YES_NO);

    if (confirm !== ui.Button.YES) return;

    // Import selected number of products
    const asinsToImport = searchResults.slice(0, importCount).map(p => p.asin);
    showProgress(`Importuję ${importCount} produktów...`);

    const results = importProductsByASIN(asinsToImport, marketplace, marketplaceConfig);

    ui.alert(
      'Import zakończony',
      `✅ Zaimportowano: ${results.success}\n` +
      `❌ Błędy: ${results.failed}\n` +
      `⚠️ Ostrzeżenia: ${results.warnings}\n\n` +
      `Produkty zapisane w arkuszu "ImportedProducts".`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    handleError('lukoSearchProducts', error);
  }
}

/**
 * Search products by keyword with pagination
 * Fetches ALL results from Amazon
 */
function searchProductsByKeyword(searchTerm, marketplaceConfig, accessToken) {
  const path = '/catalog/2022-04-01/items';
  let allItems = [];
  let nextToken = null;
  let pageCount = 0;
  const maxPages = 10; // Safety limit (10 pages x 20 items = 200 max)

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

    // Rate limiting
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
 * This is a comprehensive sheet with 100+ columns for all Amazon product data
 */
function generateImportedProductsSheet(ss) {
  let sheet = ss.getSheetByName('ImportedProducts');

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('ImportedProducts');

  // Unfreeze columns
  sheet.setFrozenColumns(0);

  // Headers - organized by category
  const headers = [
    // === CONTROL ===
    '☑️ Use',
    'Import Date',
    'Imported By',
    'Marketplace',

    // === PRIMARY IDENTIFIERS ===
    'ASIN',
    'SKU',
    'EAN',
    'UPC',
    'ISBN',
    'GTIN',
    'GCID',
    'PZN',
    'MINSAN',
    'Part Number',
    'Item Model Number',

    // === SELLER INFO ===
    'Seller ID',
    'Seller Name',

    // === BASIC INFO ===
    'Product Type',
    'Title',
    'Brand',
    'Manufacturer',

    // === BULLET POINTS ===
    'Bullet Point 1',
    'Bullet Point 2',
    'Bullet Point 3',
    'Bullet Point 4',
    'Bullet Point 5',
    'Bullet Point 6',
    'Bullet Point 7',
    'Bullet Point 8',
    'Bullet Point 9',

    // === DESCRIPTIONS ===
    'Description',
    'Short Description',
    'Long Description',

    // === IMAGES ===
    'Main Image URL',
    'Main Image Height',
    'Main Image Width',
    'Additional Image 1',
    'Additional Image 2',
    'Additional Image 3',
    'Additional Image 4',
    'Additional Image 5',
    'Additional Image 6',
    'Additional Image 7',
    'Additional Image 8',
    'Total Image Count',

    // === PRICING ===
    'List Price',
    'Current Price',
    'Currency',

    // === INVENTORY ===
    'Available Quantity',

    // === ITEM DIMENSIONS ===
    'Item Length',
    'Item Length Unit',
    'Item Width',
    'Item Width Unit',
    'Item Height',
    'Item Height Unit',
    'Item Weight',
    'Item Weight Unit',

    // === PACKAGE DIMENSIONS ===
    'Package Length',
    'Package Length Unit',
    'Package Width',
    'Package Width Unit',
    'Package Height',
    'Package Height Unit',
    'Package Weight',
    'Package Weight Unit',

    // === SALES RANKS ===
    'Sales Rank 1',
    'Sales Rank 1 Category',
    'Sales Rank 2',
    'Sales Rank 2 Category',
    'Sales Rank 3',
    'Sales Rank 3 Category',
    'Display Group Rank',
    'Display Group Name',

    // === BROWSE NODES / CLASSIFICATIONS ===
    'Browse Node ID',
    'Browse Node Name',
    'Category Path',
    'Browse Node 2 ID',
    'Browse Node 2 Name',

    // === VARIATIONS / RELATIONSHIPS ===
    'Parent ASIN',
    'Child ASINs',
    'Child Count',
    'Variation Theme',

    // === PRODUCT ATTRIBUTES ===
    'Color',
    'Color Map',
    'Size',
    'Size Map',
    'Material',
    'Style',
    'Pattern',

    // === ADDITIONAL INFO ===
    'Model Number',
    'Release Date',
    'First Available Date',
    'Package Quantity',
    'Unit Count',
    'Unit Count Type',
    'Country of Origin',

    // === WARRANTY & SUPPORT ===
    'Warranty',
    'Warranty Type',
    'Legal Disclaimer',

    // === SAFETY & COMPLIANCE ===
    'Safety Warning',
    'Hazmat Type',
    'Battery Type',
    'Battery Weight',
    'Number of Batteries',
    'Lithium Battery Weight',
    'Lithium Battery Energy Content',

    // === TARGET AUDIENCE ===
    'Target Gender',
    'Age Range',
    'Recommended Age',
    'Item Form Type',

    // === PRODUCT TYPE SPECIFIC ===
    'Department',
    'Generic Keywords',
    'Platinum Keywords',
    'Search Terms',

    // === SHIPPING & AVAILABILITY ===
    'Is Gift Wrap Available',
    'Is Discontinued',
    'Item Condition',

    // === SUMMARY FIELDS ===
    'Contributors',
    'Item Classification',
    'Website Display Group',
    'Website Display Group Name',

    // === A+ CONTENT ===
    'Has A+',
    'A+ Type',
    'A+ Status',
    'A+ Content ID',
    'A+ Name',
    'A+ Module Count',
    'A+ Module Types',
    'A+ Headline',
    'A+ Text 1',
    'A+ Text 2',
    'A+ Text 3',
    'A+ Image URL 1',
    'A+ Image URL 2',
    'A+ Image URL 3',
    'A+ Image URL 4',

    // === BRAND STORY ===
    'Has Brand Story',
    'Brand Story Headline',
    'Brand Story Text',
    'Brand Story Image URL',

    // === NOTES ===
    'Notes'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format headers with different colors for each section
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setFontWeight('bold')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');

  // Set column widths for key columns
  sheet.setColumnWidth(1, 50);   // Checkbox
  sheet.setColumnWidth(2, 120);  // Import Date
  sheet.setColumnWidth(5, 120);  // ASIN
  sheet.setColumnWidth(20, 300); // Title
  sheet.setColumnWidth(24, 400); // Bullet Point 1
  sheet.setColumnWidth(33, 400); // Description

  // Freeze header row and first few columns
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(5);

  // Add data validation for checkbox
  const checkboxRange = sheet.getRange('A2:A1000');
  checkboxRange.insertCheckboxes();

  // Add conditional formatting for Sales Rank (green = good rank)
  const salesRankRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(1000)
    .setBackground('#C6EFCE')
    .setRanges([sheet.getRange('BQ2:BQ1000')])
    .build();

  const rules = [salesRankRule];
  sheet.setConditionalFormatRules(rules);

  Logger.log(`ImportedProducts sheet generated with ${headers.length} columns`);

  return sheet;
}

function appendProductToImportedSheet(sheet, productData, marketplace) {
  // Row data must match the headers order in generateImportedProductsSheet
  // Format date in German format with German timezone
  const germanDate = Utilities.formatDate(
    productData.importDate,
    'Europe/Berlin',
    'dd.MM.yyyy HH:mm:ss'
  );

  const rowData = [
    // === CONTROL ===
    '', // empty for checkbox (insertCheckboxes makes it unchecked)
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
    productData.hasAPlus ? 'Tak' : 'Brak dostępu',
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
    productData.hasBrandStory ? 'Tak' : 'Brak dostępu',
    productData.brandStoryHeadline || '',
    productData.brandStoryText || '',
    productData.brandStoryImageUrl || '',

    // === NOTES ===
    '' // Notes column for user input
  ];

  sheet.appendRow(rowData);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Show marketplace selection dialog
 * Returns selected marketplace code or null if cancelled
 * Default is DE if user leaves input empty
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
  if (!marketplace) marketplace = 'DE'; // Default to DE

  const validMarketplaces = ['DE', 'FR', 'UK', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'IE'];
  if (!validMarketplaces.includes(marketplace)) {
    showError(`Nieprawidłowy marketplace: ${marketplace}\n\nDostępne: ${validMarketplaces.join(', ')}`);
    return null;
  }

  return marketplace;
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
 * Can be run directly from Apps Script editor
 */
function lukoFixImportedProductsHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ImportedProducts');

  if (!sheet) {
    Logger.log('ERROR: ImportedProducts sheet not found!');
    return;
  }

  const headers = [
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
    'Notes'
  ];

  // Write headers to row 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');

  // Freeze
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(5);

  Logger.log(`SUCCESS: Headers fixed! Total: ${headers.length} columns`);
}

/**
 * Regenerate ImportedProducts sheet (WARNING: deletes existing data!)
 * Can be run directly from Apps Script editor
 */
function lukoRegenerateImportedProductsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('WARNING: Regenerating ImportedProducts sheet - existing data will be deleted!');

  generateImportedProductsSheet(ss);

  Logger.log('SUCCESS: ImportedProducts sheet has been regenerated with all columns including A+ Content and Brand Story.');
}
