/**
 * NetAnaliza Client Manager
 * Manages multiple Amazon seller accounts
 *
 * @version 3.0.0
 * @author NetAnaliza
 */

// ========================================
// CLIENT SETTINGS SHEET
// ========================================

const CLIENT_SETTINGS_HEADERS = [
  '✓ Active',
  'Client Name',
  'Client Email',
  'Seller ID',
  'Marketplace',
  'Marketplace ID',
  'Refresh Token',
  'LWA Client ID',
  'LWA Client Secret',
  'Notes',
  'Created Date',
  'Last Used'
];

/**
 * Generate Client Settings sheet
 */
function generateClientSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Client Settings');

  if (sheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Client Settings exists',
      'Client Settings sheet already exists. Do you want to recreate it?\n\nWARNING: This will delete all existing client data!',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return sheet;
    }

    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('Client Settings');

  // Add headers
  sheet.getRange(1, 1, 1, CLIENT_SETTINGS_HEADERS.length).setValues([CLIENT_SETTINGS_HEADERS]);

  // Format header
  sheet.getRange(1, 1, 1, CLIENT_SETTINGS_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1155CC')
    .setFontColor('#FFFFFF')
    .setWrap(true)
    .setVerticalAlignment('middle');

  // Set column widths
  sheet.setColumnWidth(1, 60);   // Active checkbox
  sheet.setColumnWidth(2, 150);  // Client Name
  sheet.setColumnWidth(3, 180);  // Client Email
  sheet.setColumnWidth(4, 150);  // Seller ID
  sheet.setColumnWidth(5, 100);  // Marketplace
  sheet.setColumnWidth(6, 150);  // Marketplace ID
  sheet.setColumnWidth(7, 300);  // Refresh Token
  sheet.setColumnWidth(8, 250);  // LWA Client ID
  sheet.setColumnWidth(9, 250);  // LWA Client Secret
  sheet.setColumnWidth(10, 200); // Notes

  // Freeze header row
  sheet.setFrozenRows(1);

  // Add data validation for checkbox
  const checkboxRange = sheet.getRange('A2:A100');
  checkboxRange.insertCheckboxes();

  // Add sample/template row
  sheet.appendRow([
    false,
    'Example Client',
    'client@example.com',
    'A3EXAMPLE123456',
    'DE',
    'A1PA6795UKMFR9',
    'Atzr|IwEBIA...',
    'amzn1.application-oa2-client...',
    'amzn1.oa2-cs.v1...',
    'Template - Replace with real data',
    new Date(),
    new Date()
  ]);

  // Color the template row in light gray
  sheet.getRange(2, 1, 1, CLIENT_SETTINGS_HEADERS.length).setBackground('#F3F3F3');

  Logger.log('Client Settings sheet generated');

  return sheet;
}

/**
 * Get active client configuration
 * Returns the first client with Active checkbox = true
 */
function getActiveClient() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Client Settings');

  if (!sheet) {
    throw new Error(
      'Client Settings sheet not found!\n\n' +
      'Please run: Menu → Tools → Setup Client Settings\n' +
      'or Menu → Tools → Generate Spreadsheet'
    );
  }

  const data = sheet.getDataRange().getValues();

  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === true) { // Active checkbox
      const client = {
        rowIndex: i + 1,
        active: true,
        clientName: data[i][1],
        clientEmail: data[i][2],
        sellerId: data[i][3],
        marketplace: data[i][4],
        marketplaceId: data[i][5],
        refreshToken: data[i][6],
        lwaClientId: data[i][7],
        lwaClientSecret: data[i][8],
        notes: data[i][9],
        createdDate: data[i][10],
        lastUsed: data[i][11]
      };

      // Validate only LWA credentials (required for token refresh)
      const missing = [];
      if (!client.lwaClientId) missing.push('LWA Client ID');
      if (!client.lwaClientSecret) missing.push('LWA Client Secret');

      if (missing.length > 0) {
        throw new Error(
          `Active client is missing LWA credentials:\n\n` +
          missing.join(', ') +
          '\n\nPlease fill in these fields in Client Settings sheet.'
        );
      }

      // Set defaults for optional fields
      if (!client.clientName) client.clientName = 'Default Client';
      if (!client.sellerId) client.sellerId = 'UNKNOWN';
      if (!client.marketplace) client.marketplace = 'DE';
      if (!client.marketplaceId) client.marketplaceId = 'A1PA6795UKMFR9'; // Default to DE
      if (!client.refreshToken) client.refreshToken = '';

      // Update Last Used timestamp
      sheet.getRange(i + 1, 12).setValue(new Date());

      return client;
    }
  }

  throw new Error(
    'No active client selected!\n\n' +
    'Please check the "✓ Active" checkbox for one client in the Client Settings sheet.'
  );
}

/**
 * Get all clients
 */
function getAllClients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Client Settings');

  if (!sheet) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const clients = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) { // Has client name
      clients.push({
        rowIndex: i + 1,
        active: data[i][0] === true,
        clientName: data[i][1],
        clientEmail: data[i][2],
        sellerId: data[i][3],
        marketplace: data[i][4],
        marketplaceId: data[i][5],
        refreshToken: data[i][6] ? '***' : '', // Mask token
        lwaClientId: data[i][7] ? '***' : '',   // Mask
        lwaClientSecret: data[i][8] ? '***' : '', // Mask
        notes: data[i][9],
        createdDate: data[i][10],
        lastUsed: data[i][11]
      });
    }
  }

  return clients;
}

/**
 * Switch active client
 */
function switchActiveClient() {
  const ui = SpreadsheetApp.getUi();
  const clients = getAllClients();

  if (clients.length === 0) {
    ui.alert(
      'No Clients Found',
      'No clients configured in Client Settings sheet.\n\nPlease add at least one client first.',
      ui.ButtonSet.OK
    );
    return;
  }

  // Show client selection dialog
  const clientList = clients.map((c, index) =>
    `${index + 1}. ${c.active ? '✓ ' : ''}${c.clientName} (${c.sellerId}) - ${c.marketplace}`
  ).join('\n');

  const response = ui.prompt(
    'Switch Active Client',
    `Current clients:\n\n${clientList}\n\n` +
    `Enter the number of the client to activate (1-${clients.length}):`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const selectedIndex = parseInt(response.getResponseText().trim());

  if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > clients.length) {
    ui.alert('Error', 'Invalid selection. Please enter a number between 1 and ' + clients.length, ui.ButtonSet.OK);
    return;
  }

  const selectedClient = clients[selectedIndex - 1];

  // Deactivate all clients
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Client Settings');

  for (const client of clients) {
    sheet.getRange(client.rowIndex, 1).setValue(false);
  }

  // Activate selected client
  sheet.getRange(selectedClient.rowIndex, 1).setValue(true);

  ui.alert(
    'Client Switched',
    `Active client is now:\n\n` +
    `${selectedClient.clientName}\n` +
    `Seller ID: ${selectedClient.sellerId}\n` +
    `Marketplace: ${selectedClient.marketplace}`,
    ui.ButtonSet.OK
  );
}

/**
 * Show current active client info
 */
function showActiveClientInfo() {
  const ui = SpreadsheetApp.getUi();

  try {
    const client = getActiveClient();

    ui.alert(
      'Active Client',
      `Client Name: ${client.clientName}\n` +
      `Client Email: ${client.clientEmail || 'N/A'}\n` +
      `Seller ID: ${client.sellerId}\n` +
      `Marketplace: ${client.marketplace}\n` +
      `Marketplace ID: ${client.marketplaceId}\n\n` +
      `Notes: ${client.notes || 'N/A'}\n` +
      `Last Used: ${client.lastUsed || 'Never'}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Error', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Add new client
 */
function addNewClient() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Client Settings');

  if (!sheet) {
    sheet = generateClientSettingsSheet();
  }

  // Prompt for client details
  const nameResponse = ui.prompt(
    'Add New Client - Step 1/7',
    'Enter client name:',
    ui.ButtonSet.OK_CANCEL
  );

  if (nameResponse.getSelectedButton() !== ui.Button.OK) return;
  const clientName = nameResponse.getResponseText().trim();

  if (!clientName) {
    ui.alert('Error', 'Client name is required', ui.ButtonSet.OK);
    return;
  }

  const emailResponse = ui.prompt(
    'Add New Client - Step 2/7',
    'Enter client email (optional):',
    ui.ButtonSet.OK_CANCEL
  );

  if (emailResponse.getSelectedButton() !== ui.Button.OK) return;
  const clientEmail = emailResponse.getResponseText().trim();

  const sellerIdResponse = ui.prompt(
    'Add New Client - Step 3/7',
    'Enter Seller ID (e.g., A3EXAMPLE123):',
    ui.ButtonSet.OK_CANCEL
  );

  if (sellerIdResponse.getSelectedButton() !== ui.Button.OK) return;
  const sellerId = sellerIdResponse.getResponseText().trim();

  const marketplaceResponse = ui.prompt(
    'Add New Client - Step 4/7',
    'Enter Marketplace (DE, FR, UK, IT, ES, etc.):',
    ui.ButtonSet.OK_CANCEL
  );

  if (marketplaceResponse.getSelectedButton() !== ui.Button.OK) return;
  const marketplace = marketplaceResponse.getResponseText().trim().toUpperCase();

  // Get marketplace ID from config
  const marketplaceConfig = MARKETPLACE_LANGUAGES[marketplace];
  const marketplaceId = marketplaceConfig ? marketplaceConfig.marketplaceId : '';

  const refreshTokenResponse = ui.prompt(
    'Add New Client - Step 5/7',
    'Enter Refresh Token:',
    ui.ButtonSet.OK_CANCEL
  );

  if (refreshTokenResponse.getSelectedButton() !== ui.Button.OK) return;
  const refreshToken = refreshTokenResponse.getResponseText().trim();

  const lwaClientIdResponse = ui.prompt(
    'Add New Client - Step 6/7',
    'Enter LWA Client ID:',
    ui.ButtonSet.OK_CANCEL
  );

  if (lwaClientIdResponse.getSelectedButton() !== ui.Button.OK) return;
  const lwaClientId = lwaClientIdResponse.getResponseText().trim();

  const lwaClientSecretResponse = ui.prompt(
    'Add New Client - Step 7/7',
    'Enter LWA Client Secret:',
    ui.ButtonSet.OK_CANCEL
  );

  if (lwaClientSecretResponse.getSelectedButton() !== ui.Button.OK) return;
  const lwaClientSecret = lwaClientSecretResponse.getResponseText().trim();

  // Add client to sheet
  sheet.appendRow([
    false, // Not active by default
    clientName,
    clientEmail,
    sellerId,
    marketplace,
    marketplaceId,
    refreshToken,
    lwaClientId,
    lwaClientSecret,
    '',
    new Date(),
    ''
  ]);

  ui.alert(
    'Client Added',
    `Client "${clientName}" has been added successfully!\n\n` +
    `To activate this client, check the "✓ Active" checkbox in the Client Settings sheet.`,
    ui.ButtonSet.OK
  );
}

// ========================================
// MIGRATION FROM OLD CONFIG
// ========================================

/**
 * Migrate data from old Config sheet to Client Settings
 */
function migrateFromOldConfig() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const oldConfigSheet = ss.getSheetByName('Config');

  if (!oldConfigSheet) {
    ui.alert('No Old Config', 'No Config sheet found to migrate from.', ui.ButtonSet.OK);
    return;
  }

  const response = ui.alert(
    'Migrate from Old Config?',
    'Do you want to migrate credentials from the old Config sheet to Client Settings?\n\n' +
    'This will create a new client based on Config sheet data.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  try {
    // Read old config
    const data = oldConfigSheet.getDataRange().getValues();
    const configMap = {};

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        configMap[data[i][0]] = data[i][1];
      }
    }

    // Extract credentials
    const clientName = 'Migrated Client';
    const sellerId = configMap['Seller ID'] || configMap['sellerId'] || '';
    const lwaClientId = configMap['LWA Client ID'] || configMap['lwaClientId'] || '';
    const lwaClientSecret = configMap['LWA Client Secret'] || configMap['lwaClientSecret'] || '';
    const refreshToken = configMap['Refresh Token'] || configMap['refreshToken'] || '';
    const marketplace = 'DE'; // Default
    const marketplaceId = 'A1PA6795UKMFR9'; // DE default

    // Create Client Settings if not exists
    let clientSheet = ss.getSheetByName('Client Settings');
    if (!clientSheet) {
      clientSheet = generateClientSettingsSheet();
    }

    // Add migrated client
    clientSheet.appendRow([
      true, // Active by default
      clientName,
      Session.getActiveUser().getEmail(),
      sellerId,
      marketplace,
      marketplaceId,
      refreshToken,
      lwaClientId,
      lwaClientSecret,
      'Migrated from old Config sheet',
      new Date(),
      new Date()
    ]);

    ui.alert(
      'Migration Complete',
      `Successfully migrated credentials from Config sheet!\n\n` +
      `New client "${clientName}" has been created and activated.\n\n` +
      `You can now safely delete the old Config sheet if you wish.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Migration Error', `Failed to migrate:\n\n${error.message}`, ui.ButtonSet.OK);
  }
}
