/**
 * SP-API Authentication & Token Management for WAAS (Affiliate Command Center)
 * Handles OAuth token exchange and refresh for Amazon SP-API
 *
 * Credentials stored in Config sheet:
 * - SP_LWA_Client_ID
 * - SP_LWA_Client_Secret
 * - SP_Refresh_Token
 * - SP_Seller_ID
 *
 * @version 1.0
 * @author NetAnaliza / LUKO
 */

// ==================== SP-API MARKETPLACE CONFIGURATION ====================

const SP_MARKETPLACE_CONFIG = {
  'DE': { marketplaceId: 'A1PA6795UKMFR9', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'de-DE', currency: 'EUR', domain: 'www.amazon.de' },
  'FR': { marketplaceId: 'A13V1IB3VIYZZH', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'fr-FR', currency: 'EUR', domain: 'www.amazon.fr' },
  'IT': { marketplaceId: 'APJ6JRA9NG5V4',  endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'it-IT', currency: 'EUR', domain: 'www.amazon.it' },
  'ES': { marketplaceId: 'A1RKKUPIHCS9HS', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'es-ES', currency: 'EUR', domain: 'www.amazon.es' },
  'UK': { marketplaceId: 'A1F83G8C2ARO7P', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'en-GB', currency: 'GBP', domain: 'www.amazon.co.uk' },
  'NL': { marketplaceId: 'A1805IZSGTT6HS', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'nl-NL', currency: 'EUR', domain: 'www.amazon.nl' },
  'BE': { marketplaceId: 'AMEN7PMS3EDWL',  endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'nl-NL', currency: 'EUR', domain: 'www.amazon.com.be' },
  'PL': { marketplaceId: 'A1C3SOZRARQ6R3', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'pl-PL', currency: 'PLN', domain: 'www.amazon.pl' },
  'SE': { marketplaceId: 'A2NODRKZP88ZB9', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'sv-SE', currency: 'SEK', domain: 'www.amazon.se' },
  'IE': { marketplaceId: 'A1QA6N5NQHZ0EW', endpoint: 'https://sellingpartnerapi-eu.amazon.com', primary: 'en-GB', currency: 'EUR', domain: 'www.amazon.ie' }
};

// ==================== CREDENTIAL MANAGEMENT ====================

/**
 * Get SP-API credentials from Config sheet
 */
function spGetConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    return { clientId: '', clientSecret: '', refreshToken: '', sellerId: '' };
  }

  const data = configSheet.getDataRange().getValues();
  const config = {};

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      config[data[i][0].toString().trim()] = data[i][1].toString().trim();
    }
  }

  return {
    clientId: config['SP_LWA_Client_ID'] || config['SP_LWA_CLIENT_ID'] || '',
    clientSecret: config['SP_LWA_Client_Secret'] || config['SP_LWA_CLIENT_SECRET'] || '',
    refreshToken: config['SP_Refresh_Token'] || config['SP_REFRESH_TOKEN'] || '',
    sellerId: config['SP_Seller_ID'] || config['SP_SELLER_ID'] || ''
  };
}

/**
 * Check if SP-API credentials are configured
 */
function spHasCredentials() {
  try {
    const config = spGetConfig();
    return !!(config.clientId && config.clientSecret && config.refreshToken);
  } catch (e) {
    return false;
  }
}

// ==================== TOKEN MANAGEMENT ====================

/**
 * Get a fresh access token using the stored refresh token
 * Uses PropertiesService cache to avoid unnecessary token refreshes
 */
function spGetAccessToken() {
  const props = PropertiesService.getScriptProperties();

  const cachedToken = props.getProperty('SP_ACCESS_TOKEN');
  const cachedExpiry = props.getProperty('SP_TOKEN_EXPIRY');

  if (cachedToken && cachedExpiry) {
    const expiryTime = parseInt(cachedExpiry, 10);
    if (Date.now() < expiryTime - (5 * 60 * 1000)) {
      return cachedToken;
    }
  }

  const config = spGetConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error('SP-API credentials not configured. Go to: Products > SP-API Import > Setup Credentials');
  }

  if (!config.refreshToken) {
    throw new Error('SP-API Refresh Token not configured. Add SP_Refresh_Token to Config sheet.');
  }

  const url = 'https://api.amazon.com/auth/o2/token';
  const payload = {
    'grant_type': 'refresh_token',
    'refresh_token': config.refreshToken,
    'client_id': config.clientId,
    'client_secret': config.clientSecret
  };

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': payload,
    'muteHttpExceptions': true
  };

  Logger.log('[SP-API AUTH] Refreshing access token...');
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    let errorMsg = `Token refresh failed (HTTP ${responseCode})`;
    try {
      const error = JSON.parse(responseBody);
      errorMsg = error.error_description || error.error || errorMsg;
    } catch (e) {
      errorMsg = responseBody || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const tokens = JSON.parse(responseBody);

  props.setProperty('SP_ACCESS_TOKEN', tokens.access_token);
  props.setProperty('SP_TOKEN_EXPIRY', (Date.now() + (tokens.expires_in * 1000)).toString());

  Logger.log('[SP-API AUTH] Token refreshed successfully');
  return tokens.access_token;
}

/**
 * Clear cached token (force re-auth on next call)
 */
function spClearTokenCache() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('SP_ACCESS_TOKEN');
  props.deleteProperty('SP_TOKEN_EXPIRY');
  Logger.log('[SP-API AUTH] Token cache cleared');
}

// ==================== SP-API CALL WRAPPER ====================

/**
 * Make an authenticated call to SP-API
 */
function spCallAPI(method, path, params, accessToken) {
  if (!accessToken) {
    accessToken = spGetAccessToken();
  }

  const endpoint = 'https://sellingpartnerapi-eu.amazon.com';
  let url = endpoint + path;

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

  Logger.log(`[SP-API] ${method} ${url}`);
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode === 429) {
    Logger.log('[SP-API] Rate limited (429). Waiting 2 seconds and retrying...');
    Utilities.sleep(2000);
    const retryResponse = UrlFetchApp.fetch(url, options);
    const retryCode = retryResponse.getResponseCode();
    const retryBody = retryResponse.getContentText();

    if (retryCode !== 200) {
      throw new Error(`SP-API Error ${retryCode} (after retry): ${retryBody.substring(0, 300)}`);
    }
    return JSON.parse(retryBody);
  }

  if (responseCode !== 200) {
    let errorMessage = `SP-API Error ${responseCode}`;
    try {
      const error = JSON.parse(responseBody);
      errorMessage = error.errors?.[0]?.message || error.message || errorMessage;
    } catch (e) {
      errorMessage = responseBody.substring(0, 300) || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return JSON.parse(responseBody);
}

// ==================== SETUP & CREDENTIALS UI ====================

/**
 * Setup SP-API credentials dialog
 */
function spSetupCredentials() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.getRange(1, 1, 1, 3).setValues([['Key', 'Value', 'Description']]);
    configSheet.getRange(1, 1, 1, 3)
      .setFontWeight('bold')
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF');
    configSheet.setColumnWidth(1, 200);
    configSheet.setColumnWidth(2, 350);
    configSheet.setColumnWidth(3, 250);
    configSheet.setFrozenRows(1);
    Logger.log('[SP-API] Created Config sheet');
  }

  const data = configSheet.getDataRange().getValues();
  const existingKeys = new Set();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0]) existingKeys.add(data[i][0].toString().trim());
  }

  const spKeys = [
    { key: 'SP_LWA_Client_ID', label: 'SP-API LWA Client ID' },
    { key: 'SP_LWA_Client_Secret', label: 'SP-API LWA Client Secret' },
    { key: 'SP_Refresh_Token', label: 'SP-API Refresh Token' },
    { key: 'SP_Seller_ID', label: 'SP-API Seller ID' }
  ];

  let addedCount = 0;
  for (const spKey of spKeys) {
    if (!existingKeys.has(spKey.key)) {
      configSheet.appendRow([spKey.key, '', spKey.label]);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    ui.alert('SP-API Config',
      `Dodano ${addedCount} nowych kluczy SP-API do Config sheet.\n\n` +
      'Uzupelnij wartosci:\n' +
      '1. SP_LWA_Client_ID - z Amazon Seller Central > Apps & Services\n' +
      '2. SP_LWA_Client_Secret - secret z LWA\n' +
      '3. SP_Refresh_Token - token z autoryzacji SP-API\n' +
      '4. SP_Seller_ID - Twoj Seller ID\n\n' +
      'Nastepnie przetestuj polaczenie: Products > SP-API Import > Test Connection',
      ui.ButtonSet.OK);
  } else {
    ui.alert('SP-API Config', 'Klucze SP-API juz istnieja w Config sheet.\nUzupelnij wartosci recznie.', ui.ButtonSet.OK);
  }
}

/**
 * Test SP-API connection
 */
function spTestConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    const config = spGetConfig();
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      ui.alert('Brak danych',
        'SP-API credentials nie sa skonfigurowane.\n\n' +
        'Uzupelnij w Config sheet:\n' +
        '- SP_LWA_Client_ID\n' +
        '- SP_LWA_Client_Secret\n' +
        '- SP_Refresh_Token\n\n' +
        'Lub uruchom: Products > SP-API Import > Setup Credentials',
        ui.ButtonSet.OK);
      return;
    }

    spClearTokenCache();
    const startTime = Date.now();
    const accessToken = spGetAccessToken();
    const tokenTime = Date.now() - startTime;

    const mpConfig = SP_MARKETPLACE_CONFIG['DE'];
    const result = spCallAPI('GET', '/catalog/2022-04-01/items', {
      marketplaceIds: mpConfig.marketplaceId,
      keywords: 'test',
      pageSize: 1
    }, accessToken);

    const apiTime = Date.now() - startTime;

    ui.alert('SP-API Test',
      'Polaczenie dziala!\n\n' +
      `Token refresh: ${tokenTime}ms\n` +
      `API call: ${apiTime}ms\n` +
      `Seller ID: ${config.sellerId || 'N/A'}\n` +
      `Marketplace: DE (${mpConfig.marketplaceId})\n\n` +
      'SP-API jest gotowe do uzycia.',
      ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('SP-API Error',
      `Test nie powiodl sie:\n\n${error.message}\n\n` +
      'Sprawdz:\n' +
      '1. LWA Client ID i Secret sa poprawne\n' +
      '2. Refresh Token jest aktualny\n' +
      '3. Aplikacja ma dostep do SP-API',
      ui.ButtonSet.OK);
  }
}

/**
 * Show marketplace selection dialog for SP-API
 */
function spShowMarketplaceSelector() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'SP-API: Wybierz Marketplace',
    'Wpisz kod marketplace:\n\n' +
    'DE - Niemcy (domyslnie)\n' +
    'FR - Francja\n' +
    'UK - Wielka Brytania\n' +
    'IT - Wlochy\n' +
    'ES - Hiszpania\n' +
    'NL - Holandia\n' +
    'BE - Belgia\n' +
    'PL - Polska\n' +
    'SE - Szwecja\n' +
    'IE - Irlandia',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return null;

  let marketplace = response.getResponseText().trim().toUpperCase();
  if (!marketplace) marketplace = 'DE';

  if (!SP_MARKETPLACE_CONFIG[marketplace]) {
    ui.alert('Blad', `Nieprawidlowy marketplace: ${marketplace}\n\nDostepne: ${Object.keys(SP_MARKETPLACE_CONFIG).join(', ')}`, ui.ButtonSet.OK);
    return null;
  }

  return marketplace;
}
