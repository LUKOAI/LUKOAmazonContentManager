# Plan Testów - A+ Content Manager z Placeholder Images

## 📋 Przygotowanie

### ✅ Co już masz zrobione:
- [x] Placeholder images wgrane do Amazon Asset Library
- [x] A+ Content utworzony w Amazon (widoczny na screenshocie - 80% Merinowolle)
- [x] Google Apps Script zaktualizowany (po wykonaniu DEPLOY_STEPS.md)

### 📍 Linki do Zasobów:
- **Spreadsheet**: https://docs.google.com/spreadsheets/d/1J-XapY2vq1Ka4QcBNeGzZyGZxzKESqD2qKmKQpa_jo8/edit
- **Apps Script**: https://script.google.com/u/0/home/projects/1PvvWRgkSWmzynSqUNv9jjWHj2sdXjCzKhvDmaCR5PxzBU1r7KCLASIlQ/edit
- **Amazon Seller Central**: https://sellercentral.amazon.de/enhanced-content/content-manager

---

## 🧪 Test 1: Weryfikacja Menu i Podstawowa Konfiguracja

### Cel:
Sprawdzić czy wszystkie funkcje A+ Content są dostępne w menu.

### Kroki:
1. Otwórz spreadsheet: https://docs.google.com/spreadsheets/d/1J-XapY2vq1Ka4QcBNeGzZyGZxzKESqD2qKmKQpa_jo8/edit
2. Odśwież stronę (F5)
3. Sprawdź czy widzisz menu **"NetAnaliza Manager"**
4. Kliknij menu i sprawdź sekcję **"A+ Content"**

### Oczekiwany Rezultat:
Menu powinno zawierać:
```
NetAnaliza Manager
├── Client Management
│   ├── View Active Client
│   ├── Switch Active Client
│   └── Manage Clients
├── A+ Content
│   ├── 📤 Publish A+ Content
│   ├── 🔄 Sync A+ Content from Amazon
│   ├── 📊 Check A+ Content Status
│   └── 🖼️ Create Image Library Sheet
├── Import from Amazon
├── Export to Amazon
└── Tools
```

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```


```

---

## 🧪 Test 2: Sprawdzenie Client Settings

### Cel:
Upewnić się że masz aktywnego klienta z poprawnymi credentials.

### Kroki:
1. Menu → **Client Management** → **View Active Client**
2. Sprawdź dialog z informacjami o aktywnym kliencie
3. Jeśli nie ma aktywnego klienta, przejdź do arkusza **"Client Settings"**
4. Sprawdź czy są wypełnione:
   - ✓ Active (checkbox zaznaczony)
   - Client Name
   - Seller ID
   - Marketplace (np. DE, FR, UK)
   - Marketplace ID (np. A1PA6795UKMFR9)
   - LWA Client ID
   - LWA Client Secret

### Oczekiwany Rezultat:
Dialog powinien pokazać:
```
Active Client:
Name: [Twoja nazwa klienta]
Seller ID: [Twój Seller ID]
Marketplace: DE
Status: ✅ Active
```

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```


```

---

## 🧪 Test 3: Sprawdzenie SP-API Auth

### Cel:
Zweryfikować czy refresh token jest aktywny i można uzyskać access token.

### Kroki:
1. Przejdź do arkusza **"SP-API Auth"**
2. Sprawdź czy widzisz kolumny:
   - Refresh Token
   - Access Token
   - Token Expires At
3. Jeśli Access Token jest pusty lub wygasły, odśwież token:
   - Menu → **Tools** → **Test API Connection**
4. Sprawdź czy token został odświeżony

### Oczekiwany Rezultat:
```
Refresh Token: Atzr|[...długi token...]
Access Token: Atza|[...długi token...]
Token Expires At: [Data przyszła, np. 2025-12-12 08:30:00]
```

Dialog "Test API Connection" powinien pokazać:
```
✅ API Connection Successful!

Configuration: ✅
Token Refresh: ✅
API Call: ✅

Seller ID: [Twój ID]
Marketplace: A1PA6795UKMFR9
Response Time: ~1500ms
```

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```


```

---

## 🧪 Test 4: Utworzenie Image Library Sheet

### Cel:
Utworzyć arkusz do śledzenia placeholder images które już wgrałeś.

### Kroki:
1. Menu → **A+ Content** → **🖼️ Create Image Library Sheet**
2. Poczekaj na potwierdzenie
3. Sprawdź czy pojawił się nowy arkusz **"APlusImageLibrary"**

### Oczekiwany Rezultat:
Nowy arkusz z kolumnami:
```
| Image Name | Width | Height | uploadDestinationId | URL | Alt Text | Notes | Last Used | Created At |
```

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```


```

---

## 🧪 Test 5: Dodanie Placeholder Images do Image Library

### Cel:
Dodać ręcznie uploadDestinationId dla wgranych już placeholder images.

### Kroki:
1. Przejdź do Amazon Seller Central → Content Assets / Asset Library
2. Znajdź swoje placeholder images (te które już wgrałeś)
3. Dla każdego obrazu:
   - Kliknij prawym i "Copy Link" lub otwórz inspektor przeglądarki
   - Znajdź `uploadDestinationId` w formacie:
     `aplus-media-library-service-media/[UUID].jpg`
     Np: `aplus-media-library-service-media/3444de6d-44c9-4a69-9567-9acaba9798ce.jpg`
4. W arkuszu **APlusImageLibrary** dodaj wiersze:

**Przykład dla STANDARD_SINGLE_IMAGE_HIGHLIGHTS (300x300):**
```
Image Name: aplus_placeholder_single_image_highlights_300x300
Width: 300
Height: 300
uploadDestinationId: aplus-media-library-service-media/[Twój-UUID].jpg
Alt Text: Placeholder for Single Image Highlights module
```

5. Powtórz dla wszystkich 18 rozmiarów placeholder images które wgrałeś

### Lista Placeholder Images do Dodania:
Według APLUS_PLACEHOLDER_IMAGES_SPEC.md:

#### Basic Modules:
1. `aplus_placeholder_single_image_300x300.jpg` (STANDARD_SINGLE_SIDE_IMAGE)
2. `aplus_placeholder_header_970x600.jpg` (STANDARD_HEADER_IMAGE_TEXT)
3. `aplus_placeholder_company_logo_600x180.jpg` (STANDARD_COMPANY_LOGO)
4. `aplus_placeholder_text_overlay_970x300.jpg` (STANDARD_IMAGE_TEXT_OVERLAY)
5. `aplus_placeholder_single_highlights_300x400.jpg` (STANDARD_SINGLE_IMAGE_HIGHLIGHTS)
6. `aplus_placeholder_multiple_image_300x300.jpg` (STANDARD_MULTIPLE_IMAGE_TEXT, 4x)
7. `aplus_placeholder_four_image_text_300x300.jpg` (STANDARD_FOUR_IMAGE_TEXT, 4x)
8. `aplus_placeholder_four_quadrant_135x135.jpg` (STANDARD_FOUR_IMAGE_TEXT_QUADRANT, 4x)
9. `aplus_placeholder_three_image_300x300.jpg` (STANDARD_THREE_IMAGE_TEXT, 3x)
10. `aplus_placeholder_comparison_150x300.jpg` (STANDARD_COMPARISON_TABLE, 6x)
11. `aplus_placeholder_specs_detail_300x400.jpg` (STANDARD_SINGLE_IMAGE_SPECS_DETAIL)
12. `aplus_placeholder_sidebar_300x300.jpg` (STANDARD_IMAGE_SIDEBAR)

#### Premium Modules:
13. `aplus_placeholder_premium_single_650x350.jpg` (PREMIUM_SINGLE_IMAGE_TEXT)
14. `aplus_placeholder_premium_bg_desktop_1940x600.jpg` (PREMIUM_BACKGROUND_IMAGE_TEXT)
15. `aplus_placeholder_premium_bg_mobile_600x450.jpg` (PREMIUM_BACKGROUND_IMAGE_TEXT)
16. `aplus_placeholder_premium_full_1940x600.jpg` (PREMIUM_FULL_IMAGE)
17. `aplus_placeholder_premium_dual_650x350.jpg` (PREMIUM_DUAL_IMAGE_TEXT, 2x)
18. `aplus_placeholder_premium_carousel_650x350.jpg` (PREMIUM_SIMPLE_IMAGE_CAROUSEL)

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki - Lista uploadDestinationId:**
```
1. single_image_300x300:
2. header_970x600:
3. company_logo_600x180:
...
(dodaj wszystkie które masz)
```

---

## 🧪 Test 6: Synchronizacja Istniejącego A+ Content

### Cel:
Zaimportować A+ Content który już istnieje w Amazon (ten z 80% Merinowolle).

### Kroki:
1. Przejdź do arkusza **APlusBasic** (jeśli nie istnieje, stwórz go przez Menu → Tools → Generate Spreadsheet)
2. Menu → **A+ Content** → **🔄 Sync A+ Content from Amazon**
3. Wprowadź ASIN produktu który ma A+ Content (ten z screenshota)
4. Poczekaj na import (~10-20 sekund)
5. Sprawdź arkusz **APlusBasic** - powinny pojawić się nowe wiersze z danymi

### Oczekiwany Rezultat:
W arkuszu **APlusBasic** pojawią się wiersze z:
- ASIN: [Twój ASIN]
- Module Number: 1, 2, 3... (ile modułów ma content)
- Module Type: STANDARD_TEXT, STANDARD_HEADER_IMAGE_TEXT, etc.
- Teksty w kolumnach *_DE (headline_DE, body_DE, etc.)
- Image IDs w kolumnach image*_id

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```
ASIN użyty do testu:
Liczba zaimportowanych modułów:
Jakie typy modułów:
```

---

## 🧪 Test 7: Sprawdzenie Statusu A+ Content

### Cel:
Sprawdzić status istniejącego A+ Content przez API.

### Kroki:
1. Menu → **A+ Content** → **📊 Check A+ Content Status**
2. Wprowadź ASIN produktu który ma A+ Content
3. Sprawdź dialog z wynikami

### Oczekiwany Rezultat:
Dialog powinien pokazać:
```
A+ Content Status for ASIN: [Twój ASIN]

Content Reference Key: [UUID lub nazwa]
Status: APPROVED / DRAFT / PENDING
Marketplace: A1PA6795UKMFR9
ASINs: [Lista ASINów]
Modules: 5
Last Modified: [Data]
```

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```
Status zwrócony:
Content Reference Key:
```

---

## 🧪 Test 8: Utworzenie Nowego A+ Content z Placeholder Images

### Cel:
Stworzyć nowy A+ Content używając placeholder images.

### Kroki:
1. Przejdź do arkusza **APlusBasic**
2. Dodaj nowy wiersz z testowym modułem:

**Przykład - STANDARD_SINGLE_IMAGE_HIGHLIGHTS:**
```
☑️ Export: [zaznacz checkbox]
ASIN: [ASIN testowego produktu bez A+ Content]
Module Number: 1
Module Type: STANDARD_SINGLE_IMAGE_HIGHLIGHTS

aplus_basic_m1_headline_DE: Testowy Nagłówek
aplus_basic_m1_body_DE: To jest testowy opis dla placeholder image
aplus_basic_m1_image1_id: [Skopiuj uploadDestinationId z APlusImageLibrary dla 300x400]
aplus_basic_m1_image1_alt: Test placeholder image
```

3. Menu → **A+ Content** → **📤 Publish A+ Content**
4. Poczekaj na rezultat (~30-60 sekund)

### Oczekiwany Rezultat:
Dialog powinien pokazać:
```
✅ A+ Content Published Successfully!

ASIN: [Twój ASIN]
Content Reference Key: [Wygenerowany klucz]
Modules Published: 1
Status: DRAFT (pending approval)

Check status in 5-10 minutes in Seller Central.
```

Status w kolumnie powinien zmienić się na:
```
Status: ✅ Published | [timestamp]
```

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```
Content Reference Key otrzymany:
Czy pojawił się w Seller Central?
Link do content w Seller Central:
```

---

## 🧪 Test 9: Weryfikacja w Amazon Seller Central

### Cel:
Sprawdzić czy A+ Content pojawił się w Amazon.

### Kroki:
1. Otwórz Amazon Seller Central
2. Przejdź do: **Content Manager** → **A+ Content Manager**
3. Znajdź content przez ASIN lub Content Reference Key
4. Sprawdź:
   - Czy content istnieje?
   - Czy ma status DRAFT?
   - Czy placeholder image jest widoczny?
   - Czy teksty są poprawne?

### Oczekiwany Rezultat:
- ✅ Content widoczny w liście
- ✅ Status: Draft / Pending Approval
- ✅ Placeholder image załadowany poprawnie
- ✅ Teksty wyświetlają się poprawnie (bez błędów encoding)

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```
Screenshot lub opis tego co widzisz:


```

---

## 🧪 Test 10: Test Kompleksowy - Wszystkie Typy Modułów

### Cel:
Przetestować różne typy modułów A+ z placeholder images.

### Kroki:
Dodaj w arkuszu **APlusBasic** kilka modułów dla tego samego ASIN:

**Moduł 1: STANDARD_TEXT**
```
Module Number: 1
Module Type: STANDARD_TEXT
aplus_basic_m1_headline_DE: Nagłówek Tekstowy
aplus_basic_m1_body_DE: To jest moduł tylko z tekstem, bez obrazów.
```

**Moduł 2: STANDARD_HEADER_IMAGE_TEXT**
```
Module Number: 2
Module Type: STANDARD_HEADER_IMAGE_TEXT
aplus_basic_m2_headline_DE: Nagłówek z Obrazem
aplus_basic_m2_body_DE: Moduł z dużym obrazem header 970x600
aplus_basic_m2_image1_id: [uploadDestinationId dla header_970x600]
aplus_basic_m2_image1_alt: Header placeholder
```

**Moduł 3: STANDARD_COMPANY_LOGO**
```
Module Number: 3
Module Type: STANDARD_COMPANY_LOGO
aplus_basic_m3_image1_id: [uploadDestinationId dla logo_600x180]
aplus_basic_m3_image1_alt: Company logo placeholder
```

**Moduł 4: STANDARD_FOUR_IMAGE_TEXT**
```
Module Number: 4
Module Type: STANDARD_FOUR_IMAGE_TEXT
aplus_basic_m4_headline_DE: Cztery Obrazy
aplus_basic_m4_block1_headline_DE: Blok 1
aplus_basic_m4_block1_body_DE: Opis bloku 1
aplus_basic_m4_block1_image_id: [uploadDestinationId dla 300x300]
aplus_basic_m4_block1_image_alt: Block 1 image
... (powtórz dla block2, block3, block4)
```

### Publikacja:
1. Zaznacz wszystkie 4 moduły (checkbox ☑️ Export)
2. Menu → **A+ Content** → **📤 Publish A+ Content**
3. Poczekaj na rezultat

### Oczekiwany Rezultat:
```
✅ A+ Content Published Successfully!

ASIN: [Twój ASIN]
Modules Published: 4
Status: DRAFT

All 4 modules grouped into single A+ Content document.
```

### Weryfikacja w Seller Central:
- ✅ Wszystkie 4 moduły widoczne w jednym dokumencie
- ✅ Obrazy placeholder załadowane poprawnie
- ✅ Teksty bez błędów
- ✅ Kolejność modułów prawidłowa (1, 2, 3, 4)

### ✅ Status: [ ] PASS / [ ] FAIL
**Notatki:**
```


```

---

## 🧪 Test 11: Test Google Forms Integration (Opcjonalny)

### Cel:
Przetestować automatyczny import z Google Forms.

### Kroki:
1. Stwórz Google Form z pytaniami dla A+ Content:
   - ASIN
   - Module Number
   - Module Type
   - Headline DE
   - Body DE
   - Image URL (opcjonalnie)

2. Połącz Form z Spreadsheet (Responses → Link to Sheets)

3. Wypełnij formularz testowymi danymi

4. Dane powinny automatycznie pojawić się w **APlusBasic** (dzięki FormImport.gs)

### Oczekiwany Rezultat:
- ✅ Dane z formularza importują się automatycznie
- ✅ Mapowanie kolumn działa poprawnie
- ✅ Timestamp i user info są dodawane

**UWAGA**: Ten test jest opcjonalny - możesz go pominąć jeśli nie planujesz używać Forms.

### ✅ Status: [ ] PASS / [ ] FAIL / [ ] SKIPPED
**Notatki:**
```


```

---

## 📊 Podsumowanie Testów

### Wyniki:
```
Test 1 - Menu i Konfiguracja:        [ ] PASS / [ ] FAIL
Test 2 - Client Settings:            [ ] PASS / [ ] FAIL
Test 3 - SP-API Auth:                [ ] PASS / [ ] FAIL
Test 4 - Image Library Sheet:        [ ] PASS / [ ] FAIL
Test 5 - Dodanie Placeholder Images: [ ] PASS / [ ] FAIL
Test 6 - Sync A+ Content:            [ ] PASS / [ ] FAIL
Test 7 - Check Status:               [ ] PASS / [ ] FAIL
Test 8 - Nowy A+ Content:            [ ] PASS / [ ] FAIL
Test 9 - Weryfikacja w Amazon:       [ ] PASS / [ ] FAIL
Test 10 - Test Kompleksowy:          [ ] PASS / [ ] FAIL
Test 11 - Google Forms (opcja):      [ ] PASS / [ ] FAIL / [ ] SKIPPED
```

### Ogólna Ocena:
- [ ] ✅ Wszystko działa - gotowe do produkcji
- [ ] ⚠️ Częściowo działa - wymaga poprawek
- [ ] ❌ Nie działa - wymaga debugowania

---

## 🐛 Troubleshooting

### Problem: "No active client found"
**Rozwiązanie:**
1. Przejdź do arkusza "Client Settings"
2. Zaznacz checkbox ✓ Active w wierszu z Twoim klientem
3. Spróbuj ponownie

### Problem: "Failed to refresh token"
**Rozwiązanie:**
1. Refresh token mógł wygasnąć
2. Wygeneruj nowy przez: https://sellercentral.amazon.de/apps/authorize/consent
3. Użyj Authorization Code do wygenerowania nowego Refresh Token
4. Zaktualizuj w arkuszu "SP-API Auth"

### Problem: "Image uploadDestinationId not found"
**Rozwiązanie:**
1. Sprawdź czy uploadDestinationId w APlusImageLibrary jest poprawny
2. Format musi być: `aplus-media-library-service-media/[UUID].jpg`
3. Sprawdź czy obraz istnieje w Amazon Asset Library

### Problem: "Module validation failed"
**Rozwiązanie:**
1. Sprawdź czy wszystkie wymagane pola dla danego Module Type są wypełnione
2. Zobacz docs/APLUS_MODULES_SPECIFICATION.md dla szczegółów
3. Dla modułów z obrazami, upewnij się że image_id jest wypełniony

### Problem: Content nie pojawia się w Seller Central
**Rozwiązanie:**
1. Poczekaj 5-10 minut - API może mieć opóźnienie
2. Sprawdź status przez: Menu → Check A+ Content Status
3. Sprawdź logi w arkuszu "Logs" lub "ErrorLog"
4. Sprawdź Apps Script Execution Log (View → Logs w Apps Script Editor)

---

## 📞 Następne Kroki Po Testach

1. **Jeśli wszystko działa:**
   - Możesz zacząć tworzyć prawdziwy A+ Content
   - Zastąp placeholder images prawdziwymi obrazami produktów
   - Wypełnij prawdziwe teksty marketingowe

2. **Jeśli są problemy:**
   - Zapisz notatki z testów w tym dokumencie
   - Sprawdź logi w Apps Script Editor
   - Sprawdź arkusz "ErrorLog" w Spreadsheet
   - Zgłoś problemy z szczegółami (jaki test, jaki błąd, screenshot)

3. **Dokumentacja:**
   - README.md - Ogólny przegląd
   - APLUS_CONTENT_GUIDE.md - Szczegółowy przewodnik po A+ Content
   - APLUS_IMAGE_WORKFLOW.md - Workflow dla obrazów
   - APLUS_MODULES_SPECIFICATION.md - Specyfikacja wszystkich modułów

---

## ✅ Checklist Gotowości do Produkcji

- [ ] Wszystkie testy przeszły pomyślnie
- [ ] Placeholder images są w Image Library
- [ ] Prawdziwe obrazy produktów przygotowane
- [ ] Teksty marketingowe napisane (DE, EN, etc.)
- [ ] SP-API credentials są aktualne
- [ ] Rozumiesz jak publikować A+ Content
- [ ] Rozumiesz jak sprawdzać status
- [ ] Masz backup danych (export Spreadsheet)

**Gdy wszystko jest ✅ - jesteś gotowy do produkcji!** 🎉
