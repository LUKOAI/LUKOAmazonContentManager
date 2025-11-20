/**
 * LUKO Amazon Content Manager - Complete Setup Installer
 *
 * GŁÓWNY SKRYPT INSTALACYJNY
 * Uruchom: Amazon Manager → Tools → 🎨 Generate Spreadsheet
 *
 * Tworzy WSZYSTKO:
 * - Arkusz Config (z poprawnymi polami)
 * - Wszystkie podstawowe arkusze
 * - 6 nowych arkuszy Extended Features
 * - 4 arkusze Brand Store
 * - Formatowanie, kolumny, walidacje
 *
 * @author LUKO-ACM
 * @version 2.1.0
 */

/**
 * GŁÓWNA FUNKCJA INSTALACYJNA
 * Wywołaj tę funkcję aby stworzyć cały system
 */
function lukoGenerateFullSpreadsheet() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Generate Complete Spreadsheet',
    'This will create ALL sheets and configuration.\n\n' +
    'IMPORTANT: This will replace existing sheets!\n' +
    'Make sure you have a backup if needed.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Progress tracking
    const totalSteps = 18;
    let currentStep = 0;

    function updateProgress(message) {
      currentStep++;
      ss.toast(`Step ${currentStep}/${totalSteps}: ${message}`, 'Installing...', 3);
    }

    // STEP 1: Create Config sheet (FIRST - most important!)
    updateProgress('Creating Config sheet');
    generateConfigSheet();

    // STEP 2: Create ErrorLog sheet
    updateProgress('Creating ErrorLog sheet');
    generateErrorLogSheet();

    // STEP 3: Create Templates sheet
    updateProgress('Creating Templates sheet');
    generateTemplatesSheet();

    // STEP 4: Create ProductsMain sheet
    updateProgress('Creating ProductsMain sheet');
    generateProductsMainSheet();

    // STEP 5-10: Extended Features sheets (Phase 2)
    updateProgress('Creating GPSR Compliance sheet');
    generateGpsrSheet();

    updateProgress('Creating Documents sheet');
    generateDocumentsSheet();

    updateProgress('Creating Customization sheet');
    generateCustomizationSheet();

    updateProgress('Creating Brand Strip sheet');
    generateBrandStripSheet();

    updateProgress('Creating Videos sheet');
    generateVideosSheet();

    // STEP 11-14: Brand Store sheets (4 sheets)
    updateProgress('Creating Brand Store Config');
    generateBrandStoreSheets(); // This creates all 4 Brand Store sheets

    // STEP 15: Organize sheet order
    updateProgress('Organizing sheets');
    organizeSheetOrder();

    // STEP 16: Set active sheet to Config
    updateProgress('Finalizing');
    const configSheet = ss.getSheetByName('Config');
    if (configSheet) {
      ss.setActiveSheet(configSheet);
    }

    // STEP 17: Show success message
    updateProgress('Complete!');

    ui.alert(
      '✅ Installation Complete!',
      'All sheets have been created successfully!\n\n' +
      'NEXT STEPS:\n' +
      '1. Fill in Config sheet (Cloud Function URL, API credentials)\n' +
      '2. Start adding your products to ProductsMain\n' +
      '3. Use Extended Features for GPSR, Documents, etc.\n\n' +
      'Sheet count: ' + ss.getSheets().length,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('❌ Error', 'Failed to generate spreadsheet:\n\n' + error.toString(), ui.ButtonSet.OK);
    Logger.log('Installation error: ' + error.toString());
    Logger.log(error.stack);
  }
}

/**
 * Generate Config sheet with proper structure
 * NO FROZEN COLUMNS - simple key-value pairs
 */
function generateConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if Config already exists
  const oldConfig = ss.getSheetByName('Config');

  let sheet;

  if (oldConfig) {
    // Clear existing Config instead of deleting (to avoid "can't remove all sheets" error)
    sheet = oldConfig;
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
    sheet.clear();
    sheet.clearFormats();
  } else {
    // Create new Config sheet
    sheet = ss.insertSheet('Config');
  }

  // Set sheet color
  sheet.setTabColor('#4a86e8'); // Blue

  // Header row
  sheet.getRange('A1').setValue('LUKO Amazon Content Manager - Configuration');
  sheet.getRange('A1').setFontSize(14).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
  sheet.getRange('A1:B1').merge();

  // Instructions row
  sheet.getRange('A2').setValue('Fill in your Amazon SP-API credentials and Cloud Function URL below:');
  sheet.getRange('A2').setFontStyle('italic').setBackground('#d9ead3');
  sheet.getRange('A2:B2').merge();

  // Configuration data (Key-Value pairs)
  const configData = [
    ['Configuration Key', 'Value'],
    ['Cloud Function URL', ''], // User fills this
    ['LWA Client ID', ''], // User fills this
    ['LWA Client Secret', ''], // User fills this
    ['Refresh Token', ''], // User fills this
    ['Seller ID', ''], // User fills this
    ['', ''],
    ['--- Additional Settings ---', ''],
    ['Default Marketplace', 'DE'],
    ['Auto-Translate', 'No'],
    ['Batch Size', '50'],
    ['Max Retries', '3']
  ];

  sheet.getRange(3, 1, configData.length, 2).setValues(configData);

  // Format header row (row 3)
  sheet.getRange('A3:B3').setFontWeight('bold').setBackground('#f3f3f3');

  // Format required fields (rows 4-8) - light yellow
  sheet.getRange('A4:B8').setBackground('#fff3cd');

  // Format section header (row 10)
  sheet.getRange('A10:B10').setFontWeight('bold').setBackground('#e8eaf6');

  // Column widths
  sheet.setColumnWidth(1, 250); // Key column
  sheet.setColumnWidth(2, 500); // Value column

  // Freeze header rows (rows 1-3)
  sheet.setFrozenRows(3);

  // Add notes
  sheet.getRange('A4').setNote('Enter your Google Cloud Function URL here (e.g., https://your-region-your-project.cloudfunctions.net/lukoSpApiHandler)');
  sheet.getRange('A5').setNote('Login with Amazon (LWA) Client ID from Amazon Seller Central → Developer → App credentials');
  sheet.getRange('A6').setNote('LWA Client Secret from Amazon Seller Central');
  sheet.getRange('A7').setNote('Refresh Token obtained during OAuth flow');
  sheet.getRange('A8').setNote('Your Amazon Seller ID / Merchant ID');

  Logger.log('✅ Config sheet created successfully');
}

/**
 * Generate ErrorLog sheet
 */
function generateErrorLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if exists
  const oldSheet = ss.getSheetByName('ErrorLog');

  let sheet;
  if (oldSheet) {
    sheet = oldSheet;
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
    sheet.clear();
    sheet.clearFormats();
  } else {
    sheet = ss.insertSheet('ErrorLog');
  }
  sheet.setTabColor('#ea4335'); // Red

  // Headers
  const headers = [
    'Timestamp',
    'Level',
    'Message',
    'User',
    'Function',
    'Sheet',
    'Row',
    'Details'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#ea4335').setFontColor('#ffffff');

  // Column widths
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 80);  // Level
  sheet.setColumnWidth(3, 300); // Message
  sheet.setColumnWidth(4, 150); // User
  sheet.setColumnWidth(5, 150); // Function
  sheet.setColumnWidth(6, 100); // Sheet
  sheet.setColumnWidth(7, 60);  // Row
  sheet.setColumnWidth(8, 400); // Details

  sheet.setFrozenRows(1);

  Logger.log('✅ ErrorLog sheet created');
}

/**
 * Generate Templates sheet
 */
function generateTemplatesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const oldSheet = ss.getSheetByName('Templates');

  let sheet;
  if (oldSheet) {
    sheet = oldSheet;
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
    sheet.clear();
    sheet.clearFormats();
  } else {
    sheet = ss.insertSheet('Templates');
  }
  sheet.setTabColor('#f4b400'); // Yellow

  // Header
  sheet.getRange('A1').setValue('Product Templates');
  sheet.getRange('A1').setFontSize(14).setFontWeight('bold').setBackground('#f4b400').setFontColor('#ffffff');
  sheet.getRange('A1:E1').merge();

  // Column headers
  const headers = ['Template Name', 'Product Type', 'Category', 'Description', 'Use Count'];
  sheet.getRange(2, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setFontWeight('bold').setBackground('#fef7e0');

  // Example templates
  const templates = [
    ['Basic Product', 'PRODUCT', 'General', 'Simple product with basic fields', 0],
    ['Electronics', 'PRODUCT', 'Electronics', 'Electronic products with technical specs', 0],
    ['Clothing', 'PRODUCT', 'Apparel', 'Clothing items with size/color variants', 0]
  ];

  sheet.getRange(3, 1, templates.length, headers.length).setValues(templates);

  // Column widths
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 350);
  sheet.setColumnWidth(5, 100);

  sheet.setFrozenRows(2);

  Logger.log('✅ Templates sheet created');
}

/**
 * Generate ProductsMain sheet
 */
function generateProductsMainSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const oldSheet = ss.getSheetByName('ProductsMain');

  let sheet;
  if (oldSheet) {
    sheet = oldSheet;
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
    sheet.clear();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
  } else {
    sheet = ss.insertSheet('ProductsMain');
  }
  sheet.setTabColor('#34a853'); // Green

  // Title row
  sheet.getRange('A1').setValue('LUKO Amazon Content Manager - Products Main');
  sheet.getRange('A1').setFontSize(14).setFontWeight('bold').setBackground('#34a853').setFontColor('#ffffff');
  sheet.getRange('A1:P1').merge();

  // Instructions row
  sheet.getRange('A2').setValue('Add your products here. Fill ASIN, SKU, and content in multiple languages. Check ☑️ Export to export to Amazon.');
  sheet.getRange('A2').setFontStyle('italic').setBackground('#d9ead3');
  sheet.getRange('A2:P2').merge();

  // Headers (simplified - core fields only)
  const headers = [
    '☑️ Export',
    'ASIN',
    'SKU',
    'Parent ASIN',
    'Parent SKU',
    'Product Type',
    'Brand',
    'Marketplace',
    'mainImageURL',
    'Status',
    'Export DateTime',
    'ProductLink',
    'Last Modified',
    'Modified By',
    'Error Messages',
    'Notes'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(3, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f3f3');

  // Data validation for checkbox (column A)
  const checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange(4, 1, 1000, 1).setDataValidation(checkboxRule);

  // Data validation for Status (column J)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'DONE', 'FAILED'], true)
    .build();
  sheet.getRange(4, 10, 1000, 1).setDataValidation(statusRule);

  // Example row
  const exampleRow = [
    false, // Checkbox
    'B08XYZ1234', // ASIN
    'SKU-EXAMPLE-001', // SKU
    '', // Parent ASIN
    '', // Parent SKU
    'PRODUCT', // Product Type
    'YourBrand', // Brand
    'DE', // Marketplace
    'https://example.com/image.jpg', // mainImageURL
    '', // Status
    '', // Export DateTime
    '', // ProductLink
    new Date(), // Last Modified
    Session.getActiveUser().getEmail(), // Modified By
    '', // Error Messages
    'Example product - delete this row' // Notes
  ];

  sheet.getRange(4, 1, 1, headers.length).setValues([exampleRow]);
  sheet.getRange(4, 1, 1, headers.length).setBackground('#fff3cd'); // Light yellow for example

  // Column widths
  sheet.setColumnWidth(1, 50);  // Checkbox
  sheet.setColumnWidth(2, 110); // ASIN
  sheet.setColumnWidth(3, 150); // SKU
  sheet.setColumnWidth(4, 110); // Parent ASIN
  sheet.setColumnWidth(5, 150); // Parent SKU
  sheet.setColumnWidth(6, 120); // Product Type
  sheet.setColumnWidth(7, 120); // Brand
  sheet.setColumnWidth(8, 100); // Marketplace
  sheet.setColumnWidth(9, 250); // mainImageURL
  sheet.setColumnWidth(10, 100); // Status
  sheet.setColumnWidth(11, 150); // Export DateTime
  sheet.setColumnWidth(12, 250); // ProductLink
  sheet.setColumnWidth(13, 150); // Last Modified
  sheet.setColumnWidth(14, 200); // Modified By
  sheet.setColumnWidth(15, 300); // Error Messages
  sheet.setColumnWidth(16, 200); // Notes

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3); // Freeze checkbox, ASIN, SKU

  Logger.log('✅ ProductsMain sheet created');
}

/**
 * Organize sheet order (move Config to first position)
 */
function organizeSheetOrder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  // Desired order
  const desiredOrder = [
    'Config',
    'ProductsMain',
    'Templates',
    'GPSR Compliance',
    'Documents',
    'Customization',
    'Brand Strip',
    'Videos',
    'BrandStore-Config',
    'BrandStore-Homepage',
    'BrandStore-Page2',
    'BrandStore-Page3',
    'ErrorLog'
  ];

  // Move sheets to desired order
  desiredOrder.forEach((sheetName, index) => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    }
  });

  Logger.log('✅ Sheets organized');
}

/**
 * Quick function to just regenerate Config if it's missing
 */
function lukoRegenerateConfigOnly() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Regenerate Config Sheet',
    'This will recreate the Config sheet.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    generateConfigSheet();
    ui.alert('✅ Success', 'Config sheet has been regenerated!', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Error', 'Failed to regenerate Config:\n\n' + error.toString(), ui.ButtonSet.OK);
  }
}
