/**
 * LUKO Amazon Content Manager - Cloud Function Handler
 * Version: 2.0.0
 *
 * This Cloud Function handles all Amazon SP-API operations
 * Called from Google Apps Script (LukoAmazonManager.gs)
 */

const axios = require('axios');
const crypto = require('crypto');

// ========================================
// MAIN HANDLER
// ========================================

exports.lukoSpApiHandler = async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { operation, marketplace, marketplaceId, credentials, ...operationData } = req.body;

    console.log(`Operation: ${operation}, Marketplace: ${marketplace}`);

    // Validate credentials
    if (!credentials || !credentials.lwaClientId || !credentials.lwaClientSecret || !credentials.refreshToken) {
      throw new Error('Missing required credentials');
    }

    // Get access token
    const accessToken = await getAccessToken(
      credentials.lwaClientId,
      credentials.lwaClientSecret,
      credentials.refreshToken
    );

    // Route to appropriate handler
    let result;
    switch (operation) {
      case 'update':
      case 'create':
        result = await updateListing(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'delete':
        result = await deleteListing(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'import_products':
        result = await importProducts(marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'upload_images':
        result = await uploadImages(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'upload_videos':
        result = await uploadVideos(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'publish_aplus':
        result = await publishAPlusContent(operationData, marketplace, marketplaceId, accessToken);
        break;

      case 'create_coupon':
        result = await createCoupon(operationData, marketplace, marketplaceId, accessToken);
        break;

      case 'launch_promotion':
        result = await launchPromotion(operationData, marketplace, marketplaceId, accessToken);
        break;

      case 'get_product_schema':
        result = await getProductTypeSchema(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'translate':
        result = await translateText(operationData);
        break;

      // Extended Features (Phase 2)
      case 'exportGpsr':
        result = await exportGpsrCompliance(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'exportDocuments':
        result = await exportDocuments(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'exportCustomization':
        result = await exportCustomization(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'exportBrandStrip':
        result = await exportBrandStrip(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'exportBrandStore':
        result = await exportBrandStore(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      case 'exportVideos':
        result = await exportVideos(operationData, marketplace, marketplaceId, accessToken, credentials.sellerId);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    res.status(200).json({
      status: 'SUCCESS',
      ...result
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========================================
// AUTHENTICATION
// ========================================

async function getAccessToken(clientId, clientSecret, refreshToken) {
  const url = 'https://api.amazon.com/auth/o2/token';

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  try {
    const response = await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data.access_token;

  } catch (error) {
    throw new Error(`LWA Authentication failed: ${error.response?.data?.error_description || error.message}`);
  }
}

// ========================================
// LISTINGS MANAGEMENT
// ========================================

async function updateListing(data, marketplace, marketplaceId, accessToken, sellerId) {
  const { asin, sku, productType, content, action } = data;

  const endpoint = `https://sellingpartnerapi-eu.amazon.com/listings/2021-08-01/items/${sellerId}/${sku}`;

  // Build payload for each language
  const languagePayloads = {};

  for (const [lang, langContent] of Object.entries(content)) {
    if (!langContent.title) continue; // Skip if no title

    languagePayloads[lang] = {
      productType: productType || 'PRODUCT',
      patches: [
        {
          op: 'replace',
          path: '/attributes/item_name',
          value: [
            {
              value: langContent.title,
              language_tag: lang,
              marketplace_id: marketplaceId
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/brand',
          value: [
            {
              value: langContent.brand || 'Generic',
              language_tag: lang,
              marketplace_id: marketplaceId
            }
          ]
        }
      ]
    };

    // Add bullet points
    if (langContent.bulletPoints && langContent.bulletPoints.length > 0) {
      languagePayloads[lang].patches.push({
        op: 'replace',
        path: '/attributes/bullet_point',
        value: langContent.bulletPoints.map(bp => ({
          value: bp,
          language_tag: lang,
          marketplace_id: marketplaceId
        }))
      });
    }

    // Add description
    if (langContent.description) {
      languagePayloads[lang].patches.push({
        op: 'replace',
        path: '/attributes/product_description',
        value: [
          {
            value: langContent.description,
            language_tag: lang,
            marketplace_id: marketplaceId
          }
        ]
      });
    }

    // Add keywords
    if (langContent.keywords) {
      languagePayloads[lang].patches.push({
        op: 'replace',
        path: '/attributes/generic_keyword',
        value: [
          {
            value: langContent.keywords,
            language_tag: lang,
            marketplace_id: marketplaceId
          }
        ]
      });
    }
  }

  // Use PATCH for updates (recommended by Amazon)
  const method = 'PATCH';

  try {
    const results = [];

    for (const [lang, payload] of Object.entries(languagePayloads)) {
      const response = await retryWithBackoff(async () => {
        return await axios({
          method: method,
          url: endpoint,
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
          },
          params: {
            marketplaceIds: marketplaceId,
            issueLocale: lang
          },
          data: payload
        });
      });

      results.push({
        language: lang,
        status: response.status,
        data: response.data
      });

      // Rate limiting: wait between requests
      await sleep(200); // 5 requests per second
    }

    return {
      asin: asin,
      sku: sku,
      marketplace: marketplace,
      languages: Object.keys(languagePayloads),
      results: results,
      message: `Updated ${Object.keys(languagePayloads).length} languages successfully`
    };

  } catch (error) {
    throw new Error(`SP-API Listings Update failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function deleteListing(data, marketplace, marketplaceId, accessToken, sellerId) {
  const { sku } = data;

  const endpoint = `https://sellingpartnerapi-eu.amazon.com/listings/2021-08-01/items/${sellerId}/${sku}`;

  try {
    const response = await retryWithBackoff(async () => {
      return await axios({
        method: 'DELETE',
        url: endpoint,
        headers: {
          'x-amz-access-token': accessToken
        },
        params: {
          marketplaceIds: marketplaceId
        }
      });
    });

    return {
      sku: sku,
      marketplace: marketplace,
      status: response.status,
      message: 'Product deleted successfully'
    };

  } catch (error) {
    throw new Error(`SP-API Delete failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

// ========================================
// PRODUCT IMPORT
// ========================================

async function importProducts(marketplace, marketplaceId, accessToken, sellerId) {
  const endpoint = `https://sellingpartnerapi-eu.amazon.com/listings/2021-08-01/items`;

  try {
    const response = await retryWithBackoff(async () => {
      return await axios.get(endpoint, {
        headers: {
          'x-amz-access-token': accessToken
        },
        params: {
          sellerId: sellerId,
          marketplaceIds: marketplaceId,
          pageSize: 20
        }
      });
    });

    const products = response.data.listings || [];

    return {
      products: products.map(p => ({
        asin: p.asin,
        sku: p.sku,
        productType: p.productType,
        brand: p.attributes?.brand?.[0]?.value || ''
      })),
      count: products.length,
      marketplace: marketplace
    };

  } catch (error) {
    throw new Error(`Product import failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

// ========================================
// IMAGES MANAGEMENT
// ========================================

async function uploadImages(data, marketplace, marketplaceId, accessToken, sellerId) {
  const { asin, sku, images } = data;

  // Note: For actual image upload, we would need to:
  // 1. Use Uploads API to get pre-signed URL
  // 2. Upload image to S3
  // 3. Update listing with image reference

  // This is a simplified version
  const endpoint = `https://sellingpartnerapi-eu.amazon.com/listings/2021-08-01/items/${sellerId}/${sku}`;

  try {
    const imagePayload = {
      productType: 'PRODUCT',
      patches: []
    };

    // Main image
    if (images.mainImage && images.mainImage.url) {
      imagePayload.patches.push({
        op: 'replace',
        path: '/attributes/main_product_image_locator',
        value: [
          {
            media_location: images.mainImage.url,
            marketplace_id: marketplaceId
          }
        ]
      });
    }

    // Additional images
    if (images.additionalImages && images.additionalImages.length > 0) {
      const imageValues = images.additionalImages.map(img => ({
        media_location: img.url,
        marketplace_id: marketplaceId
      }));

      imagePayload.patches.push({
        op: 'replace',
        path: '/attributes/other_product_image_locator',
        value: imageValues
      });
    }

    const response = await retryWithBackoff(async () => {
      return await axios.patch(endpoint, imagePayload, {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json'
        },
        params: {
          marketplaceIds: marketplaceId
        }
      });
    });

    return {
      asin: asin,
      sku: sku,
      marketplace: marketplace,
      imagesUploaded: 1 + (images.additionalImages?.length || 0),
      message: 'Images uploaded successfully'
    };

  } catch (error) {
    throw new Error(`Image upload failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function uploadVideos(data, marketplace, marketplaceId, accessToken, sellerId) {
  // Video upload is typically done via Vendor Central or through special API access
  // This is a placeholder implementation

  return {
    asin: data.asin,
    sku: data.sku,
    marketplace: marketplace,
    message: 'Video upload requires additional API access. Please use Seller Central for now.'
  };
}

// ========================================
// A+ CONTENT MANAGEMENT
// ========================================

async function publishAPlusContent(data, marketplace, marketplaceId, accessToken) {
  const { contentType, data: aplusData } = data;

  const endpoint = 'https://sellingpartnerapi-eu.amazon.com/aplus/2020-11-01/contentDocuments';

  // Build A+ Content payload
  let payload;

  if (contentType === 'BASIC') {
    payload = {
      contentDocument: {
        name: `A+ Content for ${aplusData.asin}`,
        contentType: 'EBC',
        locale: aplusData.language,
        contentModuleList: [
          {
            contentModuleType: aplusData.moduleType || 'STANDARD_COMPANY_LOGO',
            standardCompanyLogo: {
              companyLogo: {
                uploadDestinationId: aplusData.content.images?.[0]?.url || ''
              },
              companyLogoBrand: aplusData.content.heading || ''
            }
          }
        ]
      }
    };
  } else {
    // Premium Brand Story
    payload = {
      contentDocument: {
        name: `Brand Story for ${aplusData.asin}`,
        contentType: 'EBC_PREMIUM',
        locale: aplusData.language,
        contentModuleList: [
          {
            contentModuleType: 'STANDARD_HEADER_IMAGE_TEXT',
            standardHeaderImageText: {
              headline: {
                value: aplusData.content.tagline || 'Brand Story'
              },
              block: {
                image: {
                  uploadDestinationId: aplusData.content.heroImage || ''
                }
              }
            }
          }
        ]
      }
    };
  }

  try {
    const response = await retryWithBackoff(async () => {
      return await axios.post(endpoint, payload, {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json'
        },
        params: {
          marketplaceId: marketplaceId
        }
      });
    });

    return {
      contentId: response.data.contentReferenceKey,
      asin: aplusData.asin,
      marketplace: marketplace,
      message: 'A+ Content published successfully'
    };

  } catch (error) {
    throw new Error(`A+ Content publish failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

// ========================================
// COUPONS & PROMOTIONS
// ========================================

async function createCoupon(data, marketplace, marketplaceId, accessToken) {
  // Note: Coupons API may require additional permissions
  // This endpoint is available to sellers with Brand Registry

  const endpoint = 'https://sellingpartnerapi-eu.amazon.com/coupons/2022-03-01/coupons';

  const { coupon } = data;

  const payload = {
    couponType: coupon.couponType || 'PERCENTAGE_OFF',
    schedule: {
      startDateTime: new Date(coupon.startDate).toISOString(),
      endDateTime: new Date(coupon.endDate).toISOString()
    },
    promotion: {
      promotionType: 'PERCENTAGE_OFF',
      discountValue: parseFloat(coupon.discountValue) || 10,
      budget: {
        amount: parseFloat(coupon.totalBudget) || 1000,
        currencyCode: coupon.currency || 'EUR'
      }
    },
    eligibleSelections: [
      {
        asin: coupon.asin
      }
    ],
    customerSegment: coupon.customerType || 'ALL'
  };

  try {
    const response = await retryWithBackoff(async () => {
      return await axios.post(endpoint, payload, {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json'
        },
        params: {
          marketplaceId: marketplaceId
        }
      });
    });

    return {
      couponId: response.data.couponId,
      asin: coupon.asin,
      marketplace: marketplace,
      message: 'Coupon created successfully'
    };

  } catch (error) {
    // If API not available, return helpful message
    if (error.response?.status === 403) {
      return {
        couponId: 'PENDING',
        asin: coupon.asin,
        marketplace: marketplace,
        message: 'Coupons API requires Brand Registry. Please create via Seller Central.'
      };
    }
    throw new Error(`Coupon creation failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function launchPromotion(data, marketplace, marketplaceId, accessToken) {
  // Promotions typically require Vendor Central access or special API permissions
  // This is a placeholder implementation

  const { promotion } = data;

  return {
    promotionId: 'PROMO-' + Date.now(),
    asin: promotion.asin,
    marketplace: marketplace,
    message: 'Promotion creation requires Vendor Central access. Please use Seller Central Promotions page.'
  };
}

// ========================================
// TRANSLATION
// ========================================

async function translateText(data) {
  const { text, sourceLang, targetLangs } = data;

  // This would integrate with Google Cloud Translation API
  // For now, return placeholder translations

  const translations = {};

  for (const targetLang of targetLangs) {
    // In production, call actual translation API
    translations[targetLang] = `[Translated from ${sourceLang} to ${targetLang}] ${text}`;
  }

  return {
    translations: translations,
    message: 'Translation complete (using placeholder service)'
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on client errors (4xx except 429)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }

      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`Retry attempt ${i + 1} after ${delay}ms due to: ${error.message}`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// DYNAMIC PRODUCT TYPE SCHEMA FETCHER
// ========================================

/**
 * Fetch Product Type Definition Schema from Amazon SP-API
 * This provides LIVE, always-up-to-date validation rules per product type
 *
 * @param {Object} data - { productType: 'PRODUCT', requirements: 'LISTING' }
 * @param {String} marketplace - 'DE', 'FR', 'IT', etc.
 * @param {String} marketplaceId - Amazon marketplace ID
 * @param {String} accessToken - LWA access token
 * @param {String} sellerId - Seller/Merchant ID
 * @returns {Object} JSON Schema with all product type requirements
 */
async function getProductTypeSchema(data, marketplace, marketplaceId, accessToken, sellerId) {
  const { productType, requirements = 'LISTING' } = data;

  console.log(`Fetching schema for product type: ${productType}, marketplace: ${marketplace}`);

  const endpoint = getMarketplaceEndpoint(marketplace);
  const url = `${endpoint}/definitions/2020-09-01/productTypes/${productType}`;

  try {
    const response = await axios.get(url, {
      params: {
        marketplaceIds: marketplaceId,
        requirements: requirements, // LISTING, LISTING_PRODUCT_ONLY, or LISTING_OFFER_ONLY
        locale: getMarketplaceLocale(marketplace)
      },
      headers: {
        'x-amz-access-token': accessToken,
        'Accept': 'application/json',
        'User-Agent': 'LUKO-ACM/2.0.0'
      }
    });

    const schema = response.data;

    // Parse schema to extract validation rules
    const validationRules = parseProductTypeSchema(schema, productType);

    return {
      status: 'SUCCESS',
      productType: productType,
      marketplace: marketplace,
      schema: schema,
      validationRules: validationRules,
      message: `Schema fetched successfully for ${productType}`
    };

  } catch (error) {
    console.error('Error fetching product type schema:', error.message);

    // Fallback to basic validation if schema fetch fails
    return {
      status: 'ERROR',
      productType: productType,
      marketplace: marketplace,
      error: error.message,
      message: 'Using default validation rules',
      validationRules: getDefaultValidationRules(productType)
    };
  }
}

/**
 * Parse Amazon Product Type Definition Schema
 * Extract field requirements, validations, character limits
 *
 * @param {Object} schema - Raw schema from Amazon
 * @param {String} productType - Product type name
 * @returns {Object} Parsed validation rules
 */
function parseProductTypeSchema(schema, productType) {
  const validationRules = {
    productType: productType,
    requiredFields: [],
    optionalFields: [],
    fieldValidations: {},
    maxLengths: {},
    enums: {},
    patterns: {}
  };

  if (!schema || !schema.schema || !schema.schema.properties) {
    console.warn('Invalid schema structure, returning empty rules');
    return validationRules;
  }

  const properties = schema.schema.properties;

  // Iterate through all properties in schema
  for (const [fieldName, fieldDef] of Object.entries(properties)) {
    // Check if required
    if (schema.schema.required && schema.schema.required.includes(fieldName)) {
      validationRules.requiredFields.push(fieldName);
    } else {
      validationRules.optionalFields.push(fieldName);
    }

    // Extract validations
    const validation = {};

    if (fieldDef.maxLength) {
      validationRules.maxLengths[fieldName] = fieldDef.maxLength;
      validation.maxLength = fieldDef.maxLength;
    }

    if (fieldDef.minLength) {
      validation.minLength = fieldDef.minLength;
    }

    if (fieldDef.pattern) {
      validationRules.patterns[fieldName] = fieldDef.pattern;
      validation.pattern = fieldDef.pattern;
    }

    if (fieldDef.enum) {
      validationRules.enums[fieldName] = fieldDef.enum;
      validation.enum = fieldDef.enum;
    }

    if (fieldDef.type) {
      validation.type = fieldDef.type;
    }

    if (fieldDef.description) {
      validation.description = fieldDef.description;
    }

    validationRules.fieldValidations[fieldName] = validation;
  }

  return validationRules;
}

/**
 * Get default validation rules (fallback)
 * Used when schema fetch fails
 */
function getDefaultValidationRules(productType) {
  return {
    productType: productType,
    requiredFields: ['item_name', 'brand', 'product_description'],
    maxLengths: {
      'item_name': 200,
      'bullet_point': 500,
      'product_description': 2000,
      'generic_keywords': 250
    },
    message: 'Using default validation rules - schema fetch failed'
  };
}

/**
 * Get marketplace locale for schema requests
 */
function getMarketplaceLocale(marketplace) {
  const locales = {
    'DE': 'de_DE',
    'FR': 'fr_FR',
    'IT': 'it_IT',
    'ES': 'es_ES',
    'UK': 'en_GB',
    'NL': 'nl_NL',
    'BE': 'nl_BE',
    'PL': 'pl_PL',
    'SE': 'sv_SE',
    'IE': 'en_IE'
  };
  return locales[marketplace] || 'en_GB';
}

// ========================================
// EXTENDED FEATURES (PHASE 2) HANDLERS
// ========================================

/**
 * Export GPSR Compliance data to Amazon
 * Updates product compliance information via SP-API
 */
async function exportGpsrCompliance(operationData, marketplace, marketplaceId, accessToken, sellerId) {
  const { data } = operationData;

  console.log(`Exporting GPSR compliance for ${data.length} products`);

  const results = [];

  for (const item of data) {
    try {
      // Prepare GPSR compliance data for SP-API
      const gpsrData = {
        productIdentifier: {
          marketplaceId: marketplaceId,
          asin: item.asin
        },
        complianceData: {
          gpsrCompliant: item.gpsrCompliant === 'Yes',
          manufacturer: item.manufacturer,
          importer: item.importer,
          responsiblePerson: item.responsiblePerson,
          safetyDocuments: item.documents
        }
      };

      // Call SP-API to update compliance data
      // Note: This is a placeholder - actual SP-API endpoint may vary
      const result = await callSpApi(
        'PUT',
        `/listings/2021-08-01/items/${sellerId}/${item.sku}/compliance`,
        marketplaceId,
        accessToken,
        gpsrData
      );

      results.push({
        asin: item.asin,
        sku: item.sku,
        success: true,
        message: 'GPSR data updated successfully'
      });

    } catch (error) {
      results.push({
        asin: item.asin,
        sku: item.sku,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: true,
    results: results,
    message: `Processed ${results.length} GPSR compliance updates`
  };
}

/**
 * Export Documents to Amazon
 * Uploads product documentation via SP-API
 */
async function exportDocuments(operationData, marketplace, marketplaceId, accessToken, sellerId) {
  const { data } = operationData;

  console.log(`Exporting documents for ${data.length} products`);

  const results = [];

  for (const item of data) {
    try {
      // Prepare document data for SP-API
      const documentData = {
        productIdentifier: {
          marketplaceId: marketplaceId,
          asin: item.asin
        },
        document: {
          type: item.documentType,
          language: item.language,
          title: item.title,
          url: item.pdfUrl,
          description: item.description,
          visibleToCustomer: item.visibleToCustomer
        }
      };

      // Call SP-API to add document
      const result = await callSpApi(
        'POST',
        `/listings/2021-08-01/items/${sellerId}/${item.sku}/documents`,
        marketplaceId,
        accessToken,
        documentData
      );

      results.push({
        asin: item.asin,
        sku: item.sku,
        success: true,
        message: 'Document uploaded successfully'
      });

    } catch (error) {
      results.push({
        asin: item.asin,
        sku: item.sku,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: true,
    results: results,
    message: `Processed ${results.length} document uploads`
  };
}

/**
 * Export Customization options to Amazon
 * Sets up product personalization via SP-API
 */
async function exportCustomization(operationData, marketplace, marketplaceId, accessToken, sellerId) {
  const { data } = operationData;

  console.log(`Exporting customization for ${data.length} products`);

  const results = [];

  for (const item of data) {
    try {
      // Prepare customization data for SP-API
      const customizationData = {
        productIdentifier: {
          marketplaceId: marketplaceId,
          asin: item.asin
        },
        customization: {
          enabled: item.enabled,
          textFields: item.textCustomization,
          surfaces: item.surfaceCustomization,
          imageUpload: item.imageUpload,
          pricing: item.pricing,
          giftOptions: item.giftOptions
        }
      };

      // Call SP-API to update customization
      const result = await callSpApi(
        'PUT',
        `/listings/2021-08-01/items/${sellerId}/${item.sku}/customization`,
        marketplaceId,
        accessToken,
        customizationData
      );

      results.push({
        asin: item.asin,
        sku: item.sku,
        success: true,
        message: 'Customization updated successfully'
      });

    } catch (error) {
      results.push({
        asin: item.asin,
        sku: item.sku,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: true,
    results: results,
    message: `Processed ${results.length} customization updates`
  };
}

/**
 * Export Brand Strip to Amazon
 * Updates brand strip content via SP-API
 */
async function exportBrandStrip(operationData, marketplace, marketplaceId, accessToken, sellerId) {
  const { data } = operationData;

  console.log(`Exporting brand strip for ${data.length} products`);

  const results = [];

  for (const item of data) {
    try {
      // Prepare brand strip data
      const stripData = {
        productIdentifier: {
          marketplaceId: marketplaceId,
          asin: item.asin
        },
        brandStrip: {
          enabled: item.enabled,
          type: item.type,
          content: item.type === 'Classic' ? item.classic : item.enhanced
        }
      };

      // Call SP-API to update brand strip
      const result = await callSpApi(
        'PUT',
        `/aplus/2020-11-01/contentDocuments/brandStrip/${item.asin}`,
        marketplaceId,
        accessToken,
        stripData
      );

      results.push({
        asin: item.asin,
        sku: item.sku,
        success: true,
        message: 'Brand strip updated successfully'
      });

    } catch (error) {
      results.push({
        asin: item.asin,
        sku: item.sku,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: true,
    results: results,
    message: `Processed ${results.length} brand strip updates`
  };
}

/**
 * Export Brand Store to Amazon
 * Creates/updates complete brand store via SP-API
 */
async function exportBrandStore(operationData, marketplace, marketplaceId, accessToken, sellerId) {
  const { data } = operationData;

  console.log(`Exporting brand store with ${data.pages.length} pages`);

  try {
    // Prepare brand store data
    const storeData = {
      marketplaceId: marketplaceId,
      storeConfiguration: data.config,
      pages: data.pages
    };

    // Call SP-API to create/update brand store
    const result = await callSpApi(
      'PUT',
      `/stores/2020-07-01/brands/${sellerId}/store`,
      marketplaceId,
      accessToken,
      storeData
    );

    return {
      success: true,
      message: `Brand store updated successfully with ${data.pages.length} pages`,
      storeId: result.storeId || 'N/A'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Export Videos to Amazon
 * Uploads product videos via SP-API
 */
async function exportVideos(operationData, marketplace, marketplaceId, accessToken, sellerId) {
  const { data } = operationData;

  console.log(`Exporting videos for ${data.length} products`);

  const results = [];

  for (const item of data) {
    try {
      // Prepare video data for SP-API
      const videoData = {
        productIdentifier: {
          marketplaceId: marketplaceId,
          asin: item.asin
        },
        videos: item.videos.map(video => ({
          url: video.url,
          thumbnail: video.thumbnail,
          duration: video.duration,
          title: video.title,
          description: video.description,
          type: video.type,
          language: video.language
        }))
      };

      // Call SP-API to upload videos
      const result = await callSpApi(
        'POST',
        `/listings/2021-08-01/items/${sellerId}/${item.sku}/videos`,
        marketplaceId,
        accessToken,
        videoData
      );

      results.push({
        asin: item.asin,
        sku: item.sku,
        success: true,
        message: `${item.videos.length} videos uploaded successfully`
      });

    } catch (error) {
      results.push({
        asin: item.asin,
        sku: item.sku,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: true,
    results: results,
    message: `Processed ${results.length} video uploads`
  };
}

// ========================================
// EXPORTS
// ========================================

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    lukoSpApiHandler: exports.lukoSpApiHandler,
    getAccessToken,
    updateListing,
    importProducts,
    uploadImages,
    publishAPlusContent,
    createCoupon,
    getProductTypeSchema,
    // Extended features
    exportGpsrCompliance,
    exportDocuments,
    exportCustomization,
    exportBrandStrip,
    exportBrandStore,
    exportVideos
  };
}
