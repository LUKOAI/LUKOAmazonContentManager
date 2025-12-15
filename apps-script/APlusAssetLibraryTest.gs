/**
 * A+ Content Asset Library - Experimental endpoint discovery
 * Tests various possible endpoints to access Asset Library
 */

/**
 * Test different possible endpoints for Asset Library
 */
function testAssetLibraryEndpoints() {
  try {
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();
    const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
    const endpoint = marketplaceConfig.endpoint;
    const marketplaceId = marketplaceConfig.marketplaceId;

    const results = [];

    // Lista możliwych endpointów do przetestowania
    const endpointsToTest = [
      // A+ Content API variants
      {
        name: 'A+ Assets List',
        url: `${endpoint}/aplus/2020-11-01/assets?marketplaceId=${marketplaceId}`,
        method: 'get'
      },
      {
        name: 'A+ Media Library',
        url: `${endpoint}/aplus/2020-11-01/mediaLibrary?marketplaceId=${marketplaceId}`,
        method: 'get'
      },
      {
        name: 'A+ Content Assets',
        url: `${endpoint}/aplus/2020-11-01/contentAssets?marketplaceId=${marketplaceId}`,
        method: 'get'
      },

      // Media/Assets API variants
      {
        name: 'Media Assets',
        url: `${endpoint}/media/2020-11-01/assets?marketplaceId=${marketplaceId}`,
        method: 'get'
      },
      {
        name: 'Assets Library',
        url: `${endpoint}/assets/2020-11-01/library?marketplaceId=${marketplaceId}`,
        method: 'get'
      },

      // Content Management variants
      {
        name: 'Content Media',
        url: `${endpoint}/content/2020-11-01/media?marketplaceId=${marketplaceId}`,
        method: 'get'
      },

      // Upload destinations list (może zwrócić historię?)
      {
        name: 'Upload Destinations List',
        url: `${endpoint}/uploads/2020-11-01/uploadDestinations?resource=aplus/2020-11-01/contentDocuments`,
        method: 'get'
      },

      // Creative variants
      {
        name: 'Creative Assets',
        url: `${endpoint}/creative/2020-11-01/assets?marketplaceId=${marketplaceId}`,
        method: 'get'
      }
    ];

    Logger.log('========================================');
    Logger.log('Testing Asset Library Endpoints');
    Logger.log('========================================');

    for (const test of endpointsToTest) {
      Logger.log(`\n--- Testing: ${test.name} ---`);
      Logger.log(`URL: ${test.url}`);

      try {
        const options = {
          method: test.method,
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
          },
          muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(test.url, options);
        const responseCode = response.getResponseCode();
        const responseBody = response.getContentText();

        Logger.log(`Response Code: ${responseCode}`);

        if (responseCode === 200) {
          Logger.log(`✅ SUCCESS! Response: ${responseBody.substring(0, 500)}...`);
          results.push({
            name: test.name,
            url: test.url,
            status: 'SUCCESS',
            code: responseCode,
            response: responseBody
          });
        } else if (responseCode === 404) {
          Logger.log(`❌ Not Found (404) - Endpoint doesn't exist`);
          results.push({
            name: test.name,
            status: 'NOT_FOUND',
            code: responseCode
          });
        } else if (responseCode === 403) {
          Logger.log(`⚠️ Forbidden (403) - Endpoint exists but no permission`);
          Logger.log(`Full 403 Response: ${responseBody}`);
          results.push({
            name: test.name,
            status: 'FORBIDDEN',
            code: responseCode,
            response: responseBody
          });
        } else {
          Logger.log(`Response: ${responseBody.substring(0, 300)}`);
          results.push({
            name: test.name,
            status: 'OTHER',
            code: responseCode,
            response: responseBody.substring(0, 300)
          });
        }

      } catch (error) {
        Logger.log(`Error: ${error.toString()}`);
        results.push({
          name: test.name,
          status: 'ERROR',
          error: error.toString()
        });
      }

      // Delay between requests to avoid rate limiting
      Utilities.sleep(1000);
    }

    Logger.log('\n========================================');
    Logger.log('Test Results Summary');
    Logger.log('========================================');

    const successResults = results.filter(r => r.status === 'SUCCESS');
    const forbiddenResults = results.filter(r => r.status === 'FORBIDDEN');

    if (successResults.length > 0) {
      Logger.log(`\n✅ WORKING ENDPOINTS (${successResults.length}):`);
      successResults.forEach(r => {
        Logger.log(`  - ${r.name}: ${r.url}`);
      });
    }

    if (forbiddenResults.length > 0) {
      Logger.log(`\n⚠️ FORBIDDEN ENDPOINTS (${forbiddenResults.length}) - exist but need permissions:`);
      forbiddenResults.forEach(r => {
        Logger.log(`  - ${r.name}`);
      });
    }

    // Show UI alert with summary
    const ui = SpreadsheetApp.getUi();
    let message = `Tested ${endpointsToTest.length} possible endpoints\n\n`;

    if (successResults.length > 0) {
      message += `✅ Found ${successResults.length} working endpoint(s)!\n`;
      message += `Check Execution Logs for details.\n\n`;
    } else if (forbiddenResults.length > 0) {
      message += `⚠️ Found ${forbiddenResults.length} endpoint(s) that exist but are forbidden.\n`;
      message += `May need additional API permissions.\n\n`;
    } else {
      message += `❌ No working endpoints found.\n`;
      message += `Asset Library may not be accessible via SP-API.\n\n`;
    }

    message += `Check Extensions → Apps Script → Executions for full logs.`;

    ui.alert('Asset Library Endpoint Test Complete', message, ui.ButtonSet.OK);

    return results;

  } catch (error) {
    Logger.log(`Error in testAssetLibraryEndpoints: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
    SpreadsheetApp.getUi().alert('Test Error: ' + error.toString());
  }
}

/**
 * Test A+ Content document endpoints with different parameters
 */
function testAPlusDocumentParameters() {
  try {
    const client = getActiveClient();
    const accessToken = getActiveAccessToken();
    const marketplaceConfig = MARKETPLACE_LANGUAGES[client.marketplace];
    const endpoint = marketplaceConfig.endpoint;
    const marketplaceId = marketplaceConfig.marketplaceId;

    Logger.log('========================================');
    Logger.log('Testing A+ Content Document Parameters');
    Logger.log('========================================');

    // Test searchContentDocuments with different includedDataSet values
    const dataSets = [
      'CONTENTS',
      'METADATA',
      'MEDIA',
      'ASSETS',
      'IMAGES',
      'CONTENTS,METADATA',
      'CONTENTS,METADATA,MEDIA'
    ];

    for (const dataSet of dataSets) {
      Logger.log(`\n--- Testing includedDataSet: ${dataSet} ---`);

      const url = `${endpoint}/aplus/2020-11-01/contentDocuments?marketplaceId=${marketplaceId}&pageSize=1&includedDataSet=${dataSet}`;

      const options = {
        method: 'get',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
      };

      try {
        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        const responseBody = response.getContentText();

        Logger.log(`Response Code: ${responseCode}`);

        if (responseCode === 200) {
          const result = JSON.parse(responseBody);
          Logger.log(`✅ SUCCESS! Keys in response: ${Object.keys(result).join(', ')}`);
          if (result.contentMetadataRecords && result.contentMetadataRecords[0]) {
            Logger.log(`First record keys: ${Object.keys(result.contentMetadataRecords[0]).join(', ')}`);
          }
        } else {
          Logger.log(`Response: ${responseBody.substring(0, 200)}`);
        }
      } catch (error) {
        Logger.log(`Error: ${error.toString()}`);
      }

      Utilities.sleep(500);
    }

    SpreadsheetApp.getUi().alert('Parameter Test Complete', 'Check Execution Logs for results.', SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    Logger.log(`Error in testAPlusDocumentParameters: ${error.toString()}`);
    SpreadsheetApp.getUi().alert('Test Error: ' + error.toString());
  }
}
