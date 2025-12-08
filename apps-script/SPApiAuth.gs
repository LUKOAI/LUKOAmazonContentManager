/**
 * SP-API OAuth Token Exchange & Email Automation
 * Automatically processes authorization emails and exchanges codes for tokens
 *
 * @version 1.0
 * @author NetAnaliza / LUKO
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

// ==================== EMAIL AUTOMATION ====================

/**
 * Process activation emails from Gmail
 * Triggered by time-driven trigger (every 5 minutes)
 */
function processActivationEmails() {
  try {
    const threads = GmailApp.search('from:no-reply@amazon.com subject:"Amazon Selling Partner API" is:unread newer_than:1d');

    if (threads.length === 0) {
      Logger.log('No new activation emails');
      return;
    }

    Logger.log(`Found ${threads.length} activation email(s)`);

    for (const thread of threads) {
      const messages = thread.getMessages();

      for (const message of messages) {
        try {
          const body = message.getPlainBody();
          const subject = message.getSubject();

          // Extract authorization code from email
          const codeMatch = body.match(/authorization[_\s]code[:\s]+([A-Za-z0-9\-_]+)/i) ||
                           body.match(/code[:\s]+([A-Za-z0-9\-_]{20,})/i) ||
                           body.match(/([A-Za-z0-9\-_]{30,})/); // Fallback: long alphanumeric string

          if (!codeMatch) {
            Logger.log('No authorization code found in email');
            continue;
          }

          const authCode = codeMatch[1];
          Logger.log(`Found authorization code: ${authCode.substring(0, 10)}...`);

          // Extract client email from email body or sender
          const emailMatch = body.match(/client[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
                            body.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

          const clientEmail = emailMatch ? emailMatch[1] : message.getFrom();

          // Auto-exchange code for token
          const result = autoExchangeAuthCode(authCode, clientEmail);

          if (result.success) {
            // Mark email as read
            message.markRead();
            thread.markRead();

            // Add label
            const label = GmailApp.getUserLabelByName('SP-API Processed') ||
                         GmailApp.createLabel('SP-API Processed');
            thread.addLabel(label);

            Logger.log(`✅ Successfully processed authorization for ${clientEmail}`);
          } else {
            Logger.log(`❌ Failed to process: ${result.error}`);
          }

        } catch (error) {
          Logger.log(`Error processing message: ${error.toString()}`);
        }
      }
    }

  } catch (error) {
    Logger.log(`Error in processActivationEmails: ${error.toString()}`);
  }
}

/**
 * Auto-exchange authorization code for tokens
 */
function autoExchangeAuthCode(authCode, clientEmail) {
  try {
    const config = getConfig();

    if (!config.clientId || !config.clientSecret) {
      return { success: false, error: 'Missing LWA credentials in Config sheet' };
    }

    // Exchange code for tokens
    const tokens = exchangeCodeForToken(authCode, config);

    // Save to SP-API Auth sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let authSheet = ss.getSheetByName('SP-API Auth');

    if (!authSheet) {
      authSheet = ss.insertSheet('SP-API Auth');
      authSheet.appendRow(['Client Email', 'Authorization Code', 'Status', 'Refresh Token', 'Access Token', 'Expires At', 'Processed Date']);
    }

    // Append new row
    authSheet.appendRow([
      clientEmail,
      authCode,
      '✅ Success',
      tokens.refresh_token,
      tokens.access_token,
      new Date(Date.now() + (tokens.expires_in * 1000)),
      new Date()
    ]);

    // Format tokens as protected
    const lastRow = authSheet.getLastRow();
    authSheet.getRange(lastRow, 4, 1, 2).setBackground('#f0f9ff').setFontColor('#1e3a8a');

    return { success: true, tokens: tokens };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== MANUAL FUNCTIONS ====================

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
    const config = getConfig();
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
    const config = getConfig();
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

// ==================== SETUP ====================

/**
 * Setup time-driven trigger for email automation
 */
function setupEmailAutomationTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processActivationEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Create new trigger (every 5 minutes)
  ScriptApp.newTrigger('processActivationEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  SpreadsheetApp.getUi().alert('Success! ✅',
    'Email automation trigger created!\n\nWill check for activation emails every 5 minutes.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Remove email automation trigger
 */
function removeEmailAutomationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;

  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processActivationEmails') {
      ScriptApp.deleteTrigger(trigger);
      count++;
    }
  }

  SpreadsheetApp.getUi().alert('Success! ✅',
    `Removed ${count} email automation trigger(s)`,
    SpreadsheetApp.getUi().ButtonSet.OK);
}
