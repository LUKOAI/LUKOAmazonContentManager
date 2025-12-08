/**
 * Brand Content Manager - LUKO Amazon Content Manager
 *
 * Handles Brand Strip and Brand Store content management for Amazon.
 * - Brand Strip: Simple banner with logo/headline or enhanced hero image
 * - Brand Store: Multi-page store builder with modular page construction
 *
 * Functions:
 * - Brand Strip validation and export
 * - Brand Store page validation and export
 * - Module management for store pages
 * - Store configuration management
 *
 * @author LUKO-ACM
 * @version 1.0.0
 */

// ============================================================================
// BRAND STRIP FUNCTIONS
// ============================================================================

/**
 * Validates Brand Strip data before export
 *
 * @returns {Object} Validation result
 */
function lukoValidateBrandStrip() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stripSheet = ss.getSheetByName('Brand Strip');

  if (!stripSheet) {
    lukoShowMessage('Error', 'Brand Strip sheet not found. Please generate it first.');
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  const lastRow = stripSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to validate in Brand Strip sheet.');
    return { isValid: true, errors: [], warnings: [] };
  }

  const data = stripSheet.getRange(4, 1, lastRow - 3, 28).getValues();
  const errors = [];
  const warnings = [];
  let validCount = 0;

  const validStripTypes = ['Classic', 'Enhanced'];

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      exportCheckbox, asin, sku, stripEnabled, stripType,
      // Classic
      logoUrl, headline, headlineColor, backgroundColor, ctaText, ctaUrl,
      // Enhanced
      heroImageUrl, heroImageAltText, productImage1, productImage2, productImage3,
      productImage4, productTitle1, productTitle2, productTitle3, productTitle4,
      videoUrl, videoThumbnail, brandStory,
      // Status
      exportStatus, exportDateTime, lastModified, modifiedBy, errorMessages
    ] = row;

    if (!exportCheckbox) return;

    const rowErrors = [];
    const rowWarnings = [];

    // Required: ASIN
    if (!asin || !/^B[0-9A-Z]{9}$/.test(asin.toString().trim())) {
      rowErrors.push(`Row ${rowNum}: Invalid or missing ASIN`);
    }

    // Required: SKU
    if (!sku || sku.toString().trim() === '') {
      rowErrors.push(`Row ${rowNum}: SKU is required`);
    }

    // Strip Enabled
    if (stripEnabled !== 'Yes' && stripEnabled !== 'No') {
      rowErrors.push(`Row ${rowNum}: Strip Enabled must be 'Yes' or 'No'`);
    }

    if (stripEnabled === 'No') {
      rowWarnings.push(`Row ${rowNum}: Brand Strip is disabled - this will remove the strip from the product page`);
      if (rowErrors.length === 0) validCount++;
      errors.push(...rowErrors);
      warnings.push(...rowWarnings);
      return;
    }

    // Strip Type validation
    if (!validStripTypes.includes(stripType)) {
      rowErrors.push(`Row ${rowNum}: Strip Type must be 'Classic' or 'Enhanced'`);
    }

    // CLASSIC STRIP VALIDATION
    if (stripType === 'Classic') {
      if (!logoUrl || !logoUrl.toString().trim().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: Logo URL is required for Classic strip and must be a valid URL`);
      }
      if (!headline || headline.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Headline is empty (recommended for Classic strip)`);
      }
      if (headline && headline.toString().length > 100) {
        rowWarnings.push(`Row ${rowNum}: Headline is very long (${headline.toString().length} characters)`);
      }
      if (headlineColor && !/^#[0-9A-Fa-f]{6}$/.test(headlineColor)) {
        rowWarnings.push(`Row ${rowNum}: Headline Color should be hex format (#RRGGBB)`);
      }
      if (backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(backgroundColor)) {
        rowWarnings.push(`Row ${rowNum}: Background Color should be hex format (#RRGGBB)`);
      }
      if (ctaText && !ctaUrl) {
        rowWarnings.push(`Row ${rowNum}: CTA Text provided but CTA URL is missing`);
      }
      if (ctaUrl && !ctaUrl.toString().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: CTA URL must be a valid URL`);
      }
    }

    // ENHANCED STRIP VALIDATION
    if (stripType === 'Enhanced') {
      if (!heroImageUrl || !heroImageUrl.toString().trim().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: Hero Image URL is required for Enhanced strip`);
      }
      if (!heroImageAltText || heroImageAltText.toString().trim() === '') {
        rowWarnings.push(`Row ${rowNum}: Hero Image Alt Text is missing (recommended for accessibility)`);
      }

      // At least one product image should be provided
      const hasProductImages = productImage1 || productImage2 || productImage3 || productImage4;
      if (!hasProductImages) {
        rowWarnings.push(`Row ${rowNum}: No product showcase images provided (recommended for Enhanced strip)`);
      }

      // Validate product image URLs
      [productImage1, productImage2, productImage3, productImage4].forEach((img, idx) => {
        if (img && !img.toString().startsWith('http')) {
          rowErrors.push(`Row ${rowNum}: Product Image ${idx + 1} must be a valid URL`);
        }
      });

      // Validate video URL if provided
      if (videoUrl && !videoUrl.toString().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: Video URL must be a valid URL`);
      }
      if (videoUrl && videoThumbnail && !videoThumbnail.toString().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: Video Thumbnail must be a valid URL`);
      }
    }

    if (rowErrors.length === 0) validCount++;
    errors.push(...rowErrors);
    warnings.push(...rowWarnings);
  });

  const markedForExport = data.filter(row => row[0]).length;
  const isValid = errors.length === 0;

  lukoLogToSheet('Validation', `Brand Strip validated: ${validCount}/${markedForExport} rows valid, ${errors.length} errors, ${warnings.length} warnings`);

  let message = `Brand Strip Validation Complete:\n\n`;
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
 * Exports Brand Strip data to Amazon
 */
function lukoExportBrandStripToAmazon() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stripSheet = ss.getSheetByName('Brand Strip');

  if (!stripSheet) {
    lukoShowMessage('Error', 'Brand Strip sheet not found.');
    return;
  }

  // Validate first
  const validation = lukoValidateBrandStrip();
  if (!validation.isValid) {
    const proceed = Browser.msgBox(
      'Validation Errors Found',
      `Found ${validation.errors.length} errors. Do you want to proceed anyway?`,
      Browser.Buttons.YES_NO
    );
    if (proceed !== 'yes') return;
  }

  const lastRow = stripSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', 'No data to export.');
    return;
  }

  const data = stripSheet.getRange(4, 1, lastRow - 3, 28).getValues();
  const rowsToExport = [];
  const rowIndexes = [];

  data.forEach((row, index) => {
    if (row[0]) { // Export checkbox
      rowsToExport.push({
        asin: row[1],
        sku: row[2],
        enabled: row[3] === 'Yes',
        type: row[4],
        classic: {
          logoUrl: row[5],
          headline: row[6],
          headlineColor: row[7],
          backgroundColor: row[8],
          ctaText: row[9],
          ctaUrl: row[10]
        },
        enhanced: {
          heroImageUrl: row[11],
          heroImageAltText: row[12],
          productShowcase: [
            { imageUrl: row[13], title: row[17] },
            { imageUrl: row[14], title: row[18] },
            { imageUrl: row[15], title: row[19] },
            { imageUrl: row[16], title: row[20] }
          ].filter(p => p.imageUrl),
          videoUrl: row[21],
          videoThumbnail: row[22],
          brandStory: row[23]
        }
      });
      rowIndexes.push(index + 4);
    }
  });

  if (rowsToExport.length === 0) {
    lukoShowMessage('Info', 'No rows marked for export.');
    return;
  }

  const configSheet = ss.getSheetByName('Config');
  const cloudFunctionUrl = configSheet ? configSheet.getRange('B2').getValue() : null;

  if (!cloudFunctionUrl) {
    lukoShowMessage('Error', 'Cloud Function URL not configured.');
    return;
  }

  lukoBulkUpdateExportStatus(stripSheet, rowIndexes, 'PENDING', '', 24, 25, 28);

  try {
    lukoLogToSheet('Export', `Starting Brand Strip export: ${rowsToExport.length} products`);

    const response = UrlFetchApp.fetch(cloudFunctionUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'exportBrandStrip',
        data: rowsToExport
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      result.results.forEach((itemResult, idx) => {
        const rowIndex = rowIndexes[idx];
        if (itemResult.success) {
          lukoBulkUpdateExportStatus(stripSheet, [rowIndex], 'DONE', '', 24, 25, 28);
        } else {
          lukoBulkUpdateExportStatus(stripSheet, [rowIndex], 'FAILED', itemResult.error || 'Unknown error', 24, 25, 28);
        }
      });

      const successCount = result.results.filter(r => r.success).length;
      lukoLogToSheet('Export', `Brand Strip export completed: ${successCount}/${rowsToExport.length} succeeded`);
      lukoShowMessage('Export Complete', `Brand Strip Export:\n\n✓ Successful: ${successCount}\n✗ Failed: ${rowsToExport.length - successCount}`);
    } else {
      lukoBulkUpdateExportStatus(stripSheet, rowIndexes, 'FAILED', result.error || 'Export failed', 24, 25, 28);
      lukoShowMessage('Export Failed', `Error: ${result.error}`);
    }
  } catch (error) {
    lukoBulkUpdateExportStatus(stripSheet, rowIndexes, 'FAILED', error.toString(), 24, 25, 28);
    lukoShowMessage('Export Error', `Error: ${error.toString()}`);
  }
}

// ============================================================================
// BRAND STORE FUNCTIONS
// ============================================================================

/**
 * Validates Brand Store configuration
 */
function lukoValidateBrandStoreConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('BrandStore-Config');

  if (!configSheet) {
    lukoShowMessage('Error', 'BrandStore-Config sheet not found.');
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  // Get configuration values (single row at row 4)
  const data = configSheet.getRange(4, 1, 1, 15).getValues()[0];
  const errors = [];
  const warnings = [];

  const [
    storeEnabled, storeName, brandLogoUrl, brandLogoAltText,
    primaryColor, secondaryColor, fontFamily, storeDescription,
    metaTitle, metaDescription, metaKeywords,
    faviconUrl, headerImageUrl, footerText, exportStatus
  ] = data;

  // Store Enabled
  if (storeEnabled !== 'Yes' && storeEnabled !== 'No') {
    errors.push('Store Enabled must be "Yes" or "No"');
  }

  if (storeEnabled === 'No') {
    warnings.push('Brand Store is disabled');
    return { isValid: true, errors, warnings };
  }

  // Required fields when enabled
  if (!storeName || storeName.toString().trim() === '') {
    errors.push('Store Name is required');
  }

  if (!brandLogoUrl || !brandLogoUrl.toString().startsWith('http')) {
    errors.push('Brand Logo URL is required and must be a valid URL');
  }

  if (!brandLogoAltText) {
    warnings.push('Brand Logo Alt Text is missing (recommended for accessibility)');
  }

  // Color validation
  if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    warnings.push('Primary Color should be hex format (#RRGGBB)');
  }

  if (secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
    warnings.push('Secondary Color should be hex format (#RRGGBB)');
  }

  // Meta fields
  if (!metaTitle || metaTitle.toString().length < 10) {
    warnings.push('Meta Title is too short (recommended: 50-60 characters)');
  }

  if (!metaDescription || metaDescription.toString().length < 50) {
    warnings.push('Meta Description is too short (recommended: 150-160 characters)');
  }

  const isValid = errors.length === 0;

  let message = `Brand Store Config Validation:\n\n`;
  message += `✗ Errors: ${errors.length}\n`;
  message += `⚠ Warnings: ${warnings.length}\n\n`;

  if (errors.length > 0) message += `Errors:\n${errors.join('\n')}\n\n`;
  if (warnings.length > 0) message += `Warnings:\n${warnings.join('\n')}`;
  if (isValid) message += `\n✅ Configuration is valid!`;

  lukoShowMessage(isValid ? 'Validation Successful' : 'Validation Failed', message);

  return { isValid, errors, warnings };
}

/**
 * Validates Brand Store page modules
 */
function lukoValidateBrandStorePage(pageSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pageSheet = ss.getSheetByName(pageSheetName);

  if (!pageSheet) {
    lukoShowMessage('Error', `${pageSheetName} sheet not found.`);
    return { isValid: false, errors: ['Sheet not found'], warnings: [] };
  }

  const lastRow = pageSheet.getLastRow();
  if (lastRow < 4) {
    lukoShowMessage('Info', `No modules in ${pageSheetName}.`);
    return { isValid: true, errors: [], warnings: [] };
  }

  const data = pageSheet.getRange(4, 1, lastRow - 3, 38).getValues();
  const errors = [];
  const warnings = [];
  let validCount = 0;

  const validModuleTypes = [
    'Hero Image', 'Featured Products Grid', 'Image & Text', 'Product Gallery',
    'Video', 'Image Tiles', 'Shoppable Images', 'Background Video',
    'Slider/Carousel', 'Product Showcase', 'Text Block', 'Category Links',
    'Brand Story', 'Social Proof', 'Newsletter Signup'
  ];

  data.forEach((row, index) => {
    const rowNum = index + 4;
    const [
      includeCheckbox, moduleOrder, moduleType, moduleTitle,
      // Images
      imageUrl, imageAltText, image2Url, image3Url, image4Url,
      // Text content
      headlineText, bodyText, ctaText, ctaUrl,
      // Product references
      productAsin1, productAsin2, productAsin3, productAsin4, productAsin5, productAsin6,
      // Video
      videoUrl, videoThumbnail, videoAutoplay, videoLoop,
      // Layout
      layoutType, columnCount, imagePosition, alignment, backgroundColor, textColor,
      // Advanced
      customCss, animationEffect, mobileHidden,
      // Status
      exportStatus, exportDateTime, lastModified, modifiedBy, errorMessages
    ] = row;

    if (!includeCheckbox) return;

    const rowErrors = [];
    const rowWarnings = [];

    // Module Order validation
    if (!moduleOrder || isNaN(parseInt(moduleOrder)) || parseInt(moduleOrder) < 1) {
      rowErrors.push(`Row ${rowNum}: Module Order must be a positive number`);
    }

    // Module Type validation
    if (!validModuleTypes.includes(moduleType)) {
      rowErrors.push(`Row ${rowNum}: Invalid Module Type`);
    }

    // Type-specific validation
    if (moduleType === 'Hero Image' || moduleType === 'Image & Text') {
      if (!imageUrl || !imageUrl.toString().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: Image URL is required for ${moduleType}`);
      }
      if (!imageAltText) {
        rowWarnings.push(`Row ${rowNum}: Image Alt Text missing (accessibility)`);
      }
    }

    if (moduleType === 'Video' || moduleType === 'Background Video') {
      if (!videoUrl || !videoUrl.toString().startsWith('http')) {
        rowErrors.push(`Row ${rowNum}: Video URL is required for ${moduleType}`);
      }
    }

    if (moduleType === 'Featured Products Grid' || moduleType === 'Product Gallery' || moduleType === 'Product Showcase') {
      const hasProducts = productAsin1 || productAsin2 || productAsin3 || productAsin4 || productAsin5 || productAsin6;
      if (!hasProducts) {
        rowErrors.push(`Row ${rowNum}: At least one Product ASIN is required for ${moduleType}`);
      }
    }

    if (moduleType === 'Text Block' || moduleType === 'Brand Story') {
      if (!headlineText && !bodyText) {
        rowErrors.push(`Row ${rowNum}: Headline or Body Text is required for ${moduleType}`);
      }
    }

    if (moduleType === 'Image Tiles' || moduleType === 'Slider/Carousel') {
      const imageCount = [imageUrl, image2Url, image3Url, image4Url].filter(url => url && url.toString().startsWith('http')).length;
      if (imageCount < 2) {
        rowErrors.push(`Row ${rowNum}: At least 2 images required for ${moduleType}`);
      }
    }

    // CTA validation
    if (ctaText && !ctaUrl) {
      rowWarnings.push(`Row ${rowNum}: CTA Text provided but CTA URL is missing`);
    }

    // Color validation
    if (backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(backgroundColor)) {
      rowWarnings.push(`Row ${rowNum}: Background Color should be hex format`);
    }
    if (textColor && !/^#[0-9A-Fa-f]{6}$/.test(textColor)) {
      rowWarnings.push(`Row ${rowNum}: Text Color should be hex format`);
    }

    if (rowErrors.length === 0) validCount++;
    errors.push(...rowErrors);
    warnings.push(...rowWarnings);
  });

  const markedForExport = data.filter(row => row[0]).length;
  const isValid = errors.length === 0;

  lukoLogToSheet('Validation', `${pageSheetName} validated: ${validCount}/${markedForExport} modules valid, ${errors.length} errors`);

  let message = `${pageSheetName} Validation:\n\n`;
  message += `✓ Modules to include: ${markedForExport}\n`;
  message += `✓ Valid modules: ${validCount}\n`;
  message += `✗ Errors: ${errors.length}\n`;
  message += `⚠ Warnings: ${warnings.length}\n\n`;

  if (errors.length > 0) message += `Errors (first 10):\n${errors.slice(0, 10).join('\n')}\n\n`;
  if (warnings.length > 0) message += `Warnings (first 10):\n${warnings.slice(0, 10).join('\n')}`;
  if (isValid) message += `\n\n✅ All modules are valid!`;

  lukoShowMessage(isValid ? 'Validation Successful' : 'Validation Failed', message);

  return { isValid, errors, warnings, validCount, markedForExport };
}

/**
 * Exports complete Brand Store to Amazon
 */
function lukoExportBrandStoreToAmazon() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // First validate config
  const configValidation = lukoValidateBrandStoreConfig();
  if (!configValidation.isValid) {
    lukoShowMessage('Error', 'Please fix Brand Store Config errors first.');
    return;
  }

  // Collect config data
  const configSheet = ss.getSheetByName('BrandStore-Config');
  const configData = configSheet.getRange(4, 1, 1, 15).getValues()[0];

  if (configData[0] !== 'Yes') {
    lukoShowMessage('Info', 'Brand Store is disabled in config.');
    return;
  }

  const storeConfig = {
    enabled: true,
    name: configData[1],
    brandLogo: { url: configData[2], altText: configData[3] },
    colors: { primary: configData[4], secondary: configData[5] },
    fontFamily: configData[6],
    description: configData[7],
    meta: { title: configData[8], description: configData[9], keywords: configData[10] },
    favicon: configData[11],
    headerImage: configData[12],
    footerText: configData[13]
  };

  // Collect pages
  const pages = [];
  const pageNames = ['BrandStore-Homepage', 'BrandStore-Page2', 'BrandStore-Page3'];

  pageNames.forEach(pageName => {
    const pageSheet = ss.getSheetByName(pageName);
    if (!pageSheet) return;

    const lastRow = pageSheet.getLastRow();
    if (lastRow < 4) return;

    const pageData = pageSheet.getRange(4, 1, lastRow - 3, 38).getValues();
    const modules = [];

    pageData.forEach(row => {
      if (row[0]) { // Include checkbox
        modules.push({
          order: parseInt(row[1]) || 999,
          type: row[2],
          title: row[3],
          images: {
            main: row[4],
            altText: row[5],
            additional: [row[6], row[7], row[8]].filter(url => url)
          },
          text: {
            headline: row[9],
            body: row[10],
            cta: { text: row[11], url: row[12] }
          },
          products: [row[13], row[14], row[15], row[16], row[17], row[18]].filter(asin => asin),
          video: {
            url: row[19],
            thumbnail: row[20],
            autoplay: row[21] === 'Yes',
            loop: row[22] === 'Yes'
          },
          layout: {
            type: row[23],
            columns: parseInt(row[24]) || 1,
            imagePosition: row[25],
            alignment: row[26],
            backgroundColor: row[27],
            textColor: row[28]
          },
          advanced: {
            customCss: row[29],
            animation: row[30],
            mobileHidden: row[31] === 'Yes'
          }
        });
      }
    });

    // Sort modules by order
    modules.sort((a, b) => a.order - b.order);

    pages.push({
      name: pageName.replace('BrandStore-', ''),
      modules: modules
    });
  });

  if (pages.every(p => p.modules.length === 0)) {
    lukoShowMessage('Info', 'No modules marked for export in any page.');
    return;
  }

  // Get Cloud Function URL
  const mainConfigSheet = ss.getSheetByName('Config');
  const cloudFunctionUrl = mainConfigSheet ? mainConfigSheet.getRange('B2').getValue() : null;

  if (!cloudFunctionUrl) {
    lukoShowMessage('Error', 'Cloud Function URL not configured.');
    return;
  }

  try {
    lukoLogToSheet('Export', `Starting Brand Store export: ${pages.length} pages, ${pages.reduce((sum, p) => sum + p.modules.length, 0)} modules`);

    const response = UrlFetchApp.fetch(cloudFunctionUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'exportBrandStore',
        data: {
          config: storeConfig,
          pages: pages
        }
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.success) {
      // Update config export status
      configSheet.getRange(4, 15).setValue('DONE');

      lukoLogToSheet('Export', `Brand Store export completed successfully`);
      lukoShowMessage('Export Complete', `Brand Store exported successfully!\n\nPages: ${pages.length}\nTotal modules: ${pages.reduce((sum, p) => sum + p.modules.length, 0)}`);
    } else {
      configSheet.getRange(4, 15).setValue('FAILED');
      lukoShowMessage('Export Failed', `Error: ${result.error}`);
    }
  } catch (error) {
    configSheet.getRange(4, 15).setValue('FAILED');
    lukoShowMessage('Export Error', `Error: ${error.toString()}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper: Bulk update export status
 */
function lukoBulkUpdateExportStatus(sheet, rowIndexes, status, errorMessage, statusCol, dateCol, errorCol) {
  const now = new Date();

  rowIndexes.forEach(rowIndex => {
    sheet.getRange(rowIndex, statusCol).setValue(status);
    sheet.getRange(rowIndex, dateCol).setValue(now);
    if (errorMessage) {
      sheet.getRange(rowIndex, errorCol).setValue(errorMessage);
    } else {
      sheet.getRange(rowIndex, errorCol).setValue('');
    }
  });
}

/**
 * Add new module to Brand Store page
 */
function lukoAddModuleToBrandStorePage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getActiveSheet();
  const sheetName = activeSheet.getName();

  // Check if we're on a Brand Store page
  if (!sheetName.startsWith('BrandStore-') || sheetName === 'BrandStore-Config') {
    lukoShowMessage('Error', 'Please select a Brand Store page sheet (Homepage, Page2, or Page3).');
    return;
  }

  // Ask for module type
  const moduleType = Browser.inputBox(
    'Add New Module',
    'Select module type:\n1. Hero Image\n2. Featured Products Grid\n3. Image & Text\n4. Video\n5. Text Block\n6. Product Showcase\n\nEnter number (1-6):',
    Browser.Buttons.OK_CANCEL
  );

  if (moduleType === 'cancel') return;

  const moduleTypes = ['Hero Image', 'Featured Products Grid', 'Image & Text', 'Video', 'Text Block', 'Product Showcase'];
  const typeIndex = parseInt(moduleType) - 1;

  if (typeIndex < 0 || typeIndex >= moduleTypes.length) {
    lukoShowMessage('Error', 'Invalid module type.');
    return;
  }

  const selectedType = moduleTypes[typeIndex];

  // Get next row and order number
  const lastRow = activeSheet.getLastRow();
  const nextRow = lastRow + 1;
  const nextOrder = lastRow - 2; // Rough order based on current rows

  // Create template row based on module type
  const newRow = [
    true, // Include checkbox
    nextOrder, // Module Order
    selectedType, // Module Type
    `New ${selectedType}`, // Module Title
    '', '', '', '', '', // Images
    '', '', '', '', // Text content
    '', '', '', '', '', '', // Products
    '', '', 'No', 'No', // Video
    '1-Column', 1, 'Left', 'Center', '#FFFFFF', '#000000', // Layout
    '', 'None', 'No', // Advanced
    '', '', new Date(), Session.getActiveUser().getEmail(), '' // Status
  ];

  activeSheet.getRange(nextRow, 1, 1, 38).setValues([newRow]);

  lukoShowMessage('Success', `Added new ${selectedType} module at row ${nextRow}.\n\nPlease fill in the required fields.`);
}
