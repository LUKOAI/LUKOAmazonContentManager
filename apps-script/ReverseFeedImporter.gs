/**
 * LUKO-ACM Reverse Feed Importer
 * Imports Amazon products from reverse feed CSV (flat file)
 *
 * USAGE:
 * 1. Upload CSV file to Google Drive
 * 2. Menu: Amazon Manager → Import → Import Reverse Feed
 * 3. Select file
 * 4. Map columns (auto + manual confirmation)
 * 5. Import!
 */

// ========================================
// MAIN IMPORT FUNCTION
// ========================================

/**
 * Import products from Amazon reverse feed CSV
 */
function lukoImportReverseFeed() {
  const ui = SpreadsheetApp.getUi();

  // Step 1: Ask for CSV file
  const response = ui.prompt(
    'Import Reverse Feed',
    'Enter Google Drive file ID or paste full CSV content:\n\n' +
    '(To get file ID: Right-click file → Get link → Copy ID)',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const input = response.getResponseText().trim();
  if (!input) {
    showError('No input provided');
    return;
  }

  try {
    let csvContent;

    // Check if it's a file ID or direct CSV content
    if (input.includes(',') || input.includes('\n')) {
      // Direct CSV content
      csvContent = input;
    } else {
      // File ID - fetch from Drive
      csvContent = fetchCSVFromDrive(input);
    }

    // Parse CSV
    showProgress('Parsing CSV...');
    const parsedData = parseReverseFeedCSV(csvContent);

    // Show preview and confirm
    const confirmMsg = `Found ${parsedData.products.length} products.\n\n` +
      `Sample: ${parsedData.products[0].sku} - ${parsedData.products[0].title_DE}\n\n` +
      `Import to ProductsMain sheet?`;

    const confirm = ui.alert('Confirm Import', confirmMsg, ui.ButtonSet.YES_NO);

    if (confirm !== ui.Button.YES) return;

    // Import
    showProgress(`Importing ${parsedData.products.length} products...`);
    const result = importToSheet(parsedData.products);

    // Show result
    ui.alert(
      'Import Complete',
      `✅ Imported: ${result.imported}\n` +
      `⚠️ Warnings: ${result.warnings}\n` +
      `❌ Errors: ${result.errors}\n\n` +
      `Check Logs sheet for details.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    handleError('lukoImportReverseFeed', error);
  }
}

// ========================================
// CSV FETCHING
// ========================================

function fetchCSVFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const content = file.getBlob().getDataAsString('UTF-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to fetch file from Drive: ${error.message}\n\nMake sure file ID is correct and you have access.`);
  }
}

// ========================================
// CSV PARSING
// ========================================

function parseReverseFeedCSV(csvContent) {
  const lines = csvContent.split(/\r?\n/);

  if (lines.length < 3) {
    throw new Error('CSV file must have at least 3 rows (headers + data)');
  }

  // Row 1: German names (skip)
  // Row 2: Technical names (use for mapping)
  // Row 3+: Data

  const technicalNames = parseCSVLine(lines[1]);
  Logger.log(`Found ${technicalNames.length} columns`);

  // Build column map
  const columnMap = buildColumnMap(technicalNames);

  // Parse data rows
  const products = [];
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    const product = extractProductData(values, columnMap);

    if (product && product.sku) {
      products.push(product);
    }
  }

  return {
    products: products,
    columnMap: columnMap,
    totalRows: lines.length - 2
  };
}

/**
 * Parse CSV line (handles quoted fields with commas)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // Last field
  return result;
}

// ========================================
// COLUMN MAPPING
// ========================================

function buildColumnMap(technicalNames) {
  const map = {
    sku: findColumnIndex(technicalNames, 'contribution_sku#1.value'),
    productType: findColumnIndex(technicalNames, 'product_type#1.value'),

    // German (DE) - primary marketplace
    title_DE: findColumnIndex(technicalNames, 'item_name[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#1.value'),
    brand_DE: findColumnIndex(technicalNames, 'brand[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#1.value'),

    bulletPoint1_DE: findColumnIndex(technicalNames, 'bullet_point[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#1.value'),
    bulletPoint2_DE: findColumnIndex(technicalNames, 'bullet_point[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#2.value'),
    bulletPoint3_DE: findColumnIndex(technicalNames, 'bullet_point[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#3.value'),
    bulletPoint4_DE: findColumnIndex(technicalNames, 'bullet_point[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#4.value'),
    bulletPoint5_DE: findColumnIndex(technicalNames, 'bullet_point[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#5.value'),

    description_DE: findColumnIndex(technicalNames, 'product_description[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#1.value'),
    keywords_DE: findColumnIndex(technicalNames, 'generic_keyword[marketplace_id=A1PA6795UKMFR9][language_tag=de_DE]#1.value'),

    // Images
    mainImage: findColumnIndex(technicalNames, 'main_offer_image_locator[marketplace_id=A1PA6795UKMFR9]#1.media_location'),
    additionalImage1: findColumnIndex(technicalNames, 'other_offer_image_locator_1[marketplace_id=A1PA6795UKMFR9]#1.media_location'),
    additionalImage2: findColumnIndex(technicalNames, 'other_offer_image_locator_2[marketplace_id=A1PA6795UKMFR9]#1.media_location'),
    additionalImage3: findColumnIndex(technicalNames, 'other_offer_image_locator_3[marketplace_id=A1PA6795UKMFR9]#1.media_location'),
    additionalImage4: findColumnIndex(technicalNames, 'other_offer_image_locator_4[marketplace_id=A1PA6795UKMFR9]#1.media_location'),
    additionalImage5: findColumnIndex(technicalNames, 'other_offer_image_locator_5[marketplace_id=A1PA6795UKMFR9]#1.media_location'),

    // Variations
    parentSKU: findColumnIndex(technicalNames, 'parent_sku[marketplace_id=A1PA6795UKMFR9]#1.value'),
    variationTheme: findColumnIndex(technicalNames, 'variation_theme[marketplace_id=A1PA6795UKMFR9]#1.value'),

    // Additional language support (EN, FR, IT, etc.) can be added here
    title_EN: findColumnIndex(technicalNames, 'item_name[marketplace_id=A1PA6795UKMFR9][language_tag=en_GB]#1.value'),
    brand_EN: findColumnIndex(technicalNames, 'brand[marketplace_id=A1PA6795UKMFR9][language_tag=en_GB]#1.value')
  };

  // Log which columns were found
  const found = Object.keys(map).filter(key => map[key] >= 0);
  const missing = Object.keys(map).filter(key => map[key] < 0);

  Logger.log(`Column mapping: Found ${found.length}, Missing ${missing.length}`);
  if (missing.length > 0) {
    Logger.log(`Missing columns: ${missing.join(', ')}`);
  }

  return map;
}

function findColumnIndex(columnNames, searchTerm) {
  const index = columnNames.indexOf(searchTerm);
  if (index < 0) {
    Logger.log(`Column not found: ${searchTerm}`);
  }
  return index;
}

// ========================================
// DATA EXTRACTION
// ========================================

function extractProductData(values, columnMap) {
  const product = {
    sku: getValueAt(values, columnMap.sku),
    productType: getValueAt(values, columnMap.productType) || 'PRODUCT',

    // German
    title_DE: getValueAt(values, columnMap.title_DE),
    brand_DE: getValueAt(values, columnMap.brand_DE),

    bulletPoint1_DE: getValueAt(values, columnMap.bulletPoint1_DE),
    bulletPoint2_DE: getValueAt(values, columnMap.bulletPoint2_DE),
    bulletPoint3_DE: getValueAt(values, columnMap.bulletPoint3_DE),
    bulletPoint4_DE: getValueAt(values, columnMap.bulletPoint4_DE),
    bulletPoint5_DE: getValueAt(values, columnMap.bulletPoint5_DE),

    description_DE: getValueAt(values, columnMap.description_DE),
    keywords_DE: getValueAt(values, columnMap.keywords_DE),

    // Images
    mainImage: getValueAt(values, columnMap.mainImage),
    additionalImage1: getValueAt(values, columnMap.additionalImage1),
    additionalImage2: getValueAt(values, columnMap.additionalImage2),
    additionalImage3: getValueAt(values, columnMap.additionalImage3),
    additionalImage4: getValueAt(values, columnMap.additionalImage4),
    additionalImage5: getValueAt(values, columnMap.additionalImage5),

    // Variations
    parentSKU: getValueAt(values, columnMap.parentSKU),
    variationTheme: getValueAt(values, columnMap.variationTheme),

    // Additional languages
    title_EN: getValueAt(values, columnMap.title_EN),
    brand_EN: getValueAt(values, columnMap.brand_EN)
  };

  return product;
}

function getValueAt(values, index) {
  if (index < 0 || index >= values.length) return '';
  return values[index].trim();
}

// ========================================
// IMPORT TO SHEET
// ========================================

function importToSheet(products) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ProductsMain');

  if (!sheet) {
    throw new Error('ProductsMain sheet not found. Please generate spreadsheet first.');
  }

  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
  const startRow = sheet.getLastRow() + 1;

  let imported = 0;
  let warnings = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    try {
      const product = products[i];

      // Build row data
      const rowData = [];
      for (const header of headers) {
        let value = '';

        if (header === '☑️ Export') {
          value = false;
        } else if (header === 'ASIN') {
          value = ''; // ASIN not in reverse feed (will be assigned by Amazon)
        } else if (header === 'SKU') {
          value = product.sku;
        } else if (header === 'Product Type') {
          value = product.productType;
        } else if (header === 'Parent SKU') {
          value = product.parentSKU || '';
        } else if (header === 'variationTheme') {
          value = product.variationTheme || '';
        }
        // Title
        else if (header === 'productTitle_DE') {
          value = product.title_DE || '';
        } else if (header === 'productTitle_EN') {
          value = product.title_EN || '';
        }
        // Brand
        else if (header === 'brand_DE') {
          value = product.brand_DE || '';
        } else if (header === 'brand_EN') {
          value = product.brand_EN || '';
        }
        // Bullets
        else if (header === 'bulletPoint1_DE') {
          value = product.bulletPoint1_DE || '';
        } else if (header === 'bulletPoint2_DE') {
          value = product.bulletPoint2_DE || '';
        } else if (header === 'bulletPoint3_DE') {
          value = product.bulletPoint3_DE || '';
        } else if (header === 'bulletPoint4_DE') {
          value = product.bulletPoint4_DE || '';
        } else if (header === 'bulletPoint5_DE') {
          value = product.bulletPoint5_DE || '';
        }
        // Description
        else if (header === 'productDescription_DE') {
          value = product.description_DE || '';
        }
        // Keywords
        else if (header === 'genericKeywords_DE') {
          value = product.keywords_DE || '';
        }
        // Images
        else if (header === 'mainImageURL') {
          value = product.mainImage || '';
        } else if (header === 'additionalImage1_URL') {
          value = product.additionalImage1 || '';
        } else if (header === 'additionalImage2_URL') {
          value = product.additionalImage2 || '';
        } else if (header === 'additionalImage3_URL') {
          value = product.additionalImage3 || '';
        } else if (header === 'additionalImage4_URL') {
          value = product.additionalImage4 || '';
        } else if (header === 'additionalImage5_URL') {
          value = product.additionalImage5 || '';
        }
        // Status
        else if (header === 'Status') {
          value = 'PENDING';
        } else if (header === 'LastModified') {
          value = new Date();
        } else if (header === 'ModifiedBy') {
          value = Session.getActiveUser().getEmail();
        }

        rowData.push(value);
      }

      // Insert row
      sheet.getRange(startRow + imported, 1, 1, rowData.length).setValues([rowData]);
      imported++;

      // Validation warnings
      if (!product.title_DE) warnings++;
      if (!product.brand_DE) warnings++;

    } catch (error) {
      Logger.log(`Error importing product ${products[i].sku}: ${error.message}`);
      errors++;
    }
  }

  // Log import
  logImportOperation(imported, warnings, errors);

  return {
    imported: imported,
    warnings: warnings,
    errors: errors
  };
}

// ========================================
// LOGGING
// ========================================

function logImportOperation(imported, warnings, errors) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logsSheet = ss.getSheetByName('Logs');

  if (!logsSheet) return;

  logsSheet.appendRow([
    new Date(),
    Session.getActiveUser().getEmail(),
    'IMPORT_REVERSE_FEED',
    '',
    'ALL',
    '',
    'SUCCESS',
    `Imported: ${imported}, Warnings: ${warnings}, Errors: ${errors}`,
    ''
  ]);
}

// ========================================
// HELP FUNCTIONS
// ========================================

function showReverseFeedHelp() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'How to Get Amazon Reverse Feed',
    'To download reverse feed from Amazon Seller Central:\n\n' +
    '1. Go to Inventory → Inventory Reports\n' +
    '2. Select "Inventory Loader File" or "Active Listings Report"\n' +
    '3. Choose "All Listings"\n' +
    '4. Download as CSV\n' +
    '5. Upload to Google Drive\n' +
    '6. Get file ID: Right-click → Get link → Copy ID\n' +
    '7. Use Import Reverse Feed function\n\n' +
    'File format: Row 1 = German names, Row 2 = Technical names, Row 3+ = Data',
    ui.ButtonSet.OK
  );
}

function lukoImportByASIN() {
  showInfo('Import by ASIN (API) coming soon!\n\nFor now, use Import Reverse Feed CSV.');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

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

function handleError(functionName, error) {
  Logger.log(`Error in ${functionName}: ${error.message}`);
  Logger.log(error.stack);

  showError(`An error occurred: ${error.message}\n\nCheck logs for details.`);
}
