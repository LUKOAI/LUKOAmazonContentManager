# Instrukcje Wdrożenia - Google Apps Script

## 🚀 Szybkie Wdrożenie (Zalecane)

### Metoda 1: Używając clasp (Command Line)

1. **Otwórz PowerShell lub Command Prompt** w folderze projektu:
   ```powershell
   cd C:\Users\user\Documents\LUKOAmazonContentManager
   ```

2. **Pobierz najnowsze zmiany z GitHub:**
   ```bash
   git fetch origin
   git checkout claude/fix-gas-issue-01Q4o6B5UEv9ja2JFjUMFFov
   git pull origin claude/fix-gas-issue-01Q4o6B5UEv9ja2JFjUMFFov
   ```

3. **Sprawdź czy clasp jest zainstalowany:**
   ```bash
   clasp --version
   ```

   Jeśli nie jest zainstalowany, zainstaluj:
   ```bash
   npm install -g @google/clasp
   ```

4. **Zaloguj się do Google (jeśli jeszcze nie jesteś zalogowany):**
   ```bash
   clasp login
   ```

5. **Przejdź do folderu apps-script:**
   ```bash
   cd apps-script
   ```

6. **Wdróż poprawiony kod do Google Apps Script:**
   ```bash
   clasp push
   ```

7. **Zweryfikuj wdrożenie:**
   - Otwórz: https://script.google.com/u/0/home/projects/1zQ9FDfM2bwol3KRd6LuYuylY6jzHh2bhSvviFPg6Lq2sxv0dB9lOF-jx/edit
   - Sprawdź czy plik `SpreadsheetGenerator.gs` zawiera linię `sheet.setFrozenColumns(0);`

---

## 📋 Metoda 2: Manualne Kopiowanie (Alternatywa)

Jeśli clasp nie działa, możesz skopiować kod ręcznie:

1. **Otwórz lokalny plik:**
   ```
   C:\Users\user\Documents\LUKOAmazonContentManager\apps-script\SpreadsheetGenerator.gs
   ```

2. **Zaznacz cały kod (Ctrl+A) i skopiuj (Ctrl+C)**

3. **Otwórz Google Apps Script:**
   - Link: https://script.google.com/u/0/home/projects/1zQ9FDfM2bwol3KRd6LuYuylY6jzHh2bhSvviFPg6Lq2sxv0dB9lOF-jx/edit
   - Znajdź plik `SpreadsheetGenerator.gs`

4. **Zaznacz cały kod w edytorze Google Apps Script (Ctrl+A)**

5. **Wklej nowy kod (Ctrl+V)**

6. **Zapisz (Ctrl+S)**

---

## ✅ Testowanie Poprawki

1. **Otwórz swój spreadsheet:**
   - https://docs.google.com/spreadsheets/d/11ogc3d7o5kr22LqnoLx4CS1weX8u-lA9Y6ZDnMJQXNc/edit

2. **Uruchom generator:**
   - Menu: `🚀 LUKO Generator` → `Generate Full Spreadsheet`

3. **Sprawdź czy nie ma błędu:**
   - Powinno pojawić się "Generating spreadsheet... Please wait."
   - Po ~25 sekundach: "✅ Success! Spreadsheet generated successfully!"
   - **NIE powinno być błędu:** "You can't merge frozen and non-frozen columns"

---

## 🔍 Co Zostało Naprawione?

Dodano `sheet.setFrozenColumns(0);` do 11 funkcji generujących arkusze:

- ✅ generateProductsMainSheet() - linia 77
- ✅ generateAPlusBasicSheet() - linia 438
- ✅ generateAPlusPremiumSheet() - linia 522
- ✅ generateImagesSheet() - linia 578
- ✅ generateVariationsSheet() - linia 637
- ✅ generateCouponsSheet() - linia 688
- ✅ generatePromoCodesSheet() - linia 831
- ✅ generateSettingsSheet() - linia 970
- ✅ generateHelpSheet() - linia 1015
- ✅ generateTemplatesSheet() - linia 1072
- ✅ generateErrorLogSheet() - linia 1193

To usuwa wszystkie zamrożone kolumny przed wykonaniem operacji merge, zapobiegając błędowi.

---

## 🆘 Troubleshooting

### Problem: clasp push nie działa
**Rozwiązanie:** Użyj metody 2 (manualne kopiowanie)

### Problem: "clasp is not recognized"
**Rozwiązanie:**
```bash
npm install -g @google/clasp
```

### Problem: Nadal widzę błąd merge
**Rozwiązanie:**
1. Upewnij się, że kod został zapisany (Ctrl+S w edytorze)
2. Odśwież stronę Google Sheets
3. Spróbuj ponownie uruchomić generator

### Problem: Nie mogę znaleźć pliku lokalnie
**Rozwiązanie:**
Pobierz plik bezpośrednio z GitHub:
https://github.com/LUKOAI/LUKOAmazonContentManager/blob/claude/fix-gas-issue-01Q4o6B5UEv9ja2JFjUMFFov/apps-script/SpreadsheetGenerator.gs

---

## 📞 Potrzebujesz Pomocy?

Jeśli nadal masz problemy, daj mi znać:
- Jaki błąd widzisz?
- Która metoda wdrożenia nie działa?
- Zrzut ekranu błędu

Pomogę Ci rozwiązać problem!
