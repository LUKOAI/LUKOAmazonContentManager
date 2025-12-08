# LUKO-ACM Deployment Guide

Complete step-by-step guide to deploy the LUKO Amazon Content Manager system.

## Prerequisites

### Required Accounts
1. **Amazon Seller Central** - Professional seller account
2. **Amazon SP-API Developer** - Developer access
3. **Google Account** - For Google Sheets and Apps Script
4. **Google Cloud Platform** - For Cloud Functions
5. **GitHub Account** - For version control (optional)

### Required Software
- Web browser (Chrome recommended)
- Text editor (VS Code recommended)
- `gcloud` CLI tool (for Cloud Function deployment)
- Git (for version control)

### Skills Required
- Basic understanding of Google Sheets
- Basic command line knowledge
- Understanding of API concepts

---

## Phase 1: Amazon SP-API Setup

### Step 1.1: Register as SP-API Developer

1. Go to [Amazon Solution Provider Portal](https://developer.amazonservices.com/)
2. Sign in with your Seller Central credentials
3. Navigate to **Developer Central**
4. Click **Add new developer profile**
5. Fill in:
   - Developer name
   - Privacy policy URL (optional for private use)
   - Terms of service URL (optional)
6. Submit for review (usually approved within 24 hours)

### Step 1.2: Create SP-API Application

1. In Developer Central, click **Add new app client**
2. App details:
   - **App name**: `LUKO Amazon Content Manager`
   - **Description**: `Multi-language content management system for Amazon products`
   - **OAuth Redirect URIs**: `https://sellercentral.amazon.com` (or your custom URI)
3. Select **Required Roles**:
   - ✓ Listings Management
   - ✓ Uploads
   - ✓ A+ Content
   - ✓ Promotions
   - ✓ Product Pricing
   - ✓ Inventory
4. Click **Create app**

### Step 1.3: Get LWA Credentials

After app creation, note down:
- **LWA Client ID** (starts with `amzn1.application-oa2-client...`)
- **LWA Client Secret** (long alphanumeric string)

**IMPORTANT**: Store these securely. Never commit to public repositories.

### Step 1.4: Generate Refresh Token

1. Construct authorization URL:
```
https://sellercentral.amazon.com/apps/authorize/consent?application_id={YOUR_APP_ID}&state={RANDOM_STRING}&version=beta
```

2. Visit URL in browser
3. Grant permissions when prompted
4. After redirect, extract `code` from URL
5. Exchange code for refresh token:

```bash
curl -X POST \
  https://api.amazon.com/auth/o2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code={CODE_FROM_STEP_4}' \
  -d 'client_id={YOUR_CLIENT_ID}' \
  -d 'client_secret={YOUR_CLIENT_SECRET}'
```

6. Response contains `refresh_token` - save this!

### Step 1.5: Get Seller ID

1. Go to Seller Central
2. Navigate to **Settings → Account Info**
3. Find **Merchant Token** (looks like `A1BCDEFGH2IJK`)
4. This is your Seller ID

---

## Phase 2: Google Cloud Platform Setup

### Step 2.1: Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project → New Project**
3. Project name: `luko-amazon-manager`
4. Location: Keep default or select your organization
5. Click **Create**

### Step 2.2: Enable Required APIs

1. In GCP Console, go to **APIs & Services → Library**
2. Enable the following APIs:
   - ✓ Cloud Functions API
   - ✓ Cloud Build API
   - ✓ Cloud Logging API
   - ✓ Secret Manager API (optional, for credentials)

### Step 2.3: Install gcloud CLI

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download installer from https://cloud.google.com/sdk/docs/install

**Initialize:**
```bash
gcloud init
gcloud auth login
gcloud config set project luko-amazon-manager
```

### Step 2.4: Deploy Cloud Function

1. Navigate to project directory:
```bash
cd /path/to/LUKO-amazon-content-manager/cloud-function
```

2. Deploy function:
```bash
gcloud functions deploy luko-sp-api-handler \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region europe-west1 \
  --entry-point lukoSpApiHandler \
  --memory 256MB \
  --timeout 540s \
  --max-instances 10
```

3. Note the **Trigger URL** from output (looks like `https://europe-west1-{project}.cloudfunctions.net/luko-sp-api-handler`)

**Production Deployment (with authentication):**
```bash
gcloud functions deploy luko-sp-api-handler \
  --runtime nodejs20 \
  --trigger-http \
  --region europe-west1 \
  --entry-point lukoSpApiHandler \
  --memory 512MB \
  --timeout 540s \
  --max-instances 50 \
  --min-instances 1 \
  --ingress-settings internal-and-gcloud
```

### Step 2.5: Test Cloud Function

```bash
curl -X POST \
  https://europe-west1-{project}.cloudfunctions.net/luko-sp-api-handler \
  -H 'Content-Type: application/json' \
  -d '{
    "operation": "test",
    "marketplace": "DE",
    "credentials": {
      "lwaClientId": "test",
      "lwaClientSecret": "test",
      "refreshToken": "test"
    }
  }'
```

Should return error about invalid credentials (expected).

---

## Phase 3: Google Sheets Setup

### Step 3.1: Create Master Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Click **Blank** to create new spreadsheet
3. Rename to: `LUKO-Master`
4. Share with team members (if applicable)

### Step 3.2: Create Sheet Tabs

Create the following tabs (in order):

**Administration:**
1. `Config`
2. `Marketplaces`
3. `Logs`

**Products:**
4. `Products-Master`
5. `Variants`
6. `Customization`

**Content (one per marketplace):**
7. `Content-DE`
8. `Content-FR`
9. `Content-IT`
10. `Content-ES`
11. `Content-UK`
12. `Content-NL`
13. `Content-BE`
14. `Content-PL`
15. `Content-SE`
16. `Content-IE`

**Premium Content:**
17. `APlus-Basic`
18. `APlus-Premium`
19. `BrandStore`
20. `BrandStrip`

**Media:**
21. `Images`
22. `Images-360`
23. `Videos`

**Promotions:**
24. `Coupons`
25. `Promotions`
26. `Deals`

**Templates:**
27. `Templates-Content`
28. `Templates-APlus`
29. `Translation-Queue`

### Step 3.3: Set Up Config Sheet

In `Config` sheet, create headers:
```
Row 1: | Setting Name | Value | Description | Status |
```

Add rows:
```
LWA Client ID          | [paste from Phase 1.3] | Amazon OAuth client ID | Active
LWA Client Secret      | [paste from Phase 1.3] | Amazon OAuth secret | Active
Refresh Token          | [paste from Phase 1.4] | Long-lived token | Active
Seller ID              | [paste from Phase 1.5] | Merchant identifier | Active
Cloud Function URL     | [paste from Phase 2.4] | GCP function endpoint | Active
Default Marketplace    | DE | Starting marketplace | Active
Rate Limit Buffer      | 80% | Safety margin | Active
Auto-Retry Failed      | Yes | Automatic retry | Active
```

**SECURITY NOTE**: Consider encrypting sensitive values or using Google Apps Script PropertiesService.

### Step 3.4: Set Up Marketplaces Sheet

In `Marketplaces` sheet, create headers:
```
Row 1: | Marketplace | Marketplace ID | Language Code | Language Name | Primary | Export Active | Content Status | Last Sync |
```

Add rows (example for DE marketplace):
```
DE | A1PA6795UKMFR9 | de-DE | Deutsch | ☑ | ☑ | Not Started |
DE | A1PA6795UKMFR9 | en-GB | English |   | ☑ | Not Started |
DE | A1PA6795UKMFR9 | pl-PL | Polski |   | ☑ | Not Started |
DE | A1PA6795UKMFR9 | tr-TR | Türkçe |   |   | Not Started |
```

Repeat for all 10 marketplaces (see `config/marketplaces.json` for complete list).

### Step 3.5: Set Up Content Sheet Headers

For each `Content-{Marketplace}` sheet, add column headers following the pattern in `SPREADSHEET_STRUCTURE.md`.

**Example for Content-DE:**
```
☑️ | ASIN | SKU | Product Type | Title [de-DE] | Title [en-GB] | Title [pl-PL] | ... | Status | Errors | Action
```

Repeat for all content fields × all languages.

**TIP**: Use a template row and copy down for consistency.

---

## Phase 4: Google Apps Script Setup

### Step 4.1: Open Script Editor

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete default `Code.gs` content
3. Rename project to `LUKO Amazon Manager`

### Step 4.2: Add Script Files

1. Create new file: `LukoAmazonManager.gs`
2. Paste contents from `/apps-script/LukoAmazonManager.gs`
3. Save with Ctrl+S (Cmd+S on Mac)

### Step 4.3: Authorize Script

1. Click **Run → onOpen**
2. Dialog appears: "Authorization required"
3. Click **Review permissions**
4. Select your Google account
5. Click **Advanced → Go to LUKO Amazon Manager (unsafe)**
   - (This is safe - it's your own script)
6. Click **Allow**

### Step 4.4: Test Menu

1. Return to Google Sheets
2. Refresh the page
3. New menu should appear: **Amazon Manager**
4. Click menu to verify all options present

### Step 4.5: Configure Triggers (Optional)

For automated operations:

1. In Apps Script, click **Triggers** (clock icon)
2. Click **Add Trigger**
3. Configure:
   - Function: `onOpen`
   - Event source: From spreadsheet
   - Event type: On open
4. Click **Save**

---

## Phase 5: Testing & Validation

### Step 5.1: Test Configuration

1. Go to `Config` sheet
2. Verify all values are filled
3. In Google Sheets, click **Amazon Manager → Settings**
4. Should show configuration status

### Step 5.2: Test Cloud Function Connection

1. Click **Amazon Manager → Tools → Validate Data**
2. Should attempt connection to Cloud Function
3. Check for errors in execution log:
   - **View → Execution log** (in Apps Script)

### Step 5.3: Test Product Import

1. Click **Amazon Manager → Import from Amazon → Import Products**
2. Enter marketplace: `DE`
3. Click OK
4. Should import products (if any exist)
5. Check `Products-Master` sheet for results

### Step 5.4: Test Product Sync (Sandbox)

**IMPORTANT**: Use Amazon sandbox environment first!

1. Add test product to `Content-DE`:
   ```
   ☑ | B08XYZ1234 | TEST-SKU-001 | PRODUCT | Test Title [de-DE] | Test Title [en-GB] | ...
   ```
2. Check the checkbox
3. Click **Amazon Manager → Export to Amazon → Sync Selected Products**
4. Monitor progress in status column
5. Check `Logs` sheet for results

---

## Phase 6: Production Rollout

### Step 6.1: Backup Current Data

Before going live:
1. Export current product data from Seller Central
2. Save as backup CSV/Excel files
3. Document current process for rollback if needed

### Step 6.2: Pilot with Small Product Set

1. Select 5-10 products for pilot
2. Add to `Products-Master` and relevant Content sheets
3. Fill in content for 1-2 languages initially
4. Sync to Amazon
5. Verify in Seller Central
6. Test on live Amazon site

### Step 6.3: Gradual Expansion

**Week 1**:
- Add 20-50 products
- Focus on primary language only
- Monitor for errors

**Week 2-3**:
- Add secondary languages
- Test multi-language sync
- Verify language switching on Amazon

**Week 4+**:
- Expand to more marketplaces
- Add images and videos
- Implement A+ Content
- Start using promotions

### Step 6.4: Team Training

1. Create training documentation:
   - How to add new products
   - How to update content
   - How to sync changes
   - Error troubleshooting

2. Conduct training sessions:
   - Walkthrough of interface
   - Practice operations
   - Q&A session

3. Designate power users:
   - 1-2 team members as experts
   - Handle complex operations
   - Provide support to others

---

## Phase 7: Monitoring & Maintenance

### Step 7.1: Set Up Monitoring

**Daily Checks:**
- Review `Logs` sheet for errors
- Check sync success rate
- Monitor API quota usage

**Weekly Reviews:**
- Content completion status
- Language coverage reports
- Performance metrics

**Monthly Analysis:**
- ROI on promotions
- Content update frequency
- System usage patterns

### Step 7.2: Error Handling

**Common Errors & Solutions:**

1. **Authentication Failed**
   - Refresh token expired → Re-generate in Phase 1.4
   - Invalid credentials → Verify in `Config` sheet

2. **Rate Limit Exceeded**
   - Too many requests → Increase delay in config
   - Batch too large → Reduce batch size

3. **Invalid Data**
   - Run validation before sync
   - Fix highlighted errors
   - Check character limits

4. **Cloud Function Timeout**
   - Increase timeout in deployment
   - Split large operations
   - Optimize batch processing

### Step 7.3: Regular Maintenance

**Monthly:**
- Review and archive old logs
- Update marketplace configurations
- Check for SP-API changes
- Update templates

**Quarterly:**
- Review API usage costs
- Optimize Cloud Function resources
- Audit user permissions
- Update documentation

**Annually:**
- Refresh all credentials
- Major version updates
- Team training refresh
- Process optimization review

---

## Phase 8: Advanced Configuration

### Step 8.1: Custom Templates

1. Go to `Templates-Content` sheet
2. Create templates for your product categories
3. Use variables: `{BRAND}`, `{SIZE}`, `{COLOR}`, etc.
4. Apply templates via menu: **Tools → Apply Template**

### Step 8.2: Translation Workflow

1. Add translation queue in `Translation-Queue` sheet
2. Assign translators
3. Track progress
4. Integrate with translation services

### Step 8.3: Automation

**Apps Script Triggers:**
- Auto-import new products daily
- Auto-sync changed content hourly
- Auto-generate reports weekly

**Cloud Function Scheduling:**
```bash
gcloud scheduler jobs create http daily-import \
  --schedule="0 2 * * *" \
  --uri="{cloud-function-url}" \
  --http-method=POST \
  --message-body='{"operation":"import_products","marketplace":"DE"}'
```

### Step 8.4: Multi-User Setup

**Permission Levels:**
1. **Admin**: Full access, configuration
2. **Editor**: Edit content, sync products
3. **Viewer**: Read-only access

**Set up in Google Sheets:**
1. Click **Share**
2. Add team members with appropriate roles
3. Consider: Protected ranges for sensitive data

---

## Troubleshooting

### Issue: Menu Not Appearing

**Solution:**
1. Refresh the page
2. Run `onOpen` manually from Apps Script
3. Check authorization status
4. Review execution log for errors

### Issue: Cloud Function Not Responding

**Solution:**
1. Check function is deployed: `gcloud functions list`
2. View logs: `gcloud functions logs read luko-sp-api-handler`
3. Verify URL in `Config` sheet
4. Test with curl command

### Issue: Amazon API Errors

**Solution:**
1. Check SP-API Developer Console for status
2. Verify credentials are valid
3. Check marketplace IDs are correct
4. Review Amazon SP-API documentation for changes

### Issue: Slow Performance

**Solution:**
1. Reduce batch size in `Config`
2. Increase Cloud Function memory
3. Optimize sheet formulas
4. Archive old data

---

## Security Best Practices

1. **Credentials:**
   - Never share refresh token
   - Rotate credentials every 90 days
   - Use Secret Manager for production
   - Enable 2FA on all accounts

2. **Access Control:**
   - Limit spreadsheet access
   - Use view-only for reporting
   - Audit access logs regularly
   - Remove inactive users

3. **Data Protection:**
   - Encrypt sensitive data
   - Regular backups
   - Version control for code
   - Disaster recovery plan

4. **Monitoring:**
   - Alert on failed authentications
   - Monitor API usage
   - Log all operations
   - Review security weekly

---

## Support & Resources

### Documentation
- [Amazon SP-API Docs](https://developer-docs.amazon.com/sp-api/)
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Google Cloud Functions Docs](https://cloud.google.com/functions/docs)

### Community
- Amazon Seller Forums
- Stack Overflow (tag: amazon-sp-api)
- Google Apps Script Community

### Project Files
- `README.md` - Overview
- `SPREADSHEET_STRUCTURE.md` - Sheet details
- `API_REFERENCE.md` - API usage
- `USER_GUIDE.md` - End-user instructions

---

## Deployment Checklist

### Pre-Deployment
- [ ] Amazon SP-API account created
- [ ] LWA credentials obtained
- [ ] Refresh token generated
- [ ] GCP project created
- [ ] Cloud Function deployed
- [ ] Function URL obtained
- [ ] Google Sheet created
- [ ] All tabs created
- [ ] Apps Script installed
- [ ] Config filled in

### Testing
- [ ] Menu appears
- [ ] Cloud Function connection works
- [ ] Test import successful
- [ ] Test sync in sandbox
- [ ] Validation working
- [ ] Error handling tested
- [ ] Logs capturing data

### Production
- [ ] Backup created
- [ ] Pilot products selected
- [ ] Team trained
- [ ] Documentation complete
- [ ] Monitoring set up
- [ ] Support process defined
- [ ] Go-live date set
- [ ] Rollback plan ready

---

**Version:** 2.0.0
**Last Updated:** 2024-01

For questions or issues, refer to project repository or contact system administrator.
