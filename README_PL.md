# NetAnaliza Amazon Content Manager

**Wersja 3.0.0** - Bezpośrednie połączenie z SP-API Amazon

## ⚡ Nowe w wersji 3.0

### 🔥 Główne zmiany

1. **✅ USUNIĘTO Google Cloud Function** - Teraz bezpośrednie połączenie z Amazon SP-API
2. **✅ Multi-Client Support** - Zarządzanie wieloma klientami Amazon w jednym arkuszu
3. **✅ Nowa karta "Client Settings"** - Wszystkie ustawienia w jednym miejscu
4. **✅ Nowa nazwa menu: "NetAnaliza Manager"**
5. **✅ Widoczność klienta** - Wszędzie widać z jakiego konta pochodzą dane

### 🎯 Korzyści

- **Szybsze** - Brak pośrednika (Cloud Function)
- **Bezpieczniejsze** - Bezpośrednie połączenie z Amazon
- **Prostsze** - Nie trzeba konfigurować Google Cloud
- **Multi-klient** - Obsługa wielu klientów jednocześnie
- **Przejrzyste** - Zawsze wiesz z jakiego konta płyną dane

---

## 📋 Szybki Start

### 1. Otwórz arkusz Google Sheets

Skopiuj lub otwórz arkusz z kodem NetAnaliza Amazon Content Manager.

### 2. Wygeneruj arkusze (pierwsze uruchomienie)

```
Menu → Tools → 🎨 Generate Spreadsheet
```

To utworzy wszystkie potrzebne arkusze, w tym **Client Settings**.

### 3. Skonfiguruj pierwszego klienta

#### Opcja A: Migra cja ze starego Config (jeśli masz)

```
Menu → Client Management → 📥 Migrate from Old Config
```

#### Opcja B: Dodaj nowego klienta

```
Menu → Client Management → ➕ Add New Client
```

Podaj dane:
- **Client Name**: Nazwa klienta (np. "Klient ABC Sp. z o.o.")
- **Client Email**: Email klienta (opcjonalnie)
- **Seller ID**: ID sprzedawcy Amazon (np. `A3EXAMPLE123456`)
- **Marketplace**: Marketplace (np. `DE`, `FR`, `UK`)
- **Refresh Token**: Token odświeżania z Amazon SP-API
- **LWA Client ID**: Client ID z Amazon LWA
- **LWA Client Secret**: Client Secret z Amazon LWA

### 4. Aktywuj klienta

Kliknij w kartę **Client Settings** i zaznacz checkbox **✓ Active** przy kliencie którego chcesz używać.

**WAŻNE**: Tylko jeden klient może być aktywny na raz!

### 5. Gotowe!

Możesz teraz używać wszystkich funkcji narzędzia.

---

## 🎮 Jak używać

### Przełączanie między klientami

```
Menu → Client Management → 🔄 Switch Active Client
```

Wybierz numer klienta z listy.

### Sprawdzenie aktywnego klienta

```
Menu → Client Management → 📋 Show Active Client
```

Wyświetli aktualnie aktywnego klienta.

### Dodawanie nowego klienta

```
Menu → Client Management → ➕ Add New Client
```

### Eksport produktów do Amazon

1. Otwórz kartę **ProductsMain**
2. Wypełnij dane produktów
3. Zaznacz checkbox **☑️ Export** przy produktach
4. Kliknij:
   ```
   Menu → Export to Amazon → 📤 Export Products
   ```

**Kolumna Status** pokaże:
```
DONE [Nazwa Klienta - Seller ID]
```

Dzięki temu zawsze wiesz z jakiego konta eksportowałeś!

### Import produktów z Amazon

#### Import po ASIN:
```
Menu → Import from Amazon → 📦 Import by ASIN(s)
```

#### Wyszukiwanie po frazie:
```
Menu → Import from Amazon → 🔍 Search Products by Keyword
```

---

## 📊 Karta Client Settings

### Struktura kolumn

| Kolumna | Opis | Wymagane |
|---------|------|----------|
| ✓ Active | Checkbox - tylko jeden może być zaznaczony | ✅ |
| Client Name | Nazwa klienta | ✅ |
| Client Email | Email klienta | ❌ |
| Seller ID | Amazon Seller ID | ✅ |
| Marketplace | Kod marketplace (DE, FR, UK...) | ✅ |
| Marketplace ID | ID marketplace Amazon | ✅ |
| Refresh Token | Token odświeżania SP-API | ✅ |
| LWA Client ID | Login with Amazon Client ID | ✅ |
| LWA Client Secret | Login with Amazon Client Secret | ✅ |
| Notes | Notatki | ❌ |
| Created Date | Data utworzenia | Auto |
| Last Used | Ostatnio używany | Auto |

### Marketplace IDs

Najczęściej używane:

| Marketplace | Kod | Marketplace ID |
|-------------|-----|----------------|
| Niemcy | DE | A1PA6795UKMFR9 |
| Francja | FR | A13V1IB3VIYZZH |
| Włochy | IT | APJ6JRA9NG5V4 |
| Hiszpania | ES | A1RKKUPIHCS9HS |
| Wielka Brytania | UK | A1F83G8C2ARO7P |
| Holandia | NL | A1805IZSGTT6HS |
| Polska | PL | A1C3SOZRARQ6R3 |
| Szwecja | SE | A2NODRKZP88ZB9 |

---

## 🔑 Jak uzyskać dane do Client Settings?

### 1. Seller ID

1. Zaloguj się do Amazon Seller Central
2. Menu → Settings → Account Info
3. Znajdź **Merchant Token** lub **Seller ID**

### 2. LWA Client ID i Secret + Refresh Token

#### Krok 1: Utwórz aplikację w Amazon Developer Console

1. Idź do: https://developer.amazon.com/settings/console/registration
2. Zaloguj się tym samym kontem co Seller Central
3. Kliknij **Create New Client**
4. Wybierz **SP-API**
5. Podaj **Allowed Return URLs**: `https://ads.netanaliza.com/amazon-callback`
6. Zapisz **Client ID** i **Client Secret**

#### Krok 2: Autoryzuj aplikację i uzyskaj Refresh Token

**Automatycznie (przez Email):**

```
Menu → SP-API Auth → 📧 Setup Email Automation
```

Następnie wyślij link autoryzacyjny do klienta. Token zostanie automatycznie zapisany.

**Manualnie:**

1. Wygeneruj link autoryzacyjny:
   ```
   https://sellercentral.amazon.de/apps/authorize/consent?application_id={CLIENT_ID}&state=test&version=beta
   ```

2. Otwórz w przeglądarce i autoryzuj

3. Z URL callback skopiuj `spapi_oauth_code=...`

4. Wklej kod w arkuszu SP-API Auth

5. Kliknij:
   ```
   Menu → SP-API Auth → 📝 Manual: Exchange Auth Code
   ```

---

## 🚨 Często zadawane pytania (FAQ)

### ❓ Czy mogę mieć wielu klientów w jednym arkuszu?

**TAK!** To jest główna funkcja wersji 3.0. Dodaj dowolną liczbę klientów i przełączaj między nimi.

### ❓ Co się stało z Cloud Function?

**Usunięto!** Teraz używamy bezpośrednich połączeń z Amazon SP-API. Jest szybciej i prościej.

### ❓ Co się stało z kartą "Config" i "Settings"?

**Zastąpiono** przez **Client Settings**. Wszystkie ustawienia są teraz w jednym miejscu.

Możesz zmigrować stare dane:
```
Menu → Client Management → 📥 Migrate from Old Config
```

### ❓ Czy mogę używać dwóch klientów jednocześnie?

**NIE.** Tylko jeden klient może być aktywny na raz. Ale możesz szybko przełączać:
```
Menu → Client Management → 🔄 Switch Active Client
```

### ❓ Jak sprawdzić który klient jest aktywny?

```
Menu → Client Management → 📋 Show Active Client
```

Lub zobacz kolumnę **Status** po eksporcie - pokazuje nazwę klienta.

### ❓ Czy dane są bezpieczne?

**TAK.** Wszystkie dane są przechowywane w Twoim prywatnym arkuszu Google Sheets.

**NIGDY** nie udostępniaj arkusza Client Settings nikomu!

### ❓ Co zrobić jeśli "No active client selected"?

Zaznacz checkbox **✓ Active** przy jednym z klientów w karcie **Client Settings**.

---

## 🛠️ Rozwiązywanie problemów

### Problem: "Client Settings sheet not found"

**Rozwiązanie:**
```
Menu → Tools → 🎨 Generate Spreadsheet
```

lub

```
Menu → Client Management → 🔧 Setup Client Settings
```

### Problem: "No active client selected"

**Rozwiązanie:**

1. Otwórz kartę **Client Settings**
2. Zaznacz checkbox **✓ Active** przy jednym kliencie
3. Odznacz wszystkie inne checkboxy

### Problem: "Missing required credentials"

**Rozwiązanie:**

1. Otwórz kartę **Client Settings**
2. Sprawdź czy wszystkie wymagane pola są wypełnione:
   - Client Name
   - Seller ID
   - Marketplace
   - Marketplace ID
   - Refresh Token
   - LWA Client ID
   - LWA Client Secret

### Problem: "Token refresh failed"

**Rozwiązanie:**

Refresh Token wygasł lub jest nieprawidłowy.

1. Wygeneruj nowy Refresh Token (zobacz sekcja "Jak uzyskać dane")
2. Wklej do **Client Settings → Refresh Token**
3. Spróbuj ponownie

---

## 📝 Różnice między wersjami

### Wersja 2.0 (stara) vs 3.0 (nowa)

| Funkcja | v2.0 | v3.0 |
|---------|------|------|
| Połączenie | Google Cloud Function | Bezpośrednio SP-API ✅ |
| Multi-klient | ❌ | ✅ Tak |
| Konfiguracja | Config + Settings | Client Settings ✅ |
| Menu | Amazon Manager | NetAnaliza Manager ✅ |
| Widoczność klienta | ❌ | ✅ Wszędzie |
| Szybkość | Wolniejsze | Szybsze ✅ |

---

## 🎯 Przykłady użycia

### Scenariusz 1: Zarządzanie 3 klientami

```
1. Dodaj 3 klientów przez Menu → Client Management → Add New Client

2. Aktywuj klienta 1 (checkbox ✓ Active)

3. Eksportuj produkty klienta 1

4. Przełącz na klienta 2:
   Menu → Client Management → Switch Active Client

5. Eksportuj produkty klienta 2

6. itd.
```

### Scenariusz 2: Import produktów konkurencji

```
1. Menu → Import from Amazon → Search Products by Keyword

2. Wpisz frazę: "wireless mouse"

3. Marketplace: DE

4. Produkty zostaną zaimportowane do arkusza "ImportedProducts"

5. Możesz skopiować dane do swoich produktów
```

### Scenariusz 3: Testowanie połączenia

```
1. Menu → Tools → 🔌 Test API Connection

2. Sprawdź czy wszystko działa:
   - Configuration: ✅
   - Token Refresh: ✅
   - API Call: ✅
```

---

## 📞 Wsparcie

Jeśli masz pytania lub problemy:

1. Sprawdź arkusz **Logs** - tam są wszystkie operacje
2. Sprawdź arkusz **ErrorLog** - tam są błędy
3. Użyj funkcji testowej:
   ```
   Menu → Tools → Test API Connection
   ```

---

## ✅ Podsumowanie

NetAnaliza Amazon Content Manager 3.0 to:

- ✅ **Bezpośrednie połączenie** z Amazon SP-API
- ✅ **Multi-klient** - zarządzanie wieloma kontami
- ✅ **Przejrzyste** - zawsze wiesz z jakiego konta płyną dane
- ✅ **Szybkie** - brak pośrednika
- ✅ **Proste** - wszystko w jednym arkuszu

**Gotowe do użycia!** 🚀

---

## 📄 Licencja

© 2025 NetAnaliza. Wszelkie prawa zastrzeżone.

To narzędzie jest przeznaczone wyłącznie do użytku przez NetAnaliza i jej klientów.

**NIGDY nie udostępniaj tego narzędzia osobom trzecim bez zgody NetAnaliza.**
