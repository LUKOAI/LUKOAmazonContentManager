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
    generateTemplatesSheet(ss);
    generateAPlusBasicSheet(ss);
    generateAPlusPremiumSheet(ss);
    generateImagesSheet(ss);
    generateVariationsSheet(ss);
    generateCouponsSheet(ss);
    generatePromoCodesSheet(ss);
    generateLogsSheet(ss);
    generateErrorLogSheet(ss);
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
    'Template',
    'ASIN',
    'SKU',
    'Product Type'
  ];

  // Product info (non-language specific)
  const productInfo = [
    'Parent ASIN',
    'Parent SKU',
    'EAN',
    'UPC',
    'variationTheme'
  ];

  // Multi-language columns (repeat for each language)
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];
  const mlColumns = [];

  // Title
  languages.forEach(lang => mlColumns.push(`productTitle_${lang}`));

  // Brand
  languages.forEach(lang => mlColumns.push(`brand_${lang}`));

  // Manufacturer (per language)
  languages.forEach(lang => mlColumns.push(`manufacturer_${lang}`));

  // Bullet points (9 per language - Amazon supports up to 9)
  for (let i = 1; i <= 9; i++) {
    languages.forEach(lang => mlColumns.push(`bulletPoint${i}_${lang}`));
  }

  // Description
  languages.forEach(lang => mlColumns.push(`productDescription_${lang}`));

  // Keywords
  languages.forEach(lang => mlColumns.push(`genericKeywords_${lang}`));

  // Platinum Keywords (1-5 per language)
  for (let i = 1; i <= 5; i++) {
    languages.forEach(lang => mlColumns.push(`platinumKeywords${i}_${lang}`));
  }

  // Target Audience Keywords (per language)
  languages.forEach(lang => mlColumns.push(`targetAudienceKeywords_${lang}`));

  // Legal Disclaimer (per language)
  languages.forEach(lang => mlColumns.push(`legalDisclaimer_${lang}`));

  // Safety Warning (per language)
  languages.forEach(lang => mlColumns.push(`safetyWarning_${lang}`));

  // Dimensions (non-language) - values assumed in cm/kg, will be converted by Cloud Function
  const dimensions = [
    'itemLength',
    'itemWidth',
    'itemHeight',
    'itemWeight',
    'packageLength',
    'packageWidth',
    'packageHeight',
    'packageWeight',
    'modelNumber',
    'releaseDate',
    'packageQuantity'
  ];

  // Images (URLs)
  const images = [
    'mainImageURL',
    'additionalImage1_URL',
    'additionalImage2_URL',
    'additionalImage3_URL',
    'additionalImage4_URL',
    'additionalImage5_URL',
    'additionalImage6_URL',
    'additionalImage7_URL',
    'additionalImage8_URL'
  ];

  // GPSR Fields (EU compliance - effective Dec 13, 2024)
  const gpsr = [
    'manufacturer_name',
    'manufacturer_address',
    'manufacturer_email',
    'manufacturer_phone',
    'responsiblePerson_name',
    'responsiblePerson_address',
    'responsiblePerson_email',
    'responsiblePerson_phone',
    'safetyInformation_URL',
    'complianceDocument_URL',
    'warningLabel_URL'
  ];

  // Documents (PDFs and other files)
  const documents = [
    'userManual_URL',
    'assemblyInstructions_URL',
    'warrantyCard_URL',
    'complianceCertificate_URL',
    'testReport_URL'
  ];

  // Pricing fields
  const pricing = [
    'ourPrice',
    'currency',
    'discountedPrice',
    'discountStartDate',
    'discountEndDate'
  ];

  // Inventory fields
  const inventory = [
    'quantity',
    'fulfillmentChannel'
  ];

  // Compliance fields (EU requirements)
  const compliance = [
    'countryOfOrigin',
    'batteriesRequired',
    'isLithiumBattery',
    'supplierDeclaredDgHzRegulation',
    'adultProduct'
  ];

  // Fashion-specific (multi-language where applicable)
  const fashionFields = [];
  languages.forEach(lang => {
    fashionFields.push(`color_${lang}`);
    fashionFields.push(`material_${lang}`);
    fashionFields.push(`careInstructions_${lang}`);
    fashionFields.push(`closure_${lang}`);
  });
  const fashionNonML = ['size', 'sizeChart_URL'];

  // Status columns
  const status = [
    'Status',
    'ExportDateTime',
    'ProductLink',
    'LastModified',
    'ModifiedBy',
    'ErrorMessage',
    'ValidationOverride',
    'AI_Prompt'
  ];

  return [
    ...control,
    ...productInfo,
    ...mlColumns,
    ...dimensions,
    ...images,
    ...pricing,
    ...inventory,
    ...compliance,
    ...gpsr,
    ...documents,
    ...fashionFields,
    ...fashionNonML,
    ...status
  ];
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
// COUPONS SHEET
// ========================================

function generateCouponsSheet(ss) {
  const sheet = ss.insertSheet('Coupons');

  // Header
  sheet.getRange('A1:M1').merge()
    .setValue('🎟️ Coupons & Promotions Manager')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#E91E63')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // Instructions
  sheet.getRange('A2:M2').merge()
    .setValue('Create and manage Amazon coupons and promotions. Generated codes will appear in PromoCodes sheet.')
    .setFontStyle('italic')
    .setBackground('#FCE4EC')
    .setWrapText(true);

  // Column headers
  const headers = [
    '☑️ Create',
    'Coupon ID',
    'Title',
    'Discount Type',
    'Discount Value',
    'Target Type',
    'Target ASINs/SKUs',
    'Start Date',
    'End Date',
    'Total Budget',
    'Uses Per Customer',
    'Code Visibility',
    'Generated Codes Count',
    'Status',
    'Created Date',
    'Notes'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#F06292')
    .setFontColor('#FFFFFF');

  // Data validation for Discount Type
  const discountTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Percentage', 'Fixed Amount'], true)
    .build();
  sheet.getRange(4, 4, 100, 1).setDataValidation(discountTypeRule);

  // Data validation for Target Type
  const targetTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['All Products', 'Specific ASINs', 'Specific SKUs', 'Category'], true)
    .build();
  sheet.getRange(4, 6, 100, 1).setDataValidation(targetTypeRule);

  // Data validation for Code Visibility
  const visibilityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Public (Single Code)', 'Private (Multiple Codes)', 'Auto-Apply'], true)
    .build();
  sheet.getRange(4, 12, 100, 1).setDataValidation(visibilityRule);

  // Column widths
  sheet.setColumnWidth(1, 80);  // Checkbox
  sheet.setColumnWidth(2, 150); // Coupon ID
  sheet.setColumnWidth(3, 200); // Title
  sheet.setColumnWidth(4, 130); // Discount Type
  sheet.setColumnWidth(5, 110); // Discount Value
  sheet.setColumnWidth(6, 130); // Target Type
  sheet.setColumnWidth(7, 250); // Target ASINs/SKUs
  sheet.setColumnWidth(8, 110); // Start Date
  sheet.setColumnWidth(9, 110); // End Date
  sheet.setColumnWidth(10, 100); // Budget
  sheet.setColumnWidth(11, 130); // Uses Per Customer
  sheet.setColumnWidth(12, 180); // Code Visibility
  sheet.setColumnWidth(13, 150); // Generated Codes Count
  sheet.setColumnWidth(14, 100); // Status
  sheet.setColumnWidth(15, 120); // Created Date
  sheet.setColumnWidth(16, 200); // Notes

  // Example row
  const exampleRow = [
    false,
    'SUMMER2025',
    '15% Summer Sale on Furniture',
    'Percentage',
    15,
    'Specific ASINs',
    'B0ABC123, B0DEF456, B0GHI789',
    '2025-06-01',
    '2025-08-31',
    5000,
    1,
    'Public (Single Code)',
    1,
    'Draft',
    new Date(),
    'Summer promotion for furniture category'
  ];

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow])
    .setBackground('#FFF0F5')
    .setFontStyle('italic');

  // Instructions section
  const instrRow = 7;
  sheet.getRange(instrRow, 1, 1, 16).merge()
    .setValue('💡 How to Create Coupons')
    .setFontWeight('bold')
    .setBackground('#F8BBD0')
    .setHorizontalAlignment('center');

  const instructions = [
    ['1. Fill in coupon details (Title, Discount Type, Value, Dates)'],
    ['2. Choose Target Type: All Products, Specific ASINs, or Category'],
    ['3. Select Code Visibility:'],
    ['   • Public (Single Code): One code for everyone (e.g., SUMMER15)'],
    ['   • Private (Multiple Codes): Generate unique codes (e.g., 1000 unique codes)'],
    ['   • Auto-Apply: Automatically applies at checkout (no code needed)'],
    ['4. Check ☑️ Create box'],
    ['5. Menu → Promotions → Create Coupons'],
    ['6. Generated codes will appear in PromoCodes sheet'],
    [''],
    ['⚠️ Important:'],
    ['• Budget in EUR (total amount Amazon will reimburse you)'],
    ['• Uses Per Customer: how many times one customer can use it (usually 1)'],
    ['• For Private codes: enter count in "Generated Codes Count" BEFORE creating']
  ];

  sheet.getRange(instrRow + 1, 1, instructions.length, 1).setValues(instructions)
    .setBackground('#FCE4EC')
    .setWrapText(true);

  Logger.log('Coupons sheet generated');
}

// ========================================
// PROMO CODES SHEET
// ========================================

function generatePromoCodesSheet(ss) {
  const sheet = ss.insertSheet('PromoCodes');

  // Header
  sheet.getRange('A1:H1').merge()
    .setValue('🎫 Generated Promo Codes')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#9C27B0')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // Instructions
  sheet.getRange('A2:H2').merge()
    .setValue('This sheet is automatically populated when you create coupons with "Private (Multiple Codes)" visibility.')
    .setFontStyle('italic')
    .setBackground('#E1BEE7')
    .setWrapText(true);

  // Column headers
  const headers = [
    'Coupon ID',
    'Promo Code',
    'Status',
    'Used Count',
    'Max Uses',
    'Created Date',
    'Claimed By',
    'Claimed Date'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#BA68C8')
    .setFontColor('#FFFFFF');

  // Example codes (will be deleted when first real codes imported)
  const exampleCodes = [
    ['SUMMER2025', 'SUM-ABC-123', 'Active', 0, 1, new Date(), '', ''],
    ['SUMMER2025', 'SUM-DEF-456', 'Active', 0, 1, new Date(), '', ''],
    ['SUMMER2025', 'SUM-GHI-789', 'Active', 1, 1, new Date(), 'customer@example.com', new Date()],
    ['SUMMER2025', 'SUM-JKL-012', 'Active', 0, 1, new Date(), '', '']
  ];

  sheet.getRange(4, 1, exampleCodes.length, exampleCodes[0].length).setValues(exampleCodes)
    .setBackground('#F3E5F5')
    .setFontStyle('italic');

  // Column widths
  sheet.setColumnWidth(1, 150); // Coupon ID
  sheet.setColumnWidth(2, 150); // Promo Code
  sheet.setColumnWidth(3, 100); // Status
  sheet.setColumnWidth(4, 100); // Used Count
  sheet.setColumnWidth(5, 100); // Max Uses
  sheet.setColumnWidth(6, 150); // Created Date
  sheet.setColumnWidth(7, 200); // Claimed By
  sheet.setColumnWidth(8, 150); // Claimed Date

  // Usage stats section
  const statsRow = 4 + exampleCodes.length + 2;
  sheet.getRange(statsRow, 1, 1, 8).merge()
    .setValue('📊 Usage Statistics (per Coupon ID)')
    .setFontWeight('bold')
    .setBackground('#CE93D8')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  const statsHeaders = [
    'Coupon ID',
    'Total Codes Generated',
    'Total Used',
    'Total Available',
    'Usage %',
    'Total Revenue Impact',
    'Average Discount',
    'Last Used'
  ];

  sheet.getRange(statsRow + 1, 1, 1, statsHeaders.length).setValues([statsHeaders])
    .setFontWeight('bold')
    .setBackground('#E1BEE7');

  // Example stats
  const exampleStats = [
    ['SUMMER2025', 1000, 247, 753, '24.7%', '€3,705', '€15.00', new Date()],
    ['WINTER2024', 500, 482, 18, '96.4%', '€7,230', '€15.00', new Date()]
  ];

  sheet.getRange(statsRow + 2, 1, exampleStats.length, exampleStats[0].length).setValues(exampleStats)
    .setBackground('#F3E5F5')
    .setFontStyle('italic');

  // Instructions footer
  sheet.getRange(statsRow + 4 + exampleStats.length, 1, 1, 8).merge()
    .setValue('💡 TIP: You can export this sheet to CSV and distribute codes via email campaigns, influencers, or your website.')
    .setBackground('#FFF9C4')
    .setFontStyle('italic')
    .setWrapText(true);

  Logger.log('PromoCodes sheet generated');
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
// TEMPLATES SHEET
// ========================================

function generateTemplatesSheet(ss) {
  const sheet = ss.insertSheet('Templates');

  // Header
  sheet.getRange('A1:F1').merge()
    .setValue('📋 Product Listing Templates - Choose Your Layout')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#6200EA')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // Instructions
  sheet.getRange('A2:F2').merge()
    .setValue('Select a template in ProductsMain to auto-highlight required fields. Each template shows estimated time and difficulty.')
    .setFontStyle('italic')
    .setBackground('#EDE7F6')
    .setWrapText(true);

  // Column headers
  const headers = ['Template ID', 'Name', 'Symbol', 'Category', 'Difficulty', 'Est. Time', 'Description', 'Why It Works', 'Required Fields Count'];
  sheet.getRange(3, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#B388FF')
    .setFontColor('#FFFFFF');

  // Template data (embedded from config)
  const templates = [
    ['T01', 'Basic Essentials', '⭐', 'all', 'beginner', '5-10 min',
     'Minimum required fields - quick listing for standard products',
     'Fast setup, Amazon-compliant, perfect for simple products', '15 fields'],

    ['T02', 'Multi-Language Premium', '🌍', 'all', 'intermediate', '20-30 min',
     'Full translations for all 8 EU languages - maximum market reach',
     'Reaches ALL European customers in native language, increases conversion 30-40%', '120+ fields'],

    ['T03', 'Visual Storyteller', '📸', 'all', 'intermediate', '15-20 min',
     'Focus on images - lifestyle photos + infographics',
     'Images sell! 7+ quality images increase conversion by 60%', '25 fields'],

    ['T04', 'A+ Content Basic', '✨', 'all', 'advanced', '30-45 min',
     'Enhanced Brand Content with A+ Basic modules (5 modules)',
     'A+ Content increases conversion 5-10%, reduces returns, builds brand trust', '50+ fields'],

    ['T05', 'Fashion Complete', '👕', 'fashion', 'intermediate', '25-35 min',
     'Complete fashion listing - size charts, materials, care instructions',
     'Detailed size/material info reduces returns by 40%, builds buyer confidence', '40 fields'],

    ['T06', 'Home & Furniture Pro', '🛋️', 'home_garden', 'intermediate', '20-30 min',
     'Furniture/home decor with dimensions, assembly, materials',
     'Clear dimensions/assembly info = fewer returns', '35 fields'],

    ['T07', 'Electronics Tech Specs', '🔌', 'electronics', 'advanced', '30-40 min',
     'Electronics with full technical specifications',
     'Detailed specs attract tech-savvy buyers, reduce support questions', '45 fields'],

    ['T08', 'GPSR Compliant EU', '🇪🇺', 'all', 'advanced', '40-60 min',
     'Full GPSR compliance for EU markets (required from Dec 2024)',
     'MANDATORY for EU sales, prevents account suspension', '30 fields'],

    ['T09', 'Premium A+ with Video', '🎬', 'all', 'expert', '60-90 min',
     'Premium A+ Content with video, comparison table, FAQ (7 modules)',
     'Video increases conversion 80%, comparison tables help decision-making', '80+ fields'],

    ['T10', 'Quick Launch Variations', '🎨', 'variations', 'intermediate', '15-25 min/child',
     'Parent-child variations (color, size) - family setup',
     'Variation families consolidate reviews, increase visibility', '20 fields/child']
  ];

  sheet.getRange(4, 1, templates.length, templates[0].length).setValues(templates);

  // Color code by difficulty
  for (let i = 0; i < templates.length; i++) {
    const difficulty = templates[i][4];
    let color = '#E8F5E9'; // beginner - green
    if (difficulty === 'intermediate') color = '#FFF3E0'; // orange
    if (difficulty === 'advanced') color = '#FCE4EC'; // pink
    if (difficulty === 'expert') color = '#EDE7F6'; // purple

    sheet.getRange(4 + i, 1, 1, templates[0].length).setBackground(color);
  }

  // Column widths
  sheet.setColumnWidth(1, 100); // ID
  sheet.setColumnWidth(2, 200); // Name
  sheet.setColumnWidth(3, 60);  // Symbol
  sheet.setColumnWidth(4, 120); // Category
  sheet.setColumnWidth(5, 120); // Difficulty
  sheet.setColumnWidth(6, 100); // Time
  sheet.setColumnWidth(7, 350); // Description
  sheet.setColumnWidth(8, 400); // Why It Works
  sheet.setColumnWidth(9, 140); // Field Count

  // Legend
  const legendRow = 4 + templates.length + 2;
  sheet.getRange(legendRow, 1, 1, 2).merge()
    .setValue('Difficulty Legend:')
    .setFontWeight('bold');

  sheet.getRange(legendRow + 1, 1).setValue('Beginner').setBackground('#E8F5E9');
  sheet.getRange(legendRow + 2, 1).setValue('Intermediate').setBackground('#FFF3E0');
  sheet.getRange(legendRow + 3, 1).setValue('Advanced').setBackground('#FCE4EC');
  sheet.getRange(legendRow + 4, 1).setValue('Expert').setBackground('#EDE7F6');

  // Instructions footer
  sheet.getRange(legendRow + 6, 1, 1, 9).merge()
    .setValue('💡 TIP: Enter template ID (e.g., T01) in the Template column of ProductsMain sheet. Required fields will be auto-highlighted!')
    .setBackground('#FFF9C4')
    .setFontStyle('italic')
    .setWrapText(true);

  Logger.log('Templates sheet generated');
}

// ========================================
// ERROR LOG SHEET
// ========================================

function generateErrorLogSheet(ss) {
  const sheet = ss.insertSheet('ErrorLog');

  // Header
  sheet.getRange('A1:H1').merge()
    .setValue('❌ Export Errors & Validation Issues')
    .setFontWeight('bold')
    .setFontSize(16)
    .setBackground('#C62828')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // Instructions
  sheet.getRange('A2:H2').merge()
    .setValue('This sheet automatically captures export errors and validation issues. Each error includes Amazon\'s message and our recommended fix.')
    .setFontStyle('italic')
    .setBackground('#FFCDD2')
    .setWrapText(true);

  // Column headers
  const headers = [
    'Timestamp',
    'SKU',
    'ASIN',
    'Error Type',
    'Amazon Error Code',
    'Amazon Message',
    'Our Recommendation',
    'Affected Fields',
    'Status'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#EF5350')
    .setFontColor('#FFFFFF');

  // Example error row (will be deleted when first real error comes)
  const exampleRow = [
    new Date(),
    'EXAMPLE-SKU-001',
    'B0EXAMPLE1',
    'Validation Error',
    '5665',
    'The title contains prohibited characters: $ and _',
    'Remove special characters $ and _ from product title. Only these are allowed: dash (-), ampersand (&), comma (,), period (.)',
    'productTitle_DE, productTitle_EN',
    'Example'
  ];

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow])
    .setBackground('#FFEBEE')
    .setFontStyle('italic');

  // Column widths
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 120); // SKU
  sheet.setColumnWidth(3, 120); // ASIN
  sheet.setColumnWidth(4, 150); // Error Type
  sheet.setColumnWidth(5, 130); // Error Code
  sheet.setColumnWidth(6, 350); // Amazon Message
  sheet.setColumnWidth(7, 450); // Our Recommendation
  sheet.setColumnWidth(8, 200); // Affected Fields
  sheet.setColumnWidth(9, 100); // Status

  // Common errors reference section
  const refRow = 7;
  sheet.getRange(refRow, 1, 1, 9).merge()
    .setValue('📖 Common Error Codes Reference')
    .setFontWeight('bold')
    .setBackground('#B39DDB')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  const commonErrors = [
    ['Error Code', 'Description', 'Common Cause', 'How to Fix'],
    ['5665', 'Invalid Characters', 'Prohibited chars in title: !, $, ?, _, etc.', 'Remove special characters from title'],
    ['8541', 'Title Too Long', 'Title exceeds 200 characters', 'Shorten title to max 200 chars'],
    ['8552', 'Repeated Words', 'Same word appears more than 2x in title', 'Remove duplicate words from title'],
    ['90127', 'Prohibited Terms', 'Forbidden words like "best", "FDA approved"', 'Replace with allowed alternatives (see validation-rules.json)'],
    ['18000', 'Missing Required Field', 'Required field (brand, title, etc.) is empty', 'Fill in all required fields for your product type'],
    ['8026', 'Invalid Image', 'Image doesn\'t meet requirements (size, format, background)', 'Use 2000x2000px JPEG/PNG with white background'],
    ['13012', 'GPSR Missing', 'GPSR data missing (required for EU)', 'Add manufacturer and responsible person data'],
    ['8560', 'Bullet Points Too Long', 'Bullet point exceeds 500 characters', 'Shorten bullet points to max 500 chars each']
  ];

  sheet.getRange(refRow + 2, 1, commonErrors.length, commonErrors[0].length).setValues(commonErrors);
  sheet.getRange(refRow + 2, 1, 1, commonErrors[0].length)
    .setFontWeight('bold')
    .setBackground('#D1C4E9');

  // Alternate row colors for readability
  for (let i = 1; i < commonErrors.length; i++) {
    const color = i % 2 === 0 ? '#F3E5F5' : '#FFFFFF';
    sheet.getRange(refRow + 2 + i, 1, 1, commonErrors[0].length).setBackground(color);
  }

  Logger.log('ErrorLog sheet generated');
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
