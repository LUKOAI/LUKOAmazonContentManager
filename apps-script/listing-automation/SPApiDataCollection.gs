/**
 * SP-API Data Collection for AmazonListingAutomation
 * Fetches product data via Amazon SP-API and writes to RESEARCH tab
 *
 * Works alongside existing PA-API data collection.
 * Adds "Data_Source" column to distinguish SP-API vs PA-API data.
 *
 * SP-API endpoints used:
 * - /catalog/2022-04-01/items/{asin} - Product details (attributes, images, identifiers, salesRanks, etc.)
 * - /catalog/2022-04-01/items - Search by keyword
 * - /products/pricing/v0/items/{asin}/offers - Pricing & seller info
 * - /aplus/2020-11-01/contentDocuments - A+ Content (optional)
 *
 * @version 1.0
 * @author NetAnaliza / LUKO
 */

// ==================== RESEARCH TAB COLUMN DEFINITIONS ====================

/**
 * Column headers for SP-API data in RESEARCH tab
 * These columns are appended to the right if they don't already exist
 */
const SP_RESEARCH_HEADERS = [
  'Data_Source',       // SP-API or PA-API
  'Fetch_Date',        // When data was fetched
  'Marketplace',       // DE, FR, UK, etc.
  'ASIN',
  'Title',
  'Brand',
  'Manufacturer',
  'Product_Type',

  // Identifiers
  'EAN',
  'UPC',
  'GTIN',

  // Bullet Points
  'Bullet_1',
  'Bullet_2',
  'Bullet_3',
  'Bullet_4',
  'Bullet_5',

  // Description
  'Description',

  // Images
  'Main_Image_URL',
  'Image_Count',
  'Image_2_URL',
  'Image_3_URL',
  'Image_4_URL',
  'Image_5_URL',
  'Image_6_URL',
  'Image_7_URL',

  // Pricing
  'List_Price',
  'Current_Price',
  'Currency',

  // Dimensions
  'Item_Weight',
  'Item_Weight_Unit',
  'Package_Weight',
  'Package_Weight_Unit',

  // Sales Ranks
  'Sales_Rank_1',
  'Sales_Rank_1_Category',
  'Sales_Rank_2',
  'Sales_Rank_2_Category',
  'Display_Group_Rank',
  'Display_Group_Name',

  // Categories
  'Browse_Node_ID',
  'Browse_Node_Name',
  'Category_Path',

  // Variations
  'Parent_ASIN',
  'Variation_Theme',
  'Child_Count',

  // Product Attributes
  'Color',
  'Size',
  'Material',

  // A+ Content
  'Has_APlus',
  'APlus_Type',
  'APlus_Module_Count',

  // Seller
  'Seller_ID',
  'Seller_Info',

  // Link
  'Amazon_Link'
];

// ==================== MENU FUNCTIONS ====================

/**
 * Menu: Fetch single ASIN via SP-API
 */
function menuSPApiFetchByASIN() {
  const ui = SpreadsheetApp.getUi();

  if (!spHasCredentials()) {
    ui.alert('SP-API nie skonfigurowane',
      'Brak danych SP-API.\n\nUruchom: SP-API Data Collection > Setup SP-API Credentials',
      ui.ButtonSet.OK);
    return;
  }

  const response = ui.prompt(
    'SP-API: Pobierz produkt po ASIN',
    'Wpisz ASIN(y) do pobrania:\n\n' +
    'Jeden: B08N5WRWNW\n' +
    'Wiele: B08N5WRWNW, B07XJ8C8F5, B09PMHKQXR\n\n' +
    'Oddziel przecinkami.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const input = response.getResponseText().trim();
  if (!input) return;

  const asins = input.split(',').map(a => a.trim().toUpperCase()).filter(a => /^[A-Z0-9]{10}$/.test(a));

  if (asins.length === 0) {
    ui.alert('Blad', 'Nie znaleziono prawidlowych ASIN-ow.\nASIN = 10 znakow alfanumerycznych (np. B08N5WRWNW)', ui.ButtonSet.OK);
    return;
  }

  // Select marketplace
  const marketplace = spShowMarketplaceSelector();
  if (!marketplace) return;

  // Ask about A+ Content
  const aplusConfirm = ui.alert(
    'A+ Content',
    'Sprawdzac A+ Content?\n\n' +
    'TAK = Sprawdzaj (wolniej, ~2s/produkt)\n' +
    'NIE = Pomin (szybciej)\n\n' +
    'A+ dziala tylko dla produktow Twojej marki.',
    ui.ButtonSet.YES_NO
  );
  const checkAPlus = (aplusConfirm === ui.Button.YES);

  // Confirm
  const confirmMsg = `Pobrac ${asins.length} produkt(ow) z Amazon ${marketplace} przez SP-API?\n\n` +
    `ASIN: ${asins.slice(0, 5).join(', ')}${asins.length > 5 ? '...' : ''}\n` +
    `A+ Content: ${checkAPlus ? 'TAK' : 'POMINIETE'}\n` +
    `Dane zapisane w: RESEARCH tab (Data_Source = SP-API)`;

  if (ui.alert('Potwierdzenie', confirmMsg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  // Execute
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Pobieram ${asins.length} produktow z SP-API...`, 'SP-API', 30);
    const results = spFetchAndWriteProducts(asins, marketplace, { checkAPlus });

    let resultMsg = `Zaimportowano: ${results.success}\n` +
      `Bledy: ${results.failed}\n` +
      `Pominiete (duplikaty): ${results.skipped}`;

    if (results.errors.length > 0) {
      resultMsg += '\n\nBledy:\n' + results.errors.slice(0, 5).join('\n');
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, 'SP-API - zakonczone', 15);

  } catch (error) {
    ui.alert('SP-API Blad', `Wystapil blad:\n\n${error.message}`, ui.ButtonSet.OK);
    Logger.log(`[SP-API] Error in menuSPApiFetchByASIN: ${error.message}`);
  }
}

/**
 * Menu: Search products by keyword via SP-API
 */
function menuSPApiSearchByKeyword() {
  const ui = SpreadsheetApp.getUi();

  if (!spHasCredentials()) {
    ui.alert('SP-API nie skonfigurowane',
      'Brak danych SP-API.\n\nUruchom: SP-API Data Collection > Setup SP-API Credentials',
      ui.ButtonSet.OK);
    return;
  }

  const response = ui.prompt(
    'SP-API: Szukaj produktow',
    'Wpisz fraze do wyszukania (np. "laptop", "butelka termiczna"):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const searchTerm = response.getResponseText().trim();
  if (!searchTerm) return;

  const marketplace = spShowMarketplaceSelector();
  if (!marketplace) return;

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Szukam "${searchTerm}" w Amazon ${marketplace}...`, 'SP-API', 30);

    const accessToken = spGetAccessToken();
    const mpConfig = SP_MARKETPLACE_CONFIG[marketplace];

    // Search with pagination (up to 5 pages = 100 results)
    const searchResults = spSearchProducts(searchTerm, mpConfig, accessToken, 5);

    if (searchResults.length === 0) {
      ui.alert('Brak wynikow', `Nie znaleziono produktow dla "${searchTerm}" w ${marketplace}.`, ui.ButtonSet.OK);
      return;
    }

    // Show preview of results
    const preview = searchResults.slice(0, 10).map(r => `${r.asin} - ${(r.title || '').substring(0, 60)}`).join('\n');
    const countResponse = ui.prompt(
      `Znaleziono: ${searchResults.length} produktow`,
      `Przyklad:\n${preview}\n\n` +
      `Ile produktow zaimportowac do RESEARCH tab?\n` +
      `Wpisz liczbe (np. 10, 50) lub "all" dla wszystkich.\n` +
      `Wpisz "0" aby anulowac.`,
      ui.ButtonSet.OK_CANCEL
    );

    if (countResponse.getSelectedButton() !== ui.Button.OK) return;

    let countInput = countResponse.getResponseText().trim().toLowerCase();
    if (countInput === '0') return;

    let importCount = searchResults.length;
    if (countInput && countInput !== 'all' && countInput !== '') {
      const parsed = parseInt(countInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        importCount = Math.min(parsed, searchResults.length);
      }
    }

    const asinsToImport = searchResults.slice(0, importCount).map(r => r.asin);

    SpreadsheetApp.getActiveSpreadsheet().toast(`Importuje ${asinsToImport.length} produktow...`, 'SP-API', 30);
    const results = spFetchAndWriteProducts(asinsToImport, marketplace, { checkAPlus: false });

    let resultMsg = `Zaimportowano: ${results.success}\nBledy: ${results.failed}\nPominiete: ${results.skipped}`;
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, 'SP-API - zakonczone', 15);

  } catch (error) {
    ui.alert('SP-API Blad', `Wystapil blad:\n\n${error.message}`, ui.ButtonSet.OK);
    Logger.log(`[SP-API] Error in menuSPApiSearchByKeyword: ${error.message}`);
  }
}

/**
 * Menu: Fetch ASIN from selected cell in RESEARCH tab
 */
function menuSPApiFetchFromSelection() {
  const ui = SpreadsheetApp.getUi();

  if (!spHasCredentials()) {
    ui.alert('SP-API nie skonfigurowane',
      'Brak danych SP-API.\n\nUruchom: SP-API Data Collection > Setup SP-API Credentials',
      ui.ButtonSet.OK);
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const selection = sheet.getActiveRange();

  if (!selection) {
    ui.alert('Zaznacz komorki', 'Zaznacz komorki z ASIN-ami i sprobuj ponownie.', ui.ButtonSet.OK);
    return;
  }

  // Extract ASINs from selection
  const values = selection.getValues();
  const asins = [];
  for (const row of values) {
    for (const cell of row) {
      const val = cell.toString().trim().toUpperCase();
      if (/^[A-Z0-9]{10}$/.test(val)) {
        asins.push(val);
      }
    }
  }

  if (asins.length === 0) {
    ui.alert('Brak ASIN', 'Zaznaczone komorki nie zawieraja prawidlowych ASIN-ow.', ui.ButtonSet.OK);
    return;
  }

  const marketplace = spShowMarketplaceSelector();
  if (!marketplace) return;

  const confirmMsg = `Pobrac ${asins.length} ASIN(ow) z Amazon ${marketplace}?\n\n` +
    `${asins.slice(0, 10).join(', ')}${asins.length > 10 ? '...' : ''}`;

  if (ui.alert('Potwierdzenie', confirmMsg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Pobieram ${asins.length} produktow...`, 'SP-API', 30);
    const results = spFetchAndWriteProducts(asins, marketplace, { checkAPlus: false });
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Gotowe! Dodano: ${results.success}, Bledy: ${results.failed}, Pominiete: ${results.skipped}`,
      'SP-API', 10
    );
  } catch (error) {
    ui.alert('SP-API Blad', error.message, ui.ButtonSet.OK);
  }
}

// ==================== CORE DATA COLLECTION ====================

/**
 * Fetch product data for multiple ASINs and write to RESEARCH tab
 * @param {string[]} asins - Array of ASINs to fetch
 * @param {string} marketplace - Marketplace code (DE, FR, etc.)
 * @param {Object} options - { checkAPlus: boolean }
 * @returns {Object} { success, failed, skipped, errors }
 */
function spFetchAndWriteProducts(asins, marketplace, options) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mpConfig = SP_MARKETPLACE_CONFIG[marketplace];

  if (!mpConfig) throw new Error(`Unknown marketplace: ${marketplace}`);

  // Ensure RESEARCH tab exists with proper headers
  const researchSheet = spEnsureResearchSheet(ss);

  // Get existing ASIN+Marketplace+DataSource combinations to avoid duplicates
  const existing = spGetExistingKeys(researchSheet);

  // Get access token once
  const accessToken = spGetAccessToken();

  const results = { success: 0, failed: 0, skipped: 0, errors: [] };
  const startTime = Date.now();
  const maxTime = 4.5 * 60 * 1000; // 4.5 min safety margin

  // Pre-fetch A+ cache if needed
  let aplusCache = null;
  if (options.checkAPlus) {
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast('Laduje cache A+ Content...', 'SP-API', 30);
      aplusCache = spFetchAPlusCache(mpConfig, accessToken);
      Logger.log(`[SP-API] A+ cache: ${Object.keys(aplusCache.asinToContent).length} ASIN mappings`);
    } catch (e) {
      Logger.log(`[SP-API] A+ cache failed: ${e.message}`);
      aplusCache = { allRecords: [], asinToContent: {} };
    }
  }

  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];

    // Time check
    if (Date.now() - startTime > maxTime) {
      Logger.log(`[SP-API] Timeout after ${i} products. Remaining: ${asins.length - i}`);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Timeout! Zaimportowano ${results.success}. Pozostalo: ${asins.length - i}`,
        'SP-API', 10
      );
      break;
    }

    // Duplicate check
    const key = `${asin}|${marketplace}|SP-API`;
    if (existing.has(key)) {
      results.skipped++;
      continue;
    }

    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Pobieram ${asin} (${i + 1}/${asins.length})...`, 'SP-API', 30
      );

      // Fetch product data
      const productData = spFetchProductData(asin, mpConfig, accessToken);
      Utilities.sleep(300);

      // Fetch pricing
      try {
        const pricing = spFetchPricing(asin, mpConfig, accessToken);
        productData.listPrice = pricing.listPrice || productData.catalogListPrice || '';
        productData.currentPrice = pricing.currentPrice || '';
        productData.priceCurrency = pricing.currency || productData.catalogCurrency || '';
        productData.sellerId = pricing.sellerId || '';
        productData.sellerInfo = pricing.sellerInfo || '';
      } catch (e) {
        Logger.log(`[SP-API] Pricing failed for ${asin}: ${e.message}`);
        productData.listPrice = productData.catalogListPrice || '';
        productData.currentPrice = '';
        productData.priceCurrency = productData.catalogCurrency || '';
        productData.sellerId = '';
        productData.sellerInfo = '';
      }
      Utilities.sleep(200);

      // A+ Content
      if (options.checkAPlus && aplusCache) {
        const aplusData = spGetAPlusForASIN(asin, aplusCache, mpConfig, accessToken);
        productData.hasAPlus = aplusData.hasAPlus;
        productData.aplusType = aplusData.aplusType;
        productData.aplusModuleCount = aplusData.aplusModuleCount;
      }

      // Write to RESEARCH tab
      spAppendToResearchSheet(researchSheet, productData, marketplace);
      existing.add(key);
      results.success++;

    } catch (error) {
      Logger.log(`[SP-API] Failed to fetch ${asin}: ${error.message}`);
      results.failed++;
      results.errors.push(`${asin}: ${error.message}`);
    }

    Utilities.sleep(500);
  }

  return results;
}

/**
 * Fetch product details from SP-API Catalog Items API
 */
function spFetchProductData(asin, mpConfig, accessToken) {
  const path = `/catalog/2022-04-01/items/${asin}`;
  const params = {
    marketplaceIds: mpConfig.marketplaceId,
    includedData: 'attributes,images,productTypes,salesRanks,summaries,dimensions,identifiers,relationships,classifications'
  };

  const response = spCallAPI('GET', path, params, accessToken);

  const attributes = response.attributes || {};
  const summaries = response.summaries || [];
  const images = response.images || [];
  const dimensions = response.dimensions || [];
  const identifiers = response.identifiers || [];
  const salesRanks = response.salesRanks || [];
  const relationships = response.relationships || [];
  const classifications = response.classifications || [];

  const summary = summaries[0] || {};

  // Attribute helpers
  const getAttr = (name) => attributes[name]?.[0]?.value || '';
  const getAttrArray = (name) => (attributes[name] || []).map(a => a.value).filter(v => v);

  // Extract identifiers for this marketplace
  const ids = {};
  for (const idGroup of identifiers) {
    if (idGroup.marketplaceId === mpConfig.marketplaceId) {
      for (const id of (idGroup.identifiers || [])) {
        if (id.identifierType === 'EAN') ids.ean = id.identifier;
        if (id.identifierType === 'UPC') ids.upc = id.identifier;
        if (id.identifierType === 'GTIN') ids.gtin = id.identifier;
      }
      break;
    }
  }

  // Extract images
  const imageGroup = images[0]?.images || [];
  const mainImage = imageGroup.find(i => i.variant === 'MAIN')?.link || imageGroup[0]?.link || '';
  const additionalImages = imageGroup.filter(i => i.variant !== 'MAIN');

  // Extract pricing from catalog attributes (more reliable)
  let catalogListPrice = '';
  let catalogCurrency = '';
  if (attributes.list_price && attributes.list_price[0]) {
    const priceData = attributes.list_price[0];
    if (priceData.value_with_tax !== undefined) {
      const rawValue = priceData.value_with_tax;
      catalogListPrice = Number.isInteger(rawValue) && rawValue > 100
        ? (rawValue / 100).toFixed(2)
        : parseFloat(rawValue).toFixed(2);
    } else if (priceData.value) {
      catalogListPrice = priceData.value;
    }
    catalogCurrency = priceData.currency || 'EUR';
  }

  // Extract dimensions
  const dimData = {};
  for (const dim of dimensions) {
    if (dim.marketplaceId === mpConfig.marketplaceId) {
      const itemDims = dim.item || {};
      const pkgDims = dim.package || {};
      dimData.itemWeight = itemDims.weight?.value || '';
      dimData.itemWeightUnit = itemDims.weight?.unit || '';
      dimData.packageWeight = pkgDims.weight?.value || '';
      dimData.packageWeightUnit = pkgDims.weight?.unit || '';
      break;
    }
  }

  // Extract sales ranks
  const ranks = {};
  for (const rankGroup of salesRanks) {
    if (rankGroup.marketplaceId === mpConfig.marketplaceId) {
      const classRanks = rankGroup.classificationRanks || [];
      if (classRanks[0]) { ranks.rank1 = classRanks[0].rank; ranks.rank1Cat = classRanks[0].title; }
      if (classRanks[1]) { ranks.rank2 = classRanks[1].rank; ranks.rank2Cat = classRanks[1].title; }
      const displayRanks = rankGroup.displayGroupRanks || [];
      if (displayRanks[0]) { ranks.displayRank = displayRanks[0].rank; ranks.displayName = displayRanks[0].title; }
      break;
    }
  }

  // Extract classifications (browse nodes)
  const cats = {};
  for (const classGroup of classifications) {
    if (classGroup.marketplaceId === mpConfig.marketplaceId) {
      const nodes = classGroup.classifications || [];
      if (nodes[0]) { cats.nodeId = nodes[0].classificationId; cats.nodeName = nodes[0].displayName; }
      cats.path = nodes.map(n => n.displayName).join(' > ');
      break;
    }
  }

  // Extract relationships
  const rels = {};
  for (const relGroup of relationships) {
    if (relGroup.marketplaceId === mpConfig.marketplaceId) {
      const relList = relGroup.relationships || [];
      const parentRel = relList.find(r => r.type === 'VARIATION' && r.parentAsins);
      if (parentRel && parentRel.parentAsins?.length > 0) {
        rels.parentAsin = parentRel.parentAsins[0];
      }
      const childRels = relList.filter(r => r.type === 'VARIATION' && r.childAsins);
      if (childRels.length > 0) {
        const allChildren = childRels.flatMap(r => r.childAsins || []);
        rels.childCount = allChildren.length;
      }
      const variationRel = relList.find(r => r.variationTheme);
      if (variationRel) {
        rels.variationTheme = variationRel.variationTheme.attributes?.join(', ') || '';
      }
      break;
    }
  }

  return {
    asin: asin,
    title: summary.itemName || getAttr('item_name') || '',
    brand: summary.brand || getAttr('brand') || '',
    manufacturer: getAttr('manufacturer') || '',
    productType: response.productTypes?.[0]?.productType || '',

    ean: ids.ean || '',
    upc: ids.upc || '',
    gtin: ids.gtin || '',

    bullet1: attributes.bullet_point?.[0]?.value || '',
    bullet2: attributes.bullet_point?.[1]?.value || '',
    bullet3: attributes.bullet_point?.[2]?.value || '',
    bullet4: attributes.bullet_point?.[3]?.value || '',
    bullet5: attributes.bullet_point?.[4]?.value || '',

    description: getAttr('product_description') || getAttr('item_description') || '',

    mainImageURL: mainImage,
    imageCount: imageGroup.length,
    image2: additionalImages[0]?.link || '',
    image3: additionalImages[1]?.link || '',
    image4: additionalImages[2]?.link || '',
    image5: additionalImages[3]?.link || '',
    image6: additionalImages[4]?.link || '',
    image7: additionalImages[5]?.link || '',

    catalogListPrice: catalogListPrice,
    catalogCurrency: catalogCurrency,

    itemWeight: dimData.itemWeight || '',
    itemWeightUnit: dimData.itemWeightUnit || '',
    packageWeight: dimData.packageWeight || '',
    packageWeightUnit: dimData.packageWeightUnit || '',

    salesRank1: ranks.rank1 || '',
    salesRank1Category: ranks.rank1Cat || '',
    salesRank2: ranks.rank2 || '',
    salesRank2Category: ranks.rank2Cat || '',
    displayGroupRank: ranks.displayRank || '',
    displayGroupName: ranks.displayName || '',

    browseNodeId: cats.nodeId || '',
    browseNodeName: cats.nodeName || '',
    categoryPath: cats.path || '',

    parentASIN: rels.parentAsin || '',
    variationTheme: rels.variationTheme || '',
    childCount: rels.childCount || '',

    color: getAttr('color') || getAttr('color_name') || '',
    size: getAttr('size') || getAttr('size_name') || '',
    material: getAttr('material') || getAttr('material_type') || '',

    hasAPlus: null,
    aplusType: '',
    aplusModuleCount: ''
  };
}

/**
 * Fetch pricing and seller info from SP-API Pricing API
 */
function spFetchPricing(asin, mpConfig, accessToken) {
  const path = `/products/pricing/v0/items/${asin}/offers`;
  const params = {
    MarketplaceId: mpConfig.marketplaceId,
    ItemCondition: 'New'
  };

  const response = spCallAPI('GET', path, params, accessToken);
  const payload = response.payload || response;
  const summary = payload.Summary || payload.summary || {};
  const offers = payload.Offers || payload.offers || [];

  let listPrice = '';
  let currentPrice = '';
  let currency = mpConfig.currency || 'EUR';
  let sellerId = '';
  let sellerInfo = '';

  // Pricing from summary
  const lowestPrices = summary.LowestPrices || [];
  if (lowestPrices.length > 0) {
    const fbaPrice = lowestPrices.find(p => p.fulfillmentChannel === 'Amazon');
    const bestPrice = fbaPrice || lowestPrices[0];
    currentPrice = bestPrice.LandedPrice?.Amount || bestPrice.ListingPrice?.Amount || '';
    currency = bestPrice.LandedPrice?.CurrencyCode || bestPrice.ListingPrice?.CurrencyCode || currency;
    listPrice = bestPrice.ListingPrice?.Amount || '';
  }

  // BuyBox fallback
  if (!currentPrice && summary.BuyBoxPrices && summary.BuyBoxPrices.length > 0) {
    const buyBox = summary.BuyBoxPrices[0];
    currentPrice = buyBox.LandedPrice?.Amount || buyBox.ListingPrice?.Amount || '';
    currency = buyBox.LandedPrice?.CurrencyCode || currency;
  }

  // Seller info from first offer
  if (offers.length > 0) {
    const offer = offers[0];
    sellerId = offer.SellerId || offer.sellerId || '';
    const isFBA = offer.IsFulfilledByAmazon || offer.isFulfilledByAmazon || false;
    const rating = offer.SellerFeedbackRating?.SellerPositiveFeedbackRating;
    if (isFBA && rating) sellerInfo = `FBA, ${rating}%`;
    else if (isFBA) sellerInfo = 'FBA';
    else if (rating) sellerInfo = `${rating}%`;
  }

  return { listPrice, currentPrice, currency, sellerId, sellerInfo };
}

/**
 * Search products by keyword with pagination
 */
function spSearchProducts(searchTerm, mpConfig, accessToken, maxPages) {
  const allItems = [];
  let nextToken = null;
  let pageCount = 0;

  do {
    const params = {
      marketplaceIds: mpConfig.marketplaceId,
      keywords: searchTerm,
      pageSize: 20,
      includedData: 'summaries'
    };
    if (nextToken) params.pageToken = nextToken;

    const response = spCallAPI('GET', '/catalog/2022-04-01/items', params, accessToken);
    const items = response.items || [];
    allItems.push(...items);

    nextToken = response.pagination?.nextToken;
    pageCount++;

    Logger.log(`[SP-API SEARCH] Page ${pageCount}: ${items.length} items. Total: ${allItems.length}`);
    if (nextToken) Utilities.sleep(300);

  } while (nextToken && pageCount < maxPages);

  return allItems.map(item => ({
    asin: item.asin,
    title: item.summaries?.[0]?.itemName || ''
  }));
}

// ==================== A+ CONTENT ====================

/**
 * Pre-fetch A+ Content cache (list of all A+ documents + ASIN mappings)
 */
function spFetchAPlusCache(mpConfig, accessToken) {
  const cache = { allRecords: [], asinToContent: {} };

  let pageToken = null;
  let pageCount = 0;

  do {
    const params = { marketplaceId: mpConfig.marketplaceId };
    if (pageToken) params.pageToken = pageToken;

    const response = spCallAPI('GET', '/aplus/2020-11-01/contentDocuments', params, accessToken);
    const records = response.contentMetadataRecords || [];
    cache.allRecords.push(...records);

    pageToken = response.nextPageToken;
    pageCount++;
    if (pageToken) Utilities.sleep(100);

  } while (pageToken && pageCount < 10);

  // Build ASIN -> contentKey mapping
  for (const record of cache.allRecords) {
    const contentKey = record.contentReferenceKey;
    try {
      const asinsPath = `/aplus/2020-11-01/contentDocuments/${contentKey}/asins`;
      const asinsResponse = spCallAPI('GET', asinsPath, { marketplaceId: mpConfig.marketplaceId }, accessToken);
      for (const asinMeta of (asinsResponse.asinMetadataSet || [])) {
        cache.asinToContent[asinMeta.asin] = contentKey;
      }
      Utilities.sleep(50);
    } catch (e) {
      Logger.log(`[SP-API A+] Error for ${contentKey}: ${e.message}`);
    }
  }

  return cache;
}

/**
 * Get A+ Content data for a single ASIN from cache
 */
function spGetAPlusForASIN(asin, cache, mpConfig, accessToken) {
  const empty = { hasAPlus: false, aplusType: '', aplusModuleCount: '' };

  const contentKey = cache.asinToContent[asin];
  if (!contentKey) return empty;

  try {
    const contentPath = `/aplus/2020-11-01/contentDocuments/${contentKey}`;
    const contentParams = { marketplaceId: mpConfig.marketplaceId, includedDataSet: 'CONTENTS' };
    const response = spCallAPI('GET', contentPath, contentParams, accessToken);

    const contentRecord = response.contentRecord || {};
    const contentDocument = contentRecord.contentDocument || response.contentDocument || {};
    const modules = contentDocument.contentModuleList || [];

    return {
      hasAPlus: true,
      aplusType: contentDocument.contentType || 'STANDARD',
      aplusModuleCount: modules.length
    };
  } catch (e) {
    Logger.log(`[SP-API A+] Error fetching ${asin}: ${e.message}`);
    return empty;
  }
}

// ==================== RESEARCH SHEET MANAGEMENT ====================

/**
 * Ensure RESEARCH tab exists with SP-API headers
 * If tab exists, adds missing columns. If not, creates it.
 */
function spEnsureResearchSheet(ss) {
  let sheet = ss.getSheetByName('RESEARCH');

  if (!sheet) {
    sheet = ss.insertSheet('RESEARCH');
    // Set all SP-API headers
    sheet.getRange(1, 1, 1, SP_RESEARCH_HEADERS.length).setValues([SP_RESEARCH_HEADERS]);
    sheet.getRange(1, 1, 1, SP_RESEARCH_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1565C0')
      .setFontColor('#FFFFFF')
      .setWrap(true);
    sheet.setFrozenRows(1);
    Logger.log(`[SP-API] Created RESEARCH sheet with ${SP_RESEARCH_HEADERS.length} columns`);
    return sheet;
  }

  // Sheet exists - check if our headers are present
  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existingSet = new Set(existingHeaders.map(h => h.toString().trim()));

  // Check if Data_Source column exists (key SP-API column)
  if (!existingSet.has('Data_Source')) {
    // Add all SP-API headers that are missing (append to right side)
    const missingHeaders = SP_RESEARCH_HEADERS.filter(h => !existingSet.has(h));
    if (missingHeaders.length > 0) {
      const startCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
      sheet.getRange(1, startCol, 1, missingHeaders.length)
        .setFontWeight('bold')
        .setBackground('#1565C0')
        .setFontColor('#FFFFFF');
      Logger.log(`[SP-API] Added ${missingHeaders.length} SP-API columns to existing RESEARCH sheet`);
    }
  }

  return sheet;
}

/**
 * Get existing ASIN+Marketplace+DataSource keys from RESEARCH tab
 * Returns Set of "ASIN|MARKETPLACE|DATA_SOURCE" strings
 */
function spGetExistingKeys(sheet) {
  const keys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return keys;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Find column indices
  let dataSourceCol = -1, marketplaceCol = -1, asinCol = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = headers[c].toString().trim();
    if (h === 'Data_Source') dataSourceCol = c;
    if (h === 'Marketplace') marketplaceCol = c;
    if (h === 'ASIN') asinCol = c;
  }

  if (asinCol === -1) return keys; // No ASIN column yet

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (const row of data) {
    const asin = (row[asinCol] || '').toString().trim();
    if (!asin) continue;
    const mp = marketplaceCol >= 0 ? (row[marketplaceCol] || '').toString().trim().toUpperCase() : '';
    const ds = dataSourceCol >= 0 ? (row[dataSourceCol] || '').toString().trim() : '';
    keys.add(`${asin}|${mp}|${ds}`);
  }

  return keys;
}

/**
 * Append product data row to RESEARCH sheet
 */
function spAppendToResearchSheet(sheet, data, marketplace) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let c = 0; c < headers.length; c++) {
    headerMap[headers[c].toString().trim()] = c;
  }

  const mpConfig = SP_MARKETPLACE_CONFIG[marketplace] || {};
  const amazonLink = `https://${mpConfig.domain || 'www.amazon.de'}/dp/${data.asin}`;
  const fetchDate = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy HH:mm');

  // Build row based on header positions
  const row = new Array(headers.length).fill('');

  const setValue = (headerName, value) => {
    if (headerMap[headerName] !== undefined) {
      row[headerMap[headerName]] = value || '';
    }
  };

  setValue('Data_Source', 'SP-API');
  setValue('Fetch_Date', fetchDate);
  setValue('Marketplace', marketplace);
  setValue('ASIN', data.asin);
  setValue('Title', data.title);
  setValue('Brand', data.brand);
  setValue('Manufacturer', data.manufacturer);
  setValue('Product_Type', data.productType);

  setValue('EAN', data.ean);
  setValue('UPC', data.upc);
  setValue('GTIN', data.gtin);

  setValue('Bullet_1', data.bullet1);
  setValue('Bullet_2', data.bullet2);
  setValue('Bullet_3', data.bullet3);
  setValue('Bullet_4', data.bullet4);
  setValue('Bullet_5', data.bullet5);

  setValue('Description', data.description);

  setValue('Main_Image_URL', data.mainImageURL);
  setValue('Image_Count', data.imageCount);
  setValue('Image_2_URL', data.image2);
  setValue('Image_3_URL', data.image3);
  setValue('Image_4_URL', data.image4);
  setValue('Image_5_URL', data.image5);
  setValue('Image_6_URL', data.image6);
  setValue('Image_7_URL', data.image7);

  setValue('List_Price', data.listPrice);
  setValue('Current_Price', data.currentPrice);
  setValue('Currency', data.priceCurrency || data.catalogCurrency);

  setValue('Item_Weight', data.itemWeight);
  setValue('Item_Weight_Unit', data.itemWeightUnit);
  setValue('Package_Weight', data.packageWeight);
  setValue('Package_Weight_Unit', data.packageWeightUnit);

  setValue('Sales_Rank_1', data.salesRank1);
  setValue('Sales_Rank_1_Category', data.salesRank1Category);
  setValue('Sales_Rank_2', data.salesRank2);
  setValue('Sales_Rank_2_Category', data.salesRank2Category);
  setValue('Display_Group_Rank', data.displayGroupRank);
  setValue('Display_Group_Name', data.displayGroupName);

  setValue('Browse_Node_ID', data.browseNodeId);
  setValue('Browse_Node_Name', data.browseNodeName);
  setValue('Category_Path', data.categoryPath);

  setValue('Parent_ASIN', data.parentASIN);
  setValue('Variation_Theme', data.variationTheme);
  setValue('Child_Count', data.childCount);

  setValue('Color', data.color);
  setValue('Size', data.size);
  setValue('Material', data.material);

  setValue('Has_APlus', data.hasAPlus === null ? '' : (data.hasAPlus ? 'TAK' : 'NIE'));
  setValue('APlus_Type', data.aplusType);
  setValue('APlus_Module_Count', data.aplusModuleCount);

  setValue('Seller_ID', data.sellerId);
  setValue('Seller_Info', data.sellerInfo);

  setValue('Amazon_Link', amazonLink);

  sheet.appendRow(row);
}
