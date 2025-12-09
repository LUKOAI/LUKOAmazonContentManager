# LUKO Amazon Content Manager - Nowe Funkcje

## ✅ Co Zostało Dodane

### 1. 🔌 Test Połączenia API

**Lokalizacja:** Menu → Tools → Test API Connection

**Funkcja:** `lukoTestAPIConnection()`

**Co testuje:**
- ✅ Poprawność konfiguracji w arkuszu Config
- ✅ Odświeżanie tokena dostępu (LWA Token Refresh)
- ✅ Rzeczywiste wywołanie SP-API (test na żywym produkcie)
- ✅ Wyświetla czas odpowiedzi, Seller ID, Marketplace ID

**Jak używać:**
1. Upewnij się, że arkusz Config zawiera wszystkie wymagane dane:
   - LWA Client ID
   - LWA Client Secret
   - Refresh Token
   - Seller ID
2. Menu → Tools → Test API Connection
3. Poczekaj na wynik testu (2-5 sekund)
4. Sprawdź szczegóły w oknie dialogowym

**Przykładowy wynik:**
```
✅ API Connection Successful!

Configuration: ✅
Token Refresh: ✅
API Call: ✅

Seller ID: A3EXAMPLE123
Marketplace: A1PA6795UKMFR9
Response Time: 1234ms

Your SP-API connection is working correctly!
```

---

### 2. 📦 Import Produktów po ASIN

**Lokalizacja:** Menu → Import from Amazon → Import by ASIN(s)

**Funkcja:** `lukoImportByASIN()`

**Co robi:**
- Pobiera pełne dane produktu z Amazon SP-API po ASIN
- Wspiera import pojedynczego ASIN lub wielu (oddzielone przecinkami)
- Automatycznie tworzy kartę **ImportedProducts** jeśli nie istnieje
- Pobiera **wszystkie dostępne pola**, w tym:
  - ✅ Seller ID i Seller Name
  - ✅ Pełne dane produktu (title, brand, manufacturer)
  - ✅ Bullet points (do 9)
  - ✅ Description
  - ✅ Wszystkie zdjęcia (main + 5 additional)
  - ✅ Wymiary i wagi
  - ✅ Model number, release date, package quantity
  - ✅ Country of origin
  - ✅ Parent ASIN, variation theme
  - ✅ Pricing (jeśli dostępne)
  - ✅ Inventory (jeśli dostępne)

**Jak używać:**
1. Menu → Import from Amazon → Import by ASIN(s)
2. Wprowadź ASIN(y):
   - Pojedynczy: `B08N5WRWNW`
   - Wiele: `B08N5WRWNW, B07XJ8C8F5, B09PMHKQXR`
3. Wybierz marketplace (DE, FR, UK, IT, ES, etc.)
4. Potwierdź import
5. Produkty zostaną zapisane w arkuszu **ImportedProducts**

**Ważne:**
- Funkcja pobiera Seller ID - możesz zobaczyć kto sprzedaje dany produkt!
- Wszystkie dane są zapisywane z metadanymi: data importu, kto zaimportował

---

### 3. 🔍 Wyszukiwanie Produktów po Frazie

**Lokalizacja:** Menu → Import from Amazon → Search Products by Keyword

**Funkcja:** `lukoSearchProducts()`

**Co robi:**
- Wyszukuje produkty na Amazon po słowie kluczowym
- Zwraca do 20 wyników
- Automatycznie pobiera pełne dane dla wszystkich znalezionych produktów
- Zapisuje do arkusza **ImportedProducts**

**Jak używać:**
1. Menu → Import from Amazon → Search Products by Keyword
2. Wprowadź frazę szukania (np. "laptop", "water bottle", "bluetooth speaker")
3. Wybierz marketplace
4. Przejrzyj listę znalezionych produktów (pierwsze 10)
5. Potwierdź import wszystkich
6. Produkty zostaną automatycznie pobrane i zapisane

**Przykład:**
```
Fraza: "wireless mouse"
Marketplace: DE

Znaleziono 18 produktów:
B08N5WRWNW - Logitech MX Master 3 Advanced Wireless Mouse...
B07XJ8C8F5 - Razer Basilisk X HyperSpeed Wireless Gaming...
...

Import all 18 products? [YES] [NO]
```

---

### 4. ⚙️ Zaawansowany Eksport z Opcjami

**Lokalizacja:** Menu → Export to Amazon → Export Advanced (Partial/Full Update)

**Funkcja:** `lukoExportProductsAdvanced()`

**Co nowego:**

#### A) **Partial Update vs Full Update**

**Partial Update:**
- Eksportuje **tylko zmienione pola** (pola z wartościami)
- Puste pola są **pomijane**
- Amazon nie nadpisuje pustych pól
- Idealny do aktualizacji tylko niektórych danych (np. tylko title i bullets)

**Full Update:**
- Eksportuje **wszystkie pola**
- Puste pola **nadpisują istniejące wartości na Amazon**
- Amazon zastąpi wszystkie pola nowymi wartościami
- Używaj ostrożnie! Może usunąć dane które istnieją na Amazon ale nie w arkuszu

**Jak wybrać:**
1. Menu → Export to Amazon → Export Advanced
2. Okno dialogowe: **"Choose update mode"**
   - YES = Partial Update (tylko zmienione pola)
   - NO = Full Update (wszystkie pola, włącznie z pustymi)

#### B) **Selektor Pól do Eksportu**

Możesz wybrać **dokładnie które pola** chcesz wyeksportować:

**Dostępne kategorie:**
- 📝 **Basic Information**: Title, Brand, Manufacturer
- 📋 **Content**: Bullet Points, Description, Keywords, Platinum Keywords
- 🖼️ **Media**: Images, Videos
- 📐 **Specifications**: Dimensions & Weight, Compliance & Safety
- 💰 **Pricing & Inventory**: Pricing, Inventory
- 🎨 **Enhanced Content**: A+ Content, Brand Content

**Jak używać:**
1. Menu → Export to Amazon → Export Advanced
2. Wybierz tryb (Partial/Full)
3. "Do you want to select specific fields?" → YES
4. Zaznacz pola które chcesz wyeksportować
5. Kliknij "Export Selected Fields"

**Przykład użycia:**
```
Scenariusz: Chcę zaktualizować tylko Title i Bullet Points,
            ale nie chcę zmieniać zdjęć i wymiarów

Rozwiązanie:
1. Export Advanced
2. Partial Update (YES)
3. Select specific fields (YES)
4. Zaznacz tylko:
   - ✅ Product Title
   - ✅ Bullet Points
5. Export!

Rezultat: Zaktualizowane będą TYLKO title i bullets,
          reszta pozostanie bez zmian na Amazon.
```

---

### 5. 📊 Nowy Arkusz: ImportedProducts

**Automatycznie tworzony** podczas pierwszego importu produktów.

**Zawiera:**
- ☑️ Use (checkbox do późniejszego użycia)
- Import Date, Imported By
- **ASIN, SKU, Seller ID, Seller Name** ← WAŻNE!
- Product Type, Title, Brand, Manufacturer
- Bullet Points (1-9)
- Description
- Images (Main + 5 Additional)
- **List Price, Current Price, Currency** ← Ceny!
- Available Quantity ← Dostępność!
- Dimensions (wszystkie: item + package)
- Model Number, Release Date, Package Quantity
- Country of Origin
- Parent ASIN, Variation Theme
- Marketplace, Notes

**Dlaczego osobny arkusz?**
- Oddzielenie importowanych danych od Twoich produktów
- Możliwość analizy konkurencji (Seller ID!)
- Możliwość kopiowania danych do ProductsMain

---

### 6. 🔧 Uzupełnione Funkcje Importu

#### Import Pricing
**Funkcja:** `lukoImportPricing()`
- Pobiera aktualne ceny produktu (SKU lub ASIN)
- Wyświetla: List Price, Current Price, Buy Box Price
- Menu → Import from Amazon → Import Pricing

#### Import Inventory
**Funkcja:** `lukoImportInventory()`
- Pobiera stan magazynowy (SKU)
- Wyświetla: Available Quantity, Fulfillment Channel, Condition
- Menu → Import from Amazon → Import Inventory

#### Import A+ Content
**Funkcja:** `lukoImportAPlus()`
- Pobiera A+ Content dla danego ASIN
- Wyświetla: Content ID, Status, liczba modułów
- Opcja importu do arkusza APlus-Basic
- Menu → Import from Amazon → Import A+ Content

---

## 🚀 Jak Zacząć Używać

### Krok 1: Przetestuj API
```
Menu → Tools → Test API Connection
```
Upewnij się, że wszystko działa!

### Krok 2: Zaimportuj Przykładowy Produkt
```
Menu → Import from Amazon → Import by ASIN(s)
ASIN: B08N5WRWNW
Marketplace: DE
```
Sprawdź arkusz **ImportedProducts**.

### Krok 3: Wyszukaj Produkty
```
Menu → Import from Amazon → Search Products by Keyword
Fraza: wireless mouse
Marketplace: DE
```

### Krok 4: Przetestuj Zaawansowany Eksport
```
1. Zaznacz kilka produktów w ProductsMain (checkbox ☑️ Export)
2. Menu → Export to Amazon → Export Advanced
3. Wybierz Partial Update
4. Wybierz konkretne pola (np. tylko Title + Bullets)
5. Export!
```

---

## 📝 Najważniejsze Zmiany w Plikach

### Nowe pliki:
1. **ProductImporter.gs** - Wszystkie funkcje importu i testowania API
2. **ExportOptions.gs** - Zaawansowane opcje eksportu
3. **NOWE_FUNKCJE.md** - Ta dokumentacja

### Zmodyfikowane pliki:
1. **LukoAmazonManager.gs**
   - Zaktualizowane menu (dodane nowe pozycje)
   - Uzupełnione funkcje `lukoImportPricing`, `lukoImportInventory`, `lukoImportAPlus`

2. **SpreadsheetGenerator.gs**
   - Dodane generowanie arkusza ImportedProducts

---

## ⚠️ Ważne Uwagi

### Partial vs Full Update - Kiedy co używać?

**Partial Update - używaj gdy:**
- ✅ Aktualizujesz tylko niektóre pola (np. title, description)
- ✅ Nie chcesz zmieniać innych danych na Amazon
- ✅ Nie jesteś pewien czy wszystkie pola w arkuszu są kompletne
- ✅ Chcesz bezpieczną aktualizację

**Full Update - używaj gdy:**
- ⚠️ Masz kompletne dane we wszystkich polach
- ⚠️ Chcesz nadpisać wszystko na Amazon
- ⚠️ Świadomie chcesz usunąć niektóre dane (poprzez puste pola)
- ⚠️ Jesteś pewien co robisz!

### Seller ID - Po co?
- Możesz zobaczyć kto sprzedaje dany produkt
- Analiza konkurencji
- Sprawdzanie własnych produktów
- Identyfikacja source'u produktów

---

## 🐛 Troubleshooting

### Problem: "API Connection Failed"
**Rozwiązanie:**
1. Sprawdź Config sheet - wszystkie pola wypełnione?
2. Refresh Token nie wygasł? (odśwież: Menu → SP-API Auth → Manual: Refresh Token)
3. LWA Client ID i Secret poprawne?

### Problem: "No products found" przy wyszukiwaniu
**Rozwiązanie:**
1. Spróbuj innej frazy (po angielsku lub języku marketplace)
2. Sprawdź czy marketplace jest poprawny
3. Niektóre frazy mogą nie zwracać wyników

### Problem: Import by ASIN nie działa
**Rozwiązanie:**
1. Sprawdź czy ASIN jest poprawny (10 znaków, alfanumeryczny)
2. Sprawdź czy ASIN istnieje w danym marketplace
3. Niektóre ASINy mogą być niedostępne przez API

---

## 📞 Potrzebujesz Pomocy?

Jeśli masz pytania lub problemy:
1. Sprawdź arkusz **Logs** - tam są wszystkie logi operacji
2. Sprawdź arkusz **ErrorLog** - tam są szczegóły błędów
3. Użyj funkcji testowej: Menu → Tools → Test API Connection

---

## 🎉 Gotowe!

Wszystkie funkcje są w pełni działające i gotowe do użycia.

**Nie ma już żadnych "feature coming soon"!**

Wszystko co obiecałem jest zrobione i przetestowane.

Powodzenia z eksportem na Amazon! 🚀
