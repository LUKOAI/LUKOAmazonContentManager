# SP-API Integration - Styczeń 2026

## Podsumowanie projektu

**Data realizacji:** 27-28 stycznia 2026  
**Branch:** `claude/continue-sp-api-FyVbO`  
**Status:** Ukonczone (wymaga deploy do Apps Script)

---

## Cel projektu

Rozszerzenie mozliwosci pobierania danych o produktach Amazon poprzez SP-API (Selling Partner API) w dwoch nowych projektach:

1. **AmazonListingAutomation** - arkusz do zarzadzania listingami (RESEARCH tab)
2. **WAAS System** - WordPress Affiliate Automation System (Products tab)

Wczesniej SP-API dzialalo tylko w NetAnalizaAmazonContentManager.

---

## Co zostalo zrobione

### A. AmazonListingAutomation (RESEARCH tab)

**Pliki:** `apps-script/listing-automation/`
- `SPApiAuth-Listing.gs` - autentykacja SP-API
- `SPApiDataCollection.gs` (v2.1) - pobieranie i zapis danych
- `MenuIntegration-SPApi.gs` - dokumentacja menu

**Kluczowe funkcje:**

1. **Mapowanie SP-API -> PA-API kolumn**
   - SP-API dane trafiaja do ISTNIEJACYCH kolumn PA-API
   - Wypelnia WSZYSTKIE pasujace kolumny (np. `Price` i `price`)
   - ~45 pol mapowanych

2. **Import wariantow**
   - `menuSPApiFetchWithVariants()` - pobiera ASIN + wszystkie child ASINs
   - Glowny ASIN -> `ASIN_Type = "Glowny"`
   - Warianty -> `ASIN_Type = "Wariant"`, `Related_To_ASIN = [glowny ASIN]`

3. **Deduplikacja**
   - Klucz: `ASIN + Marketplace + Data_Source`
   - Unika duplikatow przy wielokrotnym imporcie

**Commity:**
- `9b0ac83` - SPApiDataCollection v2.0
- `5685cc0` - rename "Podobny" -> "Wariant"
- `5795ea9` - comprehensive PA-API column mapping (v2.1)

---

### B. WAAS System (Products tab)

**Pliki:** `apps-script/affiliate-command-center/`
- `SPApiAuth-WAAS.gs` - autentykacja (Script Properties)
- `SPApiDataCollection-WAAS.gs` (v2.0) - pobieranie i zapis danych
- `MenuIntegration-SPApi-WAAS.gs` - dokumentacja menu

**Kluczowe funkcje:**

1. **Auto-tworzenie kolumn**
   - `spEnsureProductColumns()` - automatycznie dodaje brakujace kolumny
   - Przy pierwszym imporcie tworzy: Description, UPC, GTIN, MPN, Material, ItemWeight, ItemHeight, ItemWidth, ItemLength + units, VariationCount, VariationTheme, ProductType, TitleLength, TitleWords

2. **Script Properties dla kluczy API**
   - Klucze: `SP_LWA_CLIENT_ID`, `SP_LWA_CLIENT_SECRET`, `SP_REFRESH_TOKEN`, `SP_SELLER_ID`
   - Zapisywane obok istniejacych: `PA_ACCESS_KEY`, `DIVI_API_KEY`
   - NIE w Config sheet

3. **Mapowanie do Products sheet**
   - ~50 pol mapowanych
   - Wypelnia WSZYSTKIE pasujace kolumny

4. **Warianty**
   - `IsVariant = TRUE/FALSE`
   - `HasParent = TRUE/FALSE`
   - `ParentAsin = [rzeczywisty parent z Amazon API]`

**Commity:**
- `0a56d05` - initial WAAS integration
- `86c158d` - v2.0 (Script Properties, auto-create columns)
- `f123476` - fix ParentAsin bug

---

## Co NIE zostalo zrobione / wymaga uwagi

### 1. Deploy do Apps Script (wymaga recznego skopiowania)

**AmazonListingAutomation:**
- Projekt ID: `1HTCuNlB2Xs502oF1875QfitXHRLGLLSTVMoj9Pucyau3vAxxh-Q3riZ8`
- Pliki do dodania: `SPApiAuth-Listing.gs`, `SPApiDataCollection.gs`
- Menu: dodac SP-API submenu do istniejacego menu

**WAAS System:**
- Projekt ID: `1NYsatXvFelKcwZhG5D4RUzAvqW5oeKcdXoJL3A6Yd_Ogy4Jf88BRX5J-`
- Pliki do dodania: `SPApiAuth-WAAS.gs`, `SPApiDataCollection-WAAS.gs`
- Menu: dodac SP-API Import submenu pod Products
- **WAZNE:** Zaktualizowac do najnowszej wersji z poprawionym ParentAsin!

### 2. Brak automatycznej synchronizacji GitHub -> Apps Script

Pliki w GitHub sa tylko kopią. Kazda zmiana wymaga recznego skopiowania do Apps Script.

### 3. Potencjalne usprawnienia (na przyszlosc)

- [ ] Batch import (wiele ASIN-ow jednoczesnie przez API, nie po kolei)
- [ ] Rate limiting handling (429 errors)
- [ ] Scheduled auto-refresh danych
- [ ] Integration z PA-API (porownanie danych SP-API vs PA-API)

---

## Struktura plikow

```
apps-script/
├── listing-automation/           # AmazonListingAutomation
│   ├── SPApiAuth-Listing.gs     # Auth, token, marketplace config
│   ├── SPApiDataCollection.gs   # v2.1 - data fetching, PA-API mapping
│   └── MenuIntegration-SPApi.gs # Menu documentation
│
└── affiliate-command-center/     # WAAS System
    ├── SPApiAuth-WAAS.gs        # Auth via Script Properties
    ├── SPApiDataCollection-WAAS.gs  # v2.0 - auto-create columns
    └── MenuIntegration-SPApi-WAAS.gs # Menu documentation
```

---

## Jak uzyc

### AmazonListingAutomation

1. Skopiuj pliki do Apps Script
2. Dodaj menu SP-API do onOpen()
3. Menu > SP-API > Setup Credentials (Config sheet)
4. Menu > SP-API > Test Connection
5. Menu > SP-API > Import by ASIN / Import ASIN + Warianty

### WAAS System

1. Skopiuj pliki do Apps Script
2. Dodaj SP-API Import submenu pod Products w Menu.gs:
```javascript
.addSubMenu(ui.createMenu('SP-API Import')
  .addItem('Import by ASIN', 'spMenuImportByASIN')
  .addItem('Import ASIN + Warianty', 'spMenuImportWithVariants')
  .addItem('Search by Keyword', 'spMenuSearchByKeyword')
  .addItem('Import from Selection', 'spMenuImportFromSelection')
  .addSeparator()
  .addItem('Setup Credentials', 'spSetupCredentials')
  .addItem('Test Connection', 'spTestConnection'))
```
3. Menu > WAAS > Products > SP-API Import > Setup Credentials
4. Menu > WAAS > Products > SP-API Import > Test Connection
5. Menu > WAAS > Products > SP-API Import > Import by ASIN

---

## Znane problemy i rozwiazania

### Problem: ParentAsin pokazuje zly ASIN

**Opis:** W wariantach ParentAsin pokazywal ASIN wyszukiwany zamiast rzeczywistego Parent ASIN z Amazon.

**Rozwiazanie:** Commit `f123476` - usunieto `parentAsinOverride`, teraz uzywa `data.parentAsin` z API.

**Status:** Naprawione w repo, wymaga deploy do WAAS Apps Script.

### Problem: Brakujace kolumny

**Opis:** SP-API zwraca dane dla pol ktorych nie ma w arkuszu.

**Rozwiazanie:** `spEnsureProductColumns()` automatycznie tworzy brakujace kolumny przed zapisem.

**Status:** Zaimplementowane i dzialajace.

---

## Linki

- **GitHub branch:** `claude/continue-sp-api-FyVbO`
- **AmazonListingAutomation Apps Script:** https://script.google.com/home/projects/1HTCuNlB2Xs502oF1875QfitXHRLGLLSTVMoj9Pucyau3vAxxh-Q3riZ8/edit
- **WAAS System Apps Script:** https://script.google.com/home/projects/1NYsatXvFelKcwZhG5D4RUzAvqW5oeKcdXoJL3A6Yd_Ogy4Jf88BRX5J-/edit
- **WAAS Spreadsheet:** https://docs.google.com/spreadsheets/d/1O5IcgueiXtQ0vtwQAKUs_JGbjmsZenwpfDhe1rCEHl8/

---

## Historia zmian

| Data | Commit | Opis |
|------|--------|------|
| 27.01.2026 10:55 | a3e4f0f | Fix duplicate check (ASIN+Marketplace) |
| 27.01.2026 11:03 | 54d9b74 | Add SP-API files for AmazonListingAutomation |
| 27.01.2026 12:47 | 9b0ac83 | SPApiDataCollection v2.0 |
| 27.01.2026 13:45 | 5685cc0 | Rename "Podobny" -> "Wariant" |
| 27.01.2026 17:28 | 5795ea9 | Comprehensive PA-API column mapping (v2.1) |
| 28.01.2026 06:31 | 0a56d05 | Initial WAAS integration |
| 28.01.2026 06:54 | 86c158d | WAAS SP-API v2.0 (Script Properties, auto-create) |
| 28.01.2026 08:21 | f123476 | Fix ParentAsin bug |

---

*Dokumentacja utworzona: 28.01.2026*
*Ostatnia aktualizacja: 28.01.2026*
