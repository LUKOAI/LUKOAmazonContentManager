/**
 * A+ Content Module Builder - Complete Implementation
 * Handles all A+ Basic and Premium module types
 */

/**
 * IMAGE SIZE MAP - Expected dimensions for each module/field combination
 * Used for placeholder lookup when exporting with placeholder images
 */
const APLUS_IMAGE_SIZES = {
  // STANDARD modules
  'STANDARD_SINGLE_SIDE_IMAGE': { image: '300x300' },
  'STANDARD_HEADER_IMAGE_TEXT': { image: '970x600' },
  'STANDARD_COMPANY_LOGO': { companyLogo: '600x180' },
  'STANDARD_IMAGE_TEXT_OVERLAY': { image: '970x600' },
  'STANDARD_SINGLE_IMAGE_HIGHLIGHTS': {
    image: '300x300',
    bulleted_list_1_icon: '135x135',
    bulleted_list_2_icon: '135x135',
    bulleted_list_3_icon: '135x135',
    bulleted_list_4_icon: '135x135'
  },
  'STANDARD_MULTIPLE_IMAGE_TEXT': {
    image_1: '300x300',
    image_2: '300x300',
    image_3: '300x300',
    image_4: '300x300'
  },
  'STANDARD_FOUR_IMAGE_TEXT': {
    image_1: '135x135',
    image_2: '135x135',
    image_3: '135x135',
    image_4: '135x135'
  },
  'STANDARD_FOUR_IMAGE_TEXT_QUADRANT': {
    image_1: '300x300',
    image_2: '300x300',
    image_3: '300x300',
    image_4: '300x300'
  },
  'STANDARD_THREE_IMAGE_TEXT': {
    image_1: '300x300',
    image_2: '300x300',
    image_3: '300x300'
  },
  'STANDARD_COMPARISON_TABLE': {
    image_1: '135x135',
    image_2: '135x135',
    image_3: '135x135',
    image_4: '135x135',
    image_5: '135x135',
    highlight_icon: '135x135'
  },
  'STANDARD_SINGLE_IMAGE_SPECS_DETAIL': { image: '300x300' },
  'STANDARD_IMAGE_SIDEBAR': { image: '350x175' },
  // PREMIUM modules (larger sizes)
  'PREMIUM_TEXT': {}, // No images
  'PREMIUM_SINGLE_IMAGE': { image: '1464x600' },
  'PREMIUM_IMAGE_TEXT': { image: '1464x600' },
  'PREMIUM_FULL_BACKGROUND_TEXT': { backgroundImage: '1940x600' },
  'PREMIUM_FULL_BACKGROUND_IMAGE': { backgroundImage: '1940x600' },
  'PREMIUM_IMAGE_CAROUSEL': {
    image1: '362x453',
    image2: '362x453',
    image3: '362x453',
    image4: '362x453',
    image5: '362x453',
    image6: '362x453',
    image7: '362x453',
    image8: '362x453'
  },
  'PREMIUM_COMPARISON_CHART': {
    image1: '220x220',
    image2: '220x220',
    image3: '220x220',
    image4: '220x220',
    image5: '220x220',
    image6: '220x220'
  },
  'PREMIUM_FOUR_IMAGE_CAROUSEL': {
    image1: '362x453',
    image2: '362x453',
    image3: '362x453',
    image4: '362x453'
  },
  'PREMIUM_HOTSPOT_IMAGE': { image: '1940x600' },
  'PREMIUM_THREE_IMAGE_TEXT': {
    image1: '362x453',
    image2: '362x453',
    image3: '362x453'
  },
  'PREMIUM_FOUR_IMAGE_TEXT': {
    image1: '362x453',
    image2: '362x453',
    image3: '362x453',
    image4: '362x453'
  }
};

/**
 * Build A+ Content document from module data - COMPLETE VERSION
 * Supports ALL module types from Amazon SP-API A+ Content v2020-11-01
 */
function buildAPlusContentDocumentComplete(aplusData, marketplace) {
  // Detect the language with MOST content (not just first alphabetical key!)
  const moduleContentKeys = Object.keys(aplusData.moduleContent || {});
  if (moduleContentKeys.length === 0) {
    Logger.log(`⚠️ Warning: No module content found for ${aplusData.moduleType}. Using empty content.`);
  }

  // Find language with most non-empty fields
  let bestLang = moduleContentKeys[0] || 'EN';
  let maxFields = 0;

  for (const lang of moduleContentKeys) {
    const langData = aplusData.moduleContent[lang] || {};
    let fieldCount = 0;
    for (const key in langData) {
      if (langData[key] && langData[key].toString().trim() !== '') {
        fieldCount++;
      }
    }
    Logger.log(`🔍 Language "${lang}" has ${fieldCount} non-empty fields`);
    if (fieldCount > maxFields) {
      maxFields = fieldCount;
      bestLang = lang;
    }
  }

  const firstLang = bestLang;
  const content = aplusData.moduleContent?.[firstLang] || {};

  // Generate unique content reference key
  const contentRefKey = `${aplusData.asin}_module${aplusData.moduleNumber}_${Date.now()}`;

  Logger.log(`✅ Best language: "${firstLang}" with ${maxFields} fields (from: ${moduleContentKeys.join(', ')})`);
  Logger.log(`Building ${aplusData.moduleType} for ASIN ${aplusData.asin}, language: ${firstLang}`);
  Logger.log(`Content keys: ${Object.keys(content).join(', ') || '(empty)'}`);
  Logger.log(`Export mode: ${aplusData.exportMode || 'default'}`);
  Logger.log(`Images available: ${Object.keys(aplusData.images || {}).join(', ') || '(none)'}`);

  // Check if we're in placeholder mode (used by module builders to decide if blocks should be skipped)
  const usePlaceholders = aplusData.usePlaceholders || aplusData.exportMode === 'WITH_PLACEHOLDERS';
  Logger.log(`Placeholder mode: ${usePlaceholders}`);

  // Determine content subtype based on module type
  const isPremium = aplusData.moduleType.startsWith('PREMIUM');
  const contentSubType = isPremium ? 'PREMIUM' : 'STANDARD';

  // Use detected language for locale, fallback to marketplace
  const detectedLocale = convertLanguageToLocale(firstLang, marketplace) || convertMarketplaceToLocale(marketplace);
  Logger.log(`📍 Locale: "${firstLang}" → "${detectedLocale}"`);

  const contentDocument = {
    name: contentRefKey,
    contentType: 'EBC',  // Enhanced Brand Content
    contentSubType: contentSubType,
    locale: detectedLocale,
    contentModuleList: []
  };

  // Build module based on type
  const module = {
    contentModuleType: aplusData.moduleType
  };

  // Helper function for TextComponent (headline/heading/title fields)
  function addTextComponent(fieldName, value) {
    if (value) {
      return {
        value: value,
        decoratorSet: []
      };
    }
    return null;
  }

  // Helper function for ParagraphComponent (body/description fields)
  function addParagraphComponent(fieldName, value) {
    if (value) {
      return {
        textList: [
          {
            value: value,
            decoratorSet: []
          }
        ]
      };
    }
    return null;
  }

  // Helper function to validate Amazon uploadDestinationId format
  // Valid formats:
  //   - "aplus-media-library-service-media/UUID.ext"
  //   - "aplus/UUID.ext"
  // Invalid (placeholder filenames): "amazon_a_plus_placeholder_970x600_header.png"
  function isValidUploadDestinationId(id) {
    if (!id || typeof id !== 'string') return false;

    // Must contain "/" (path separator) to be a valid Amazon ID
    if (!id.includes('/')) return false;

    // Must start with "aplus" prefix
    if (!id.startsWith('aplus')) return false;

    // Should have a UUID-like pattern (optional but recommended check)
    // Format: aplus-media-library-service-media/UUID.ext
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    return uuidPattern.test(id);
  }

  // Helper function to get image ID or null
  // Enhanced to support image library lookup and placeholder mode
  // Uses APLUS_IMAGE_SIZES map to automatically determine expected size
  // Priority order:
  //   1. Direct uploadDestinationId from sheet (explicit user input) - must be valid Amazon ID
  //   2. Lookup by module type from Image Library (auto-suggest)
  //   3. Lookup by image URL from library
  //   4. Placeholder fallback (if placeholder mode enabled)
  function getImageId(fieldName, explicitSize) {
    // Check export mode
    const exportMode = aplusData.exportMode;
    const usePlaceholders = aplusData.usePlaceholders || exportMode === 'WITH_PLACEHOLDERS';
    const autoLookup = aplusData.autoLookupImages !== false; // Default to true

    // Get expected size from map or use explicit size
    const moduleType = aplusData.moduleType;
    const sizeMap = APLUS_IMAGE_SIZES[moduleType] || {};

    // Try multiple key formats: image1, image_1, image
    // (map uses image_1 format but code calls with image1)
    const fieldNameWithUnderscore = fieldName.replace(/(\d+)$/, '_$1'); // image1 -> image_1
    const expectedSize = explicitSize ||
                        sizeMap[fieldName] ||
                        sizeMap[fieldNameWithUnderscore] ||
                        sizeMap['image'] ||
                        null;

    Logger.log(`getImageId called for ${fieldName}, moduleType: ${moduleType}, expectedSize: ${expectedSize}`);

    // If in placeholder mode, look for placeholder image first
    if (usePlaceholders && expectedSize) {
      Logger.log(`Looking for placeholder image for ${fieldName} (size: ${expectedSize})`);
      const placeholderId = lookupPlaceholderBySize(expectedSize);
      if (placeholderId) {
        Logger.log(`✅ Using placeholder for ${fieldName}: ${placeholderId}`);
        return placeholderId;
      } else {
        Logger.log(`⚠️ No placeholder found for size ${expectedSize}, falling back to regular lookup`);
      }
    }

    // First priority: Direct uploadDestinationId from sheet
    // Must be a valid Amazon uploadDestinationId (contains "/" like "aplus-media-library-service-media/UUID.jpg")
    const directId = aplusData.images?.[`${fieldName}_id`];
    if (directId && isValidUploadDestinationId(directId)) {
      Logger.log(`Using direct uploadDestinationId for ${fieldName}: ${directId}`);
      return directId;
    } else if (directId) {
      Logger.log(`⚠️ Invalid uploadDestinationId format: ${directId} - skipping to auto-lookup`);
    }

    // Second priority: Auto-lookup by module type from Image Library
    if (autoLookup) {
      Logger.log(`Auto-lookup enabled, searching by module type: ${moduleType}`);
      const suggestions = suggestImagesForModule(moduleType, aplusData.sourceContentKey);

      // Map field names to suggestion keys
      // suggestImagesForModule returns: image_id, image1_id, image2_id, companyLogo_id, backgroundImage_id, etc.
      const suggestionKey = `${fieldName}_id`;
      if (suggestions[suggestionKey]) {
        Logger.log(`✅ Found image via auto-lookup for ${fieldName}: ${suggestions[suggestionKey]}`);
        return suggestions[suggestionKey];
      }

      // Try direct field name without _id suffix (for backwards compatibility)
      if (suggestions[fieldName]) {
        Logger.log(`✅ Found image via auto-lookup (direct key) for ${fieldName}: ${suggestions[fieldName]}`);
        return suggestions[fieldName];
      }

      // For numbered fields like image1, image2, try looking up first available
      if (fieldName.match(/^image\d*$/) && suggestions.image_id) {
        Logger.log(`✅ Using first available image for ${fieldName}: ${suggestions.image_id}`);
        return suggestions.image_id;
      }
    }

    // Third priority: Lookup from image library by URL
    const imageUrl = aplusData.images?.[`${fieldName}_url`];
    if (imageUrl) {
      Logger.log(`Attempting library lookup for ${fieldName} with URL: ${imageUrl}`);
      const libraryId = lookupUploadDestinationId(imageUrl);
      if (libraryId) {
        Logger.log(`Found uploadDestinationId in library: ${libraryId}`);
        return libraryId;
      } else {
        Logger.log(`⚠️ WARNING: No uploadDestinationId found in library for: ${imageUrl}`);
        Logger.log(`Please either:`);
        Logger.log(`  1. Add this image to Image Library (sync from existing A+ Content)`);
        Logger.log(`  2. Manually upload to Seller Central Asset Library and add to library sheet`);
      }
    }

    // If in placeholder mode and still no image, try to find any placeholder of correct size
    if (usePlaceholders && expectedSize) {
      const fallbackPlaceholder = lookupPlaceholderBySize(expectedSize);
      if (fallbackPlaceholder) {
        Logger.log(`Using fallback placeholder for ${fieldName}: ${fallbackPlaceholder}`);
        return fallbackPlaceholder;
      }
    }

    Logger.log(`No image data found for ${fieldName}`);
    return null;
  }

  // Helper function to build complete image object with imageCropSpecification and altText
  // Amazon API REQUIRES these fields - without them, the API returns 400 error
  function buildImageObject(imageId, fieldName, altText) {
    if (!imageId) return null;

    const moduleType = aplusData.moduleType;
    const sizeMap = APLUS_IMAGE_SIZES[moduleType] || {};

    // Try multiple key formats: image1, image_1, image, backgroundImage, companyLogo
    const fieldNameWithUnderscore = fieldName.replace(/(\d+)$/, '_$1'); // image1 -> image_1
    const sizeStr = sizeMap[fieldName] ||
                    sizeMap[fieldNameWithUnderscore] ||
                    sizeMap['image'] ||
                    sizeMap['backgroundImage'] ||
                    sizeMap['companyLogo'] ||
                    '300x300'; // Default fallback

    // Parse size string "WxH" to width and height
    const [width, height] = sizeStr.split('x').map(Number);

    // Get alt text from:
    // 1. Explicit parameter
    // 2. aplusData.images[fieldName_altText]
    // 3. Image Library (lookup by uploadDestinationId)
    // 4. Default placeholder text
    let imageAltText = altText ||
                       aplusData.images?.[`${fieldName}_altText`] ||
                       aplusData.images?.[`${fieldName}_alt`] ||
                       '';

    // If no alt text provided, try to get from Image Library
    if (!imageAltText) {
      try {
        const libraryAltText = lookupImageAltText(imageId);
        if (libraryAltText) {
          imageAltText = libraryAltText;
        }
      } catch (e) {
        // Image Library lookup may fail if sheet doesn't exist
        Logger.log(`Could not lookup alt text from library: ${e.message}`);
      }
    }

    // Default alt text if still empty (Amazon requires non-null)
    if (!imageAltText) {
      imageAltText = `${moduleType} image`;
    }

    Logger.log(`Building image object for ${fieldName}: ${width}x${height}, altText: "${imageAltText.substring(0, 30)}..."`);

    return {
      uploadDestinationId: imageId,
      imageCropSpecification: {
        size: {
          width: { value: width, units: 'pixels' },
          height: { value: height, units: 'pixels' }
        },
        offset: {
          x: { value: 0, units: 'pixels' },
          y: { value: 0, units: 'pixels' }
        }
      },
      altText: imageAltText
    };
  }

  // ========== STANDARD MODULES ==========

  // 1. STANDARD_TEXT
  // NOTE: Amazon API REQUIRES body field - it cannot be null/empty
  if (aplusData.moduleType === 'STANDARD_TEXT') {
    module.standardText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardText.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) {
      module.standardText.body = body;
    } else {
      // STANDARD_TEXT REQUIRES body - use headline as body if no body provided
      // or use a placeholder space if completely empty
      if (content.headline) {
        Logger.log(`⚠️ STANDARD_TEXT has headline but no body - using headline as body`);
        module.standardText.body = addParagraphComponent('body', content.headline);
      } else {
        // Completely empty module - this will likely fail but we log a clear error
        Logger.log(`❌ ERROR: STANDARD_TEXT module is empty (no headline or body). Amazon API requires body.`);
        Logger.log(`   Please add content to aplus_basic_m${aplusData.moduleNumber}_body_XX columns`);
        // Add minimal placeholder to prevent API crash (but module should be removed)
        module.standardText.body = addParagraphComponent('body', ' ');
      }
    }
  }

  // 2. STANDARD_SINGLE_SIDE_IMAGE
  else if (aplusData.moduleType === 'STANDARD_SINGLE_SIDE_IMAGE') {
    module.standardSingleSideImage = {
      imagePositionType: aplusData.images?.imagePositionType || 'RIGHT',
      block: {}
    };

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.standardSingleSideImage.block.image = imageObj;
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardSingleSideImage.block.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardSingleSideImage.block.body = body;
  }

  // 3. STANDARD_HEADER_IMAGE_TEXT
  else if (aplusData.moduleType === 'STANDARD_HEADER_IMAGE_TEXT') {
    module.standardHeaderImageText = {
      block: {}
    };

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.standardHeaderImageText.block.image = imageObj;
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardHeaderImageText.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardHeaderImageText.block.body = body;
  }

  // 4. STANDARD_COMPANY_LOGO
  else if (aplusData.moduleType === 'STANDARD_COMPANY_LOGO') {
    module.standardCompanyLogo = {};

    const logoId = getImageId('companyLogo');
    const logoObj = buildImageObject(logoId, 'companyLogo');
    if (logoObj) {
      module.standardCompanyLogo.companyLogo = logoObj;
    }

    const description = addParagraphComponent('companyDescription', content.companyDescription);
    if (description) module.standardCompanyLogo.companyDescriptionTextBlock = description;
  }

  // 5. STANDARD_IMAGE_TEXT_OVERLAY
  else if (aplusData.moduleType === 'STANDARD_IMAGE_TEXT_OVERLAY') {
    module.standardImageTextOverlay = {
      overlayColorType: aplusData.images?.overlayColorType || 'BLACK',
      block: {}
    };

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.standardImageTextOverlay.block.image = imageObj;
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardImageTextOverlay.block.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardImageTextOverlay.block.body = body;
  }

  // 6. STANDARD_SINGLE_IMAGE_HIGHLIGHTS
  else if (aplusData.moduleType === 'STANDARD_SINGLE_IMAGE_HIGHLIGHTS') {
    module.standardSingleImageHighlights = {};

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.standardSingleImageHighlights.image = imageObj;
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardSingleImageHighlights.headline = headline;

    // Add bullet points (highlights)
    const bulletPoints = [];
    for (let i = 1; i <= 4; i++) {
      const bulletText = content[`highlight${i}`];
      if (bulletText) {
        bulletPoints.push(addParagraphComponent(`highlight${i}`, bulletText));
      }
    }
    if (bulletPoints.length > 0) {
      module.standardSingleImageHighlights.bulletedListBlock = bulletPoints;
    }
  }

  // 7. STANDARD_MULTIPLE_IMAGE_TEXT
  else if (aplusData.moduleType === 'STANDARD_MULTIPLE_IMAGE_TEXT') {
    module.standardMultipleImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardMultipleImageText.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardMultipleImageText.body = body;

    // Add up to 4 images
    const images = [];
    for (let i = 1; i <= 4; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);
      if (imageObj) {
        images.push(imageObj);
      }
    }
    if (images.length > 0) {
      module.standardMultipleImageText.image = images;
    }
  }

  // 8. STANDARD_FOUR_IMAGE_TEXT
  else if (aplusData.moduleType === 'STANDARD_FOUR_IMAGE_TEXT') {
    module.standardFourImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardFourImageText.headline = headline;

    // Add 4 blocks with images and text
    // IMPORTANT: Amazon expects block1, block2, block3, block4 as separate fields, NOT an array
    let blocksAdded = 0;
    let missingPlaceholders = [];

    for (let i = 1; i <= 4; i++) {
      const imageId = getImageId(`image${i}`);

      // In placeholder mode: ALL blocks must be included, error if no placeholder found
      // In normal mode: Skip blocks without images
      const imageObj = buildImageObject(imageId, `image${i}`);

      if (!imageObj) {
        if (usePlaceholders) {
          // In placeholder mode - this is an ERROR, placeholder should have been found
          missingPlaceholders.push(`image${i} (135x135)`);
          Logger.log(`❌ ERROR: Missing placeholder for image${i} (size 135x135) in STANDARD_FOUR_IMAGE_TEXT`);
        } else {
          // In normal mode - skip blocks without images
          Logger.log(`⚠️ Skipping block${i} - no image available (image required for STANDARD_FOUR_IMAGE_TEXT)`);
        }
        continue;
      }

      const block = {
        image: imageObj
      };
      blocksAdded++;

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      module.standardFourImageText[`block${i}`] = block;
    }

    if (usePlaceholders && missingPlaceholders.length > 0) {
      Logger.log(`❌ CRITICAL: Placeholder mode enabled but ${missingPlaceholders.length} placeholders missing: ${missingPlaceholders.join(', ')}`);
      Logger.log(`Please add placeholders to Image Library with status=PLACEHOLDER and correct dimensions (135x135)`);
    }

    if (blocksAdded === 0) {
      Logger.log(`❌ ERROR: STANDARD_FOUR_IMAGE_TEXT has no blocks with images - module will be empty`);
    } else {
      Logger.log(`✅ Added ${blocksAdded} blocks to STANDARD_FOUR_IMAGE_TEXT`);
    }
  }

  // 9. STANDARD_FOUR_IMAGE_TEXT_QUADRANT
  else if (aplusData.moduleType === 'STANDARD_FOUR_IMAGE_TEXT_QUADRANT') {
    module.standardFourImageTextQuadrant = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardFourImageTextQuadrant.headline = headline;

    // Add 4 quadrants with images and text
    // IMPORTANT: Amazon expects block1, block2, block3, block4 as separate fields, NOT an array
    let blocksAdded = 0;
    let missingPlaceholders = [];

    for (let i = 1; i <= 4; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);

      if (!imageObj) {
        if (usePlaceholders) {
          missingPlaceholders.push(`image${i} (300x300)`);
          Logger.log(`❌ ERROR: Missing placeholder for image${i} (size 300x300) in STANDARD_FOUR_IMAGE_TEXT_QUADRANT`);
        } else {
          Logger.log(`⚠️ Skipping block${i} - no image available (image required for STANDARD_FOUR_IMAGE_TEXT_QUADRANT)`);
        }
        continue;
      }

      const block = {
        image: imageObj
      };
      blocksAdded++;

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      module.standardFourImageTextQuadrant[`block${i}`] = block;
    }

    if (usePlaceholders && missingPlaceholders.length > 0) {
      Logger.log(`❌ CRITICAL: Placeholder mode but ${missingPlaceholders.length} placeholders missing: ${missingPlaceholders.join(', ')}`);
      Logger.log(`Add placeholders to Image Library with status=PLACEHOLDER and dimensions 300x300`);
    }

    if (blocksAdded === 0) {
      Logger.log(`❌ ERROR: STANDARD_FOUR_IMAGE_TEXT_QUADRANT has no blocks with images - module will be empty`);
    } else {
      Logger.log(`✅ Added ${blocksAdded} blocks to STANDARD_FOUR_IMAGE_TEXT_QUADRANT`);
    }
  }

  // 10. STANDARD_THREE_IMAGE_TEXT
  else if (aplusData.moduleType === 'STANDARD_THREE_IMAGE_TEXT') {
    module.standardThreeImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardThreeImageText.headline = headline;

    // Add 3 blocks with images and text
    // IMPORTANT: Amazon expects block1, block2, block3 as separate fields, NOT an array
    let blocksAdded = 0;
    let missingPlaceholders = [];

    for (let i = 1; i <= 3; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);

      if (!imageObj) {
        if (usePlaceholders) {
          missingPlaceholders.push(`image${i} (300x300)`);
          Logger.log(`❌ ERROR: Missing placeholder for image${i} (size 300x300) in STANDARD_THREE_IMAGE_TEXT`);
        } else {
          Logger.log(`⚠️ Skipping block${i} - no image available (image required for STANDARD_THREE_IMAGE_TEXT)`);
        }
        continue;
      }

      const block = {
        image: imageObj
      };
      blocksAdded++;

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      module.standardThreeImageText[`block${i}`] = block;
    }

    if (usePlaceholders && missingPlaceholders.length > 0) {
      Logger.log(`❌ CRITICAL: Placeholder mode but ${missingPlaceholders.length} placeholders missing: ${missingPlaceholders.join(', ')}`);
      Logger.log(`Add placeholders to Image Library with status=PLACEHOLDER and dimensions 300x300`);
    }

    if (blocksAdded === 0) {
      Logger.log(`❌ ERROR: STANDARD_THREE_IMAGE_TEXT has no blocks with images - module will be empty`);
    } else {
      Logger.log(`✅ Added ${blocksAdded} blocks to STANDARD_THREE_IMAGE_TEXT`);
    }
  }

  // 11. STANDARD_COMPARISON_TABLE
  else if (aplusData.moduleType === 'STANDARD_COMPARISON_TABLE') {
    module.standardComparisonTable = {};

    // Product columns (up to 6)
    const productColumns = [];
    for (let i = 1; i <= 6; i++) {
      const column = {};

      const imageId = getImageId(`productImage${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);
      if (imageObj) {
        column.image = imageObj;
      }

      const productName = addTextComponent(`productName${i}`, content[`productName${i}`]);
      if (productName) column.title = productName;

      // Metrics for this product (up to 10)
      const metrics = [];
      for (let j = 1; j <= 10; j++) {
        const metricValue = content[`metric${j}_product${i}`];
        if (metricValue) {
          metrics.push(addTextComponent(`metric${j}_product${i}`, metricValue));
        }
      }
      if (metrics.length > 0) {
        column.metrics = metrics;
      }

      if (Object.keys(column).length > 0) {
        productColumns.push(column);
      }
    }

    if (productColumns.length > 0) {
      module.standardComparisonTable.productColumns = productColumns;
    }

    // Metric row headings (up to 10)
    const metricRowHeadings = [];
    for (let i = 1; i <= 10; i++) {
      const heading = content[`metricHeading${i}`];
      if (heading) {
        metricRowHeadings.push(addTextComponent(`metricHeading${i}`, heading));
      }
    }
    if (metricRowHeadings.length > 0) {
      module.standardComparisonTable.metricRowLabels = metricRowHeadings;
    }
  }

  // 12. STANDARD_PRODUCT_DESCRIPTION
  // NOTE: This module type only accepts 'body' field, NO headline
  else if (aplusData.moduleType === 'STANDARD_PRODUCT_DESCRIPTION') {
    module.standardProductDescription = {};

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardProductDescription.body = body;
  }

  // 13. STANDARD_SINGLE_IMAGE_SPECS_DETAIL
  else if (aplusData.moduleType === 'STANDARD_SINGLE_IMAGE_SPECS_DETAIL') {
    module.standardSingleImageSpecsDetail = {};

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.standardSingleImageSpecsDetail.image = imageObj;
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardSingleImageSpecsDetail.headline = headline;

    // Add specs (up to 8)
    const specifications = [];
    for (let i = 1; i <= 8; i++) {
      const specName = content[`spec${i}_name`];
      const specValue = content[`spec${i}_value`];
      if (specName && specValue) {
        specifications.push({
          name: addTextComponent(`spec${i}_name`, specName),
          value: addParagraphComponent(`spec${i}_value`, specValue)
        });
      }
    }
    if (specifications.length > 0) {
      module.standardSingleImageSpecsDetail.specificationList = specifications;
    }
  }

  // 14. STANDARD_IMAGE_SIDEBAR
  else if (aplusData.moduleType === 'STANDARD_IMAGE_SIDEBAR') {
    module.standardImageSidebar = {
      sidebarPosition: aplusData.images?.sidebarPosition || 'RIGHT'
    };

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.standardImageSidebar.sidebarImage = imageObj;
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardImageSidebar.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardImageSidebar.body = body;
  }

  // 15. STANDARD_TECH_SPECS
  else if (aplusData.moduleType === 'STANDARD_TECH_SPECS') {
    module.standardTechSpecs = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardTechSpecs.headline = headline;

    // Add specs (up to 12)
    const specifications = [];
    for (let i = 1; i <= 12; i++) {
      const specName = content[`spec${i}_name`];
      const specValue = content[`spec${i}_value`];
      if (specName && specValue) {
        specifications.push({
          name: addTextComponent(`spec${i}_name`, specName),
          value: addParagraphComponent(`spec${i}_value`, specValue)
        });
      }
    }
    if (specifications.length > 0) {
      module.standardTechSpecs.specificationList = specifications;
    }
  }

  // ========== PREMIUM MODULES ==========

  // 16. PREMIUM_TEXT
  else if (aplusData.moduleType === 'PREMIUM_TEXT') {
    module.premiumText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumText.headline = headline;

    // Premium modules use 'bodyText' not 'body'
    const bodyText = addParagraphComponent('bodyText', content.body);
    if (bodyText) module.premiumText.bodyText = bodyText;
  }

  // 17. PREMIUM_IMAGE_TEXT
  else if (aplusData.moduleType === 'PREMIUM_IMAGE_TEXT') {
    module.premiumImageText = {};

    // positionType is REQUIRED - default to LEFT
    module.premiumImageText.positionType = aplusData.images?.imagePositionType || 'LEFT';

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.premiumImageText.image = imageObj;
    } else {
      // Image is REQUIRED - use empty placeholder structure
      Logger.log('WARNING: PREMIUM_IMAGE_TEXT requires image - API will fail without it');
    }

    // headline is REQUIRED
    const headline = addTextComponent('headline', content.headline);
    if (headline) {
      module.premiumImageText.headline = headline;
    } else {
      // Default headline if missing
      module.premiumImageText.headline = { value: ' ', decoratorSet: [] };
    }

    // API uses 'bodyText' not 'body' for this module type
    const bodyText = addParagraphComponent('bodyText', content.body);
    if (bodyText) module.premiumImageText.bodyText = bodyText;

    // Optional subheadline
    const subheadline = addTextComponent('subheadline', content.subheadline);
    if (subheadline) module.premiumImageText.subheadline = subheadline;
  }

  // 18. PREMIUM_FULL_BACKGROUND_TEXT
  else if (aplusData.moduleType === 'PREMIUM_FULL_BACKGROUND_TEXT') {
    module.premiumFullBackgroundText = {};

    // positionType is REQUIRED - default to LEFT (LEFT, CENTER, RIGHT)
    module.premiumFullBackgroundText.positionType = aplusData.images?.positionType || 'LEFT';

    // colorType is REQUIRED - LIGHT or DARK (for text overlay visibility)
    module.premiumFullBackgroundText.colorType = aplusData.images?.colorType || aplusData.images?.overlayColorType || 'DARK';

    // desktopImage is REQUIRED (previously was backgroundImage)
    const bgImageId = getImageId('backgroundImage');
    const bgImageObj = buildImageObject(bgImageId, 'backgroundImage');
    if (bgImageObj) {
      module.premiumFullBackgroundText.desktopImage = bgImageObj;
      // mobileImage is also REQUIRED - use same image as desktop
      module.premiumFullBackgroundText.mobileImage = bgImageObj;
    } else {
      Logger.log('WARNING: PREMIUM_FULL_BACKGROUND_TEXT requires desktopImage and mobileImage - API will fail without them');
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumFullBackgroundText.headline = headline;

    // API uses 'description' not 'body' for this module type
    const description = addParagraphComponent('description', content.body);
    if (description) module.premiumFullBackgroundText.description = description;

    // Optional subheadline
    const subheadline = addTextComponent('subheadline', content.subheadline);
    if (subheadline) module.premiumFullBackgroundText.subheadline = subheadline;
  }

  // 19. PREMIUM_FULL_BACKGROUND_IMAGE
  else if (aplusData.moduleType === 'PREMIUM_FULL_BACKGROUND_IMAGE') {
    module.premiumFullBackgroundImage = {};

    const bgImageId = getImageId('backgroundImage');
    const bgImageObj = buildImageObject(bgImageId, 'backgroundImage');
    if (bgImageObj) {
      module.premiumFullBackgroundImage.backgroundImage = bgImageObj;
    }
  }

  // 20. PREMIUM_IMAGE_CAROUSEL
  else if (aplusData.moduleType === 'PREMIUM_IMAGE_CAROUSEL') {
    module.premiumImageCarousel = {};

    // API expects carouselCards (not carouselImages), minimum 2, max 6
    const carouselCards = [];
    for (let i = 1; i <= 6; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);
      if (imageObj) {
        carouselCards.push({
          image: imageObj
        });
      }
    }

    // Minimum 2 cards required
    if (carouselCards.length >= 2) {
      module.premiumImageCarousel.carouselCards = carouselCards;
    } else if (carouselCards.length === 1) {
      // Duplicate the single card to meet minimum
      carouselCards.push(carouselCards[0]);
      module.premiumImageCarousel.carouselCards = carouselCards;
      Logger.log('WARNING: PREMIUM_IMAGE_CAROUSEL needs min 2 cards - duplicated single card');
    } else {
      Logger.log('WARNING: PREMIUM_IMAGE_CAROUSEL requires at least 2 carouselCards - API will fail');
    }

    // Add headline if provided
    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumImageCarousel.headline = headline;

    // Premium modules use 'bodyText' not 'body'
    const bodyText = addParagraphComponent('bodyText', content.body);
    if (bodyText) module.premiumImageCarousel.bodyText = bodyText;
  }

  // 21. PREMIUM_SINGLE_IMAGE
  else if (aplusData.moduleType === 'PREMIUM_SINGLE_IMAGE') {
    module.premiumSingleImage = {};

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.premiumSingleImage.image = imageObj;
    }
  }

  // 22. PREMIUM_FOUR_IMAGE_CAROUSEL
  else if (aplusData.moduleType === 'PREMIUM_FOUR_IMAGE_CAROUSEL') {
    module.premiumFourImageCarousel = {};

    // Add up to 4 carousel images
    const carouselImages = [];
    for (let i = 1; i <= 4; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);
      if (imageObj) {
        carouselImages.push(imageObj);
      }
    }
    if (carouselImages.length > 0) {
      module.premiumFourImageCarousel.carouselImages = carouselImages;
    }
  }

  // 23. PREMIUM_COMPARISON_CHART
  else if (aplusData.moduleType === 'PREMIUM_COMPARISON_CHART') {
    module.premiumComparisonChart = {};

    // Product columns (up to 6)
    const productColumns = [];
    for (let i = 1; i <= 6; i++) {
      const column = {};

      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);
      if (imageObj) {
        column.image = imageObj;
      }

      const productName = addTextComponent(`productName${i}`, content[`productName${i}`]);
      if (productName) column.title = productName;

      // Add ASIN reference if provided
      const asinRef = content[`productAsin${i}`];
      if (asinRef) {
        column.asin = asinRef;
      }

      // Metrics for this product (up to 10)
      const metrics = [];
      for (let j = 1; j <= 10; j++) {
        const metricValue = content[`metric${j}_product${i}`];
        if (metricValue) {
          metrics.push(addTextComponent(`metric${j}_product${i}`, metricValue));
        }
      }
      if (metrics.length > 0) {
        column.metrics = metrics;
      }

      // isHighlighted flag
      if (content[`product${i}_highlighted`] === true || content[`product${i}_highlighted`] === 'true') {
        column.isHighlighted = true;
      }

      if (Object.keys(column).length > 0) {
        productColumns.push(column);
      }
    }

    if (productColumns.length > 0) {
      module.premiumComparisonChart.productColumns = productColumns;
    }

    // Metric row headings (up to 10)
    const metricRowHeadings = [];
    for (let i = 1; i <= 10; i++) {
      const heading = content[`metricHeading${i}`];
      if (heading) {
        metricRowHeadings.push(addTextComponent(`metricHeading${i}`, heading));
      }
    }
    if (metricRowHeadings.length > 0) {
      module.premiumComparisonChart.metricRowLabels = metricRowHeadings;
    }
  }

  // 24. PREMIUM_HOTSPOT_IMAGE
  else if (aplusData.moduleType === 'PREMIUM_HOTSPOT_IMAGE') {
    module.premiumHotspotImage = {};

    const imageId = getImageId('image');
    const imageObj = buildImageObject(imageId, 'image');
    if (imageObj) {
      module.premiumHotspotImage.image = imageObj;
    }

    // Hotspots (up to 10)
    const hotspots = [];
    for (let i = 1; i <= 10; i++) {
      const hotspotTitle = content[`hotspot${i}_title`];
      const hotspotDescription = content[`hotspot${i}_description`];
      const hotspotX = content[`hotspot${i}_x`];
      const hotspotY = content[`hotspot${i}_y`];

      if (hotspotTitle || hotspotDescription) {
        const hotspot = {};
        if (hotspotTitle) hotspot.title = addTextComponent(`hotspot${i}_title`, hotspotTitle);
        if (hotspotDescription) hotspot.description = addParagraphComponent(`hotspot${i}_description`, hotspotDescription);
        if (hotspotX !== undefined && hotspotY !== undefined) {
          hotspot.position = { x: parseFloat(hotspotX), y: parseFloat(hotspotY) };
        }
        hotspots.push(hotspot);
      }
    }
    if (hotspots.length > 0) {
      module.premiumHotspotImage.hotspots = hotspots;
    }
  }

  // 25. PREMIUM_THREE_IMAGE_TEXT
  else if (aplusData.moduleType === 'PREMIUM_THREE_IMAGE_TEXT') {
    module.premiumThreeImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumThreeImageText.headline = headline;

    // Add 3 blocks with images and text
    let blocksAdded = 0;
    let missingPlaceholders = [];

    for (let i = 1; i <= 3; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);

      if (!imageObj) {
        if (usePlaceholders) {
          missingPlaceholders.push(`image${i} (362x453)`);
          Logger.log(`❌ ERROR: Missing placeholder for image${i} (size 362x453) in PREMIUM_THREE_IMAGE_TEXT`);
        } else {
          Logger.log(`⚠️ Skipping block${i} - no image available (image required for PREMIUM_THREE_IMAGE_TEXT)`);
        }
        continue;
      }

      const block = {
        image: imageObj
      };
      blocksAdded++;

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      module.premiumThreeImageText[`block${i}`] = block;
    }

    if (usePlaceholders && missingPlaceholders.length > 0) {
      Logger.log(`❌ CRITICAL: Placeholder mode but ${missingPlaceholders.length} placeholders missing: ${missingPlaceholders.join(', ')}`);
      Logger.log(`Add placeholders to Image Library with status=PLACEHOLDER and dimensions 362x453`);
    }

    if (blocksAdded === 0) {
      Logger.log(`❌ ERROR: PREMIUM_THREE_IMAGE_TEXT has no blocks with images - module will be empty`);
    } else {
      Logger.log(`✅ Added ${blocksAdded} blocks to PREMIUM_THREE_IMAGE_TEXT`);
    }
  }

  // 26. PREMIUM_FOUR_IMAGE_TEXT
  else if (aplusData.moduleType === 'PREMIUM_FOUR_IMAGE_TEXT') {
    module.premiumFourImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumFourImageText.headline = headline;

    // Add 4 blocks with images and text
    let blocksAdded = 0;
    let missingPlaceholders = [];

    for (let i = 1; i <= 4; i++) {
      const imageId = getImageId(`image${i}`);
      const imageObj = buildImageObject(imageId, `image${i}`);

      if (!imageObj) {
        if (usePlaceholders) {
          missingPlaceholders.push(`image${i} (362x453)`);
          Logger.log(`❌ ERROR: Missing placeholder for image${i} (size 362x453) in PREMIUM_FOUR_IMAGE_TEXT`);
        } else {
          Logger.log(`⚠️ Skipping block${i} - no image available (image required for PREMIUM_FOUR_IMAGE_TEXT)`);
        }
        continue;
      }

      const block = {
        image: imageObj
      };
      blocksAdded++;

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      module.premiumFourImageText[`block${i}`] = block;
    }

    if (usePlaceholders && missingPlaceholders.length > 0) {
      Logger.log(`❌ CRITICAL: Placeholder mode but ${missingPlaceholders.length} placeholders missing: ${missingPlaceholders.join(', ')}`);
      Logger.log(`Add placeholders to Image Library with status=PLACEHOLDER and dimensions 362x453`);
    }

    if (blocksAdded === 0) {
      Logger.log(`❌ ERROR: PREMIUM_FOUR_IMAGE_TEXT has no blocks with images - module will be empty`);
    } else {
      Logger.log(`✅ Added ${blocksAdded} blocks to PREMIUM_FOUR_IMAGE_TEXT`);
    }
  }

  // FALLBACK: Unknown module type - log warning but continue
  else {
    Logger.log(`⚠️ Warning: Unknown module type "${aplusData.moduleType}". Creating empty module.`);
    // Try to create a basic structure based on naming convention
    const camelCaseName = aplusData.moduleType
      .toLowerCase()
      .replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    module[camelCaseName] = {};

    // Try to add headline if available
    const headline = addTextComponent('headline', content.headline);
    if (headline) module[camelCaseName].headline = headline;

    // Try to add body if available
    const body = addParagraphComponent('body', content.body);
    if (body) module[camelCaseName].body = body;
  }

  contentDocument.contentModuleList.push(module);

  return contentDocument;
}

/**
 * Validate A+ Content module before publishing
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 *
 * Checks:
 * - Module has required images for its type
 * - uploadDestinationId format is valid
 * - Required text fields are present
 */
function validateAPlusModule(aplusData, exportMode) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    moduleType: aplusData.moduleType,
    asin: aplusData.asin
  };

  const moduleType = aplusData.moduleType;
  const usePlaceholders = exportMode === 'WITH_PLACEHOLDERS';

  // Get required images for this module type
  const requiredImages = APLUS_IMAGE_SIZES[moduleType] || {};
  const requiredImageFields = Object.keys(requiredImages);

  // Check if module type requires images
  const requiresImages = requiredImageFields.length > 0;

  // For placeholder mode, check if all required placeholders exist
  if (usePlaceholders && requiresImages) {
    for (const field of requiredImageFields) {
      const size = requiredImages[field];
      const placeholderId = lookupPlaceholderBySize(size);

      if (!placeholderId) {
        result.errors.push(`Missing placeholder for ${field} (size: ${size})`);
        result.valid = false;
      } else if (!isValidAmazonUploadId(placeholderId)) {
        result.errors.push(`Invalid placeholder ID for ${field}: ${placeholderId.substring(0, 30)}...`);
        result.valid = false;
      }
    }
  }

  // For normal mode with images, check if images are provided
  if (!usePlaceholders && requiresImages && exportMode !== 'TEXT_ONLY') {
    let hasAnyImage = false;
    for (const field of requiredImageFields) {
      const imageId = aplusData.images?.[`${field}_id`];
      if (imageId && isValidAmazonUploadId(imageId)) {
        hasAnyImage = true;
        break;
      }
    }

    if (!hasAnyImage) {
      result.warnings.push(`Module ${moduleType} has no valid images - may fail to publish`);
    }
  }

  // Check required text fields
  const content = aplusData.moduleContent?.[Object.keys(aplusData.moduleContent || {})[0]] || {};

  // Most modules can work without text, but warn if completely empty
  if (!content.headline && !content.body) {
    result.warnings.push(`Module ${moduleType} has no headline or body text`);
  }

  return result;
}

/**
 * Check if uploadDestinationId is valid Amazon format
 */
function isValidAmazonUploadId(id) {
  if (!id || typeof id !== 'string') return false;
  if (!id.includes('/')) return false;
  if (!id.startsWith('aplus')) return false;

  // Should have UUID pattern
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  return uuidPattern.test(id);
}

/**
 * Get list of all placeholder sizes needed for current modules
 * Returns { size: count } map
 */
function getRequiredPlaceholderSizes(modules) {
  const sizeMap = {};

  for (const mod of modules) {
    const moduleType = mod.moduleType || mod.data?.moduleType;
    if (!moduleType) continue;

    const imageSizes = APLUS_IMAGE_SIZES[moduleType];
    if (!imageSizes) continue;

    for (const [field, size] of Object.entries(imageSizes)) {
      sizeMap[size] = (sizeMap[size] || 0) + 1;
    }
  }

  return sizeMap;
}

/**
 * Pre-flight check for placeholder export
 * Returns report of what's missing before attempting export
 */
function preflightPlaceholderCheck(modules) {
  const report = {
    ready: true,
    totalModules: modules.length,
    modulesRequiringImages: 0,
    missingPlaceholders: [],
    invalidPlaceholders: [],
    coverage: {}
  };

  const requiredSizes = getRequiredPlaceholderSizes(modules);

  for (const size of Object.keys(requiredSizes)) {
    const placeholderId = lookupPlaceholderBySize(size);

    if (!placeholderId) {
      report.missingPlaceholders.push(size);
      report.ready = false;
    } else if (!isValidAmazonUploadId(placeholderId)) {
      report.invalidPlaceholders.push({
        size: size,
        currentId: placeholderId.substring(0, 50)
      });
      report.ready = false;
    } else {
      report.coverage[size] = placeholderId;
    }

    report.modulesRequiringImages += requiredSizes[size];
  }

  return report;
}

/**
 * Generate user-friendly report of placeholder issues
 */
function formatPlaceholderReport(report) {
  let message = '';

  if (report.ready) {
    message += '✅ All placeholders are ready!\n\n';
    message += `Sizes covered: ${Object.keys(report.coverage).length}\n`;
    message += `Modules with images: ${report.modulesRequiringImages}\n`;
  } else {
    message += '❌ Placeholder issues found!\n\n';

    if (report.missingPlaceholders.length > 0) {
      message += '🚫 Missing placeholders:\n';
      for (const size of report.missingPlaceholders) {
        message += `   • ${size}\n`;
      }
      message += '\n';
    }

    if (report.invalidPlaceholders.length > 0) {
      message += '⚠️ Invalid placeholder IDs (need remapping):\n';
      for (const p of report.invalidPlaceholders) {
        message += `   • ${p.size}: ${p.currentId}...\n`;
      }
      message += '\n';
    }

    message += '💡 How to fix:\n';
    message += '1. Upload placeholder images to Seller Central Asset Library\n';
    message += '2. Use "Map Placeholder" to add the uploadDestinationId\n';
    message += '3. Or use "Fix Invalid Placeholders" to correct entries\n';
  }

  return message;
}
