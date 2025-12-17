/**
 * A+ Content Preview Generator
 *
 * Generates HTML preview of A+ Content that looks like Amazon's preview
 * Supports both A+ Basic and A+ Premium content types
 */

// ========================================
// WEB APP ENDPOINT - MUST BE DEPLOYED AS WEB APP
// ========================================

/**
 * Web App endpoint - serves the preview HTML
 * Deploy: Extensions > Apps Script > Deploy > New deployment > Web App
 * Access: Anyone with the link
 */
function doGet(e) {
  const cache = CacheService.getScriptCache();
  const previewId = e?.parameter?.id || 'latest';
  const html = cache.get(`preview_${previewId}`);

  if (!html) {
    return HtmlService.createHtmlOutput(`
      <html><body style="font-family:Arial;padding:40px;text-align:center;">
        <h2>Preview not found or expired</h2>
        <p>Preview ID: ${previewId}</p>
        <p>Previews expire after 6 hours. Please generate a new preview from Google Sheets.</p>
      </body></html>
    `).setTitle('Preview Not Found');
  }

  return HtmlService.createHtmlOutput(html)
    .setTitle('A+ Content Preview')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ========================================
// MAIN PREVIEW FUNCTION
// ========================================

/**
 * Generate A+ Preview for selected ASIN
 * Menu: NetAnaliza Manager > Tools > Generate A+ Preview
 */
function lukoGenerateAPlusPreview() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Use active sheet - must be APlusBasic or APlusPremium
  let sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();
  let contentType = 'basic';

  if (sheetName === 'APlusPremium') {
    contentType = 'premium';
  } else if (sheetName === 'APlusBasic') {
    contentType = 'basic';
  } else {
    // Not on an A+ sheet - try to find one
    sheet = ss.getSheetByName('APlusPremium');
    if (sheet) {
      contentType = 'premium';
    } else {
      sheet = ss.getSheetByName('APlusBasic');
      contentType = 'basic';
    }
  }

  if (!sheet) {
    ui.alert('Error', 'No A+ sheet found! Please open APlusBasic or APlusPremium sheet.', ui.ButtonSet.OK);
    return;
  }

  // Get selected rows with checkbox - use local function to avoid conflicts
  const selectedRows = getAPlusSelectedRows(sheet);

  Logger.log(`APlusPreview: Found ${selectedRows.length} selected rows in ${sheetName}`);

  if (selectedRows.length === 0) {
    ui.alert('No Selection', `No rows selected in ${sheetName}.\n\nPlease check the Export checkbox for rows you want to preview.`, ui.ButtonSet.OK);
    return;
  }

  // Group by ASIN
  const asinGroups = {};
  const headers = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (const row of selectedRows) {
    const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    const asin = getColumnValue(values, headers, 'ASIN');

    if (!asin) continue;

    if (!asinGroups[asin]) {
      asinGroups[asin] = [];
    }

    const moduleData = extractModuleDataForPreview(values, headers);
    Logger.log(`Row ${row}: Module ${moduleData.moduleNumber}, Type: ${moduleData.moduleType}, Fields: ${Object.keys(moduleData).join(', ')}`);

    asinGroups[asin].push({
      row: row,
      data: moduleData
    });
  }

  const asinCount = Object.keys(asinGroups).length;

  if (asinCount === 0) {
    ui.alert('Error', 'No valid ASINs found in selected rows.', ui.ButtonSet.OK);
    return;
  }

  try {
    // Get first ASIN
    const firstAsin = Object.keys(asinGroups)[0];
    const modules = asinGroups[firstAsin];

    // Sort modules by module number
    modules.sort((a, b) => (a.data.moduleNumber || 0) - (b.data.moduleNumber || 0));

    // Detect content type from module types
    const detectedType = detectAPlusType(modules);
    if (detectedType !== contentType) {
      contentType = detectedType;
    }

    // Generate HTML preview
    const html = generateAPlusHTML(firstAsin, modules, contentType);

    // Save to cache for Web App
    const previewId = firstAsin + '_' + Date.now();
    const cache = CacheService.getScriptCache();

    // Split HTML if too large (cache limit is 100KB per key)
    if (html.length > 90000) {
      // Store in chunks
      const chunks = Math.ceil(html.length / 90000);
      for (let i = 0; i < chunks; i++) {
        cache.put(`preview_${previewId}_${i}`, html.substring(i * 90000, (i + 1) * 90000), 21600);
      }
      cache.put(`preview_${previewId}`, `__CHUNKED__${chunks}`, 21600);
    } else {
      cache.put(`preview_${previewId}`, html, 21600); // 6 hours
    }
    cache.put('preview_latest', html.length > 90000 ? `__CHUNKED_REF__${previewId}` : html, 21600);

    // Also save to Drive
    const file = saveHTMLToDrive(firstAsin, html);

    // Get Web App URL (user must deploy first)
    const scriptId = ScriptApp.getScriptId();

    // Get saved Web App URL from properties
    const props = PropertiesService.getScriptProperties();
    const savedWebAppUrl = props.getProperty('PREVIEW_WEB_APP_URL') || '';

    // Show dialog with options
    const dialogHtml = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h3 { color: #232f3e; }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          margin: 10px 5px 10px 0;
          background: #ff9900;
          color: #0f1111;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        .btn:hover { background: #e88b00; }
        .btn-secondary { background: #e7e9ec; }
        .btn-primary { background: #007600; color: white; }
        .info { background: #f0f0f0; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 12px; }
        .success { color: green; }
        .url-saved { background: #d4edda; padding: 8px; border-radius: 4px; margin: 10px 0; color: #155724; }
        .type-badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .type-basic { background: #232f3e; color: white; }
        .type-premium { background: #ff9900; color: #0f1111; }
      </style>
      <h3>Preview Generated: ${firstAsin}</h3>
      <p>
        <span class="type-badge type-${contentType}">${contentType === 'premium' ? 'A+ Premium' : 'A+ Basic'}</span>
        <strong>${modules.length} module(s)</strong>
      </p>

      ${savedWebAppUrl ? `
        <div class="url-saved">Web App URL saved - click to open preview</div>
        <p>
          <a class="btn btn-primary" href="${savedWebAppUrl}?id=${previewId}" target="_blank">Open Preview in Browser</a>
        </p>
        <hr style="margin: 20px 0;">
      ` : ''}

      <h4>Download HTML</h4>
      <p>
        <a class="btn" href="${file.getDownloadUrl()}" target="_blank">Download HTML</a>
      </p>

      ${!savedWebAppUrl ? `
        <h4>Setup Web App URL (one time)</h4>
        <div class="info">
          1. Extensions > Apps Script > Deploy > Manage deployments<br>
          2. Copy the Web App URL<br>
          3. Paste below and click Save
        </div>
      ` : `
        <h4>Change Web App URL</h4>
      `}
      <input type="text" id="webAppUrl" value="${savedWebAppUrl}" placeholder="https://script.google.com/macros/s/..." style="width:100%;padding:8px;margin:5px 0;">
      <button class="btn btn-secondary" onclick="saveUrl()">Save URL</button>
      <button class="btn btn-secondary" onclick="openWebApp()">Open</button>

      <script>
        function saveUrl() {
          const url = document.getElementById('webAppUrl').value;
          if (url && url.includes('script.google.com')) {
            google.script.run.withSuccessHandler(function() {
              alert('URL saved! Next time it will open automatically.');
              location.reload();
            }).saveWebAppUrl(url);
          } else {
            alert('Please enter a valid Web App URL');
          }
        }
        function openWebApp() {
          const url = document.getElementById('webAppUrl').value || '${savedWebAppUrl}';
          if (url) {
            window.open(url + '?id=${previewId}', '_blank');
          } else {
            alert('Please enter Web App URL first');
          }
        }
      </script>
    `;

    const htmlOutput = HtmlService.createHtmlOutput(dialogHtml)
      .setWidth(500)
      .setHeight(450);

    ui.showModalDialog(htmlOutput, `A+ Preview: ${firstAsin}`);

  } catch (error) {
    ui.alert('Error', error.message + '\n\n' + error.stack, ui.ButtonSet.OK);
    Logger.log('Error in lukoGenerateAPlusPreview: ' + error.message + '\n' + error.stack);
  }
}

/**
 * Detect A+ type from module types
 * Premium modules include: HERO_IMAGE, wider layouts, premium-specific modules
 */
function detectAPlusType(modules) {
  const premiumModulePatterns = [
    'HERO', 'PREMIUM', 'FULL_WIDTH', 'FULL_IMAGE',
    'VIDEO', 'HOTSPOT', 'NAVIGATOR', 'Q_AND_A'
  ];

  for (const module of modules) {
    const type = (module.data.moduleType || '').toUpperCase();
    for (const pattern of premiumModulePatterns) {
      if (type.includes(pattern)) {
        return 'premium';
      }
    }
  }

  return 'basic';
}

/**
 * Save Web App URL to script properties
 */
function saveWebAppUrl(url) {
  PropertiesService.getScriptProperties().setProperty('PREVIEW_WEB_APP_URL', url);
  return true;
}

/**
 * Extract module data for preview from row values
 * ENHANCED: Now uses smart content detection for misaligned columns
 */
function extractModuleDataForPreview(values, headers) {
  // Get module number - ensure it's a number
  let moduleNumber = getColumnValue(values, headers, 'Module Number');
  if (typeof moduleNumber === 'string') {
    moduleNumber = parseInt(moduleNumber, 10);
  }
  if (!moduleNumber || isNaN(moduleNumber)) {
    moduleNumber = 1;
  }

  const data = {
    moduleNumber: moduleNumber,
    moduleType: getColumnValue(values, headers, 'Module Type') || 'STANDARD_TEXT',
    marketplace: getColumnValue(values, headers, 'Marketplace') || 'DE',
    language: getColumnValue(values, headers, 'Language') || 'DE',
    asin: getColumnValue(values, headers, 'ASIN') || ''
  };

  // FIXED: Always use m1_ prefix - each row has one module and uses m1_ columns
  const prefix = 'm1_';

  // Log all headers for debugging
  const m1Headers = headers.filter(h => h && h.startsWith(prefix));
  Logger.log(`extractModuleDataForPreview: Found ${m1Headers.length} m1_ headers`);

  // Extract all fields for this module AND collect text content for smart matching
  let fieldCount = 0;
  const foundFields = [];
  const textContents = []; // Collect all text for smart matching

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header && header.startsWith(prefix)) {
      const fieldName = header.substring(prefix.length);
      const value = values[i];
      if (value !== null && value !== undefined && value !== '') {
        const strValue = String(value).trim();
        if (strValue) {
          data[fieldName] = value;
          fieldCount++;

          // Log first 100 chars of value
          const shortValue = strValue.substring(0, 100);
          foundFields.push(`${fieldName}="${shortValue}"`);

          // Collect text content for smart matching (ignore images, real IDs, etc)
          const lowerValue = strValue.toLowerCase();
          const isImage = lowerValue.endsWith('.png') || lowerValue.endsWith('.jpg') ||
                         lowerValue.endsWith('.jpeg') || lowerValue.endsWith('.gif') ||
                         lowerValue.endsWith('.webp') || strValue.startsWith('http');

          // Check if the VALUE looks like a real ID (not the field name)
          // Real IDs: UUIDs, numeric values, short alphanumeric without spaces
          const looksLikeUUID = /^[a-f0-9-]{36}$/i.test(strValue);
          const looksLikeNumericId = /^\d+$/.test(strValue);
          const isShortNoSpaces = strValue.length < 30 && !strValue.includes(' ');
          const isRealId = looksLikeUUID || looksLikeNumericId || (isShortNoSpaces && fieldName.toLowerCase().includes('_id'));

          // Position values are usually short codes like "LEFT", "RIGHT", "CENTER"
          const isPositionValue = fieldName.toLowerCase().includes('position') && strValue.length < 20;

          // Text content: not an image, not a real ID, has reasonable length
          if (!isImage && !isRealId && !isPositionValue && strValue.length > 10) {
            textContents.push({ field: fieldName, value: strValue, length: strValue.length });
          }
        }
      }
    }
  }

  Logger.log(`extractModuleDataForPreview: moduleNumber=${moduleNumber}, type: ${data.moduleType}`);
  Logger.log(`extractModuleDataForPreview: fields found (${fieldCount}): ${foundFields.join('; ')}`);

  // SMART CONTENT DETECTION: If headline/body are missing, find them by content characteristics
  // Headline: typically shorter (< 150 chars), no line breaks
  // Body: typically longer, may have line breaks
  if (!data.headline && !data.body && textContents.length > 0) {
    Logger.log(`Smart matching: ${textContents.length} text fields found`);

    // Sort by length - shorter is likely headline, longer is likely body
    textContents.sort((a, b) => a.length - b.length);

    // Find potential headline (shorter, < 150 chars, no line breaks)
    const potentialHeadline = textContents.find(t =>
      t.length < 150 && !t.value.includes('\n')
    );

    // Find potential body (longer, > 100 chars)
    const potentialBody = textContents.find(t =>
      t.length > 100 && t !== potentialHeadline
    );

    if (potentialHeadline && !data.headline) {
      data.headline = potentialHeadline.value;
      Logger.log(`Smart match headline from ${potentialHeadline.field}: "${potentialHeadline.value.substring(0, 50)}..."`);
    }

    if (potentialBody && !data.body) {
      data.body = potentialBody.value;
      Logger.log(`Smart match body from ${potentialBody.field}: "${potentialBody.value.substring(0, 50)}..."`);
    }
  }

  // Also check for text in known wrong locations (from observed column misalignment)
  if (!data.headline && data.subheadline && data.subheadline.length > 0) {
    // subheadline might actually contain headline
    if (data.subheadline.length < 150 && !data.subheadline.includes('\n')) {
      data.headline = data.subheadline;
      Logger.log(`Using subheadline as headline: "${data.headline.substring(0, 50)}..."`);
    }
  }

  if (!data.body && data.backgroundImage_altText && data.backgroundImage_altText.length > 50) {
    // backgroundImage_altText might actually contain body text
    data.body = data.backgroundImage_altText;
    Logger.log(`Using backgroundImage_altText as body: "${data.body.substring(0, 50)}..."`);
  }

  // If no fields found with m1_ prefix, try common field names directly (old format)
  if (fieldCount === 0) {
    Logger.log('No fields found with m1_ prefix, trying direct field names...');
    const directFields = [
      'headline', 'subheadline', 'body',
      'image_url', 'image_altText', 'imagePositionType',
      'block1_headline', 'block1_body', 'block1_image_url',
      'block2_headline', 'block2_body', 'block2_image_url',
      'block3_headline', 'block3_body', 'block3_image_url',
      'block4_headline', 'block4_body', 'block4_image_url'
    ];
    for (const field of directFields) {
      const value = getColumnValue(values, headers, field);
      if (value) {
        data[field] = value;
        fieldCount++;
      }
    }
    Logger.log(`Fallback extraction found ${fieldCount} fields`);
  }

  return data;
}

/**
 * Get images from ImportedProducts sheet by ASIN
 * Returns array of image URLs: [mainImage, additional1, additional2, ...]
 */
function getImagesFromImportedProducts(asin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ImportedProducts');

  if (!sheet) {
    Logger.log('getImagesFromImportedProducts: ImportedProducts sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];

  // Find column indices
  const asinCol = headers.findIndex(h => (h || '').toString().toUpperCase() === 'ASIN');
  const mainImageCol = headers.findIndex(h => (h || '').toString().toLowerCase().includes('main image'));

  // Find additional image columns
  const additionalImageCols = [];
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toString().toLowerCase();
    if (h.includes('additional image')) {
      additionalImageCols.push(i);
    }
  }

  Logger.log(`getImagesFromImportedProducts: Looking for ASIN "${asin}", asinCol=${asinCol}, mainImageCol=${mainImageCol}, additionalCols=${additionalImageCols.join(',')}`);

  if (asinCol < 0) {
    Logger.log('getImagesFromImportedProducts: ASIN column not found');
    return [];
  }

  // Find row with matching ASIN
  for (let i = 1; i < data.length; i++) {
    const rowAsin = (data[i][asinCol] || '').toString().trim();
    if (rowAsin === asin) {
      const images = [];

      // Get main image
      if (mainImageCol >= 0) {
        const mainImg = (data[i][mainImageCol] || '').toString().trim();
        if (mainImg && mainImg.startsWith('http')) {
          images.push(mainImg);
        }
      }

      // Get additional images
      for (const col of additionalImageCols) {
        const img = (data[i][col] || '').toString().trim();
        if (img && img.startsWith('http')) {
          images.push(img);
        }
      }

      Logger.log(`getImagesFromImportedProducts: Found ${images.length} images for ASIN ${asin}`);
      return images;
    }
  }

  Logger.log(`getImagesFromImportedProducts: No row found for ASIN ${asin}`);
  return [];
}

/**
 * Generate complete HTML document for A+ Content preview
 */
function generateAPlusHTML(asin, modules, contentType) {
  const marketplace = modules[0]?.data?.marketplace || 'DE';
  const language = modules[0]?.data?.language || 'DE';
  const isPremium = contentType === 'premium';

  // Fetch images from ImportedProducts for this ASIN
  const productImages = getImagesFromImportedProducts(asin);
  Logger.log(`generateAPlusHTML: Got ${productImages.length} images from ImportedProducts for ${asin}`);

  let modulesHTML = '';
  let imageIndex = 0; // Track which product image to use next

  for (const module of modules) {
    // Pass product images and current index to module generator
    const result = generateModuleHTML(module.data, isPremium, productImages, imageIndex);
    modulesHTML += result.html;
    imageIndex = result.nextImageIndex; // Update index for next module
  }

  const marketplaceNames = {
    'DE': 'Germany (amazon.de)',
    'UK': 'United Kingdom (amazon.co.uk)',
    'FR': 'France (amazon.fr)',
    'IT': 'Italy (amazon.it)',
    'ES': 'Spain (amazon.es)',
    'NL': 'Netherlands (amazon.nl)',
    'PL': 'Poland (amazon.pl)',
    'SE': 'Sweden (amazon.se)',
    'BE': 'Belgium (amazon.com.be)',
    'US': 'United States (amazon.com)',
    'CA': 'Canada (amazon.ca)',
    'MX': 'Mexico (amazon.com.mx)',
    'BR': 'Brazil (amazon.com.br)',
    'JP': 'Japan (amazon.co.jp)',
    'AU': 'Australia (amazon.com.au)',
    'IN': 'India (amazon.in)',
    'AE': 'UAE (amazon.ae)',
    'SA': 'Saudi Arabia (amazon.sa)',
    'SG': 'Singapore (amazon.sg)'
  };

  const languageNames = {
    'DE': 'German (Deutsch)',
    'EN': 'English',
    'FR': 'French (Francais)',
    'IT': 'Italian (Italiano)',
    'ES': 'Spanish (Espanol)',
    'NL': 'Dutch (Nederlands)',
    'PL': 'Polish (Polski)',
    'SV': 'Swedish (Svenska)',
    'PT': 'Portuguese (Portugues)',
    'JA': 'Japanese',
    'ZH': 'Chinese',
    'AR': 'Arabic'
  };

  return `<!DOCTYPE html>
<html lang="${language.toLowerCase()}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A+ Content Preview - ${asin}</title>
  <style>
    ${getAmazonCSS(isPremium)}
  </style>
</head>
<body>
  <div class="preview-wrapper">
    <!-- Preview Notice Banner -->
    <div class="preview-notice">
      <div class="notice-content">
        <div class="notice-icon">&#9888;</div>
        <div class="notice-text">
          <strong>PREVIEW</strong> - This is a visualization of Amazon A+ Content section, not a live page.
          <br>
          <span class="notice-subtext">
            The texts, images, and videos will be customized according to your requirements.
          </span>
        </div>
      </div>
      <div class="notice-cta">
        <a href="https://ads.netanaliza.com/lacm" target="_blank" class="notice-button">
          Order A+ Content &rarr;
        </a>
        <div class="notice-service">
          <strong>LUKO Amazon Content Manager</strong> - professional A+ Content creation for Amazon sellers
        </div>
      </div>
    </div>

    <!-- Header with A+ Type Badge -->
    <div class="preview-header">
      <div class="header-content">
        <div class="aplus-type-badge ${isPremium ? 'premium' : 'basic'}">
          ${isPremium ? 'A+ Premium Content' : 'A+ Basic Content'}
        </div>
        <div class="preview-meta">
          <div class="meta-item">
            <span class="meta-label">ASIN:</span>
            <span class="meta-value">${asin}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Marketplace:</span>
            <span class="meta-value">${marketplaceNames[marketplace] || marketplace}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Language:</span>
            <span class="meta-value">${languageNames[language] || language}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Amazon A+ Content Container -->
    <div id="aplus" class="aplus-v2 celwidget" data-asin="${asin}">
      <div class="${isPremium ? 'premium-aplus' : 'aplus-standard'}">
        ${modulesHTML}
      </div>
    </div>

    <!-- Footer -->
    <div class="preview-footer">
      <div class="footer-content">
        <div class="generated-by">
          Generated by <a href="https://ads.netanaliza.com/lacm" target="_blank">LUKO Amazon Content Manager</a>
        </div>
        <div class="timestamp">${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</div>
        <div class="contact">
          Support: <a href="mailto:support@netanaliza.com">support@netanaliza.com</a>
        </div>
        <div class="order-cta">
          <a href="https://ads.netanaliza.com/lacm" target="_blank">Order A+ Content for your product</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML for a single module based on its type
 * @param {Object} data - Module data
 * @param {boolean} isPremium - Is this premium A+ content
 * @param {string[]} productImages - Array of product image URLs from ImportedProducts
 * @param {number} imageIndex - Starting index in productImages array
 * @returns {Object} { html: string, nextImageIndex: number }
 */
function generateModuleHTML(data, isPremium, productImages, imageIndex) {
  productImages = productImages || [];
  imageIndex = imageIndex || 0;

  const moduleType = data.moduleType || 'STANDARD_TEXT';

  // Log all available data for debugging
  Logger.log(`generateModuleHTML: type=${moduleType}, fields=${JSON.stringify(Object.keys(data))}`);

  // Collect ALL image URLs from the module data (any field containing http/https)
  const moduleImages = [];
  const allTextContent = [];

  for (const [key, value] of Object.entries(data)) {
    if (!value) continue;
    if (['moduleNumber', 'moduleType', 'marketplace', 'language', 'asin'].includes(key)) continue;

    const strValue = String(value).trim();
    if (!strValue) continue;

    const lowerValue = strValue.toLowerCase();
    const lowerKey = key.toLowerCase();

    // Is it a real URL (not just a filename)?
    const isUrl = strValue.startsWith('http') || strValue.startsWith('//');

    if (isUrl) {
      const altKey = key.replace(/_url$/i, '_altText').replace(/Url$/i, 'AltText');
      moduleImages.push({
        key,
        url: strValue,
        alt: data[altKey] || 'Product image'
      });
      Logger.log(`generateModuleHTML: Found module image URL: ${key} = ${strValue.substring(0, 80)}...`);
    } else if (typeof value === 'string' && strValue.length > 3 &&
               !lowerKey.includes('url') && !lowerKey.includes('alttext') &&
               !lowerKey.includes('position') && !lowerKey.includes('_id')) {
      allTextContent.push({ key, value: strValue });
    }
  }

  // Helper function to get next product image (cycles through if needed)
  const getNextProductImage = () => {
    if (productImages.length === 0) return null;
    const img = productImages[imageIndex % productImages.length];
    imageIndex++;
    return img;
  };

  // Determine primary image: prefer module image URL, fallback to product image
  let imageUrl = '';
  let imageAlt = 'Product image';

  if (moduleImages.length > 0 && moduleImages[0].url.startsWith('http')) {
    // Use module's own image if it's a real URL
    imageUrl = moduleImages[0].url;
    imageAlt = moduleImages[0].alt;
  } else if (productImages.length > 0) {
    // Use product image from ImportedProducts
    imageUrl = getNextProductImage();
    Logger.log(`generateModuleHTML: Using ImportedProducts image: ${imageUrl.substring(0, 80)}...`);
  }

  // Get text fields - try multiple possible names, including misaligned columns
  let headline = data.headline || data.subheadline || data.title || data.header || '';
  let body = data.body || data.text || data.description || data.content || '';

  // Additional fallbacks for misaligned data - product_asin fields often contain headlines
  if (!headline) {
    const potentialHeadlines = [
      data.product3_asin, data.product3_image_id, data.product1_asin,
      data.imagePositionType // Sometimes contains headline text
    ].filter(v => v && typeof v === 'string' && v.includes(' ') && v.length > 10 && v.length < 150);

    if (potentialHeadlines.length > 0) {
      headline = potentialHeadlines[0];
    }
  }

  // Body fallbacks
  if (!body) {
    const potentialBodies = [
      data.backgroundImage_id, data.backgroundImage_altText, data.image_altText,
      data.spec4_name // Sometimes contains description
    ].filter(v => v && typeof v === 'string' && v.length > 50 && !v.endsWith('.png') && !v.endsWith('.jpg'));

    if (potentialBodies.length > 0) {
      body = potentialBodies[0];
    }
  }

  Logger.log(`generateModuleHTML: headline="${(headline || '').substring(0, 50)}...", body="${(body || '').substring(0, 50)}...", imageUrl="${imageUrl ? imageUrl.substring(0, 50) + '...' : 'none'}"`);

  // Build module based on type
  let html = '';

  // For multi-image modules, we need to get multiple images from productImages
  const getImagesForModule = (count) => {
    const images = [];
    for (let i = 0; i < count; i++) {
      if (productImages.length > 0) {
        images.push(productImages[imageIndex % productImages.length]);
        imageIndex++;
      }
    }
    return images;
  };

  switch (moduleType) {
    case 'STANDARD_COMPANY_LOGO':
      html = generateCompanyLogoModule(data, moduleImages, imageUrl);
      break;
    case 'STANDARD_SINGLE_SIDE_IMAGE':
      html = generateSingleSideImageModule(data, headline, body, imageUrl, imageAlt);
      break;
    case 'STANDARD_HEADER_IMAGE_TEXT':
      html = generateHeaderImageTextModule(data, headline, body, imageUrl, imageAlt);
      break;
    case 'STANDARD_FOUR_IMAGE_TEXT':
    case 'STANDARD_FOUR_IMAGE_TEXT_QUADRANT':
      // Get 4 images for this module
      html = generateFourImageTextModule(data, headline, moduleImages, productImages, imageIndex);
      imageIndex += 4; // Reserve 4 images
      break;
    case 'STANDARD_THREE_IMAGE_TEXT':
      // Get 3 images for this module
      html = generateThreeImageTextModule(data, headline, moduleImages, productImages, imageIndex);
      imageIndex += 3; // Reserve 3 images
      break;
    case 'STANDARD_SINGLE_IMAGE_HIGHLIGHTS':
      html = generateSingleImageHighlightsModule(data, headline, imageUrl, imageAlt);
      break;
    case 'STANDARD_SINGLE_IMAGE_SPECS_DETAIL':
      html = generateSingleImageSpecsModule(data, headline, imageUrl, imageAlt);
      break;
    case 'STANDARD_TEXT':
      html = generateTextModule(headline, body);
      break;
    case 'STANDARD_IMAGE_SIDEBAR':
      html = generateImageSidebarModule(data, headline, body, imageUrl, imageAlt);
      break;
    case 'STANDARD_MULTIPLE_IMAGE_TEXT_A':
    case 'STANDARD_MULTIPLE_IMAGE_TEXT_B':
      html = generateMultipleImageTextModule(data, headline, body, moduleImages, productImages, imageIndex);
      imageIndex += 6; // Reserve up to 6 images
      break;
    case 'STANDARD_TECH_SPECS':
      html = generateTechSpecsModule(data, headline);
      break;
    case 'STANDARD_COMPARISON_TABLE':
      html = generateComparisonTableModule(data, headline, productImages, imageIndex);
      imageIndex += 6; // Reserve images for comparison products
      break;
    default:
      html = generateGenericModule(data, headline, body, imageUrl, imageAlt, moduleImages, allTextContent, productImages, imageIndex);
      imageIndex += 1;
  }

  return { html, nextImageIndex: imageIndex };
}

/**
 * STANDARD_COMPANY_LOGO module
 */
function generateCompanyLogoModule(data, moduleImages, fallbackImageUrl) {
  // Try to get logo from module data first, then fallback
  const logoUrl = data.companyLogo_url || data.logo_url || data.image_url ||
                  (moduleImages.length > 0 ? moduleImages[0].url : '') ||
                  fallbackImageUrl || '';
  const logoAlt = data.companyLogo_altText || data.logo_altText || 'Company Logo';
  const description = data.body || data.companyDescription || data.description || '';

  return `
    <div class="apm-brand-story-card apm-brand-story-background">
      <div class="apm-brand-story-logo-image">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logoAlt)}" class="apm-brand-story-logo-image-img">` : ''}
      </div>
      ${description ? `<div class="apm-brand-story-text-content"><p>${formatTextWithStyles(description)}</p></div>` : ''}
    </div>
  `;
}

/**
 * STANDARD_SINGLE_SIDE_IMAGE module
 */
function generateSingleSideImageModule(data, headline, body, imageUrl, imageAlt) {
  const position = (data.imagePositionType || 'LEFT').toUpperCase();
  const isRight = position === 'RIGHT';

  const imageBlock = `
    <div class="apm-sideimage-imagewrapper">
      <div class="apm-sideimage-image">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" class="apm-sideimage-image-img">` : getPlaceholderImageTag(300, 300)}
      </div>
    </div>
  `;

  const textBlock = `
    <div class="apm-sideimage-textwrapper">
      ${headline ? `<h3 class="apm-sideimage-headline">${escapeHtml(headline)}</h3>` : ''}
      ${body ? `<div class="apm-sideimage-text">${formatTextWithStyles(body)}</div>` : ''}
    </div>
  `;

  return `
    <div class="apm-sidemodule ${isRight ? 'apm-sidemodule-imageleft' : ''}">
      ${isRight ? textBlock + imageBlock : imageBlock + textBlock}
    </div>
  `;
}

/**
 * STANDARD_HEADER_IMAGE_TEXT module
 */
function generateHeaderImageTextModule(data, headline, body, imageUrl, imageAlt) {
  return `
    <div class="apm-hovermodule">
      <div class="apm-hovermodule-imagecontainer">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" class="apm-hovermodule-image-img">` : getPlaceholderImageTag(970, 600)}
      </div>
      <div class="apm-hovermodule-textcontainer">
        ${headline ? `<h2 class="apm-hovermodule-headline">${escapeHtml(headline)}</h2>` : ''}
        ${body ? `<div class="apm-hovermodule-text">${formatTextWithStyles(body)}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * STANDARD_FOUR_IMAGE_TEXT module
 * Uses productImages from ImportedProducts as fallback
 */
function generateFourImageTextModule(data, headline, moduleImages, productImages, startIndex) {
  productImages = productImages || [];
  startIndex = startIndex || 0;

  // Try to find main headline from various sources (data may be in wrong columns)
  if (!headline) {
    headline = data.product3_asin || data.product3_image_id || data.product1_asin ||
               data.headline || data.title || '';
    // Only use if it looks like text (has spaces, reasonable length)
    if (headline && (!headline.includes(' ') || headline.length < 10 || headline.length > 200)) {
      headline = '';
    }
  }

  // Due to column misalignment, blocks may be in hotspot fields
  // Mapping observed: hotspot3_x/title = headlines, hotspot3_y/text = bodies
  const hotspotBlocks = [
    { headline: data.hotspot3_x || '', body: data.hotspot3_y || '' },
    { headline: data.hotspot3_title || '', body: data.hotspot3_text || '' },
    { headline: data.hotspot4_x || '', body: data.hotspot4_y || '' },
    { headline: data.hotspot4_title || '', body: data.hotspot4_text || '' }
  ];

  // Try to find images from various naming patterns
  const blocks = [];
  for (let i = 1; i <= 4; i++) {
    // Try module data first, then fallback to product images
    let imgUrl = data[`block${i}_image_url`] || data[`image${i}_url`] ||
                 data[`block${i}_imageCrop_url`] || data[`imageCrop${i}_url`] ||
                 data[`block${i}Image_url`] || data[`block${i}image_url`] ||
                 (moduleImages && moduleImages[i-1] ? moduleImages[i-1].url : '');

    // If no URL from module, use product image (cycling through available images)
    if ((!imgUrl || !imgUrl.startsWith('http')) && productImages.length > 0) {
      const productImgIndex = (startIndex + i - 1) % productImages.length;
      imgUrl = productImages[productImgIndex];
    }

    const imgAlt = data[`block${i}_image_altText`] || data[`image${i}_altText`] ||
                   data[`block${i}_imageCrop_altText`] || `Feature ${i}`;

    // Try multiple naming conventions for text, including hotspot fallback
    let blockHeadline = data[`block${i}_headline`] || data[`headline${i}`] ||
                        data[`block${i}headline`] || data[`textBlock${i}_headline`] || '';

    let blockBody = data[`block${i}_body`] || data[`body${i}`] ||
                    data[`block${i}body`] || data[`textBlock${i}_body`] || '';

    // Fallback to hotspot fields if standard fields empty
    if (!blockHeadline && hotspotBlocks[i-1]) {
      const hb = hotspotBlocks[i-1];
      // Only use if it looks like text (has spaces, reasonable length)
      if (hb.headline && hb.headline.includes(' ') && hb.headline.length > 5 && hb.headline.length < 100) {
        blockHeadline = hb.headline;
      }
    }
    if (!blockBody && hotspotBlocks[i-1]) {
      const hb = hotspotBlocks[i-1];
      if (hb.body && hb.body.length > 20 && !hb.body.endsWith('.png') && !hb.body.endsWith('.jpg')) {
        blockBody = hb.body;
      }
    }

    blocks.push({
      imageUrl: imgUrl,
      imageAlt: imgAlt,
      headline: blockHeadline,
      body: blockBody
    });
  }

  return `
    <div class="apm-fourcolumnmodule">
      ${headline ? `<h2 class="apm-fourcolumnmodule-headline">${escapeHtml(headline)}</h2>` : ''}
      <div class="apm-fourcolumnmodule-grid">
        ${blocks.map(b => `
          <div class="apm-fourcolumnmodule-column">
            <div class="apm-fourcolumnmodule-imagewrapper">
              ${b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.imageAlt)}" class="apm-fourcolumnmodule-image">` : getPlaceholderImageTag(220, 220)}
            </div>
            ${b.headline ? `<h4 class="apm-fourcolumnmodule-column-headline">${escapeHtml(b.headline)}</h4>` : ''}
            ${b.body ? `<p class="apm-fourcolumnmodule-column-text">${escapeHtml(b.body)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * STANDARD_THREE_IMAGE_TEXT module
 * Uses productImages from ImportedProducts as fallback
 */
function generateThreeImageTextModule(data, headline, moduleImages, productImages, startIndex) {
  productImages = productImages || [];
  startIndex = startIndex || 0;

  // Try to find images from various naming patterns
  const blocks = [];
  for (let i = 1; i <= 3; i++) {
    // Try module data first, then fallback to product images
    let imgUrl = data[`block${i}_image_url`] || data[`image${i}_url`] ||
                 data[`block${i}_imageCrop_url`] || data[`imageCrop${i}_url`] ||
                 data[`block${i}Image_url`] || data[`block${i}image_url`] ||
                 (moduleImages && moduleImages[i-1] ? moduleImages[i-1].url : '');

    // If no URL from module, use product image (cycling through available images)
    if ((!imgUrl || !imgUrl.startsWith('http')) && productImages.length > 0) {
      const productImgIndex = (startIndex + i - 1) % productImages.length;
      imgUrl = productImages[productImgIndex];
    }

    const imgAlt = data[`block${i}_image_altText`] || data[`image${i}_altText`] ||
                   data[`block${i}_imageCrop_altText`] || `Feature ${i}`;

    // Try multiple naming conventions for text
    const blockHeadline = data[`block${i}_headline`] || data[`headline${i}`] ||
                          data[`block${i}headline`] || data[`textBlock${i}_headline`] || '';

    const blockBody = data[`block${i}_body`] || data[`body${i}`] ||
                      data[`block${i}body`] || data[`textBlock${i}_body`] || '';

    blocks.push({
      imageUrl: imgUrl,
      imageAlt: imgAlt,
      headline: blockHeadline,
      body: blockBody
    });
  }

  return `
    <div class="apm-threecolumnmodule">
      ${headline ? `<h2 class="apm-threecolumnmodule-headline">${escapeHtml(headline)}</h2>` : ''}
      <div class="apm-threecolumnmodule-grid">
        ${blocks.map(b => `
          <div class="apm-threecolumnmodule-column">
            <div class="apm-threecolumnmodule-imagewrapper">
              ${b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.imageAlt)}" class="apm-threecolumnmodule-image">` : getPlaceholderImageTag(300, 300)}
            </div>
            ${b.headline ? `<h4 class="apm-threecolumnmodule-column-headline">${escapeHtml(b.headline)}</h4>` : ''}
            ${b.body ? `<p class="apm-threecolumnmodule-column-text">${escapeHtml(b.body)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * STANDARD_SINGLE_IMAGE_HIGHLIGHTS module
 */
function generateSingleImageHighlightsModule(data, headline, imageUrl, imageAlt) {
  const highlights = [];
  for (let i = 1; i <= 6; i++) {
    const h = data[`highlight${i}`] || data[`bulletPoint${i}`];
    if (h) highlights.push(h);
  }

  return `
    <div class="apm-singleimagehighlights">
      <div class="apm-singleimagehighlights-imagewrapper">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" class="apm-singleimagehighlights-image">` : getPlaceholderImageTag(300, 300)}
      </div>
      <div class="apm-singleimagehighlights-content">
        ${headline ? `<h3 class="apm-singleimagehighlights-headline">${escapeHtml(headline)}</h3>` : ''}
        ${highlights.length > 0 ? `
          <ul class="apm-singleimagehighlights-list">
            ${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * STANDARD_SINGLE_IMAGE_SPECS_DETAIL module
 */
function generateSingleImageSpecsModule(data, headline, imageUrl, imageAlt) {
  const specs = [];
  for (let i = 1; i <= 8; i++) {
    const label = data[`specLabel${i}`] || data[`spec${i}_label`] || data[`spec${i}_name`];
    const value = data[`specValue${i}`] || data[`spec${i}_value`] || data[`spec${i}_definition`];
    if (label && value) specs.push({ label, value });
  }

  return `
    <div class="apm-specsmodule">
      <div class="apm-specsmodule-imagewrapper">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" class="apm-specsmodule-image">` : getPlaceholderImageTag(300, 300)}
      </div>
      <div class="apm-specsmodule-content">
        ${headline ? `<h3 class="apm-specsmodule-headline">${escapeHtml(headline)}</h3>` : ''}
        ${specs.length > 0 ? `
          <table class="apm-specsmodule-table">
            <tbody>
              ${specs.map(s => `<tr><th>${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * STANDARD_TEXT module
 */
function generateTextModule(headline, body) {
  return `
    <div class="apm-textmodule">
      ${headline ? `<h2 class="apm-textmodule-headline">${escapeHtml(headline)}</h2>` : ''}
      ${body ? `<div class="apm-textmodule-body">${formatTextWithStyles(body)}</div>` : ''}
    </div>
  `;
}

/**
 * STANDARD_IMAGE_SIDEBAR module
 */
function generateImageSidebarModule(data, headline, body, imageUrl, imageAlt) {
  return `
    <div class="apm-imagesidebar">
      <div class="apm-imagesidebar-main">
        ${headline ? `<h2 class="apm-imagesidebar-headline">${escapeHtml(headline)}</h2>` : ''}
        ${body ? `<div class="apm-imagesidebar-body">${formatTextWithStyles(body)}</div>` : ''}
      </div>
      <div class="apm-imagesidebar-sidebar">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" class="apm-imagesidebar-image">` : getPlaceholderImageTag(220, 220)}
      </div>
    </div>
  `;
}

/**
 * STANDARD_MULTIPLE_IMAGE_TEXT module
 * Uses productImages from ImportedProducts as fallback
 */
function generateMultipleImageTextModule(data, headline, body, moduleImages, productImages, startIndex) {
  productImages = productImages || [];
  startIndex = startIndex || 0;

  // Collect images from module data first
  let images = moduleImages.filter(img => img.url && img.url.startsWith('http')).slice(0, 6);

  // If not enough images from module, fill with product images
  if (images.length < 6 && productImages.length > 0) {
    const neededImages = 6 - images.length;
    for (let i = 0; i < neededImages && productImages.length > 0; i++) {
      const imgIndex = (startIndex + i) % productImages.length;
      images.push({ url: productImages[imgIndex], alt: 'Product image' });
    }
  }

  return `
    <div class="apm-multipleimages">
      ${headline ? `<h2 class="apm-multipleimages-headline">${escapeHtml(headline)}</h2>` : ''}
      ${body ? `<div class="apm-multipleimages-body">${formatTextWithStyles(body)}</div>` : ''}
      ${images.length > 0 ? `
        <div class="apm-multipleimages-grid">
          ${images.map(img => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}" class="apm-multipleimages-image">`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * STANDARD_TECH_SPECS module
 */
function generateTechSpecsModule(data, headline) {
  const specs = [];
  for (let i = 1; i <= 16; i++) {
    const label = data[`spec${i}_label`] || data[`spec${i}_name`] || data[`specLabel${i}`];
    const value = data[`spec${i}_value`] || data[`spec${i}_definition`] || data[`specValue${i}`];
    if (label && value) specs.push({ label, value });
  }

  return `
    <div class="apm-techspecs">
      ${headline ? `<h2 class="apm-techspecs-headline">${escapeHtml(headline || 'Technical Specifications')}</h2>` : ''}
      <table class="apm-techspecs-table">
        <tbody>
          ${specs.map(s => `
            <tr>
              <th class="apm-techspecs-label">${escapeHtml(s.label)}</th>
              <td class="apm-techspecs-value">${escapeHtml(s.value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * STANDARD_COMPARISON_TABLE module
 * Uses productImages from ImportedProducts as fallback
 */
function generateComparisonTableModule(data, headline, productImages, startIndex) {
  productImages = productImages || [];
  startIndex = startIndex || 0;

  const products = [];
  for (let i = 1; i <= 6; i++) {
    const title = data[`product${i}_title`] || data[`product${i}_name`];
    if (title) {
      let imgUrl = data[`product${i}_image_url`] || '';

      // If no image URL, use product image from ImportedProducts
      if ((!imgUrl || !imgUrl.startsWith('http')) && productImages.length > 0) {
        const imgIndex = (startIndex + products.length) % productImages.length;
        imgUrl = productImages[imgIndex];
      }

      products.push({
        title,
        asin: data[`product${i}_asin`] || '',
        imageUrl: imgUrl,
        highlight: data[`product${i}_highlight`] === 'TRUE' || data[`product${i}_highlight`] === true
      });
    }
  }

  const metrics = [];
  for (let i = 1; i <= 10; i++) {
    const name = data[`metric${i}_name`] || data[`row${i}_label`];
    if (name) {
      const values = [];
      for (let j = 1; j <= 6; j++) {
        values.push(data[`metric${i}_product${j}`] || data[`row${i}_product${j}`] || '');
      }
      metrics.push({ name, values });
    }
  }

  return `
    <div class="apm-comparison">
      ${headline ? `<h2 class="apm-comparison-headline">${escapeHtml(headline)}</h2>` : ''}
      <div class="apm-comparison-table-wrapper">
        <table class="apm-comparison-table">
          <thead>
            <tr>
              <th></th>
              ${products.map(p => `
                <th class="${p.highlight ? 'apm-comparison-highlight' : ''}">
                  ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" class="apm-comparison-product-image">` : ''}
                  <span class="apm-comparison-product-title">${escapeHtml(p.title)}</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${metrics.map(m => `
              <tr>
                <th class="apm-comparison-metric">${escapeHtml(m.name)}</th>
                ${m.values.slice(0, products.length).map((v, i) => `
                  <td class="${products[i]?.highlight ? 'apm-comparison-highlight' : ''}">${escapeHtml(v) || '-'}</td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Generic module for unknown types - shows all available content
 * Uses productImages from ImportedProducts as fallback
 */
function generateGenericModule(data, headline, body, imageUrl, imageAlt, moduleImages, allTextContent, productImages, startIndex) {
  productImages = productImages || [];
  startIndex = startIndex || 0;

  // If no imageUrl, use product image
  if (!imageUrl && productImages.length > 0) {
    imageUrl = productImages[startIndex % productImages.length];
    imageAlt = 'Product image';
  }

  const otherImages = moduleImages.filter(img => img.url !== imageUrl && img.url.startsWith('http')).slice(0, 4);
  const otherText = allTextContent.filter(t =>
    t.value !== headline && t.value !== body &&
    !t.key.includes('altText') && !t.key.includes('position')
  );

  return `
    <div class="apm-genericmodule">
      <div class="apm-genericmodule-type">${escapeHtml(data.moduleType || 'Module')}</div>

      ${imageUrl ? `
        <div class="apm-genericmodule-mainimage">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}">
        </div>
      ` : ''}

      ${headline ? `<h2 class="apm-genericmodule-headline">${escapeHtml(headline)}</h2>` : ''}
      ${body ? `<div class="apm-genericmodule-body">${formatTextWithStyles(body)}</div>` : ''}

      ${otherImages.length > 0 ? `
        <div class="apm-genericmodule-gallery">
          ${otherImages.map(img => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}">`).join('')}
        </div>
      ` : ''}

    </div>
  `;
}

/**
 * Get placeholder image HTML tag
 */
function getPlaceholderImageTag(width, height) {
  return `<div class="apm-placeholder" style="width:${width}px;height:${height}px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">${width}x${height}</div>`;
}

/**
 * Get placeholder image URL
 */
function getPlaceholderImage(width, height) {
  return `https://via.placeholder.com/${width}x${height}/f0f0f0/666666?text=${width}x${height}`;
}

/**
 * Format text with markdown-like styles to HTML
 */
function formatTextWithStyles(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Bullet lists: - item
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  }

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get Amazon-style CSS
 */
function getAmazonCSS(isPremium) {
  const maxWidth = isPremium ? '1464px' : '970px';

  return `
    /* Reset & Base */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: "Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.465;
      color: #0F1111;
      background: #eaeded;
      -webkit-font-smoothing: antialiased;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    /* Preview Wrapper */
    .preview-wrapper {
      max-width: ${maxWidth};
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    /* Preview Notice Banner */
    .preview-notice {
      background: linear-gradient(135deg, #ff9900 0%, #ffad33 100%);
      padding: 20px 30px;
      color: #0f1111;
      border-bottom: 3px solid #e88b00;
    }

    .notice-content {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 15px;
    }

    .notice-icon {
      font-size: 28px;
      line-height: 1;
      flex-shrink: 0;
    }

    .notice-text {
      font-size: 14px;
      line-height: 1.5;
    }

    .notice-text strong {
      font-size: 16px;
      display: inline-block;
      margin-bottom: 4px;
    }

    .notice-subtext {
      font-size: 13px;
      opacity: 0.9;
    }

    .notice-cta {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .notice-button {
      display: inline-block;
      background: #232f3e;
      color: #fff;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: background 0.2s;
    }

    .notice-button:hover {
      background: #37475a;
    }

    .notice-service {
      font-size: 13px;
      max-width: 400px;
    }

    .notice-service strong {
      display: block;
      font-size: 14px;
    }

    /* Preview Header */
    .preview-header {
      background: linear-gradient(135deg, #232f3e 0%, #37475a 100%);
      padding: 24px 30px;
      color: #fff;
    }

    .header-content {
      max-width: 100%;
    }

    .aplus-type-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    .aplus-type-badge.basic {
      background: #fff;
      color: #232f3e;
    }

    .aplus-type-badge.premium {
      background: linear-gradient(135deg, #ff9900 0%, #ffad33 100%);
      color: #0f1111;
    }

    .preview-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }

    .meta-item {
      background: rgba(255,255,255,0.1);
      padding: 8px 14px;
      border-radius: 4px;
    }

    .meta-label {
      color: rgba(255,255,255,0.7);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 13px;
      font-weight: 500;
    }

    /* Amazon A+ Container */
    #aplus {
      padding: 0;
    }

    .aplus-standard,
    .premium-aplus {
      padding: 0;
    }

    /* ============================================
       AMAZON A+ MODULE STYLES
       ============================================ */

    /* Brand Story / Company Logo */
    .apm-brand-story-card {
      padding: 40px;
      text-align: center;
      background: #fafafa;
    }

    .apm-brand-story-logo-image {
      margin-bottom: 20px;
    }

    .apm-brand-story-logo-image-img {
      max-width: 600px;
      max-height: 180px;
    }

    .apm-brand-story-text-content {
      max-width: 800px;
      margin: 0 auto;
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }

    /* Side Image Module */
    .apm-sidemodule {
      display: flex;
      padding: 30px;
      gap: 30px;
      align-items: flex-start;
    }

    .apm-sidemodule-imageleft {
      flex-direction: row-reverse;
    }

    .apm-sideimage-imagewrapper {
      flex: 0 0 300px;
    }

    .apm-sideimage-image-img {
      width: 100%;
      height: auto;
      border-radius: 4px;
    }

    .apm-sideimage-textwrapper {
      flex: 1;
    }

    .apm-sideimage-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .apm-sideimage-text {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }

    /* Header Image Text Module (Hover Module) */
    .apm-hovermodule {
      position: relative;
    }

    .apm-hovermodule-imagecontainer {
      width: 100%;
    }

    .apm-hovermodule-image-img {
      width: 100%;
      height: auto;
      display: block;
    }

    .apm-hovermodule-textcontainer {
      padding: 30px;
    }

    .apm-hovermodule-headline {
      font-size: 24px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 12px;
    }

    .apm-hovermodule-text {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }

    /* Four Column Module */
    .apm-fourcolumnmodule {
      padding: 30px;
    }

    .apm-fourcolumnmodule-headline {
      font-size: 24px;
      font-weight: 700;
      color: #0F1111;
      text-align: center;
      margin-bottom: 24px;
    }

    .apm-fourcolumnmodule-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .apm-fourcolumnmodule-column {
      text-align: center;
    }

    .apm-fourcolumnmodule-imagewrapper {
      margin-bottom: 12px;
    }

    .apm-fourcolumnmodule-image {
      width: 100%;
      max-width: 220px;
      height: auto;
      border-radius: 4px;
    }

    .apm-fourcolumnmodule-column-headline {
      font-size: 14px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 8px;
    }

    .apm-fourcolumnmodule-column-text {
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    /* Three Column Module */
    .apm-threecolumnmodule {
      padding: 30px;
    }

    .apm-threecolumnmodule-headline {
      font-size: 24px;
      font-weight: 700;
      color: #0F1111;
      text-align: center;
      margin-bottom: 24px;
    }

    .apm-threecolumnmodule-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .apm-threecolumnmodule-column {
      text-align: center;
    }

    .apm-threecolumnmodule-imagewrapper {
      margin-bottom: 12px;
    }

    .apm-threecolumnmodule-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      border-radius: 4px;
    }

    .apm-threecolumnmodule-column-headline {
      font-size: 15px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 8px;
    }

    .apm-threecolumnmodule-column-text {
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    /* Single Image Highlights */
    .apm-singleimagehighlights {
      display: flex;
      padding: 30px;
      gap: 30px;
      align-items: flex-start;
    }

    .apm-singleimagehighlights-imagewrapper {
      flex: 0 0 300px;
    }

    .apm-singleimagehighlights-image {
      width: 100%;
      border-radius: 4px;
    }

    .apm-singleimagehighlights-content {
      flex: 1;
    }

    .apm-singleimagehighlights-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 16px;
    }

    .apm-singleimagehighlights-list {
      list-style: none;
      padding: 0;
    }

    .apm-singleimagehighlights-list li {
      position: relative;
      padding: 10px 0 10px 28px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #333;
    }

    .apm-singleimagehighlights-list li:last-child {
      border-bottom: none;
    }

    .apm-singleimagehighlights-list li:before {
      content: "";
      position: absolute;
      left: 0;
      top: 14px;
      width: 16px;
      height: 16px;
      background: #007600;
      border-radius: 50%;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
      background-size: 12px;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Specs Module */
    .apm-specsmodule {
      display: flex;
      padding: 30px;
      gap: 30px;
      align-items: flex-start;
    }

    .apm-specsmodule-imagewrapper {
      flex: 0 0 300px;
    }

    .apm-specsmodule-image {
      width: 100%;
      border-radius: 4px;
    }

    .apm-specsmodule-content {
      flex: 1;
    }

    .apm-specsmodule-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 16px;
    }

    .apm-specsmodule-table {
      width: 100%;
      border-collapse: collapse;
    }

    .apm-specsmodule-table th,
    .apm-specsmodule-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e7e7e7;
      font-size: 13px;
    }

    .apm-specsmodule-table th {
      background: #f7f7f7;
      font-weight: 600;
      width: 40%;
      color: #0F1111;
    }

    .apm-specsmodule-table td {
      color: #333;
    }

    /* Text Module */
    .apm-textmodule {
      padding: 30px;
    }

    .apm-textmodule-headline {
      font-size: 24px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 16px;
    }

    .apm-textmodule-body {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }

    .apm-textmodule-body ul {
      margin: 12px 0;
      padding-left: 20px;
    }

    .apm-textmodule-body li {
      margin: 6px 0;
    }

    /* Image Sidebar */
    .apm-imagesidebar {
      display: flex;
      padding: 30px;
      gap: 30px;
    }

    .apm-imagesidebar-main {
      flex: 1;
    }

    .apm-imagesidebar-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 12px;
    }

    .apm-imagesidebar-body {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }

    .apm-imagesidebar-sidebar {
      flex: 0 0 220px;
    }

    .apm-imagesidebar-image {
      width: 100%;
      border-radius: 4px;
    }

    /* Multiple Images */
    .apm-multipleimages {
      padding: 30px;
    }

    .apm-multipleimages-headline {
      font-size: 24px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 12px;
      text-align: center;
    }

    .apm-multipleimages-body {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
      text-align: center;
      margin-bottom: 20px;
    }

    .apm-multipleimages-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }

    .apm-multipleimages-image {
      max-width: 200px;
      height: auto;
      border-radius: 4px;
    }

    /* Tech Specs */
    .apm-techspecs {
      padding: 30px;
    }

    .apm-techspecs-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 20px;
    }

    .apm-techspecs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .apm-techspecs-table tr:nth-child(even) {
      background: #f7f7f7;
    }

    .apm-techspecs-label {
      padding: 12px 16px;
      font-weight: 600;
      color: #0F1111;
      width: 40%;
      text-align: left;
      border-bottom: 1px solid #e7e7e7;
    }

    .apm-techspecs-value {
      padding: 12px 16px;
      color: #333;
      text-align: left;
      border-bottom: 1px solid #e7e7e7;
    }

    /* Comparison Table */
    .apm-comparison {
      padding: 30px;
    }

    .apm-comparison-headline {
      font-size: 24px;
      font-weight: 700;
      color: #0F1111;
      text-align: center;
      margin-bottom: 24px;
    }

    .apm-comparison-table-wrapper {
      overflow-x: auto;
    }

    .apm-comparison-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
    }

    .apm-comparison-table th,
    .apm-comparison-table td {
      padding: 14px 16px;
      text-align: center;
      border: 1px solid #e7e7e7;
      font-size: 13px;
    }

    .apm-comparison-table thead th {
      background: #f7f7f7;
      font-weight: 600;
      vertical-align: bottom;
    }

    .apm-comparison-product-image {
      max-width: 80px;
      height: auto;
      margin-bottom: 8px;
    }

    .apm-comparison-product-title {
      display: block;
      font-weight: 600;
      color: #0F1111;
    }

    .apm-comparison-metric {
      text-align: left !important;
      background: #fafafa;
      font-weight: 600;
    }

    .apm-comparison-highlight {
      background: #fffbea !important;
    }

    .apm-comparison-table thead .apm-comparison-highlight {
      background: #ff9900 !important;
      color: #0f1111;
    }

    /* Generic Module */
    .apm-genericmodule {
      padding: 30px;
      background: #fafafa;
      border: 1px dashed #ddd;
      margin: 10px;
    }

    .apm-genericmodule-type {
      display: inline-block;
      background: #232f3e;
      color: #fff;
      padding: 4px 10px;
      border-radius: 3px;
      font-size: 11px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .apm-genericmodule-mainimage {
      margin-bottom: 16px;
    }

    .apm-genericmodule-mainimage img {
      max-width: 100%;
      max-height: 400px;
      display: block;
      margin: 0 auto;
      border-radius: 4px;
    }

    .apm-genericmodule-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0F1111;
      margin-bottom: 12px;
    }

    .apm-genericmodule-body {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .apm-genericmodule-gallery {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      margin: 16px 0;
    }

    .apm-genericmodule-gallery img {
      max-width: 160px;
      max-height: 160px;
      border-radius: 4px;
      border: 1px solid #e7e7e7;
    }

    /* Placeholder */
    .apm-placeholder {
      border: 2px dashed #ddd;
      border-radius: 4px;
      margin: 0 auto;
    }

    /* Preview Footer */
    .preview-footer {
      background: linear-gradient(135deg, #232f3e 0%, #37475a 100%);
      padding: 24px 30px;
      text-align: center;
      color: #ccc;
    }

    .footer-content {
      max-width: 100%;
    }

    .preview-footer a {
      color: #ff9900;
      text-decoration: none;
    }

    .preview-footer a:hover {
      text-decoration: underline;
    }

    .preview-footer .generated-by {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 6px;
    }

    .preview-footer .timestamp {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 10px;
    }

    .preview-footer .contact {
      font-size: 13px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .preview-footer .order-cta {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .preview-footer .order-cta a {
      display: inline-block;
      background: #ff9900;
      color: #0f1111;
      padding: 10px 24px;
      border-radius: 4px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.2s;
    }

    .preview-footer .order-cta a:hover {
      background: #ffad33;
      text-decoration: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .apm-sidemodule,
      .apm-singleimagehighlights,
      .apm-specsmodule,
      .apm-imagesidebar {
        flex-direction: column;
      }

      .apm-sideimage-imagewrapper,
      .apm-singleimagehighlights-imagewrapper,
      .apm-specsmodule-imagewrapper,
      .apm-imagesidebar-sidebar {
        flex: none;
        width: 100%;
        max-width: 400px;
        margin: 0 auto 20px;
      }

      .apm-fourcolumnmodule-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .apm-threecolumnmodule-grid {
        grid-template-columns: 1fr;
      }

      .preview-meta {
        flex-direction: column;
        gap: 10px;
      }
    }

    /* Print */
    @media print {
      .preview-header,
      .preview-footer {
        background: #232f3e !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .preview-wrapper {
        box-shadow: none;
      }
    }
  `;
}

/**
 * Get selected checkbox rows for A+ sheets
 * Local version to avoid conflicts with other definitions
 */
function getAPlusSelectedRows(sheet) {
  const sheetName = sheet.getName();
  const data = sheet.getDataRange().getValues();

  // APlusBasic and APlusPremium have headers in row 3
  const headerRowIndex = 2; // 0-indexed = row 3
  const dataStartIndex = 3; // 0-indexed = row 4

  // Get headers to find Export column
  const headers = data[headerRowIndex] || [];
  let checkboxCol = 0; // Default to first column

  // Try to find Export column by name
  for (let i = 0; i < headers.length; i++) {
    const header = (headers[i] || '').toString().toLowerCase();
    if (header.includes('export') || header === '☑️') {
      checkboxCol = i;
      Logger.log(`getAPlusSelectedRows: Found Export column at index ${i} (header: "${headers[i]}")`);
      break;
    }
  }

  Logger.log(`getAPlusSelectedRows: Sheet=${sheetName}, checkboxCol=${checkboxCol}, dataStartIndex=${dataStartIndex}, totalRows=${data.length}`);

  const selectedRows = [];
  for (let i = dataStartIndex; i < data.length; i++) {
    const cellValue = data[i][checkboxCol];
    const rowNum = i + 1; // Convert to 1-based

    // Check for various true values
    const isChecked = cellValue === true ||
                      cellValue === 'TRUE' ||
                      cellValue === 'true' ||
                      cellValue === 'PRAWDA' ||
                      cellValue === 'prawda' ||
                      cellValue === 1 ||
                      cellValue === '1' ||
                      cellValue === 'x' ||
                      cellValue === 'X' ||
                      cellValue === '✓' ||
                      cellValue === '✔';

    // Skip already exported rows
    const isDone = (cellValue || '').toString().toUpperCase() === 'DONE';

    if (isChecked && !isDone) {
      // Also verify the row has some data (ASIN)
      const asinCol = headers.findIndex(h => (h || '').toString().toUpperCase() === 'ASIN');
      const hasAsin = asinCol >= 0 && data[i][asinCol];

      if (hasAsin) {
        selectedRows.push(rowNum);
        Logger.log(`getAPlusSelectedRows: Row ${rowNum} selected (checkbox=${cellValue}, ASIN=${data[i][asinCol]})`);
      } else {
        Logger.log(`getAPlusSelectedRows: Row ${rowNum} has checkbox but no ASIN, skipping`);
      }
    }
  }

  Logger.log(`getAPlusSelectedRows: Total selected rows with ASIN: ${selectedRows.length}`);
  return selectedRows;
}

/**
 * Save HTML content to Google Drive
 */
function saveHTMLToDrive(asin, htmlContent) {
  // Get or create folder
  const folderName = 'LUKO-A+-Previews';
  let folder;

  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }

  // Create file name with timestamp
  const timestamp = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd_HH-mm');
  const fileName = `A+_Preview_${asin}_${timestamp}.html`;

  // Check if file exists and delete old one
  const existingFiles = folder.getFilesByName(fileName);
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }

  // Create new file
  const blob = Utilities.newBlob(htmlContent, 'text/html', fileName);
  const file = folder.createFile(blob);

  // Make it viewable by anyone with link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file;
}
