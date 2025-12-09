/**
 * SP-API OAuth Token Exchange - Manual Only
 * Manual exchange of authorization codes for tokens
 *
 * @version 3.0
 * @author NetAnaliza
 */

// ==================== CONFIGURATION ====================

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    throw new Error('Config sheet not found!');
  }

  // Read config values from Config sheet
  const data = configSheet.getDataRange().getValues();
  const config = {};

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      config[data[i][0]] = data[i][1];
    }
  }

  return {
    clientId: config['LWA Client ID'] || config['lwaClientId'],
    clientSecret: config['LWA Client Secret'] || config['lwaClientSecret'],
    redirectUri: config['OAuth Redirect URI'] || config['redirectUri'] || 'https://ads.netanaliza.com/amazon-callback',
    sellerId: config['Seller ID'] || config['sellerId']
  };
}

// ==================== MANUAL FUNCTIONS ====================

/**
 * Get configuration from Client Settings (active client)
 */
function getConfigFromActiveClient() {
  try {
    const client = getActiveClient();
    return {
      clientId: client.lwaClientId,
      clientSecret: client.lwaClientSecret,
      redirectUri: 'https://ads.netanaliza.com/amazon-callback',
      sellerId: client.sellerId
    };
  } catch (error) {
    // Fallback to old getConfig if Client Settings not available
    return getConfig();
  }
}

/**
 * Manual: Exchange authorization code for refresh token
 */
function exchangeAuthorizationCode() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let authSheet = ss.getSheetByName('SP-API Auth');

  if (!authSheet) {
    authSheet = ss.insertSheet('SP-API Auth');
    authSheet.appendRow(['Client Email', 'Authorization Code', 'Status', 'Refresh Token', 'Access Token', 'Expires At', 'Processed Date']);
    SpreadsheetApp.getUi().alert('SP-API Auth sheet created. Please add authorization code and try again.');
    return;
  }

  const activeRow = authSheet.getActiveCell().getRow();

  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('Error', 'Please select a row with authorization code (row 2 or below)', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const clientEmail = authSheet.getRange(activeRow, 1).getValue();
  const authCode = authSheet.getRange(activeRow, 2).getValue();

  if (!authCode) {
    SpreadsheetApp.getUi().alert('Error', 'Please enter Authorization Code in column B', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  authSheet.getRange(activeRow, 3).setValue('⏳ Processing...');
  SpreadsheetApp.flush();

  try {
    const config = getConfigFromActiveClient();
    const tokens = exchangeCodeForToken(authCode, config);

    authSheet.getRange(activeRow, 3).setValue('✅ Success');
    authSheet.getRange(activeRow, 4).setValue(tokens.refresh_token);
    authSheet.getRange(activeRow, 5).setValue(tokens.access_token);
    authSheet.getRange(activeRow, 6).setValue(new Date(Date.now() + (tokens.expires_in * 1000)));
    authSheet.getRange(activeRow, 7).setValue(new Date());

    authSheet.getRange(activeRow, 4, 1, 2).setBackground('#f0f9ff').setFontColor('#1e3a8a');

    SpreadsheetApp.getUi().alert('Success! ✅',
      `Authorization successful!\n\nRefresh Token saved in row ${activeRow}`,
      SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    authSheet.getRange(activeRow, 3).setValue('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error ❌', 'Failed to exchange code:\n\n' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Refresh access token using refresh token
 */
function refreshAccessToken() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const authSheet = ss.getSheetByName('SP-API Auth');

  if (!authSheet) {
    SpreadsheetApp.getUi().alert('Error', 'SP-API Auth sheet not found!', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const activeRow = authSheet.getActiveCell().getRow();

  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('Error', 'Please select a row with refresh token', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const refreshToken = authSheet.getRange(activeRow, 4).getValue();

  if (!refreshToken) {
    SpreadsheetApp.getUi().alert('Error', 'No refresh token found in this row', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  try {
    const config = getConfigFromActiveClient();
    const tokens = getAccessTokenFromRefresh(refreshToken, config);

    authSheet.getRange(activeRow, 5).setValue(tokens.access_token);
    authSheet.getRange(activeRow, 6).setValue(new Date(Date.now() + (tokens.expires_in * 1000)));
    authSheet.getRange(activeRow, 3).setValue('✅ Token Refreshed');

    SpreadsheetApp.getUi().alert('Success! ✅',
      'Access token refreshed!\n\nValid until: ' + new Date(Date.now() + (tokens.expires_in * 1000)).toLocaleString(),
      SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    SpreadsheetApp.getUi().alert('Error ❌', 'Failed to refresh token:\n\n' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ==================== API FUNCTIONS ====================

function exchangeCodeForToken(authCode, config) {
  const url = 'https://api.amazon.com/auth/o2/token';

  const payload = {
    'grant_type': 'authorization_code',
    'code': authCode,
    'redirect_uri': config.redirectUri,
    'client_id': config.clientId,
    'client_secret': config.clientSecret
  };

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': payload,
    'muteHttpExceptions': true
  };

  Logger.log('Exchanging code for token...');
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    const error = JSON.parse(responseBody);
    throw new Error(error.error_description || error.error || 'Unknown error');
  }

  return JSON.parse(responseBody);
}

function getAccessTokenFromRefresh(refreshToken, config) {
  const url = 'https://api.amazon.com/auth/o2/token';

  const payload = {
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken,
    'client_id': config.clientId,
    'client_secret': config.clientSecret
  };

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': payload,
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    const error = JSON.parse(responseBody);
    throw new Error(error.error_description || error.error || 'Token refresh failed');
  }

  return JSON.parse(responseBody);
}

// ==================== HELPER ====================

/**
 * Show instructions for getting authorization code
 */
function showAuthorizationInstructions() {
  const ui = SpreadsheetApp.getUi();

  try {
    const client = getActiveClient();
    const authUrl = `https://sellercentral.amazon.${client.marketplace === 'UK' ? 'co.uk' : client.marketplace.toLowerCase()}/apps/authorize/consent?application_id=${client.lwaClientId}&state=netanaliza&version=beta`;

    ui.alert(
      'Get Authorization Code',
      `1. Send this link to client:\n\n${authUrl}\n\n` +
      `2. Client authorizes the app\n\n` +
      `3. Client copies the "spapi_oauth_code" from callback URL\n\n` +
      `4. Paste the code in SP-API Auth sheet\n\n` +
      `5. Use Menu → SP-API Auth → Manual: Exchange Auth Code`,
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('Error', 'Please setup active client first in Client Settings sheet', ui.ButtonSet.OK);
  }
}
