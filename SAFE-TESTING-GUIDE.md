# 🛡️ LUKO-ACM: Safe Testing Guide

## ⚠️ CRITICAL: Production Safety Rules

### DO NOT TOUCH during active season! ❌

If your client is currently in **active selling season** (Q4, Black Friday, Prime Day, etc.):

1. **❌ DO NOT export to production ASINs/SKUs**
2. **❌ DO NOT test on live product listings**
3. **❌ DO NOT modify existing content**
4. **✅ ONLY use test products (see below)**

---

## 🎯 Safe Testing Strategy

### Phase 1: READ-ONLY Operations (SAFEST)

Test functionality WITHOUT making any changes to Amazon:

#### 1.1 Test Configuration

```
✅ Test Cloud Function URL connectivity
✅ Test credentials validation
✅ Test Config sheet structure
```

**How to test**:
1. Go to Config sheet
2. Fill in Cloud Function URL and credentials
3. Menu: Amazon Manager → Tools → Test Connection
4. Should show: "✅ Configuration valid"

#### 1.2 Test Validation

```
✅ Test data validation rules
✅ Test error highlighting
✅ Test character limits
```

**How to test**:
1. Create test row in ProductsMain with INTENTIONALLY wrong data:
   - Title too long (>200 chars)
   - Missing ASIN
   - Invalid URLs
2. Check Export checkbox ☑️
3. Menu: Validation → Validate Selected Products
4. Check errors are highlighted in red
5. Check ErrorLog sheet has details

#### 1.3 Test Import (READ from Amazon)

```
✅ Import existing products
✅ Import pricing
✅ Import inventory
```

**How to test**:
1. Menu: Import from Amazon → Import Products
2. Enter EXISTING SKU from your account
3. Check data imports correctly to ProductsMain
4. **NO CHANGES made to Amazon** (read-only)

### Phase 2: TEST Products (SAFE to modify)

Create dedicated TEST products that won't affect live sales:

#### 2.1 Create Test Product on Amazon

**Option A: Create via Seller Central**
1. Go to Amazon Seller Central
2. Inventory → Add a Product
3. Create NEW test product:
   - Title: "TEST PRODUCT - DO NOT BUY - FOR TESTING ONLY"
   - SKU: `TEST-LUKO-001`
   - ASIN: (will be assigned by Amazon)
   - Price: €999.99 (high price to prevent accidental purchases)
   - Quantity: 0 (out of stock)
   - Hidden from search (if possible in your marketplace)

4. Save ASIN and SKU for testing

**Option B: Use existing test/inactive product**
- Use old/discontinued SKU that's no longer for sale
- Ensure it's NOT linked to any active sales

#### 2.2 Test Export with TEST Product

```
✅ Export test product
✅ Verify update on Amazon
✅ Check status tracking
✅ Check error handling
```

**How to test**:
1. In ProductsMain, Row 4 (first data row):
   ```
   ☑️ Export: TRUE
   SKU: TEST-LUKO-001
   ASIN: (your test ASIN)
   Product Type: PRODUCT
   productTitle_DE: Test Produkt für LUKO System
   productTitle_EN: Test Product for LUKO System
   brand_DE: TestBrand
   brand_EN: TestBrand
   bulletPoint1_DE: Erster Testpunkt
   bulletPoint1_EN: First test point
   mainImageURL: https://example.com/test-image.jpg
   ```

2. Menu: Export to Amazon → Export Products

3. Wait for Status to update:
   - PENDING → processing
   - DONE → success ✅
   - FAILED → error (check ErrorMessage column)

4. Verify on Amazon Seller Central:
   - Go to: Inventory → Manage Inventory
   - Find: TEST-LUKO-001
   - Check: Title updated? Bullet points updated?

#### 2.3 Test Rollback

**If something goes wrong:**

1. Import original data from Amazon:
   ```
   Menu: Import from Amazon → Import Products
   SKU: TEST-LUKO-001
   ```

2. This restores original content

3. Or manually restore via Seller Central

---

## 🔬 Testing Checklist

### ✅ Pre-Production Testing

Before using with REAL products, verify:

- [ ] **Config sheet** - All credentials correct
- [ ] **Cloud Function** - Deployed and accessible
- [ ] **Test Connection** - Shows "✅ Configuration valid"
- [ ] **Validation** - Errors are caught and highlighted
- [ ] **Test Product Export** - Successfully updates Amazon
- [ ] **Status Tracking** - Status column updates correctly
- [ ] **Error Handling** - Failed exports show clear error messages
- [ ] **ProductLink Generation** - Links are correct (https://amazon.de/dp/ASIN)
- [ ] **ExportDateTime** - Shows correct timestamp (EU format)
- [ ] **Logs Sheet** - All operations logged
- [ ] **Import** - Can read data back from Amazon

### ✅ Multi-Language Testing

- [ ] Test product with multiple languages (DE + EN minimum)
- [ ] Verify all languages exported correctly
- [ ] Check character limits per language
- [ ] Test special characters (ä, ö, ü, é, è, ñ, etc.)

### ✅ Advanced Features Testing

- [ ] Test bullet points 6-9 (extended)
- [ ] Test platinum keywords (if eligible)
- [ ] Test pricing update
- [ ] Test inventory update
- [ ] Test GPSR compliance fields
- [ ] Test document URLs

---

## 🚨 What to do if Something Goes Wrong

### Scenario 1: Export fails with error

**Symptoms**: Status = FAILED, ErrorMessage shown

**Actions**:
1. Read ErrorMessage - Amazon provides specific error codes
2. Common errors:
   - `13012` = GPSR missing → Fill manufacturer/responsible person
   - `8058` = Invalid value → Check data format
   - `5000` = API error → Wait and retry
3. Fix error in ProductsMain
4. Check Export checkbox again
5. Re-export

### Scenario 2: Wrong data exported to Amazon

**Symptoms**: Product on Amazon has wrong content

**Actions**:
1. **IMMEDIATELY** import correct data:
   ```
   Menu: Import from Amazon → Import Products
   (imports CURRENT data from Amazon)
   ```
2. Check what was changed (compare with backup)
3. Fix in ProductsMain
4. Re-export correct data
5. Verify on Seller Central

### Scenario 3: "Missing required credentials" error

**Symptoms**: Export fails immediately with credentials error

**Actions**:
1. Check Config sheet (see SETUP-CONFIG-SHEET.md)
2. Verify all 5 fields are filled:
   - Cloud Function URL
   - LWA Client ID
   - LWA Client Secret
   - Refresh Token
   - Seller ID
3. Check for extra spaces or line breaks
4. Try Test Connection again

### Scenario 4: Cloud Function timeout

**Symptoms**: Export hangs for >9 minutes, then fails

**Actions**:
1. Check Cloud Function logs (GCP Console → Cloud Functions → Logs)
2. May need to increase timeout (already set to 540s max)
3. Or reduce batch size (export fewer products at once)

---

## 🔐 Access Control

### Recommended Permissions

**During Testing Phase**:
```
Google Sheets: Editor (you)
Cloud Function: Owner (you)
Amazon SP-API: Full access (your credentials)
```

**Production Phase**:
```
Google Sheets:
  - Editor: Team leads only
  - Viewer: Team members
  - Restricted: Contractors/external
Cloud Function: Owner (admin only)
Amazon SP-API: Full access (secure credentials)
```

### Security Checklist

- [ ] Config sheet NOT shared publicly
- [ ] Credentials NOT committed to Git
- [ ] Cloud Function logs NOT publicly accessible
- [ ] Refresh Token rotated every 6-12 months
- [ ] Only trusted people have Editor access
- [ ] Version control enabled (Google Sheets History)

---

## 📊 Monitoring Production Usage

### Daily Checks (during active season)

1. **Check Logs sheet**:
   - Any new FAILED exports?
   - Any API errors?
   - Any unusual activity?

2. **Check ErrorLog sheet**:
   - Any validation errors?
   - Are errors being fixed?

3. **Spot-check Amazon**:
   - Pick 2-3 random products
   - Verify content matches ProductsMain
   - Check images/bullets/descriptions

### Weekly Checks

1. **Cloud Function logs**:
   - Go to GCP Console → Cloud Functions → Logs
   - Look for errors or warnings
   - Check response times (should be <5 seconds)

2. **Cost monitoring**:
   - GCP Console → Billing
   - Should be $0 (free tier) for typical usage
   - Alert if cost >$1

---

## 🎓 Training for Team

### Before giving access to team:

1. **Demo the system** (30 mins):
   - Show Config sheet
   - Show ProductsMain structure
   - Show Export process
   - Show validation
   - Show Logs

2. **Let them practice** (1 hour):
   - Use TEST products only
   - Try export/import
   - Intentionally make errors
   - See how validation works

3. **Create SOP document**:
   - Step-by-step screenshots
   - Common errors and fixes
   - Who to contact for help

4. **Set up backup person**:
   - At least 2 people know the system
   - In case primary person unavailable

---

## 📞 Emergency Contacts

**If critical issue during active season:**

1. **STOP all exports immediately**
2. **Check what was changed**:
   - Logs sheet
   - Cloud Function logs
   - Amazon Seller Central
3. **Rollback if needed**:
   - Import from Amazon
   - Or manually fix in Seller Central
4. **Contact support**:
   - support@netanaliza.com
   - Include: Screenshots, error messages, ASIN/SKU affected

---

## ✅ Go-Live Checklist

Before using with real products in production:

- [ ] All testing completed successfully
- [ ] Team trained and comfortable with system
- [ ] Backup/rollback procedure tested
- [ ] Emergency contact list created
- [ ] Config sheet secured (permissions set)
- [ ] Test products work perfectly
- [ ] Multi-language exports verified
- [ ] Validation catches all errors
- [ ] Logs and monitoring set up
- [ ] Start with 5-10 NON-critical products first
- [ ] Gradually expand to more products
- [ ] Monitor closely for first week

---

**Remember**: Safety first! When in doubt, TEST first with test products.

**Last Updated**: 2025-12-08
**Version**: 2.1.0
