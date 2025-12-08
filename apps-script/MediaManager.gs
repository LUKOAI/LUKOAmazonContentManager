/**
 * Media Manager - LUKO Amazon Content Manager
 *
 * Handles video content management for Amazon product listings.
 * Supports up to 3 videos per product with comprehensive metadata.
 *
 * Functions:
 * - Video data validation
 * - Export videos to Amazon via Cloud Function
 * - Bulk video operations
 * - Video analytics and reporting
 *
 * @author LUKO-ACM
 * @version 1.0.0
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates video data before export
 * Checks URLs, formats, metadata, and business rules
 *
 * @returns {Object} Validation result with {isValid, errors, warnings}
 */
function lukoValidateVideos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found. Please generate it first.');
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  const lastRow = videosSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to validate in Videos sheet.');
    return { isValid: true, errors: [], warnings: [] };
  }

  const data = videosSheet.getRange(4, 1, lastRow - 3, 29).getValues();
  const errors = [];
  const warnings = [];
  let validCount = 0;

  const validVideoTypes = [
    'Product Demo',
    'How-To / Tutorial',
    'Unboxing',
    'Customer Review',
    '360° View',
    'Lifestyle',
    'Comparison',
    'Installation Guide',
    'Features Overview',
    'Brand Story'
  ];

  const validLanguages = [
    'English', 'German', 'French', 'Italian', 'Spanish', 'Dutch', 'Polish',
    'Portuguese', 'Swedish', 'Danish', 'Finnish', 'Czech', 'Romanian',
    'en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'pt', 'sv', 'da', 'fi', 'cs', 'ro'
  ];

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      exportCheckbox, asin, sku,
      // Video 1
      video1Url, video1Thumbnail, video1Duration, video1Title, video1Description, video1Type, video1Language,
      // Video 2
      video2Url, video2Thumbnail, video2Duration, video2Title, video2Description, video2Type, video2Language,
      // Video 3
      video3Url, video3Thumbnail, video3Duration, video3Title, video3Description, video3Type, video3Language,
      // Status
      totalVideos, exportStatus, exportDateTime, lastModified, modifiedBy, errorMessages
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

    // Video validation helper function
    const validateVideo = (videoNum, url, thumbnail, duration, title, description, type, language) => {
      if (!url || url.toString().trim() === '') {
        // If video 1 is empty, it's an error; videos 2-3 are optional
        if (videoNum === 1) {
          rowErrors.push(`Row ${rowNum}: Video 1 URL is required`);
        }
        return; // Skip further validation if URL is empty
      }

      // URL validation
      const urlStr = url.toString().trim();
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        rowErrors.push(`Row ${rowNum}: Video ${videoNum} URL must start with http:// or https://`);
      }

      // Recommend HTTPS
      if (urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} URL uses HTTP instead of HTTPS (not secure)`);
      }

      // Thumbnail validation
      if (!thumbnail || thumbnail.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Thumbnail URL is missing (recommended for better display)`);
      } else {
        const thumbStr = thumbnail.toString().trim();
        if (!thumbStr.startsWith('http://') && !thumbStr.startsWith('https://')) {
          rowErrors.push(`Row ${rowNum}: Video ${videoNum} Thumbnail URL must be a valid URL`);
        }
      }

      // Duration validation
      if (!duration || duration.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Duration is missing`);
      } else {
        const durationStr = duration.toString().trim();
        // Accept formats: "1:30", "90", "1m 30s"
        const durationPattern = /^(\d+:)?\d+(:?\d+)?[ms]?$/;
        if (!durationPattern.test(durationStr.replace(/\s+/g, ''))) {
          rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Duration format unclear (use format like "1:30" or "90")`);
        }
      }

      // Title validation
      if (!title || title.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Title is missing (recommended)`);
      } else if (title.toString().length > 100) {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Title is very long (${title.toString().length} characters)`);
      }

      // Description validation
      if (!description || description.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Description is missing (recommended)`);
      } else if (description.toString().length > 500) {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Description is very long (${description.toString().length} characters)`);
      }

      // Type validation
      if (!type || type.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Type is missing`);
      } else if (!validVideoTypes.includes(type)) {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Type "${type}" is not a standard type`);
      }

      // Language validation
      if (!language || language.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Language is missing`);
      } else if (!validLanguages.includes(language)) {
        rowWarnings.push(`Row ${rowNum}: Video ${videoNum} Language "${language}" is uncommon - verify it's correct`);
      }
    };

    // Validate each video
    validateVideo(1, video1Url, video1Thumbnail, video1Duration, video1Title, video1Description, video1Type, video1Language);
    validateVideo(2, video2Url, video2Thumbnail, video2Duration, video2Title, video2Description, video2Type, video2Language);
    validateVideo(3, video3Url, video3Thumbnail, video3Duration, video3Title, video3Description, video3Type, video3Language);

    // Count actual videos
    const actualVideoCount = [video1Url, video2Url, video3Url].filter(url => url && url.toString().trim() !== '').length;

    // Verify total videos count
    if (totalVideos && parseInt(totalVideos) !== actualVideoCount) {
      rowWarnings.push(`Row ${rowNum}: Total Videos (${totalVideos}) doesn't match actual count (${actualVideoCount})`);
    }

    // Amazon limit: typically max 6 videos, but we support 3 per row
    if (actualVideoCount > 3) {
      rowErrors.push(`Row ${rowNum}: Too many videos (max 3 per product in this row)`);
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
  lukoLogToSheet('Validation', `Videos validated: ${validCount}/${markedForExport} rows valid, ${errors.length} errors, ${warnings.length} warnings`);

  // Show result to user
  let message = `Videos Validation Complete:\n\n`;
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
 * Exports videos to Amazon via Cloud Function
 * Sends video metadata to Amazon SP-API
 */
function lukoExportVideosToAmazon() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found.');
    return;
  }

  // First validate
  const validation = lukoValidateVideos();
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

  const lastRow = videosSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to export.');
    return;
  }

  const data = videosSheet.getRange(4, 1, lastRow - 3, 29).getValues();
  const rowsToExport = [];
  const rowIndexes = [];

  data.forEach((row, index) => {
    if (row[0]) { // Export checkbox
      const videos = [];

      // Video 1
      if (row[3]) {
        videos.push({
          url: row[3],
          thumbnail: row[4],
          duration: row[5],
          title: row[6],
          description: row[7],
          type: row[8],
          language: row[9]
        });
      }

      // Video 2
      if (row[10]) {
        videos.push({
          url: row[10],
          thumbnail: row[11],
          duration: row[12],
          title: row[13],
          description: row[14],
          type: row[15],
          language: row[16]
        });
      }

      // Video 3
      if (row[17]) {
        videos.push({
          url: row[17],
          thumbnail: row[18],
          duration: row[19],
          title: row[20],
          description: row[21],
          type: row[22],
          language: row[23]
        });
      }

      if (videos.length > 0) {
        rowsToExport.push({
          asin: row[1],
          sku: row[2],
          videos: videos
        });
        rowIndexes.push(index + 4);
      }
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
  lukoUpdateVideoExportStatus(videosSheet, rowIndexes, 'PENDING', 'Starting export...');

  try {
    lukoLogToSheet('Export', `Starting Videos export: ${rowsToExport.length} products`);

    // Call Cloud Function
    const response = UrlFetchApp.fetch(cloudFunctionUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'exportVideos',
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
          lukoUpdateVideoExportStatus(videosSheet, [rowIndex], 'DONE', '');
        } else {
          lukoUpdateVideoExportStatus(videosSheet, [rowIndex], 'FAILED', itemResult.error || 'Unknown error');
        }
      });

      const successCount = result.results.filter(r => r.success).length;
      const failedCount = result.results.length - successCount;

      lukoLogToSheet('Export', `Videos export completed: ${successCount} succeeded, ${failedCount} failed`);
      lukoShowMessage('Export Complete', `Videos Export Results:\n\n✓ Successful: ${successCount}\n✗ Failed: ${failedCount}`);

    } else {
      // All failed
      lukoUpdateVideoExportStatus(videosSheet, rowIndexes, 'FAILED', result.error || 'Export failed');
      lukoLogToSheet('Error', `Videos export failed: ${result.error}`);
      lukoShowMessage('Export Failed', `Error: ${result.error}`);
    }

  } catch (error) {
    lukoUpdateVideoExportStatus(videosSheet, rowIndexes, 'FAILED', error.toString());
    lukoLogToSheet('Error', `Videos export error: ${error.toString()}`);
    lukoShowMessage('Export Error', `An error occurred during export:\n\n${error.toString()}`);
  }
}

/**
 * Helper: Update export status for video rows
 */
function lukoUpdateVideoExportStatus(sheet, rowIndexes, status, errorMessage) {
  const now = new Date();

  rowIndexes.forEach(rowIndex => {
    sheet.getRange(rowIndex, 25).setValue(status); // Export Status
    sheet.getRange(rowIndex, 26).setValue(now); // Export DateTime
    if (errorMessage) {
      sheet.getRange(rowIndex, 29).setValue(errorMessage); // Error Messages
    } else {
      sheet.getRange(rowIndex, 29).setValue(''); // Clear error
    }
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Auto-calculate total videos count for all rows
 * Updates the "Total Videos" column based on filled video URLs
 */
function lukoAutoCalculateVideoCount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found.');
    return;
  }

  const lastRow = videosSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to process.');
    return;
  }

  const data = videosSheet.getRange(4, 1, lastRow - 3, 24).getValues();
  let updatedCount = 0;

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const video1Url = row[3];
    const video2Url = row[10];
    const video3Url = row[17];

    const actualCount = [video1Url, video2Url, video3Url].filter(url => url && url.toString().trim() !== '').length;

    // Update Total Videos column (column 24)
    videosSheet.getRange(rowNum, 24).setValue(actualCount);
    updatedCount++;
  });

  lukoLogToSheet('Bulk Update', `Auto-calculated video counts for ${updatedCount} rows`);
  lukoShowMessage('Success', `Updated video counts for ${updatedCount} products`);
}

/**
 * Bulk set video type for selected videos
 */
function lukoBulkSetVideoType() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found.');
    return;
  }

  const selection = videosSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to update.');
    return;
  }

  // Ask for video type
  const videoType = Browser.inputBox(
    'Bulk Set Video Type',
    'Select video type:\n1. Product Demo\n2. How-To / Tutorial\n3. Unboxing\n4. Customer Review\n5. 360° View\n6. Lifestyle\n7. Features Overview\n\nEnter number (1-7):',
    Browser.Buttons.OK_CANCEL
  );

  if (videoType === 'cancel') return;

  const videoTypes = [
    'Product Demo',
    'How-To / Tutorial',
    'Unboxing',
    'Customer Review',
    '360° View',
    'Lifestyle',
    'Features Overview'
  ];

  const typeIndex = parseInt(videoType) - 1;
  if (typeIndex < 0 || typeIndex >= videoTypes.length) {
    lukoShowMessage('Error', 'Invalid video type number.');
    return;
  }

  const selectedType = videoTypes[typeIndex];

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  // Update Video 1 Type (column 9) for all selected rows
  videosSheet.getRange(startRow, 9, numRows, 1).setValue(selectedType);

  // Update last modified
  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  videosSheet.getRange(startRow, 27, numRows, 1).setValue(now);
  videosSheet.getRange(startRow, 28, numRows, 1).setValue(user);

  lukoLogToSheet('Bulk Update', `Set video type to '${selectedType}' for ${numRows} products`);
  lukoShowMessage('Success', `Updated ${numRows} products to video type '${selectedType}'`);
}

/**
 * Bulk set video language for selected videos
 */
function lukoBulkSetVideoLanguage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found.');
    return;
  }

  const selection = videosSheet.getActiveRange();
  if (!selection) {
    lukoShowMessage('Info', 'Please select rows to update.');
    return;
  }

  const language = Browser.inputBox(
    'Bulk Set Language',
    'Enter language (e.g., English, German, en, de):',
    Browser.Buttons.OK_CANCEL
  );

  if (language === 'cancel') return;

  const startRow = selection.getRow();
  const numRows = selection.getNumRows();

  if (startRow < 4) {
    lukoShowMessage('Error', 'Please select data rows (not headers).');
    return;
  }

  // Update Video 1 Language (column 10) for all selected rows
  videosSheet.getRange(startRow, 10, numRows, 1).setValue(language);

  // Update last modified
  const now = new Date();
  const user = Session.getActiveUser().getEmail();
  videosSheet.getRange(startRow, 27, numRows, 1).setValue(now);
  videosSheet.getRange(startRow, 28, numRows, 1).setValue(user);

  lukoLogToSheet('Bulk Update', `Set video language to '${language}' for ${numRows} products`);
  lukoShowMessage('Success', `Updated ${numRows} products to language '${language}'`);
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

/**
 * Generate video coverage report
 * Shows which products have videos and video statistics
 */
function lukoGenerateVideoCoverageReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found.');
    return;
  }

  const lastRow = videosSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data available for report.');
    return;
  }

  const data = videosSheet.getRange(4, 1, lastRow - 3, 24).getValues();

  // Statistics
  let totalProducts = 0;
  let productsWithVideos = 0;
  let totalVideos = 0;
  const videoTypeCount = {};
  const videoLanguageCount = {};

  data.forEach(row => {
    const asin = row[1];
    if (!asin) return;

    totalProducts++;

    const videos = [
      { url: row[3], type: row[8], language: row[9] },
      { url: row[10], type: row[15], language: row[16] },
      { url: row[17], type: row[22], language: row[23] }
    ].filter(v => v.url && v.url.toString().trim() !== '');

    if (videos.length > 0) {
      productsWithVideos++;
      totalVideos += videos.length;

      videos.forEach(video => {
        // Count video types
        const type = video.type || 'Unknown';
        videoTypeCount[type] = (videoTypeCount[type] || 0) + 1;

        // Count languages
        const lang = video.language || 'Unknown';
        videoLanguageCount[lang] = (videoLanguageCount[lang] || 0) + 1;
      });
    }
  });

  // Create report sheet
  let reportSheet = ss.getSheetByName('Video Coverage Report');
  if (!reportSheet) {
    reportSheet = ss.insertSheet('Video Coverage Report');
  } else {
    reportSheet.clear();
  }

  // Build report
  const reportData = [];
  const now = new Date();

  // Header
  reportData.push(['VIDEO COVERAGE REPORT']);
  reportData.push([`Generated: ${now.toLocaleString()}`]);
  reportData.push(['']);

  // Summary statistics
  reportData.push(['SUMMARY STATISTICS']);
  reportData.push(['Total Products', totalProducts]);
  reportData.push(['Products with Videos', productsWithVideos, `${((productsWithVideos / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['Products without Videos', totalProducts - productsWithVideos, `${(((totalProducts - productsWithVideos) / totalProducts) * 100).toFixed(1)}%`]);
  reportData.push(['Total Videos', totalVideos]);
  reportData.push(['Average Videos per Product', (totalVideos / productsWithVideos).toFixed(2)]);
  reportData.push(['']);

  // Video types breakdown
  reportData.push(['VIDEO TYPES BREAKDOWN']);
  Object.keys(videoTypeCount).sort().forEach(type => {
    reportData.push([type, videoTypeCount[type], `${((videoTypeCount[type] / totalVideos) * 100).toFixed(1)}%`]);
  });
  reportData.push(['']);

  // Language breakdown
  reportData.push(['LANGUAGE BREAKDOWN']);
  Object.keys(videoLanguageCount).sort().forEach(lang => {
    reportData.push([lang, videoLanguageCount[lang], `${((videoLanguageCount[lang] / totalVideos) * 100).toFixed(1)}%`]);
  });

  // Write to sheet
  reportSheet.getRange(1, 1, reportData.length, 3).setValues(reportData);

  // Format report
  reportSheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  reportSheet.getRange(4, 1).setFontWeight('bold');
  const typesRow = reportData.findIndex(row => row[0] === 'VIDEO TYPES BREAKDOWN') + 1;
  reportSheet.getRange(typesRow, 1).setFontWeight('bold');
  const langRow = reportData.findIndex(row => row[0] === 'LANGUAGE BREAKDOWN') + 1;
  reportSheet.getRange(langRow, 1).setFontWeight('bold');

  reportSheet.setColumnWidth(1, 250);
  reportSheet.setColumnWidth(2, 100);
  reportSheet.setColumnWidth(3, 100);

  // Activate report sheet
  ss.setActiveSheet(reportSheet);

  lukoLogToSheet('Report', 'Video coverage report generated');
  lukoShowMessage('Report Generated', `Video Coverage Report created!\n\nTotal products: ${totalProducts}\nWith videos: ${productsWithVideos}\nTotal videos: ${totalVideos}`);
}

/**
 * Check for missing thumbnails and durations
 * Identifies videos that are missing recommended metadata
 */
function lukoCheckMissingVideoMetadata() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = ss.getSheetByName('Videos');

  if (!videosSheet) {
    lukoShowMessage('Error', 'Videos sheet not found.');
    return;
  }

  const lastRow = videosSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to check.');
    return;
  }

  const data = videosSheet.getRange(4, 1, lastRow - 3, 24).getValues();
  const issues = [];

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const asin = row[1];
    if (!asin) return;

    // Check Video 1
    if (row[3]) {
      if (!row[4]) issues.push(`Row ${rowNum} (${asin}): Video 1 missing thumbnail`);
      if (!row[5]) issues.push(`Row ${rowNum} (${asin}): Video 1 missing duration`);
      if (!row[6]) issues.push(`Row ${rowNum} (${asin}): Video 1 missing title`);
    }

    // Check Video 2
    if (row[10]) {
      if (!row[11]) issues.push(`Row ${rowNum} (${asin}): Video 2 missing thumbnail`);
      if (!row[12]) issues.push(`Row ${rowNum} (${asin}): Video 2 missing duration`);
      if (!row[13]) issues.push(`Row ${rowNum} (${asin}): Video 2 missing title`);
    }

    // Check Video 3
    if (row[17]) {
      if (!row[18]) issues.push(`Row ${rowNum} (${asin}): Video 3 missing thumbnail`);
      if (!row[19]) issues.push(`Row ${rowNum} (${asin}): Video 3 missing duration`);
      if (!row[20]) issues.push(`Row ${rowNum} (${asin}): Video 3 missing title`);
    }
  });

  if (issues.length === 0) {
    lukoShowMessage('Success', 'All videos have complete metadata! ✓');
  } else {
    let message = `Found ${issues.length} missing metadata items:\n\n`;
    message += issues.slice(0, 20).join('\n');
    if (issues.length > 20) {
      message += `\n\n... and ${issues.length - 20} more`;
    }
    lukoShowMessage('Missing Metadata', message);
  }

  lukoLogToSheet('Check', `Video metadata check: ${issues.length} issues found`);
}
