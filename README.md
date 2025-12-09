# NetAnaliza Amazon Content Manager

**Version 3.0.0** - Direct SP-API Integration

## 🚀 What's New in v3.0

### Major Changes

1. **✅ REMOVED Google Cloud Function** - Now using direct Amazon SP-API connections
2. **✅ Multi-Client Support** - Manage multiple Amazon seller accounts in one spreadsheet
3. **✅ New "Client Settings" Sheet** - All configuration in one place
4. **✅ Renamed Menu: "NetAnaliza Manager"**
5. **✅ Client Visibility** - Always see which account data comes from

### Benefits

- **Faster** - No intermediary (Cloud Function)
- **More Secure** - Direct connection to Amazon
- **Simpler** - No Google Cloud configuration needed
- **Multi-Client** - Support multiple clients simultaneously
- **Transparent** - Always know which account data flows from

---

## 📋 Quick Start

### 1. Open Google Sheets

Copy or open the spreadsheet with NetAnaliza Amazon Content Manager code.

### 2. Generate Sheets (First Run)

```
Menu → Tools → 🎨 Generate Spreadsheet
```

This will create all necessary sheets, including **Client Settings**.

### 3. Configure Your First Client

#### Option A: Migrate from Old Config (if you have one)

```
Menu → Client Management → 📥 Migrate from Old Config
```

#### Option B: Add New Client

```
Menu → Client Management → ➕ Add New Client
```

Provide:
- **Client Name**: Client name (e.g., "ABC Company Ltd.")
- **Client Email**: Client email (optional)
- **Seller ID**: Amazon Seller ID (e.g., `A3EXAMPLE123456`)
- **Marketplace**: Marketplace (e.g., `DE`, `FR`, `UK`)
- **Refresh Token**: Amazon SP-API Refresh Token
- **LWA Client ID**: Amazon LWA Client ID
- **LWA Client Secret**: Amazon LWA Client Secret

### 4. Activate Client

Click on **Client Settings** sheet and check the **✓ Active** checkbox for the client you want to use.

**IMPORTANT**: Only one client can be active at a time!

### 5. Done!

You can now use all tool features.

---

## 🎮 How to Use

### Switch Between Clients

```
Menu → Client Management → 🔄 Switch Active Client
```

Select client number from the list.

### Check Active Client

```
Menu → Client Management → 📋 Show Active Client
```

Shows currently active client.

### Add New Client

```
Menu → Client Management → ➕ Add New Client
```

### Export Products to Amazon

1. Open **ProductsMain** sheet
2. Fill in product data
3. Check **☑️ Export** checkbox for products
4. Click:
   ```
   Menu → Export to Amazon → 📤 Export Products
   ```

**Status Column** will show:
```
DONE [Client Name - Seller ID]
```

This way you always know which account you exported from!

### Import Products from Amazon

#### Import by ASIN:
```
Menu → Import from Amazon → 📦 Import by ASIN(s)
```

#### Search by Keyword:
```
Menu → Import from Amazon → 🔍 Search Products by Keyword
```

---

## 📊 Client Settings Sheet

### Column Structure

| Column | Description | Required |
|--------|-------------|----------|
| ✓ Active | Checkbox - only one can be checked | ✅ |
| Client Name | Client name | ✅ |
| Client Email | Client email | ❌ |
| Seller ID | Amazon Seller ID | ✅ |
| Marketplace | Marketplace code (DE, FR, UK...) | ✅ |
| Marketplace ID | Amazon Marketplace ID | ✅ |
| Refresh Token | SP-API Refresh Token | ✅ |
| LWA Client ID | Login with Amazon Client ID | ✅ |
| LWA Client Secret | Login with Amazon Client Secret | ✅ |
| Notes | Notes | ❌ |
| Created Date | Creation date | Auto |
| Last Used | Last used | Auto |

### Marketplace IDs

Most commonly used:

| Marketplace | Code | Marketplace ID |
|-------------|------|----------------|
| Germany | DE | A1PA6795UKMFR9 |
| France | FR | A13V1IB3VIYZZH |
| Italy | IT | APJ6JRA9NG5V4 |
| Spain | ES | A1RKKUPIHCS9HS |
| United Kingdom | UK | A1F83G8C2ARO7P |
| Netherlands | NL | A1805IZSGTT6HS |
| Poland | PL | A1C3SOZRARQ6R3 |
| Sweden | SE | A2NODRKZP88ZB9 |

---

## 🔑 How to Get Client Settings Data?

### 1. Seller ID

1. Log in to Amazon Seller Central
2. Menu → Settings → Account Info
3. Find **Merchant Token** or **Seller ID**

### 2. LWA Client ID, Secret + Refresh Token

#### Step 1: Create Application in Amazon Developer Console

1. Go to: https://developer.amazon.com/settings/console/registration
2. Log in with the same account as Seller Central
3. Click **Create New Client**
4. Select **SP-API**
5. Enter **Allowed Return URLs**: `https://ads.netanaliza.com/amazon-callback`
6. Save **Client ID** and **Client Secret**

#### Step 2: Authorize Application and Get Refresh Token

**Automatically (via Email):**

```
Menu → SP-API Auth → 📧 Setup Email Automation
```

Then send authorization link to client. Token will be saved automatically.

**Manually:**

1. Generate authorization link:
   ```
   https://sellercentral.amazon.de/apps/authorize/consent?application_id={CLIENT_ID}&state=test&version=beta
   ```

2. Open in browser and authorize

3. From callback URL copy `spapi_oauth_code=...`

4. Paste code in SP-API Auth sheet

5. Click:
   ```
   Menu → SP-API Auth → 📝 Manual: Exchange Auth Code
   ```

---

## 🚨 FAQ

### ❓ Can I have multiple clients in one spreadsheet?

**YES!** This is the main feature of v3.0. Add any number of clients and switch between them.

### ❓ What happened to Cloud Function?

**Removed!** We now use direct connections to Amazon SP-API. It's faster and simpler.

### ❓ What happened to "Config" and "Settings" sheets?

**Replaced** by **Client Settings**. All settings are now in one place.

You can migrate old data:
```
Menu → Client Management → 📥 Migrate from Old Config
```

### ❓ Can I use two clients simultaneously?

**NO.** Only one client can be active at a time. But you can switch quickly:
```
Menu → Client Management → 🔄 Switch Active Client
```

### ❓ How to check which client is active?

```
Menu → Client Management → 📋 Show Active Client
```

Or see **Status** column after export - shows client name.

### ❓ Is data secure?

**YES.** All data is stored in your private Google Sheets.

**NEVER** share the Client Settings sheet with anyone!

### ❓ What to do if "No active client selected"?

Check the **✓ Active** checkbox for one of the clients in **Client Settings** sheet.

---

## 🛠️ Troubleshooting

### Problem: "Client Settings sheet not found"

**Solution:**
```
Menu → Tools → 🎨 Generate Spreadsheet
```

or

```
Menu → Client Management → 🔧 Setup Client Settings
```

### Problem: "No active client selected"

**Solution:**

1. Open **Client Settings** sheet
2. Check **✓ Active** checkbox for one client
3. Uncheck all other checkboxes

### Problem: "Missing required credentials"

**Solution:**

1. Open **Client Settings** sheet
2. Verify all required fields are filled:
   - Client Name
   - Seller ID
   - Marketplace
   - Marketplace ID
   - Refresh Token
   - LWA Client ID
   - LWA Client Secret

### Problem: "Token refresh failed"

**Solution:**

Refresh Token expired or is invalid.

1. Generate new Refresh Token (see "How to Get Data" section)
2. Paste in **Client Settings → Refresh Token**
3. Try again

---

## 📝 Version Differences

### Version 2.0 (old) vs 3.0 (new)

| Feature | v2.0 | v3.0 |
|---------|------|------|
| Connection | Google Cloud Function | Direct SP-API ✅ |
| Multi-Client | ❌ | ✅ Yes |
| Configuration | Config + Settings | Client Settings ✅ |
| Menu | Amazon Manager | NetAnaliza Manager ✅ |
| Client Visibility | ❌ | ✅ Everywhere |
| Speed | Slower | Faster ✅ |

---

## 🎯 Use Cases

### Scenario 1: Managing 3 Clients

```
1. Add 3 clients via Menu → Client Management → Add New Client

2. Activate client 1 (✓ Active checkbox)

3. Export client 1 products

4. Switch to client 2:
   Menu → Client Management → Switch Active Client

5. Export client 2 products

6. etc.
```

### Scenario 2: Import Competitor Products

```
1. Menu → Import from Amazon → Search Products by Keyword

2. Enter phrase: "wireless mouse"

3. Marketplace: DE

4. Products will be imported to "ImportedProducts" sheet

5. You can copy data to your products
```

### Scenario 3: Test Connection

```
1. Menu → Tools → 🔌 Test API Connection

2. Verify everything works:
   - Configuration: ✅
   - Token Refresh: ✅
   - API Call: ✅
```

---

## 📞 Support

If you have questions or problems:

1. Check **Logs** sheet - all operations are logged
2. Check **ErrorLog** sheet - errors are listed
3. Use test function:
   ```
   Menu → Tools → Test API Connection
   ```

---

## ✅ Summary

NetAnaliza Amazon Content Manager 3.0 is:

- ✅ **Direct connection** to Amazon SP-API
- ✅ **Multi-client** - manage multiple accounts
- ✅ **Transparent** - always know which account data comes from
- ✅ **Fast** - no intermediary
- ✅ **Simple** - everything in one spreadsheet

**Ready to use!** 🚀

---

## 📄 License

© 2025 NetAnaliza. All rights reserved.

This tool is intended for use by NetAnaliza and its clients only.

**NEVER share this tool with third parties without NetAnaliza's consent.**
