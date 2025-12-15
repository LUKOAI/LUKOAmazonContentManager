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
  // Get the first language from moduleContent (since locale is at document level)
  const moduleContentKeys = Object.keys(aplusData.moduleContent || {});
  if (moduleContentKeys.length === 0) {
    Logger.log(`⚠️ Warning: No module content found for ${aplusData.moduleType}. Using empty content.`);
  }
  const firstLang = moduleContentKeys[0] || 'EN';
  const content = aplusData.moduleContent?.[firstLang] || {};

  // Generate unique content reference key
  const contentRefKey = `${aplusData.asin}_module${aplusData.moduleNumber}_${Date.now()}`;

  Logger.log(`Building ${aplusData.moduleType} for ASIN ${aplusData.asin}, language: ${firstLang}`);
  Logger.log(`Content keys: ${Object.keys(content).join(', ') || '(empty)'}`);
  Logger.log(`Export mode: ${aplusData.exportMode || 'default'}`);
  Logger.log(`Images available: ${Object.keys(aplusData.images || {}).join(', ') || '(none)'}`);

  // Determine content subtype based on module type
  const isPremium = aplusData.moduleType.startsWith('PREMIUM');
  const contentSubType = isPremium ? 'PREMIUM' : 'STANDARD';

  const contentDocument = {
    name: contentRefKey,
    contentType: 'EBC',  // Enhanced Brand Content
    contentSubType: contentSubType,
    locale: convertMarketplaceToLocale(marketplace),
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

  // Helper function to get image ID or null
  // Enhanced to support image library lookup and placeholder mode
  // Uses APLUS_IMAGE_SIZES map to automatically determine expected size
  function getImageId(fieldName, explicitSize) {
    // Check export mode
    const exportMode = aplusData.exportMode;
    const usePlaceholders = aplusData.usePlaceholders || exportMode === 'WITH_PLACEHOLDERS';

    // Get expected size from map or use explicit size
    const moduleType = aplusData.moduleType;
    const sizeMap = APLUS_IMAGE_SIZES[moduleType] || {};
    const expectedSize = explicitSize || sizeMap[fieldName] || null;

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
    const directId = aplusData.images?.[`${fieldName}_id`];
    if (directId) {
      Logger.log(`Using direct uploadDestinationId for ${fieldName}: ${directId}`);
      return directId;
    }

    // Second priority: Lookup from image library by URL
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

  // ========== STANDARD MODULES ==========

  // 1. STANDARD_TEXT
  if (aplusData.moduleType === 'STANDARD_TEXT') {
    module.standardText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardText.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.standardText.body = body;
  }

  // 2. STANDARD_SINGLE_SIDE_IMAGE
  else if (aplusData.moduleType === 'STANDARD_SINGLE_SIDE_IMAGE') {
    module.standardSingleSideImage = {
      imagePositionType: aplusData.images?.imagePositionType || 'RIGHT',
      block: {}
    };

    const imageId = getImageId('image');
    if (imageId) {
      module.standardSingleSideImage.block.image = {
        uploadDestinationId: imageId
      };
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
    if (imageId) {
      module.standardHeaderImageText.block.image = {
        uploadDestinationId: imageId
      };
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
    if (logoId) {
      module.standardCompanyLogo.companyLogo = {
        uploadDestinationId: logoId
      };
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
    if (imageId) {
      module.standardImageTextOverlay.block.image = {
        uploadDestinationId: imageId
      };
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
    if (imageId) {
      module.standardSingleImageHighlights.image = {
        uploadDestinationId: imageId
      };
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
      if (imageId) {
        images.push({
          uploadDestinationId: imageId
        });
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
    for (let i = 1; i <= 4; i++) {
      const block = {};

      const imageId = getImageId(`image${i}`);
      if (imageId) {
        block.image = {
          uploadDestinationId: imageId
        };
      }

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      // Only add block if it has content
      if (Object.keys(block).length > 0) {
        module.standardFourImageText[`block${i}`] = block;
      }
    }
  }

  // 9. STANDARD_FOUR_IMAGE_TEXT_QUADRANT
  else if (aplusData.moduleType === 'STANDARD_FOUR_IMAGE_TEXT_QUADRANT') {
    module.standardFourImageTextQuadrant = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardFourImageTextQuadrant.headline = headline;

    // Add 4 quadrants with images and text
    // IMPORTANT: Amazon expects block1, block2, block3, block4 as separate fields, NOT an array
    for (let i = 1; i <= 4; i++) {
      const block = {};

      const imageId = getImageId(`image${i}`);
      if (imageId) {
        block.image = {
          uploadDestinationId: imageId
        };
      }

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      // Only add block if it has content
      if (Object.keys(block).length > 0) {
        module.standardFourImageTextQuadrant[`block${i}`] = block;
      }
    }
  }

  // 10. STANDARD_THREE_IMAGE_TEXT
  else if (aplusData.moduleType === 'STANDARD_THREE_IMAGE_TEXT') {
    module.standardThreeImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardThreeImageText.headline = headline;

    // Add 3 blocks with images and text
    // IMPORTANT: Amazon expects block1, block2, block3 as separate fields, NOT an array
    for (let i = 1; i <= 3; i++) {
      const block = {};

      const imageId = getImageId(`image${i}`);
      if (imageId) {
        block.image = {
          uploadDestinationId: imageId
        };
      }

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      // Only add block if it has content
      if (Object.keys(block).length > 0) {
        module.standardThreeImageText[`block${i}`] = block;
      }
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
      if (imageId) {
        column.image = {
          uploadDestinationId: imageId
        };
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
    if (imageId) {
      module.standardSingleImageSpecsDetail.image = {
        uploadDestinationId: imageId
      };
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
    if (imageId) {
      module.standardImageSidebar.sidebarImage = {
        uploadDestinationId: imageId
      };
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

    const body = addParagraphComponent('body', content.body);
    if (body) module.premiumText.body = body;
  }

  // 17. PREMIUM_IMAGE_TEXT
  else if (aplusData.moduleType === 'PREMIUM_IMAGE_TEXT') {
    module.premiumImageText = {};

    // positionType is REQUIRED - default to LEFT
    module.premiumImageText.positionType = aplusData.images?.imagePositionType || 'LEFT';

    const imageId = getImageId('image');
    if (imageId) {
      module.premiumImageText.image = {
        uploadDestinationId: imageId
      };
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

    const body = addParagraphComponent('body', content.body);
    if (body) module.premiumImageText.body = body;
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
    if (bgImageId) {
      module.premiumFullBackgroundText.desktopImage = {
        uploadDestinationId: bgImageId
      };
      // mobileImage is also REQUIRED - use same image as desktop
      module.premiumFullBackgroundText.mobileImage = {
        uploadDestinationId: bgImageId
      };
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
    if (bgImageId) {
      module.premiumFullBackgroundImage.backgroundImage = {
        uploadDestinationId: bgImageId
      };
    }
  }

  // 20. PREMIUM_IMAGE_CAROUSEL
  else if (aplusData.moduleType === 'PREMIUM_IMAGE_CAROUSEL') {
    module.premiumImageCarousel = {};

    // API expects carouselCards (not carouselImages), minimum 2, max 6
    const carouselCards = [];
    for (let i = 1; i <= 6; i++) {
      const imageId = getImageId(`image${i}`);
      if (imageId) {
        carouselCards.push({
          image: {
            uploadDestinationId: imageId
          }
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

    // Add body if provided
    const body = addParagraphComponent('body', content.body);
    if (body) module.premiumImageCarousel.body = body;
  }

  // 21. PREMIUM_SINGLE_IMAGE
  else if (aplusData.moduleType === 'PREMIUM_SINGLE_IMAGE') {
    module.premiumSingleImage = {};

    const imageId = getImageId('image');
    if (imageId) {
      module.premiumSingleImage.image = {
        uploadDestinationId: imageId
      };
    }
  }

  // 22. PREMIUM_FOUR_IMAGE_CAROUSEL
  else if (aplusData.moduleType === 'PREMIUM_FOUR_IMAGE_CAROUSEL') {
    module.premiumFourImageCarousel = {};

    // Add up to 4 carousel images
    const carouselImages = [];
    for (let i = 1; i <= 4; i++) {
      const imageId = getImageId(`image${i}`);
      if (imageId) {
        carouselImages.push({
          uploadDestinationId: imageId
        });
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
      if (imageId) {
        column.image = {
          uploadDestinationId: imageId
        };
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
    if (imageId) {
      module.premiumHotspotImage.image = {
        uploadDestinationId: imageId
      };
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
    for (let i = 1; i <= 3; i++) {
      const block = {};

      const imageId = getImageId(`image${i}`);
      if (imageId) {
        block.image = {
          uploadDestinationId: imageId
        };
      }

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      // Only add block if it has content
      if (Object.keys(block).length > 0) {
        module.premiumThreeImageText[`block${i}`] = block;
      }
    }
  }

  // 26. PREMIUM_FOUR_IMAGE_TEXT
  else if (aplusData.moduleType === 'PREMIUM_FOUR_IMAGE_TEXT') {
    module.premiumFourImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumFourImageText.headline = headline;

    // Add 4 blocks with images and text
    for (let i = 1; i <= 4; i++) {
      const block = {};

      const imageId = getImageId(`image${i}`);
      if (imageId) {
        block.image = {
          uploadDestinationId: imageId
        };
      }

      const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
      if (blockHeadline) block.headline = blockHeadline;

      const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
      if (blockBody) block.body = blockBody;

      // Only add block if it has content
      if (Object.keys(block).length > 0) {
        module.premiumFourImageText[`block${i}`] = block;
      }
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
