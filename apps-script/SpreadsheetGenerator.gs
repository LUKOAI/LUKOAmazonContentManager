/**
 * LUKO-ACM Spreadsheet Generator
 * Tworzy pięknie sformatowany arkusz z WSZYSTKIMI polami Amazon
 *
 * UWAGA: Nazwy kart i kolumn BEZ "LUKO" prefix!
 * Format: CamelCase lub snake_case, bez ąćęłńóśźż
 */

// ========================================
// GŁÓWNA FUNKCJA - GENEROWANIE ARKUSZA
// ========================================

/**
 * Generuje kompletny arkusz LUKO-ACM
 * Wywołaj: lukoGenerateFullSpreadsheet()
 */
function lukoGenerateFullSpreadsheet() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Generate LUKO-ACM Spreadsheet',
    'This will create a complete spreadsheet with ALL Amazon fields.\n\n' +
    'This may take 1-2 minutes. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  ui.alert('Generating spreadsheet... Please wait.');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Delete existing sheets except first one
    const sheets = ss.getSheets();
    for (let i = 1; i < sheets.length; i++) {
      ss.deleteSheet(sheets[i]);
    }

    // Rename first sheet
    sheets[0].setName('ProductsMain');

    // Generate all sheets
    generateProductsMainSheet(ss);
    generateAPlusBasicSheet(ss);
    generateAPlusPremiumSheet(ss);
    generateImagesSheet(ss);
    generateVariationsSheet(ss);
    generateLogsSheet(ss);
    generateSettingsSheet(ss);
    generateHelpSheet(ss);

    // Set active sheet to ProductsMain
    ss.setActiveSheet(ss.getSheetByName('ProductsMain'));

    ui.alert('✅ Success!', 'Spreadsheet generated successfully!\n\nAll sheets are ready to use.', ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ Error', 'Failed to generate spreadsheet:\n\n' + error.message, ui.ButtonSet.OK);
    Logger.log('Error in lukoGenerateFullSpreadsheet: ' + error.message);
  }
}

// ========================================
// PRODUCTS MAIN SHEET
// ========================================

function generateProductsMainSheet(ss) {
  const sheet = ss.getSheetByName('ProductsMain');
  sheet.clear();

  // Freeze first 3 rows and 4 columns
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(4);

  // === ROW 1: LANGUAGE SELECTOR ===
  sheet.getRange('A1').setValue('Language:').setFontWeight('bold');
  sheet.getRange('B1').setValue('EN').setFontWeight('bold').setBackground('#4285F4').setFontColor('#FFFFFF');

  const langRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['EN', 'DE', 'PL'], true)
    .build();
  sheet.getRange('B1').setDataValidation(langRule);

  // === ROW 2: INSTRUCTIONS (will be language-switched) ===
  const instructions = {
    'EN': 'Instructions: Fill in product data, check the Export checkbox, then select "Export to Amazon" from the menu.',
    'DE': 'Anleitung: Produktdaten ausfüllen, Export-Checkbox aktivieren, dann "Export to Amazon" im Menü wählen.',
    'PL': 'Instrukcja: Wypełnij dane produktu, zaznacz checkbox Export, następnie wybierz "Export to Amazon" z menu.'
  };

  sheet.getRange('A2:Z2').merge().setValue(instructions['EN']).setFontStyle('italic').setBackground('#FFF3CD');

  // === ROW 3: COLUMN HEADERS ===
  const headers = getProductsMainHeaders();
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);

  // Format headers
  sheet.getRange(3, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setWrap(true)
    .setVerticalAlignment('middle');

  // Set column widths
  sheet.setColumnWidth(1, 50);  // Checkbox
  sheet.setColumnWidth(2, 120); // ASIN
  sheet.setColumnWidth(3, 120); // SKU
  sheet.setColumnWidth(4, 150); // Product Type

  // Auto-resize other columns
  for (let i = 5; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 200);
  }

  // Color code column groups
  colorCodeProductColumns(sheet, headers);

  // Add example row
  addExampleProductRow(sheet, headers);

  // Add data validation for dropdowns
  addProductDataValidation(sheet);

  Logger.log('ProductsMain sheet generated');
}

function getProductsMainHeaders() {
  // Control columns
  const control = [
    '☑️ Export',
    'ASIN',
    'SKU',
    'Product Type'
  ];

  // Product info (non-language specific)
  const productInfo = [
    'Parent ASIN',
    'Parent SKU',
    'EAN',
    'UPC'
  ];

  // Multi-language columns (repeat for each language)
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];
  const mlColumns = [];

  // Title
  languages.forEach(lang => mlColumns.push(`productTitle_${lang}`));

  // Brand
  languages.forEach(lang => mlColumns.push(`brand_${lang}`));

  // Bullet points (5 per language)
  for (let i = 1; i <= 5; i++) {
    languages.forEach(lang => mlColumns.push(`bulletPoint${i}_${lang}`));
  }

  // Description
  languages.forEach(lang => mlColumns.push(`productDescription_${lang}`));

  // Keywords
  languages.forEach(lang => mlColumns.push(`genericKeywords_${lang}`));
  languages.forEach(lang => mlColumns.push(`platinumKeywords1_${lang}`));

  // Dimensions (non-language)
  const dimensions = [
    'itemLength_cm',
    'itemWidth_cm',
    'itemHeight_cm',
    'itemWeight_kg',
    'packageLength_cm',
    'packageWidth_cm',
    'packageHeight_cm',
    'packageWeight_kg'
  ];

  // Status columns
  const status = [
    'Status',
    'ExportDateTime',
    'ProductLink',
    'LastModified',
    'ModifiedBy',
    'ErrorMessage',
    'AI_Prompt'
  ];

  return [...control, ...productInfo, ...mlColumns, ...dimensions, ...status];
}

function colorCodeProductColumns(sheet, headers) {
  // Color scheme
  const colors = {
    control: '#E8F0FE',      // Light blue
    productInfo: '#F3E5F5',  // Light purple
    title: '#E8F5E9',        // Light green
    brand: '#FFF3E0',        // Light orange
    bullets: '#E3F2FD',      // Blue
    description: '#F1F8E9',  // Light lime
    keywords: '#FCE4EC',     // Pink
    dimensions: '#F5F5F5',   // Gray
    status: '#FFEBEE'        // Light red
  };

  let col = 1;

  // Control (4 cols)
  sheet.getRange(3, col, 1, 4).setBackground(colors.control);
  col += 4;

  // Product Info (4 cols)
  sheet.getRange(3, col, 1, 4).setBackground(colors.productInfo);
  col += 4;

  // Title (8 languages)
  sheet.getRange(3, col, 1, 8).setBackground(colors.title);
  col += 8;

  // Brand (8 languages)
  sheet.getRange(3, col, 1, 8).setBackground(colors.brand);
  col += 8;

  // Bullets (5 bullets × 8 languages = 40)
  sheet.getRange(3, col, 1, 40).setBackground(colors.bullets);
  col += 40;

  // Description (8 languages)
  sheet.getRange(3, col, 1, 8).setBackground(colors.description);
  col += 8;

  // Keywords (2 types × 8 languages = 16)
  sheet.getRange(3, col, 1, 16).setBackground(colors.keywords);
  col += 16;

  // Dimensions (8 cols)
  sheet.getRange(3, col, 1, 8).setBackground(colors.dimensions);
  col += 8;

  // Status (remaining cols)
  const remaining = headers.length - col + 1;
  sheet.getRange(3, col, 1, remaining).setBackground(colors.status);
}

function addExampleProductRow(sheet, headers) {
  const exampleRow = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    if (header === '☑️ Export') {
      exampleRow.push(false);
    } else if (header === 'ASIN') {
      exampleRow.push('B08EXAMPLE');
    } else if (header === 'SKU') {
      exampleRow.push('EXAMPLE-SKU-001');
    } else if (header === 'Product Type') {
      exampleRow.push('PRODUCT');
    } else if (header.includes('productTitle_')) {
      exampleRow.push('Example Product Title');
    } else if (header.includes('brand_')) {
      exampleRow.push('YourBrand');
    } else if (header.includes('bulletPoint')) {
      exampleRow.push('Bullet point example');
    } else if (header.includes('productDescription_')) {
      exampleRow.push('Product description example');
    } else if (header.includes('Keywords')) {
      exampleRow.push('keyword1, keyword2, keyword3');
    } else if (header.includes('_cm') || header.includes('_kg')) {
      exampleRow.push('');
    } else if (header === 'Status') {
      exampleRow.push('PENDING');
    } else {
      exampleRow.push('');
    }
  }

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow]);
  sheet.getRange(4, 1, 1, exampleRow.length).setFontStyle('italic').setBackground('#F8F9FA');
}

function addProductDataValidation(sheet) {
  // Status dropdown
  const statusCol = findColumnByName(sheet, 'Status');
  if (statusCol > 0) {
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['PENDING', 'DONE', 'FAILED', 'SKIPPED'], true)
      .build();
    sheet.getRange(4, statusCol, 996).setDataValidation(statusRule);
  }

  // Product Type dropdown (common types)
  const productTypeCol = findColumnByName(sheet, 'Product Type');
  if (productTypeCol > 0) {
    const productTypes = [
      'PRODUCT',
      'BOOK',
      'CLOTHING',
      'SHOES',
      'BEAUTY',
      'HOME',
      'KITCHEN',
      'ELECTRONICS',
      'TOYS',
      'SPORTS',
      'AUTOMOTIVE'
    ];
    const typeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(productTypes, true)
      .build();
    sheet.getRange(4, productTypeCol, 996).setDataValidation(typeRule);
  }
}

// ========================================
// A+ BASIC SHEET
// ========================================

function generateAPlusBasicSheet(ss) {
  const sheet = ss.insertSheet('APlusBasic');
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Row 1: Title
  sheet.getRange('A1:Z1').merge()
    .setValue('A+ Content Basic - All 9 Module Types')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#6A1B9A')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // Row 2: Instructions
  sheet.getRange('A2:Z2').merge()
    .setValue('Fill in content for each module. Each module can have up to 7 modules per ASIN.')
    .setFontStyle('italic')
    .setBackground('#F3E5F5');

  // Headers
  const headers = getAPlusBasicHeaders();
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(3, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#8E24AA')
    .setFontColor('#FFFFFF')
    .setWrap(true);

  // Column widths
  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 80);

  for (let i = 4; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 200);
  }

  Logger.log('APlusBasic sheet generated');
}

function getAPlusBasicHeaders() {
  const control = ['☑️ Export', 'ASIN', 'Module Number', 'Module Type'];
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  // Module 1: Company Logo
  const m1 = [
    'aplus_basic_m1_companyLogoImage_URL',
    ...languages.map(lang => `aplus_basic_m1_companyDescription_${lang}`)
  ];

  // Module 2: Image Text Overlay
  const m2 = [
    'aplus_basic_m2_overlayImage_URL',
    'aplus_basic_m2_overlayColorType',
    ...languages.map(lang => `aplus_basic_m2_headline_${lang}`),
    ...languages.map(lang => `aplus_basic_m2_body_${lang}`)
  ];

  // Module 3: Single Image Highlights
  const m3 = [
    'aplus_basic_m3_image_URL',
    ...languages.map(lang => `aplus_basic_m3_headline_${lang}`),
    ...languages.map(lang => `aplus_basic_m3_highlight1_${lang}`),
    ...languages.map(lang => `aplus_basic_m3_highlight2_${lang}`),
    ...languages.map(lang => `aplus_basic_m3_highlight3_${lang}`),
    ...languages.map(lang => `aplus_basic_m3_highlight4_${lang}`)
  ];

  // Status
  const status = ['Status', 'ExportDateTime', 'ErrorMessage'];

  return [...control, ...m1, ...m2, ...m3, ...status];
}

// ========================================
// A+ PREMIUM SHEET
// ========================================

function generateAPlusPremiumSheet(ss) {
  const sheet = ss.insertSheet('APlusPremium');
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  sheet.getRange('A1:Z1').merge()
    .setValue('A+ Content Premium (Brand Story)')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#C2185B')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  sheet.getRange('A2:Z2').merge()
    .setValue('Premium Brand Story with Hero section, video, and advanced modules.')
    .setFontStyle('italic')
    .setBackground('#F8BBD0');

  const headers = getAPlusPremiumHeaders();
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(3, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#D81B60')
    .setFontColor('#FFFFFF')
    .setWrap(true);

  Logger.log('APlusPremium sheet generated');
}

function getAPlusPremiumHeaders() {
  const control = ['☑️ Export', 'ASIN', 'Brand Story ID'];
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  const hero = [
    'aplus_premium_hero_brandLogo_URL',
    'aplus_premium_hero_heroImage_URL',
    'aplus_premium_hero_heroVideo_URL',
    ...languages.map(lang => `aplus_premium_hero_tagline_${lang}`),
    'aplus_premium_hero_backgroundColor_HEX'
  ];

  const status = ['Status', 'ExportDateTime', 'ErrorMessage'];

  return [...control, ...hero, ...status];
}

// ========================================
// IMAGES SHEET
// ========================================

function generateImagesSheet(ss) {
  const sheet = ss.insertSheet('Images');
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  sheet.getRange('A1:Z1').merge()
    .setValue('Product Images (Main + 8 Additional)')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#1976D2')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  sheet.getRange('A2:Z2').merge()
    .setValue('Main image required. Additional images optional. Min 1000px width/height.')
    .setFontStyle('italic')
    .setBackground('#BBDEFB');

  const headers = getImagesHeaders();
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(3, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1E88E5')
    .setFontColor('#FFFFFF')
    .setWrap(true);

  Logger.log('Images sheet generated');
}

function getImagesHeaders() {
  const control = ['☑️ Export', 'ASIN', 'SKU'];
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  const mainImage = [
    'mainImageURL',
    ...languages.map(lang => `mainImageAlt_${lang}`)
  ];

  const additionalImages = [];
  for (let i = 1; i <= 8; i++) {
    additionalImages.push(`additionalImage${i}_URL`);
    languages.forEach(lang => additionalImages.push(`additionalImage${i}_Alt_${lang}`));
  }

  const status = ['Status', 'ExportDateTime', 'ErrorMessage'];

  return [...control, ...mainImage, ...additionalImages, ...status];
}

// ========================================
// VARIATIONS SHEET
// ========================================

function generateVariationsSheet(ss) {
  const sheet = ss.insertSheet('Variations');
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(4);

  sheet.getRange('A1:Z1').merge()
    .setValue('Product Variations (Parent-Child Relationships)')
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground('#F57C00')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  const headers = [
    '☑️ Export',
    'Parent ASIN',
    'Parent SKU',
    'Child ASIN',
    'Child SKU',
    'Variation Theme',
    'Color Name',
    'Color Map',
    'Size Name',
    'Size Map',
    'Style Name',
    'Material Type',
    'Pattern Name',
    'Status',
    'ExportDateTime',
    'ErrorMessage'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(3, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#FB8C00')
    .setFontColor('#FFFFFF');

  Logger.log('Variations sheet generated');
}

// ========================================
// LOGS SHEET
// ========================================

function generateLogsSheet(ss) {
  const sheet = ss.insertSheet('Logs');
  sheet.setFrozenRows(1);

  const headers = [
    'Timestamp',
    'User',
    'Operation',
    'ASIN',
    'Marketplace',
    'Language',
    'Status',
    'Message',
    'Details'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#455A64')
    .setFontColor('#FFFFFF');

  Logger.log('Logs sheet generated');
}

// ========================================
// SETTINGS SHEET
// ========================================

function generateSettingsSheet(ss) {
  const sheet = ss.insertSheet('Settings');

  sheet.getRange('A1:B1').merge()
    .setValue('LUKO-ACM Settings')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#0D47A1')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  const settings = [
    ['', ''],
    ['Setting', 'Value'],
    ['License Key', ''],
    ['Cloud Function URL', ''],
    ['Default Marketplace', 'DE'],
    ['Default Language', 'DE'],
    ['Auto Export', 'FALSE'],
    ['Batch Size', '50'],
    ['', ''],
    ['Amazon SP-API Credentials', ''],
    ['LWA Client ID', ''],
    ['LWA Client Secret', ''],
    ['Refresh Token', ''],
    ['Seller ID', '']
  ];

  sheet.getRange(1, 1, settings.length, 2).setValues(settings);
  sheet.getRange(2, 1, 1, 2).setFontWeight('bold').setBackground('#90CAF9');
  sheet.getRange(10, 1, 1, 2).setFontWeight('bold').setBackground('#FFE082');

  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 400);

  Logger.log('Settings sheet generated');
}

// ========================================
// HELP SHEET
// ========================================

function generateHelpSheet(ss) {
  const sheet = ss.insertSheet('Help');

  sheet.getRange('A1:B1').merge()
    .setValue('LUKO-ACM Help & Resources')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#2E7D32')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  const helpContent = [
    ['', ''],
    ['Quick Start', ''],
    ['1. Fill in Settings sheet', 'Enter your Amazon API credentials'],
    ['2. Enter product data', 'Fill in ProductsMain sheet'],
    ['3. Check Export checkbox', 'Select products to export'],
    ['4. Click Export menu', 'Amazon Manager → Export to Amazon'],
    ['', ''],
    ['Support', ''],
    ['Email:', 'support@netanaliza.com'],
    ['Documentation:', 'https://docs.netanaliza.com/luko-acm'],
    ['', ''],
    ['Amazon Resources', ''],
    ['Seller Central:', 'https://sellercentral.amazon.com'],
    ['SP-API Docs:', 'https://developer-docs.amazon.com/sp-api/'],
    ['A+ Content Guide:', 'https://sellercentral.amazon.com/gp/help/G202102950']
  ];

  sheet.getRange(1, 1, helpContent.length, 2).setValues(helpContent);
  sheet.getRange(2, 1, 1, 2).setFontWeight('bold').setBackground('#A5D6A7');
  sheet.getRange(8, 1, 1, 2).setFontWeight('bold').setBackground('#FFE082');
  sheet.getRange(12, 1, 1, 2).setFontWeight('bold').setBackground('#90CAF9');

  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 500);

  Logger.log('Help sheet generated');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function findColumnByName(sheet, columnName) {
  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
  const index = headers.indexOf(columnName);
  return index >= 0 ? index + 1 : -1;
}

// ========================================
// MENU
// ========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 LUKO Generator')
    .addItem('Generate Full Spreadsheet', 'lukoGenerateFullSpreadsheet')
    .addSeparator()
    .addItem('About', 'showAbout')
    .addToUi();
}

function showAbout() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'LUKO-ACM Spreadsheet Generator',
    'Version 1.0.0\n\nGenerates complete Amazon content management spreadsheet with:\n\n' +
    '• Product listings (all fields)\n' +
    '• A+ Content Basic & Premium\n' +
    '• Images & Videos\n' +
    '• Variations\n' +
    '• Multi-language support\n\n' +
    'Support: support@netanaliza.com',
    ui.ButtonSet.OK
  );
}
