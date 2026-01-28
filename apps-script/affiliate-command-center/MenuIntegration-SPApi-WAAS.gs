/**
 * SP-API Menu Integration for WAAS (Affiliate Command Center)
 *
 * HOW TO USE:
 * ============
 * Add SP-API import items to the existing Products submenu in Code.gs onOpen().
 *
 * In the existing Products submenu, add a separator and SP-API items:
 *
 *   // Inside the Products submenu builder:
 *   .addSeparator()
 *   .addItem('📡 SP-API: Import by ASIN', 'spMenuImportByASIN')
 *   .addItem('📡 SP-API: Import ASIN + Variants', 'spMenuImportWithVariants')
 *   .addItem('📡 SP-API: Search by Keyword', 'spMenuSearchByKeyword')
 *   .addItem('📡 SP-API: Import from Selection', 'spMenuImportFromSelection')
 *   .addSeparator()
 *   .addItem('🔐 SP-API: Setup Credentials', 'spSetupCredentials')
 *   .addItem('🔌 SP-API: Test Connection', 'spTestConnection')
 *
 *
 * ALTERNATIVELY - as a sub-submenu under Products:
 * =================================================
 *
 * In Code.gs, find where the Products submenu is built and add:
 *
 *   const productsMenu = ui.createMenu('📦 Products')
 *     .addItem('📥 Import by ASIN', 'importByASIN')
 *     .addItem('🔍 Import by Search', 'importBySearch')
 *     .addSeparator()
 *     .addSubMenu(ui.createMenu('📡 SP-API Import')
 *       .addItem('📥 Import by ASIN', 'spMenuImportByASIN')
 *       .addItem('📥 Import ASIN + Variants', 'spMenuImportWithVariants')
 *       .addItem('🔍 Search by Keyword', 'spMenuSearchByKeyword')
 *       .addItem('📋 Import from Selection', 'spMenuImportFromSelection')
 *       .addSeparator()
 *       .addItem('🔐 Setup Credentials', 'spSetupCredentials')
 *       .addItem('🔌 Test Connection', 'spTestConnection'))
 *     .addSeparator()
 *     .addItem('🔄 Update Product Data', 'updateProductData')
 *     .addItem('📊 Sync All Products', 'syncAllProducts')
 *     ...
 *
 *
 * @version 1.0
 * @author NetAnaliza / LUKO
 *
 * SP-API FUNCTIONS (defined in SPApiDataCollection-WAAS.gs):
 * - spMenuImportByASIN()       - Import single/multiple ASINs
 * - spMenuImportWithVariants() - Import ASINs + their child variants
 * - spMenuSearchByKeyword()    - Search Amazon and import results
 * - spMenuImportFromSelection()- Import ASINs from selected cells
 *
 * AUTH FUNCTIONS (defined in SPApiAuth-WAAS.gs):
 * - spSetupCredentials()       - Setup SP-API credentials in Config sheet
 * - spTestConnection()         - Test SP-API connectivity
 *
 * TARGET: Products sheet
 * SOURCE: Source column = "SP-API"
 * DEDUP:  ASIN + Marketplace pair
 * VARIANTS: IsVariant = TRUE/FALSE, HasParent = TRUE/FALSE, ParentAsin
 */

// This file serves as documentation for menu integration.
// The actual SP-API functions are in:
// - SPApiAuth-WAAS.gs (authentication, token management, marketplace config)
// - SPApiDataCollection-WAAS.gs (data fetching, writes to Products tab)
//
// FILES TO ADD TO Affiliate Command Center PROJECT:
// 1. SPApiAuth-WAAS.gs
// 2. SPApiDataCollection-WAAS.gs
// 3. (Optional) This file - MenuIntegration-SPApi-WAAS.gs - just for reference
//
// STEPS:
// 1. Open Affiliate Command Center in Apps Script editor
// 2. Create new file: SPApiAuth-WAAS -> paste SPApiAuth-WAAS.gs content
// 3. Create new file: SPApiDataCollection-WAAS -> paste SPApiDataCollection-WAAS.gs content
// 4. Edit Code.gs -> add SP-API items to Products submenu (see examples above)
// 5. Save all files
// 6. Reload spreadsheet (close and reopen)
// 7. Products menu should now have SP-API items
// 8. First run: Products > SP-API: Setup Credentials
// 9. Fill in Config sheet: SP_LWA_Client_ID, SP_LWA_Client_Secret, SP_Refresh_Token, SP_Seller_ID
// 10. Test: Products > SP-API: Test Connection
// 11. Use: Products > SP-API: Import by ASIN
//
// COLUMN MAPPING (SP-API -> Products sheet):
// | SP-API Field     | Products Column(s)                              |
// |------------------|-------------------------------------------------|
// | ASIN             | ASIN                                            |
// | Title            | Product Name, Title                             |
// | Brand            | Brand, BrandName                                |
// | Price            | Price, ListPrice                                |
// | Category         | Category, CategoryName, MainCategoryName        |
// | Link             | Affiliate Link, Link, Url, ProductUrl           |
// | Main Image       | Image URL, Image0Source, FeaturedImageSource    |
// | Images 1-9       | Image1Source - Image9Source                     |
// | BestSellerRank   | BestSellerRank, BestSellerRank1                 |
// | BSR Category     | BSRProductCategory, BSRProductCategoryName      |
// | EAN              | EAN                                             |
// | Color            | ColorName                                       |
// | Size             | SizeName, SizeLabel                             |
// | Manufacturer     | Manufacturer, ManufacturerLabel                 |
// | Model            | Model, ModelLabel                               |
// | Browse Node      | BrowseNodeDisplayName, browse_node_id           |
// | Bullet Points    | BulletPoints                                    |
// | Features         | Features                                        |
// | Parent ASIN      | ParentAsin                                      |
// | Marketplace      | Marketplace                                     |
// | Source           | Source (= "SP-API")                              |
// | Status           | Status (= "Active")                             |
// | IsVariant        | IsVariant (TRUE/FALSE)                          |
// | HasParent        | HasParent (TRUE/FALSE)                          |
// | HasImages        | HasImages (TRUE/FALSE)                          |
// | HasPrimaryImage  | HasPrimaryImage (TRUE/FALSE)                    |
// | HasDimensions    | HasDimensions (TRUE/FALSE)                      |
// | Currency         | PriceCurrency                                   |
// | ID               | ID (auto-increment)                             |
// | Added Date       | Added Date                                      |
// | Last Updated     | Last Updated                                    |
