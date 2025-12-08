# 🚀 LUKO Amazon Content Manager - Complete Deployment Guide

**Version:** 2.0.0
**Last Updated:** 2025-01-19
**Author:** Claude AI Assistant
**Support:** support@netanaliza.com

---

## 📦 PAKIET KOMPLETNY - CO DOSTAJESZ

### **Apps Script Files (Google Apps Script):**

```
apps-script/
├── LukoAmazonManager.gs          (1,833 lines) - GŁÓWNY MANAGER
├── SpreadsheetGenerator.gs       (1,200 lines) - GENERATOR ARKUSZY
├── ProductValidator.gs           (750 lines)  - WALIDACJA PRE-EXPORT
├── TemplateHighlighter.gs        (400 lines)  - CONDITIONAL HIGHLIGHTING
└── ReverseFeedImporter.gs        (450 lines)  - IMPORT Z CSV
```

### **Cloud Function Files (Google Cloud Function / Node.js):**

```
cloud-function/
├── index.js                      (828 lines)  - MAIN HANDLER + SP-API
└── package.json                              - DEPENDENCIES
```

### **Configuration Files:**

```
config/
├── validation-rules.json         (1,140 lines) - ZASADY WALIDACJI
├── product-templates.json        (450 lines)   - 10 SZABLONÓW
├── amazon-fields-mapping.json    (950 lines)   - MAPOWANIE PÓL LISTINGS
├── aplus-content-mapping.json    (650 lines)   - MAPOWANIE A+ CONTENT
├── reverse-feed-mapping.json     (150 lines)   - MAPOWANIE REVERSE FEED
├── marketplaces.json             (450 lines)   - KONFIGURACJA 10 MARKETPLACES
└── luko.config.json              (50 lines)    - GŁÓWNA KONFIGURACJA
```

### **Documentation:**

```
├── README.md                     - GŁÓWNA DOKUMENTACJA
├── DEPLOYMENT.md                 - TEN PLIK (deployment guide)
└── SPREADSHEET_STRUCTURE.md      - STRUKTURA ARKUSZY
```

---

## 🎯 KROKI DEPLOYMENT (KROK PO KROKU)

### **KROK 1: Deployment Cloud Function** ☁️

#### 1.1 Stwórz Google Cloud Project

```bash
# Zaloguj się do Google Cloud Console
https://console.cloud.google.com/

# Stwórz nowy projekt lub wybierz istniejący
# Nazwa projektu: luko-amazon-content-manager
```

#### 1.2 Włącz wymagane API

```
W Google Cloud Console:
1. Navigation Menu → APIs & Services → Library
2. Włącz następujące API:
   ✅ Cloud Functions API
   ✅ Cloud Build API
   ✅ Cloud Run API (automatycznie włączone z Functions)
```

#### 1.3 Deploy Cloud Function

```bash
# Opcja A: Deploy przez Google Cloud Console (POLECANE)
1. Idź do: Cloud Functions → CREATE FUNCTION
2. Environment: 2nd gen
3. Function name: lukoSpApiHandler
4. Region: europe-west3 (Frankfurt) lub europe-west1 (Belgium)
5. Trigger: HTTPS (Allow unauthenticated invocations - zaznacz)
6. Runtime: Node.js 20
7. Entry point: lukoSpApiHandler
8. Source code: Inline editor
9. Skopiuj zawartość plików:
   - index.js → index.js (w edytorze)
   - package.json → package.json (w edytorze)
10. Deploy (to zajmie ~3-5 minut)
11. Skopiuj trigger URL (wyglada jak: https://europe-west3-project-id.cloudfunctions.net/lukoSpApiHandler)
```

```bash
# Opcja B: Deploy przez gcloud CLI (dla zaawansowanych)
cd cloud-function/

gcloud functions deploy lukoSpApiHandler \
  --gen2 \
  --runtime=nodejs20 \
  --region=europe-west3 \
  --source=. \
  --entry-point=lukoSpApiHandler \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=540s \
  --memory=512MB

# Skopiuj URL z output
```

#### 1.4 Zapisz Cloud Function URL

```
Skopiuj URL Cloud Function, potrzebujesz go w KROK 2!

Przykład:
https://europe-west3-luko-acm.cloudfunctions.net/lukoSpApiHandler
```

---

### **KROK 2: Setup Google Spreadsheet** 📊

#### 2.1 Stwórz nowy Google Sheets

```
1. Idź do: https://sheets.google.com
2. Blank spreadsheet
3. Nazwa: "LUKO Amazon Content Manager" (lub dowolna)
```

#### 2.2 Otwórz Apps Script Editor

```
W arkuszu Google Sheets:
1. Extensions → Apps Script
2. Zostaniesz przekierowany do Apps Script IDE
```

#### 2.3 Dodaj wszystkie Apps Script pliki

**WAŻNE: Skopiuj DOKŁADNIE te nazwy plików!**

```javascript
// Usuń domyślny Code.gs, dodaj te 5 plików:

1. LukoAmazonManager.gs
   - Extensions → Apps Script → + (Add file) → Script
   - Nazwa: LukoAmazonManager
   - Skopiuj CAŁĄ zawartość z apps-script/LukoAmazonManager.gs

2. SpreadsheetGenerator.gs
   - + → Script
   - Nazwa: SpreadsheetGenerator
   - Skopiuj CAŁĄ zawartość z apps-script/SpreadsheetGenerator.gs

3. ProductValidator.gs
   - + → Script
   - Nazwa: ProductValidator
   - Skopiuj CAŁĄ zawartość z apps-script/ProductValidator.gs

4. TemplateHighlighter.gs
   - + → Script
   - Nazwa: TemplateHighlighter
   - Skopiuj CAŁĄ zawartość z apps-script/TemplateHighlighter.gs

5. ReverseFeedImporter.gs
   - + → Script
   - Nazwa: ReverseFeedImporter
   - Skopiuj CAŁĄ zawartość z apps-script/ReverseFeedImporter.gs
```

#### 2.4 SAVE & DEPLOY

```
1. Click: 💾 Save project (Ctrl+S)
2. Click: Deploy → New deployment
3. Type: Web app
4. Execute as: Me (your email)
5. Who has access: Anyone
6. Deploy
7. Authorize access (allow permissions)
```

#### 2.5 REFRESH arkusz

```
1. Wróć do Google Sheets
2. Odśwież stronę (F5 lub Ctrl+R)
3. Zobaczysz nowe menu: "Amazon Manager"
```

---

### **KROK 3: Generate Full Spreadsheet** 🎨

#### 3.1 Uruchom Generator

```
W Google Sheets:
1. Menu: Tools → Generate Spreadsheet
   (lub: Amazon Manager → Tools → 🎨 Generate Spreadsheet)

2. Kliknij: YES (to create all sheets)

3. Poczekaj ~1-2 minuty

4. ✅ SUCCESS! Zobaczysz wszystkie arkusze:
```

#### 3.2 Utworzone arkusze (12 total):

```
✅ ProductsMain        - Główny arkusz produktów (180+ kolumn!)
✅ Templates           - 10 szablonów produktów
✅ APlusBasic          - A+ Content Basic (9 modułów)
✅ APlusPremium        - A+ Content Premium (7 modułów)
✅ Images              - Zarządzanie zdjęciami
✅ Variations          - Warianty produktów (parent-child)
✅ Coupons             - Tworzenie kuponów/promocji
✅ PromoCodes          - Wygenerowane kody promocyjne
✅ Logs                - Logi wszystkich operacji
✅ ErrorLog            - Błędy walidacji i eksportu
✅ Settings            - Konfiguracja (API credentials)
✅ Help                - Pomoc i instrukcje
```

---

### **KROK 4: Configure Amazon API Credentials** 🔑

#### 4.1 Uzyskaj Amazon SP-API Credentials

```
1. Idź do: https://sellercentral.amazon.de
   (lub .fr, .it, .es - w zależności od Twojego głównego marketplace)

2. Settings → User Permissions → Manage

3. Develop Apps → Add new app client
   - App name: LUKO Amazon Content Manager
   - OAuth Login URI: https://example.com/callback (placeholder)
   - OAuth Redirect URIs: https://example.com/callback

4. Zapisz:
   ✅ LWA Client ID (np. amzn1.application-oa2-client.abc123...)
   ✅ LWA Client Secret (np. amzn1.oa2-cs.v1.def456...)

5. Generate Refresh Token:
   - Wejdź w: Self Authorize
   - Authorize (zgadzasz się)
   - Skopiuj Refresh Token (np. Atzr|IwE...)
```

#### 4.2 Wprowadź credentials w Settings sheet

```
W arkuszu LUKO-ACM:
1. Kliknij zakładkę: Settings

2. Wypełnij:
   Row 2: Cloud Function URL
   → https://europe-west3-your-project.cloudfunctions.net/lukoSpApiHandler

   Row 3: LWA Client ID
   → amzn1.application-oa2-client.abc123...

   Row 4: LWA Client Secret
   → amzn1.oa2-cs.v1.def456...

   Row 5: Refresh Token
   → Atzr|IwE...

   Row 6: Seller ID / Merchant ID
   → Twoje Seller ID (znajdziesz w Seller Central → Settings)

3. SAVE (credentials są bezpieczne w Twoim prywatnym arkuszu)
```

---

### **KROK 5: Test Complete Workflow** ✅

#### 5.1 Import Test Product

```
1. Zakładka: ProductsMain

2. Row 4 (pierwszy wiersz danych):
   ☑️ Export: TRUE (zaznacz)
   Template: T01
   SKU: TEST-SKU-001
   Product Type: PRODUCT
   productTitle_DE: Testprodukt für LUKO-ACM
   productTitle_EN: Test Product for LUKO-ACM
   brand_DE: TestBrand
   brand_EN: TestBrand
   bulletPoint1_DE: Erster Bullet Point
   bulletPoint1_EN: First bullet point
   mainImageURL: https://example.com/image.jpg

3. Menu: Templates → Apply Template Highlighting
   → Tylko potrzebne pola podświetlone!

4. Menu: Validation → ✅ Validate Selected Products
   → Sprawdza czy wszystko OK

5. Menu: Export to Amazon → 📤 Export Products (ProductsMain)
   → Eksportuje do Amazon
   → Status zmienia się: PENDING → DONE (lub FAILED)
```

#### 5.2 Check Results

```
1. Zakładka: Logs
   → Zobacz szczegóły operacji

2. Zakładka: ErrorLog (jeśli były błędy)
   → Zobacz błędy + rekomendacje fix

3. Status w ProductsMain:
   ✅ DONE = sukces!
   ✅ ProductLink = auto-generated link do produktu
   ✅ ExportDateTime = data eksportu (EU format)
```

---

## 📋 NAZWY WSZYSTKICH SKRYPTÓW (REFERENCE)

### **Apps Script Project Name:**
```
LUKO Amazon Content Manager
```

### **Apps Script Files (w kolejności dodawania):**

```javascript
1. LukoAmazonManager.gs
   - Purpose: Main manager with menu, export/import functions
   - Lines: 1,833
   - Key functions:
     * onOpen() - creates menu
     * lukoExportProducts() - export to Amazon
     * lukoSyncSelectedProducts() - sync products
     * lukoImportReverseFeed() - import CSV
     * updateRowStatus() - update export status

2. SpreadsheetGenerator.gs
   - Purpose: One-click spreadsheet generator
   - Lines: 1,200
   - Key functions:
     * lukoGenerateFullSpreadsheet() - main generator
     * generateProductsMainSheet() - creates ProductsMain (180+ cols)
     * generateTemplatesSheet() - creates Templates
     * generateCouponsSheet() - creates Coupons
     * generatePromoCodesSheet() - creates PromoCodes
     * generateErrorLogSheet() - creates ErrorLog

3. ProductValidator.gs
   - Purpose: Pre-export validation system
   - Lines: 750
   - Key functions:
     * lukoValidateSelectedProducts() - validate before export
     * validateProductRow() - validate single product
     * validateTitles() - check titles (200 chars, prohibited words)
     * validateGPSR() - check GPSR compliance (MANDATORY EU)
     * highlightRowErrors() - color code errors (red/yellow)
     * logValidationErrors() - log to ErrorLog sheet

4. TemplateHighlighter.gs
   - Purpose: Conditional cell highlighting based on template
   - Lines: 400
   - Key functions:
     * lukoApplyTemplateHighlighting() - highlight required fields
     * lukoClearTemplateHighlighting() - clear highlighting
     * lukoShowTemplateSelector() - template picker dialog
     * applyTemplateToRow() - apply to single row
     * TEMPLATE_DEFINITIONS - 10 embedded templates

5. ReverseFeedImporter.gs
   - Purpose: Import from Amazon reverse feed CSV
   - Lines: 450
   - Key functions:
     * lukoImportReverseFeed() - main import
     * parseReverseFeedCSV() - parse 502-column CSV
     * buildColumnMap() - map Amazon cols to our cols
     * showReverseFeedHelp() - help dialog
```

### **Cloud Function Name:**

```
lukoSpApiHandler
```

### **Cloud Function Files:**

```javascript
index.js
- Purpose: Amazon SP-API integration + dynamic schema fetching
- Lines: 828
- Key functions:
  * lukoSpApiHandler() - main HTTP handler
  * getAccessToken() - LWA OAuth token
  * updateListing() - update product via SP-API
  * getProductTypeSchema() - DYNAMIC schema fetch (NEW!)
  * parseProductTypeSchema() - parse Amazon JSON schema
  * uploadImages() - upload images
  * publishAPlusContent() - publish A+
  * createCoupon() - create coupons

package.json
- Dependencies: axios, crypto
```

---

## 🔧 TROUBLESHOOTING

### **Problem: "Cloud Function URL not set"**

```
Solution:
1. Sprawdź Settings sheet → Row 2 (Cloud Function URL)
2. Upewnij się że URL jest poprawny
3. Format: https://region-project.cloudfunctions.net/lukoSpApiHandler
```

### **Problem: "Authorization failed"**

```
Solution:
1. Sprawdź Settings sheet → Row 3-5 (credentials)
2. Upewnij się że LWA Client ID, Secret, Refresh Token są poprawne
3. Refresh Token wygasa? Wygeneruj nowy w Seller Central
```

### **Problem: "Template highlighting nie działa"**

```
Solution:
1. Sprawdź czy wpisałeś poprawny Template ID (T01, T02, ..., T10)
2. Zaznacz checkboxy ☑️ Export
3. Menu → Templates → Apply Template Highlighting
4. Jeśli dalej nie działa: refresh strony (F5)
```

### **Problem: "Validation errors"**

```
Solution:
1. Sprawdź ErrorLog sheet - zobacz dokładne błędy
2. Czerwone komórki = blocking errors (MUSISZ naprawić)
3. Żółte komórki = warnings (możesz zignorować z ValidationOverride)
4. Popraw błędy według rekomendacji w ErrorLog
```

### **Problem: "GPSR errors (13012)"**

```
Solution:
⚠️ GPSR jest OBOWIĄZKOWE dla EU od 13.12.2024!

Wypełnij te pola:
- manufacturer_name
- manufacturer_address
- manufacturer_email
- responsiblePerson_name
- responsiblePerson_address
- responsiblePerson_email
- safetyInformation_URL (link do PDF)
```

---

## 📊 COMPLETE FEATURE LIST

### **✅ Co jest GOTOWE (100% działające):**

```
✅ Complete spreadsheet generator (12 sheets, 180+ columns)
✅ 10 product templates with conditional highlighting
✅ Multi-language support (8 languages: DE, EN, FR, IT, ES, NL, PL, SE)
✅ Pre-export validation (titles, bullets, keywords, images, GPSR)
✅ Prohibited words detection (8 languages)
✅ Error highlighting (red=error, yellow=warning)
✅ Error logging with Amazon error codes + recommendations
✅ Export to Amazon with status tracking (PENDING/DONE/FAILED)
✅ Auto-generated ProductLink (https://amazon.de/dp/ASIN)
✅ ExportDateTime with EU format (dd.MM.yyyy HH:mm:ss)
✅ Reverse feed CSV import (502 columns)
✅ GPSR compliance validation (MANDATORY EU)
✅ Image/PDF URL validation
✅ ValidationOverride support
✅ Coupons & PromoCodes sheets
✅ Dynamic Product Type schema fetching (Amazon SP-API)
✅ Fallback validation rules (if API fails)
✅ Template selector dialog (HTML)
✅ Menu integration (7 submenus)
✅ Logging system (all operations)
```

### **⏳ Co można dodać (future enhancements):**

```
⏳ AI content generation (Amazon Bedrock)
⏳ BSR tracking API
⏳ PDF export (single product, rotated layout)
⏳ Licensing system (key generation)
⏳ Split scripts architecture (library pattern)
⏳ Multi-language interface switcher (PL/DE/EN in UI)
⏳ Auto-apply template on template ID change (onChange trigger)
⏳ Cache schemas in Settings sheet (daily update)
⏳ Coupon creation API integration (currently UI only)
⏳ Promo codes generation and import
```

---

## 📞 SUPPORT

**Email:** support@netanaliza.com
**Documentation:** This file + README.md + SPREADSHEET_STRUCTURE.md
**Version:** 2.0.0
**Last Updated:** 2025-01-19

---

## 🎉 GOTOWE!

Masz teraz **kompletny, działający system** do zarządzania treściami Amazon!

**Workflow:**
1. Generate Spreadsheet (Tools → Generate)
2. Choose Template (T01-T10)
3. Fill highlighted fields (only what's needed!)
4. Validate (Validation → Validate)
5. Export (Export → Export Products)
6. ✅ DONE!

**Powodzenia! 🚀**
