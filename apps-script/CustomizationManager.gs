/**
 * Customization Manager - LUKO Amazon Content Manager
 *
 * Handles product customization and personalization features for Amazon.
 * Supports text engraving, surface customization, image uploads, and templates.
 *
 * Functions:
 * - Customization data validation
 * - Export customization options to Amazon
 * - Template management (pre-built customization configs)
 * - Bulk enable/disable customization
 * - Pricing calculations for custom options
 *
 * @author LUKO-ACM
 * @version 1.0.0
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates customization data before export
 * Checks all customization fields, pricing, and business rules
 *
 * @returns {Object} Validation result with {isValid, errors, warnings}
 */
function lukoValidateCustomization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName('Customization');

  if (!customSheet) {
    lukoShowMessage('Error', 'Customization sheet not found. Please generate it first.');
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  const lastRow = customSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to validate in Customization sheet.');
    return { isValid: true, errors: [], warnings: [] };
  }

  const data = customSheet.getRange(4, 1, lastRow - 3, 58).getValues();
  const errors = [];
  const warnings = [];
  let validCount = 0;

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      exportCheckbox, asin, sku, customizationEnabled,
      // Text Customization Field 1
      text1Enabled, text1Label, text1MaxChars, text1Placeholder, text1Required, text1Price,
      // Text Customization Field 2
      text2Enabled, text2Label, text2MaxChars, text2Placeholder, text2Required, text2Price,
      // Text Customization Field 3
      text3Enabled, text3Label, text3MaxChars, text3Placeholder, text3Required, text3Price,
      // Surface Customization
      surfaceCustomEnabled, surface1Name, surface1Enabled, surface1Price,
      surface2Name, surface2Enabled, surface2Price,
      surface3Name, surface3Enabled, surface3Price,
      surface4Name, surface4Enabled, surface4Price,
      surface5Name, surface5Enabled, surface5Price,
      // Image Upload Customization
      imageUploadEnabled, imageMinWidth, imageMinHeight, imageMaxFileSize,
      allowedFormats, imageInstructions, imageUploadPrice,
      // Pricing & Options
      customizationFee, maxCustomizationPrice, processingTime,
      allowGiftMessage, giftMessageMaxChars, allowGiftWrap, giftWrapPrice,
      previewImageUrl, instructionsText,
      // Status fields
      exportStatus, exportDateTime, lastModified, modifiedBy, errorMessages
    ] = row;

    // Skip rows not marked for export
    if (!exportCheckbox) {
      return;
    }

    const rowErrors = [];
    const rowWarnings = [];

    // Required: ASIN
    if (!asin || asin.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: ASIN is required`);
    } else if (!/^B[0-9A-Z]{9}$/.test(asin.toString().trim())) {
      rowErrors.push(`Row ${rowNum}: Invalid ASIN format`);
    }

    // Required: SKU
    if (!sku || sku.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: SKU is required`);
    }

    // Required: Customization Enabled
    if (customizationEnabled !== 'Yes' && customizationEnabled !== 'No') {
      rowErrors.push(`Row ${rowNum}: Customization Enabled must be 'Yes' or 'No'`);
    }

    // If customization is disabled, warn but allow
    if (customizationEnabled === 'No') {
      rowWarnings.push(`Row ${rowNum}: Customization is disabled - this will remove customization options from the product`);
      // Skip further validation if disabled
      if (rowErrors.length === 0) validCount++;
      errors.push(...rowErrors);
      warnings.push(...rowWarnings);
      return;
    }

    // At least one customization type must be enabled
    const hasTextCustom = text1Enabled === 'Yes' || text2Enabled === 'Yes' || text3Enabled === 'Yes';
    const hasSurfaceCustom = surfaceCustomEnabled === 'Yes';
    const hasImageCustom = imageUploadEnabled === 'Yes';

    if (!hasTextCustom && !hasSurfaceCustom && !hasImageCustom) {
      rowErrors.push(`Row ${rowNum}: At least one customization type must be enabled (Text, Surface, or Image Upload)`);
    }

    // TEXT CUSTOMIZATION VALIDATION
    const textFields = [
      { enabled: text1Enabled, label: text1Label, maxChars: text1MaxChars, price: text1Price, num: 1 },
      { enabled: text2Enabled, label: text2Label, maxChars: text2MaxChars, price: text2Price, num: 2 },
      { enabled: text3Enabled, label: text3Label, maxChars: text3MaxChars, price: text3Price, num: 3 }
    ];

    textFields.forEach(field => {
      if (field.enabled === 'Yes') {
        if (!field.label || field.label.toString().trim() === '') {
          rowErrors.push(`Row ${rowNum}: Text Field ${field.num} Label is required when enabled`);
        }
        if (!field.maxChars || isNaN(parseInt(field.maxChars)) || parseInt(field.maxChars) < 1) {
          rowErrors.push(`Row ${rowNum}: Text Field ${field.num} Max Characters must be a positive number`);
        } else if (parseInt(field.maxChars) > 100) {
          rowWarnings.push(`Row ${rowNum}: Text Field ${field.num} Max Characters is ${field.maxChars} (very long - verify this is correct)`);
        }
        if (field.price !== '' && field.price !== null) {
          const price = parseFloat(field.price);
          if (isNaN(price)) {
            rowErrors.push(`Row ${rowNum}: Text Field ${field.num} Price must be a number`);
          } else if (price < 0) {
            rowErrors.push(`Row ${rowNum}: Text Field ${field.num} Price cannot be negative`);
          }
        }
      }
    });

    // SURFACE CUSTOMIZATION VALIDATION
    if (surfaceCustomEnabled === 'Yes') {
      const surfaces = [
        { name: surface1Name, enabled: surface1Enabled, price: surface1Price, num: 1 },
        { name: surface2Name, enabled: surface2Enabled, price: surface2Price, num: 2 },
        { name: surface3Name, enabled: surface3Enabled, price: surface3Price, num: 3 },
        { name: surface4Name, enabled: surface4Enabled, price: surface4Price, num: 4 },
        { name: surface5Name, enabled: surface5Enabled, price: surface5Price, num: 5 }
      ];

      const enabledSurfaces = surfaces.filter(s => s.enabled === 'Yes');

      if (enabledSurfaces.length === 0) {
        rowErrors.push(`Row ${rowNum}: Surface Customization is enabled but no surfaces are enabled`);
      }

      enabledSurfaces.forEach(surface => {
        if (!surface.name || surface.name.toString().trim() === '') {
          rowErrors.push(`Row ${rowNum}: Surface ${surface.num} Name is required when enabled`);
        }
        if (surface.price !== '' && surface.price !== null) {
          const price = parseFloat(surface.price);
          if (isNaN(price)) {
            rowErrors.push(`Row ${rowNum}: Surface ${surface.num} Price must be a number`);
          } else if (price < 0) {
            rowErrors.push(`Row ${rowNum}: Surface ${surface.num} Price cannot be negative`);
          }
        }
      });
    }

    // IMAGE UPLOAD CUSTOMIZATION VALIDATION
    if (imageUploadEnabled === 'Yes') {
      if (!imageMinWidth || isNaN(parseInt(imageMinWidth)) || parseInt(imageMinWidth) < 1) {
        rowErrors.push(`Row ${rowNum}: Image Min Width must be a positive number when Image Upload is enabled`);
      }
      if (!imageMinHeight || isNaN(parseInt(imageMinHeight)) || parseInt(imageMinHeight) < 1) {
        rowErrors.push(`Row ${rowNum}: Image Min Height must be a positive number when Image Upload is enabled`);
      }
      if (!imageMaxFileSize || isNaN(parseFloat(imageMaxFileSize)) || parseFloat(imageMaxFileSize) <= 0) {
        rowErrors.push(`Row ${rowNum}: Image Max File Size must be a positive number when Image Upload is enabled`);
      } else if (parseFloat(imageMaxFileSize) > 10) {
        rowWarnings.push(`Row ${rowNum}: Image Max File Size is ${imageMaxFileSize} MB (very large - Amazon may have limits)`);
      }
      if (!allowedFormats || allowedFormats.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Allowed Formats is empty (specify formats like JPG, PNG, PDF)`);
      }
      if (imageUploadPrice !== '' && imageUploadPrice !== null) {
        const price = parseFloat(imageUploadPrice);
        if (isNaN(price)) {
          rowErrors.push(`Row ${rowNum}: Image Upload Price must be a number`);
        } else if (price < 0) {
          rowErrors.push(`Row ${rowNum}: Image Upload Price cannot be negative`);
        }
      }
    }

    // PRICING VALIDATION
    if (customizationFee !== '' && customizationFee !== null) {
      const fee = parseFloat(customizationFee);
      if (isNaN(fee)) {
        rowErrors.push(`Row ${rowNum}: Customization Fee must be a number`);
      } else if (fee < 0) {
        rowErrors.push(`Row ${rowNum}: Customization Fee cannot be negative`);
      }
    }

    if (maxCustomizationPrice !== '' && maxCustomizationPrice !== null) {
      const maxPrice = parseFloat(maxCustomizationPrice);
      if (isNaN(maxPrice)) {
        rowErrors.push(`Row ${rowNum}: Max Customization Price must be a number`);
      } else if (maxPrice < 0) {
        rowErrors.push(`Row ${rowNum}: Max Customization Price cannot be negative`);
      }
    }

    // PROCESSING TIME VALIDATION
    if (processingTime !== '' && processingTime !== null) {
      const days = parseInt(processingTime);
      if (isNaN(days) || days < 0) {
        rowErrors.push(`Row ${rowNum}: Processing Time must be a non-negative number (days)`);
      } else if (days > 30) {
        rowWarnings.push(`Row ${rowNum}: Processing Time is ${days} days (very long - customers may not wait)`);
      }
    }

    // GIFT OPTIONS VALIDATION
    if (allowGiftMessage === 'Yes') {
      if (!giftMessageMaxChars || isNaN(parseInt(giftMessageMaxChars)) || parseInt(giftMessageMaxChars) < 1) {
        rowWarnings.push(`Row ${rowNum}: Gift Message Max Characters should be specified when Gift Message is allowed`);
      }
    }

    if (allowGiftWrap === 'Yes') {
      if (giftWrapPrice !== '' && giftWrapPrice !== null) {
        const price = parseFloat(giftWrapPrice);
        if (isNaN(price)) {
          rowErrors.push(`Row ${rowNum}: Gift Wrap Price must be a number`);
        } else if (price < 0) {
          rowErrors.push(`Row ${rowNum}: Gift Wrap Price cannot be negative`);
        }
      }
    }

    // PREVIEW IMAGE VALIDATION
    if (previewImageUrl && previewImageUrl !== '') {
      const url = previewImageUrl.toString().trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        rowErrors.push(`Row ${rowNum}: Preview Image URL must start with http:// or https://`);
      }
    }

    if (rowErrors.length === 0) {
      validCount++;
    }

    errors.push(...rowErrors);
    warnings.push(...rowWarnings);
  });

  const markedForExport = data.filter(row => row[0]).length;
  const isValid = errors.length === 0;

  // Log validation result
  lukoLogToSheet('Validation', `Customization validated: ${validCount}/${markedForExport} rows valid, ${errors.length} errors, ${warnings.length} warnings`);

  // Show result to user
  let message = `Customization Validation Complete:\n\n`;
  message += `✓ Rows marked for export: ${markedForExport}\n`;
  message += `✓ Valid rows: ${validCount}\n`;
  message += `✗ Errors: ${errors.length}\n`;
  message += `⚠ Warnings: ${warnings.length}\n\n`;

  if (errors.length > 0) {
    message += `Errors (first 10):\n${errors.slice(0, 10).join('\n')}\n\n`;
  }

  if (warnings.length > 0) {
    message += `Warnings (first 10):\n${warnings.slice(0, 10).join('\n')}`;
  }

  if (isValid) {
    message += `\n\n✅ All data is valid and ready for export!`;
  }

  lukoShowMessage(isValid ? 'Validation Successful' : 'Validation Failed', message);

  return { isValid, errors, warnings, validCount, markedForExport };
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Exports customization options to Amazon via Cloud Function
 */
function lukoExportCustomizationToAmazon() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName('Customization');

  if (!customSheet) {
    lukoShowMessage('Error', 'Customization sheet not found.');
    return;
  }

  // First validate
  const validation = lukoValidateCustomization();
  if (!validation.isValid) {
    const proceed = Browser.msgBox(
      'Validation Errors Found',
      `Found ${validation.errors.length} errors. Do you want to proceed anyway?`,
      Browser.Buttons.YES_NO
    );
    if (proceed !== 'yes') {
      return;
    }
  }

  const lastRow = customSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to export.');
    return;
  }

  const data = customSheet.getRange(4, 1, lastRow - 3, 58).getValues();
  const rowsToExport = [];
  const rowIndexes = [];

  data.forEach((row, index) => {
    if (row[0]) { // Export checkbox
      const customizationData = {
        asin: row[1],
        sku: row[2],
        enabled: row[3] === 'Yes',
        textCustomization: {
          field1: {
            enabled: row[4] === 'Yes',
            label: row[5],
            maxChars: parseInt(row[6]) || 0,
            placeholder: row[7],
            required: row[8] === 'Yes',
            price: parseFloat(row[9]) || 0
          },
          field2: {
            enabled: row[10] === 'Yes',
            label: row[11],
            maxChars: parseInt(row[12]) || 0,
            placeholder: row[13],
            required: row[14] === 'Yes',
            price: parseFloat(row[15]) || 0
          },
          field3: {
            enabled: row[16] === 'Yes',
            label: row[17],
            maxChars: parseInt(row[18]) || 0,
            placeholder: row[19],
            required: row[20] === 'Yes',
            price: parseFloat(row[21]) || 0
          }
        },
        surfaceCustomization: {
          enabled: row[22] === 'Yes',
          surfaces: [
            { name: row[23], enabled: row[24] === 'Yes', price: parseFloat(row[25]) || 0 },
            { name: row[26], enabled: row[27] === 'Yes', price: parseFloat(row[28]) || 0 },
            { name: row[29], enabled: row[30] === 'Yes', price: parseFloat(row[31]) || 0 },
            { name: row[32], enabled: row[33] === 'Yes', price: parseFloat(row[34]) || 0 },
            { name: row[35], enabled: row[36] === 'Yes', price: parseFloat(row[37]) || 0 }
          ].filter(s => s.enabled)
        },
        imageUpload: {
          enabled: row[38] === 'Yes',
          minWidth: parseInt(row[39]) || 0,
          minHeight: parseInt(row[40]) || 0,
          maxFileSize: parseFloat(row[41]) || 0,
          allowedFormats: row[42],
          instructions: row[43],
          price: parseFloat(row[44]) || 0
        },
        pricing: {
          customizationFee: parseFloat(row[45]) || 0,
          maxPrice: parseFloat(row[46]) || 0,
          processingTime: parseInt(row[47]) || 0
        },
        giftOptions: {
          allowGiftMessage: row[48] === 'Yes',
          giftMessageMaxChars: parseInt(row[49]) || 0,
          allowGiftWrap: row[50] === 'Yes',
          giftWrapPrice: parseFloat(row[51]) || 0
        },
        previewImageUrl: row[52],
        instructions: row[53]
      };

      rowsToExport.push(customizationData);
      rowIndexes.push(index + 4);
    }
  });

  if (rowsToExport.length === 0) {
    lukoShowMessage('Info', 'No rows marked for export (check ☑️ Export column).');
    return;
  }

  // Get Cloud Function URL
  const configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    lukoShowMessage('Error', 'Config sheet not found.');
    return;
  }

  const cloudFunctionUrl = configSheet.getRange('B2').getValue();
  if (!cloudFunctionUrl) {
    lukoShowMessage('Error', 'Cloud Function URL not configured in Config sheet.');
    return;
  }

  // Update status to PENDING
  lukoUpdateCustomizationExportStatus(customSheet, rowIndexes, 'PENDING', 'Starting export...');

  try {
    lukoLogToSheet('Export', `Starting Customization export: ${rowsToExport.length} products`);

    // Call Cloud Function
    const response = UrlFetchApp.fetch(cloudFunctionUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'exportCustomization',
        data: rowsToExport
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      result.results.forEach((itemResult, idx) => {
        const rowIndex = rowIndexes[idx];
        if (itemResult.success) {
          lukoUpdateCustomizationExportStatus(customSheet, [rowIndex], 'DONE', '');
        } else {
          lukoUpdateCustomizationExportStatus(customSheet, [rowIndex], 'FAILED', itemResult.error || 'Unknown error');
        }
      });

      const successCount = result.results.filter(r => r.success).length;
      const failedCount = result.results.length - successCount;

      lukoLogToSheet('Export', `Customization export completed: ${successCount} succeeded, ${failedCount} failed`);
      lukoShowMessage('Export Complete', `Customization Export Results:\n\n✓ Successful: ${successCount}\n✗ Failed: ${failedCount}`);

    } else {
      lukoUpdateCustomizationExportStatus(customSheet, rowIndexes, 'FAILED', result.error || 'Export failed');
      lukoLogToSheet('Error', `Customization export failed: ${result.error}`);
      lukoShowMessage('Export Failed', `Error: ${result.error}`);
    }

  } catch (error) {
    lukoUpdateCustomizationExportStatus(customSheet, rowIndexes, 'FAILED', error.toString());
    lukoLogToSheet('Error', `Customization export error: ${error.toString()}`);
    lukoShowMessage('Export Error', `An error occurred during export:\n\n${error.toString()}`);
  }
}

/**
 * Helper: Update export status for customization rows
 */
function lukoUpdateCustomizationExportStatus(sheet, rowIndexes, status, errorMessage) {
  const now = new Date();

  rowIndexes.forEach(rowIndex => {
    sheet.getRange(rowIndex, 54).setValue(status); // Export Status
    sheet.getRange(rowIndex, 55).setValue(now); // Export DateTime
    if (errorMessage) {
      sheet.getRange(rowIndex, 58).setValue(errorMessage); // Error Messages
    } else {
      sheet.getRange(rowIndex, 58).setValue(''); // Clear error
    }
  });
}

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Apply pre-built customization template to selected products
 */
function lukoApplyCustomizationTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName('Customization');

  if (!customSheet) {
    lukoShowMessage('Error', 'Customization sheet not found.');
    return;
  }

  // Get available templates (from Templates section in the sheet, rows starting after main data)
  const templates = {
    'Text Engraving Only': {
      text1Enabled: 'Yes', text1Label: 'Engraving Text', text1MaxChars: 30, text1Placeholder: 'Enter text to engrave', text1Required: 'No', text1Price: 5.00,
      surfaceCustomEnabled: 'No',
      imageUploadEnabled: 'No',
      customizationFee: 0,
      processingTime: 3
    },
    'Full Personalization': {
      text1Enabled: 'Yes', text1Label: 'Name', text1MaxChars: 20, text1Placeholder: 'Your name', text1Required: 'Yes', text1Price: 0,
      text2Enabled: 'Yes', text2Label: 'Message', text2MaxChars: 50, text2Placeholder: 'Your message', text2Required: 'No', text2Price: 3.00,
      surfaceCustomEnabled: 'Yes',
      surface1Name: 'Matte Finish', surface1Enabled: 'Yes', surface1Price: 2.00,
      surface2Name: 'Glossy Finish', surface2Enabled: 'Yes', surface2Price: 2.00,
      surface3Name: 'Wood Grain', surface3Enabled: 'Yes', surface3Price: 5.00,
      imageUploadEnabled: 'Yes',
      imageMinWidth: 300, imageMinHeight: 300, imageMaxFileSize: 5,
      allowedFormats: 'JPG, PNG', imageUploadPrice: 10.00,
      customizationFee: 5.00,
      processingTime: 5
    },
    'Image Upload Only': {
      text1Enabled: 'No',
      surfaceCustomEnabled: 'No',
      imageUploadEnabled: 'Yes',
      imageMinWidth: 800, imageMinHeight: 800, imageMaxFileSize: 10,
      allowedFormats: 'JPG, PNG, PDF', imageInstructions: 'Upload high-resolution image',
      imageUploadPrice: 15.00,
      customizationFee: 0,
      processingTime: 7
    }
  };

  // Ask user to select template
  const templateChoice = Browser.inputBox(
    'Select Template',
    'Choose a template:\n1. Text Engraving Only\n2. Full Personalization\n3. Image Upload Only\n\nEnter number (1-3):',
    Browser.Buttons.OK_CANCEL
  );

  if (templateChoice === 'cancel') return;

  const templateNames = ['Text Engraving Only', 'Full Personalization', 'Image Upload Only'];
  const templateIndex = parseInt(templateChoice) - 1;

  if (templateIndex < 0 || templateIndex >= templateNames.length) {
    lukoShowMessage('Error', 'Invalid template number.');
    return;
  }

  const templateName = templateNames[templateIndex];
  const template = templates[templateName];

  // Get selected rows
  const selection = customSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to apply template to.');
    return;
  }

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  const confirm = Browser.msgBox(
    'Confirm Template Application',
    `Apply "${templateName}" template to ${numRows} products?\n\nThis will overwrite existing customization settings.`,
    Browser.Buttons.YES_NO
  );

  if (confirm !== 'yes') return;

  // Apply template to each row
  for (let i = 0; i < numRows; i++) {
    const rowIndex = startRow + i;

    // Enable customization
    customSheet.getRange(rowIndex, 4).setValue('Yes');

    // Text customization
    customSheet.getRange(rowIndex, 5).setValue(template.text1Enabled || 'No');
    if (template.text1Label) customSheet.getRange(rowIndex, 6).setValue(template.text1Label);
    if (template.text1MaxChars) customSheet.getRange(rowIndex, 7).setValue(template.text1MaxChars);
    if (template.text1Placeholder) customSheet.getRange(rowIndex, 8).setValue(template.text1Placeholder);
    if (template.text1Required) customSheet.getRange(rowIndex, 9).setValue(template.text1Required);
    if (template.text1Price !== undefined) customSheet.getRange(rowIndex, 10).setValue(template.text1Price);

    customSheet.getRange(rowIndex, 11).setValue(template.text2Enabled || 'No');
    if (template.text2Label) customSheet.getRange(rowIndex, 12).setValue(template.text2Label);
    if (template.text2MaxChars) customSheet.getRange(rowIndex, 13).setValue(template.text2MaxChars);
    if (template.text2Placeholder) customSheet.getRange(rowIndex, 14).setValue(template.text2Placeholder);
    if (template.text2Required) customSheet.getRange(rowIndex, 15).setValue(template.text2Required);
    if (template.text2Price !== undefined) customSheet.getRange(rowIndex, 16).setValue(template.text2Price);

    customSheet.getRange(rowIndex, 17).setValue('No'); // text3 always disabled in templates

    // Surface customization
    customSheet.getRange(rowIndex, 23).setValue(template.surfaceCustomEnabled || 'No');
    if (template.surface1Name) {
      customSheet.getRange(rowIndex, 24).setValue(template.surface1Name);
      customSheet.getRange(rowIndex, 25).setValue(template.surface1Enabled || 'No');
      if (template.surface1Price !== undefined) customSheet.getRange(rowIndex, 26).setValue(template.surface1Price);
    }
    if (template.surface2Name) {
      customSheet.getRange(rowIndex, 27).setValue(template.surface2Name);
      customSheet.getRange(rowIndex, 28).setValue(template.surface2Enabled || 'No');
      if (template.surface2Price !== undefined) customSheet.getRange(rowIndex, 29).setValue(template.surface2Price);
    }
    if (template.surface3Name) {
      customSheet.getRange(rowIndex, 30).setValue(template.surface3Name);
      customSheet.getRange(rowIndex, 31).setValue(template.surface3Enabled || 'No');
      if (template.surface3Price !== undefined) customSheet.getRange(rowIndex, 32).setValue(template.surface3Price);
    }

    // Image upload
    customSheet.getRange(rowIndex, 39).setValue(template.imageUploadEnabled || 'No');
    if (template.imageMinWidth) customSheet.getRange(rowIndex, 40).setValue(template.imageMinWidth);
    if (template.imageMinHeight) customSheet.getRange(rowIndex, 41).setValue(template.imageMinHeight);
    if (template.imageMaxFileSize) customSheet.getRange(rowIndex, 42).setValue(template.imageMaxFileSize);
    if (template.allowedFormats) customSheet.getRange(rowIndex, 43).setValue(template.allowedFormats);
    if (template.imageInstructions) customSheet.getRange(rowIndex, 44).setValue(template.imageInstructions);
    if (template.imageUploadPrice !== undefined) customSheet.getRange(rowIndex, 45).setValue(template.imageUploadPrice);

    // Pricing
    if (template.customizationFee !== undefined) customSheet.getRange(rowIndex, 46).setValue(template.customizationFee);
    if (template.processingTime) customSheet.getRange(rowIndex, 48).setValue(template.processingTime);

    // Update last modified
    const now = new Date();
    const user = Session.getActiveUser().getEmail();
    customSheet.getRange(rowIndex, 56).setValue(now);
    customSheet.getRange(rowIndex, 57).setValue(user);
  }

  lukoLogToSheet('Template', `Applied "${templateName}" template to ${numRows} products`);
  lukoShowMessage('Success', `Applied "${templateName}" template to ${numRows} products!`);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk enable customization for selected products
 */
function lukoBulkEnableCustomization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName('Customization');

  if (!customSheet) {
    lukoShowMessage('Error', 'Customization sheet not found.');
    return;
  }

  const selection = customSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to enable customization for.');
    return;
  }

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  customSheet.getRange(startRow, 4, numRows, 1).setValue('Yes');

  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  customSheet.getRange(startRow, 56, numRows, 1).setValue(now);
  customSheet.getRange(startRow, 57, numRows, 1).setValue(user);

  lukoLogToSheet('Bulk Update', `Enabled customization for ${numRows} products`);
  lukoShowMessage('Success', `Enabled customization for ${numRows} products`);
}

/**
 * Bulk disable customization for selected products
 */
function lukoBulkDisableCustomization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName('Customization');

  if (!customSheet) {
    lukoShowMessage('Error', 'Customization sheet not found.');
    return;
  }

  const selection = customSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to disable customization for.');
    return;
  }

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  const confirm = Browser.msgBox(
    'Confirm Disable',
    `This will disable customization for ${numRows} products. Continue?`,
    Browser.Buttons.YES_NO
  );

  if (confirm !== 'yes') return;

  customSheet.getRange(startRow, 4, numRows, 1).setValue('No');

  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  customSheet.getRange(startRow, 56, numRows, 1).setValue(now);
  customSheet.getRange(startRow, 57, numRows, 1).setValue(user);

  lukoLogToSheet('Bulk Update', `Disabled customization for ${numRows} products`);
  lukoShowMessage('Success', `Disabled customization for ${numRows} products`);
}

// ============================================================================
// PRICING CALCULATIONS
// ============================================================================

/**
 * Calculate total customization price for a product
 * Shows pricing breakdown based on enabled options
 */
function lukoCalculatePricing() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customSheet = ss.getSheetByName('Customization');

  if (!customSheet) {
    lukoShowMessage('Error', 'Customization sheet not found.');
    return;
  }

  const selection = customSheet.getActiveRange();
  if (!selection || selection.getNumRows() !== 1) {
    lukoShowMessage('Info', 'Please select a single row to calculate pricing for.');
    return;
  }

  const rowIndex = selection.getRow();
  if (rowIndex < 4) {
    lukoShowMessage('Error', 'Please select a data row (not header).');
    return;
  }

  const row = customSheet.getRange(rowIndex, 1, 1, 58).getValues()[0];

  const asin = row[1];
  const sku = row[2];
  const enabled = row[3] === 'Yes';

  if (!enabled) {
    lukoShowMessage('Info', `Customization is disabled for ${asin}`);
    return;
  }

  let breakdown = `Pricing Breakdown for ${asin} (${sku}):\n\n`;
  let totalMin = 0;
  let totalMax = 0;

  // Base customization fee
  const baseFee = parseFloat(row[45]) || 0;
  if (baseFee > 0) {
    breakdown += `Base Customization Fee: $${baseFee.toFixed(2)}\n`;
    totalMin += baseFee;
    totalMax += baseFee;
  }

  // Text customization prices
  const text1Price = (row[4] === 'Yes') ? (parseFloat(row[9]) || 0) : 0;
  const text2Price = (row[10] === 'Yes') ? (parseFloat(row[15]) || 0) : 0;
  const text3Price = (row[16] === 'Yes') ? (parseFloat(row[21]) || 0) : 0;

  if (text1Price > 0) {
    breakdown += `Text Field 1 (${row[5]}): $${text1Price.toFixed(2)}\n`;
    if (row[8] === 'Yes') totalMin += text1Price; // Required
    totalMax += text1Price;
  }
  if (text2Price > 0) {
    breakdown += `Text Field 2 (${row[11]}): $${text2Price.toFixed(2)}\n`;
    if (row[14] === 'Yes') totalMin += text2Price; // Required
    totalMax += text2Price;
  }
  if (text3Price > 0) {
    breakdown += `Text Field 3 (${row[17]}): $${text3Price.toFixed(2)}\n`;
    if (row[20] === 'Yes') totalMin += text3Price; // Required
    totalMax += text3Price;
  }

  // Surface customization
  if (row[22] === 'Yes') {
    const surfacePrices = [];
    for (let i = 0; i < 5; i++) {
      const baseCol = 24 + (i * 3);
      if (row[baseCol] === 'Yes') { // Surface enabled
        const price = parseFloat(row[baseCol + 1]) || 0;
        if (price > 0) {
          breakdown += `Surface: ${row[baseCol - 1]}: $${price.toFixed(2)}\n`;
          surfacePrices.push(price);
        }
      }
    }
    if (surfacePrices.length > 0) {
      totalMin += Math.min(...surfacePrices); // Customer must pick one
      totalMax += Math.max(...surfacePrices);
    }
  }

  // Image upload
  const imagePrice = (row[38] === 'Yes') ? (parseFloat(row[44]) || 0) : 0;
  if (imagePrice > 0) {
    breakdown += `Image Upload: $${imagePrice.toFixed(2)}\n`;
    totalMax += imagePrice; // Optional
  }

  // Gift wrap
  const giftWrapPrice = (row[50] === 'Yes') ? (parseFloat(row[51]) || 0) : 0;
  if (giftWrapPrice > 0) {
    breakdown += `Gift Wrap (optional): $${giftWrapPrice.toFixed(2)}\n`;
    totalMax += giftWrapPrice;
  }

  breakdown += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  breakdown += `Minimum Price: $${totalMin.toFixed(2)} (required options only)\n`;
  breakdown += `Maximum Price: $${totalMax.toFixed(2)} (all options selected)\n`;

  const maxLimit = parseFloat(row[46]) || 0;
  if (maxLimit > 0 && totalMax > maxLimit) {
    breakdown += `\n⚠️ WARNING: Max price ($${totalMax.toFixed(2)}) exceeds limit ($${maxLimit.toFixed(2)})`;
  }

  const processingDays = parseInt(row[47]) || 0;
  if (processingDays > 0) {
    breakdown += `\n\nProcessing Time: ${processingDays} days`;
  }

  lukoShowMessage('Customization Pricing', breakdown);
}
