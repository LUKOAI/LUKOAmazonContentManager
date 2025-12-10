/**
 * NetAnaliza SP-API Direct
 * Direct SP-API calls without Cloud Functions
 *
 * @version 3.0.0
 * @author NetAnaliza
 */

// ========================================
// PRODUCT SYNC TO AMAZON
// ========================================

/**
 * Sync product to Amazon SP-API directly
 * Replaces callCloudFunction for product updates
 */
function syncProductToAmazonDirect(productData, marketplace, marketplaceConfig) {
  try {
    const client = getActiveClient();

    // Display which client we're using
    showProgress(`[${client.clientName}] Syncing product ${productData.asin || productData.sku} to Amazon ${marketplace}...`);

    // Get access token
    const accessToken = getActiveAccessToken();

    // Prepare feed for product update
    const feedType = 'JSON_LISTINGS_FEED';
    const feedPayload = prepareFeedPayload(productData, marketplace, marketplaceConfig);

    // Submit feed to Amazon
    const feedResult = submitFeed(feedType, feedPayload, marketplaceConfig, accessToken);

    return {
      asin: productData.asin,
      sku: productData.sku,
      marketplace: marketplace,
      clientName: client.clientName,
      sellerId: client.sellerId,
      status: 'SUCCESS',
      message: `Feed submitted: ${feedResult.feedId}`,
      feedId: feedResult.feedId,
      timestamp: new Date()
    };

  } catch (error) {
    const client = getActiveClient();
    return {
      asin: productData.asin,
      sku: productData.sku,
      marketplace: marketplace,
      clientName: client.clientName,
      sellerId: client.sellerId,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

/**
 * Get active access token (refresh if needed)
 */
function getActiveAccessToken() {
  const client = getActiveClient();

  const config = {
    clientId: client.lwaClientId,
    clientSecret: client.lwaClientSecret,
    redirectUri: 'https://ads.netanaliza.com/amazon-callback'
  };

  const tokens = getAccessTokenFromRefresh(client.refreshToken, config);

  return tokens.access_token;
}

/**
 * Prepare feed payload for Listings API
 */
function prepareFeedPayload(productData, marketplace, marketplaceConfig) {
  const payload = {
    header: {
      sellerId: getActiveClient().sellerId,
      version: '2.0',
      issueLocale: 'en_US'
    },
    messages: [
      {
        messageId: 1,
        sku: productData.sku,
        operationType: productData.action || 'UPDATE',
        productType: productData.productType || 'PRODUCT',
        requirements: 'LISTING',
        attributes: {}
      }
    ]
  };

  const message = payload.messages[0];
  const attrs = message.attributes;

  // Add ASIN if provided
  if (productData.asin) {
    attrs.externally_assigned_product_identifier = [{
      marketplace_id: marketplaceConfig.marketplaceId,
      value: productData.asin,
      type: 'ASIN'
    }];
  }

  // Add multi-language content
  if (productData.content) {
    for (const langCode in productData.content) {
      const langData = productData.content[langCode];

      // Convert marketplace lang code to locale (e.g., DE -> de_DE)
      const locale = convertToLocale(langCode, marketplace);

      if (!locale) continue;

      // Title
      if (langData.title) {
        if (!attrs.item_name) attrs.item_name = [];
        attrs.item_name.push({
          language_tag: locale,
          value: langData.title
        });
      }

      // Brand
      if (langData.brand) {
        if (!attrs.brand) attrs.brand = [];
        attrs.brand.push({
          language_tag: locale,
          value: langData.brand
        });
      }

      // Manufacturer
      if (langData.manufacturer) {
        if (!attrs.manufacturer) attrs.manufacturer = [];
        attrs.manufacturer.push({
          language_tag: locale,
          value: langData.manufacturer
        });
      }

      // Bullet points
      if (langData.bulletPoints && langData.bulletPoints.length > 0) {
        if (!attrs.bullet_point) attrs.bullet_point = [];

        for (const bullet of langData.bulletPoints) {
          if (bullet && bullet.trim()) {
            attrs.bullet_point.push({
              language_tag: locale,
              value: bullet
            });
          }
        }
      }

      // Description
      if (langData.description) {
        if (!attrs.product_description) attrs.product_description = [];
        attrs.product_description.push({
          language_tag: locale,
          value: langData.description
        });
      }

      // Generic keywords
      if (langData.keywords) {
        if (!attrs.generic_keyword) attrs.generic_keyword = [];
        attrs.generic_keyword.push({
          language_tag: locale,
          value: langData.keywords
        });
      }

      // Platinum keywords (1-5)
      for (let i = 1; i <= 5; i++) {
        const pkField = `platinumKeywords${i}`;
        if (langData[pkField]) {
          const attrName = `platinum_keywords${i}`;
          if (!attrs[attrName]) attrs[attrName] = [];
          attrs[attrName].push({
            language_tag: locale,
            value: langData[pkField]
          });
        }
      }

      // Target audience keywords
      if (langData.targetAudienceKeywords) {
        if (!attrs.target_audience_keywords) attrs.target_audience_keywords = [];
        attrs.target_audience_keywords.push({
          language_tag: locale,
          value: langData.targetAudienceKeywords
        });
      }

      // Legal disclaimer
      if (langData.legalDisclaimer) {
        if (!attrs.legal_disclaimer) attrs.legal_disclaimer = [];
        attrs.legal_disclaimer.push({
          language_tag: locale,
          value: langData.legalDisclaimer
        });
      }

      // Safety warning
      if (langData.safetyWarning) {
        if (!attrs.safety_warning) attrs.safety_warning = [];
        attrs.safety_warning.push({
          language_tag: locale,
          value: langData.safetyWarning
        });
      }
    }
  }

  // Add images
  if (productData.images) {
    if (productData.images.main) {
      attrs.main_product_image_locator = [{
        media_location: productData.images.main
      }];
    }

    if (productData.images.additional && productData.images.additional.length > 0) {
      attrs.other_product_image_locator_1 = [];

      for (let i = 0; i < productData.images.additional.length && i < 8; i++) {
        if (productData.images.additional[i]) {
          attrs.other_product_image_locator_1.push({
            media_location: productData.images.additional[i]
          });
        }
      }
    }
  }

  // Add non-language-specific fields
  if (productData.modelNumber) {
    attrs.model_number = [{ value: productData.modelNumber }];
  }

  if (productData.releaseDate) {
    attrs.release_date = [{ value: productData.releaseDate }];
  }

  if (productData.packageQuantity) {
    attrs.number_of_items = [{ value: parseInt(productData.packageQuantity) }];
  }

  // Add dimensions
  if (productData.dimensions) {
    const dims = productData.dimensions;

    if (dims.itemLength) {
      attrs.item_length = [{ value: parseFloat(dims.itemLength), unit: 'centimeters' }];
    }
    if (dims.itemWidth) {
      attrs.item_width = [{ value: parseFloat(dims.itemWidth), unit: 'centimeters' }];
    }
    if (dims.itemHeight) {
      attrs.item_height = [{ value: parseFloat(dims.itemHeight), unit: 'centimeters' }];
    }
    if (dims.itemWeight) {
      attrs.item_weight = [{ value: parseFloat(dims.itemWeight), unit: 'kilograms' }];
    }
    if (dims.packageLength) {
      attrs.package_length = [{ value: parseFloat(dims.packageLength), unit: 'centimeters' }];
    }
    if (dims.packageWidth) {
      attrs.package_width = [{ value: parseFloat(dims.packageWidth), unit: 'centimeters' }];
    }
    if (dims.packageHeight) {
      attrs.package_height = [{ value: parseFloat(dims.packageHeight), unit: 'centimeters' }];
    }
    if (dims.packageWeight) {
      attrs.package_weight = [{ value: parseFloat(dims.packageWeight), unit: 'kilograms' }];
    }
  }

  // Add compliance
  if (productData.compliance) {
    const comp = productData.compliance;

    if (comp.countryOfOrigin) {
      attrs.country_of_origin = [{ value: comp.countryOfOrigin }];
    }

    if (comp.batteriesRequired !== undefined) {
      attrs.are_batteries_included = [{ value: comp.batteriesRequired }];
    }

    if (comp.isLithiumBattery !== undefined) {
      attrs.lithium_battery_packaging = [{ value: comp.isLithiumBattery ? 'batteries_contained_in_equipment' : 'batteries_only' }];
    }
  }

  return payload;
}

/**
 * Submit feed to SP-API
 */
function submitFeed(feedType, feedPayload, marketplaceConfig, accessToken) {
  // Step 1: Create feed document
  const createDocResponse = createFeedDocument(feedPayload, accessToken);
  const feedDocumentId = createDocResponse.feedDocumentId;
  const uploadUrl = createDocResponse.url;

  // Step 2: Upload feed content to S3
  uploadFeedContent(uploadUrl, feedPayload);

  // Step 3: Create feed
  const feedResult = createFeed(feedType, [marketplaceConfig.marketplaceId], feedDocumentId, accessToken);

  Logger.log(`Feed created: ${feedResult.feedId}`);

  return feedResult;
}

/**
 * Create feed document
 */
function createFeedDocument(feedPayload, accessToken) {
  const client = getActiveClient();
  const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
  const endpoint = marketplaceConfig.endpoint;

  const url = `${endpoint}/feeds/2021-06-30/documents`;

  const payload = {
    contentType: 'application/json; charset=UTF-8'
  };

  const options = {
    method: 'post',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 201) {
    throw new Error(`Failed to create feed document: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

/**
 * Upload feed content to S3
 */
function uploadFeedContent(uploadUrl, feedPayload) {
  const options = {
    method: 'put',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    },
    payload: JSON.stringify(feedPayload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(uploadUrl, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`Failed to upload feed content: ${response.getContentText()}`);
  }

  Logger.log('Feed content uploaded successfully');
}

/**
 * Create feed
 */
function createFeed(feedType, marketplaceIds, feedDocumentId, accessToken) {
  const client = getActiveClient();
  const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
  const endpoint = marketplaceConfig.endpoint;

  const url = `${endpoint}/feeds/2021-06-30/feeds`;

  const payload = {
    feedType: feedType,
    marketplaceIds: marketplaceIds,
    inputFeedDocumentId: feedDocumentId
  };

  const options = {
    method: 'post',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 202) {
    throw new Error(`Failed to create feed: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Convert language code to locale
 */
function convertToLocale(langCode, marketplace) {
  const localeMap = {
    'DE': {
      'de-DE': 'de_DE',
      'en-GB': 'en_GB',
      'pl-PL': 'pl_PL',
      'tr-TR': 'tr_TR',
      'cs-CZ': 'cs_CZ'
    },
    'FR': {
      'fr-FR': 'fr_FR',
      'en-GB': 'en_GB',
      'de-DE': 'de_DE',
      'es-ES': 'es_ES',
      'it-IT': 'it_IT'
    },
    'IT': {
      'it-IT': 'it_IT',
      'en-GB': 'en_GB',
      'de-DE': 'de_DE',
      'fr-FR': 'fr_FR'
    },
    'ES': {
      'es-ES': 'es_ES',
      'en-GB': 'en_GB',
      'ca-ES': 'ca_ES',
      'eu-ES': 'eu_ES'
    },
    'UK': {
      'en-GB': 'en_GB',
      'de-DE': 'de_DE',
      'fr-FR': 'fr_FR',
      'es-ES': 'es_ES',
      'it-IT': 'it_IT',
      'pl-PL': 'pl_PL'
    },
    'NL': {
      'nl-NL': 'nl_NL',
      'en-GB': 'en_GB',
      'de-DE': 'de_DE',
      'fr-FR': 'fr_FR'
    },
    'PL': {
      'pl-PL': 'pl_PL',
      'en-GB': 'en_GB',
      'de-DE': 'de_DE'
    },
    'SE': {
      'sv-SE': 'sv_SE',
      'en-GB': 'en_GB',
      'de-DE': 'de_DE',
      'fi-FI': 'fi_FI'
    }
  };

  const marketplaceLocales = localeMap[marketplace] || {};
  return marketplaceLocales[langCode] || null;
}

// ========================================
// A+ CONTENT PUBLISHING
// ========================================

/**
 * Publish A+ Content module to Amazon
 */
function publishAPlusContentDirect(aplusData, marketplace, marketplaceConfig) {
  try {
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();

    showProgress(`[${client.clientName}] Publishing A+ Content for ${aplusData.asin}...`);

    // Build A+ Content payload based on module type
    const contentDocument = buildAPlusContentDocument(aplusData, marketplace);

    // Create or update content document
    const contentReferenceKey = `${aplusData.asin}_module${aplusData.moduleNumber}_${Date.now()}`;

    const result = createAPlusContent(contentDocument, contentReferenceKey, marketplaceConfig, accessToken);

    return {
      asin: aplusData.asin,
      moduleNumber: aplusData.moduleNumber,
      contentReferenceKey: contentReferenceKey,
      status: 'SUCCESS',
      message: `A+ Content submitted successfully`,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      asin: aplusData.asin,
      moduleNumber: aplusData.moduleNumber,
      status: 'ERROR',
      message: error.toString(),
      timestamp: new Date()
    };
  }
}

/**
 * Build A+ Content document from module data
 */
function buildAPlusContentDocument(aplusData, marketplace) {
  const contentDocument = {
    contentType: 'EBC',  // Enhanced Brand Content
    contentSubType: aplusData.moduleType,
    locale: convertMarketplaceToLocale(marketplace),
    contentModuleList: []
  };

  // Build module based on type
  const module = {
    contentModuleType: aplusData.moduleType
  };

  // STANDARD_COMPANY_LOGO module
  if (aplusData.moduleType === 'STANDARD_COMPANY_LOGO') {
    module.standardCompanyLogo = {
      companyLogo: {
        uploadDestinationId: null
        // Note: Images must be uploaded to Amazon first via Content Assets API
      }
    };

    // Add descriptions in all languages as textList
    module.standardCompanyLogo.companyDescriptionTextBlock = {};
    for (const lang in aplusData.moduleContent) {
      const locale = convertLanguageToLocale(lang, marketplace);
      if (locale && aplusData.moduleContent[lang].companyDescription) {
        module.standardCompanyLogo.companyDescriptionTextBlock[locale] = {
          value: aplusData.moduleContent[lang].companyDescription,
          decoratorSet: []
        };
      }
    }
  }

  // STANDARD_IMAGE_TEXT_OVERLAY module
  else if (aplusData.moduleType === 'STANDARD_IMAGE_TEXT_OVERLAY') {
    module.standardImageTextOverlay = {
      overlayColorType: aplusData.images.overlayColorType || 'BLACK',
      block: {
        image: {
          uploadDestinationId: null
          // Note: Images must be uploaded to Amazon first via Content Assets API
        }
      }
    };

    // Add headlines and body text as textList
    const headlineList = [];
    const bodyList = [];

    for (const lang in aplusData.moduleContent) {
      const locale = convertLanguageToLocale(lang, marketplace);
      if (!locale) continue;

      if (aplusData.moduleContent[lang].headline) {
        headlineList.push({
          locale: locale,
          value: aplusData.moduleContent[lang].headline,
          decoratorSet: []
        });
      }

      if (aplusData.moduleContent[lang].body) {
        bodyList.push({
          locale: locale,
          value: aplusData.moduleContent[lang].body,
          decoratorSet: []
        });
      }
    }

    if (headlineList.length > 0) {
      module.standardImageTextOverlay.block.headline = { textList: headlineList };
    }

    if (bodyList.length > 0) {
      module.standardImageTextOverlay.block.body = { textList: bodyList };
    }
  }

  // STANDARD_SINGLE_IMAGE_HIGHLIGHTS module
  else if (aplusData.moduleType === 'STANDARD_SINGLE_IMAGE_HIGHLIGHTS') {
    module.standardSingleImageHighlights = {
      image: {
        uploadDestinationId: null
        // Note: Images must be uploaded to Amazon first via Content Assets API
      }
    };

    // Add headlines as textList
    const headlineList = [];
    for (const lang in aplusData.moduleContent) {
      const locale = convertLanguageToLocale(lang, marketplace);
      if (locale && aplusData.moduleContent[lang].headline) {
        headlineList.push({
          locale: locale,
          value: aplusData.moduleContent[lang].headline,
          decoratorSet: []
        });
      }
    }
    if (headlineList.length > 0) {
      module.standardSingleImageHighlights.headline = { textList: headlineList };
    }

    // Add bulleted list items (up to 4 highlights) as textList
    for (let i = 1; i <= 4; i++) {
      const bulletTextList = [];

      for (const lang in aplusData.moduleContent) {
        const locale = convertLanguageToLocale(lang, marketplace);
        const highlightText = aplusData.moduleContent[lang][`highlight${i}`];

        if (locale && highlightText) {
          bulletTextList.push({
            locale: locale,
            value: highlightText,
            decoratorSet: []
          });
        }
      }

      if (bulletTextList.length > 0) {
        if (!module.standardSingleImageHighlights.bulletedListBlock) {
          module.standardSingleImageHighlights.bulletedListBlock = [];
        }
        module.standardSingleImageHighlights.bulletedListBlock.push({
          textList: bulletTextList
        });
      }
    }
  }

  contentDocument.contentModuleList.push(module);

  return contentDocument;
}

/**
 * Create A+ Content document via SP-API
 */
function createAPlusContent(contentDocument, contentReferenceKey, marketplaceConfig, accessToken) {
  const endpoint = marketplaceConfig.endpoint;
  // Add marketplaceId as query parameter
  const url = `${endpoint}/aplus/2020-11-01/contentDocuments?marketplaceId=${marketplaceConfig.marketplaceId}`;

  // Payload should only contain contentDocument
  const payload = {
    contentDocument: contentDocument
  };

  // Debug: Log the payload being sent
  Logger.log(`A+ Content URL: ${url}`);
  Logger.log(`A+ Content Payload: ${JSON.stringify(payload, null, 2)}`);

  const options = {
    method: 'post',
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log(`Creating A+ Content: ${contentReferenceKey}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log(`A+ API Response Code: ${responseCode}`);
  Logger.log(`A+ API Response: ${responseBody}`);

  if (responseCode < 200 || responseCode >= 300) {
    let errorMessage = `SP-API Error ${responseCode}`;
    try {
      const error = JSON.parse(responseBody);
      errorMessage = error.errors?.[0]?.message || error.message || responseBody;
    } catch (e) {
      errorMessage = responseBody;
    }
    throw new Error(errorMessage);
  }

  return JSON.parse(responseBody);
}

/**
 * Convert marketplace code to locale
 */
function convertMarketplaceToLocale(marketplace) {
  const localeMap = {
    'DE': 'de_DE',
    'FR': 'fr_FR',
    'IT': 'it_IT',
    'ES': 'es_ES',
    'UK': 'en_GB',
    'NL': 'nl_NL',
    'PL': 'pl_PL',
    'SE': 'sv_SE'
  };
  return localeMap[marketplace] || 'en_GB';
}

/**
 * Convert language code to locale for specific marketplace
 */
function convertLanguageToLocale(lang, marketplace) {
  const localeMap = {
    'DE': 'de_DE',
    'EN': 'en_GB',
    'FR': 'fr_FR',
    'IT': 'it_IT',
    'ES': 'es_ES',
    'NL': 'nl_NL',
    'PL': 'pl_PL',
    'SE': 'sv_SE'
  };
  return localeMap[lang] || null;
}

/**
 * Call SP-API with proper authentication (enhanced version)
 */
function callSPAPIDirect(method, path, params, accessToken, body) {
  const client = getActiveClient();
  const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
  const endpoint = marketplaceConfig.endpoint;

  let url = endpoint + path;

  // Add query parameters
  if (params && Object.keys(params).length > 0) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    url += '?' + queryString;
  }

  const options = {
    method: method.toLowerCase(),
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  if (body) {
    options.payload = JSON.stringify(body);
  }

  Logger.log(`[${client.clientName}] Calling SP-API: ${method} ${url}`);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode < 200 || responseCode >= 300) {
    let errorMessage = `SP-API Error ${responseCode}`;
    try {
      const error = JSON.parse(responseBody);
      errorMessage = error.errors?.[0]?.message || error.message || errorMessage;
    } catch (e) {
      errorMessage = responseBody;
    }
    throw new Error(errorMessage);
  }

  return JSON.parse(responseBody);
}
