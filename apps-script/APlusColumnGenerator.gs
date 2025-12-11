/**
 * A+ Content Column Generator
 * Generates complete column definitions for all 17 Basic + 19 Premium A+ modules
 * Based on Amazon SP-API A+ Content v2020-11-01 and docs/APLUS_PLACEHOLDER_IMAGES_SPEC.md
 */

const LANGUAGES = ['DE', 'EN', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE'];

// ==========================================
// A+ BASIC COLUMNS (17 modules)
// ==========================================

/**
 * Generate complete A+ Basic headers for ALL 17 modules
 */
function getCompleteAPlusBasicHeaders() {
  const control = [
    '☑️ Export',
    'ASIN',
    'moduleNumber',
    'moduleType',
    'contentReferenceKey'
  ];

  const status = [
    'Status',
    'ExportDateTime',
    'ErrorMessage'
  ];

  // Each module has its own set of columns
  const allModules = [
    ...getBasicModule_STANDARD_TEXT(),
    ...getBasicModule_STANDARD_SINGLE_SIDE_IMAGE(),
    ...getBasicModule_STANDARD_HEADER_IMAGE_TEXT(),
    ...getBasicModule_STANDARD_COMPANY_LOGO(),
    ...getBasicModule_STANDARD_IMAGE_TEXT_OVERLAY(),
    ...getBasicModule_STANDARD_SINGLE_IMAGE_HIGHLIGHTS(),
    ...getBasicModule_STANDARD_MULTIPLE_IMAGE_TEXT(),
    ...getBasicModule_STANDARD_FOUR_IMAGE_TEXT(),
    ...getBasicModule_STANDARD_FOUR_IMAGE_TEXT_QUADRANT(),
    ...getBasicModule_STANDARD_THREE_IMAGE_TEXT(),
    ...getBasicModule_STANDARD_COMPARISON_TABLE(),
    ...getBasicModule_STANDARD_PRODUCT_DESCRIPTION(),
    ...getBasicModule_STANDARD_SINGLE_IMAGE_SPECS_DETAIL(),
    ...getBasicModule_STANDARD_IMAGE_SIDEBAR(),
    ...getBasicModule_STANDARD_TECH_SPECS()
  ];

  return [...control, ...allModules, ...status];
}

// ==========================================
// BASIC MODULE 1: STANDARD_TEXT
// ==========================================

function getBasicModule_STANDARD_TEXT() {
  const cols = [];

  // Text fields (multi-language)
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m1_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m1_body_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 2: STANDARD_SINGLE_SIDE_IMAGE (Single Left/Right)
// ==========================================

function getBasicModule_STANDARD_SINGLE_SIDE_IMAGE() {
  const cols = [];

  // Image field
  cols.push('aplus_basic_m2_image_url');
  cols.push('aplus_basic_m2_image_id');
  cols.push('aplus_basic_m2_image_altText');
  cols.push('aplus_basic_m2_imagePositionType'); // LEFT or RIGHT

  // Text fields
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m2_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m2_body_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 3: STANDARD_HEADER_IMAGE_TEXT
// ==========================================

function getBasicModule_STANDARD_HEADER_IMAGE_TEXT() {
  const cols = [];

  // Image field
  cols.push('aplus_basic_m3_image_url');
  cols.push('aplus_basic_m3_image_id');
  cols.push('aplus_basic_m3_image_altText');

  // Text fields
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m3_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m3_body_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 4: STANDARD_COMPANY_LOGO
// ==========================================

function getBasicModule_STANDARD_COMPANY_LOGO() {
  const cols = [];

  // Logo image
  cols.push('aplus_basic_m4_companyLogo_url');
  cols.push('aplus_basic_m4_companyLogo_id');
  cols.push('aplus_basic_m4_companyLogo_altText');

  // Company description
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m4_companyDescription_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 5: STANDARD_IMAGE_TEXT_OVERLAY
// ==========================================

function getBasicModule_STANDARD_IMAGE_TEXT_OVERLAY() {
  const cols = [];

  // Image field
  cols.push('aplus_basic_m5_image_url');
  cols.push('aplus_basic_m5_image_id');
  cols.push('aplus_basic_m5_image_altText');
  cols.push('aplus_basic_m5_overlayColorType'); // BLACK or WHITE

  // Text fields
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m5_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m5_body_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 6: STANDARD_SINGLE_IMAGE_HIGHLIGHTS
// ==========================================

function getBasicModule_STANDARD_SINGLE_IMAGE_HIGHLIGHTS() {
  const cols = [];

  // Image field
  cols.push('aplus_basic_m6_image_url');
  cols.push('aplus_basic_m6_image_id');
  cols.push('aplus_basic_m6_image_altText');

  // Headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m6_headline_${lang}`);
  });

  // 4 Highlights (bullet points)
  for (let i = 1; i <= 4; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m6_highlight${i}_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// BASIC MODULE 7: STANDARD_MULTIPLE_IMAGE_TEXT (Multiple Image Module A)
// ==========================================

function getBasicModule_STANDARD_MULTIPLE_IMAGE_TEXT() {
  const cols = [];

  // Headline and body
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m7_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m7_body_${lang}`);
  });

  // Up to 4 images
  for (let i = 1; i <= 4; i++) {
    cols.push(`aplus_basic_m7_image${i}_url`);
    cols.push(`aplus_basic_m7_image${i}_id`);
    cols.push(`aplus_basic_m7_image${i}_altText`);
  }

  return cols;
}

// ==========================================
// BASIC MODULE 8: STANDARD_FOUR_IMAGE_TEXT
// ==========================================

function getBasicModule_STANDARD_FOUR_IMAGE_TEXT() {
  const cols = [];

  // Module headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m8_headline_${lang}`);
  });

  // 4 blocks with images and text
  for (let i = 1; i <= 4; i++) {
    // Image
    cols.push(`aplus_basic_m8_image${i}_url`);
    cols.push(`aplus_basic_m8_image${i}_id`);
    cols.push(`aplus_basic_m8_image${i}_altText`);

    // Block headline and body
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m8_block${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m8_block${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// BASIC MODULE 9: STANDARD_FOUR_IMAGE_TEXT_QUADRANT
// ==========================================

function getBasicModule_STANDARD_FOUR_IMAGE_TEXT_QUADRANT() {
  const cols = [];

  // Module headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m9_headline_${lang}`);
  });

  // 4 quadrants with images and text
  for (let i = 1; i <= 4; i++) {
    // Image (smaller 135x135)
    cols.push(`aplus_basic_m9_image${i}_url`);
    cols.push(`aplus_basic_m9_image${i}_id`);
    cols.push(`aplus_basic_m9_image${i}_altText`);

    // Block headline and body
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m9_block${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m9_block${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// BASIC MODULE 10: STANDARD_THREE_IMAGE_TEXT
// ==========================================

function getBasicModule_STANDARD_THREE_IMAGE_TEXT() {
  const cols = [];

  // Module headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m10_headline_${lang}`);
  });

  // 3 blocks with images and text
  for (let i = 1; i <= 3; i++) {
    // Image
    cols.push(`aplus_basic_m10_image${i}_url`);
    cols.push(`aplus_basic_m10_image${i}_id`);
    cols.push(`aplus_basic_m10_image${i}_altText`);

    // Block headline and body
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m10_block${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m10_block${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// BASIC MODULE 11: STANDARD_COMPARISON_TABLE (Standard Comparison Chart)
// ==========================================

function getBasicModule_STANDARD_COMPARISON_TABLE() {
  const cols = [];

  // Up to 6 products
  for (let i = 1; i <= 6; i++) {
    // Product image
    cols.push(`aplus_basic_m11_productImage${i}_url`);
    cols.push(`aplus_basic_m11_productImage${i}_id`);
    cols.push(`aplus_basic_m11_productImage${i}_altText`);

    // Product name
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m11_productName${i}_${lang}`);
    });
  }

  // Metric headings (up to 10)
  for (let i = 1; i <= 10; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m11_metricHeading${i}_${lang}`);
    });
  }

  // Metric values (10 metrics × 6 products = 60 values)
  for (let metric = 1; metric <= 10; metric++) {
    for (let product = 1; product <= 6; product++) {
      LANGUAGES.forEach(lang => {
        cols.push(`aplus_basic_m11_metric${metric}_product${product}_${lang}`);
      });
    }
  }

  return cols;
}

// ==========================================
// BASIC MODULE 12: STANDARD_PRODUCT_DESCRIPTION
// ==========================================

function getBasicModule_STANDARD_PRODUCT_DESCRIPTION() {
  const cols = [];

  // Body text only (NO headline - API rejects it)
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m12_body_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 13: STANDARD_SINGLE_IMAGE_SPECS_DETAIL
// ==========================================

function getBasicModule_STANDARD_SINGLE_IMAGE_SPECS_DETAIL() {
  const cols = [];

  // Image
  cols.push('aplus_basic_m13_image_url');
  cols.push('aplus_basic_m13_image_id');
  cols.push('aplus_basic_m13_image_altText');

  // Headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m13_headline_${lang}`);
  });

  // Up to 8 specifications (name/value pairs)
  for (let i = 1; i <= 8; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m13_spec${i}_name_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m13_spec${i}_value_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// BASIC MODULE 14: STANDARD_IMAGE_SIDEBAR
// ==========================================

function getBasicModule_STANDARD_IMAGE_SIDEBAR() {
  const cols = [];

  // Image
  cols.push('aplus_basic_m14_image_url');
  cols.push('aplus_basic_m14_image_id');
  cols.push('aplus_basic_m14_image_altText');
  cols.push('aplus_basic_m14_sidebarPosition'); // LEFT or RIGHT

  // Text fields
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m14_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m14_body_${lang}`);
  });

  return cols;
}

// ==========================================
// BASIC MODULE 15: STANDARD_TECH_SPECS
// ==========================================

function getBasicModule_STANDARD_TECH_SPECS() {
  const cols = [];

  // Headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_basic_m15_headline_${lang}`);
  });

  // Up to 12 specifications
  for (let i = 1; i <= 12; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m15_spec${i}_name_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_basic_m15_spec${i}_value_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// A+ PREMIUM COLUMNS (19 modules)
// ==========================================

/**
 * Generate complete A+ Premium headers for ALL 19 modules
 */
function getCompleteAPlusPremiumHeaders() {
  const control = [
    '☑️ Export',
    'ASIN',
    'moduleNumber',
    'moduleType',
    'contentReferenceKey'
  ];

  const status = [
    'Status',
    'ExportDateTime',
    'ErrorMessage'
  ];

  // All Premium modules
  const allModules = [
    ...getPremiumModule_PREMIUM_TEXT(),
    ...getPremiumModule_PREMIUM_SINGLE_IMAGE_TEXT(),
    ...getPremiumModule_PREMIUM_BACKGROUND_IMAGE_TEXT(),
    ...getPremiumModule_PREMIUM_FULL_IMAGE(),
    ...getPremiumModule_PREMIUM_DUAL_IMAGES_TEXT(),
    ...getPremiumModule_PREMIUM_FOUR_IMAGES_TEXT(),
    ...getPremiumModule_PREMIUM_COMPARISON_TABLE_1(),
    ...getPremiumModule_PREMIUM_COMPARISON_TABLE_2(),
    ...getPremiumModule_PREMIUM_COMPARISON_TABLE_3(),
    ...getPremiumModule_PREMIUM_HOTSPOTS_1(),
    ...getPremiumModule_PREMIUM_HOTSPOTS_2(),
    ...getPremiumModule_PREMIUM_NAVIGATION_CAROUSEL(),
    ...getPremiumModule_PREMIUM_REGIMEN_CAROUSEL(),
    ...getPremiumModule_PREMIUM_SIMPLE_IMAGE_CAROUSEL(),
    ...getPremiumModule_PREMIUM_VIDEO_IMAGE_CAROUSEL(),
    ...getPremiumModule_PREMIUM_FULL_VIDEO(),
    ...getPremiumModule_PREMIUM_VIDEO_WITH_TEXT(),
    ...getPremiumModule_PREMIUM_QA(),
    ...getPremiumModule_PREMIUM_TECHNICAL_SPECIFICATIONS()
  ];

  return [...control, ...allModules, ...status];
}

// ==========================================
// PREMIUM MODULE 1: PREMIUM_TEXT
// ==========================================

function getPremiumModule_PREMIUM_TEXT() {
  const cols = [];

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m1_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m1_body_${lang}`);
  });

  return cols;
}

// ==========================================
// PREMIUM MODULE 2: PREMIUM_SINGLE_IMAGE_TEXT
// ==========================================

function getPremiumModule_PREMIUM_SINGLE_IMAGE_TEXT() {
  const cols = [];

  // Image
  cols.push('aplus_premium_m2_image_url');
  cols.push('aplus_premium_m2_image_id');
  cols.push('aplus_premium_m2_image_altText');

  // Text
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m2_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m2_body_${lang}`);
  });

  return cols;
}

// ==========================================
// PREMIUM MODULE 3: PREMIUM_BACKGROUND_IMAGE_TEXT
// ==========================================

function getPremiumModule_PREMIUM_BACKGROUND_IMAGE_TEXT() {
  const cols = [];

  // Background image (desktop and mobile)
  cols.push('aplus_premium_m3_backgroundImage_url');
  cols.push('aplus_premium_m3_backgroundImage_id');
  cols.push('aplus_premium_m3_backgroundImage_altText');

  // Text
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m3_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m3_body_${lang}`);
  });

  return cols;
}

// ==========================================
// PREMIUM MODULE 4: PREMIUM_FULL_IMAGE
// ==========================================

function getPremiumModule_PREMIUM_FULL_IMAGE() {
  const cols = [];

  // Background image
  cols.push('aplus_premium_m4_backgroundImage_url');
  cols.push('aplus_premium_m4_backgroundImage_id');
  cols.push('aplus_premium_m4_backgroundImage_altText');

  return cols;
}

// ==========================================
// PREMIUM MODULE 5: PREMIUM_DUAL_IMAGES_TEXT
// ==========================================

function getPremiumModule_PREMIUM_DUAL_IMAGES_TEXT() {
  const cols = [];

  // Module headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m5_headline_${lang}`);
  });

  // 2 images with text blocks
  for (let i = 1; i <= 2; i++) {
    cols.push(`aplus_premium_m5_image${i}_url`);
    cols.push(`aplus_premium_m5_image${i}_id`);
    cols.push(`aplus_premium_m5_image${i}_altText`);

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m5_block${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m5_block${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 6: PREMIUM_FOUR_IMAGES_TEXT
// ==========================================

function getPremiumModule_PREMIUM_FOUR_IMAGES_TEXT() {
  const cols = [];

  // 4 images with text
  for (let i = 1; i <= 4; i++) {
    cols.push(`aplus_premium_m6_image${i}_url`);
    cols.push(`aplus_premium_m6_image${i}_id`);
    cols.push(`aplus_premium_m6_image${i}_altText`);

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m6_block${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m6_block${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 7: PREMIUM_COMPARISON_TABLE_1
// ==========================================

function getPremiumModule_PREMIUM_COMPARISON_TABLE_1() {
  const cols = [];

  // Module headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m7_headline_${lang}`);
  });

  // Up to 7 products
  for (let i = 1; i <= 7; i++) {
    cols.push(`aplus_premium_m7_productImage${i}_url`);
    cols.push(`aplus_premium_m7_productImage${i}_id`);
    cols.push(`aplus_premium_m7_productImage${i}_altText`);

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m7_productName${i}_${lang}`);
    });
  }

  // Up to 12 features
  for (let i = 1; i <= 12; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m7_featureHeading${i}_${lang}`);
    });

    // Feature values for each product
    for (let p = 1; p <= 7; p++) {
      LANGUAGES.forEach(lang => {
        cols.push(`aplus_premium_m7_feature${i}_product${p}_${lang}`);
      });
    }
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 8: PREMIUM_COMPARISON_TABLE_2
// ==========================================

function getPremiumModule_PREMIUM_COMPARISON_TABLE_2() {
  const cols = [];

  // Module headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m8_headline_${lang}`);
  });

  // Up to 3 products
  for (let i = 1; i <= 3; i++) {
    cols.push(`aplus_premium_m8_productImage${i}_url`);
    cols.push(`aplus_premium_m8_productImage${i}_id`);
    cols.push(`aplus_premium_m8_productImage${i}_altText`);

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m8_productName${i}_${lang}`);
    });
  }

  // Up to 5 features
  for (let i = 1; i <= 5; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m8_featureHeading${i}_${lang}`);
    });

    for (let p = 1; p <= 3; p++) {
      LANGUAGES.forEach(lang => {
        cols.push(`aplus_premium_m8_feature${i}_product${p}_${lang}`);
      });
    }
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 9: PREMIUM_COMPARISON_TABLE_3
// ==========================================

function getPremiumModule_PREMIUM_COMPARISON_TABLE_3() {
  const cols = [];

  // 3 products exactly
  for (let i = 1; i <= 3; i++) {
    cols.push(`aplus_premium_m9_productImage${i}_url`);
    cols.push(`aplus_premium_m9_productImage${i}_id`);
    cols.push(`aplus_premium_m9_productImage${i}_altText`);

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m9_productName${i}_${lang}`);
    });
  }

  // Up to 5 features
  for (let i = 1; i <= 5; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m9_featureHeading${i}_${lang}`);
    });

    for (let p = 1; p <= 3; p++) {
      LANGUAGES.forEach(lang => {
        cols.push(`aplus_premium_m9_feature${i}_product${p}_${lang}`);
      });
    }
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 10: PREMIUM_HOTSPOTS_1
// ==========================================

function getPremiumModule_PREMIUM_HOTSPOTS_1() {
  const cols = [];

  // Background image
  cols.push('aplus_premium_m10_backgroundImage_url');
  cols.push('aplus_premium_m10_backgroundImage_id');
  cols.push('aplus_premium_m10_backgroundImage_altText');

  // Up to 6 hotspots
  for (let i = 1; i <= 6; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m10_hotspot${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m10_hotspot${i}_body_${lang}`);
    });

    // Hotspot position coordinates
    cols.push(`aplus_premium_m10_hotspot${i}_posX`);
    cols.push(`aplus_premium_m10_hotspot${i}_posY`);
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 11: PREMIUM_HOTSPOTS_2
// ==========================================

function getPremiumModule_PREMIUM_HOTSPOTS_2() {
  const cols = [];

  // Module headline and body
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m11_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m11_body_${lang}`);
  });

  // Background image
  cols.push('aplus_premium_m11_backgroundImage_url');
  cols.push('aplus_premium_m11_backgroundImage_id');
  cols.push('aplus_premium_m11_backgroundImage_altText');

  // Up to 6 hotspots
  for (let i = 1; i <= 6; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m11_hotspot${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m11_hotspot${i}_body_${lang}`);
    });

    cols.push(`aplus_premium_m11_hotspot${i}_posX`);
    cols.push(`aplus_premium_m11_hotspot${i}_posY`);
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 12: PREMIUM_NAVIGATION_CAROUSEL
// ==========================================

function getPremiumModule_PREMIUM_NAVIGATION_CAROUSEL() {
  const cols = [];

  // 2-5 panels
  for (let i = 1; i <= 5; i++) {
    cols.push(`aplus_premium_m12_image${i}_url`);
    cols.push(`aplus_premium_m12_image${i}_id`);
    cols.push(`aplus_premium_m12_image${i}_altText`);

    // Navigation text (horizontal)
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m12_panel${i}_navText_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m12_panel${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m12_panel${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 13: PREMIUM_REGIMEN_CAROUSEL
// ==========================================

function getPremiumModule_PREMIUM_REGIMEN_CAROUSEL() {
  const cols = [];

  // 2-5 steps
  for (let i = 1; i <= 5; i++) {
    cols.push(`aplus_premium_m13_image${i}_url`);
    cols.push(`aplus_premium_m13_image${i}_id`);
    cols.push(`aplus_premium_m13_image${i}_altText`);

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m13_step${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m13_step${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 14: PREMIUM_SIMPLE_IMAGE_CAROUSEL
// ==========================================

function getPremiumModule_PREMIUM_SIMPLE_IMAGE_CAROUSEL() {
  const cols = [];

  // Up to 8 images
  for (let i = 1; i <= 8; i++) {
    cols.push(`aplus_premium_m14_image${i}_url`);
    cols.push(`aplus_premium_m14_image${i}_id`);
    cols.push(`aplus_premium_m14_image${i}_altText`);
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 15: PREMIUM_VIDEO_IMAGE_CAROUSEL
// ==========================================

function getPremiumModule_PREMIUM_VIDEO_IMAGE_CAROUSEL() {
  const cols = [];

  // Up to 6 panels (each can be video OR image)
  for (let i = 1; i <= 6; i++) {
    // Video option
    cols.push(`aplus_premium_m15_panel${i}_video_url`);
    cols.push(`aplus_premium_m15_panel${i}_video_id`);
    cols.push(`aplus_premium_m15_panel${i}_videoThumbnail_url`);

    // Image option (alternative to video)
    cols.push(`aplus_premium_m15_panel${i}_image_url`);
    cols.push(`aplus_premium_m15_panel${i}_image_id`);
    cols.push(`aplus_premium_m15_panel${i}_image_altText`);

    // Text
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m15_panel${i}_headline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m15_panel${i}_subheadline_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m15_panel${i}_body_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 16: PREMIUM_FULL_VIDEO
// ==========================================

function getPremiumModule_PREMIUM_FULL_VIDEO() {
  const cols = [];

  // Video
  cols.push('aplus_premium_m16_video_url');
  cols.push('aplus_premium_m16_video_id');
  cols.push('aplus_premium_m16_videoThumbnail_url');
  cols.push('aplus_premium_m16_videoThumbnail_id');
  cols.push('aplus_premium_m16_videoThumbnail_altText');

  return cols;
}

// ==========================================
// PREMIUM MODULE 17: PREMIUM_VIDEO_WITH_TEXT
// ==========================================

function getPremiumModule_PREMIUM_VIDEO_WITH_TEXT() {
  const cols = [];

  // Video
  cols.push('aplus_premium_m17_video_url');
  cols.push('aplus_premium_m17_video_id');
  cols.push('aplus_premium_m17_videoThumbnail_url');
  cols.push('aplus_premium_m17_videoThumbnail_id');
  cols.push('aplus_premium_m17_videoThumbnail_altText');

  // Text
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m17_headline_${lang}`);
  });

  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m17_body_${lang}`);
  });

  return cols;
}

// ==========================================
// PREMIUM MODULE 18: PREMIUM_QA
// ==========================================

function getPremiumModule_PREMIUM_QA() {
  const cols = [];

  // Up to 6 Q&A pairs
  for (let i = 1; i <= 6; i++) {
    // Optional image for this Q&A
    cols.push(`aplus_premium_m18_qa${i}_image_url`);
    cols.push(`aplus_premium_m18_qa${i}_image_id`);
    cols.push(`aplus_premium_m18_qa${i}_image_altText`);

    // Question and Answer
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m18_qa${i}_question_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m18_qa${i}_answer_${lang}`);
    });
  }

  return cols;
}

// ==========================================
// PREMIUM MODULE 19: PREMIUM_TECHNICAL_SPECIFICATIONS
// ==========================================

function getPremiumModule_PREMIUM_TECHNICAL_SPECIFICATIONS() {
  const cols = [];

  // Headline
  LANGUAGES.forEach(lang => {
    cols.push(`aplus_premium_m19_headline_${lang}`);
  });

  // Up to 15 specifications (vs 12 in Basic)
  for (let i = 1; i <= 15; i++) {
    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m19_spec${i}_name_${lang}`);
    });

    LANGUAGES.forEach(lang => {
      cols.push(`aplus_premium_m19_spec${i}_value_${lang}`);
    });
  }

  return cols;
}
