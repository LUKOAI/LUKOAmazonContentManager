/**
 * A+ Content Module Builder - Complete Implementation
 * Handles all A+ Basic and Premium module types
 */

/**
 * Build A+ Content document from module data - COMPLETE VERSION
 * Supports ALL module types from Amazon SP-API A+ Content v2020-11-01
 */
function buildAPlusContentDocumentComplete(aplusData, marketplace) {
  // Get the first language from moduleContent (since locale is at document level)
  const firstLang = Object.keys(aplusData.moduleContent)[0];
  const content = aplusData.moduleContent[firstLang];

  // Generate unique content reference key
  const contentRefKey = `${aplusData.asin}_module${aplusData.moduleNumber}_${Date.now()}`;

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
  // Enhanced to support image library lookup
  function getImageId(fieldName) {
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
    const blocks = [];
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

      if (Object.keys(block).length > 0) {
        blocks.push(block);
      }
    }
    if (blocks.length > 0) {
      module.standardFourImageText.block = blocks;
    }
  }

  // 9. STANDARD_FOUR_IMAGE_TEXT_QUADRANT
  else if (aplusData.moduleType === 'STANDARD_FOUR_IMAGE_TEXT_QUADRANT') {
    module.standardFourImageTextQuadrant = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardFourImageTextQuadrant.headline = headline;

    // Add 4 quadrants with images and text
    const blocks = [];
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

      if (Object.keys(block).length > 0) {
        blocks.push(block);
      }
    }
    if (blocks.length > 0) {
      module.standardFourImageTextQuadrant.block = blocks;
    }
  }

  // 10. STANDARD_THREE_IMAGE_TEXT
  else if (aplusData.moduleType === 'STANDARD_THREE_IMAGE_TEXT') {
    module.standardThreeImageText = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardThreeImageText.headline = headline;

    // Add 3 blocks with images and text
    const blocks = [];
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

      if (Object.keys(block).length > 0) {
        blocks.push(block);
      }
    }
    if (blocks.length > 0) {
      module.standardThreeImageText.block = blocks;
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
  else if (aplusData.moduleType === 'STANDARD_PRODUCT_DESCRIPTION') {
    module.standardProductDescription = {};

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.standardProductDescription.headline = headline;

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

    const imageId = getImageId('image');
    if (imageId) {
      module.premiumImageText.image = {
        uploadDestinationId: imageId
      };
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumImageText.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.premiumImageText.body = body;
  }

  // 18. PREMIUM_FULL_BACKGROUND_TEXT
  else if (aplusData.moduleType === 'PREMIUM_FULL_BACKGROUND_TEXT') {
    module.premiumFullBackgroundText = {};

    const bgImageId = getImageId('backgroundImage');
    if (bgImageId) {
      module.premiumFullBackgroundText.backgroundImage = {
        uploadDestinationId: bgImageId
      };
    }

    const headline = addTextComponent('headline', content.headline);
    if (headline) module.premiumFullBackgroundText.headline = headline;

    const body = addParagraphComponent('body', content.body);
    if (body) module.premiumFullBackgroundText.body = body;
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

    // Add up to 8 carousel images
    const carouselImages = [];
    for (let i = 1; i <= 8; i++) {
      const imageId = getImageId(`image${i}`);
      if (imageId) {
        carouselImages.push({
          uploadDestinationId: imageId
        });
      }
    }
    if (carouselImages.length > 0) {
      module.premiumImageCarousel.carouselImages = carouselImages;
    }
  }

  contentDocument.contentModuleList.push(module);

  return contentDocument;
}
