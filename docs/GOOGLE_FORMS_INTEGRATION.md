# Google Forms → APlusBasic Auto-Import Integration

## Overview

Automated system that imports A+ Content data from Google Form submissions directly into the APlusBasic sheet. Claude can submit A+ Content modules via Google Forms, and they automatically populate your spreadsheet.

## How It Works

```
Claude → Google Form → ClaudeAPlusQueue → Apps Script → APlusBasic
```

1. **Claude submits form** with JSON payload
2. **Response recorded** in `ClaudeAPlusQueue` sheet
3. **Trigger fires** `onFormSubmit()` function
4. **JSON parsed** and validated
5. **Modules written** to APlusBasic at first empty row
6. **Notification shown** with success/error details

## Form Structure

**Form URL:** https://docs.google.com/forms/d/1LDysIzwc5kfSBG3cAT7cDKnWlx6w-Sj9vJw2YhbrYI8/edit

**Response Sheet:** `ClaudeAPlusQueue`
- Column A: Timestamp (auto-generated)
- Column B: JSON payload (from Claude)

## JSON Format

**CRITICAL: Use ONLY standard ASCII characters in JSON!**

Claude submits JSON in this format:

```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "A": true,
        "B": "B0FNRLYQ3G",
        "C": 1,
        "D": "STANDARD_SINGLE_SIDE_IMAGE",
        "E": "aplus-media-library-service-media/uuid.jpg",
        "F": "German headline text",
        "G": "English headline text",
        "H": "German body text",
        "I": "English body text"
      }
    },
    {
      "row": null,
      "columns": {
        "A": true,
        "B": "B0FNRLYQ3G",
        "C": 2,
        "D": "STANDARD_TEXT",
        "F": "German text for module 2",
        "G": "English text for module 2"
      }
    }
  ]
}
```

### JSON Formatting Rules for Claude AI

**NEVER use these characters in JSON string values:**
- ❌ German quotes: `„` (U+201E), `"` (U+201C), `"` (U+201D)
- ❌ Smart quotes: `'` (U+2018), `'` (U+2019)
- ❌ Em dash: `—` (U+2014)
- ❌ En dash: `–` (U+2013)

**ALWAYS use these instead:**
- ✅ Straight double quotes for JSON structure: `"`
- ✅ Regular apostrophe for contractions: `'`
- ✅ Regular hyphen for text: `-`

**Example - WRONG:**
```json
{
  "aplus_basic_m1_body_DE": "Das sagen Kunden: „Perfekt" – sehr gut"
}
```

**Example - CORRECT:**
```json
{
  "aplus_basic_m1_body_DE": "Das sagen Kunden: 'Perfekt' - sehr gut"
}
```

**Why this matters:**
Google Forms passes JSON as escaped string. Smart quotes break JSON parsing causing import failures. Use ONLY ASCII characters!

**Notes:**
- `row` is always `null` in input - script determines actual row numbers
- `columns` object maps column letters to values
- Can handle any column from A to ZZ (unlimited)
- Multiple modules are written sequentially

## Setup Instructions

### 1. Deploy Script to Apps Script

The script is already in your repository: `apps-script/FormImport.gs`

**Deploy via clasp:**
```bash
cd C:\Users\user\Desktop\NetAnaliza-Deploy

curl -k -L -o FormImport.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/fix-amazon-content-manager-01SQKmWTBRVTPyVwU7hDf1ww/apps-script/FormImport.gs

clasp push --force
```

### 2. Create Form Submission Trigger

**In Google Sheets:**

1. Open your NetAnaliza spreadsheet
2. Go to **Extensions → Apps Script**
3. Click **Triggers** (clock icon on left sidebar)
4. Click **+ Add Trigger** (bottom right)

**Configure trigger:**
- **Choose which function to run:** `onFormSubmit`
- **Choose which deployment should run:** `Head`
- **Select event source:** `From spreadsheet`
- **Select event type:** `On form submit`
- **Failure notification settings:** `Notify me immediately`

5. Click **Save**
6. **Authorize** the script if prompted
   - Sign in with your Google account
   - Click **Advanced** → Go to [project name] (unsafe)
   - Click **Allow**

### 3. Verify Setup

**Check trigger is active:**
1. Extensions → Apps Script → Triggers
2. You should see:
   ```
   onFormSubmit | Head | From spreadsheet | On form submit
   ```

**Test with sample data:**
1. Extensions → Apps Script
2. Select `testFormImport` from function dropdown
3. Click **Run**
4. Check APlusBasic sheet - should have 2 new test rows
5. Check Logs sheet - should have SUCCESS entry

## Usage Workflow

### For Claude:

1. **Prepare A+ Content modules** in JSON format
2. **Submit Google Form** with JSON payload
3. **Wait for confirmation** (email/notification)
4. **Modules appear** in APlusBasic sheet automatically

### For You:

1. **Receive notification** when import completes
2. **Review modules** in APlusBasic sheet
3. **Publish to Amazon:**
   - Mark rows with checkmark in column A
   - Menu → Export to Amazon → 📤 Publish A+ Content
4. **Check status:**
   - Menu → Export to Amazon → ✅ Check A+ Status

## Features

### ✅ Automatic Row Detection
- Finds first completely empty row in APlusBasic
- Checks all 150 columns to ensure row is truly empty
- Appends multiple modules sequentially

### ✅ Column Mapping
- Supports any column letter: A, B, C, ..., Z, AA, AB, ..., ZZ
- Handles sparse data (not all columns need values)
- Preserves existing data in other rows

### ✅ Error Handling
- Invalid JSON → Shows clear error message
- Missing `modules` key → Alert + log to Logs sheet
- Empty payload → Graceful error handling
- Sheet not found → Descriptive error

### ✅ Logging
- All operations logged to `Logs` sheet
- Timestamp, operation, status, details, user email
- Success and error logs for debugging

### ✅ User Notifications
- Success: Shows count of modules imported and row numbers
- Error: Shows error message with troubleshooting tips
- Prompts to check execution logs for details

## Testing

### Test 1: Valid Single Module
```javascript
// In Apps Script editor
testFormImport()
```
**Expected:** 2 modules imported to APlusBasic, success notification

### Test 2: Invalid JSON
```javascript
testFormImportInvalidJSON()
```
**Expected:** Error alert, logged to Logs sheet

### Test 3: Missing Modules Key
```javascript
testFormImportMissingModules()
```
**Expected:** Error alert about invalid structure

### Test 4: Column Letter Conversion
```javascript
testColumnLetterConversion()
```
**Expected:** Log shows ✅ for all test cases (A→1, AA→27, BB→54, etc.)

### Test 5: Real Form Submission
1. Go to form: https://docs.google.com/forms/d/1LDysIzwc5kfSBG3cAT7cDKnWlx6w-Sj9vJw2YhbrYI8/edit
2. Click **Preview** (eye icon)
3. Submit with valid JSON:
```json
{
  "modules": [
    {
      "row": null,
      "columns": {
        "A": true,
        "B": "TEST123",
        "C": 1,
        "D": "STANDARD_TEXT",
        "F": "Test text"
      }
    }
  ]
}
```
4. Check APlusBasic for new row with TEST123

## Troubleshooting

### Error: "APlusBasic sheet not found"
**Solution:** Create APlusBasic sheet or check spelling

### Error: "Invalid JSON format"
**Cause:** Malformed JSON from Claude
**Solution:**
1. Check ClaudeAPlusQueue sheet for raw JSON
2. Validate JSON at jsonlint.com
3. Fix JSON syntax errors

### Error: "Empty JSON payload"
**Cause:** Form submitted without data in column B
**Solution:** Ensure Claude fills JSON field in form

### Trigger Not Firing
**Check:**
1. Extensions → Apps Script → Triggers
2. Verify `onFormSubmit` trigger exists and is enabled
3. Check trigger runs: Extensions → Apps Script → Executions
4. Re-create trigger if needed

### No Notification Shown
**Note:** Notifications only appear if spreadsheet is open when form submitted
**Alternative:** Check Logs sheet for operation status

### Modules Appear in Wrong Rows
**Cause:** `findFirstEmptyRow()` not detecting empty row correctly
**Solution:**
1. Ensure rows 1-3 are headers
2. Check if any cells have hidden formulas (=IFERROR("", "") counts as non-empty)
3. Clear formatting in empty rows

## API Reference

### Functions

#### `onFormSubmit(e)`
Main trigger function. Runs on form submission.
- **Parameters:** `e` - Event object with `e.values` array
- **Returns:** void (shows notification)
- **Throws:** Error on invalid JSON or missing sheet

#### `columnLetterToNumber(letter)`
Converts column letter to number.
- **Parameters:** `letter` (string) - Column letter (A, B, AA, etc.)
- **Returns:** number (1-based column index)
- **Example:** `columnLetterToNumber('AA')` → 27

#### `findFirstEmptyRow(sheet)`
Finds first completely empty row.
- **Parameters:** `sheet` (Sheet) - Google Sheets sheet object
- **Returns:** number (1-based row index)
- **Logic:** Checks columns 1-150, returns first row where all are empty

#### `logOperation(operation, status, details)`
Logs operation to Logs sheet.
- **Parameters:**
  - `operation` (string) - Operation name
  - `status` (string) - SUCCESS, ERROR, WARNING
  - `details` (string) - Details or error message
- **Returns:** void

### Test Functions

- `testFormImport()` - Simulate form submission with valid data
- `testFormImportInvalidJSON()` - Test error handling for invalid JSON
- `testFormImportMissingModules()` - Test error handling for missing modules key
- `testColumnLetterConversion()` - Verify column letter → number conversion

## Example Scenarios

### Scenario 1: Claude Creates 3 Modules for ASIN B08ABC123

**Claude submits form with:**
```json
{
  "modules": [
    {"row": null, "columns": {"A": true, "B": "B08ABC123", "C": 1, "D": "STANDARD_COMPANY_LOGO", ...}},
    {"row": null, "columns": {"A": true, "B": "B08ABC123", "C": 2, "D": "STANDARD_TEXT", ...}},
    {"row": null, "columns": {"A": true, "B": "B08ABC123", "C": 3, "D": "STANDARD_SINGLE_SIDE_IMAGE", ...}}
  ]
}
```

**Result:**
- APlusBasic gets 3 new rows (e.g., rows 10, 11, 12)
- All ready to publish
- Notification: "3 modules imported to APlusBasic. Starting at row 10"

### Scenario 2: Updating Existing A+ Content

**Workflow:**
1. Claude submits new modules via form
2. Modules append to APlusBasic
3. You review and check column A (Export checkbox)
4. Publish: Menu → 📤 Publish A+ Content
5. Amazon reviews and approves

### Scenario 3: Error Recovery

**What happens if JSON is invalid:**
1. Form submitted with broken JSON
2. `onFormSubmit()` catches error
3. Alert shown: "❌ A+ Content Import Failed - Invalid JSON format"
4. Error logged to Logs sheet
5. You check ClaudeAPlusQueue for raw JSON
6. Fix JSON manually and re-submit form, OR
7. Copy-paste corrected JSON directly to APlusBasic

## Integration with Existing System

### Works With:
- ✅ A+ Image Library (lookups by image_url)
- ✅ Multi-language support (columns for de-DE, en-GB, etc.)
- ✅ Status checking (Check A+ Status function)
- ✅ Publishing (Publish A+ Content function)

### Column Mapping Example:

For `STANDARD_SINGLE_SIDE_IMAGE` module:

```json
{
  "columns": {
    "A": true,                          // ☑️ Export
    "B": "B0FNRLYQ3G",                 // ASIN
    "C": 1,                             // Module Number
    "D": "STANDARD_SINGLE_SIDE_IMAGE",  // Module Type
    "E": "",                            // contentReferenceKey (empty for new)
    "F": "Anwendung und Pflege",        // headline_de-DE
    "G": "Application and Care",        // headline_en-GB
    "H": "Ziehen Sie die Socken...",   // body_de-DE
    "I": "Pull on the socks...",       // body_en-GB
    "J": "https://cdn.com/image.jpg",  // image_url
    "K": "",                            // image_id (auto-lookup if image_url provided)
    "L": "Product showcase",            // image_altText
    "M": "RIGHT"                        // imagePositionType
  }
}
```

## Security & Permissions

### Required Permissions:
- **Spreadsheet access:** Read/write to APlusBasic, ClaudeAPlusQueue, Logs
- **Trigger access:** Run on form submit
- **User info:** Get email for logging

### Authorization:
First time setup requires authorization:
1. Click "Review permissions"
2. Choose your Google account
3. Click "Advanced" → "Go to [project name]"
4. Click "Allow"

### Privacy:
- Script runs in your Google account context
- No external API calls (except Amazon SP-API for publishing)
- Logs include user email for audit trail

## Monitoring

### Check Recent Imports:
1. Open **Logs** sheet
2. Filter by Operation = "FORM_IMPORT"
3. Check Status column (SUCCESS/ERROR)

### Check Execution History:
1. Extensions → Apps Script → Executions
2. View recent `onFormSubmit` runs
3. Click for detailed logs

### Common Log Entries:

**Success:**
```
Timestamp | FORM_IMPORT | SUCCESS | 3 modules imported (rows 10-12) | user@example.com
```

**Error:**
```
Timestamp | FORM_IMPORT | ERROR | Invalid JSON format: Unexpected token... | user@example.com
```

## Best Practices

### For Claude:
1. **Validate JSON** before submitting form
2. **Include all required fields** (ASIN, Module Number, Module Type)
3. **Use correct column letters** matching APlusBasic structure
4. **Test with single module** before submitting multiple

### For You:
1. **Keep APlusBasic clean** - archive old rows to separate sheet
2. **Check Logs regularly** for errors
3. **Test trigger** after Apps Script updates
4. **Backup form responses** (ClaudeAPlusQueue sheet)

## Maintenance

### Updating Script:
```bash
cd C:\Users\user\Desktop\NetAnaliza-Deploy
curl -k -L -o FormImport.gs https://raw.githubusercontent.com/.../FormImport.gs
clasp push --force
```

**Note:** Triggers persist after script updates (no need to recreate)

### Disabling Auto-Import:
1. Extensions → Apps Script → Triggers
2. Click three dots (...) next to `onFormSubmit` trigger
3. Click **Delete**

### Re-enabling:
Follow "Setup Instructions" above to recreate trigger

## Support

### Debug Checklist:
- [ ] Trigger exists and enabled
- [ ] APlusBasic sheet exists with correct name
- [ ] JSON format valid (test at jsonlint.com)
- [ ] ClaudeAPlusQueue sheet has data
- [ ] Check Execution logs for errors
- [ ] Test functions run without errors

### Contact:
For issues with integration, check:
1. Execution logs (Extensions → Apps Script → Executions)
2. Logs sheet (for operation history)
3. GitHub repository issues

---

**Last Updated:** 2025-12-10
**Script Version:** 1.0
**Form Version:** 1.0
