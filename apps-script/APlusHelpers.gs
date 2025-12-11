/**
 * A+ Content Helper Functions
 * Utilities for Export checkbox, German dates, contentReferenceKey, etc.
 */

// ==========================================
// EXPORT CHECKBOX MANAGEMENT
// ==========================================

/**
 * Mark row as selected for export with ☑️ checkbox
 * @param {Sheet} sheet - The sheet
 * @param {number} row - Row number
 */
function markForExport(sheet, row) {
  const exportCol = findColumnByHeaderName(sheet, '☑️ Export');
  if (exportCol > 0) {
    sheet.getRange(row, exportCol).setValue(true).insertCheckboxes();
  }
}

/**
 * Mark export as DONE after successful publish
 * @param {Sheet} sheet - The sheet
 * @param {number} row - Row number
 */
function markExportDone(sheet, row) {
  const exportCol = findColumnByHeaderName(sheet, '☑️ Export');
  if (exportCol > 0) {
    // Remove checkbox and set text "DONE"
    sheet.getRange(row, exportCol)
      .removeCheckboxes()
      .setValue('DONE')
      .setFontWeight('bold')
      .setBackground('#C8E6C9') // Light green
      .setFontColor('#1B5E20');  // Dark green
  }
}

/**
 * Check if row is marked for export
 * @param {Sheet} sheet
 * @param {number} row
 * @returns {boolean}
 */
function isMarkedForExport(sheet, row) {
  const exportCol = findColumnByHeaderName(sheet, '☑️ Export');
  if (exportCol > 0) {
    const value = sheet.getRange(row, exportCol).getValue();
    // Check for TRUE (checkbox) OR "EXPORT" OR checkmark character
    return value === true || value === 'EXPORT' || value === '☑' || value === '☑️';
  }
  return false;
}

// ==========================================
// GERMAN DATE FORMATTING
// ==========================================

/**
 * Format date to German format: DD.MM.YYYY HH:mm:ss
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} - Formatted date string
 */
function formatGermanDateTime(date) {
  if (!date) date = new Date();

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format date to German date only: DD.MM.YYYY
 * @param {Date} date
 * @returns {string}
 */
function formatGermanDate(date) {
  if (!date) date = new Date();

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

// ==========================================
// STATUS AND METADATA MANAGEMENT
// ==========================================

/**
 * Update Status, ExportDateTime, and clear ErrorMessage
 * @param {Sheet} sheet
 * @param {number} row
 * @param {string} status - 'PENDING', 'DONE', 'FAILED', 'SKIPPED'
 * @param {string} errorMessage - Optional error message
 */
function updateAPlusStatus(sheet, row, status, errorMessage = '') {
  const statusCol = findColumnByHeaderName(sheet, 'Status');
  const dateTimeCol = findColumnByHeaderName(sheet, 'ExportDateTime');
  const errorCol = findColumnByHeaderName(sheet, 'ErrorMessage');

  const now = formatGermanDateTime(new Date());

  if (statusCol > 0) {
    sheet.getRange(row, statusCol).setValue(status);

    // Color code status
    const statusRange = sheet.getRange(row, statusCol);
    switch(status) {
      case 'DONE':
        statusRange.setBackground('#C8E6C9').setFontColor('#1B5E20'); // Green
        break;
      case 'FAILED':
        statusRange.setBackground('#FFCDD2').setFontColor('#C62828'); // Red
        break;
      case 'PENDING':
        statusRange.setBackground('#FFF9C4').setFontColor('#F57F17'); // Yellow
        break;
      case 'SKIPPED':
        statusRange.setBackground('#E0E0E0').setFontColor('#616161'); // Gray
        break;
    }
  }

  if (dateTimeCol > 0) {
    sheet.getRange(row, dateTimeCol).setValue(now);
  }

  if (errorCol > 0) {
    sheet.getRange(row, errorCol).setValue(errorMessage);

    if (errorMessage) {
      sheet.getRange(row, errorCol)
        .setBackground('#FFEBEE')
        .setFontColor('#C62828');
    } else {
      sheet.getRange(row, errorCol)
        .setBackground('#FFFFFF')
        .setFontColor('#000000');
    }
  }
}

// ==========================================
// CONTENT REFERENCE KEY GENERATION
// ==========================================

/**
 * Generate unique contentReferenceKey for A+ Content
 * Format: ASIN_module{N}_{timestamp}
 * @param {string} asin
 * @param {number} moduleNumber
 * @returns {string}
 */
function generateContentReferenceKey(asin, moduleNumber) {
  const timestamp = Date.now();
  return `${asin}_module${moduleNumber}_${timestamp}`;
}

/**
 * Populate contentReferenceKey if empty
 * @param {Sheet} sheet
 * @param {number} row
 */
function ensureContentReferenceKey(sheet, row) {
  const asinCol = findColumnByHeaderName(sheet, 'ASIN');
  const moduleCol = findColumnByHeaderName(sheet, 'moduleNumber');
  const refKeyCol = findColumnByHeaderName(sheet, 'contentReferenceKey');

  if (refKeyCol > 0 && asinCol > 0) {
    const currentKey = sheet.getRange(row, refKeyCol).getValue();

    // Only generate if empty
    if (!currentKey || currentKey === '') {
      const asin = sheet.getRange(row, asinCol).getValue();
      const moduleNumber = moduleCol > 0 ? sheet.getRange(row, moduleCol).getValue() : 1;

      if (asin) {
        const newKey = generateContentReferenceKey(asin, moduleNumber);
        sheet.getRange(row, refKeyCol).setValue(newKey);
      }
    }
  }
}

// ==========================================
// COLUMN FINDING HELPERS
// ==========================================

/**
 * Find column number by header name
 * @param {Sheet} sheet
 * @param {string} headerName
 * @returns {number} - Column number (1-indexed) or -1 if not found
 */
function findColumnByHeaderName(sheet, headerName) {
  const headerRow = 3; // APlusBasic and APlusPremium have headers in row 3
  const lastCol = sheet.getLastColumn();

  if (lastCol === 0) return -1;

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  const index = headers.indexOf(headerName);

  return index >= 0 ? index + 1 : -1;
}

/**
 * Find column by partial match (useful for language-specific columns)
 * @param {Sheet} sheet
 * @param {string} partialName - Partial column name (e.g., "headline_DE")
 * @returns {number} - First matching column number or -1
 */
function findColumnByPartialName(sheet, partialName) {
  const headerRow = 3;
  const lastCol = sheet.getLastColumn();

  if (lastCol === 0) return -1;

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];

  for (let i = 0; i < headers.length; i++) {
    if (headers[i] && headers[i].toString().includes(partialName)) {
      return i + 1;
    }
  }

  return -1;
}

// ==========================================
// ROW HEIGHT MANAGEMENT
// ==========================================

/**
 * Set default row height for new data rows
 * Prevents auto-resizing when content added
 * @param {Sheet} sheet
 * @param {number} row
 * @param {number} height - Default 21 pixels
 */
function setDefaultRowHeight(sheet, row, height = 21) {
  sheet.setRowHeight(row, height);
}

/**
 * Reset all data rows to default height
 * @param {Sheet} sheet
 * @param {number} startRow - First data row (usually 4)
 * @param {number} endRow - Last row with data
 */
function resetAllRowHeights(sheet, startRow = 4, endRow = null) {
  if (!endRow) {
    endRow = sheet.getLastRow();
  }

  if (endRow >= startRow) {
    sheet.setRowHeights(startRow, endRow - startRow + 1, 21);
  }
}

// ==========================================
// DATA VALIDATION HELPERS
// ==========================================

/**
 * Add dropdown for moduleType in APlusBasic
 * @param {Sheet} sheet
 */
function addModuleTypeValidation_Basic(sheet) {
  const moduleTypeCol = findColumnByHeaderName(sheet, 'moduleType');

  if (moduleTypeCol > 0) {
    const moduleTypes = [
      'STANDARD_TEXT',
      'STANDARD_SINGLE_SIDE_IMAGE',
      'STANDARD_HEADER_IMAGE_TEXT',
      'STANDARD_COMPANY_LOGO',
      'STANDARD_IMAGE_TEXT_OVERLAY',
      'STANDARD_SINGLE_IMAGE_HIGHLIGHTS',
      'STANDARD_MULTIPLE_IMAGE_TEXT',
      'STANDARD_FOUR_IMAGE_TEXT',
      'STANDARD_FOUR_IMAGE_TEXT_QUADRANT',
      'STANDARD_THREE_IMAGE_TEXT',
      'STANDARD_COMPARISON_TABLE',
      'STANDARD_PRODUCT_DESCRIPTION',
      'STANDARD_SINGLE_IMAGE_SPECS_DETAIL',
      'STANDARD_IMAGE_SIDEBAR',
      'STANDARD_TECH_SPECS'
    ];

    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(moduleTypes, true)
      .setAllowInvalid(false)
      .setHelpText('Select a Standard A+ module type')
      .build();

    sheet.getRange(4, moduleTypeCol, 996).setDataValidation(rule);
  }
}

/**
 * Add dropdown for moduleType in APlusPremium
 * @param {Sheet} sheet
 */
function addModuleTypeValidation_Premium(sheet) {
  const moduleTypeCol = findColumnByHeaderName(sheet, 'moduleType');

  if (moduleTypeCol > 0) {
    const moduleTypes = [
      'PREMIUM_TEXT',
      'PREMIUM_SINGLE_IMAGE_TEXT',
      'PREMIUM_BACKGROUND_IMAGE_TEXT',
      'PREMIUM_FULL_IMAGE',
      'PREMIUM_DUAL_IMAGES_TEXT',
      'PREMIUM_FOUR_IMAGES_TEXT',
      'PREMIUM_COMPARISON_TABLE_1',
      'PREMIUM_COMPARISON_TABLE_2',
      'PREMIUM_COMPARISON_TABLE_3',
      'PREMIUM_HOTSPOTS_1',
      'PREMIUM_HOTSPOTS_2',
      'PREMIUM_NAVIGATION_CAROUSEL',
      'PREMIUM_REGIMEN_CAROUSEL',
      'PREMIUM_SIMPLE_IMAGE_CAROUSEL',
      'PREMIUM_VIDEO_IMAGE_CAROUSEL',
      'PREMIUM_FULL_VIDEO',
      'PREMIUM_VIDEO_WITH_TEXT',
      'PREMIUM_QA',
      'PREMIUM_TECHNICAL_SPECIFICATIONS'
    ];

    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(moduleTypes, true)
      .setAllowInvalid(false)
      .setHelpText('Select a Premium A+ module type')
      .build();

    sheet.getRange(4, moduleTypeCol, 996).setDataValidation(rule);
  }
}

/**
 * Add dropdown for Status column
 * @param {Sheet} sheet
 */
function addStatusValidation(sheet) {
  const statusCol = findColumnByHeaderName(sheet, 'Status');

  if (statusCol > 0) {
    const statusValues = ['PENDING', 'DONE', 'FAILED', 'SKIPPED'];

    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(statusValues, true)
      .setAllowInvalid(false)
      .build();

    sheet.getRange(4, statusCol, 996).setDataValidation(rule);
  }
}
