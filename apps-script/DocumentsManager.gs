/**
 * Documents Manager - LUKO Amazon Content Manager
 *
 * Handles product documentation management for Amazon listings.
 * Supports user manuals, warranties, technical specs, compliance docs, etc.
 *
 * Functions:
 * - Document validation and format checking
 * - Export documents to Amazon via Cloud Function
 * - Bulk document upload operations
 * - Document organization and categorization
 *
 * @author LUKO-ACM
 * @version 1.0.0
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates document data before export
 * Checks required fields, file formats, URLs, and business rules
 *
 * @returns {Object} Validation result with {isValid, errors, warnings}
 */
function lukoValidateDocuments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docsSheet = ss.getSheetByName('Documents');

  if (!docsSheet) {
    lukoShowMessage('Error', 'Documents sheet not found. Please generate it first.');
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  const lastRow = docsSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to validate in Documents sheet.');
    return { isValid: true, errors: [], warnings: [] };
  }

  const data = docsSheet.getRange(4, 1, lastRow - 3, 17).getValues();
  const errors = [];
  const warnings = [];
  let validCount = 0;

  // Valid document types
  const validDocTypes = [
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
  ];

  // Valid languages (ISO 639-1 codes + common names)
  const validLanguages = [
    'English', 'German', 'French', 'Italian', 'Spanish', 'Dutch', 'Polish',
    'Portuguese', 'Swedish', 'Danish', 'Finnish', 'Czech', 'Romanian',
    'en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'pt', 'sv', 'da', 'fi', 'cs', 'ro'
  ];

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      exportCheckbox, asin, sku, docType, language,
      docTitle, fileName, pdfUrl, description,
      visibleToCustomer, uploadDate, fileSize,
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
      rowErrors.push(`Row ${rowNum}: Invalid ASIN format`);
    }

    // Required field: SKU
    if (!sku || sku.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: SKU is required`);
    }

    // Required field: Document Type
    if (!docType || docType.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: Document Type is required`);
    } else if (!validDocTypes.includes(docType)) {
      rowErrors.push(`Row ${rowNum}: Invalid Document Type (must be one of the predefined types)`);
    }

    // Required field: Language
    if (!language || language.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: Language is required`);
    } else if (!validLanguages.includes(language)) {
      rowWarnings.push(`Row ${rowNum}: Uncommon language code '${language}' - verify it's correct`);
    }

    // Required field: Document Title
    if (!docTitle || docTitle.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: Document Title is required`);
    } else if (docTitle.toString().length > 200) {
      rowWarnings.push(`Row ${rowNum}: Document Title is very long (${docTitle.toString().length} characters) - consider shortening`);
    }

    // Required field: File Name
    if (!fileName || fileName.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: File Name is required`);
    } else {
      const fn = fileName.toString().trim().toLowerCase();
      if (!fn.endsWith('.pdf')) {
        rowErrors.push(`Row ${rowNum}: File Name must end with .pdf`);
      }
      // Check for invalid characters in filename
      if (/[<>:"|?*]/.test(fileName)) {
        rowErrors.push(`Row ${rowNum}: File Name contains invalid characters`);
      }
    }

    // Required field: PDF URL
    if (!pdfUrl || pdfUrl.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: PDF URL is required`);
    } else {
      const url = pdfUrl.toString().trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        rowErrors.push(`Row ${rowNum}: PDF URL must start with http:// or https://`);
      }
      // Recommend HTTPS for security
      if (url.startsWith('http://') && !url.startsWith('https://')) {
        rowWarnings.push(`Row ${rowNum}: PDF URL uses HTTP instead of HTTPS (not secure)`);
      }
      // Check if URL ends with .pdf
      if (!url.toLowerCase().endsWith('.pdf')) {
        rowWarnings.push(`Row ${rowNum}: PDF URL doesn't end with .pdf - verify it's a direct PDF link`);
      }
    }

    // Optional but recommended: Description
    if (!description || description.toString().trim() === '') {
      rowWarnings.push(`Row ${rowNum}: Description is empty (recommended for better user experience)`);
    } else if (description.toString().length > 500) {
      rowWarnings.push(`Row ${rowNum}: Description is very long (${description.toString().length} characters)`);
    }

    // Visible to Customer validation
    if (visibleToCustomer !== '' && visibleToCustomer !== 'Yes' && visibleToCustomer !== 'No') {
      rowWarnings.push(`Row ${rowNum}: 'Visible to Customer' should be 'Yes' or 'No' (or empty for default)`);
    }

    // File Size validation
    if (fileSize && fileSize !== '') {
      const size = parseFloat(fileSize);
      if (isNaN(size)) {
        rowWarnings.push(`Row ${rowNum}: File Size must be a number (in MB)`);
      } else if (size > 50) {
        rowWarnings.push(`Row ${rowNum}: File Size is ${size} MB (Amazon may have limits on large files)`);
      }
    }

    // Check for duplicate documents for same ASIN + DocType + Language
    const duplicates = data.filter((r, i) =>
      i !== index &&
      r[0] && // Also marked for export
      r[1] === asin &&
      r[3] === docType &&
      r[4] === language
    );
    if (duplicates.length > 0) {
      rowWarnings.push(`Row ${rowNum}: Duplicate document (same ASIN + Document Type + Language) - only one will be kept`);
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
  lukoLogToSheet('Validation', `Documents validated: ${validCount}/${markedForExport} rows valid, ${errors.length} errors, ${warnings.length} warnings`);

  // Show result to user
  let message = `Documents Validation Complete:\n\n`;
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
 * Exports documents to Amazon via Cloud Function
 * Sends document metadata to Amazon SP-API
 */
function lukoExportDocumentsToAmazon() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docsSheet = ss.getSheetByName('Documents');

  if (!docsSheet) {
    lukoShowMessage('Error', 'Documents sheet not found.');
    return;
  }

  // First validate
  const validation = lukoValidateDocuments();
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

  const lastRow = docsSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to export.');
    return;
  }

  const data = docsSheet.getRange(4, 1, lastRow - 3, 17).getValues();
  const rowsToExport = [];
  const rowIndexes = [];

  data.forEach((row, index) => {
    if (row[0]) { // Export checkbox
      rowsToExport.push({
        asin: row[1],
        sku: row[2],
        documentType: row[3],
        language: row[4],
        title: row[5],
        fileName: row[6],
        pdfUrl: row[7],
        description: row[8],
        visibleToCustomer: row[9] === 'Yes',
        uploadDate: row[10],
        fileSize: row[11]
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
  lukoUpdateDocumentExportStatus(docsSheet, rowIndexes, 'PENDING', 'Starting export...');

  try {
    lukoLogToSheet('Export', `Starting Documents export: ${rowsToExport.length} documents`);

    // Call Cloud Function
    const response = UrlFetchApp.fetch(cloudFunctionUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'exportDocuments',
        data: rowsToExport
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      // Update individual row statuses
      result.results.forEach((itemResult, idx) => {
        const rowIndex = rowIndexes[idx];
        if (itemResult.success) {
          lukoUpdateDocumentExportStatus(docsSheet, [rowIndex], 'DONE', '');
          // Update upload date if successful
          docsSheet.getRange(rowIndex, 11).setValue(new Date());
        } else {
          lukoUpdateDocumentExportStatus(docsSheet, [rowIndex], 'FAILED', itemResult.error || 'Unknown error');
        }
      });

      const successCount = result.results.filter(r => r.success).length;
      const failedCount = result.results.length - successCount;

      lukoLogToSheet('Export', `Documents export completed: ${successCount} succeeded, ${failedCount} failed`);
      lukoShowMessage('Export Complete', `Documents Export Results:\n\n✓ Successful: ${successCount}\n✗ Failed: ${failedCount}`);

    } else {
      // All failed
      lukoUpdateDocumentExportStatus(docsSheet, rowIndexes, 'FAILED', result.error || 'Export failed');
      lukoLogToSheet('Error', `Documents export failed: ${result.error}`);
      lukoShowMessage('Export Failed', `Error: ${result.error}`);
    }

  } catch (error) {
    lukoUpdateDocumentExportStatus(docsSheet, rowIndexes, 'FAILED', error.toString());
    lukoLogToSheet('Error', `Documents export error: ${error.toString()}`);
    lukoShowMessage('Export Error', `An error occurred during export:\n\n${error.toString()}`);
  }
}

/**
 * Helper: Update export status for document rows
 */
function lukoUpdateDocumentExportStatus(sheet, rowIndexes, status, errorMessage) {
  const now = new Date();

  rowIndexes.forEach(rowIndex => {
    sheet.getRange(rowIndex, 13).setValue(status); // Export Status
    sheet.getRange(rowIndex, 14).setValue(now); // Export DateTime
    if (errorMessage) {
      sheet.getRange(rowIndex, 17).setValue(errorMessage); // Error Messages
    } else {
      sheet.getRange(rowIndex, 17).setValue(''); // Clear error
    }
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk upload documents from a folder
 * Scans a Google Drive folder and creates document entries
 */
function lukoBulkUploadDocuments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docsSheet = ss.getSheetByName('Documents');

  if (!docsSheet) {
    lukoShowMessage('Error', 'Documents sheet not found.');
    return;
  }

  // Ask user for folder ID
  const folderUrl = Browser.inputBox(
    'Bulk Upload Documents',
    'Enter Google Drive folder URL or ID containing PDF files:',
    Browser.Buttons.OK_CANCEL
  );

  if (folderUrl === 'cancel') return;

  // Extract folder ID from URL or use as-is
  let folderId = folderUrl;
  if (folderUrl.includes('drive.google.com')) {
    const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) {
      folderId = match[1];
    }
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const pdfFiles = folder.getFilesByType(MimeType.PDF);

    const files = [];
    while (pdfFiles.hasNext()) {
      files.push(pdfFiles.next());
    }

    if (files.length === 0) {
      lukoShowMessage('Info', 'No PDF files found in the folder.');
      return;
    }

    // Ask for default values
    const defaultDocType = Browser.inputBox(
      'Default Document Type',
      'Enter default document type for all files:',
      Browser.Buttons.OK_CANCEL
    );

    if (defaultDocType === 'cancel') return;

    const defaultLanguage = Browser.inputBox(
      'Default Language',
      'Enter default language (e.g., English, German, en, de):',
      Browser.Buttons.OK_CANCEL
    );

    if (defaultLanguage === 'cancel') return;

    // Get last row to append
    const lastRow = docsSheet.getLastRow();
    const startRow = lastRow + 1;

    // Process each file
    const now = new Date();
    const user = Session.getActiveUser().getEmail();

    files.forEach((file, index) => {
      const rowData = [
        false, // Export checkbox (unchecked by default)
        '', // ASIN (to be filled manually)
        '', // SKU (to be filled manually)
        defaultDocType,
        defaultLanguage,
        file.getName().replace('.pdf', ''), // Document Title
        file.getName(), // File Name
        file.getUrl(), // PDF URL
        `Uploaded from Google Drive on ${now.toLocaleDateString()}`, // Description
        'Yes', // Visible to Customer
        now, // Upload Date
        (file.getSize() / (1024 * 1024)).toFixed(2), // File Size in MB
        '', // Export Status
        '', // Export DateTime
        now, // Last Modified
        user, // Modified By
        '' // Error Messages
      ];

      docsSheet.getRange(startRow + index, 1, 1, 17).setValues([rowData]);
    });

    lukoLogToSheet('Bulk Upload', `Bulk uploaded ${files.length} documents from folder ${folder.getName()}`);
    lukoShowMessage('Success', `Successfully added ${files.length} documents!\n\nPlease fill in ASIN and SKU columns for each document.`);

  } catch (error) {
    lukoLogToSheet('Error', `Bulk upload failed: ${error.toString()}`);
    lukoShowMessage('Error', `Failed to access folder:\n\n${error.toString()}`);
  }
}

/**
 * Organize documents by product
 * Groups and sorts documents by ASIN for better organization
 */
function lukoOrganizeDocumentsByProduct() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docsSheet = ss.getSheetByName('Documents');

  if (!docsSheet) {
    lukoShowMessage('Error', 'Documents sheet not found.');
    return;
  }

  const lastRow = docsSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to organize.');
    return;
  }

  const confirm = Browser.msgBox(
    'Organize Documents',
    'This will sort all documents by ASIN and Document Type. Continue?',
    Browser.Buttons.YES_NO
  );

  if (confirm !== 'yes') return;

  // Get data range (excluding headers)
  const dataRange = docsSheet.getRange(4, 1, lastRow - 3, 17);

  // Sort by ASIN (column 2), then by Document Type (column 4)
  dataRange.sort([
    { column: 2, ascending: true },  // ASIN
    { column: 4, ascending: true }   // Document Type
  ]);

  lukoLogToSheet('Organization', 'Documents organized by ASIN and Document Type');
  lukoShowMessage('Success', 'Documents have been organized by product (ASIN) and document type.');
}

/**
 * Generate document coverage report
 * Shows which products have which document types
 */
function lukoGenerateDocumentCoverageReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docsSheet = ss.getSheetByName('Documents');

  if (!docsSheet) {
    lukoShowMessage('Error', 'Documents sheet not found.');
    return;
  }

  const lastRow = docsSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data available for report.');
    return;
  }

  const data = docsSheet.getRange(4, 1, lastRow - 3, 17).getValues();

  // Group by ASIN
  const productDocs = {};

  data.forEach(row => {
    const asin = row[1];
    const sku = row[2];
    const docType = row[3];
    const language = row[4];

    if (!asin) return;

    if (!productDocs[asin]) {
      productDocs[asin] = {
        sku: sku,
        documents: []
      };
    }

    productDocs[asin].documents.push({
      type: docType,
      language: language
    });
  });

  // Create report sheet
  let reportSheet = ss.getSheetByName('Document Coverage Report');
  if (!reportSheet) {
    reportSheet = ss.insertSheet('Document Coverage Report');
  } else {
    reportSheet.clear();
  }

  // Build report
  const reportData = [];
  const now = new Date();

  // Header
  reportData.push(['DOCUMENT COVERAGE REPORT']);
  reportData.push([`Generated: ${now.toLocaleString()}`]);
  reportData.push(['']);
  reportData.push(['ASIN', 'SKU', 'Total Documents', 'Document Types', 'Languages']);

  // Product rows
  Object.keys(productDocs).sort().forEach(asin => {
    const product = productDocs[asin];
    const docTypes = [...new Set(product.documents.map(d => d.type))].join(', ');
    const languages = [...new Set(product.documents.map(d => d.language))].join(', ');

    reportData.push([
      asin,
      product.sku,
      product.documents.length,
      docTypes,
      languages
    ]);
  });

  // Write to sheet
  reportSheet.getRange(1, 1, reportData.length, 5).setValues(reportData);

  // Format
  reportSheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  reportSheet.getRange(4, 1, 1, 5).setFontWeight('bold').setBackground('#f3f3f3');

  reportSheet.setColumnWidth(1, 120);
  reportSheet.setColumnWidth(2, 150);
  reportSheet.setColumnWidth(3, 130);
  reportSheet.setColumnWidth(4, 350);
  reportSheet.setColumnWidth(5, 200);

  // Activate report
  ss.setActiveSheet(reportSheet);

  lukoLogToSheet('Report', 'Document coverage report generated');
  lukoShowMessage('Report Generated', `Document Coverage Report created!\n\nTotal products with documents: ${Object.keys(productDocs).length}`);
}

/**
 * Bulk set document visibility
 * Sets 'Visible to Customer' for selected documents
 */
function lukoBulkSetDocumentVisibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docsSheet = ss.getSheetByName('Documents');

  if (!docsSheet) {
    lukoShowMessage('Error', 'Documents sheet not found.');
    return;
  }

  const selection = docsSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to update.');
    return;
  }

  const visibility = Browser.inputBox(
    'Bulk Set Visibility',
    'Set "Visible to Customer" to (Yes/No):',
    Browser.Buttons.OK_CANCEL
  );

  if (visibility === 'cancel') return;

  if (visibility !== 'Yes' && visibility !== 'No') {
    lukoShowMessage('Error', 'Invalid value. Must be: Yes or No');
    return;
  }

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  // Update visibility column (column 10)
  docsSheet.getRange(startRow, 10, numRows, 1).setValue(visibility);

  // Update last modified
  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  docsSheet.getRange(startRow, 15, numRows, 1).setValue(now);
  docsSheet.getRange(startRow, 16, numRows, 1).setValue(user);

  lukoLogToSheet('Bulk Update', `Set document visibility to '${visibility}' for ${numRows} documents`);
  lukoShowMessage('Success', `Updated ${numRows} documents to '${visibility}'`);
}
