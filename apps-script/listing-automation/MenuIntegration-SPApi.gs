/**
 * SP-API Menu Integration for AmazonListingAutomation
 *
 * HOW TO USE:
 * ============
 * Add this SP-API submenu to your existing onOpen() function in Code-Part2.gs.
 *
 * In your existing onOpen(), after the PA-API Data Collection submenu, add:
 *
 *   .addSubMenu(ui.createMenu('📡 SP-API Data Collection')
 *     .addItem('🔍 Pobierz po ASIN (tylko glowny)', 'menuSPApiFetchByASIN')
 *     .addItem('🔍 Pobierz ASIN + warianty', 'menuSPApiFetchWithVariants')
 *     .addItem('🔎 Szukaj po slowie kluczowym', 'menuSPApiSearchByKeyword')
 *     .addItem('📋 Pobierz z zaznaczonych komorek', 'menuSPApiFetchFromSelection')
 *     .addSeparator()
 *     .addItem('🔐 Setup SP-API Credentials', 'spSetupCredentials')
 *     .addItem('🔌 Test SP-API Connection', 'spTestConnection'))
 *
 *
 * FULL EXAMPLE of updated onOpen():
 * ==================================
 *
 * function onOpen() {
 *   const ui = SpreadsheetApp.getUi();
 *   ui.createMenu('🚀 Amazon Listing Automation')
 *     .addItem('⚙️ Setup: Create Sheets', 'setupSheets')
 *     .addItem('🔐 Setup: Configure Credentials', 'setupCredentials')
 *     .addItem('📋 Setup: Client Sheet Headers', 'setupClientSheetHeaders')
 *     .addSeparator()
 *
 *     // Existing PA-API submenu
 *     .addSubMenu(ui.createMenu('📊 PA-API Data Collection')
 *       .addItem('✅ Sprawdź ASIN (tylko główny)', 'menuFetchMainProductOnly')
 *       .addItem('✅ Sprawdź ASIN + podobne produkty', 'menuFetchMainProductWithSimilar'))
 *
 *     // NEW: SP-API submenu (v2.0 - writes to existing PA-API columns)
 *     .addSubMenu(ui.createMenu('📡 SP-API Data Collection')
 *       .addItem('🔍 Pobierz po ASIN (tylko glowny)', 'menuSPApiFetchByASIN')
 *       .addItem('🔍 Pobierz ASIN + warianty', 'menuSPApiFetchWithVariants')
 *       .addItem('🔎 Szukaj po slowie kluczowym', 'menuSPApiSearchByKeyword')
 *       .addItem('📋 Pobierz z zaznaczonych komorek', 'menuSPApiFetchFromSelection')
 *       .addSeparator()
 *       .addItem('🔐 Setup SP-API Credentials', 'spSetupCredentials')
 *       .addItem('🔌 Test SP-API Connection', 'spTestConnection'))
 *
 *     // ... rest of your menu ...
 *     .addToUi();
 * }
 *
 * @version 2.0
 * @author NetAnaliza / LUKO
 *
 * CHANGELOG v2.0:
 * - SP-API data now writes to EXISTING PA-API columns (no new columns created)
 * - Fetch date goes to Timestamp_Research (not Fetch_Date)
 * - Data_Source column distinguishes SP-API vs PA-API entries
 * - New: menuSPApiFetchWithVariants() - fetches main ASIN + child variants
 *   (uses SP-API relationships: child variations / sibling lookup via parent)
 * - ASIN_Type = "Glowny" for main product, "Wariant" for child variants
 * - Related_To_ASIN links variants back to the main ASIN
 */

// This file serves as documentation for menu integration.
// The actual SP-API functions are in:
// - SPApiAuth-Listing.gs (authentication, token management, marketplace config)
// - SPApiDataCollection.gs (data fetching, writes to RESEARCH tab existing columns)
//
// FILES TO ADD TO AmazonListingAutomation PROJECT:
// 1. SPApiAuth-Listing.gs
// 2. SPApiDataCollection.gs
// 3. (Optional) This file - MenuIntegration-SPApi.gs - just for reference
//
// STEPS:
// 1. Open AmazonListingAutomation in Apps Script editor
// 2. Create new file: SPApiAuth-Listing.gs -> paste content
// 3. Create new file: SPApiDataCollection.gs -> paste content
// 4. Edit Code-Part2.gs -> add SP-API submenu to onOpen() (see example above)
// 5. Save all files
// 6. Reload spreadsheet (close and reopen)
// 7. New menu: Amazon Listing Automation > SP-API Data Collection
// 8. First run: SP-API Data Collection > Setup SP-API Credentials
// 9. Fill in Config sheet: SP_LWA_Client_ID, SP_LWA_Client_Secret, SP_Refresh_Token, SP_Seller_ID
// 10. Test: SP-API Data Collection > Test SP-API Connection
// 11. Use: SP-API Data Collection > Pobierz po ASIN
//
// IMPORTANT: SP-API writes to the same columns PA-API uses in RESEARCH tab.
// If you previously used v1.0 which added extra columns at the end,
// you should DELETE those old SP-API columns (Fetch_Date, Brand, Product_Type,
// Description, Main_Image_URL, etc.) from the end of the RESEARCH tab.
// SP-API v2.0 maps data to the correct PA-API columns automatically.
//
// CONFIG SHEET KEYS TO ADD:
// | Key                    | Value                      | Description                    |
// |------------------------|----------------------------|--------------------------------|
// | SP_LWA_Client_ID       | amzn1.application-oa2-...  | From Amazon Developer Console  |
// | SP_LWA_Client_Secret   | xxxxxxxxxxxxxxxxxxxxxxx    | LWA App secret                 |
// | SP_Refresh_Token       | Atzr|xxxxxxxxxxxxxxxxxx    | From SP-API authorization flow |
// | SP_Seller_ID           | A1XXXXXXXXXXXX             | Your Amazon Seller ID          |
