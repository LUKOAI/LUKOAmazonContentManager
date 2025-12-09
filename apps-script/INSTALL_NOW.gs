/**
 * EMERGENCY INSTALLER - Run from Apps Script Editor
 * This version works without UI (can be run from Editor)
 */
function INSTALL_NOW() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    Logger.log('Starting installation...');
    ss.toast('Starting installation...', 'LUKO Installer', 5);

    // Use functions from SetupInstaller.gs (they don't need ss parameter)
    // These are properly defined there and handle everything internally

    // STEP 1: Create Config sheet (FIRST - most important!)
    Logger.log('Step 1: Creating Config sheet');
    ss.toast('Step 1/10: Creating Config sheet', 'Installing...', 3);
    generateConfigSheet(); // From SetupInstaller.gs

    // STEP 2: Create ErrorLog sheet
    Logger.log('Step 2: Creating ErrorLog sheet');
    ss.toast('Step 2/10: Creating ErrorLog sheet', 'Installing...', 3);
    generateErrorLogSheet(); // From SetupInstaller.gs

    // STEP 3: Create Templates sheet
    Logger.log('Step 3: Creating Templates sheet');
    ss.toast('Step 3/10: Creating Templates sheet', 'Installing...', 3);
    generateTemplatesSheet(); // From SetupInstaller.gs

    // STEP 4: Create ProductsMain sheet
    Logger.log('Step 4: Creating ProductsMain sheet');
    ss.toast('Step 4/10: Creating ProductsMain sheet', 'Installing...', 3);
    generateProductsMainSheet(); // From SetupInstaller.gs

    // STEP 5-10: Extended Features sheets (from SheetGeneratorExtension.gs)
    Logger.log('Step 5: Creating GPSR sheet');
    ss.toast('Step 5/10: Creating GPSR sheet', 'Installing...', 3);
    generateGpsrSheet();

    Logger.log('Step 6: Creating Documents sheet');
    ss.toast('Step 6/10: Creating Documents sheet', 'Installing...', 3);
    generateDocumentsSheet();

    Logger.log('Step 7: Creating Customization sheet');
    ss.toast('Step 7/10: Creating Customization sheet', 'Installing...', 3);
    generateCustomizationSheet();

    Logger.log('Step 8: Creating Brand Strip sheet');
    ss.toast('Step 8/10: Creating Brand Strip sheet', 'Installing...', 3);
    generateBrandStripSheet();

    Logger.log('Step 9: Creating Videos sheet');
    ss.toast('Step 9/10: Creating Videos sheet', 'Installing...', 3);
    generateVideosSheet();

    // STEP 10: Brand Store (4 sheets)
    Logger.log('Step 10: Creating Brand Store sheets');
    ss.toast('Step 10/10: Creating Brand Store sheets', 'Installing...', 3);
    generateBrandStoreSheets();

    // Final steps
    Logger.log('Organizing sheets...');
    ss.toast('Organizing sheets...', 'Installing...', 3);
    organizeSheetOrder();

    const configSheet = ss.getSheetByName('Config');
    if (configSheet) {
      ss.setActiveSheet(configSheet);
    }

    Logger.log('✅ Installation complete! Total sheets: ' + ss.getSheets().length);
    ss.toast('✅ Installation complete! All sheets created.', 'Success', 10);

  } catch (error) {
    Logger.log('❌ Installation error: ' + error.toString());
    Logger.log(error.stack);
    SpreadsheetApp.getActiveSpreadsheet().toast('❌ Error: ' + error.toString(), 'Failed', 10);
  }
}
