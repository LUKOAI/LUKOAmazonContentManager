/**
 * LUKO-ACM Sheet Generator Extension
 * Generates 6 new sheets: GPSR, Documents, Customization, BrandStrip, Videos, Brand Store
 *
 * IMPORTANT: This extends SpreadsheetGenerator.gs - DO NOT modify existing generators
 * These functions are called from SpreadsheetGenerator.gs
 */

// ========================================
// GPSR COMPLIANCE SHEET
// ========================================

function generateGpsrSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('GPSR');

  // Header
  const headerRange = sheet.getRange('A1:AA1');
  headerRange.setValue('🇪🇺 GPSR Compliance - EU Mandatory (Effective Dec 13, 2024)');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(14);
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');

  // Instructions
  const instrRange = sheet.getRange('A2:AA2');
  instrRange.setValue('General Product Safety Regulation - Required for ALL products sold in EU. Fill in manufacturer, importer, and responsible person details.');
  instrRange.setFontStyle('italic');
  instrRange.setBackground('#d3e3fd');
  instrRange.setWrapText(true);

  // Column headers
  const headers = [
    '☑️ Export', 'ASIN', 'SKU', 'GPSR Compliant',
    'Manufacturer Name', 'Manufacturer Address', 'Manufacturer Email', 'Manufacturer Phone',
    'Importer Name', 'Importer Address', 'Importer Email', 'Importer Phone',
    'Responsible Person Name', 'Responsible Person Address', 'Responsible Person Email', 'Responsible Person Phone',
    'Product Safety Label Image URL', 'Safety Instructions PDF URL', 'CE/Conformity Certificate PDF URL',
    'Test Reports PDF URL', 'Risk Assessment PDF URL', 'Declaration of Conformity PDF URL',
    'Export Status', 'Export DateTime', 'Last Modified', 'Modified By', 'Error Messages'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#1a73e8');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);

  // Freeze header rows
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Data validation - GPSR Compliant dropdown
  const complianceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No', 'Pending'], true)
    .build();
  sheet.getRange(4, 4, 1000, 1).setDataValidation(complianceRule);

  // Data validation - Export Status dropdown
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'DONE', 'FAILED'], true)
    .build();
  sheet.getRange(4, 23, 1000, 1).setDataValidation(statusRule);

  // Email validation (columns 7, 11, 15)
  const emailRule = SpreadsheetApp.newDataValidation()
    .requireTextIsEmail()
    .setAllowInvalid(false)
    .build();
  sheet.getRange(4, 7, 1000, 1).setDataValidation(emailRule);
  sheet.getRange(4, 11, 1000, 1).setDataValidation(emailRule);
  sheet.getRange(4, 15, 1000, 1).setDataValidation(emailRule);

  // Conditional formatting - GPSR Compliant
  const complianceRangeYes = sheet.getRange(4, 4, 1000, 1);
  const ruleYes = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Yes')
    .setBackground('#d4f4dd')
    .setRanges([complianceRangeYes])
    .build();

  const ruleNo = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('No')
    .setBackground('#fff4c3')
    .setRanges([complianceRangeYes])
    .build();

  const statusRange = sheet.getRange(4, 23, 1000, 1);
  const ruleFailed = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('FAILED')
    .setBackground('#f4c7c3')
    .setRanges([statusRange])
    .build();

  sheet.setConditionalFormatRules([ruleYes, ruleNo, ruleFailed]);

  // Column widths
  sheet.setColumnWidth(1, 80);   // Checkbox
  sheet.setColumnWidth(2, 120);  // ASIN
  sheet.setColumnWidth(3, 120);  // SKU
  sheet.setColumnWidth(4, 130);  // GPSR Compliant
  for (let i = 5; i <= 16; i++) {
    sheet.setColumnWidth(i, 180); // Contact fields
  }
  for (let i = 17; i <= 22; i++) {
    sheet.setColumnWidth(i, 250); // PDF URLs
  }
  sheet.setColumnWidth(23, 120); // Export Status
  sheet.setColumnWidth(24, 150); // Export DateTime
  sheet.setColumnWidth(25, 120); // Last Modified
  sheet.setColumnWidth(26, 150); // Modified By
  sheet.setColumnWidth(27, 300); // Error Messages

  // Example row
  const exampleRow = [
    false, 'B0EXAMPLE1', 'GPSR-TEST-001', 'Yes',
    'Example Manufacturing GmbH', 'Industriestraße 1, 10115 Berlin, Germany', 'contact@example.de', '+49 30 12345678',
    'Example Import Ltd', 'Import Street 10, 20095 Hamburg, Germany', 'import@example.de', '+49 40 87654321',
    'EU Authorized Rep.', 'Compliance Ave 5, 60311 Frankfurt, Germany', 'compliance@example.de', '+49 69 11223344',
    'https://example.com/safety-label.jpg', 'https://example.com/safety-instructions.pdf', 'https://example.com/ce-cert.pdf',
    'https://example.com/test-report.pdf', 'https://example.com/risk-assessment.pdf', 'https://example.com/declaration.pdf',
    'PENDING', '', new Date(), Session.getActiveUser().getEmail(), ''
  ];

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow])
  range2.setBackground('#f8f9fa');
  range2.setFontStyle('italic');

  Logger.log('GPSR sheet generated');
}

// ========================================
// DOCUMENTS SHEET
// ========================================

function generateDocumentsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('Documents');

  // Header
  const range = sheet.getRange('A1:Q1');
  range.setValue('📄 Product Documents Management');
  range.setFontWeight('bold');
  range.setFontSize(14);
  range.setBackground('#0f9d58');
  range.setFontColor('#FFFFFF');
  range.setHorizontalAlignment('center');

  // Instructions
  const range2 = sheet.getRange('A2:Q2');
  range2.setValue('Upload and manage product documents (user manuals, warranties, certificates, etc.). Documents will be visible to customers on product pages.');
  range2.setFontStyle('italic');
  range2.setBackground('#d4edda');
  range2.setWrapText(true);

  // Column headers
  const headers = [
    '☑️ Export', 'ASIN', 'SKU', 'Document Type', 'Language',
    'Document Title', 'File Name', 'PDF URL', 'Description',
    'Visible to Customer', 'Upload Date', 'File Size (MB)',
    'Export Status', 'Export DateTime', 'Last Modified', 'Modified By', 'Error Messages'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#0f9d58');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Data validation - Document Type
  const docTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'User Manual / Instructions',
      'Quick Start Guide',
      'Warranty Information',
      'Technical Specifications',
      'Compliance Certificates',
      'Safety Data Sheet (SDS)',
      'Care Instructions',
      'Assembly Instructions',
      'Troubleshooting Guide',
      'Installation Guide'
    ], true)
    .build();
  sheet.getRange(4, 4, 1000, 1).setDataValidation(docTypeRule);

  // Data validation - Language
  const langRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'], true)
    .build();
  sheet.getRange(4, 5, 1000, 1).setDataValidation(langRule);

  // Data validation - Export Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'DONE', 'FAILED'], true)
    .build();
  sheet.getRange(4, 13, 1000, 1).setDataValidation(statusRule);

  // Column widths
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 250);
  sheet.setColumnWidth(7, 200);
  sheet.setColumnWidth(8, 300);
  sheet.setColumnWidth(9, 300);
  sheet.setColumnWidth(10, 140);
  sheet.setColumnWidth(11, 120);
  sheet.setColumnWidth(12, 100);
  sheet.setColumnWidth(13, 120);
  sheet.setColumnWidth(14, 150);
  sheet.setColumnWidth(15, 120);
  sheet.setColumnWidth(16, 150);
  sheet.setColumnWidth(17, 300);

  // Example rows
  const examples = [
    [false, 'B0EXAMPLE1', 'DOC-TEST-001', 'User Manual / Instructions', 'DE', 'Bedienungsanleitung', 'manual-de.pdf', 'https://example.com/docs/manual-de.pdf', 'Complete user manual in German', true, new Date(), 2.5, 'PENDING', '', new Date(), Session.getActiveUser().getEmail(), ''],
    [false, 'B0EXAMPLE1', 'DOC-TEST-001', 'User Manual / Instructions', 'EN', 'User Manual', 'manual-en.pdf', 'https://example.com/docs/manual-en.pdf', 'Complete user manual in English', true, new Date(), 2.3, 'PENDING', '', new Date(), Session.getActiveUser().getEmail(), ''],
    [false, 'B0EXAMPLE1', 'DOC-TEST-001', 'Warranty Information', 'DE', 'Garantieinformationen', 'warranty.pdf', 'https://example.com/docs/warranty.pdf', '2 years manufacturer warranty', true, new Date(), 0.5, 'PENDING', '', new Date(), Session.getActiveUser().getEmail(), '']
  ];

  sheet.getRange(4, 1, examples.length, examples[0].length).setValues(examples)
  range2.setBackground('#f8f9fa');
  range2.setFontStyle('italic');

  Logger.log('Documents sheet generated');
}

// ========================================
// CUSTOMIZATION SHEET
// ========================================

function generateCustomizationSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('Customization');

  // Header
  const range = sheet.getRange('A1:BF1');
  range.setValue('✨ Product Customization & Personalization');
  range.setFontWeight('bold');
  range.setFontSize(14);
  range.setBackground('#9c27b0');
  range.setFontColor('#FFFFFF');
  range.setHorizontalAlignment('center');

  // Instructions
  const range2 = sheet.getRange('A2:BF2');
  range2.setValue('Enable product customization: text engraving, color selection, material choice, image upload. Customers can personalize products before purchase.');
  range2.setFontStyle('italic');
  range2.setBackground('#f3e5f5');
  range2.setWrapText(true);

  // Column headers (grouped for clarity)
  const headers = [
    // Core fields (A-H)
    '☑️ Export', 'ASIN', 'SKU', 'Customization Enabled', 'Customization Type', 'Processing Time (days)', 'Price Add-On (€)', 'Instructions Template',
    // Text customization fields (I-Y)
    'Text Field 1 Label', 'Text Field 1 Max Characters', 'Text Field 1 Required', 'Text Field 1 Default Value',
    'Text Field 2 Label', 'Text Field 2 Max Characters', 'Text Field 2 Required', 'Text Field 2 Default Value',
    'Text Field 3 Label', 'Text Field 3 Max Characters', 'Text Field 3 Required', 'Text Field 3 Default Value',
    'Font Options (comma-separated)', 'Default Font', 'Text Color Options (comma-separated)', 'Default Color', 'Preview Image URL',
    // Surface customization fields (Z-AT)
    'Surface Type', 'Option 1 Name', 'Option 1 Price Modifier', 'Option 1 SKU Suffix', 'Option 1 Preview Image',
    'Option 2 Name', 'Option 2 Price Modifier', 'Option 2 SKU Suffix', 'Option 2 Preview Image',
    'Option 3 Name', 'Option 3 Price Modifier', 'Option 3 SKU Suffix', 'Option 3 Preview Image',
    'Option 4 Name', 'Option 4 Price Modifier', 'Option 4 SKU Suffix', 'Option 4 Preview Image',
    'Option 5 Name', 'Option 5 Price Modifier', 'Option 5 SKU Suffix', 'Option 5 Preview Image',
    // Image upload customization (AU-BA)
    'Image Upload Enabled', 'Min Resolution (WxH)', 'Max File Size (MB)', 'Accepted Formats', 'Preview Template URL', 'Placement Area (coordinates)', 'Content Policy URL',
    // Status fields (BB-BF)
    'Export Status', 'Export DateTime', 'Last Modified', 'Modified By', 'Error Messages'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#9c27b0');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);
  range3.setFontSize(9);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Data validation - Customization Type
  const custTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Text', 'Surface', 'Size', 'Image'], true)
    .build();
  sheet.getRange(4, 5, 1000, 1).setDataValidation(custTypeRule);

  // Data validation - Surface Type
  const surfaceTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Color', 'Material', 'Finish'], true)
    .build();
  sheet.getRange(4, 26, 1000, 1).setDataValidation(surfaceTypeRule);

  // Data validation - Export Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'DONE', 'FAILED'], true)
    .build();
  sheet.getRange(4, 54, 1000, 1).setDataValidation(statusRule);

  // Column widths (basic)
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 150);
  }
  sheet.setColumnWidth(1, 80);  // Checkbox
  sheet.setColumnWidth(2, 120); // ASIN
  sheet.setColumnWidth(3, 120); // SKU

  // Example row - Name Engraving template
  const exampleRow = [
    false, 'B0EXAMPLE1', 'CUST-TEST-001', true, 'Text', 3, 5.00, 'We will engrave your text using professional laser engraving.',
    'Name to Engrave', 20, true, '',
    '', 0, false, '',
    '', 0, false, '',
    'Arial,Times New Roman,Script,Block', 'Arial', 'Black,Silver,Gold', 'Black', 'https://example.com/preview-engraving.jpg',
    '', '', '', '', '',
    '', '', '', '',
    '', '', '', '',
    '', '', '', '',
    '', '', '', '',
    false, '', '', '', '', '', '',
    'PENDING', '', new Date(), Session.getActiveUser().getEmail(), ''
  ];

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow])
  range2.setBackground('#f8f9fa');
  range2.setFontStyle('italic');

  // Templates section
  const templatesRow = 7;
  sheet.getRange(templatesRow, 1, 1, 58).merge()
    range2.setValue('📋 Pre-built Customization Templates');
  range2.setFontWeight('bold');
  range2.setBackground('#ce93d8');
  range2.setFontColor('#FFFFFF');
  range2.setHorizontalAlignment('center');

  const templateExamples = [
    ['Template Name', 'Type', 'Description', 'Use For'],
    ['Name Engraving', 'Text', 'Single text field (20 chars)', 'Jewelry, gifts, trophies'],
    ['Personalized Message', 'Text', 'Text field (100 chars)', 'Greeting cards, mugs, t-shirts'],
    ['Color Choice', 'Surface', '5 color options', 'Furniture, accessories, clothing'],
    ['Material Selection', 'Surface', '3 material options', 'Furniture, bags, shoes'],
    ['Photo Upload', 'Image', 'Upload customer photo', 'Photo gifts, custom prints']
  ];

  sheet.getRange(templatesRow + 1, 1, templateExamples.length, 4).setValues(templateExamples)
  range2.setBackground('#f3e5f5');
  sheet.getRange(templatesRow + 1, 1, 1, 4).setFontWeight('bold');

  Logger.log('Customization sheet generated');
}

// ========================================
// BRAND STRIP SHEET
// ========================================

function generateBrandStripSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('BrandStrip');

  // Header
  const range = sheet.getRange('A1:AB1');
  range.setValue('🎨 Brand Strip - Classic & Enhanced');
  range.setFontWeight('bold');
  range.setFontSize(14);
  range.setBackground('#ff6f00');
  range.setFontColor('#FFFFFF');
  range.setHorizontalAlignment('center');

  // Instructions
  const range2 = sheet.getRange('A2:AB2');
  range2.setValue('Create brand strip banners for product pages. Classic = simple logo/headline. Enhanced = hero image with products showcase.');
  range2.setFontStyle('italic');
  range2.setBackground('#fff3e0');
  range2.setWrapText(true);

  // Column headers
  const headers = [
    '☑️ Export', 'ASIN', 'SKU', 'Strip Type',
    // Classic Brand Strip
    'Logo URL', 'Background Color (hex)', 'Brand Name', 'Headline Text',
    // Enhanced Brand Strip
    'Hero Image URL', 'Logo Overlay URL', 'Logo Position', 'Brand Name (Enhanced)', 'Tagline', 'Headline', 'Subheadline',
    'CTA Button Text', 'CTA Button Link',
    'Product ASIN 1', 'Product ASIN 2', 'Product ASIN 3', 'Product ASIN 4',
    'Video Background URL', 'Video Autoplay',
    // Status
    'Export Status', 'Export DateTime', 'Last Modified', 'Modified By', 'Error Messages'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#ff6f00');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Data validation - Strip Type
  const stripTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Classic', 'Enhanced'], true)
    .build();
  sheet.getRange(4, 4, 1000, 1).setDataValidation(stripTypeRule);

  // Data validation - Logo Position
  const logoPosnRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Top-Left', 'Top-Center', 'Top-Right'], true)
    .build();
  sheet.getRange(4, 11, 1000, 1).setDataValidation(logoPosnRule);

  // Data validation - Export Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'DONE', 'FAILED'], true)
    .build();
  sheet.getRange(4, 24, 1000, 1).setDataValidation(statusRule);

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 180);
  }
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);

  // Example rows
  const examples = [
    [false, 'B0EXAMPLE1', 'BRAND-TEST-001', 'Classic', 'https://example.com/logo.png', '#FFFFFF', 'ExampleBrand', 'Premium Quality Products', '', '', '', '', '', '', '', '', '', '', '', '', '', '', false, 'PENDING', '', new Date(), Session.getActiveUser().getEmail(), ''],
    [false, 'B0EXAMPLE2', 'BRAND-TEST-002', 'Enhanced', '', '', '', '', 'https://example.com/hero.jpg', 'https://example.com/logo-overlay.png', 'Top-Center', 'ExampleBrand', 'Excellence in Every Detail', 'Discover Our Collection', 'Handcrafted with passion', 'Shop Now', 'https://amazon.de/brand-store', 'B0PROD001', 'B0PROD002', 'B0PROD003', 'B0PROD004', 'https://example.com/video-bg.mp4', true, 'PENDING', '', new Date(), Session.getActiveUser().getEmail(), '']
  ];

  sheet.getRange(4, 1, examples.length, examples[0].length).setValues(examples)
  range2.setBackground('#f8f9fa');
  range2.setFontStyle('italic');

  Logger.log('BrandStrip sheet generated');
}

// ========================================
// VIDEOS SHEET
// ========================================

function generateVideosSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('Videos');

  // Header
  const range = sheet.getRange('A1:AC1');
  range.setValue('🎬 Product Videos Management');
  range.setFontWeight('bold');
  range.setFontSize(14);
  range.setBackground('#e91e63');
  range.setFontColor('#FFFFFF');
  range.setHorizontalAlignment('center');

  // Instructions
  const range2 = sheet.getRange('A2:AC2');
  range2.setValue('Upload product videos (up to 3 per product);. Video increases conversion by 80%! Supported: MP4, MOV, AVI. Max 500MB.')
  range2.setFontStyle('italic');
  range2.setBackground('#fce4ec');
  range2.setWrapText(true);

  // Column headers
  const headers = [
    '☑️ Export', 'ASIN', 'SKU',
    // Video 1
    'Video URL 1', 'Video Thumbnail 1', 'Video Duration 1 (sec)', 'Video Title 1', 'Video Description 1', 'Video Type 1', 'Video Language 1',
    // Video 2
    'Video URL 2', 'Video Thumbnail 2', 'Video Duration 2 (sec)', 'Video Title 2', 'Video Description 2', 'Video Type 2', 'Video Language 2',
    // Video 3
    'Video URL 3', 'Video Thumbnail 3', 'Video Duration 3 (sec)', 'Video Title 3', 'Video Description 3', 'Video Type 3', 'Video Language 3',
    // Status
    'Export Status', 'Export DateTime', 'Last Modified', 'Modified By', 'Error Messages'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#e91e63');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Data validation - Video Type
  const videoTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Main', 'Lifestyle', 'How-to', 'Unboxing', 'Tutorial'], true)
    .build();
  sheet.getRange(4, 9, 1000, 1).setDataValidation(videoTypeRule);
  sheet.getRange(4, 16, 1000, 1).setDataValidation(videoTypeRule);
  sheet.getRange(4, 23, 1000, 1).setDataValidation(videoTypeRule);

  // Data validation - Language
  const langRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'], true)
    .build();
  sheet.getRange(4, 10, 1000, 1).setDataValidation(langRule);
  sheet.getRange(4, 17, 1000, 1).setDataValidation(langRule);
  sheet.getRange(4, 24, 1000, 1).setDataValidation(langRule);

  // Data validation - Export Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'DONE', 'FAILED'], true)
    .build();
  sheet.getRange(4, 25, 1000, 1).setDataValidation(statusRule);

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 180);
  }
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(6, 100);  // Duration
  sheet.setColumnWidth(13, 100); // Duration 2
  sheet.setColumnWidth(20, 100); // Duration 3

  // Example row
  const exampleRow = [
    false, 'B0EXAMPLE1', 'VIDEO-TEST-001',
    'https://example.com/video1.mp4', 'https://example.com/thumb1.jpg', 45, 'Product Demonstration', 'See our product in action', 'Main', 'EN',
    'https://example.com/video2.mp4', 'https://example.com/thumb2.jpg', 30, 'Unboxing Experience', 'First impressions unboxing', 'Unboxing', 'EN',
    '', '', 0, '', '', '', '',
    'PENDING', '', new Date(), Session.getActiveUser().getEmail(), ''
  ];

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow])
  range2.setBackground('#f8f9fa');
  range2.setFontStyle('italic');

  Logger.log('Videos sheet generated');
}

// ========================================
// BRAND STORE SHEETS (4 sheets)
// ========================================

function generateBrandStoreSheets() {
  // Generate 4 sheets: Config, Homepage, Page2, Page3
  generateBrandStoreConfigSheet();
  generateBrandStorePageSheet('BrandStore-Homepage');
  generateBrandStorePageSheet('BrandStore-Page2');
  generateBrandStorePageSheet('BrandStore-Page3');

  Logger.log('All Brand Store sheets generated');
}

function generateBrandStoreConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('BrandStore-Config');

  // Header
  const range = sheet.getRange('A1:O1');
  range.setValue('🏪 Brand Store Configuration');
  range.setFontWeight('bold');
  range.setFontSize(14);
  range.setBackground('#673ab7');
  range.setFontColor('#FFFFFF');
  range.setHorizontalAlignment('center');

  // Instructions
  const range2 = sheet.getRange('A2:O2');
  range2.setValue('Configure your multi-page Amazon Brand Store. Build a complete shopping experience with homepage, category pages, and more.');
  range2.setFontStyle('italic');
  range2.setBackground('#ede7f6');
  range2.setWrapText(true);

  // Column headers
  const headers = [
    'Store Name', 'Store ID (from Amazon)', 'Brand Name', 'Store URL',
    'Number of Pages', 'Homepage Layout', 'Primary Color (hex)', 'Secondary Color (hex)',
    'Logo URL', 'Favicon URL', 'Meta Title', 'Meta Description',
    'Status', 'Last Published', 'Last Modified'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#673ab7');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);

  // Data validation - Homepage Layout
  const layoutRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Marquee', 'Product Grid', 'Showcase'], true)
    .build();
  sheet.getRange(4, 6, 100, 1).setDataValidation(layoutRule);

  // Data validation - Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Draft', 'Published'], true)
    .build();
  sheet.getRange(4, 13, 100, 1).setDataValidation(statusRule);

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 180);
  }

  // Example row
  const exampleRow = [
    'Example Brand Official Store', 'AXXXXXXXXXXXXX', 'ExampleBrand', 'https://amazon.de/stores/ExampleBrand',
    3, 'Marquee', '#1a73e8', '#ff6f00',
    'https://example.com/logo.png', 'https://example.com/favicon.ico',
    'ExampleBrand Official Store - Premium Quality', 'Discover our complete collection of premium products',
    'Draft', '', new Date()
  ];

  sheet.getRange(4, 1, 1, exampleRow.length).setValues([exampleRow])
  range2.setBackground('#f8f9fa');
  range2.setFontStyle('italic');

  Logger.log('BrandStore-Config sheet generated');
}

function generateBrandStorePageSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(sheetName);

  const pageName = sheetName.replace('BrandStore-', '');

  // Header
  const range = sheet.getRange('A1:AL1');
  range.setValue(`🏪 Brand Store - ${pageName} Builder`);
  range.setFontWeight('bold');
  range.setFontSize(14);
  range.setBackground('#673ab7');
  range.setFontColor('#FFFFFF');
  range.setHorizontalAlignment('center');

  // Instructions
  const range2 = sheet.getRange('A2:AL2');
  range2.setValue('Each row = one module. Modules stack vertically. Use Module Order to arrange. Choose Module Type, then fill relevant fields.');
  range2.setFontStyle('italic');
  range2.setBackground('#ede7f6');
  range2.setWrapText(true);

  // Column headers
  const headers = [
    '☑️ Include', 'Module Order', 'Module Type', 'Module Title', 'Module Headline', 'Module Subheadline', 'Body Text',
    'Background Color', 'Background Image URL',
    'Image URL 1', 'Image URL 2', 'Image URL 3', 'Image URL 4', 'Image URL 5', 'Image URL 6',
    'Product ASIN 1', 'Product ASIN 2', 'Product ASIN 3', 'Product ASIN 4', 'Product ASIN 5', 'Product ASIN 6', 'Product ASIN 7', 'Product ASIN 8',
    'CTA Button Text', 'CTA Button Link',
    'Video URL', 'Video Thumbnail', 'Video Autoplay',
    'Layout Style', 'Columns', 'Module Height',
    'Hotspot 1 Coords', 'Hotspot 1 ASIN', 'Hotspot 2 Coords', 'Hotspot 2 ASIN', 'Hotspot 3 Coords', 'Hotspot 3 ASIN',
    'Notes'
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  const range3 = sheet.getRange(3, 1, 1, headers.length);
  range3.setFontWeight('bold');
  range3.setBackground('#673ab7');
  range3.setFontColor('#FFFFFF');
  range3.setWrapText(true);
  range3.setFontSize(9);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);

  // Data validation - Module Type
  const moduleTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Hero Image', 'Featured Products Grid', 'Image & Text', 'Product Gallery',
      'Video', 'Image Tiles', 'Shoppable Images', 'Background Video',
      'Slider/Carousel', 'Product Showcase', 'Text Block', 'Category Links',
      'Brand Story', 'Social Proof', 'Newsletter Signup'
    ], true)
    .build();
  sheet.getRange(4, 3, 1000, 1).setDataValidation(moduleTypeRule);

  // Data validation - Layout Style
  const layoutStyleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Grid', 'Carousel', 'List'], true)
    .build();
  sheet.getRange(4, 29, 1000, 1).setDataValidation(layoutStyleRule);

  // Data validation - Columns
  const columnsRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['2', '3', '4'], true)
    .build();
  sheet.getRange(4, 30, 1000, 1).setDataValidation(columnsRule);

  // Data validation - Module Height
  const heightRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Small', 'Medium', 'Large', 'Full'], true)
    .build();
  sheet.getRange(4, 31, 1000, 1).setDataValidation(heightRule);

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 150);
  }
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 90);
  sheet.setColumnWidth(3, 180);

  // Example modules (only for Homepage)
  if (sheetName === 'BrandStore-Homepage') {
    const examples = [
      [true, 1, 'Hero Image', 'Welcome', 'Discover Premium Quality', 'Handcrafted Excellence', '', '#FFFFFF', 'https://example.com/hero.jpg', 'https://example.com/logo.png', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Shop Now', 'https://amazon.de/brand-store', '', '', false, '', '', 'Full', '', '', '', '', '', '', ''],
      [true, 2, 'Featured Products Grid', 'Bestsellers', 'Our Most Popular Products', '', 'Discover what our customers love most', '', '', '', '', '', '', '', '', 'B0PROD001', 'B0PROD002', 'B0PROD003', 'B0PROD004', '', '', '', '', '', '', '', '', false, 'Grid', '4', 'Medium', '', '', '', '', '', '', ''],
      [true, 3, 'Image & Text', 'Our Story', 'Craftsmanship Meets Innovation', 'Since 1990', 'We have been creating exceptional products with passion and dedication. Every piece tells a story.', '', 'https://example.com/story-bg.jpg', 'https://example.com/craftsmanship.jpg', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Learn More', 'https://example.com/about', '', '', false, '', '', 'Medium', '', '', '', '', '', '', '']
    ];

    sheet.getRange(4, 1, examples.length, examples[0].length).setValues(examples)
      range2.setBackground('#f8f9fa');
      range2.setFontStyle('italic');
  }

  Logger.log(`${sheetName} generated`);
}
