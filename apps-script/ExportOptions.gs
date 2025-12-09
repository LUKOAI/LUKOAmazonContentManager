/**
 * LUKO Amazon Export Options Manager
 * Advanced export functionality with partial/full update and field selection
 *
 * Features:
 * - Partial Update: Only export changed fields
 * - Full Update: Export all fields (including empty ones)
 * - Field Selector: Choose specific fields to export (Title, Bullets, Description, Images, A+, etc.)
 */

// ========================================
// ENHANCED EXPORT FUNCTION
// ========================================

/**
 * Enhanced product export with update mode selection
 */
function lukoExportProductsAdvanced() {
  const ui = SpreadsheetApp.getUi();

  // Step 1: Select update mode
  const modeResponse = ui.alert(
    'Select Export Mode',
    'Choose update mode:\n\n' +
    'YES = Partial Update (only changed fields)\n' +
    'NO = Full Update (all fields, including empty)\n' +
    'CANCEL = Abort',
    ui.ButtonSet.YES_NO_CANCEL
  );

  if (modeResponse === ui.Button.CANCEL) return;

  const updateMode = (modeResponse === ui.Button.YES) ? 'PARTIAL' : 'FULL';

  // Step 2: Select fields to export
  const fieldsResponse = ui.alert(
    'Select Fields to Export',
    'Do you want to select specific fields to export?\n\n' +
    'YES = Choose specific fields (Title, Bullets, etc.)\n' +
    'NO = Export all fields',
    ui.ButtonSet.YES_NO
  );

  let selectedFields = null;

  if (fieldsResponse === ui.Button.YES) {
    selectedFields = showFieldSelector();
    if (!selectedFields) return; // User cancelled
  }

  // Step 3: Get selected products
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductsMain');

  if (!sheet) {
    showError('ProductsMain sheet not found');
    return;
  }

  const selectedRows = getSelectedCheckboxRows(sheet);

  if (selectedRows.length === 0) {
    showError('No products selected for export. Check the ☑️ Export boxes first.');
    return;
  }

  // Step 4: Confirm export
  const confirmMsg = `Export ${selectedRows.length} products to Amazon?\n\n` +
    `Update Mode: ${updateMode}\n` +
    `Fields: ${selectedFields ? selectedFields.join(', ') : 'All'}\n\n` +
    `This will update products across all marketplaces.`;

  const confirm = ui.alert('Confirm Export', confirmMsg, ui.ButtonSet.YES_NO);

  if (confirm !== ui.Button.YES) return;

  // Step 5: Export
  showProgress(`Exporting ${selectedRows.length} products...`);

  try {
    const results = exportProductsWithOptions(sheet, selectedRows, updateMode, selectedFields);

    // Show results
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;

    ui.alert(
      'Export Complete',
      `✅ Success: ${successCount}\n` +
      `❌ Failed: ${errorCount}\n\n` +
      `Update Mode: ${updateMode}\n` +
      `${selectedFields ? `Fields: ${selectedFields.length} selected\n` : ''}\n` +
      `Check Status column and Logs sheet for details.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    handleError('lukoExportProductsAdvanced', error);
  }
}

/**
 * Show field selector dialog
 */
function showFieldSelector() {
  const ui = SpreadsheetApp.getUi();

  const htmlOutput = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 600px;
          }
          h2 {
            color: #1a73e8;
            margin-bottom: 20px;
          }
          .field-category {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .field-category h3 {
            margin-top: 0;
            color: #555;
            font-size: 16px;
          }
          .field-checkbox {
            display: block;
            margin: 8px 0;
          }
          .field-checkbox input {
            margin-right: 10px;
          }
          .buttons {
            margin-top: 20px;
            text-align: right;
          }
          button {
            padding: 10px 20px;
            margin-left: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .btn-primary {
            background-color: #1a73e8;
            color: white;
          }
          .btn-secondary {
            background-color: #f1f3f4;
            color: #202124;
          }
          .btn-select-all {
            background-color: #34a853;
            color: white;
          }
        </style>
      </head>
      <body>
        <h2>Select Fields to Export</h2>

        <div class="field-category">
          <h3>📝 Basic Information</h3>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="title" checked> Product Title
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="brand" checked> Brand
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="manufacturer"> Manufacturer
          </label>
        </div>

        <div class="field-category">
          <h3>📋 Content</h3>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="bulletPoints" checked> Bullet Points
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="description" checked> Product Description
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="keywords"> Keywords
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="platinumKeywords"> Platinum Keywords
          </label>
        </div>

        <div class="field-category">
          <h3>🖼️ Media</h3>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="images"> Images
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="videos"> Videos
          </label>
        </div>

        <div class="field-category">
          <h3>📐 Specifications</h3>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="dimensions"> Dimensions & Weight
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="compliance"> Compliance & Safety
          </label>
        </div>

        <div class="field-category">
          <h3>💰 Pricing & Inventory</h3>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="pricing"> Pricing
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="inventory"> Inventory
          </label>
        </div>

        <div class="field-category">
          <h3>🎨 Enhanced Content</h3>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="aplus"> A+ Content
          </label>
          <label class="field-checkbox">
            <input type="checkbox" name="field" value="brandContent"> Brand Content
          </label>
        </div>

        <div class="buttons">
          <button class="btn-select-all" onclick="selectAll()">Select All</button>
          <button class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
          <button class="btn-primary" onclick="confirmSelection()">Export Selected Fields</button>
        </div>

        <script>
          function selectAll() {
            const checkboxes = document.querySelectorAll('input[name="field"]');
            checkboxes.forEach(cb => cb.checked = true);
          }

          function confirmSelection() {
            const checkboxes = document.querySelectorAll('input[name="field"]:checked');
            const selectedFields = Array.from(checkboxes).map(cb => cb.value);

            if (selectedFields.length === 0) {
              alert('Please select at least one field');
              return;
            }

            google.script.run
              .withSuccessHandler(function() {
                google.script.host.close();
              })
              .setSelectedFields(selectedFields);
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(650)
    .setHeight(700);

  ui.showModalDialog(htmlOutput, 'Select Fields to Export');

  // Wait for user selection (stored in script properties)
  Utilities.sleep(1000); // Give time for dialog to load

  // This is a simplified version - in production, you'd use a better state management
  const userProperties = PropertiesService.getUserProperties();
  const selectedFieldsJson = userProperties.getProperty('selectedExportFields');

  if (!selectedFieldsJson) return null;

  userProperties.deleteProperty('selectedExportFields');

  return JSON.parse(selectedFieldsJson);
}

/**
 * Server-side function to store selected fields
 * Called from HTML dialog
 */
function setSelectedFields(fields) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('selectedExportFields', JSON.stringify(fields));
  return true;
}

/**
 * Export products with specified options
 */
function exportProductsWithOptions(sheet, selectedRows, updateMode, selectedFields) {
  const results = [];
  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (const row of selectedRows) {
    try {
      // Set status to PENDING
      const statusCol = headers.indexOf('Status') + 1;
      if (statusCol > 0) {
        sheet.getRange(row, statusCol).setValue('PENDING');
      }

      // Extract product data
      const productData = extractProductDataWithOptions(sheet, row, headers, updateMode, selectedFields);

      // Determine marketplace
      const marketplace = detectPrimaryMarketplace(productData);
      const marketplaceConfig = getMarketplaceConfig(marketplace);

      if (!marketplaceConfig) {
        throw new Error(`Invalid marketplace: ${marketplace}`);
      }

      // Add update mode to payload
      productData.updateMode = updateMode;
      productData.selectedFields = selectedFields;

      // Export to Amazon
      const result = syncProductToAmazon(productData, marketplace, marketplaceConfig);
      result.marketplace = marketplace;
      results.push(result);

      // Update row status
      updateRowStatus(sheet, row, result);

      SpreadsheetApp.flush();

    } catch (error) {
      Logger.log(`Error exporting row ${row}: ${error.message}`);
      results.push({
        row: row,
        status: 'ERROR',
        message: error.toString(),
        marketplace: 'N/A'
      });
      updateRowStatus(sheet, row, {
        status: 'ERROR',
        message: error.toString(),
        marketplace: 'DE'
      });
    }
  }

  // Log operations
  logOperations(results, 'ALL', `EXPORT_${updateMode}`);

  return results;
}

/**
 * Extract product data with field filtering
 */
function extractProductDataWithOptions(sheet, rowNumber, headers, updateMode, selectedFields) {
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];

  const product = {
    asin: getColumnValue(values, headers, 'ASIN'),
    sku: getColumnValue(values, headers, 'SKU'),
    productType: getColumnValue(values, headers, 'Product Type') || 'PRODUCT',
    action: 'UPDATE',
    content: {},
    updateMode: updateMode, // PARTIAL or FULL
    selectedFields: selectedFields // null = all fields
  };

  // Extract language-specific content
  const languages = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

  for (const lang of languages) {
    const title = getColumnValue(values, headers, `productTitle_${lang}`);

    if (!title && updateMode === 'PARTIAL') continue; // Skip if no title in partial mode

    const content = {};

    // Only include fields if:
    // 1. No field selection (all fields)
    // 2. Field is in selected fields
    // 3. FULL mode (include all) OR value is not empty (PARTIAL mode)

    const shouldIncludeField = (fieldName, value) => {
      if (!selectedFields || selectedFields.includes(fieldName)) {
        if (updateMode === 'FULL') return true;
        if (updateMode === 'PARTIAL' && value) return true;
      }
      return false;
    };

    // Title & Brand
    if (shouldIncludeField('title', title)) {
      content.title = title;
    }

    const brand = getColumnValue(values, headers, `brand_${lang}`);
    if (shouldIncludeField('brand', brand)) {
      content.brand = brand;
    }

    const manufacturer = getColumnValue(values, headers, `manufacturer_${lang}`);
    if (shouldIncludeField('manufacturer', manufacturer)) {
      content.manufacturer = manufacturer;
    }

    // Bullet Points
    if (!selectedFields || selectedFields.includes('bulletPoints')) {
      const bullets = [];
      for (let i = 1; i <= 9; i++) {
        const bullet = getColumnValue(values, headers, `bulletPoint${i}_${lang}`);
        if (updateMode === 'FULL' || bullet) {
          bullets.push(bullet);
        }
      }
      if (bullets.length > 0) {
        content.bulletPoints = bullets;
      }
    }

    // Description
    const description = getColumnValue(values, headers, `productDescription_${lang}`);
    if (shouldIncludeField('description', description)) {
      content.description = description;
    }

    // Keywords
    const keywords = getColumnValue(values, headers, `genericKeywords_${lang}`);
    if (shouldIncludeField('keywords', keywords)) {
      content.keywords = keywords;
    }

    // Platinum Keywords
    if (!selectedFields || selectedFields.includes('platinumKeywords')) {
      for (let i = 1; i <= 5; i++) {
        const pk = getColumnValue(values, headers, `platinumKeywords${i}_${lang}`);
        if (updateMode === 'FULL' || pk) {
          content[`platinumKeywords${i}`] = pk;
        }
      }
    }

    // Legal & Safety
    if (!selectedFields || selectedFields.includes('compliance')) {
      const legalDisclaimer = getColumnValue(values, headers, `legalDisclaimer_${lang}`);
      if (updateMode === 'FULL' || legalDisclaimer) {
        content.legalDisclaimer = legalDisclaimer;
      }

      const safetyWarning = getColumnValue(values, headers, `safetyWarning_${lang}`);
      if (updateMode === 'FULL' || safetyWarning) {
        content.safetyWarning = safetyWarning;
      }
    }

    if (Object.keys(content).length > 0) {
      product.content[lang] = content;
    }
  }

  // Images
  if (!selectedFields || selectedFields.includes('images')) {
    const mainImage = getColumnValue(values, headers, 'mainImageURL');
    if (updateMode === 'FULL' || mainImage) {
      product.images = {
        main: mainImage,
        additional: []
      };

      for (let i = 1; i <= 5; i++) {
        const img = getColumnValue(values, headers, `additionalImage${i}_URL`);
        if (updateMode === 'FULL' || img) {
          product.images.additional.push(img);
        }
      }
    }
  }

  // Dimensions
  if (!selectedFields || selectedFields.includes('dimensions')) {
    const itemLength = getColumnValue(values, headers, 'itemLength');
    if (updateMode === 'FULL' || itemLength) {
      product.dimensions = {
        itemLength: itemLength,
        itemWidth: getColumnValue(values, headers, 'itemWidth'),
        itemHeight: getColumnValue(values, headers, 'itemHeight'),
        itemWeight: getColumnValue(values, headers, 'itemWeight'),
        packageLength: getColumnValue(values, headers, 'packageLength'),
        packageWidth: getColumnValue(values, headers, 'packageWidth'),
        packageHeight: getColumnValue(values, headers, 'packageHeight'),
        packageWeight: getColumnValue(values, headers, 'packageWeight')
      };
    }
  }

  // Pricing
  if (!selectedFields || selectedFields.includes('pricing')) {
    const ourPrice = getColumnValue(values, headers, 'ourPrice');
    if (updateMode === 'FULL' || ourPrice) {
      product.pricing = {
        ourPrice: ourPrice,
        currency: getColumnValue(values, headers, 'currency') || 'EUR',
        discountedPrice: getColumnValue(values, headers, 'discountedPrice'),
        discountStartDate: getColumnValue(values, headers, 'discountStartDate'),
        discountEndDate: getColumnValue(values, headers, 'discountEndDate')
      };
    }
  }

  // Inventory
  if (!selectedFields || selectedFields.includes('inventory')) {
    const quantity = getColumnValue(values, headers, 'quantity');
    if (updateMode === 'FULL' || quantity !== undefined && quantity !== '') {
      product.inventory = {
        quantity: quantity,
        fulfillmentChannel: getColumnValue(values, headers, 'fulfillmentChannel') || 'DEFAULT'
      };
    }
  }

  // Compliance
  if (!selectedFields || selectedFields.includes('compliance')) {
    const countryOfOrigin = getColumnValue(values, headers, 'countryOfOrigin');
    if (updateMode === 'FULL' || countryOfOrigin) {
      product.compliance = {
        countryOfOrigin: countryOfOrigin,
        batteriesRequired: getColumnValue(values, headers, 'batteriesRequired'),
        isLithiumBattery: getColumnValue(values, headers, 'isLithiumBattery'),
        supplierDeclaredDgHzRegulation: getColumnValue(values, headers, 'supplierDeclaredDgHzRegulation'),
        adultProduct: getColumnValue(values, headers, 'adultProduct')
      };
    }
  }

  // Variation info (always include if present)
  product.parentSKU = getColumnValue(values, headers, 'Parent SKU');
  product.parentASIN = getColumnValue(values, headers, 'Parent ASIN');

  return product;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getColumnValue(values, headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? values[index] : '';
}

function showProgress(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Processing...', -1);
}

function showError(message) {
  SpreadsheetApp.getUi().alert('Error', message, SpreadsheetApp.getUi().ButtonSet.OK);
  SpreadsheetApp.getActiveSpreadsheet().toast('');
}

function handleError(functionName, error) {
  Logger.log(`Error in ${functionName}: ${error.message}`);
  Logger.log(error.stack);

  showError(`An error occurred: ${error.message}\n\nCheck Logs sheet for details.`);
}
