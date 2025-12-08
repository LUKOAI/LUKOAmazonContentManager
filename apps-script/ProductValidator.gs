/**
 * LUKO-ACM Product Validator
 * Complete validation system with Amazon compliance rules
 *
 * Features:
 * - Pre-export validation (titles, bullets, keywords, images)
 * - Prohibited words detection (8 languages)
 * - Field length validation
 * - Image URL validation
 * - GPSR compliance checks
 * - Error logging to ErrorLog sheet
 * - Cell highlighting for errors
 */

// Load validation rules from config (embed critical rules for performance)
const VALIDATION_CONFIG = {
  titleMaxLength: 200,
  titleMaxWordRepetition: 2,
  bulletMaxLength: 500,
  bulletMaxCount: 5,
  descriptionMaxLength: 2000,
  keywordsMaxLength: 250,
  brandMaxLength: 50,
  imageMinSize: 1000,
  imageRecommendedSize: 2000,
  imageMaxFileSize: 10485760, // 10MB
  pdfMaxFileSize: 10485760,   // 10MB

  prohibitedChars: ['!', '$', '?', '_', '{', '}', '^', '¬', '¦'],

  // Embedded prohibited terms (critical subset - full list in validation-rules.json)
  prohibitedTerms: {
    'EN': ['best', 'best seller', 'cheapest', 'free', 'amazon', 'guaranteed', 'FDA approved', 'COVID', 'cure', 'treatment'],
    'DE': ['beste', 'bestseller', 'am billigsten', 'kostenlos', 'amazon', 'garantiert', 'FDA-zugelassen', 'COVID', 'Heilung'],
    'FR': ['meilleur', 'best-seller', 'moins cher', 'gratuit', 'amazon', 'garanti', 'approuvé FDA', 'COVID', 'guérison'],
    'IT': ['migliore', 'bestseller', 'più economico', 'gratuito', 'amazon', 'garantito', 'approvato FDA', 'COVID', 'cura'],
    'ES': ['mejor', 'más vendido', 'más barato', 'gratis', 'amazon', 'garantizado', 'aprobado FDA', 'COVID', 'cura'],
    'NL': ['beste', 'bestseller', 'goedkoopste', 'gratis', 'amazon', 'gegarandeerd', 'FDA-goedgekeurd', 'COVID', 'genezing'],
    'PL': ['najlepszy', 'bestseller', 'najtańszy', 'darmowy', 'amazon', 'gwarantowany', 'zatwierdzony przez FDA', 'COVID', 'leczyć'],
    'SE': ['bäst', 'bästsäljare', 'billigast', 'gratis', 'amazon', 'garanterad', 'FDA-godkänd', 'COVID', 'bota']
  }
};

// ========================================
// MAIN VALIDATION FUNCTION
// ========================================

/**
 * Validate selected products before export
 * Call this from menu: Validation → Validate Selected Products
 */
function lukoValidateSelectedProducts() {
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

    const ui = SpreadsheetApp.getUi();
    ui.alert('🔍 Running validation...', `Validating ${selectedRows.length} products.\n\nThis may take a moment.`, ui.ButtonSet.OK);

    const results = [];
    const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];

    for (const row of selectedRows) {
      const validationResult = validateProductRow(sheet, row, headers);
      results.push(validationResult);

      // Highlight errors in the row
      highlightRowErrors(sheet, row, headers, validationResult);

      // Log errors to ErrorLog sheet
      if (validationResult.errors.length > 0) {
        logValidationErrors(validationResult);
      }
    }

    // Show summary
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    const blockers = results.filter(r => r.hasBlockingErrors).length;

    let message = `Validation complete!\n\n`;
    message += `✅ Products validated: ${results.length}\n`;
    message += `❌ Blocking errors: ${totalErrors} (${blockers} products)\n`;
    message += `⚠️ Warnings: ${totalWarnings}\n\n`;

    if (blockers > 0) {
      message += `${blockers} product(s) cannot be exported due to errors.\nCheck ErrorLog sheet for details.`;
    } else if (totalWarnings > 0) {
      message += `All products pass validation, but some have warnings.\nReview ErrorLog sheet for optimization suggestions.`;
    } else {
      message += `All products pass validation! ✨\nReady to export.`;
    }

    ui.alert('Validation Results', message, ui.ButtonSet.OK);

  } catch (error) {
    handleError('lukoValidateSelectedProducts', error);
  }
}

/**
 * Validate single product row
 * Returns: {sku, asin, errors: [], warnings: [], hasBlockingErrors: boolean}
 */
function validateProductRow(sheet, rowNumber, headers) {
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];

  const result = {
    row: rowNumber,
    sku: getColumnValue(values, headers, 'SKU'),
    asin: getColumnValue(values, headers, 'ASIN'),
    errors: [],
    warnings: [],
    hasBlockingErrors: false
  };

  const template = getColumnValue(values, headers, 'Template');
  const validationOverride = getColumnValue(values, headers, 'ValidationOverride');

  // Skip validation if override is TRUE (unless critical errors)
  const skipNonCritical = validationOverride === true || validationOverride === 'TRUE';

  // 1. Validate core required fields
  validateRequiredFields(values, headers, result);

  // 2. Validate titles (all languages)
  validateTitles(values, headers, result, skipNonCritical);

  // 3. Validate bullet points
  validateBulletPoints(values, headers, result, skipNonCritical);

  // 4. Validate descriptions
  validateDescriptions(values, headers, result, skipNonCritical);

  // 5. Validate keywords
  validateKeywords(values, headers, result, skipNonCritical);

  // 6. Validate images
  validateImages(values, headers, result, skipNonCritical);

  // 7. Validate GPSR (if selling in EU)
  validateGPSR(values, headers, result, skipNonCritical);

  // 8. Validate template requirements
  if (template) {
    validateTemplateRequirements(values, headers, template, result, skipNonCritical);
  }

  result.hasBlockingErrors = result.errors.length > 0;
  return result;
}

// ========================================
// FIELD VALIDATION FUNCTIONS
// ========================================

function validateRequiredFields(values, headers, result) {
  const requiredFields = ['SKU', 'Product Type'];

  for (const field of requiredFields) {
    const value = getColumnValue(values, headers, field);
    if (!value || value.toString().trim() === '') {
      result.errors.push({
        field: field,
        code: '18000',
        type: 'Missing Required Field',
        message: `${field} is required but empty`,
        recommendation: `Fill in ${field} field`,
        severity: 'error'
      });
    }
  }

  // At least one language must have title and brand
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];
  let hasTitle = false;
  let hasBrand = false;

  for (const lang of languages) {
    const title = getColumnValue(values, headers, `productTitle_${lang}`);
    const brand = getColumnValue(values, headers, `brand_${lang}`);
    if (title && title.trim()) hasTitle = true;
    if (brand && brand.trim()) hasBrand = true;
  }

  if (!hasTitle) {
    result.errors.push({
      field: 'productTitle',
      code: '18000',
      type: 'Missing Required Field',
      message: 'Product title required in at least one language',
      recommendation: 'Add product title in German (DE) or English (EN)',
      severity: 'error'
    });
  }

  if (!hasBrand) {
    result.errors.push({
      field: 'brand',
      code: '18000',
      type: 'Missing Required Field',
      message: 'Brand name required in at least one language',
      recommendation: 'Add brand name in German (DE) or English (EN)',
      severity: 'error'
    });
  }
}

function validateTitles(values, headers, result, skipNonCritical) {
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of languages) {
    const title = getColumnValue(values, headers, `productTitle_${lang}`);
    if (!title || title.trim() === '') continue; // Skip empty titles

    const fieldName = `productTitle_${lang}`;

    // Check length
    if (title.length > VALIDATION_CONFIG.titleMaxLength) {
      result.errors.push({
        field: fieldName,
        code: '8541',
        type: 'Title Too Long',
        message: `Title is ${title.length} characters (max ${VALIDATION_CONFIG.titleMaxLength})`,
        recommendation: `Shorten title to ${VALIDATION_CONFIG.titleMaxLength} characters or less`,
        severity: 'error'
      });
    }

    // Check prohibited characters (unless in brand name)
    const brand = getColumnValue(values, headers, `brand_${lang}`) || '';
    for (const char of VALIDATION_CONFIG.prohibitedChars) {
      if (title.includes(char) && !brand.includes(char)) {
        result.errors.push({
          field: fieldName,
          code: '5665',
          type: 'Invalid Characters',
          message: `Title contains prohibited character: ${char}`,
          recommendation: `Remove "${char}" from title (unless it's part of brand name)`,
          severity: 'error'
        });
      }
    }

    if (!skipNonCritical) {
      // Check word repetition
      const words = title.toLowerCase().split(/\s+/);
      const wordCount = {};
      for (const word of words) {
        if (word.length > 2) { // Only check words > 2 chars
          wordCount[word] = (wordCount[word] || 0) + 1;
          if (wordCount[word] > VALIDATION_CONFIG.titleMaxWordRepetition) {
            result.errors.push({
              field: fieldName,
              code: '8552',
              type: 'Repeated Words',
              message: `Word "${word}" appears ${wordCount[word]} times (max ${VALIDATION_CONFIG.titleMaxWordRepetition})`,
              recommendation: `Remove duplicate occurrences of "${word}"`,
              severity: 'error'
            });
          }
        }
      }

      // Check prohibited terms
      const prohibitedForLang = VALIDATION_CONFIG.prohibitedTerms[lang] || VALIDATION_CONFIG.prohibitedTerms['EN'];
      for (const term of prohibitedForLang) {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(title)) {
          result.errors.push({
            field: fieldName,
            code: '90127',
            type: 'Prohibited Terms',
            message: `Title contains prohibited term: "${term}"`,
            recommendation: `Replace "${term}" with allowed alternative (see validation-rules.json)`,
            severity: 'error'
          });
        }
      }
    }
  }
}

function validateBulletPoints(values, headers, result, skipNonCritical) {
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of languages) {
    let bulletCount = 0;

    for (let i = 1; i <= VALIDATION_CONFIG.bulletMaxCount; i++) {
      const bullet = getColumnValue(values, headers, `bulletPoint${i}_${lang}`);
      if (!bullet || bullet.trim() === '') continue;

      bulletCount++;
      const fieldName = `bulletPoint${i}_${lang}`;

      // Check length
      if (bullet.length > VALIDATION_CONFIG.bulletMaxLength) {
        result.errors.push({
          field: fieldName,
          code: '8560',
          type: 'Bullet Point Too Long',
          message: `Bullet point ${i} is ${bullet.length} characters (max ${VALIDATION_CONFIG.bulletMaxLength})`,
          recommendation: `Shorten bullet point to ${VALIDATION_CONFIG.bulletMaxLength} characters or less`,
          severity: 'error'
        });
      }

      if (!skipNonCritical) {
        // Check prohibited terms (sample check)
        const prohibitedForLang = VALIDATION_CONFIG.prohibitedTerms[lang] || VALIDATION_CONFIG.prohibitedTerms['EN'];
        for (const term of prohibitedForLang.slice(0, 5)) { // Check first 5 critical terms only for performance
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(bullet)) {
            result.warnings.push({
              field: fieldName,
              type: 'Prohibited Terms',
              message: `Bullet point may contain prohibited term: "${term}"`,
              recommendation: `Review and replace if necessary`,
              severity: 'warning'
            });
          }
        }
      }
    }

    // Warn if less than 3 bullet points (recommended minimum)
    if (bulletCount > 0 && bulletCount < 3 && !skipNonCritical) {
      result.warnings.push({
        field: `bulletPoints_${lang}`,
        type: 'Incomplete Content',
        message: `Only ${bulletCount} bullet points (recommended: 3-5)`,
        recommendation: `Add more bullet points to increase conversion`,
        severity: 'warning'
      });
    }
  }
}

function validateDescriptions(values, headers, result, skipNonCritical) {
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of languages) {
    const description = getColumnValue(values, headers, `productDescription_${lang}`);
    if (!description || description.trim() === '') continue;

    const fieldName = `productDescription_${lang}`;

    // Check length
    if (description.length > VALIDATION_CONFIG.descriptionMaxLength) {
      result.errors.push({
        field: fieldName,
        code: '8542',
        type: 'Description Too Long',
        message: `Description is ${description.length} characters (max ${VALIDATION_CONFIG.descriptionMaxLength})`,
        recommendation: `Shorten description to ${VALIDATION_CONFIG.descriptionMaxLength} characters or less`,
        severity: 'error'
      });
    }

    // Check for HTML tags (not allowed in standard descriptions)
    if (/<[^>]*>/g.test(description) && !skipNonCritical) {
      result.warnings.push({
        field: fieldName,
        type: 'HTML Detected',
        message: 'Description contains HTML tags',
        recommendation: 'Remove HTML tags from description (use plain text)',
        severity: 'warning'
      });
    }
  }
}

function validateKeywords(values, headers, result, skipNonCritical) {
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of languages) {
    const keywords = getColumnValue(values, headers, `genericKeywords_${lang}`);
    if (!keywords || keywords.trim() === '') continue;

    const fieldName = `genericKeywords_${lang}`;

    // Check length
    if (keywords.length > VALIDATION_CONFIG.keywordsMaxLength) {
      result.errors.push({
        field: fieldName,
        code: '8543',
        type: 'Keywords Too Long',
        message: `Keywords are ${keywords.length} characters (max ${VALIDATION_CONFIG.keywordsMaxLength})`,
        recommendation: `Shorten keywords to ${VALIDATION_CONFIG.keywordsMaxLength} characters or less`,
        severity: 'error'
      });
    }
  }
}

function validateImages(values, headers, result, skipNonCritical) {
  const mainImage = getColumnValue(values, headers, 'mainImageURL');

  // Main image is required
  if (!mainImage || mainImage.trim() === '') {
    result.errors.push({
      field: 'mainImageURL',
      code: '8026',
      type: 'Missing Main Image',
      message: 'Main image URL is required',
      recommendation: 'Add URL for main product image (white background, 2000x2000px recommended)',
      severity: 'error'
    });
  } else if (!isValidImageURL(mainImage)) {
    result.errors.push({
      field: 'mainImageURL',
      code: '8026',
      type: 'Invalid Image URL',
      message: 'Main image URL is invalid or inaccessible',
      recommendation: 'Provide valid HTTPS URL to JPEG/PNG image',
      severity: 'error'
    });
  }

  // Check additional images (optional but recommended)
  if (!skipNonCritical) {
    let additionalCount = 0;
    for (let i = 1; i <= 8; i++) {
      const imgURL = getColumnValue(values, headers, `additionalImage${i}_URL`);
      if (imgURL && imgURL.trim()) additionalCount++;
    }

    if (additionalCount < 3) {
      result.warnings.push({
        field: 'images',
        type: 'Few Images',
        message: `Only ${additionalCount + 1} images (recommended: 5+)`,
        recommendation: 'Add more product images to increase conversion',
        severity: 'warning'
      });
    }
  }
}

function validateGPSR(values, headers, result, skipNonCritical) {
  // GPSR is MANDATORY for EU as of Dec 13, 2024
  const gpsrFields = [
    'manufacturer_name',
    'manufacturer_address',
    'manufacturer_email',
    'responsiblePerson_name',
    'responsiblePerson_address',
    'responsiblePerson_email'
  ];

  let missingGPSR = [];
  for (const field of gpsrFields) {
    const value = getColumnValue(values, headers, field);
    if (!value || value.toString().trim() === '') {
      missingGPSR.push(field);
    }
  }

  if (missingGPSR.length > 0) {
    result.errors.push({
      field: 'GPSR',
      code: '13012',
      type: 'GPSR Missing',
      message: `GPSR compliance data missing: ${missingGPSR.join(', ')}`,
      recommendation: 'Fill in ALL GPSR fields - MANDATORY for EU sales since Dec 13, 2024',
      severity: 'error'
    });
  }

  // Check safety information document
  const safetyDoc = getColumnValue(values, headers, 'safetyInformation_URL');
  if (!safetyDoc || safetyDoc.trim() === '') {
    result.errors.push({
      field: 'safetyInformation_URL',
      code: '13012',
      type: 'GPSR Missing',
      message: 'Safety information document URL required',
      recommendation: 'Upload product safety information PDF and enter URL',
      severity: 'error'
    });
  }
}

function validateTemplateRequirements(values, headers, templateId, result, skipNonCritical) {
  // TODO: Load template from product-templates.json and validate required fields
  // For now, just add a warning if template is set but fields might be missing
  if (!skipNonCritical) {
    result.warnings.push({
      field: 'Template',
      type: 'Template Selected',
      message: `Template ${templateId} selected`,
      recommendation: 'Ensure all highlighted fields for this template are filled',
      severity: 'info'
    });
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function isValidImageURL(url) {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  // Check if ends with image extension
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif'];
  const lower = trimmed.toLowerCase();
  return imageExts.some(ext => lower.includes(ext));
}

function getColumnValue(values, headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? values[index] : '';
}

function getSelectedCheckboxRows(sheet) {
  const data = sheet.getDataRange().getValues();
  const checkboxCol = 0; // First column
  const selectedRows = [];

  // Start from row 4 (row 3 is headers, rows 1-2 are instructions)
  for (let i = 3; i < data.length; i++) {
    if (data[i][checkboxCol] === true) {
      selectedRows.push(i + 1); // +1 because getRange is 1-indexed
    }
  }

  return selectedRows;
}

// ========================================
// ERROR HIGHLIGHTING
// ========================================

/**
 * Highlight cells with errors in red, warnings in yellow
 */
function highlightRowErrors(sheet, rowNumber, headers, validationResult) {
  // Clear previous highlights (reset to white)
  const totalCols = headers.length;
  sheet.getRange(rowNumber, 1, 1, totalCols).setBackground(null);

  // Highlight error fields
  for (const error of validationResult.errors) {
    const colIndex = headers.indexOf(error.field);
    if (colIndex >= 0) {
      sheet.getRange(rowNumber, colIndex + 1).setBackground('#FFCDD2'); // Light red
    }
  }

  // Highlight warning fields
  for (const warning of validationResult.warnings) {
    const colIndex = headers.indexOf(warning.field);
    if (colIndex >= 0 && sheet.getRange(rowNumber, colIndex + 1).getBackground() !== '#FFCDD2') {
      sheet.getRange(rowNumber, colIndex + 1).setBackground('#FFF9C4'); // Light yellow
    }
  }
}

// ========================================
// ERROR LOGGING
// ========================================

/**
 * Log validation errors to ErrorLog sheet
 */
function logValidationErrors(validationResult) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let errorLogSheet = ss.getSheetByName('ErrorLog');

  if (!errorLogSheet) {
    Logger.log('ErrorLog sheet not found, skipping error logging');
    return;
  }

  const timestamp = new Date();

  // Log each error
  for (const error of validationResult.errors) {
    const row = [
      timestamp,
      validationResult.sku || '',
      validationResult.asin || '',
      error.type || 'Validation Error',
      error.code || '',
      error.message || '',
      error.recommendation || '',
      error.field || '',
      'PENDING'
    ];

    errorLogSheet.appendRow(row);
  }

  // Optionally log warnings
  for (const warning of validationResult.warnings) {
    const row = [
      timestamp,
      validationResult.sku || '',
      validationResult.asin || '',
      warning.type || 'Validation Warning',
      '',
      warning.message || '',
      warning.recommendation || '',
      warning.field || '',
      'WARNING'
    ];

    errorLogSheet.appendRow(row);
  }
}

/**
 * Clear error highlights from selected rows
 */
function lukoClearErrorHighlights() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductsMain');
    if (!sheet) return;

    const selectedRows = getSelectedCheckboxRows(sheet);
    if (selectedRows.length === 0) {
      showError('No products selected');
      return;
    }

    for (const row of selectedRows) {
      const totalCols = sheet.getLastColumn();
      sheet.getRange(row, 1, 1, totalCols).setBackground(null);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('Error highlights cleared', 'Success', 2);

  } catch (error) {
    handleError('lukoClearErrorHighlights', error);
  }
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
