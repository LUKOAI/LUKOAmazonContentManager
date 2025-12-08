# Amazon SP-API Complete Field Mapping Reference

**Amazon's Selling Partner API provides access to 8 major endpoint categories** with distinct field schemas, validation rules, and access permissions. This comprehensive reference documents every available field across Catalog, Listings, Pricing, Inventory, Media, A+ Content, Orders, and Reports APIs—with specific attention to the German marketplace (A1PA6795UKMFR9) and EU requirements.

---

## Catalog Items API v2022-04-01

The Catalog Items API retrieves read-only product catalog data with **5 requests/second** rate limits. Two primary operations exist: `searchCatalogItems` (max 20 identifiers or keywords per request) and `getCatalogItem` (single ASIN lookup).

### includedData parameter values

| Value | Description | Access Level |
|-------|-------------|--------------|
| `summaries` | Title, brand, manufacturer, classification (default) | All sellers |
| `attributes` | Full product attributes as JSON | Brand owners only |
| `classifications` | Browse nodes with hierarchy | All |
| `dimensions` | Item and package dimensions/weight | All |
| `identifiers` | UPC, EAN, ISBN, GTIN codes | All |
| `images` | Product images with variants | All (MAIN only); Brand owners (all) |
| `productTypes` | Product type classification | All |
| `relationships` | Variation parent/child data | All |
| `salesRanks` | Category sales rankings | All |
| `vendorDetails` | Brand codes, replenishment | Vendors only |

### Core response fields

The **summaries** object contains the most commonly needed catalog data:

| Field | Type | Description |
|-------|------|-------------|
| `asin` | string | Amazon Standard Identification Number |
| `itemName` | string | Product title |
| `brand` | string | Brand name |
| `manufacturer` | string | Manufacturer name |
| `modelNumber` | string | Model number |
| `color` | string | Color variant |
| `size` | string | Size variant |
| `itemClassification` | enum | `BASE_PRODUCT`, `VARIATION_PARENT`, `PRODUCT_BUNDLE`, `OTHER` |
| `releaseDate` | date | Product release date (YYYY-MM-DD) |
| `packageQuantity` | integer | Units per package |
| `adultProduct` | boolean | Adult content flag |
| `tradeInEligible` | boolean | Trade-in program eligibility |

### Identifier types supported

Search by `ASIN`, `EAN`, `GTIN`, `ISBN`, `JAN`, `MINSAN`, `SKU` (requires sellerId), or `UPC`. For EU markets, **EAN is most common**.

### Image variants returned

| Variant Code | Description |
|--------------|-------------|
| `MAIN` | Primary product image |
| `PT01`-`PT08` | Additional product images |
| `SWCH` | Swatch/color selection image |

---

## Listings Items API v2021-08-01

The Listings API enables **create, read, update, and delete** operations on product listings. Rate limit: **5 requests/second**.

### Request structure for putListingsItem

```json
{
  "productType": "SHIRT",
  "requirements": "LISTING",
  "attributes": { /* Product Type Definition schema */ }
}
```

The `requirements` parameter accepts `LISTING` (full), `LISTING_PRODUCT_ONLY` (product facts), or `LISTING_OFFER_ONLY` (offer on existing ASIN).

### Product identity attributes

| Attribute | Type | Max Length | Required | Writability |
|-----------|------|-----------|----------|-------------|
| `item_name` | string | 200 chars (up to 500 by category) | Yes | Create & Update |
| `brand` | string | - | Yes | **Create only** |
| `manufacturer` | string | - | Category-dependent | Create & Update |
| `model_number` | string | - | No | Create & Update |
| `product_description` | string | 2000 chars | Most categories | Create & Update |

### Multi-language field structure

All localized text fields follow this pattern:

```json
{
  "item_name": [{
    "value": "Produktname",
    "language_tag": "de_DE",
    "marketplace_id": "A1PA6795UKMFR9"
  }]
}
```

**EU language tags**: `de_DE` (Germany), `fr_FR` (France), `it_IT` (Italy), `es_ES` (Spain), `nl_NL` (Netherlands), `pl_PL` (Poland), `sv_SE` (Sweden).

### Bullet points specification

| Property | Sellers | Vendors |
|----------|---------|---------|
| Max items | 5 | 10 |
| Max length per bullet | 500 chars | 250-255 chars |
| Recommended | 150-200 chars | 150-200 chars |

### Image field names

| Field | Purpose |
|-------|---------|
| `main_product_image_locator` | Primary product image (required) |
| `other_product_image_locator_1` through `_8` | Additional images |
| `swatch_product_image_locator` | Color/variant swatch |
| `main_offer_image_locator` | Offer-specific main |
| `other_offer_image_locator_1` through `_5` | Offer-specific additional |

Images must be **HTTPS URLs** or **S3 URIs** (require IAM role grant to `arn:aws:iam::368641386589:role/Media-Download-Role`).

### Variation/parent-child fields

```json
{
  "parentage_level": [{"value": "parent"}],
  "variation_theme": [{"name": "SIZE/COLOR"}],
  "child_parent_sku_relationship": [{
    "child_relationship_type": "variation",
    "parent_sku": "PARENT-SKU-123"
  }]
}
```

### Pricing and inventory fields

**purchasable_offer** structure:
```json
{
  "currency": "EUR",
  "marketplace_id": "A1PA6795UKMFR9",
  "our_price": [{"schedule": [{"value_with_tax": 29.99}]}],
  "discounted_price": [{"schedule": [{"value_with_tax": 24.99, "start_at": "2025-01-01", "end_at": "2025-01-31"}]}]
}
```

**fulfillment_availability** structure:
```json
{
  "fulfillment_channel_code": "DEFAULT",
  "quantity": 100,
  "lead_time_to_ship_max_days": 3
}
```

Fulfillment codes: `DEFAULT` (MFN), `AMAZON_EU` (FBA Europe), `AMAZON_NA`, `AMAZON_JP`.

### Create-only vs updateable fields

| Field Category | Create-Only | Updateable |
|----------------|-------------|------------|
| Brand | ✅ | ❌ |
| Product Type | ✅ | ❌ |
| GTIN/UPC/EAN | ✅ | ❌ |
| Title, bullets, description | | ✅ |
| Images, price, quantity | | ✅ |

### EU compliance fields

| Field | Purpose |
|-------|---------|
| `supplier_declared_dg_hz_regulation` | Dangerous goods declaration |
| `country_of_origin` | ISO 3166-1 alpha-2 code |
| `batteries_required` | Battery indicator |
| `is_lithium_battery` | Lithium battery flag |

**WEEE registration** and **EPR compliance** require upload through Seller Central's EPR Compliance Portal—not available via API.

---

## Product Pricing API v2022-05-01

The Pricing API provides competitive intelligence with **0.033 requests/second** rate limit (batch endpoints).

### getCompetitiveSummary fields

Request `includedData` options: `featuredBuyingOptions`, `lowestPricedOffers`, `referencePrices`.

**Featured Buying Options (Buy Box data)**:

| Field | Type | Description |
|-------|------|-------------|
| `buyingOptionType` | enum | NEW, USED, COLLECTIBLE, REFURBISHED |
| `segmentedFeaturedOffers[].customerMembership` | enum | PRIME, NON_PRIME, DEFAULT |
| `segmentedFeaturedOffers[].glanceViewPercentage` | number | Page view percentage (0-100) |
| `segmentedFeaturedOffers[].fulfillmentType` | enum | AFN (FBA) or MFN (FBM) |
| `segmentedFeaturedOffers[].sellerId` | string | Seller identifier |
| `segmentedFeaturedOffers[].condition` | enum | Detailed condition |

**Price object structure**:

| Field | Type | Description |
|-------|------|-------------|
| `listingPrice.amount` | decimal | Product price (excludes shipping) |
| `listingPrice.currencyCode` | string | ISO 4217 (EUR, GBP, USD) |
| `shippingPrice.amount` | decimal | Shipping cost |
| `landedPrice.amount` | decimal | Total customer price |
| `points.pointsNumber` | integer | Amazon Points (primarily JP) |

**Lowest Priced Offers** returns top 20 offers with:

| Field | Description |
|-------|-------------|
| `feedbackCount` | Seller feedback ratings count |
| `feedbackRating` | Seller feedback percentage |
| `isFeaturedOffer` | Featured offer status |
| `isBuyBoxWinner` | Current Buy Box winner |
| `isFulfilledByAmazon` | FBA indicator |
| `primeInformation.isPrime` | Prime eligibility |

**Reference Prices** available:

| Name | Description |
|------|-------------|
| `CompetitivePrice` | Lowest external retailer price |
| `WasPrice` | 90-day median customer price |
| `msrpPrice` | Manufacturer's suggested price |
| `retailOfferPrice` | Amazon's price (last 14 days) |

### getFeaturedOfferExpectedPriceBatch

Returns target price recommendations for Buy Box eligibility:

| Field | Description |
|-------|-------------|
| `featuredOfferExpectedPrice.listingPrice` | Recommended price for Buy Box |
| `competingFeaturedOffer` | Current competitor's winning offer |
| `resultStatus` | VALID_FOEP, NO_COMPETING_OFFER, ASIN_NOT_ELIGIBLE |

### Competitor data limitations

Sellers **CAN** see: lowest prices, feedback ratings, fulfillment type, Prime status, Featured Offer status.

Sellers **CANNOT** see: competitor inventory levels, sales velocity, repricing strategies, historical win rates.

---

## FBA Inventory API v1

The `getInventorySummaries` endpoint retrieves FBA inventory data at **2 requests/second**. All data is **read-only**.

### Core inventory fields

| Field | Type | Description |
|-------|------|-------------|
| `asin` | string | Amazon Standard Identification Number |
| `fnSku` | string | Fulfillment Network SKU |
| `sellerSku` | string | Seller's Stock Keeping Unit |
| `condition` | string | NewItem, UsedLikeNew, etc. |
| `productName` | string | Localized product title |
| `totalQuantity` | integer | Total units in FC or inbound |
| `lastUpdatedTime` | datetime | Last inventory update |

### inventoryDetails breakdown (details=true)

| Field | Description |
|-------|-------------|
| `fulfillableQuantity` | Available for pick/pack/ship |
| `inboundWorkingQuantity` | Shipments being prepared |
| `inboundShippedQuantity` | In transit to FC |
| `inboundReceivingQuantity` | At FC being processed |

### reservedQuantity breakdown

| Field | Description |
|-------|-------------|
| `totalReservedQuantity` | Total reserved units |
| `pendingCustomerOrderQuantity` | Reserved for pending orders |
| `pendingTransshipmentQuantity` | Being transferred between FCs |
| `fcProcessingQuantity` | Sidelined for measurement/sampling |

### unfulfillableQuantity breakdown

| Field | Description |
|-------|-------------|
| `customerDamagedQuantity` | Damaged by customer returns |
| `warehouseDamagedQuantity` | Damaged at Amazon warehouse |
| `carrierDamagedQuantity` | Damaged in transit |
| `defectiveQuantity` | Identified as defective |
| `expiredQuantity` | Past expiration date |

### researchingQuantity breakdown

| Field | Description |
|-------|-------------|
| `researchingQuantityInShortTerm` | Short-term research |
| `researchingQuantityInMidTerm` | Medium-term research |
| `researchingQuantityInLongTerm` | Long-term research |

**FBA fee data** is NOT available via this API—use Product Fees API (`getMyFeesEstimateForSKU`) or Reports API (`GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA`).

---

## Images and Media

### Upload methods

**Primary method**: Listings Items API with hosted image URLs (HTTPS or S3). Amazon downloads images from your specified URLs.

**A+ Content images**: Use Uploads API (`createUploadDestinationForResource`) to get pre-signed S3 URL, upload binary data, then reference `uploadDestinationId`.

**Video uploads**: **Not supported via SP-API**—manual upload through Seller Central required.

**360-degree images**: **Discontinued** (November 2023). Convert to video or GLB 3D models.

### Image technical specifications

| Requirement | Standard Product Images |
|-------------|------------------------|
| Minimum size | 500px (1000px for zoom, 1600px recommended) |
| Maximum size | 10,000px |
| File formats | JPEG (preferred), PNG, TIFF, GIF (non-animated) |
| File size | Under 10MB (2MB recommended) |
| Color mode | sRGB (preferred) or CMYK |
| DPI | Minimum 72 |

### Main image requirements

- **Background**: Pure white (RGB 255,255,255 / #FFFFFF)
- **Product fill**: Must fill 85%+ of frame
- **Content**: Product only—no text, logos, watermarks, borders
- **Completeness**: Full product visible (not cropped)

### A+ Content image dimensions

| Module Type | Dimensions |
|-------------|------------|
| Company Logo | 600 × 180 px |
| Header Image Text | 970 × 600 px |
| Image Text Overlay | 970 × 300 px |
| Four Image Text | 220 × 200 px each |
| Four Image Quadrant | 135 × 135 px each |
| Three Image Text | 300 × 300 px each |
| Comparison Table | 150 × 300 px per product |

---

## A+ Content API v2020-11-01

Creates enhanced brand content with **10 requests/second** rate limit.

### Standard A+ module types (14 available)

| Module Type | API Field | Key Limits |
|-------------|-----------|------------|
| `STANDARD_COMPANY_LOGO` | `standardCompanyLogo` | 600×180 px image |
| `STANDARD_COMPARISON_TABLE` | `standardComparisonTable` | 1-6 products |
| `STANDARD_FOUR_IMAGE_TEXT` | `standardFourImageText` | 4 blocks, 220×200 px |
| `STANDARD_HEADER_IMAGE_TEXT` | `standardHeaderImageText` | 970×600 px, 6000 char body |
| `STANDARD_IMAGE_TEXT_OVERLAY` | `standardImageTextOverlay` | 970×300 px, 300 char body |
| `STANDARD_TECH_SPECS` | `standardTechSpecs` | 4-16 specifications |
| `STANDARD_TEXT` | `standardText` | 5000 char body |
| `STANDARD_THREE_IMAGE_TEXT` | `standardThreeImageText` | 3 blocks, 300×300 px |

### Character limits per module

| Module | Headline | Body |
|--------|----------|------|
| Header Image Text | 150 chars | 6000 chars |
| Four Image Text | 200 chars (module), 160 (block) | 1000 chars/block |
| Image Text Overlay | 70 chars | 300 chars |
| Tech Specs | 80 chars | 500 chars/spec |
| Text | 160 chars | 5000 chars |

### Premium A+ Content differences

| Feature | Basic A+ | Premium A+ |
|---------|----------|------------|
| Videos | ❌ | ✅ Full video support |
| Interactive elements | ❌ | Hotspots, carousels, Q&A |
| Mobile optimization | Standard | Dedicated mobile assets |
| Image sizes | Standard | Larger, full-width (1464×600) |
| Eligibility | Brand Registry | Brand Story + 5 approved projects |

### Content restrictions

**Prohibited**: Pricing/promotional details, customer reviews, competitor references, contact information, QR codes, unsubstantiated claims, off-Amazon references, HTML tags.

### Text decorator system

```json
{
  "value": "Bold text here",
  "decoratorSet": [{
    "type": "STYLE_BOLD",
    "offset": 0,
    "length": 14,
    "depth": 0
  }]
}
```

Decorator types: `STYLE_BOLD`, `STYLE_ITALIC`, `STYLE_UNDERLINE`, `LIST_ORDERED`, `LIST_UNORDERED`, `LIST_ITEM`.

---

## Orders API v0

The Orders API retrieves order data at **0.0167 requests/second** (burst: 20). All data is **read-only**.

### Order object fields

| Field | Type | Description |
|-------|------|-------------|
| `AmazonOrderId` | string | 3-7-7 format identifier |
| `PurchaseDate` | datetime | Order creation timestamp |
| `LastUpdateDate` | datetime | Last modification |
| `OrderStatus` | enum | Pending, Unshipped, Shipped, etc. |
| `FulfillmentChannel` | enum | AFN (FBA) or MFN |
| `OrderTotal` | Money | Total order value |
| `NumberOfItemsShipped` | integer | Items shipped count |
| `NumberOfItemsUnshipped` | integer | Items pending count |

### OrderStatus values

| Status | Description |
|--------|-------------|
| `PendingAvailability` | Pre-order awaiting release |
| `Pending` | Awaiting payment authorization |
| `Unshipped` | Ready for shipment |
| `PartiallyShipped` | Some items shipped |
| `Shipped` | All items shipped |
| `Canceled` | Order canceled |

### Boolean indicator fields

| Field | Description |
|-------|-------------|
| `IsBusinessOrder` | Amazon Business buyer |
| `IsPrime` | Seller-fulfilled Prime |
| `IsReplacementOrder` | Replacement for previous order |
| `IsAccessPointOrder` | Delivery to Amazon Hub |
| `HasRegulatedItems` | Contains regulated items |

### Order item fields

| Field | Type | Description |
|-------|------|-------------|
| `ASIN` | string | Product ASIN |
| `SellerSKU` | string | Seller's SKU |
| `OrderItemId` | string | Unique item identifier |
| `QuantityOrdered` | integer | Units ordered |
| `QuantityShipped` | integer | Units shipped |
| `ItemPrice` | Money | Item subtotal |
| `ItemTax` | Money | Tax on item |
| `PromotionDiscount` | Money | Promotion discount |
| `ConditionId` | string | New, Used, etc. |

### PII fields requiring Restricted Data Token

| Operation | RDT dataElements |
|-----------|------------------|
| `getOrderAddress` | `shippingAddress` |
| `getOrderBuyerInfo` | `buyerInfo` |
| `getOrder` (with PII) | `buyerInfo`, `shippingAddress`, `buyerTaxInformation` |

**Restricted fields**: `BuyerEmail`, `BuyerName`, `BuyerTaxInfo`, full `ShippingAddress` with phone.

### EU-specific order fields

| Field | Description |
|-------|-------------|
| `IossNumber` | Import One-Stop Shop VAT ID (EU imports) |
| `DeemedResellerCategory` | IOSS, UOSS, or marketplace-specific codes |
| `BuyerTaxInformation` | Business tax details (TR marketplace) |

### RDT request example

```json
POST /tokens/2021-03-01/restrictedDataToken
{
  "restrictedResources": [{
    "method": "GET",
    "path": "/orders/v0/orders/{orderId}",
    "dataElements": ["buyerInfo", "shippingAddress"]
  }]
}
```

RDT expires after **1 hour**.

---

## Reports API v2021-06-30

Creates and retrieves report documents via asynchronous processing.

### Key inventory reports

| Report Type | Format | Key Fields |
|-------------|--------|------------|
| `GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA` | TSV | sku, fnsku, asin, afn-fulfillable-quantity, afn-reserved-quantity, afn-inbound-* quantities |
| `GET_MERCHANT_LISTINGS_ALL_DATA` | TSV | item-name, seller-sku, price, quantity, asin, status, fulfillment-channel |
| `GET_FLAT_FILE_OPEN_LISTINGS_DATA` | TSV | sku, asin, price, quantity |

### Key order reports

| Report Type | Format | Key Fields |
|-------------|--------|------------|
| `GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL` | TSV | amazon-order-id, purchase-date, order-status, sku, quantity, item-price, ship-address fields |
| `GET_FLAT_FILE_ACTIONABLE_ORDER_DATA_SHIPPING` | TSV | **Requires RDT** - includes buyer-email, buyer-phone-number, recipient-name |
| `GET_XML_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL` | XML | Full order structure with FulfillmentData |

### Key FBA reports

| Report Type | Purpose |
|-------------|---------|
| `GET_FBA_INVENTORY_PLANNING_DATA` | Inventory health, age, LTSF projections |
| `GET_FBA_FULFILLMENT_INVENTORY_ADJUSTMENTS_DATA` | Inventory adjustments by reason |
| `GET_LEDGER_SUMMARY_VIEW_DATA` | End-to-end inventory reconciliation |
| `GET_FBA_STORAGE_FEE_CHARGES_DATA` | Monthly storage fees |
| `GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA` | Fee preview per SKU |

### Key financial reports

| Report Type | Purpose |
|-------------|---------|
| `GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE` | Settlement transactions (auto-generated) |
| `GET_DATE_RANGE_FINANCIAL_TRANSACTION_DATA` | Financial transactions by date |

### Schedule periods (ISO 8601)

`PT5M` (5 min), `PT15M`, `PT30M`, `PT1H`, `PT2H`, `PT4H`, `PT8H`, `PT12H`, `P1D`, `P2D`, `P3D`, `P1W`, `P2W`, `P1M`

### Report request example

```json
POST /reports/2021-06-30/reports
{
  "reportType": "GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA",
  "marketplaceIds": ["A1PA6795UKMFR9"],
  "dataStartTime": "2024-01-01T00:00:00Z",
  "dataEndTime": "2024-12-31T23:59:59Z"
}
```

---

## Rate limits summary

| API | Operation | Rate | Burst |
|-----|-----------|------|-------|
| Catalog Items | searchCatalogItems, getCatalogItem | 5/sec | 5 |
| Listings Items | putListingsItem, patchListingsItem | 5/sec | 5-10 |
| Product Pricing | getCompetitiveSummary, FOEP | 0.033/sec | 1 |
| FBA Inventory | getInventorySummaries | 2/sec | 2 |
| A+ Content | All operations | 10/sec | 10 |
| Orders | getOrders, getOrder | 0.0167/sec | 20 |
| Orders | getOrderItems | 0.5/sec | 30 |
| Reports | createReport | 0.0167/sec | 15 |
| Uploads | createUploadDestination | 10/sec | 10 |

---

## German marketplace specifications

**Marketplace ID**: `A1PA6795UKMFR9`  
**API Endpoint**: `sellingpartnerapi-eu.amazon.com`  
**Currency**: EUR  
**Language Tag**: `de_DE`  
**Locale**: `de-DE` (A+ Content)

### EU-specific compliance requirements

- **WEEE**: Upload via Seller Central EPR Compliance Portal
- **CE Marking**: Product/packaging must show CE mark with Responsible Person contact
- **Energy Labels**: Use `image_locator_eegl` (energy efficiency) and `image_locator_pfde` (product fiche)
- **IOSS**: Required for non-EU sellers shipping consignments ≤€150

### Pan-European FBA inventory tracking

Via Reports API, access fields:
- `afn-fulfillable-quantity-local` (local FC inventory)
- `afn-fulfillable-quantity-remote` (non-local FC via EFN)

---

## Critical implementation notes

1. **Product Type Definitions API**: Always retrieve current JSON schemas before creating listings—schemas are dynamic and marketplace-specific.

2. **PUT vs PATCH behavior**: `putListingsItem` replaces ALL attributes (omitted attributes are deleted); `patchListingsItem` updates only specified attributes.

3. **Data types matter**: `quantity` must be integer (not string), `value_with_tax` must be number (not string).

4. **Unit names**: Use full names (`"kilograms"`, `"centimeters"`) not abbreviations.

5. **Image URLs are immutable**: For S3 URLs, changing content requires new object key.

6. **Pending order limitations**: `getOrderItems` returns empty pricing/tax data for orders in Pending status.

7. **RDT requirement**: Since August 31, 2023, all PII access requires Restricted Data Token—LWA tokens no longer return PII.

8. **Settlement reports**: Cannot be created via API—automatically generated by Amazon and retrieved via `getReports`.

9. **XML/flat file image feeds deprecated**: July 31, 2025—migrate to JSON_LISTINGS_FEED or Listings Items API.

10. **Notifications integration**: Use `REPORT_PROCESSING_FINISHED`, `LISTINGS_ITEM_STATUS_CHANGE`, and `ANY_OFFER_CHANGED` notifications instead of polling.