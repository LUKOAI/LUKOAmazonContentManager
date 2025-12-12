# Polecenia Wgrania Zmian - A+ Content Manager

## 📋 Krok 1: Pobierz wszystkie pliki z GitHub

Wykonaj te polecenia **po kolei** w PowerShell/Command Prompt:

```cmd
C:\Users\user\Desktop\NetAnaliza-Deploy>
C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o APlusAssetLibraryTest.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/APlusAssetLibraryTest.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o APlusContentHelpers.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/APlusContentHelpers.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o APlusContentSync.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/APlusContentSync.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o APlusImageExtractor.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/APlusImageExtractor.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o APlusModuleBuilder.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/APlusModuleBuilder.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o APlusS3Upload.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/APlusS3Upload.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o BrandContentManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/BrandContentManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o ClientManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/ClientManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o CustomizationManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/CustomizationManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o DocumentsManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/DocumentsManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o ExportOptions.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/ExportOptions.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o FormImport.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/FormImport.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o GpsrManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/GpsrManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o LukoAmazonManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/LukoAmazonManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o MediaManager.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/MediaManager.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o ProductImporter.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/ProductImporter.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o ProductValidator.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/ProductValidator.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o ReverseFeedImporter.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/ReverseFeedImporter.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o SPApiAuth.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/SPApiAuth.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o SPApiDirect.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/SPApiDirect.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o SetupInstaller.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/SetupInstaller.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o SheetGeneratorExtension.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/SheetGeneratorExtension.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o SpreadsheetGenerator.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/SpreadsheetGenerator.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o TemplateHighlighter.gs https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/TemplateHighlighter.gs

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o appsscript.json https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/appsscript.json

C:\Users\user\Desktop\NetAnaliza-Deploy>curl -k -L -o .clasp.json https://raw.githubusercontent.com/LUKOAI/LUKOAmazonContentManager/claude/update-readme-docs-01NHkG9CRgcc7DqeHRWi9SLr/apps-script/.clasp.json
```

## 📤 Krok 2: Wgraj do Google Apps Script

```cmd
C:\Users\user\Desktop\NetAnaliza-Deploy>clasp push --force
```

## ✅ Krok 3: Zweryfikuj Wdrożenie

Otwórz Google Apps Script Editor:
https://script.google.com/u/0/home/projects/1PvvWRgkSWmzynSqUNv9jjWHj2sdXjCzKhvDmaCR5PxzBU1r7KCLASIlQ/edit

Sprawdź czy wszystkie pliki zostały wgrane:
- ✅ APlusModuleBuilder.gs (549 linii)
- ✅ APlusContentHelpers.gs (327 linii)
- ✅ APlusContentSync.gs (204 linie)
- ✅ SPApiDirect.gs (849 linii)
- ✅ FormImport.gs (650 linii)
- ✅ ClientManager.gs (489 linii)
- i pozostałe 18 plików...

## 🎯 Krok 4: Otwórz Spreadsheet

Otwórz swój Google Sheets:
https://docs.google.com/spreadsheets/d/1J-XapY2vq1Ka4QcBNeGzZyGZxzKESqD2qKmKQpa_jo8/edit

Odśwież stronę (F5) żeby załadować nowe menu.

## 📋 Co Zostało Wgrane?

### Nowe Funkcje A+ Content:
1. **APlusModuleBuilder.gs** - Budowanie wszystkich 20 typów modułów A+
2. **APlusContentHelpers.gs** - Helpery do konwersji marketplace/locale, walidacji
3. **APlusContentSync.gs** - Synchronizacja istniejących A+ Content z Amazon
4. **APlusImageExtractor.gs** - Ekstrakcja image ID z product listings
5. **APlusAssetLibraryTest.gs** - Testy Asset Library API
6. **APlusS3Upload.gs** - Upload obrazów do Amazon S3/Asset Library
7. **FormImport.gs** - Import danych z Google Forms do A+ Content
8. **SPApiDirect.gs** - Bezpośrednie wywołania SP-API dla A+ Content

### Zaktualizowane Funkcje:
1. **LukoAmazonManager.gs** - Nowe menu dla A+ Content
2. **ClientManager.gs** - Multi-client support
3. **SpreadsheetGenerator.gs** - Generowanie arkuszy APlusBasic/APlusPremium
4. **SPApiAuth.gs** - Ulepszona autoryzacja

### Nowa Dokumentacja:
1. **docs/APLUS_CONTENT_GUIDE.md** - Kompletny przewodnik
2. **docs/APLUS_IMAGE_WORKFLOW.md** - Workflow dla obrazów
3. **docs/APLUS_MODULES_SPECIFICATION.md** - Specyfikacja modułów
4. **docs/GOOGLE_FORMS_INTEGRATION.md** - Integracja z Forms

## 🔍 Troubleshooting

### Problem: clasp nie jest rozpoznany
```cmd
npm install -g @google/clasp
```

### Problem: Nie jestem zalogowany
```cmd
clasp login
```

### Problem: Błąd podczas push
Sprawdź czy .clasp.json ma poprawny scriptId:
```json
{
  "scriptId": "1PvvWRgkSWmzynSqUNv9jjWHj2sdXjCzKhvDmaCR5PxzBU1r7KCLASIlQ",
  "rootDir": "."
}
```

### Problem: Menu się nie pokazuje
1. Odśwież Google Sheets (F5)
2. Jeśli nadal nie widać, otwórz Apps Script Editor i uruchom funkcję `onOpen()`

## 📞 Następne Kroki

Po wgraniu przejdź do testów - patrz **TEST_PLAN.md**
