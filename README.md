# LUKO Amazon Content Manager

**Profesjonalne narzędzie Google Apps Script do zarządzania treściami Amazon z wykorzystaniem Cloud Functions**

---

## 🔗 Ważne Linki

### 📊 Google Sheets & Apps Script
- **Google Sheets (Arkusz):** [TUTAJ WSTAW LINK DO ARKUSZA]
- **Apps Script Editor:** https://script.google.com/d/1zQ9FDfM2bwol3KRd6LuYuylY6jzHh2bhSvviFPg6Lq2sxv0dB9lOF-jx/edit
- **Script ID:** `1zQ9FDfM2bwol3KRd6LuYuylY6jzHh2bhSvviFPg6Lq2sxv0dB9lOF-jx`

### 🐙 GitHub Repository
- **Main Repository:** https://github.com/LUKOAI/LUKOAmazonContentManager
- **Current Branch:** `claude/fix-email-activation-tool-016ArEdf3SRnLDhifd4CFPG9`
- **Branch URL:** https://github.com/LUKOAI/LUKOAmazonContentManager/tree/claude/fix-email-activation-tool-016ArEdf3SRnLDhifd4CFPG9

---

## 🎯 O Projekcie

LUKO Amazon Content Manager to zaawansowane narzędzie do zarządzania produktami Amazon, wykorzystujące:
- **Google Apps Script** jako frontend/interface
- **Cloud Functions** jako backend do ciężkich operacji
- **Amazon SP-API** do komunikacji z Amazon

### Architektura:
```
Google Sheets ←→ Apps Script ←→ Cloud Functions ←→ Amazon SP-API
```

---

## 🆕 Co się Stało? (2025-12-09)

### Fork do NetAnaliza

Projekt został **sforkowany** do nowego repozytorium dla celów komercyjnych:

**NetAnaliza Amazon Content Manager**
- 🔗 Repo: https://github.com/LUKOAI/NetAnalizaAmazonContentManager
- 🎯 Cel: Usługi optymalizacji listingów dla klientów zewnętrznych
- 🔧 Różnica: **BEZ Cloud Functions** - tylko bezpośrednie połączenie SP-API
- 👤 Target: NetAnaliza - obsługa wielu sprzedawców

### Różnice między projektami:

| Funkcja | LUKO (ten projekt) | NetAnaliza |
|---------|-------------------|------------|
| **Architektura** | Apps Script + Cloud Functions | Apps Script + Direct SP-API |
| **Target** | Wewnętrzne użycie LUKO | Usługi dla klientów |
| **Seller Management** | Jeden seller | Multi-seller (zmiana per operacja) |
| **Marketplace Switch** | Statyczna konfiguracja | Dynamiczna zmiana |
| **Infrastruktura** | Wymaga Cloud Function setup | Standalone - tylko credentials |
| **Complexity** | Wyższa (2 komponenty) | Niższa (1 komponent) |

---

## 🚀 Funkcje

### Import
- ✅ Import produktów po ASIN (batch)
- ✅ Wyszukiwanie produktów po keyword
- ✅ Import cen (Pricing API)
- ✅ Import stanów magazynowych (Inventory API)
- ✅ Import A+ Content
- ✅ Import wymiarów produktów
- ✅ Test połączenia API

### Eksport
- ✅ Eksport produktów (Partial/Full Update)
- ✅ Eksport A+ Content (Basic & Premium)
- ✅ Field Selector (wybór konkretnych pól do eksportu)
- ✅ Bulk operations
- ✅ Eksport obrazów
- ✅ Eksport cen i promocji

### Zarządzanie
- ✅ Tworzenie kuponów
- ✅ Zarządzanie promocjami
- ✅ Brand Content Management
- ✅ GPSR Compliance
- ✅ Dokumenty produktowe
- ✅ Tłumaczenia (via Cloud Function)

---

## 📦 Instalacja

### Wymagania:
1. Google Account
2. Amazon SP-API Credentials (Client ID, Secret, Refresh Token)
3. **Google Cloud Function** (backend)
4. Marketplace configuration

### Kroki:

1. **Sklonuj repo:**
```bash
git clone https://github.com/LUKOAI/LUKOAmazonContentManager.git
cd LUKOAmazonContentManager
```

2. **Deploy Cloud Function:**
   - Zobacz szczegóły w `DEPLOY_INSTRUCTIONS.md`
   - Skonfiguruj Cloud Function URL w Config sheet

3. **Deploy Apps Script:**
```bash
cd apps-script
clasp login
clasp push
```

4. **Konfiguracja w Google Sheets:**
   - Otwórz arkusz
   - Skonfiguruj zakładkę **Config**:
     - SP-API Credentials
     - Cloud Function URL
     - Marketplace settings

5. **Generuj arkusze:**
   - Menu → Tools → Generate Full Spreadsheet

---

## 🔧 Konfiguracja

### Arkusz Config

| Parametr | Wartość | Opis |
|----------|---------|------|
| `LWA Client ID` | `amzn1.application-oa2-client...` | SP-API Client ID |
| `LWA Client Secret` | `amzn1.oa2-cs.v1...` | SP-API Client Secret |
| `Refresh Token` | `Atzr\|...` | OAuth Refresh Token |
| `Marketplace` | `DE`, `FR`, `UK`, etc. | Domyślny marketplace |
| `Cloud Function URL` | `https://region-project.cloudfunctions.net/function` | Backend URL |

---

## 📚 Dokumentacja

- **Pełna dokumentacja funkcji:** [NOWE_FUNKCJE.md](NOWE_FUNKCJE.md)
- **Instrukcje wdrożenia:** [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)

---

## 🔄 Workflow

### Typowy przepływ pracy:

1. **Import produktów:**
   - Menu → Import → Import by ASIN(s)
   - Wprowadź ASINy oddzielone przecinkami
   - Produkty importowane do arkusza "ImportedProducts"

2. **Edycja w arkuszu:**
   - Edytuj Title, Bullets, Description, Images
   - Zaznacz checkboxy produktów do eksportu

3. **Eksport do Amazon:**
   - Menu → Export → Export Products (Advanced)
   - Wybierz: Partial/Full Update
   - Wybierz pola do eksportu (opcjonalnie)
   - Eksport przez Cloud Function → SP-API

4. **Weryfikacja:**
   - Sprawdź kolumnę Status
   - Logi w arkuszu Logs

---

## 🛠️ Rozwój

### Zasady pracy z branczami:

- **Main branch:** Stabilna wersja produkcyjna
- **Feature branches:** `claude/*` - automatyczne branches dla AI development
- **Naming:** Branch names muszą zaczynać się od `claude/` i kończyć session ID dla auto-push

### Git Operations:

```bash
# Checkout feature branch
git checkout claude/fix-email-activation-tool-016ArEdf3SRnLDhifd4CFPG9

# Pull latest changes
git pull origin claude/fix-email-activation-tool-016ArEdf3SRnLDhifd4CFPG9

# Push changes (auto-retry on network errors)
git push -u origin claude/fix-email-activation-tool-016ArEdf3SRnLDhifd4CFPG9
```

### Struktura projektu:

```
LUKOAmazonContentManager/
├── README.md (ten plik)
├── NOWE_FUNKCJE.md (dokumentacja funkcji)
├── DEPLOY_INSTRUCTIONS.md (instrukcje wdrożenia)
└── apps-script/
    ├── LukoAmazonManager.gs (główny plik - menu, eksport)
    ├── ProductImporter.gs (import przez SP-API)
    ├── ExportOptions.gs (advanced export)
    ├── SPApiAuth.gs (autentykacja OAuth)
    ├── SpreadsheetGenerator.gs (generowanie arkuszy)
    ├── ProductValidator.gs (walidacja danych)
    ├── BrandContentManager.gs (Brand Store content)
    ├── CustomizationManager.gs (customization opcje)
    ├── DocumentsManager.gs (dokumenty produktowe)
    ├── GpsrManager.gs (GPSR compliance)
    ├── MediaManager.gs (zarządzanie mediami)
    ├── ReverseFeedImporter.gs (import z feedów)
    ├── SetupInstaller.gs (instalator)
    ├── SheetGeneratorExtension.gs (rozszerzenia generatora)
    ├── TemplateHighlighter.gs (highlighter dla templates)
    └── appsscript.json (konfiguracja projektu)
```

---

## 🆚 LUKO vs NetAnaliza

### Kiedy używać LUKO?
✅ Wewnętrzne projekty LUKO
✅ Masz gotową infrastrukturę Cloud Functions
✅ Potrzebujesz zaawansowanych operacji (tłumaczenia, bulk processing)
✅ Jeden seller, stała konfiguracja

### Kiedy używać NetAnaliza?
✅ Usługi dla klientów zewnętrznych
✅ Nie chcesz setupować Cloud Functions
✅ Potrzebujesz często zmieniać seller/marketplace
✅ Prostsza architektura (standalone)
✅ Szybsze onboarding nowych klientów

---

## 📞 Wsparcie

- **Issues:** https://github.com/LUKOAI/LUKOAmazonContentManager/issues
- **Fork (NetAnaliza):** https://github.com/LUKOAI/NetAnalizaAmazonContentManager

---

## 📝 Changelog

### 2025-12-09 - Fork & Fixes
- ✅ Sforkowano do NetAnalizaAmazonContentManager
- ✅ Naprawiono `lukoPublishAPlus()` null pointer error
- ✅ Rozszerzono `callSPAPI()` o POST/PUT body support
- ✅ Zaktualizowano dokumentację

### Historia:
- Import/Export functionality
- A+ Content support
- Pricing & Inventory APIs
- Advanced Export Options
- Field Selector
- Multi-marketplace support

---

**Wersja:** 1.0.0 (Cloud Function Architecture)
**Fork:** NetAnaliza Amazon Content Manager (Direct SP-API)
**Ostatnia aktualizacja:** 2025-12-09
