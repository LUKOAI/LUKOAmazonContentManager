/**
 * SP-API Data Collection for AmazonListingAutomation
 * Fetches product data via Amazon SP-API and writes to RESEARCH tab
 *
 * KEY: Maps SP-API data to EXISTING PA-API columns in RESEARCH tab.
 * Only adds new columns if they don't already exist.
 *
 * SP-API endpoints used:
 * - /catalog/2022-04-01/items/{asin} - Product details
 * - /catalog/2022-04-01/items - Search by keyword
 * - /products/pricing/v0/items/{asin}/offers - Pricing & seller info
 * - /aplus/2020-11-01/contentDocuments - A+ Content (optional)
 *
 * @version 2.0
 * @author NetAnaliza / LUKO
 */

// ==================== COLUMN MAPPING: SP-API -> PA-API ====================

/**
 * Maps SP-API data fields to existing PA-API column names in RESEARCH tab.
 * If a PA-API column exists, SP-API data goes there.
 * If no match, a new column may be added (only for SP-API-specific fields).
 */
function spGetColumnMapping() {
  return {
    // Field name -> list of possible PA-API column names (first match wins)
    'dataSource':       ['Data_Source'],
    'fetchDate':        ['Timestamp_Research'],
    'marketplace':      ['Marketplace'],
    'asin':             ['ASIN'],
    'asinType':         ['ASIN_Type'],
    'relatedToAsin':    ['Related_To_ASIN'],
    'title':            ['Title'],
    'brand':            ['BrandName', 'brand_name', 'Brand'],
    'brandLower':       ['BrandNameLower'],
    'manufacturer':     ['Manufacturer'],
    'productType':      ['ProductGroup', 'product_group', 'Product_Type'],
    'binding':          ['Binding', 'binding'],

    // Identifiers
    'ean':              ['EAN', 'EAN1', 'PrimaryEAN'],
    'upc':              ['UPC'],
    'gtin':             ['GTIN'],
    'partNumber':       ['PartNumber', 'part_number'],
    'modelNumber':      ['Model', 'model_number'],

    // Bullet points -> both BulletPoint AND Feature columns
    'bullet1':          ['BulletPoint1', 'Feature1'],
    'bullet2':          ['BulletPoint2', 'Feature2'],
    'bullet3':          ['BulletPoint3', 'Feature3'],
    'bullet4':          ['BulletPoint4', 'Feature4'],
    'bullet5':          ['BulletPoint5', 'Feature5'],

    // Description
    'description':      ['Description'],

    // Images -> PA-API uses Image0Source, Image1Source...
    'mainImageURL':     ['Image0Source', 'image_0_source', 'FeaturedImageSource', 'featured_image_source', 'Main_Image_URL'],
    'image2':           ['Image1Source', 'image_1_source', 'Image_2_URL'],
    'image3':           ['Image2Source', 'Image_3_URL'],
    'image4':           ['Image3Source', 'Image_4_URL'],
    'image5':           ['Image4Source', 'Image_5_URL'],
    'image6':           ['Image5Source', 'Image_6_URL'],
    'image7':           ['Image6Source', 'Image_7_URL'],
    'imageCount':       ['TotalImagesCount', 'Image_Count'],

    // Pricing
    'price':            ['Price', 'price', 'List_Price'],
    'currentPrice':     ['Current_Price'],
    'currency':         ['PriceCurrency', 'currency', 'Currency'],

    // Dimensions
    'itemWeight':       ['ItemWeight', 'Item_Weight'],
    'itemWeightUnit':   ['ItemWeightUnitOfMeasure', 'ItemWeightUnit', 'Item_Weight_Unit'],
    'itemHeight':       ['ItemHeight', 'Item_Height'],
    'itemHeightUnit':   ['ItemHeightUnitOfMeasure', 'ItemHeightUnit'],
    'itemWidth':        ['ItemWidth', 'Item_Width'],
    'itemWidthUnit':    ['ItemWidthUnitOfMeasure', 'ItemWidthUnit'],
    'itemLength':       ['ItemLength', 'Item_Length'],
    'itemLengthUnit':   ['ItemLengthUnitOfMeasure', 'ItemLengthUnit'],
    'packageWeight':    ['Package_Weight'],
    'packageWeightUnit':['Package_Weight_Unit'],

    // Sales Ranks
    'salesRank1':       ['BestSellerRank', 'BestSellerRank1', 'best_seller_rank_1', 'best_seller_main_rank', 'Sales_Rank_1'],
    'salesRank1Cat':    ['BSRProductCategoryName', 'category_name', 'Sales_Rank_1_Category'],
    'salesRank2':       ['Sales_Rank_2'],
    'salesRank2Cat':    ['Sales_Rank_2_Category'],
    'displayGroupRank': ['Display_Group_Rank'],
    'displayGroupName': ['Display_Group_Name'],

    // Browse Nodes / Categories
    'browseNodeId':     ['BrowseNodeId', 'browse_node_id', 'Browse_Node_ID'],
    'browseNodeName':   ['BrowseNodeDisplayName', 'Browse_Node_Name'],
    'categoryPath':     ['Category_Path'],

    // Relationships
    'parentAsin':       ['ParentAsin', 'parent_asin', 'Parent_ASIN'],
    'variationTheme':   ['Variation_Theme'],
    'childCount':       ['Child_Count'],

    // Product Attributes
    'color':            ['ColorName', 'color_name', 'Color'],
    'size':             ['SizeName', 'size_name', 'Size'],
    'material':         ['Material'],
    'unitCount':        ['UnitCount', 'unit_count'],

    // A+ Content
    'hasAPlus':         ['Has_APlus'],
    'aplusType':        ['APlus_Type'],
    'aplusModuleCount': ['APlus_Module_Count'],

    // Seller
    'sellerId':         ['Seller_ID'],
    'sellerInfo':       ['Seller_Info'],

    // Links
    'link':             ['Link', 'link', 'Amazon_Link', 'Url']
  };
}

// ==================== MENU FUNCTIONS ====================

/**
 * Menu: Fetch single ASIN via SP-API (Główny only)
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

  const marketplace = spShowMarketplaceSelector();
  if (!marketplace) return;

  const confirmMsg = `Pobrac ${asins.length} produkt(ow) z Amazon ${marketplace} przez SP-API?\n\n` +
    `ASIN: ${asins.slice(0, 5).join(', ')}${asins.length > 5 ? '...' : ''}\n` +
    `Typ: Tylko glowny (ASIN_Type = Glowny)\n` +
    `Dane zapisane w: RESEARCH tab`;

  if (ui.alert('Potwierdzenie', confirmMsg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Pobieram ${asins.length} produktow z SP-API...`, 'SP-API', 30);
    const results = spFetchAndWriteProducts(asins, marketplace, { fetchSimilar: false });

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
 * Menu: Fetch ASIN + similar/related products via SP-API
 * Main product = Główny, variations/siblings = Podobny
 */
function menuSPApiFetchWithSimilar() {
  const ui = SpreadsheetApp.getUi();

  if (!spHasCredentials()) {
    ui.alert('SP-API nie skonfigurowane',
      'Brak danych SP-API.\n\nUruchom: SP-API Data Collection > Setup SP-API Credentials',
      ui.ButtonSet.OK);
    return;
  }

  const response = ui.prompt(
    'SP-API: Pobierz ASIN + podobne produkty',
    'Wpisz ASIN(y) do pobrania:\n\n' +
    'Jeden: B08N5WRWNW\n' +
    'Wiele: B08N5WRWNW, B07XJ8C8F5\n\n' +
    'Dla kazdego ASIN zostaną pobrane rowniez\n' +
    'podobne produkty (warianty/rodzenstwo).\n\n' +
    'Oddziel przecinkami.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const input = response.getResponseText().trim();
  if (!input) return;

  const asins = input.split(',').map(a => a.trim().toUpperCase()).filter(a => /^[A-Z0-9]{10}$/.test(a));

  if (asins.length === 0) {
    ui.alert('Blad', 'Nie znaleziono prawidlowych ASIN-ow.', ui.ButtonSet.OK);
    return;
  }

  const marketplace = spShowMarketplaceSelector();
  if (!marketplace) return;

  const confirmMsg = `Pobrac ${asins.length} produkt(ow) + podobne z Amazon ${marketplace}?\n\n` +
    `ASIN: ${asins.slice(0, 5).join(', ')}${asins.length > 5 ? '...' : ''}\n\n` +
    `Glowny ASIN -> ASIN_Type = "Glowny"\n` +
    `Podobne/warianty -> ASIN_Type = "Podobny"\n` +
    `Dane zapisane w: RESEARCH tab`;

  if (ui.alert('Potwierdzenie', confirmMsg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Pobieram ${asins.length} produktow + podobne z SP-API...`, 'SP-API', 30);
    const results = spFetchAndWriteProducts(asins, marketplace, { fetchSimilar: true });

    let resultMsg = `Glowne: ${results.success}\n` +
      `Podobne: ${results.similar}\n` +
      `Bledy: ${results.failed}\n` +
      `Pominiete (duplikaty): ${results.skipped}`;

    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, 'SP-API - zakonczone', 15);

  } catch (error) {
    ui.alert('SP-API Blad', `Wystapil blad:\n\n${error.message}`, ui.ButtonSet.OK);
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

    const searchResults = spSearchProducts(searchTerm, mpConfig, accessToken, 5);

    if (searchResults.length === 0) {
      ui.alert('Brak wynikow', `Nie znaleziono produktow dla "${searchTerm}" w ${marketplace}.`, ui.ButtonSet.OK);
      return;
    }

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
    const results = spFetchAndWriteProducts(asinsToImport, marketplace, { fetchSimilar: false });

    let resultMsg = `Zaimportowano: ${results.success}\nBledy: ${results.failed}\nPominiete: ${results.skipped}`;
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, 'SP-API - zakonczone', 15);

  } catch (error) {
    ui.alert('SP-API Blad', `Wystapil blad:\n\n${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Menu: Fetch ASINs from selected cells in RESEARCH tab
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
  const selection = ss.getActiveSheet().getActiveRange();
  if (!selection) {
    ui.alert('Zaznacz komorki', 'Zaznacz komorki z ASIN-ami i sprobuj ponownie.', ui.ButtonSet.OK);
    return;
  }

  const values = selection.getValues();
  const asins = [];
  for (const row of values) {
    for (const cell of row) {
      const val = cell.toString().trim().toUpperCase();
      if (/^[A-Z0-9]{10}$/.test(val)) asins.push(val);
    }
  }

  if (asins.length === 0) {
    ui.alert('Brak ASIN', 'Zaznaczone komorki nie zawieraja prawidlowych ASIN-ow.', ui.ButtonSet.OK);
    return;
  }

  const marketplace = spShowMarketplaceSelector();
  if (!marketplace) return;

  if (ui.alert('Potwierdzenie',
    `Pobrac ${asins.length} ASIN(ow) z Amazon ${marketplace}?\n${asins.slice(0, 10).join(', ')}`,
    ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Pobieram ${asins.length} produktow...`, 'SP-API', 30);
    const results = spFetchAndWriteProducts(asins, marketplace, { fetchSimilar: false });
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
 * @param {Object} options - { fetchSimilar: boolean }
 * @returns {Object} { success, failed, skipped, similar, errors }
 */
function spFetchAndWriteProducts(asins, marketplace, options) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mpConfig = SP_MARKETPLACE_CONFIG[marketplace];

  if (!mpConfig) throw new Error(`Unknown marketplace: ${marketplace}`);

  const researchSheet = ss.getSheetByName('RESEARCH');
  if (!researchSheet) throw new Error('RESEARCH tab not found!');

  // Build header map
  const headerInfo = spBuildHeaderMap(researchSheet);

  // Get existing ASIN+Marketplace+DataSource combinations
  const existing = spGetExistingKeys(researchSheet, headerInfo);

  const accessToken = spGetAccessToken();
  const results = { success: 0, failed: 0, skipped: 0, similar: 0, errors: [] };
  const startTime = Date.now();
  const maxTime = 4.5 * 60 * 1000;

  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];

    if (Date.now() - startTime > maxTime) {
      Logger.log(`[SP-API] Timeout after ${i} products.`);
      SpreadsheetApp.getActiveSpreadsheet().toast(`Timeout! Zaimportowano ${results.success}.`, 'SP-API', 10);
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
        `Pobieram ${asin} (${i + 1}/${asins.length})...`, 'SP-API', 30);

      // Fetch product data
      const productData = spFetchProductData(asin, mpConfig, accessToken);
      Utilities.sleep(300);

      // Fetch pricing
      try {
        const pricing = spFetchPricing(asin, mpConfig, accessToken);
        productData.price = pricing.listPrice || productData.catalogListPrice || '';
        productData.currentPrice = pricing.currentPrice || '';
        productData.currency = pricing.currency || productData.catalogCurrency || '';
        productData.sellerId = pricing.sellerId || '';
        productData.sellerInfo = pricing.sellerInfo || '';
      } catch (e) {
        Logger.log(`[SP-API] Pricing failed for ${asin}: ${e.message}`);
        productData.price = productData.catalogListPrice || '';
        productData.currentPrice = '';
        productData.currency = productData.catalogCurrency || '';
      }
      Utilities.sleep(200);

      // Write main product as "Główny"
      productData.asinType = 'Główny';
      productData.relatedToAsin = '';
      spWriteProductRow(researchSheet, headerInfo, productData, marketplace);
      existing.add(key);
      results.success++;

      // Fetch similar products if requested
      if (options.fetchSimilar && productData.childAsins) {
        const childList = productData.childAsins.split(',').map(a => a.trim()).filter(a => a && a !== asin);
        const maxSimilar = Math.min(childList.length, 20);

        for (let j = 0; j < maxSimilar; j++) {
          const childAsin = childList[j];
          const childKey = `${childAsin}|${marketplace}|SP-API`;
          if (existing.has(childKey)) continue;

          if (Date.now() - startTime > maxTime) break;

          try {
            SpreadsheetApp.getActiveSpreadsheet().toast(
              `Podobny ${childAsin} (${j + 1}/${maxSimilar})...`, 'SP-API', 30);

            const childData = spFetchProductData(childAsin, mpConfig, accessToken);
            Utilities.sleep(300);

            try {
              const childPricing = spFetchPricing(childAsin, mpConfig, accessToken);
              childData.price = childPricing.listPrice || childData.catalogListPrice || '';
              childData.currentPrice = childPricing.currentPrice || '';
              childData.currency = childPricing.currency || childData.catalogCurrency || '';
              childData.sellerId = childPricing.sellerId || '';
              childData.sellerInfo = childPricing.sellerInfo || '';
            } catch (e) {
              childData.price = childData.catalogListPrice || '';
            }
            Utilities.sleep(200);

            childData.asinType = 'Podobny';
            childData.relatedToAsin = asin;
            spWriteProductRow(researchSheet, headerInfo, childData, marketplace);
            existing.add(childKey);
            results.similar++;

          } catch (e) {
            Logger.log(`[SP-API] Similar ${childAsin} failed: ${e.message}`);
          }

          Utilities.sleep(500);
        }
      }

      // If no children but has parent, try siblings
      if (options.fetchSimilar && !productData.childAsins && productData.parentAsin) {
        const parentAsin = productData.parentAsin;
        const parentKey = `${parentAsin}|${marketplace}|SP-API`;

        if (!existing.has(parentKey)) {
          try {
            const parentData = spFetchProductData(parentAsin, mpConfig, accessToken);
            Utilities.sleep(300);

            // Get siblings from parent's children
            if (parentData.childAsins) {
              const siblings = parentData.childAsins.split(',').map(a => a.trim()).filter(a => a && a !== asin);
              const maxSiblings = Math.min(siblings.length, 20);

              for (let j = 0; j < maxSiblings; j++) {
                const sibAsin = siblings[j];
                const sibKey = `${sibAsin}|${marketplace}|SP-API`;
                if (existing.has(sibKey)) continue;

                if (Date.now() - startTime > maxTime) break;

                try {
                  SpreadsheetApp.getActiveSpreadsheet().toast(
                    `Podobny ${sibAsin} (${j + 1}/${maxSiblings})...`, 'SP-API', 30);

                  const sibData = spFetchProductData(sibAsin, mpConfig, accessToken);
                  Utilities.sleep(300);

                  sibData.asinType = 'Podobny';
                  sibData.relatedToAsin = asin;
                  spWriteProductRow(researchSheet, headerInfo, sibData, marketplace);
                  existing.add(sibKey);
                  results.similar++;

                } catch (e) {
                  Logger.log(`[SP-API] Sibling ${sibAsin} failed: ${e.message}`);
                }

                Utilities.sleep(500);
              }
            }
          } catch (e) {
            Logger.log(`[SP-API] Parent ${parentAsin} failed: ${e.message}`);
          }
        }
      }

    } catch (error) {
      Logger.log(`[SP-API] Failed ${asin}: ${error.message}`);
      results.failed++;
      results.errors.push(`${asin}: ${error.message}`);
    }

    Utilities.sleep(500);
  }

  return results;
}

// ==================== PRODUCT DATA FETCHING ====================

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

  const getAttr = (name) => attributes[name]?.[0]?.value || '';

  // Identifiers
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

  // Images
  const imageGroup = images[0]?.images || [];
  const mainImage = imageGroup.find(i => i.variant === 'MAIN')?.link || imageGroup[0]?.link || '';
  const additionalImages = imageGroup.filter(i => i.variant !== 'MAIN');

  // Price from catalog attributes
  let catalogListPrice = '';
  let catalogCurrency = '';
  if (attributes.list_price && attributes.list_price[0]) {
    const priceData = attributes.list_price[0];
    if (priceData.value_with_tax !== undefined) {
      const rawValue = priceData.value_with_tax;
      catalogListPrice = (Number.isInteger(rawValue) && rawValue > 100)
        ? (rawValue / 100).toFixed(2)
        : parseFloat(rawValue).toFixed(2);
    } else if (priceData.value) {
      catalogListPrice = priceData.value;
    }
    catalogCurrency = priceData.currency || 'EUR';
  }

  // Dimensions
  const dimData = {};
  for (const dim of dimensions) {
    if (dim.marketplaceId === mpConfig.marketplaceId) {
      const itemDims = dim.item || {};
      const pkgDims = dim.package || {};
      dimData.itemWeight = itemDims.weight?.value || '';
      dimData.itemWeightUnit = itemDims.weight?.unit || '';
      dimData.itemHeight = itemDims.height?.value || '';
      dimData.itemHeightUnit = itemDims.height?.unit || '';
      dimData.itemWidth = itemDims.width?.value || '';
      dimData.itemWidthUnit = itemDims.width?.unit || '';
      dimData.itemLength = itemDims.length?.value || '';
      dimData.itemLengthUnit = itemDims.length?.unit || '';
      dimData.packageWeight = pkgDims.weight?.value || '';
      dimData.packageWeightUnit = pkgDims.weight?.unit || '';
      break;
    }
  }

  // Sales Ranks
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

  // Classifications (Browse Nodes)
  const cats = {};
  for (const classGroup of classifications) {
    if (classGroup.marketplaceId === mpConfig.marketplaceId) {
      const nodes = classGroup.classifications || [];
      if (nodes[0]) { cats.nodeId = nodes[0].classificationId; cats.nodeName = nodes[0].displayName; }
      cats.path = nodes.map(n => n.displayName).join(' > ');
      break;
    }
  }

  // Relationships
  const rels = {};
  let childAsinsList = [];
  for (const relGroup of relationships) {
    if (relGroup.marketplaceId === mpConfig.marketplaceId) {
      const relList = relGroup.relationships || [];
      const parentRel = relList.find(r => r.type === 'VARIATION' && r.parentAsins);
      if (parentRel && parentRel.parentAsins?.length > 0) {
        rels.parentAsin = parentRel.parentAsins[0];
      }
      const childRels = relList.filter(r => r.type === 'VARIATION' && r.childAsins);
      if (childRels.length > 0) {
        childAsinsList = childRels.flatMap(r => r.childAsins || []);
        rels.childCount = childAsinsList.length;
      }
      const variationRel = relList.find(r => r.variationTheme);
      if (variationRel) {
        rels.variationTheme = variationRel.variationTheme.attributes?.join(', ') || '';
      }
      break;
    }
  }

  const brandName = summary.brand || getAttr('brand') || '';

  return {
    asin: asin,
    title: summary.itemName || getAttr('item_name') || '',
    brand: brandName,
    brandLower: brandName.toLowerCase(),
    manufacturer: getAttr('manufacturer') || '',
    productType: response.productTypes?.[0]?.productType || '',
    binding: getAttr('binding') || '',

    ean: ids.ean || '',
    upc: ids.upc || '',
    gtin: ids.gtin || '',
    partNumber: getAttr('part_number') || getAttr('manufacturer_part_number') || '',
    modelNumber: getAttr('model_number') || getAttr('model') || '',

    bullet1: attributes.bullet_point?.[0]?.value || '',
    bullet2: attributes.bullet_point?.[1]?.value || '',
    bullet3: attributes.bullet_point?.[2]?.value || '',
    bullet4: attributes.bullet_point?.[3]?.value || '',
    bullet5: attributes.bullet_point?.[4]?.value || '',

    description: getAttr('product_description') || getAttr('item_description') || '',

    mainImageURL: mainImage,
    image2: additionalImages[0]?.link || '',
    image3: additionalImages[1]?.link || '',
    image4: additionalImages[2]?.link || '',
    image5: additionalImages[3]?.link || '',
    image6: additionalImages[4]?.link || '',
    image7: additionalImages[5]?.link || '',
    imageCount: imageGroup.length,

    catalogListPrice: catalogListPrice,
    catalogCurrency: catalogCurrency,

    itemWeight: dimData.itemWeight || '',
    itemWeightUnit: dimData.itemWeightUnit || '',
    itemHeight: dimData.itemHeight || '',
    itemHeightUnit: dimData.itemHeightUnit || '',
    itemWidth: dimData.itemWidth || '',
    itemWidthUnit: dimData.itemWidthUnit || '',
    itemLength: dimData.itemLength || '',
    itemLengthUnit: dimData.itemLengthUnit || '',
    packageWeight: dimData.packageWeight || '',
    packageWeightUnit: dimData.packageWeightUnit || '',

    salesRank1: ranks.rank1 || '',
    salesRank1Cat: ranks.rank1Cat || '',
    salesRank2: ranks.rank2 || '',
    salesRank2Cat: ranks.rank2Cat || '',
    displayGroupRank: ranks.displayRank || '',
    displayGroupName: ranks.displayName || '',

    browseNodeId: cats.nodeId || '',
    browseNodeName: cats.nodeName || '',
    categoryPath: cats.path || '',

    parentAsin: rels.parentAsin || '',
    variationTheme: rels.variationTheme || '',
    childCount: rels.childCount || '',
    childAsins: childAsinsList.join(', '),

    color: getAttr('color') || getAttr('color_name') || '',
    size: getAttr('size') || getAttr('size_name') || '',
    material: getAttr('material') || getAttr('material_type') || '',
    unitCount: getAttr('unit_count') || '',

    hasAPlus: '',
    aplusType: '',
    aplusModuleCount: ''
  };
}

/**
 * Fetch pricing and seller info
 */
function spFetchPricing(asin, mpConfig, accessToken) {
  const path = `/products/pricing/v0/items/${asin}/offers`;
  const params = { MarketplaceId: mpConfig.marketplaceId, ItemCondition: 'New' };

  const response = spCallAPI('GET', path, params, accessToken);
  const payload = response.payload || response;
  const summary = payload.Summary || payload.summary || {};
  const offers = payload.Offers || payload.offers || [];

  let listPrice = '', currentPrice = '', currency = mpConfig.currency || 'EUR';
  let sellerId = '', sellerInfo = '';

  const lowestPrices = summary.LowestPrices || [];
  if (lowestPrices.length > 0) {
    const fbaPrice = lowestPrices.find(p => p.fulfillmentChannel === 'Amazon');
    const bestPrice = fbaPrice || lowestPrices[0];
    currentPrice = bestPrice.LandedPrice?.Amount || bestPrice.ListingPrice?.Amount || '';
    currency = bestPrice.LandedPrice?.CurrencyCode || bestPrice.ListingPrice?.CurrencyCode || currency;
    listPrice = bestPrice.ListingPrice?.Amount || '';
  }

  if (!currentPrice && summary.BuyBoxPrices && summary.BuyBoxPrices.length > 0) {
    const buyBox = summary.BuyBoxPrices[0];
    currentPrice = buyBox.LandedPrice?.Amount || buyBox.ListingPrice?.Amount || '';
    currency = buyBox.LandedPrice?.CurrencyCode || currency;
  }

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
    if (nextToken) Utilities.sleep(300);

  } while (nextToken && pageCount < maxPages);

  return allItems.map(item => ({
    asin: item.asin,
    title: item.summaries?.[0]?.itemName || ''
  }));
}

// ==================== RESEARCH SHEET MANAGEMENT ====================

/**
 * Build header map from existing RESEARCH sheet
 * Returns { headers: [...], headerIndex: { columnName: colIndex } }
 */
function spBuildHeaderMap(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return { headers: [], headerIndex: {} };

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const headerIndex = {};

  for (let c = 0; c < headers.length; c++) {
    const h = headers[c].toString().trim();
    if (h) headerIndex[h] = c;
  }

  return { headers, headerIndex };
}

/**
 * Find the column index for a field using the mapping.
 * Returns column index (0-based) or -1 if not found.
 */
function spFindColumn(headerIndex, fieldName) {
  const mapping = spGetColumnMapping();
  const candidates = mapping[fieldName] || [];

  for (const colName of candidates) {
    if (headerIndex[colName] !== undefined) {
      return headerIndex[colName];
    }
  }

  return -1;
}

/**
 * Get existing ASIN+Marketplace+DataSource keys from RESEARCH tab
 */
function spGetExistingKeys(sheet, headerInfo) {
  const keys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return keys;

  const hi = headerInfo.headerIndex;
  const asinCol = hi['ASIN'] !== undefined ? hi['ASIN'] : -1;
  const mpCol = hi['Marketplace'] !== undefined ? hi['Marketplace'] : -1;
  const dsCol = hi['Data_Source'] !== undefined ? hi['Data_Source'] : -1;

  if (asinCol === -1) return keys;

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (const row of data) {
    const asin = (row[asinCol] || '').toString().trim();
    if (!asin) continue;
    const mp = mpCol >= 0 ? (row[mpCol] || '').toString().trim().toUpperCase() : '';
    const ds = dsCol >= 0 ? (row[dsCol] || '').toString().trim() : '';
    keys.add(`${asin}|${mp}|${ds}`);
  }

  return keys;
}

/**
 * Write a single product row to RESEARCH sheet, mapping to existing columns.
 * Does NOT add new columns - only writes to columns that already exist.
 */
function spWriteProductRow(sheet, headerInfo, data, marketplace) {
  const hi = headerInfo.headerIndex;
  const numCols = headerInfo.headers.length;
  const row = new Array(numCols).fill('');

  const mpConfig = SP_MARKETPLACE_CONFIG[marketplace] || {};
  const amazonLink = `https://${mpConfig.domain || 'www.amazon.de'}/dp/${data.asin}`;
  const fetchDate = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy HH:mm');

  // Helper: set value in the first matching column
  const set = (fieldName, value) => {
    const col = spFindColumn(hi, fieldName);
    if (col >= 0 && col < numCols) {
      row[col] = value || '';
    }
  };

  set('dataSource', 'SP-API');
  set('fetchDate', fetchDate);
  set('marketplace', marketplace);
  set('asin', data.asin);
  set('asinType', data.asinType || 'Główny');
  set('relatedToAsin', data.relatedToAsin || '');
  set('title', data.title);
  set('brand', data.brand);
  set('brandLower', data.brandLower);
  set('manufacturer', data.manufacturer);
  set('productType', data.productType);
  set('binding', data.binding);

  set('ean', data.ean);
  set('upc', data.upc);
  set('gtin', data.gtin);
  set('partNumber', data.partNumber);
  set('modelNumber', data.modelNumber);

  set('bullet1', data.bullet1);
  set('bullet2', data.bullet2);
  set('bullet3', data.bullet3);
  set('bullet4', data.bullet4);
  set('bullet5', data.bullet5);

  set('description', data.description);

  set('mainImageURL', data.mainImageURL);
  set('image2', data.image2);
  set('image3', data.image3);
  set('image4', data.image4);
  set('image5', data.image5);
  set('image6', data.image6);
  set('image7', data.image7);
  set('imageCount', data.imageCount);

  set('price', data.price);
  set('currentPrice', data.currentPrice);
  set('currency', data.currency);

  set('itemWeight', data.itemWeight);
  set('itemWeightUnit', data.itemWeightUnit);
  set('itemHeight', data.itemHeight);
  set('itemHeightUnit', data.itemHeightUnit);
  set('itemWidth', data.itemWidth);
  set('itemWidthUnit', data.itemWidthUnit);
  set('itemLength', data.itemLength);
  set('itemLengthUnit', data.itemLengthUnit);
  set('packageWeight', data.packageWeight);
  set('packageWeightUnit', data.packageWeightUnit);

  set('salesRank1', data.salesRank1);
  set('salesRank1Cat', data.salesRank1Cat);
  set('salesRank2', data.salesRank2);
  set('salesRank2Cat', data.salesRank2Cat);
  set('displayGroupRank', data.displayGroupRank);
  set('displayGroupName', data.displayGroupName);

  set('browseNodeId', data.browseNodeId);
  set('browseNodeName', data.browseNodeName);
  set('categoryPath', data.categoryPath);

  set('parentAsin', data.parentAsin);
  set('variationTheme', data.variationTheme);
  set('childCount', data.childCount);

  set('color', data.color);
  set('size', data.size);
  set('material', data.material);
  set('unitCount', data.unitCount);

  set('hasAPlus', data.hasAPlus);
  set('aplusType', data.aplusType);
  set('aplusModuleCount', data.aplusModuleCount);

  set('sellerId', data.sellerId);
  set('sellerInfo', data.sellerInfo);

  set('link', amazonLink);

  sheet.appendRow(row);
}
