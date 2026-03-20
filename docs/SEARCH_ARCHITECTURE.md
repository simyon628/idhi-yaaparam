# Idhi Yaaparam Search Architecture

## 1. Indexing Strategy (Elasticsearch)

To achieve sub-second global search, we will utilize a dedicated search index (e.g., Elasticsearch or Typesense) that replicates documents from our primary Firestore database. 

### Recommended Mapping (`/listings` index)

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "itemName": { 
        "type": "text", 
        "analyzer": "standard_edge_ngram",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "description": { "type": "text", "analyzer": "standard" },
      "categoryId": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "listingType": { "type": "keyword" }, // "rent", "buy", "sell"
      "status": { "type": "keyword" }, // "available", etc.
      "pricePerHour": { "type": "double" },
      "pricePerDay": { "type": "double" },
      "fullPrice": { "type": "double" },
      "location": { "type": "geo_point" }, // for proximity scoring
      "collegeId": { "type": "keyword" }, 
      "sellerRating": { "type": "double" },
      "popularityScore": { "type": "double" }, // clicks + views + conversions
      "createdAt": { "type": "date" }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "standard_edge_ngram": {
          "tokenizer": "edge_ngram_tokenizer",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "edge_ngram_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  }
}
```

### Ingestion Pipeline
- **Sync Method**: Use Firebase Cloud Functions (Firestore triggers: `onCreate`, `onUpdate`, `onDelete`) to automatically index/update/remove documents in the Elasticsearch cluster.
- **Debouncing**: Keep a queue for highly updated fields (like views or `popularityScore`) to avoid spamming the index.

---

## 2. Query Understanding & Expansion Layer

When a user types a query (e.g., "cheap camra near me"):
1. **Normalization**: Lowercase, trim spaces.
2. **Intent Parsing**: 
   - Extract price hints ("cheap", "under 500").
   - Extract locational intent ("near me" -> boost proximity weight).
3. **Fuzzy Expansion**: Correct "camra" to "camera" using max edits distance `fuzziness: "AUTO"`.
4. **Synonym Injection**: Utilize a synonym graph filter at query time ("camera" -> "dslr", "camcorder").

---

## 3. The Ranking Algorithm

Every document `d` retrieved is given a `FINAL_SCORE`. 
The results must NEVER be returned unranked or randomly.

**Mathematical Formula:**
```
FINAL_SCORE(d) = (0.35 * S_text) + (0.25 * S_prox) + (0.15 * S_pop) + (0.15 * S_rate) + (0.10 * S_fresh)
```

### Component Definition (`0.0` to `1.0` normalized value)
1. **`S_text` (Text Relevance | 35%)**: 
   - BM25 score of `(title * 3.0) + (tags * 2.0) + (category * 1.5) + (description * 0.5)`
   - Normalized across the result set max score.
   
2. **`S_prox` (Proximity | 25%)**: 
   - An exponential decay function based on the distance between user `(lat, lng)` and item `location`.
   - `e^(-λ * distance)` where λ is calibrated so distance > 10km scores near `0`.
   - If user location is unknown, fallback to college matching binary score (`1.0` if same college, `0.0` otherwise).
   
3. **`S_pop` (Popularity | 15%)**:
   - `log(clicks + 1) / log(MAX_CLICKS)`, giving high weight to mid-tier popularity and smoothing viral hits.
   
4. **`S_rate` (Seller Rating | 15%)**: 
   - `rating / 5.0`. An unrated seller assumes `0.5` (2.5 stars equivalent) to not punish new users.
   
5. **`S_fresh` (Freshness | 10%)**: 
   - Linear or exponential decay based on `createdAt`. E.g., `1.0` for today, decaying to `0.1` after 30 days.

*Note: In Edge API simulation, we emulate these factors mathematically over the candidate document list retrieved from Firebase.*
