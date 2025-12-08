/**
 * GPSR Manager - LUKO Amazon Content Manager
 *
 * Handles GPSR (General Product Safety Regulation) compliance data
 * for Amazon products (effective December 13, 2024 - EU regulation).
 *
 * Functions:
 * - Data validation for GPSR fields
 * - Export GPSR compliance data to Amazon via Cloud Function
 * - Generate GPSR compliance reports
 * - Bulk operations for GPSR data
 *
 * @author LUKO-ACM
 * @version 1.0.0
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates GPSR compliance data before export
 * Checks all required fields, formats, and business rules
 *
 * @returns {Object} Validation result with {isValid, errors, warnings}
 */
function lukoValidateGpsrData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gpsrSheet = ss.getSheetByName('GPSR Compliance');

  if (!gpsrSheet) {
    lukoShowMessage('Error', 'GPSR Compliance sheet not found. Please generate it first.');
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  const lastRow = gpsrSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to validate in GPSR Compliance sheet.');
    return { isValid: true, errors: [], warnings: [] };
  }

  const data = gpsrSheet.getRange(4, 1, lastRow - 3, 27).getValues();
  const errors = [];
  const warnings = [];
  let validCount = 0;

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      exportCheckbox, asin, sku, gpsrCompliant,
      mfgName, mfgAddress, mfgEmail, mfgPhone,
      impName, impAddress, impEmail, impPhone,
      respName, respAddress, respEmail, respPhone,
      safetyLabelUrl, safetyPdfUrl, ceCertUrl,
      testReportsUrl, riskAssessmentUrl, declarationUrl,
      exportStatus, exportDateTime, lastModified, modifiedBy, errorMessages
    ] = row;

    // Skip rows not marked for export
    if (!exportCheckbox) {
      return;
    }

    const rowErrors = [];
    const rowWarnings = [];

    // Required field: ASIN
    if (!asin || asin.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: ASIN is required`);
    } else if (!/^B[0-9A-Z]{9}$/.test(asin.toString().trim())) {
      rowErrors.push(`Row ${rowNum}: Invalid ASIN format (must be B followed by 9 alphanumeric characters)`);
    }

    // Required field: SKU
    if (!sku || sku.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: SKU is required`);
    }

    // Required field: GPSR Compliant status
    if (!gpsrCompliant || !['Yes', 'No', 'Pending'].includes(gpsrCompliant)) {
      rowErrors.push(`Row ${rowNum}: GPSR Compliant must be 'Yes', 'No', or 'Pending'`);
    }

    // If marked as compliant, ensure we have responsible party info
    if (gpsrCompliant === 'Yes') {
      // At least one of: Manufacturer, Importer, or Responsible Person must be filled
      const hasMfg = mfgName && mfgAddress;
      const hasImp = impName && impAddress;
      const hasResp = respName && respAddress;

      if (!hasMfg && !hasImp && !hasResp) {
        rowErrors.push(`Row ${rowNum}: At least one responsible party (Manufacturer, Importer, or Responsible Person) must have Name and Address`);
      }

      // Validate email formats if provided
      if (mfgEmail && !lukoIsValidEmail(mfgEmail)) {
        rowErrors.push(`Row ${rowNum}: Invalid Manufacturer Email format`);
      }
      if (impEmail && !lukoIsValidEmail(impEmail)) {
        rowErrors.push(`Row ${rowNum}: Invalid Importer Email format`);
      }
      if (respEmail && !lukoIsValidEmail(respEmail)) {
        rowErrors.push(`Row ${rowNum}: Invalid Responsible Person Email format`);
      }

      // Validate URLs if provided
      const urls = [
        { url: safetyLabelUrl, name: 'Product Safety Label Image URL' },
        { url: safetyPdfUrl, name: 'Safety Instructions PDF URL' },
        { url: ceCertUrl, name: 'CE/Conformity Certificate PDF URL' },
        { url: testReportsUrl, name: 'Test Reports PDF URL' },
        { url: riskAssessmentUrl, name: 'Risk Assessment PDF URL' },
        { url: declarationUrl, name: 'Declaration of Conformity PDF URL' }
      ];

      urls.forEach(({ url, name }) => {
        if (url && !lukoIsValidUrl(url)) {
          rowErrors.push(`Row ${rowNum}: Invalid ${name}`);
        }
      });

      // Warning if no safety documentation provided
      const hasDocs = safetyLabelUrl || safetyPdfUrl || ceCertUrl || testReportsUrl || riskAssessmentUrl || declarationUrl;
      if (!hasDocs) {
        rowWarnings.push(`Row ${rowNum}: No safety documentation URLs provided (recommended for GPSR compliance)`);
      }
    }

    // Warnings for incomplete data
    if (gpsrCompliant === 'Pending') {
      rowWarnings.push(`Row ${rowNum}: GPSR compliance status is 'Pending' - complete before export`);
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
  lukoLogToSheet('Validation', `GPSR data validated: ${validCount}/${markedForExport} rows valid, ${errors.length} errors, ${warnings.length} warnings`);

  // Show result to user
  let message = `GPSR Validation Complete:\n\n`;
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

/**
 * Helper: Validate email format
 */
function lukoIsValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toString().trim());
}

/**
 * Helper: Validate URL format
 */
function lukoIsValidUrl(url) {
  try {
    const urlStr = url.toString().trim();
    return urlStr.startsWith('http://') || urlStr.startsWith('https://');
  } catch (e) {
    return false;
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Exports GPSR compliance data to Amazon via Cloud Function
 * Sends data to Amazon SP-API for product compliance updates
 */
function lukoExportGpsrToAmazon() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gpsrSheet = ss.getSheetByName('GPSR Compliance');

  if (!gpsrSheet) {
    lukoShowMessage('Error', 'GPSR Compliance sheet not found.');
    return;
  }

  // First validate
  const validation = lukoValidateGpsrData();
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

  const lastRow = gpsrSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to export.');
    return;
  }

  const data = gpsrSheet.getRange(4, 1, lastRow - 3, 27).getValues();
  const rowsToExport = [];
  const rowIndexes = [];

  data.forEach((row, index) => {
    if (row[0]) { // Export checkbox
      rowsToExport.push({
        asin: row[1],
        sku: row[2],
        gpsrCompliant: row[3],
        manufacturer: {
          name: row[4],
          address: row[5],
          email: row[6],
          phone: row[7]
        },
        importer: {
          name: row[8],
          address: row[9],
          email: row[10],
          phone: row[11]
        },
        responsiblePerson: {
          name: row[12],
          address: row[13],
          email: row[14],
          phone: row[15]
        },
        documents: {
          safetyLabelUrl: row[16],
          safetyInstructionsUrl: row[17],
          ceCertificateUrl: row[18],
          testReportsUrl: row[19],
          riskAssessmentUrl: row[20],
          declarationOfConformityUrl: row[21]
        }
      });
      rowIndexes.push(index + 4);
    }
  });

  if (rowsToExport.length === 0) {
    lukoShowMessage('Info', 'No rows marked for export (check ☑️ Export column).');
    return;
  }

  // Get Cloud Function URL from Config
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
  lukoUpdateExportStatus(gpsrSheet, rowIndexes, 'PENDING', 'Starting export...');

  try {
    lukoLogToSheet('Export', `Starting GPSR export: ${rowsToExport.length} products`);

    // Call Cloud Function
    const response = UrlFetchApp.fetch(cloudFunctionUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'exportGpsr',
        data: rowsToExport
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      // Update individual row statuses based on result
      result.results.forEach((itemResult, idx) => {
        const rowIndex = rowIndexes[idx];
        if (itemResult.success) {
          lukoUpdateExportStatus(gpsrSheet, [rowIndex], 'DONE', '');
        } else {
          lukoUpdateExportStatus(gpsrSheet, [rowIndex], 'FAILED', itemResult.error || 'Unknown error');
        }
      });

      const successCount = result.results.filter(r => r.success).length;
      const failedCount = result.results.length - successCount;

      lukoLogToSheet('Export', `GPSR export completed: ${successCount} succeeded, ${failedCount} failed`);
      lukoShowMessage('Export Complete', `GPSR Export Results:\n\n✓ Successful: ${successCount}\n✗ Failed: ${failedCount}`);

    } else {
      // All failed
      lukoUpdateExportStatus(gpsrSheet, rowIndexes, 'FAILED', result.error || 'Export failed');
      lukoLogToSheet('Error', `GPSR export failed: ${result.error}`);
      lukoShowMessage('Export Failed', `Error: ${result.error}`);
    }

  } catch (error) {
    lukoUpdateExportStatus(gpsrSheet, rowIndexes, 'FAILED', error.toString());
    lukoLogToSheet('Error', `GPSR export error: ${error.toString()}`);
    lukoShowMessage('Export Error', `An error occurred during export:\n\n${error.toString()}`);
  }
}

/**
 * Helper: Update export status for rows
 */
function lukoUpdateExportStatus(sheet, rowIndexes, status, errorMessage) {
  const now = new Date();

  rowIndexes.forEach(rowIndex => {
    sheet.getRange(rowIndex, 23).setValue(status); // Export Status
    sheet.getRange(rowIndex, 24).setValue(now); // Export DateTime
    if (errorMessage) {
      sheet.getRange(rowIndex, 27).setValue(errorMessage); // Error Messages
    } else {
      sheet.getRange(rowIndex, 27).setValue(''); // Clear error
    }
  });
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

/**
 * Generates GPSR compliance report
 * Creates summary of compliance status across all products
 */
function lukoGenerateGpsrReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gpsrSheet = ss.getSheetByName('GPSR Compliance');

  if (!gpsrSheet) {
    lukoShowMessage('Error', 'GPSR Compliance sheet not found.');
    return;
  }

  const lastRow = gpsrSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data available for report.');
    return;
  }

  const data = gpsrSheet.getRange(4, 1, lastRow - 3, 27).getValues();

  // Count statistics
  let totalProducts = 0;
  let compliantCount = 0;
  let nonCompliantCount = 0;
  let pendingCount = 0;
  let withDocumentation = 0;
  let withManufacturer = 0;
  let withImporter = 0;
  let withResponsiblePerson = 0;

  const productsNeedingAttention = [];

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      exportCheckbox, asin, sku, gpsrCompliant,
      mfgName, mfgAddress, mfgEmail, mfgPhone,
      impName, impAddress, impEmail, impPhone,
      respName, respAddress, respEmail, respPhone,
      safetyLabelUrl, safetyPdfUrl, ceCertUrl,
      testReportsUrl, riskAssessmentUrl, declarationUrl
    ] = row;

    // Skip empty rows
    if (!asin && !sku) return;

    totalProducts++;

    // Count compliance status
    if (gpsrCompliant === 'Yes') compliantCount++;
    else if (gpsrCompliant === 'No') nonCompliantCount++;
    else if (gpsrCompliant === 'Pending') pendingCount++;

    // Count documentation
    const hasDocs = safetyLabelUrl || safetyPdfUrl || ceCertUrl || testReportsUrl || riskAssessmentUrl || declarationUrl;
    if (hasDocs) withDocumentation++;

    // Count responsible parties
    if (mfgName && mfgAddress) withManufacturer++;
    if (impName && impAddress) withImporter++;
    if (respName && respAddress) withResponsiblePerson++;

    // Flag products needing attention
    if (gpsrCompliant === 'Yes' && !hasDocs) {
      productsNeedingAttention.push({
        row: rowNum,
        asin: asin,
        sku: sku,
        issue: 'Marked compliant but no documentation URLs'
      });
    }

    if (gpsrCompliant === 'Yes' && !mfgName && !impName && !respName) {
      productsNeedingAttention.push({
        row: rowNum,
        asin: asin,
        sku: sku,
        issue: 'Marked compliant but no responsible party info'
      });
    }

    if (gpsrCompliant === 'Pending') {
      productsNeedingAttention.push({
        row: rowNum,
        asin: asin,
        sku: sku,
        issue: 'Compliance status is Pending'
      });
    }

    if (gpsrCompliant === 'No') {
      productsNeedingAttention.push({
        row: rowNum,
        asin: asin,
        sku: sku,
        issue: 'Marked as Non-Compliant'
      });
    }
  });

  // Create report sheet or update existing
  let reportSheet = ss.getSheetByName('GPSR Compliance Report');
  if (!reportSheet) {
    reportSheet = ss.insertSheet('GPSR Compliance Report');
  } else {
    reportSheet.clear();
  }

  // Build report
  const reportData = [];
  const now = new Date();

  // Header
  reportData.push(['GPSR COMPLIANCE REPORT']);
  reportData.push([`Generated: ${now.toLocaleString()}`]);
  reportData.push(['']);

  // Summary statistics
  reportData.push(['SUMMARY STATISTICS']);
  reportData.push(['Total Products', totalProducts]);
  reportData.push(['Compliant (Yes)', compliantCount, `${((compliantCount / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['Non-Compliant (No)', nonCompliantCount, `${((nonCompliantCount / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['Pending', pendingCount, `${((pendingCount / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['']);

  // Documentation statistics
  reportData.push(['DOCUMENTATION COVERAGE']);
  reportData.push(['Products with Documentation', withDocumentation, `${((withDocumentation / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['']);

  // Responsible parties statistics
  reportData.push(['RESPONSIBLE PARTIES']);
  reportData.push(['Products with Manufacturer Info', withManufacturer, `${((withManufacturer / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['Products with Importer Info', withImporter, `${((withImporter / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['Products with Responsible Person Info', withResponsiblePerson, `${((withResponsiblePerson / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['']);

  // Products needing attention
  reportData.push(['PRODUCTS NEEDING ATTENTION', `(${productsNeedingAttention.length} total)`]);
  reportData.push(['Row', 'ASIN', 'SKU', 'Issue']);

  productsNeedingAttention.slice(0, 100).forEach(item => {
    reportData.push([item.row, item.asin, item.sku, item.issue]);
  });

  // Write to sheet
  reportSheet.getRange(1, 1, reportData.length, 4).setValues(reportData);

  // Format report
  reportSheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  reportSheet.getRange(4, 1).setFontWeight('bold');
  reportSheet.getRange(10, 1).setFontWeight('bold');
  reportSheet.getRange(13, 1).setFontWeight('bold');
  reportSheet.getRange(18, 1).setFontWeight('bold');
  reportSheet.getRange(19, 1, 1, 4).setFontWeight('bold').setBackground('#f3f3f3');

  reportSheet.setColumnWidth(1, 80);
  reportSheet.setColumnWidth(2, 150);
  reportSheet.setColumnWidth(3, 150);
  reportSheet.setColumnWidth(4, 400);

  // Activate report sheet
  ss.setActiveSheet(reportSheet);

  lukoLogToSheet('Report', 'GPSR compliance report generated');
  lukoShowMessage('Report Generated', `GPSR Compliance Report created successfully!\n\nTotal products: ${totalProducts}\nCompliant: ${compliantCount}\nNeeds attention: ${productsNeedingAttention.length}`);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk update GPSR compliance status
 * Allows setting compliance status for multiple products at once
 */
function lukoBulkUpdateGpsrStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gpsrSheet = ss.getSheetByName('GPSR Compliance');

  if (!gpsrSheet) {
    lukoShowMessage('Error', 'GPSR Compliance sheet not found.');
    return;
  }

  // Get selected range
  const selection = gpsrSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to update.');
    return;
  }

  // Ask for new status
  const newStatus = Browser.inputBox(
    'Bulk Update GPSR Status',
    'Enter new compliance status (Yes/No/Pending):',
    Browser.Buttons.OK_CANCEL
  );

  if (newStatus === 'cancel') return;

  if (!['Yes', 'No', 'Pending'].includes(newStatus)) {
    lukoShowMessage('Error', 'Invalid status. Must be: Yes, No, or Pending');
    return;
  }

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  // Update status column (column 4)
  gpsrSheet.getRange(startRow, 4, numRows, 1).setValue(newStatus);

  // Update last modified
  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  gpsrSheet.getRange(startRow, 25, numRows, 1).setValue(now); // Last Modified
  gpsrSheet.getRange(startRow, 26, numRows, 1).setValue(user); // Modified By

  lukoLogToSheet('Bulk Update', `Updated GPSR status to '${newStatus}' for ${numRows} products`);
  lukoShowMessage('Success', `Updated ${numRows} products to '${newStatus}'`);
}

/**
 * Copy manufacturer info to all responsible party fields
 * Useful when manufacturer is also the importer and responsible person
 */
function lukoCopyManufacturerToAllParties() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gpsrSheet = ss.getSheetByName('GPSR Compliance');

  if (!gpsrSheet) {
    lukoShowMessage('Error', 'GPSR Compliance sheet not found.');
    return;
  }

  const selection = gpsrSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to update.');
    return;
  }

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  const confirm = Browser.msgBox(
    'Confirm Bulk Copy',
    `This will copy Manufacturer info to Importer and Responsible Person fields for ${numRows} products. Continue?`,
    Browser.Buttons.YES_NO
  );

  if (confirm !== 'yes') return;

  // Get manufacturer data (columns 5-8)
  const mfgData = gpsrSheet.getRange(startRow, 5, numRows, 4).getValues();

  // Copy to Importer (columns 9-12)
  gpsrSheet.getRange(startRow, 9, numRows, 4).setValues(mfgData);

  // Copy to Responsible Person (columns 13-16)
  gpsrSheet.getRange(startRow, 13, numRows, 4).setValues(mfgData);

  // Update last modified
  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  gpsrSheet.getRange(startRow, 25, numRows, 1).setValue(now);
  gpsrSheet.getRange(startRow, 26, numRows, 1).setValue(user);

  lukoLogToSheet('Bulk Update', `Copied manufacturer info to all parties for ${numRows} products`);
  lukoShowMessage('Success', `Copied manufacturer info to all responsible parties for ${numRows} products`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper: Show message to user
 */
function lukoShowMessage(title, message) {
  SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Helper: Log to ErrorLog sheet
 */
function lukoLogToSheet(level, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('ErrorLog');

    if (!logSheet) {
      logSheet = ss.insertSheet('ErrorLog');
      logSheet.appendRow(['Timestamp', 'Level', 'Message', 'User']);
    }

    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail();
    logSheet.appendRow([timestamp, level, message, user]);

  } catch (e) {
    console.error('Failed to log:', e);
  }
}
