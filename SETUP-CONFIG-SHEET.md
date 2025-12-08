# ⚙️ LUKO-ACM: Config Sheet Setup Guide

## 📋 Config Sheet Structure

The **Config** sheet stores all credentials and configuration needed to connect to Amazon SP-API and Google Cloud Function.

### Required Format

| Column A (Configuration Key) | Column B (Value) |
|------------------------------|------------------|
| **Cloud Function URL** | `https://europe-west1-your-project.cloudfunctions.net/lukoSpApiHandler` |
| **LWA Client ID** | `amzn1.application-oa2-client.XXXXX` |
| **LWA Client Secret** | `amzn1.oa2-cs.v1.YYYYY` |
| **Refresh Token** | `Atzr|IwEBIA...` |
| **Seller ID** | `A1BCDEFGH2IJK` |

---

## 🔑 How to Get Amazon SP-API Credentials

### Step 1: Register as Amazon SP-API Developer

1. Go to **Amazon Seller Central**: https://sellercentral.amazon.de (or your marketplace)
2. Navigate to: **Settings** → **User Permissions** → **Manage**
3. Click: **Develop Apps** (in left menu)
4. Click: **Add new app client**

### Step 2: Create SP-API Application

Fill in application details:
- **App name**: `LUKO Amazon Content Manager`
- **OAuth Login URI**: `https://example.com/callback` (placeholder)
- **OAuth Redirect URIs**: `https://example.com/callback`

### Step 3: Save Your Credentials

After creating the app, Amazon will show:

#### LWA Client ID
```
Format: amzn1.application-oa2-client.abc123def456...
Example: amzn1.application-oa2-client.1a2b3c4d5e6f7g8h9i0j
```
Copy this to **Column B, Row with "LWA Client ID"**

#### LWA Client Secret
```
Format: amzn1.oa2-cs.v1.abc123def456...
Example: amzn1.oa2-cs.v1.1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```
⚠️ **IMPORTANT**: This is shown ONLY ONCE! Save it immediately!

Copy this to **Column B, Row with "LWA Client Secret"**

### Step 4: Generate Refresh Token

1. In the same app page, click: **Self Authorize**
2. Amazon will ask for authorization
3. Click: **Authorize** (confirm permissions)
4. Copy the **Refresh Token** shown

```
Format: Atzr|IwEBIA...
Example: Atzr|IwEBIHfQ7ynCqNPZvLzQvXuMjAxNDEwNTY3ODkwfDEwMDAwMDAwMDA
```

Copy this to **Column B, Row with "Refresh Token"**

### Step 5: Find Your Seller ID

1. In Seller Central, go to: **Settings** → **Account Info**
2. Look for: **Merchant Token** or **Seller ID**

```
Format: A + 13 alphanumeric characters
Example: A1BCDEFGH2IJK
```

Copy this to **Column B, Row with "Seller ID"**

---

## ☁️ How to Get Cloud Function URL

### Option A: Deploy Cloud Function (Recommended)

See **DEPLOYMENT.md** for detailed instructions.

After deployment, the URL will look like:
```
https://europe-west1-your-project-id.cloudfunctions.net/lukoSpApiHandler
```

### Option B: Use Existing Deployment

If your Cloud Function is already deployed, find the URL:

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Navigate to: **Cloud Functions**
3. Click on function: **lukoSpApiHandler**
4. Copy the **Trigger URL** from the TRIGGER tab

Copy this to **Column B, Row with "Cloud Function URL"**

---

## ✅ Config Sheet - Complete Example

Here's what your Config sheet should look like:

| A | B |
|---|---|
| **Cloud Function URL** | https://europe-west1-luko-acm-123456.cloudfunctions.net/lukoSpApiHandler |
| **LWA Client ID** | amzn1.application-oa2-client.1a2b3c4d5e6f7g8h9i0j |
| **LWA Client Secret** | amzn1.oa2-cs.v1.1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t |
| **Refresh Token** | Atzr|IwEBIHfQ7ynCqNPZvLzQvXuMjAxNDEwNTY3ODkwfDEwMDAwMDAwMDA |
| **Seller ID** | A1BCDEFGH2IJK |

---

## 🔒 Security Best Practices

1. **NEVER share your Config sheet** with unauthorized people
2. **NEVER commit credentials to Git**
3. **Use Google Sheets permissions** to restrict access
4. **Rotate Refresh Token** every 6-12 months
5. **Monitor Cloud Function logs** for suspicious activity

---

## 🐛 Troubleshooting

### Error: "Missing required credentials"

**Problem**: One or more credentials are empty or have wrong key names.

**Solution**:
1. Check Column A has EXACTLY these key names:
   - `LWA Client ID` (not "Client ID" or "lwaClientId")
   - `LWA Client Secret` (not "Client Secret")
   - `Refresh Token` (not "refreshToken")
   - `Seller ID` (not "sellerId" or "Merchant ID")

2. Check Column B values are not empty
3. Check there are no extra spaces before/after values

### Error: "Cloud Function URL not configured"

**Problem**: Cloud Function URL is missing or invalid.

**Solution**:
1. Check Column A has: `Cloud Function URL`
2. Check Column B has valid HTTPS URL
3. URL must start with: `https://` and end with `/lukoSpApiHandler`

### Error: "LWA Authentication failed"

**Problem**: Refresh Token expired or Client ID/Secret wrong.

**Solution**:
1. Go to Amazon Seller Central → Develop Apps
2. Generate NEW Refresh Token (Self Authorize)
3. Update in Config sheet
4. Try export again

### Error: "Authorization failed: invalid_client"

**Problem**: LWA Client ID or Secret is wrong.

**Solution**:
1. Verify credentials in Amazon Seller Central → Develop Apps
2. Copy EXACT values (no spaces, full string)
3. Update in Config sheet

---

## 📞 Need Help?

- **Documentation**: See DEPLOYMENT.md and README.md
- **Support Email**: support@netanaliza.com
- **Amazon SP-API Docs**: https://developer-docs.amazon.com/sp-api/

---

**Last Updated**: 2025-12-08
**Version**: 2.1.0
