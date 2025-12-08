# ☁️ Google Cloud Function - Complete Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Google Cloud Platform Account**
   - Free tier available: https://cloud.google.com/free
   - Credit card required (but won't be charged for small usage)

2. **Google Cloud Project**
   - Create new project or use existing
   - Project ID (e.g., `luko-amazon-manager-123456`)

3. **Billing Enabled**
   - Must enable billing (even for free tier)
   - Go to: Billing → Link a billing account

4. **gcloud CLI installed** (Optional - for command-line deployment)
   - Download: https://cloud.google.com/sdk/docs/install
   - Or use Google Cloud Console (web interface)

---

## 🚀 Deployment Method 1: Google Cloud Console (EASIEST)

### Step 1: Enable Required APIs

1. Go to: https://console.cloud.google.com
2. Select your project (top left dropdown)
3. Navigate to: **APIs & Services** → **Library**
4. Enable these APIs:
   - ✅ **Cloud Functions API**
   - ✅ **Cloud Build API**
   - ✅ **Cloud Run API** (auto-enabled with Functions)

### Step 2: Create Cloud Function

1. Go to: **Cloud Functions** → **CREATE FUNCTION**
2. Fill in configuration:

#### Environment
```
Environment: 2nd gen (recommended)
```

#### Basics
```
Function name: lukoSpApiHandler
Region: europe-west1 (Belgium) or europe-west3 (Frankfurt)
```
💡 **Tip**: Choose region closest to your users

#### Trigger
```
Trigger type: HTTPS
Authentication: Allow unauthenticated invocations ✅
```
⚠️ **Important**: Must allow unauthenticated! Apps Script will call this URL.

Click **SAVE** then **NEXT**

### Step 3: Configure Runtime

#### Runtime settings
```
Runtime: Node.js 20
Entry point: lukoSpApiHandler
Memory: 512 MB
Timeout: 540 seconds (max)
Minimum instances: 0
Maximum instances: 10
```

### Step 4: Add Source Code

#### Source Code tab
```
Runtime: Inline editor (default)
```

You'll see two files:
- **index.js**
- **package.json**

#### index.js
1. DELETE all existing code
2. COPY entire contents from: `/cloud-function/index.js`
3. PASTE into inline editor

#### package.json
1. DELETE all existing code
2. COPY entire contents from: `/cloud-function/package.json`
3. PASTE into inline editor

### Step 5: Deploy!

1. Click **DEPLOY** (bottom)
2. Wait ~3-5 minutes (☕ coffee time)
3. When done, you'll see green checkmark ✅

### Step 6: Get Trigger URL

1. Click on your function name: **lukoSpApiHandler**
2. Go to: **TRIGGER** tab
3. Copy the **Trigger URL**

Example:
```
https://europe-west1-luko-amazon-manager-123456.cloudfunctions.net/lukoSpApiHandler
```

4. **SAVE THIS URL!** You'll need it for Config sheet.

---

## 🚀 Deployment Method 2: gcloud CLI (ADVANCED)

### Step 1: Install gcloud CLI

```bash
# Download from: https://cloud.google.com/sdk/docs/install
# Or use package manager:

# macOS (Homebrew)
brew install --cask google-cloud-sdk

# Ubuntu/Debian
sudo apt-get install google-cloud-sdk

# Windows
# Download installer from Google
```

### Step 2: Initialize gcloud

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project YOUR-PROJECT-ID

# Example:
gcloud config set project luko-amazon-manager-123456
```

### Step 3: Deploy from Terminal

```bash
# Navigate to cloud-function directory
cd /path/to/LUKOAmazonContentManager/cloud-function

# Deploy function
gcloud functions deploy lukoSpApiHandler \
  --gen2 \
  --runtime=nodejs20 \
  --region=europe-west1 \
  --source=. \
  --entry-point=lukoSpApiHandler \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=540s \
  --memory=512MB \
  --max-instances=10

# Wait ~3-5 minutes
```

### Step 4: Get URL

After deployment completes, you'll see output:
```
httpsTrigger:
  url: https://europe-west1-luko-amazon-manager-123456.cloudfunctions.net/lukoSpApiHandler
```

Copy this URL for Config sheet.

---

## 🔒 Security Configuration (Optional but Recommended)

### Option 1: Add API Key (Recommended for Production)

1. Modify Cloud Function code to check for API key
2. Add header check in `index.js`:

```javascript
// At top of lukoSpApiHandler function
if (req.headers['x-api-key'] !== 'YOUR_SECRET_API_KEY') {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

3. In Apps Script, update `callCloudFunction()`:
```javascript
const options = {
  method: 'post',
  contentType: 'application/json',
  headers: {
    'x-api-key': 'YOUR_SECRET_API_KEY'
  },
  payload: JSON.stringify(payload),
  muteHttpExceptions: true
};
```

### Option 2: Use Google Cloud IAM (Advanced)

1. Create Service Account
2. Grant invoker role
3. Use service account credentials in Apps Script

---

## 📊 Monitoring & Logs

### View Logs

#### Method 1: Cloud Console
1. Go to: **Cloud Functions** → **lukoSpApiHandler**
2. Click: **LOGS** tab
3. See all requests and errors in real-time

#### Method 2: Cloud Logging
1. Go to: **Logging** → **Logs Explorer**
2. Filter by resource: `Cloud Function: lukoSpApiHandler`
3. See detailed logs with timestamps

### Useful Log Queries

```
# Show all errors
severity >= ERROR

# Show specific operation
jsonPayload.operation="update"

# Show slow requests (>5 seconds)
jsonPayload.duration > 5000
```

---

## 💰 Cost Estimation

### Free Tier (Monthly)

```
Invocations:  2 million free
Compute time: 400,000 GB-seconds free
Network:      5 GB free

Typical usage for LUKO-ACM:
- 1,000 product exports/month
- Average 2 seconds per export
- Total: ~2,000 seconds = 0.55 GB-seconds

Cost: $0 (well within free tier)
```

### Paid Tier (if you exceed free tier)

```
Invocations:  $0.40 per million
Compute time: $0.0000025 per GB-second
Network:      $0.12 per GB

Example: 10,000 exports/month
Cost: ~$0.05/month
```

💡 **Tip**: LUKO-ACM is extremely cost-efficient on GCP!

---

## 🐛 Troubleshooting

### Error: "Deployment failed: Permission denied"

**Solution**: Enable Cloud Build API
```bash
gcloud services enable cloudbuild.googleapis.com
```

### Error: "Function deployment timeout"

**Solution**: Increase deployment timeout
```bash
gcloud functions deploy ... --build-timeout=1200s
```

### Error: "Cannot find module 'axios'"

**Solution**: Check `package.json` has dependencies:
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### Error: "CORS blocked"

**Solution**: Already handled in code (lines 18-20 of index.js)
```javascript
res.set('Access-Control-Allow-Origin', '*');
```

### Function works locally but fails in GCP

**Solution**: Check environment variables and region
- Ensure `--region` matches your marketplace (europe-west1 for EU)
- Check timeout is sufficient (540s recommended)

---

## 🔄 Updating Deployed Function

### Update via Console

1. Go to: **Cloud Functions** → **lukoSpApiHandler**
2. Click: **EDIT**
3. Modify code in inline editor
4. Click: **DEPLOY**

### Update via CLI

```bash
# Just run deploy command again
gcloud functions deploy lukoSpApiHandler \
  --gen2 \
  --runtime=nodejs20 \
  --region=europe-west1 \
  --source=. \
  --entry-point=lukoSpApiHandler \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=540s \
  --memory=512MB
```

---

## ✅ Verification

### Test Cloud Function

Use curl:
```bash
curl -X POST https://YOUR-FUNCTION-URL/lukoSpApiHandler \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "test",
    "marketplace": "DE",
    "marketplaceId": "A1PA6795UKMFR9"
  }'
```

Expected response:
```json
{
  "status": "ERROR",
  "message": "Unknown operation: test"
}
```
(This confirms function is running!)

### Test with Apps Script

1. Fill in Config sheet with Cloud Function URL
2. Create test product in ProductsMain
3. Check Export checkbox ☑️
4. Menu: Export to Amazon → Export Products
5. Check Logs sheet for results

---

## 📞 Support

- **Google Cloud Support**: https://cloud.google.com/support
- **Documentation**: https://cloud.google.com/functions/docs
- **LUKO-ACM Issues**: See SETUP-CONFIG-SHEET.md

---

**Last Updated**: 2025-12-08
**Version**: 2.1.0
