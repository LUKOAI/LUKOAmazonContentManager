# 🚀 SZYBKIE WGRANIE DO GOOGLE APPS SCRIPT

## ✅ Metoda 1: clasp (NAJSZYBSZA - 3 minuty)

clasp jest już zainstalowany! Teraz:

### Krok 1: Login do Google
```bash
clasp login
```
To otworzy przeglądarkę - zaloguj się kontem Google z dostępem do Sheets.

### Krok 2: Utwórz lub połącz z projektem

**Opcja A: Nowy projekt (ZALECANE)**
```bash
cd /home/user/LUKOAmazonContentManager/apps-script
clasp create --type sheets --title "LUKO Amazon Content Manager"
```

**Opcja B: Istniejący projekt**
Jeśli masz już Apps Script projekt:
```bash
cd /home/user/LUKOAmazonContentManager/apps-script
clasp clone SCRIPT_ID
# Script ID znajdziesz w Apps Script: Project Settings → Script ID
```

### Krok 3: Push wszystkich plików
```bash
clasp push
```

### Krok 4: Otwórz w przeglądarce
```bash
clasp open
```

### Krok 5: Odśwież Google Sheets
Wróć do Google Sheets i odśwież stronę (F5) - zobaczysz menu "Amazon Manager"

---

## ✅ Metoda 2: Skopiuj i wklej (5 minut)

### Lista plików do skopiowania (13 plików):

1. **SPApiAuth.gs** ⭐ NOWY!
2. LukoAmazonManager.gs ⭐ ZAKTUALIZOWANY!
3. SpreadsheetGenerator.gs
4. ProductValidator.gs
5. ReverseFeedImporter.gs
6. TemplateHighlighter.gs
7. SetupInstaller.gs
8. SheetGeneratorExtension.gs
9. BrandContentManager.gs
10. CustomizationManager.gs
11. DocumentsManager.gs
12. GpsrManager.gs
13. MediaManager.gs

### Jak skopiować:

1. Otwórz Google Sheets
2. Extensions → Apps Script
3. Dla każdego pliku:
   - Kliknij: **+ (Add file)** → **Script**
   - Nazwa: dokładnie jak nazwa pliku (bez .gs)
   - Skopiuj zawartość z `/home/user/LUKOAmazonContentManager/apps-script/[nazwa-pliku].gs`
   - Wklej i Save

---

## ✅ Metoda 3: Jeden plik (dla testów - 2 minuty)

Jeśli chcesz SZYBKO przetestować:

```bash
cd /home/user/LUKOAmazonContentManager/apps-script
cat SPApiAuth.gs LukoAmazonManager.gs > /tmp/combined.gs
```

Potem skopiuj `/tmp/combined.gs` do Apps Script jako jeden plik Code.gs

⚠️ **Uwaga**: To tylko dla testów! Dla produkcji użyj Metody 1 lub 2.

---

## 📋 Po wgraniu - CHECKLIST

### 1. Sprawdź menu
- [ ] Odśwież Google Sheets (F5)
- [ ] Widzisz menu "Amazon Manager"?
- [ ] Submenu "🔑 SP-API Auth" jest na górze?

### 2. Skonfiguruj Config sheet
- [ ] Wypełnij: Cloud Function URL
- [ ] Wypełnij: LWA Client ID
- [ ] Wypełnij: LWA Client Secret
- [ ] Wypełnij: Seller ID
- [ ] Dodaj: OAuth Redirect URI (opcjonalne, domyślnie: https://ads.netanaliza.com/amazon-callback)

### 3. Setup Email Automation (OPCJONALNE)
Jeśli chcesz automatyczne przetwarzanie emaili:

- [ ] Menu: Amazon Manager → 🔑 SP-API Auth → 📧 Setup Email Automation
- [ ] Autoryzuj dostęp do Gmail (pojawi się okno autoryzacji)
- [ ] Gotowe! System będzie sprawdzać emaile co 5 minut

### 4. Przetestuj
Opcja A: Email Automation
- [ ] Menu: 🔑 SP-API Auth → 🔄 Process Emails Now
- [ ] Sprawdź czy utworzył się sheet "SP-API Auth"

Opcja B: Manual
- [ ] Utwórz sheet "SP-API Auth" z kolumnami:
  ```
  Client Email | Authorization Code | Status | Refresh Token | Access Token | Expires At | Processed Date
  ```
- [ ] Dodaj auth code do kolumny B
- [ ] Zaznacz wiersz
- [ ] Menu: 🔑 SP-API Auth → 📝 Manual: Exchange Auth Code

---

## 🎯 JAK TO DZIAŁA - Email Automation

### Flow:

1. **Amazon wysyła email** z authorization code
   - Od: no-reply@amazon.com
   - Temat: "Amazon Selling Partner API"

2. **Script sprawdza Gmail** (co 5 minut lub na żądanie)
   - Szuka nieprzeczytanych emaili z ostatnich 24h
   - Znajduje authorization code w treści

3. **Auto-exchange**
   - Wywołuje Amazon LWA OAuth API
   - Wymienia code na refresh_token + access_token

4. **Zapisuje do sheet**
   - Tworzy wiersz w "SP-API Auth"
   - Zapisuje wszystkie tokeny
   - Oznacza email jako przeczytany
   - Dodaje label "SP-API Processed"

### Rezultat:
✅ Pełna automatyzacja - zero ręcznej pracy!
✅ Wszystkie tokeny bezpiecznie w Google Sheets
✅ Historia wszystkich autoryzacji

---

## 🔧 Troubleshooting

### "clasp: command not found"
```bash
npm install -g @google/clasp
```

### "clasp login" nie działa
```bash
# Sprawdź czy Node.js działa
node --version

# Sprawdź czy npm działa
npm --version

# Spróbuj ponownie
clasp logout
clasp login
```

### "Permission denied" podczas push
```bash
# W Apps Script projekcie:
# Project Settings → Google Cloud Platform (GCP) Project
# Użyj domyślnego projektu lub podłącz swój
```

### Menu nie pojawia się
1. Odśwież stronę (F5)
2. Zamknij i otwórz ponownie Google Sheets
3. Sprawdź czy nie ma błędów: Apps Script → Executions

### Email automation nie działa
1. Sprawdź czy trigger jest utworzony: Apps Script → Triggers
2. Sprawdź logi: Apps Script → Executions → View logs
3. Upewnij się że autoryzowałeś dostęp do Gmail

---

## 📞 Pomoc

Jeśli coś nie działa:

1. **Sprawdź logi**: Apps Script → Executions
2. **Sprawdź Triggers**: Apps Script → Triggers (ikona zegara)
3. **Test Connection**: Menu → Tools → Test Connection

---

**Gotowe! System jest wgrany i działający! 🎉**
