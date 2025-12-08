/**
 * LUKO-ACM Template Highlighter
 * Conditional cell highlighting based on selected template
 *
 * When user selects a template ID in the Template column,
 * this highlights ONLY the required fields for that template
 * making it easy to fill in just what's needed
 *
 * Features:
 * - Auto-highlight on template selection
 * - Different colors for different field groups
 * - Clear highlights when template removed
 * - Works per-row (each product can have different template)
 */

// Template definitions (embedded from product-templates.json for performance)
const TEMPLATE_DEFINITIONS = {
  'T01': { // Basic Essentials
    name: 'Basic Essentials',
    color: '#E8F5E9',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'brand_DE', 'brand_EN',
      'productTitle_DE', 'productTitle_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN',
      'productDescription_DE', 'productDescription_EN',
      'mainImageURL'
    ]
  },

  'T02': { // Multi-Language Premium
    name: 'Multi-Language Premium',
    color: '#E3F2FD',
    required: [
      'SKU', 'ASIN', 'Product Type',
      // All 8 languages for title, brand, bullets 1-5, description, keywords
      'productTitle_DE', 'productTitle_EN', 'productTitle_FR', 'productTitle_IT', 'productTitle_ES', 'productTitle_NL', 'productTitle_PL', 'productTitle_SE',
      'brand_DE', 'brand_EN', 'brand_FR', 'brand_IT', 'brand_ES', 'brand_NL', 'brand_PL', 'brand_SE',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE', 'bulletPoint4_DE', 'bulletPoint5_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN', 'bulletPoint4_EN', 'bulletPoint5_EN',
      'bulletPoint1_FR', 'bulletPoint2_FR', 'bulletPoint3_FR', 'bulletPoint4_FR', 'bulletPoint5_FR',
      'bulletPoint1_IT', 'bulletPoint2_IT', 'bulletPoint3_IT', 'bulletPoint4_IT', 'bulletPoint5_IT',
      'bulletPoint1_ES', 'bulletPoint2_ES', 'bulletPoint3_ES', 'bulletPoint4_ES', 'bulletPoint5_ES',
      'bulletPoint1_NL', 'bulletPoint2_NL', 'bulletPoint3_NL', 'bulletPoint4_NL', 'bulletPoint5_NL',
      'bulletPoint1_PL', 'bulletPoint2_PL', 'bulletPoint3_PL', 'bulletPoint4_PL', 'bulletPoint5_PL',
      'bulletPoint1_SE', 'bulletPoint2_SE', 'bulletPoint3_SE', 'bulletPoint4_SE', 'bulletPoint5_SE',
      'productDescription_DE', 'productDescription_EN', 'productDescription_FR', 'productDescription_IT', 'productDescription_ES', 'productDescription_NL', 'productDescription_PL', 'productDescription_SE',
      'genericKeywords_DE', 'genericKeywords_EN', 'genericKeywords_FR', 'genericKeywords_IT', 'genericKeywords_ES', 'genericKeywords_NL', 'genericKeywords_PL', 'genericKeywords_SE',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL'
    ]
  },

  'T03': { // Visual Storyteller
    name: 'Visual Storyteller',
    color: '#FFF3E0',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'brand_DE', 'brand_EN',
      'productTitle_DE', 'productTitle_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN',
      'productDescription_DE', 'productDescription_EN',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL', 'additionalImage4_URL', 'additionalImage5_URL'
    ]
  },

  'T04': { // A+ Content Basic
    name: 'A+ Content Basic',
    color: '#F3E5F5',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE', 'bulletPoint4_DE', 'bulletPoint5_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN', 'bulletPoint4_EN', 'bulletPoint5_EN',
      'productDescription_DE', 'productDescription_EN',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL'
      // Note: A+ fields would be in separate APlusBasic sheet
    ]
  },

  'T05': { // Fashion Complete
    name: 'Fashion Complete',
    color: '#FCE4EC',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE', 'bulletPoint4_DE', 'bulletPoint5_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN', 'bulletPoint4_EN', 'bulletPoint5_EN',
      'productDescription_DE', 'productDescription_EN',
      'color_DE', 'color_EN',
      'size', 'material_DE', 'material_EN',
      'careInstructions_DE', 'careInstructions_EN',
      'closure_DE', 'closure_EN',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL', 'additionalImage4_URL'
    ]
  },

  'T06': { // Home & Furniture Pro
    name: 'Home & Furniture Pro',
    color: '#E0F2F1',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE', 'bulletPoint4_DE', 'bulletPoint5_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN', 'bulletPoint4_EN', 'bulletPoint5_EN',
      'productDescription_DE', 'productDescription_EN',
      'itemLength_cm', 'itemWidth_cm', 'itemHeight_cm', 'itemWeight_kg',
      'material_DE', 'material_EN',
      'color_DE', 'color_EN',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL', 'additionalImage4_URL'
    ]
  },

  'T07': { // Electronics Tech Specs
    name: 'Electronics Tech Specs',
    color: '#E1F5FE',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE', 'bulletPoint4_DE', 'bulletPoint5_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN', 'bulletPoint4_EN', 'bulletPoint5_EN',
      'productDescription_DE', 'productDescription_EN',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL'
    ]
  },

  'T08': { // GPSR Compliant EU
    name: 'GPSR Compliant EU',
    color: '#FFF9C4',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN',
      'productDescription_DE', 'productDescription_EN',
      'manufacturer_name', 'manufacturer_address', 'manufacturer_email',
      'responsiblePerson_name', 'responsiblePerson_address', 'responsiblePerson_email',
      'safetyInformation_URL', 'complianceDocument_URL',
      'mainImageURL', 'additionalImage1_URL', 'warningLabel_URL',
      'userManual_URL'
    ]
  },

  'T09': { // Premium A+ with Video
    name: 'Premium A+ with Video',
    color: '#E8EAF6',
    required: [
      'SKU', 'ASIN', 'Product Type',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE', 'bulletPoint4_DE', 'bulletPoint5_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN', 'bulletPoint4_EN', 'bulletPoint5_EN',
      'productDescription_DE', 'productDescription_EN',
      'mainImageURL', 'additionalImage1_URL', 'additionalImage2_URL', 'additionalImage3_URL', 'additionalImage4_URL', 'additionalImage5_URL'
      // Note: A+ Premium fields would be in separate APlusPremium sheet
    ]
  },

  'T10': { // Quick Launch Variations
    name: 'Quick Launch Variations',
    color: '#F8BBD0',
    required: [
      'SKU', 'ASIN', 'Product Type', 'Parent SKU', 'Parent ASIN', 'variationTheme',
      'productTitle_DE', 'productTitle_EN',
      'brand_DE', 'brand_EN',
      'bulletPoint1_DE', 'bulletPoint2_DE', 'bulletPoint3_DE',
      'bulletPoint1_EN', 'bulletPoint2_EN', 'bulletPoint3_EN',
      'productDescription_DE', 'productDescription_EN',
      'color_DE', 'color_EN', 'size',
      'mainImageURL', 'additionalImage1_URL'
    ]
  }
};

// ========================================
// MAIN HIGHLIGHTING FUNCTIONS
// ========================================

/**
 * Apply template highlighting to selected rows
 * Call from menu: Templates → Apply Template Highlighting
 */
function lukoApplyTemplateHighlighting() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductsMain');
    if (!sheet) {
      showError('ProductsMain sheet not found');
      return;
    }

    const selectedRows = getSelectedCheckboxRows(sheet);
    if (selectedRows.length === 0) {
      showError('No products selected. Check ☑️ Export boxes first.');
      return;
    }

    const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
    let appliedCount = 0;

    for (const row of selectedRows) {
      const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
      const templateId = getColumnValue(values, headers, 'Template');

      if (templateId && TEMPLATE_DEFINITIONS[templateId]) {
        applyTemplateToRow(sheet, row, headers, templateId);
        appliedCount++;
      }
    }

    const ui = SpreadsheetApp.getUi();
    ui.alert('Template Highlighting Applied',
      `✨ Highlighted ${appliedCount} product(s)\n\nRequired fields for selected templates are now highlighted.`,
      ui.ButtonSet.OK);

  } catch (error) {
    handleError('lukoApplyTemplateHighlighting', error);
  }
}

/**
 * Apply template highlighting to a single row
 */
function applyTemplateToRow(sheet, rowNumber, headers, templateId) {
  const template = TEMPLATE_DEFINITIONS[templateId];
  if (!template) {
    Logger.log(`Template ${templateId} not found`);
    return;
  }

  // First, clear all highlighting in the row (except control columns)
  const totalCols = headers.length;
  sheet.getRange(rowNumber, 1, 1, totalCols).setBackground(null);

  // Then, highlight required fields
  for (const fieldName of template.required) {
    const colIndex = headers.indexOf(fieldName);
    if (colIndex >= 0) {
      sheet.getRange(rowNumber, colIndex + 1).setBackground(template.color);
    }
  }

  // Add note to Template cell
  const templateColIndex = headers.indexOf('Template');
  if (templateColIndex >= 0) {
    const note = `Template: ${template.name}\nRequired fields: ${template.required.length}\nHighlighted cells show what to fill.`;
    sheet.getRange(rowNumber, templateColIndex + 1).setNote(note);
  }

  Logger.log(`Applied template ${templateId} to row ${rowNumber}`);
}

/**
 * Clear template highlighting from selected rows
 */
function lukoClearTemplateHighlighting() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductsMain');
    if (!sheet) {
      showError('ProductsMain sheet not found');
      return;
    }

    const selectedRows = getSelectedCheckboxRows(sheet);
    if (selectedRows.length === 0) {
      showError('No products selected');
      return;
    }

    for (const row of selectedRows) {
      const totalCols = sheet.getLastColumn();
      sheet.getRange(row, 1, 1, totalCols).setBackground(null);
    }

    const ui = SpreadsheetApp.getUi();
    ui.alert('Highlighting Cleared',
      `Cleared highlighting from ${selectedRows.length} product(s)`,
      ui.ButtonSet.OK);

  } catch (error) {
    handleError('lukoClearTemplateHighlighting', error);
  }
}

/**
 * Auto-apply highlighting when template is changed
 * This can be triggered by an onChange trigger (installable trigger)
 */
function autoApplyTemplateOnChange(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'ProductsMain') return;

  // Check if edit was in Template column
  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
  const templateColIndex = headers.indexOf('Template');
  if (templateColIndex < 0) return;

  const editedCol = e.range.getColumn();
  if (editedCol !== templateColIndex + 1) return;

  // Apply template to edited row
  const editedRow = e.range.getRow();
  if (editedRow <= 3) return; // Skip header rows

  const templateId = e.range.getValue();
  if (templateId && TEMPLATE_DEFINITIONS[templateId]) {
    applyTemplateToRow(sheet, editedRow, headers, templateId);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Template ${templateId} applied! Required fields highlighted.`,
      'Template Applied',
      3
    );
  } else if (!templateId || templateId === '') {
    // Clear highlighting if template removed
    const totalCols = sheet.getLastColumn();
    sheet.getRange(editedRow, 1, 1, totalCols).setBackground(null);
  }
}

/**
 * Show template selection dialog
 * Helps user choose the right template
 */
function lukoShowTemplateSelector() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 10px; }
      .template { padding: 10px; margin: 5px 0; border-radius: 5px; cursor: pointer; }
      .template:hover { opacity: 0.8; }
      h3 { margin: 0 0 5px 0; }
      p { margin: 5px 0; font-size: 12px; }
      .beginner { background: #E8F5E9; }
      .intermediate { background: #FFF3E0; }
      .advanced { background: #FCE4EC; }
      .expert { background: #E8EAF6; }
    </style>
    <h2>📋 Select Template</h2>
    <p>Click a template to copy its ID, then paste in the Template column:</p>

    <div class="template beginner" onclick="copyText('T01')">
      <h3>⭐ T01 - Basic Essentials</h3>
      <p><strong>Beginner</strong> | 5-10 min | 15 fields</p>
      <p>Quick listing for simple products</p>
    </div>

    <div class="template intermediate" onclick="copyText('T02')">
      <h3>🌍 T02 - Multi-Language Premium</h3>
      <p><strong>Intermediate</strong> | 20-30 min | 120+ fields</p>
      <p>Full translations for all 8 EU languages</p>
    </div>

    <div class="template intermediate" onclick="copyText('T03')">
      <h3>📸 T03 - Visual Storyteller</h3>
      <p><strong>Intermediate</strong> | 15-20 min | 25 fields</p>
      <p>Focus on images - lifestyle + infographics</p>
    </div>

    <div class="template advanced" onclick="copyText('T04')">
      <h3>✨ T04 - A+ Content Basic</h3>
      <p><strong>Advanced</strong> | 30-45 min | 50+ fields</p>
      <p>Enhanced Brand Content (5 modules)</p>
    </div>

    <div class="template intermediate" onclick="copyText('T05')">
      <h3>👕 T05 - Fashion Complete</h3>
      <p><strong>Intermediate</strong> | 25-35 min | 40 fields</p>
      <p>Size charts, materials, care instructions</p>
    </div>

    <div class="template intermediate" onclick="copyText('T06')">
      <h3>🛋️ T06 - Home & Furniture Pro</h3>
      <p><strong>Intermediate</strong> | 20-30 min | 35 fields</p>
      <p>Dimensions, assembly, materials</p>
    </div>

    <div class="template advanced" onclick="copyText('T07')">
      <h3>🔌 T07 - Electronics Tech Specs</h3>
      <p><strong>Advanced</strong> | 30-40 min | 45 fields</p>
      <p>Full technical specifications</p>
    </div>

    <div class="template advanced" onclick="copyText('T08')">
      <h3>🇪🇺 T08 - GPSR Compliant EU</h3>
      <p><strong>Advanced</strong> | 40-60 min | 30 fields</p>
      <p>MANDATORY for EU (Dec 2024+)</p>
    </div>

    <div class="template expert" onclick="copyText('T09')">
      <h3>🎬 T09 - Premium A+ with Video</h3>
      <p><strong>Expert</strong> | 60-90 min | 80+ fields</p>
      <p>Video, comparison table, FAQ (7 modules)</p>
    </div>

    <div class="template intermediate" onclick="copyText('T10')">
      <h3>🎨 T10 - Quick Launch Variations</h3>
      <p><strong>Intermediate</strong> | 15-25 min/child | 20 fields</p>
      <p>Parent-child variations (color, size)</p>
    </div>

    <script>
      function copyText(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Copied: ' + text + '\\n\\nPaste this in the Template column of your product row.');
      }
    </script>
  `)
    .setWidth(500)
    .setHeight(700);

  SpreadsheetApp.getUi().showModalDialog(html, 'Template Selector');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getColumnValue(values, headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? values[index] : '';
}

function getSelectedCheckboxRows(sheet) {
  const data = sheet.getDataRange().getValues();
  const checkboxCol = 0;
  const selectedRows = [];

  for (let i = 3; i < data.length; i++) {
    if (data[i][checkboxCol] === true) {
      selectedRows.push(i + 1);
    }
  }

  return selectedRows;
}

function showError(message) {
  const ui = SpreadsheetApp.getUi();
  ui.alert('Error', message, ui.ButtonSet.OK);
}

function handleError(functionName, error) {
  Logger.log(`Error in ${functionName}: ${error.message}\n${error.stack}`);
  const ui = SpreadsheetApp.getUi();
  ui.alert('Error', `An error occurred in ${functionName}:\n\n${error.message}`, ui.ButtonSet.OK);
}
