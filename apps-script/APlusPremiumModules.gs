/**
 * A+ Premium Module Builders - Extended
 * Additional 14 Premium modules not in base APlusModuleBuilder.gs
 *
 * To be used in buildAPlusContentDocumentComplete()
 */

/**
 * Build PREMIUM_SINGLE_IMAGE_TEXT module
 */
function buildPremiumSingleImageText(aplusData, content, module) {
  module.premiumSingleImageText = {};

  const imageId = getImageId('image');
  if (imageId) {
    module.premiumSingleImageText.image = {
      uploadDestinationId: imageId,
      altText: aplusData.images?.image_altText || ''
    };
  }

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumSingleImageText.headline = headline;

  const body = addParagraphComponent('body', content.body);
  if (body) module.premiumSingleImageText.body = body;
}

/**
 * Build PREMIUM_BACKGROUND_IMAGE_TEXT module
 */
function buildPremiumBackgroundImageText(aplusData, content, module) {
  module.premiumBackgroundImageText = {};

  const bgImageId = getImageId('backgroundImage');
  if (bgImageId) {
    module.premiumBackgroundImageText.backgroundImage = {
      uploadDestinationId: bgImageId,
      altText: aplusData.images?.backgroundImage_altText || ''
    };
  }

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumBackgroundImageText.headline = headline;

  const body = addParagraphComponent('body', content.body);
  if (body) module.premiumBackgroundImageText.body = body;
}

/**
 * Build PREMIUM_FULL_IMAGE module
 */
function buildPremiumFullImage(aplusData, content, module) {
  module.premiumFullImage = {};

  const bgImageId = getImageId('backgroundImage');
  if (bgImageId) {
    module.premiumFullImage.backgroundImage = {
      uploadDestinationId: bgImageId,
      altText: aplusData.images?.backgroundImage_altText || ''
    };
  }
}

/**
 * Build PREMIUM_DUAL_IMAGES_TEXT module
 */
function buildPremiumDualImagesText(aplusData, content, module) {
  module.premiumDualImagesText = {};

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumDualImagesText.headline = headline;

  // 2 blocks
  for (let i = 1; i <= 2; i++) {
    const block = {};

    const imageId = getImageId(`image${i}`);
    if (imageId) {
      block.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`image${i}_altText`] || ''
      };
    }

    const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
    if (blockHeadline) block.headline = blockHeadline;

    const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
    if (blockBody) block.body = blockBody;

    if (Object.keys(block).length > 0) {
      module.premiumDualImagesText[`block${i}`] = block;
    }
  }
}

/**
 * Build PREMIUM_FOUR_IMAGES_TEXT module
 */
function buildPremiumFourImagesText(aplusData, content, module) {
  module.premiumFourImagesText = {};

  // 4 blocks
  for (let i = 1; i <= 4; i++) {
    const block = {};

    const imageId = getImageId(`image${i}`);
    if (imageId) {
      block.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`image${i}_altText`] || ''
      };
    }

    const blockHeadline = addTextComponent(`block${i}_headline`, content[`block${i}_headline`]);
    if (blockHeadline) block.headline = blockHeadline;

    const blockBody = addParagraphComponent(`block${i}_body`, content[`block${i}_body`]);
    if (blockBody) block.body = blockBody;

    if (Object.keys(block).length > 0) {
      module.premiumFourImagesText[`block${i}`] = block;
    }
  }
}

/**
 * Build PREMIUM_COMPARISON_TABLE_1 (4-7 products, 5-12 features)
 */
function buildPremiumComparisonTable1(aplusData, content, module) {
  module.premiumComparisonTable1 = {};

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumComparisonTable1.headline = headline;

  const productColumns = [];
  for (let i = 1; i <= 7; i++) {
    const column = {};

    const imageId = getImageId(`productImage${i}`);
    if (imageId) {
      column.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`productImage${i}_altText`] || ''
      };
    }

    const productName = addTextComponent(`productName${i}`, content[`productName${i}`]);
    if (productName) column.title = productName;

    // Features for this product (up to 12)
    const features = [];
    for (let j = 1; j <= 12; j++) {
      const featureValue = content[`feature${j}_product${i}`];
      if (featureValue) {
        features.push(addTextComponent(`feature${j}_product${i}`, featureValue));
      }
    }
    if (features.length > 0) {
      column.features = features;
    }

    if (Object.keys(column).length > 0) {
      productColumns.push(column);
    }
  }

  if (productColumns.length > 0) {
    module.premiumComparisonTable1.productColumns = productColumns;
  }

  // Feature headings (up to 12)
  const featureHeadings = [];
  for (let i = 1; i <= 12; i++) {
    const heading = content[`featureHeading${i}`];
    if (heading) {
      featureHeadings.push(addTextComponent(`featureHeading${i}`, heading));
    }
  }
  if (featureHeadings.length > 0) {
    module.premiumComparisonTable1.featureRowLabels = featureHeadings;
  }
}

/**
 * Build PREMIUM_COMPARISON_TABLE_2 (2-3 products, 2-5 features)
 */
function buildPremiumComparisonTable2(aplusData, content, module) {
  module.premiumComparisonTable2 = {};

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumComparisonTable2.headline = headline;

  const productColumns = [];
  for (let i = 1; i <= 3; i++) {
    const column = {};

    const imageId = getImageId(`productImage${i}`);
    if (imageId) {
      column.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`productImage${i}_altText`] || ''
      };
    }

    const productName = addTextComponent(`productName${i}`, content[`productName${i}`]);
    if (productName) column.title = productName;

    const features = [];
    for (let j = 1; j <= 5; j++) {
      const featureValue = content[`feature${j}_product${i}`];
      if (featureValue) {
        features.push(addTextComponent(`feature${j}_product${i}`, featureValue));
      }
    }
    if (features.length > 0) {
      column.features = features;
    }

    if (Object.keys(column).length > 0) {
      productColumns.push(column);
    }
  }

  if (productColumns.length > 0) {
    module.premiumComparisonTable2.productColumns = productColumns;
  }

  const featureHeadings = [];
  for (let i = 1; i <= 5; i++) {
    const heading = content[`featureHeading${i}`];
    if (heading) {
      featureHeadings.push(addTextComponent(`featureHeading${i}`, heading));
    }
  }
  if (featureHeadings.length > 0) {
    module.premiumComparisonTable2.featureRowLabels = featureHeadings;
  }
}

/**
 * Build PREMIUM_COMPARISON_TABLE_3 (exactly 3 products, 2-5 features)
 */
function buildPremiumComparisonTable3(aplusData, content, module) {
  module.premiumComparisonTable3 = {};

  const productColumns = [];
  for (let i = 1; i <= 3; i++) {
    const column = {};

    const imageId = getImageId(`productImage${i}`);
    if (imageId) {
      column.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`productImage${i}_altText`] || ''
      };
    }

    const productName = addTextComponent(`productName${i}`, content[`productName${i}`]);
    if (productName) column.title = productName;

    const features = [];
    for (let j = 1; j <= 5; j++) {
      const featureValue = content[`feature${j}_product${i}`];
      if (featureValue) {
        features.push(addTextComponent(`feature${j}_product${i}`, featureValue));
      }
    }
    if (features.length > 0) {
      column.features = features;
    }

    if (Object.keys(column).length > 0) {
      productColumns.push(column);
    }
  }

  if (productColumns.length > 0) {
    module.premiumComparisonTable3.productColumns = productColumns;
  }

  const featureHeadings = [];
  for (let i = 1; i <= 5; i++) {
    const heading = content[`featureHeading${i}`];
    if (heading) {
      featureHeadings.push(addTextComponent(`featureHeading${i}`, heading));
    }
  }
  if (featureHeadings.length > 0) {
    module.premiumComparisonTable3.featureRowLabels = featureHeadings;
  }
}

/**
 * Build PREMIUM_HOTSPOTS_1 (no module headline)
 */
function buildPremiumHotspots1(aplusData, content, module) {
  module.premiumHotspots1 = {};

  const bgImageId = getImageId('backgroundImage');
  if (bgImageId) {
    module.premiumHotspots1.backgroundImage = {
      uploadDestinationId: bgImageId,
      altText: aplusData.images?.backgroundImage_altText || ''
    };
  }

  // Up to 6 hotspots
  const hotspots = [];
  for (let i = 1; i <= 6; i++) {
    const hotspot = {};

    const headline = addTextComponent(`hotspot${i}_headline`, content[`hotspot${i}_headline`]);
    if (headline) hotspot.headline = headline;

    const body = addParagraphComponent(`hotspot${i}_body`, content[`hotspot${i}_body`]);
    if (body) hotspot.body = body;

    // Position coordinates (optional)
    const posX = aplusData.images?.[`hotspot${i}_posX`];
    const posY = aplusData.images?.[`hotspot${i}_posY`];
    if (posX && posY) {
      hotspot.position = { x: posX, y: posY };
    }

    if (Object.keys(hotspot).length > 0) {
      hotspots.push(hotspot);
    }
  }

  if (hotspots.length > 0) {
    module.premiumHotspots1.hotspots = hotspots;
  }
}

/**
 * Build PREMIUM_HOTSPOTS_2 (with module headline and body)
 */
function buildPremiumHotspots2(aplusData, content, module) {
  module.premiumHotspots2 = {};

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumHotspots2.headline = headline;

  const body = addParagraphComponent('body', content.body);
  if (body) module.premiumHotspots2.body = body;

  const bgImageId = getImageId('backgroundImage');
  if (bgImageId) {
    module.premiumHotspots2.backgroundImage = {
      uploadDestinationId: bgImageId,
      altText: aplusData.images?.backgroundImage_altText || ''
    };
  }

  const hotspots = [];
  for (let i = 1; i <= 6; i++) {
    const hotspot = {};

    const hotspotHeadline = addTextComponent(`hotspot${i}_headline`, content[`hotspot${i}_headline`]);
    if (hotspotHeadline) hotspot.headline = hotspotHeadline;

    const hotspotBody = addParagraphComponent(`hotspot${i}_body`, content[`hotspot${i}_body`]);
    if (hotspotBody) hotspot.body = hotspotBody;

    const posX = aplusData.images?.[`hotspot${i}_posX`];
    const posY = aplusData.images?.[`hotspot${i}_posY`];
    if (posX && posY) {
      hotspot.position = { x: posX, y: posY };
    }

    if (Object.keys(hotspot).length > 0) {
      hotspots.push(hotspot);
    }
  }

  if (hotspots.length > 0) {
    module.premiumHotspots2.hotspots = hotspots;
  }
}

/**
 * Build PREMIUM_NAVIGATION_CAROUSEL (horizontal nav, 2-5 panels)
 */
function buildPremiumNavigationCarousel(aplusData, content, module) {
  module.premiumNavigationCarousel = {};

  const panels = [];
  for (let i = 1; i <= 5; i++) {
    const panel = {};

    const imageId = getImageId(`image${i}`);
    if (imageId) {
      panel.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`image${i}_altText`] || ''
      };
    }

    const navText = addTextComponent(`panel${i}_navText`, content[`panel${i}_navText`]);
    if (navText) panel.navigationText = navText;

    const headline = addTextComponent(`panel${i}_headline`, content[`panel${i}_headline`]);
    if (headline) panel.headline = headline;

    const body = addParagraphComponent(`panel${i}_body`, content[`panel${i}_body`]);
    if (body) panel.body = body;

    if (Object.keys(panel).length > 0) {
      panels.push(panel);
    }
  }

  if (panels.length > 0) {
    module.premiumNavigationCarousel.panels = panels;
  }
}

/**
 * Build PREMIUM_REGIMEN_CAROUSEL (vertical steps, 2-5 steps)
 */
function buildPremiumRegimenCarousel(aplusData, content, module) {
  module.premiumRegimenCarousel = {};

  const steps = [];
  for (let i = 1; i <= 5; i++) {
    const step = {};

    const imageId = getImageId(`image${i}`);
    if (imageId) {
      step.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`image${i}_altText`] || ''
      };
    }

    const headline = addTextComponent(`step${i}_headline`, content[`step${i}_headline`]);
    if (headline) step.headline = headline;

    const body = addParagraphComponent(`step${i}_body`, content[`step${i}_body`]);
    if (body) step.body = body;

    if (Object.keys(step).length > 0) {
      steps.push(step);
    }
  }

  if (steps.length > 0) {
    module.premiumRegimenCarousel.steps = steps;
  }
}

/**
 * Build PREMIUM_SIMPLE_IMAGE_CAROUSEL (up to 8 images)
 */
function buildPremiumSimpleImageCarousel(aplusData, content, module) {
  module.premiumSimpleImageCarousel = {};

  const carouselImages = [];
  for (let i = 1; i <= 8; i++) {
    const imageId = getImageId(`image${i}`);
    if (imageId) {
      carouselImages.push({
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`image${i}_altText`] || ''
      });
    }
  }

  if (carouselImages.length > 0) {
    module.premiumSimpleImageCarousel.carouselImages = carouselImages;
  }
}

/**
 * Build PREMIUM_VIDEO_IMAGE_CAROUSEL (up to 6 panels, video OR image per panel)
 */
function buildPremiumVideoImageCarousel(aplusData, content, module) {
  module.premiumVideoImageCarousel = {};

  const panels = [];
  for (let i = 1; i <= 6; i++) {
    const panel = {};

    // Check for video first
    const videoId = aplusData.images?.[`panel${i}_video_id`];
    if (videoId) {
      panel.video = {
        uploadDestinationId: videoId,
        thumbnailUrl: aplusData.images?.[`panel${i}_videoThumbnail_url`] || ''
      };
    } else {
      // Fallback to image
      const imageId = getImageId(`panel${i}_image`);
      if (imageId) {
        panel.image = {
          uploadDestinationId: imageId,
          altText: aplusData.images?.[`panel${i}_image_altText`] || ''
        };
      }
    }

    const headline = addTextComponent(`panel${i}_headline`, content[`panel${i}_headline`]);
    if (headline) panel.headline = headline;

    const subheadline = addTextComponent(`panel${i}_subheadline`, content[`panel${i}_subheadline`]);
    if (subheadline) panel.subheadline = subheadline;

    const body = addParagraphComponent(`panel${i}_body`, content[`panel${i}_body`]);
    if (body) panel.body = body;

    if (Object.keys(panel).length > 0) {
      panels.push(panel);
    }
  }

  if (panels.length > 0) {
    module.premiumVideoImageCarousel.panels = panels;
  }
}

/**
 * Build PREMIUM_FULL_VIDEO
 */
function buildPremiumFullVideo(aplusData, content, module) {
  module.premiumFullVideo = {};

  const videoId = aplusData.images?.video_id;
  if (videoId) {
    module.premiumFullVideo.video = {
      uploadDestinationId: videoId,
      thumbnailUrl: aplusData.images?.videoThumbnail_url || '',
      thumbnailUploadDestinationId: aplusData.images?.videoThumbnail_id || ''
    };
  }
}

/**
 * Build PREMIUM_VIDEO_WITH_TEXT
 */
function buildPremiumVideoWithText(aplusData, content, module) {
  module.premiumVideoWithText = {};

  const videoId = aplusData.images?.video_id;
  if (videoId) {
    module.premiumVideoWithText.video = {
      uploadDestinationId: videoId,
      thumbnailUrl: aplusData.images?.videoThumbnail_url || '',
      thumbnailUploadDestinationId: aplusData.images?.videoThumbnail_id || ''
    };
  }

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumVideoWithText.headline = headline;

  const body = addParagraphComponent('body', content.body);
  if (body) module.premiumVideoWithText.body = body;
}

/**
 * Build PREMIUM_QA (up to 6 Q&A pairs with optional images)
 */
function buildPremiumQA(aplusData, content, module) {
  module.premiumQA = {};

  const qaPairs = [];
  for (let i = 1; i <= 6; i++) {
    const pair = {};

    const question = addTextComponent(`qa${i}_question`, content[`qa${i}_question`]);
    if (question) pair.question = question;

    const answer = addParagraphComponent(`qa${i}_answer`, content[`qa${i}_answer`]);
    if (answer) pair.answer = answer;

    // Optional image
    const imageId = getImageId(`qa${i}_image`);
    if (imageId) {
      pair.image = {
        uploadDestinationId: imageId,
        altText: aplusData.images?.[`qa${i}_image_altText`] || ''
      };
    }

    if (Object.keys(pair).length > 0) {
      qaPairs.push(pair);
    }
  }

  if (qaPairs.length > 0) {
    module.premiumQA.qaPairs = qaPairs;
  }
}

/**
 * Build PREMIUM_TECHNICAL_SPECIFICATIONS (up to 15 specs)
 */
function buildPremiumTechnicalSpecifications(aplusData, content, module) {
  module.premiumTechnicalSpecifications = {};

  const headline = addTextComponent('headline', content.headline);
  if (headline) module.premiumTechnicalSpecifications.headline = headline;

  const specifications = [];
  for (let i = 1; i <= 15; i++) {
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
    module.premiumTechnicalSpecifications.specificationList = specifications;
  }
}
