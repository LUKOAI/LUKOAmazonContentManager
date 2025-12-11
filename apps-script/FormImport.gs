/**
 * Google Forms → APlusBasic Auto-Import Integration
 *
 * Automatically imports A+ Content data from Google Form submissions
 * directly into the APlusBasic sheet at the first available row.
 *
 * FORM STRUCTURE:
 * - Form URL: https://docs.google.com/forms/d/1LDysIzwc5kfSBG3cAT7cDKnWlx6w-Sj9vJw2YhbrYI8/edit
 * - Response Sheet: ClaudeAPlusQueue
 * - Column A: Timestamp
 * - Column B: JSON payload from Claude
 *
 * SETUP:
 * 1. Open Apps Script editor
 * 2. Go to Triggers (clock icon)
 * 3. Add trigger: onFormSubmit → From spreadsheet → On form submit
 * 4. Save and authorize
 */

/**
 * Main trigger function - runs on form submission
 * @param {Object} e - Event object from form submission
 */
function onFormSubmit(e) {
  try {
    Logger.log('=== FORM IMPORT STARTED ===');
    Logger.log('Event values: ' + JSON.stringify(e.values));

    // 1. Extract and parse JSON from column B (e.values[1])
    var jsonText = e.values[1];
    Logger.log('Raw JSON text: ' + jsonText);

    if (!jsonText || jsonText.trim() === '') {
      throw new Error('Empty JSON payload - column B is empty');
    }

    // Clean the JSON text before parsing
    // Remove BOM if present
    if (jsonText.charCodeAt(0) === 0xFEFF) {
      jsonText = jsonText.substring(1);
      Logger.log('Removed BOM from JSON');
    }

    // Replace smart quotes with straight quotes (but only outside of JSON strings)
    // This is tricky because we don't want to replace quotes INSIDE the string values
    // So we'll try parsing first, and only if it fails, try sanitization
    var data;
    var parseAttempts = [];

    // Attempt 1: Parse as-is
    try {
      data = JSON.parse(jsonText);
      Logger.log('✅ JSON parsed successfully on first attempt');
    } catch (parseError) {
      parseAttempts.push('Attempt 1 failed: ' + parseError.message);

      // Extract position info from error message
      var posMatch = parseError.message.match(/position (\d+)/);
      var errorPos = posMatch ? parseInt(posMatch[1]) : -1;

      // Log context around error
      if (errorPos > 0 && errorPos < jsonText.length) {
        var start = Math.max(0, errorPos - 50);
        var end = Math.min(jsonText.length, errorPos + 50);
        var context = jsonText.substring(start, end);
        var charAtError = jsonText.charAt(errorPos);

        Logger.log('Parse error at position ' + errorPos);
        Logger.log('Context: "' + context + '"');
        Logger.log('Character at error: "' + charAtError + '" (code: ' + charAtError.charCodeAt(0) + ')');
      }

      // Attempt 2: Try to fix common issues
      Logger.log('Attempting to sanitize JSON...');

      // Check if the JSON might be double-escaped
      if (jsonText.indexOf('\\"') > -1 || jsonText.indexOf('\\n') === -1) {
        // Might be double-escaped - try unescaping once
        try {
          var unescaped = jsonText.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          data = JSON.parse(unescaped);
          Logger.log('✅ JSON parsed successfully after unescaping');
        } catch (unescapeError) {
          parseAttempts.push('Attempt 2 (unescape) failed: ' + unescapeError.message);
        }
      }

      // Attempt 3: If still failed, try wrapping in try-catch and parsing as eval (DANGEROUS)
      // Actually, DON'T do this - it's a security risk

      // If all attempts failed, throw detailed error
      if (!data) {
        var debugInfo = 'Failed to parse JSON after ' + parseAttempts.length + ' attempts:\n\n';
        debugInfo += parseAttempts.join('\n\n');

        if (errorPos > 0 && errorPos < jsonText.length) {
          var start = Math.max(0, errorPos - 50);
          var end = Math.min(jsonText.length, errorPos + 50);
          var context = jsonText.substring(start, end);
          var charAtError = jsonText.charAt(errorPos);

          debugInfo += '\n\nContext around error (position ' + errorPos + '):\n"' + context + '"';
          debugInfo += '\n\nCharacter at error: "' + charAtError + '" (char code: ' + charAtError.charCodeAt(0) + ')';
        }

        debugInfo += '\n\nFirst 500 chars of JSON:\n' + jsonText.substring(0, 500);
        debugInfo += '\n\nJSON length: ' + jsonText.length + ' characters';

        throw new Error(debugInfo);
      }
    }

    // 2. Validate structure
    if (!data.modules || !Array.isArray(data.modules)) {
      throw new Error('Invalid JSON structure: missing "modules" array');
    }

    if (data.modules.length === 0) {
      throw new Error('Empty modules array - no data to import');
    }

    Logger.log('Parsed ' + data.modules.length + ' modules from JSON');

    // 3. Get target sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var aplusSheet = ss.getSheetByName('APlusBasic');

    if (!aplusSheet) {
      throw new Error('APlusBasic sheet not found - please create it first');
    }

    // 4. Build header mapping (column name → column letter)
    var headerMap = buildHeaderMap(aplusSheet);
    Logger.log('Header map created with ' + Object.keys(headerMap).length + ' columns');

    // 5. Find first empty row
    var targetRow = findFirstEmptyRow(aplusSheet);
    Logger.log('First empty row: ' + targetRow);

    var startRow = targetRow;

    // 6. Write each module
    var modulesWritten = 0;
    data.modules.forEach(function(module, index) {
      Logger.log('Processing module ' + (index + 1) + '/' + data.modules.length);

      if (!module.columns) {
        Logger.log('WARNING: Module ' + (index + 1) + ' has no columns - skipping');
        return;
      }

      // Write each column value
      for (var colKey in module.columns) {
        var value = module.columns[colKey];

        // Check if colKey is already a letter (A, B, C) or a name (☑️ Export, ASIN)
        var colLetter;
        if (colKey.length <= 2 && /^[A-Z]+$/.test(colKey)) {
          // Already a letter (A, B, AA, etc.)
          colLetter = colKey;
          Logger.log('  Using column letter directly: ' + colLetter);
        } else {
          // It's a column name - look up in header map
          colLetter = headerMap[colKey];
          if (!colLetter) {
            Logger.log('  WARNING: Column name "' + colKey + '" not found in headers - skipping');
            continue;
          }
          Logger.log('  Mapped "' + colKey + '" → ' + colLetter);
        }

        var colNumber = columnLetterToNumber(colLetter);
        Logger.log('  Writing to ' + colLetter + ' (col ' + colNumber + '): ' + value);
        aplusSheet.getRange(targetRow, colNumber).setValue(value);
      }

      targetRow++;
      modulesWritten++;
    });

    Logger.log('=== IMPORT COMPLETE ===');
    Logger.log('Modules written: ' + modulesWritten);
    Logger.log('Rows: ' + startRow + ' to ' + (targetRow - 1));

    // 6. Log success
    logOperation('FORM_IMPORT', 'SUCCESS', modulesWritten + ' modules imported (rows ' + startRow + '-' + (targetRow - 1) + ')');

    // 7. Success notification (only if running manually, not from trigger)
    try {
      var ui = SpreadsheetApp.getUi();
      ui.alert(
        '✅ A+ Content Import Success',
        modulesWritten + ' module(s) imported to APlusBasic.\n\n' +
        'Starting at row ' + startRow + '\n' +
        'Ending at row ' + (targetRow - 1) + '\n\n' +
        'You can now publish these modules using:\n' +
        'Export to Amazon → 📤 Publish A+ Content',
        ui.ButtonSet.OK
      );
    } catch (uiError) {
      // Running from trigger - UI not available, that's OK
      Logger.log('Success notification skipped (running from trigger)');
    }

  } catch (error) {
    // Error handling
    Logger.log('ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    // Log error
    logOperation('FORM_IMPORT', 'ERROR', error.message + ' | Stack: ' + error.stack);

    // Try to show alert (only works if running manually)
    try {
      SpreadsheetApp.getUi().alert(
        '❌ A+ Content Import Failed',
        'Error: ' + error.message + '\n\n' +
        'Check Extensions → Apps Script → Executions for details.\n\n' +
        'Common issues:\n' +
        '• Invalid JSON format\n' +
        '• Missing "modules" array in JSON\n' +
        '• APlusBasic sheet not found',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (uiError) {
      // Running from trigger - UI not available
      Logger.log('Error notification skipped (running from trigger)');
    }
  }
}

/**
 * Builds a mapping of column names to column letters
 * Reads row 3 (headers) from APlusBasic sheet
 *
 * @param {Sheet} sheet - Google Sheets sheet object
 * @returns {Object} - Map of column names to letters
 *
 * Example:
 *   {"☑️ Export": "A", "ASIN": "B", "Module Number": "C"}
 */
function buildHeaderMap(sheet) {
  var headerRow = 3; // Headers are in row 3 of APlusBasic
  var lastCol = sheet.getLastColumn();

  // Get all headers from row 3
  var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];

  var map = {};

  for (var i = 0; i < headers.length; i++) {
    var headerName = headers[i];

    // Skip empty headers
    if (headerName === '' || headerName === null || headerName === undefined) {
      continue;
    }

    // Convert column index to letter (0 → A, 1 → B, etc.)
    var colLetter = columnNumberToLetter(i + 1);

    map[headerName] = colLetter;
  }

  Logger.log('Built header map: ' + JSON.stringify(map).substring(0, 200) + '...');

  return map;
}

/**
 * Converts column number to column letter
 * @param {number} column - Column number (1-based)
 * @returns {string} - Column letter (A, B, AA, BB, etc.)
 *
 * Examples:
 *   1 → A
 *   2 → B
 *   26 → Z
 *   27 → AA
 *   54 → BB
 */
function columnNumberToLetter(column) {
  var letter = '';

  while (column > 0) {
    var remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - 1) / 26);
  }

  return letter;
}

/**
 * Converts column letter to column number
 * @param {string} letter - Column letter (A, B, AA, BB, etc.)
 * @returns {number} - Column number (1-based)
 *
 * Examples:
 *   A → 1
 *   B → 2
 *   Z → 26
 *   AA → 27
 *   BB → 54
 *   ZZ → 702
 */
function columnLetterToNumber(letter) {
  var column = 0;
  var length = letter.length;

  for (var i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }

  return column;
}

/**
 * Finds the first completely empty row in a sheet
 * @param {Sheet} sheet - Google Sheets sheet object
 * @returns {number} - Row number (1-based)
 *
 * Logic:
 * - Starts checking from row 4 (assumes rows 1-3 are headers)
 * - Checks all columns up to maxCol (150 columns = up to column EV)
 * - Returns first row where ALL cells are empty
 * - If no empty row found, returns lastRow + 1
 */
function findFirstEmptyRow(sheet) {
  var lastRow = sheet.getLastRow();
  var maxCol = 150; // Check up to column EV (150 columns)

  Logger.log('Finding first empty row. Last row with data: ' + lastRow);

  // Start checking from row 4 (after headers in rows 1-3)
  for (var row = 4; row <= lastRow + 1; row++) {
    var range = sheet.getRange(row, 1, 1, maxCol);
    var values = range.getValues()[0];

    var isEmpty = values.every(function(cell) {
      return cell === '' || cell === null || cell === undefined;
    });

    if (isEmpty) {
      Logger.log('Found empty row: ' + row);
      return row;
    }
  }

  // If no empty row found in existing data, return next after last
  Logger.log('No empty row found, using: ' + (lastRow + 1));
  return lastRow + 1;
}

/**
 * Logs operation to Logs sheet
 * @param {string} operation - Operation name (e.g., 'FORM_IMPORT')
 * @param {string} status - Status (SUCCESS, ERROR, WARNING)
 * @param {string} details - Details or error message
 */
function logOperation(operation, status, details) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('Logs');

    if (!logSheet) {
      // Create Logs sheet if it doesn't exist
      logSheet = ss.insertSheet('Logs');
      logSheet.appendRow(['Timestamp', 'Operation', 'Status', 'Details', 'User']);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    logSheet.appendRow([
      new Date(),
      operation,
      status,
      details,
      Session.getActiveUser().getEmail()
    ]);

    // Auto-resize columns for readability
    logSheet.autoResizeColumn(1);
    logSheet.autoResizeColumn(2);
    logSheet.autoResizeColumn(3);

  } catch (logError) {
    // If logging fails, just log to console - don't interrupt main flow
    Logger.log('Failed to write to Logs sheet: ' + logError.message);
  }
}

/**
 * Test function - simulates form submission with sample JSON
 * Use this to test the import without submitting actual form
 *
 * To run: Extensions → Apps Script → Select testFormImport → Run
 */
function testFormImport() {
  // Sample JSON matching the expected format
  var sampleJSON = {
    "modules": [
      {
        "row": null,
        "columns": {
          "A": true,
          "B": "B0FNRLYQ3G",
          "C": 1,
          "D": "STANDARD_COMPANY_LOGO",
          "E": "aplus-media-library-service-media/test-logo.jpg",
          "F": "Test German text",
          "G": "Test English text"
        }
      },
      {
        "row": null,
        "columns": {
          "A": true,
          "B": "B0FNRLYQ3G",
          "C": 2,
          "D": "STANDARD_TEXT",
          "F": "German description",
          "G": "English description"
        }
      }
    ]
  };

  // Simulate form submission event
  var mockEvent = {
    values: [
      new Date().toISOString(), // Timestamp
      JSON.stringify(sampleJSON)  // JSON payload
    ]
  };

  Logger.log('Running test import with sample JSON...');
  onFormSubmit(mockEvent);
  Logger.log('Test complete. Check APlusBasic sheet and Logs sheet.');
}

/**
 * Test function - invalid JSON (should show error)
 */
function testFormImportInvalidJSON() {
  var mockEvent = {
    values: [
      new Date().toISOString(),
      '{invalid json here'  // Intentionally broken JSON
    ]
  };

  Logger.log('Testing with invalid JSON (should fail gracefully)...');
  onFormSubmit(mockEvent);
}

/**
 * Test function - missing modules key (should show error)
 */
function testFormImportMissingModules() {
  var invalidJSON = {
    "data": "some data",
    "notModules": []
  };

  var mockEvent = {
    values: [
      new Date().toISOString(),
      JSON.stringify(invalidJSON)
    ]
  };

  Logger.log('Testing with missing modules key (should fail gracefully)...');
  onFormSubmit(mockEvent);
}

/**
 * Utility function - test column letter conversion
 */
function testColumnLetterConversion() {
  Logger.log('=== Testing Column Letter ↔ Number Conversion ===');

  var letterTests = [
    {letter: 'A', expected: 1},
    {letter: 'B', expected: 2},
    {letter: 'Z', expected: 26},
    {letter: 'AA', expected: 27},
    {letter: 'AB', expected: 28},
    {letter: 'AZ', expected: 52},
    {letter: 'BA', expected: 53},
    {letter: 'BB', expected: 54},
    {letter: 'ZZ', expected: 702}
  ];

  Logger.log('\n--- Letter → Number ---');
  letterTests.forEach(function(test) {
    var result = columnLetterToNumber(test.letter);
    var status = result === test.expected ? '✅' : '❌';
    Logger.log(status + ' ' + test.letter + ' → ' + result + ' (expected ' + test.expected + ')');
  });

  var numberTests = [
    {number: 1, expected: 'A'},
    {number: 2, expected: 'B'},
    {number: 26, expected: 'Z'},
    {number: 27, expected: 'AA'},
    {number: 28, expected: 'AB'},
    {number: 52, expected: 'AZ'},
    {number: 53, expected: 'BA'},
    {number: 54, expected: 'BB'},
    {number: 702, expected: 'ZZ'}
  ];

  Logger.log('\n--- Number → Letter ---');
  numberTests.forEach(function(test) {
    var result = columnNumberToLetter(test.number);
    var status = result === test.expected ? '✅' : '❌';
    Logger.log(status + ' ' + test.number + ' → ' + result + ' (expected ' + test.expected + ')');
  });

  Logger.log('\n=== Tests Complete ===');
}

/**
 * Test function - test header mapping
 */
function testHeaderMapping() {
  try {
    Logger.log('=== Testing Header Mapping ===');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var aplusSheet = ss.getSheetByName('APlusBasic');

    if (!aplusSheet) {
      Logger.log('❌ APlusBasic sheet not found');
      return;
    }

    var headerMap = buildHeaderMap(aplusSheet);

    Logger.log('\n--- Header Map (first 10 entries) ---');
    var count = 0;
    for (var key in headerMap) {
      Logger.log('"' + key + '" → ' + headerMap[key]);
      count++;
      if (count >= 10) break;
    }

    Logger.log('\nTotal headers mapped: ' + Object.keys(headerMap).length);
    Logger.log('=== Test Complete ===');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
  }
}

/**
 * Show Google Forms setup instructions dialog
 * Accessible from: Tools → Setup Google Forms Import
 */
function showGoogleFormsSetupInstructions() {
  var ui = SpreadsheetApp.getUi();

  // Check if trigger already exists
  var triggers = ScriptApp.getProjectTriggers();
  var triggerExists = false;

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      triggerExists = true;
      break;
    }
  }

  var statusMessage = triggerExists
    ? '✅ TRIGGER AKTYWNY\nGoogle Forms import jest skonfigurowany i działa.'
    : '⚠️ TRIGGER NIE SKONFIGUROWANY\nMusisz utworzyć trigger aby import działał automatycznie.';

  var message = statusMessage + '\n\n';
  message += '═══════════════════════════════\n';
  message += 'JAK SKONFIGUROWAĆ:\n';
  message += '═══════════════════════════════\n\n';
  message += '1. Kliknij OK w tym oknie\n';
  message += '2. Idź do: Extensions → Apps Script\n';
  message += '3. Kliknij ikonę zegara ⏰ (Triggers)\n';
  message += '4. Kliknij: + Add Trigger\n\n';
  message += 'Wypełnij:\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  message += '• Function to run: onFormSubmit\n';
  message += '• Deployment: Head\n';
  message += '• Event source: From spreadsheet\n';
  message += '• Event type: On form submit\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  message += '5. Kliknij Save\n';
  message += '6. Autoryzuj (jeśli potrzebne)\n\n';
  message += '═══════════════════════════════\n';
  message += 'JAK PRZETESTOWAĆ:\n';
  message += '═══════════════════════════════\n\n';
  message += '1. W Apps Script wybierz:\n';
  message += '   testFormImport\n';
  message += '2. Kliknij Run\n';
  message += '3. Sprawdź arkusz APlusBasic\n';
  message += '   (powinny pojawić się 2 testowe wiersze)\n\n';
  message += '═══════════════════════════════\n';
  message += 'FORM URL:\n';
  message += '═══════════════════════════════\n';
  message += 'https://docs.google.com/forms/d/\n';
  message += '1LDysIzwc5kfSBG3cAT7cDKnWlx6w\n';
  message += '-Sj9vJw2YhbrYI8/edit\n\n';
  message += '═══════════════════════════════\n\n';
  message += 'Pełna dokumentacja:\n';
  message += 'docs/GOOGLE_FORMS_INTEGRATION.md';

  ui.alert('📋 Google Forms → APlusBasic Import Setup', message, ui.ButtonSet.OK);
}

/**
 * Check Google Forms trigger status
 * Returns true if trigger exists and is active
 */
function checkFormsTriggerStatus() {
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      Logger.log('✅ onFormSubmit trigger found and active');
      Logger.log('Trigger ID: ' + triggers[i].getUniqueId());
      Logger.log('Event Type: ' + triggers[i].getEventType());
      return true;
    }
  }

  Logger.log('⚠️ onFormSubmit trigger NOT found');
  return false;
}
