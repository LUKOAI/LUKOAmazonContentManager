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

      case 'translate':
        result = await translateText(operationData);
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
    createCoupon
  };
}
