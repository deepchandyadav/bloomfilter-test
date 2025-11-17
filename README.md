# Run this app

```
npm install
npm run dev
```

```
open http://localhost:3000
```

# Redis – Bloom Filter

A **Bloom Filter** is an in-memory probabilistic data structure used to check whether an element *might* exist in a dataset.  
It is extremely space-efficient but may produce **false positives** (never false negatives).

---

## 📌 What a Bloom Filter Does

A Bloom filter uses multiple hash functions. For each item:

1. It generates several hash values (bit positions).
2. It sets those positions to `1` in an in-memory bit array.
3. To check if an item exists, it verifies whether all hash bit positions are set.

---

## 🧩 Example

### Hashing Usernames
- u1 = hash("deepchand.yadav") → [10, 15, 20]
- u2 = hash("piyush.yadav") → [10, 30, 40]

After inserting both users, the **in-memory bit array** becomes:
```
{ 10: 1, 15: 1, 20: 1, 30: 1, 40: 1 }
```


### Users Table

| ID | USERNAME        | PASSWORD       |
|----|-----------------|----------------|
| 1  | deepchand.yadav | 1324134adsfa   |
| 2  | piyush.yadav    | adfafqewr13    |

---

## 🔍 Checking If a Username Exists

Suppose we want to check whether the username **`deepchand2.yadav`** exists.

``` 
u3 = hash("deepchand2.yadav") → [11, 12, 18]
```

These positions are **not set** in the Bloom filter.  
➡️ **Conclusion:** The username definitely does *not* exist in the database.

---

## ⚠️ False Positives

Bloom filters may give **false positives**—cases where bits are set, but the item is not in the dataset.

Example:
```
u4 = hash("abc.pqr") → [10, 15, 30]
```

All these bit positions are already set, so the Bloom filter will incorrectly say:

> **The user might exist**, even though `abc.pqr` is not present in the database.

➡️ This is a **false positive**, which is expected behavior.

---

## ✅ Summary

- Bloom filters are **fast** and **memory-efficient**.
- They **never** produce false negatives.
- They *may* produce false positives.
- Redis provides support via the **RedisBloom** module.

---
