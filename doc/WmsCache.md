# WMS Tiles & Legends Cache Architecture

This document describes how CloudFront is used to selectively cache WMS map tiles and legend images while keeping all other WMS requests uncached and forwarded directly to the origin.

The design separates cache identity from origin request shape, allowing efficient caching without modifying the WMS/THREDDS origin or exposing redirects to clients.

---

## Objectives

- Cache WMS map tiles derived from XYZ requests
- Cache WMS legend images
- Prevent caching of raw `/thredds/*` WMS requests
- Avoid cache fragmentation caused by query string ordering
- Keep edge compute cost and latency minimal
- Maintain a clean, WMS-compliant origin interface

---

## Background: How CloudFront Caches Files

### Edge Locations and the Cache Key

CloudFront is a CDN — it runs hundreds of **edge locations** globally. When a user makes a request, CloudFront routes it to the nearest edge. The edge checks its local cache using a **cache key** built from:

- The request path (e.g. `/tiles/5/28/19/...`)
- Optionally: selected query string parameters, headers, or cookies (configured per behaviour)

If the cache key matches a stored entry → **cache HIT**, the edge returns the cached response immediately without contacting the origin.

If no match → **cache MISS**, the edge forwards the request to the origin, caches the response, then returns it.

```
Browser
  │
  ▼
CloudFront Edge (nearest to user)
  ├── HIT  → return cached response (origin never contacted)
  └── MISS → forward to origin → cache response → return to browser
                    │
                    ▼
              THREDDS origin
```

### Cache Key vs Origin Request

A critical distinction: **the cache key URL and the origin request URL can be different**.

CloudFront evaluates the cache key first using the original client URL. On a miss, edge functions (Lambda@Edge or CloudFront Functions) can rewrite the request before it reaches the origin. The origin receives the rewritten URL; the cache stores the response under the original key. This means caching can be made explicit and intentional — the client uses a clean, stable address while the origin receives whatever protocol it actually understands.

### Behaviours and Cache Policies

CloudFront **behaviours** are path-pattern rules that control how requests are handled. Each behaviour specifies:

- Which **cache policy** to apply (`CachingEnabled`, `CachingDisabled`, or a custom policy)
- Which **edge functions** to attach (Lambda@Edge or CloudFront Functions)
- Which query string parameters, headers, and cookies to include in the cache key

Behaviours are evaluated in order — the first matching pattern wins.

| Behaviour    | Cache policy | Edge function                        |
| ------------ | ------------ | ------------------------------------ |
| `/tiles/*`   | Enabled      | Lambda@Edge (origin-request)         |
| `/legends/*` | Enabled      | CloudFront Function (viewer-request) |
| `/thredds/*` | Disabled     | None                                 |
| `*`          | Disabled     | None                                 |

### Edge Function Types

CloudFront has two types of edge compute, each running at a different point in the request lifecycle:

```
Browser → [viewer-request] → CloudFront cache check → [origin-request] → Origin
                                                                        ↓
Browser ← [viewer-response] ← CloudFront cache store ← [origin-response] ←
```

| Type                    | Runs at                          | Runs on cache hit? | Max execution time | Use case                                                           |
| ----------------------- | -------------------------------- | ------------------ | ------------------ | ------------------------------------------------------------------ |
| **CloudFront Function** | viewer-request / viewer-response | Yes                | 1 ms               | Lightweight rewrites, header manipulation, cache key normalisation |
| **Lambda@Edge**         | origin-request / origin-response | No (miss only)     | 5 s                | Heavy computation, BBOX conversion, external calls                 |

This is why the two functions in this architecture use different types:

- `imoslive_legends_path_modify` is a **CloudFront Function** at **viewer-request** — it must run on every request, including cache hits, because it needs to normalise the URL _before_ CloudFront evaluates the cache key. If it ran at origin-request (cache-miss only), CloudFront would already have performed the cache lookup against the un-normalised URL — fragmentation would still occur even though the origin eventually receives a normalised request.

- `imoslive-thredds-xyz-to-wms` is a **Lambda@Edge** at **origin-request** — it only runs on cache misses. The BBOX computation is expensive and unnecessary on hits: the cache key is the stable XYZ address, so CloudFront can serve cached tiles without recomputing anything.

### TTL and Cache Invalidation

CloudFront respects `Cache-Control` headers from the origin to determine how long to store a response (`max-age`). When ocean data is updated on THREDDS, cached tiles for the affected date must be explicitly invalidated via the CloudFront API or AWS Console — CloudFront will not automatically re-fetch them until TTL expires.

---

## Background: How the XYZ Tile System Works

### The World as a Grid

At zoom level 0, the entire world fits in a single 256×256 tile. Each additional zoom level doubles the grid in both dimensions:

```
Z=0: 1×1 tiles      Z=1: 2×2 tiles      Z=2: 4×4 tiles
┌────────┐          ┌────┬────┐          ┌──┬──┬──┬──┐
│        │          │    │    │          ├──┼──┼──┼──┤
│  0/0/0 │          │    │    │          ├──┼──┼──┼──┤
│        │          ├────┼────┤          ├──┼──┼──┼──┤
│        │          │    │    │          └──┴──┴──┴──┘
└────────┘          └────┴────┘
```

At zoom level N there are 2ⁿ × 2ⁿ tiles. Every tile is always 256×256 pixels — more zoom means more tiles covering smaller areas, not larger images.

### What Mapbox Does

Mapbox calculates which tiles are in view and fetches them by address `/{z}/{x}/{y}`. Each returns a 256×256 PNG. Mapbox stitches them together on screen. The browser only ever fetches the tiles currently visible.

### The Protocol Mismatch with WMS

WMS does not understand XYZ. It only understands:

> "Give me an image of **this geographic area** (`BBOX`), at **this pixel size** (`WIDTH`×`HEIGHT`)"

- **`BBOX`** — the geographic bounding box (`minX,minY,maxX,maxY`) in CRS units (metres for EPSG:3857). Defines _where_ on Earth to render.
- **`WIDTH`/`HEIGHT`** — pixel dimensions of the output image. Defines _how many pixels_ represent that area.

```
BBOX        = the window frame (geographic extent)
WIDTH       = how many pixel columns fill that frame
HEIGHT      = how many pixel rows fill that frame
```

The server rasterises its data to fill exactly `WIDTH×HEIGHT` pixels over the `BBOX` region and returns a PNG. Without both parameters it cannot allocate a pixel grid.

This is why the Lambda@Edge function exists: Mapbox speaks XYZ, THREDDS speaks WMS. The Lambda bridges them by computing the BBOX from the tile coordinates and injecting fixed `256×256` dimensions.

### Downsampling and Visual Fidelity

At low zoom levels a single tile covers a large geographic area. A dense NetCDF source may have thousands of data points within one tile's BBOX, all collapsed into 256×256 pixels. The server downsamples (nearest-neighbour or bilinear), so some fine detail is lost mathematically.

This is an accepted trade-off:

- At Z=5 (continental scale) the user cannot visually distinguish adjacent data points — they would appear as the same colour regardless.
- As zoom increases, the BBOX shrinks, fewer source points fall within each tile, and the downsampling ratio naturally improves.
- The tile pyramid is co-designed with the pixel size so that 256px is visually sufficient at every zoom level.

WMS tiles are for **visual representation**, not data extraction.

---

## High-Level Request Flow

```
Client
|
| /tiles/{z}/{x}/{y}/thredds/wms/...
| /legends/thredds/wms/...
v
CloudFront
├── Behavior: /tiles/*
│   ├── Lambda@Edge (origin-request)
│   ├── Cache ENABLED
│   └── Rewrite → /thredds/wms/... + WMS GetMap params
│
├── Behavior: /legends/*
│   ├── CloudFront Function (viewer-request)
│   ├── Cache ENABLED
│   └── Rewrite → /thredds/wms/...
│
└── Behavior: /thredds/*
    ├── No rewrite
    └── Cache DISABLED
```

| Path                             | Cache key                            | What origin receives                   |
| -------------------------------- | ------------------------------------ | -------------------------------------- |
| `/tiles/5/28/19/thredds/wms/...` | XYZ path + query string              | `/thredds/wms/...` + computed BBOX     |
| `/legends/thredds/wms/...`       | `/legends/...` + sorted query string | `/thredds/wms/...` + same sorted query |
| `/thredds/...`                   | — (not cached)                       | forwarded as-is                        |

---

## CloudFront Behaviors

| Path Pattern | Cache    | Purpose                        |
| ------------ | -------- | ------------------------------ |
| `/tiles/*`   | Enabled  | Cached XYZ → WMS tile requests |
| `/legends/*` | Enabled  | Cached WMS legend images       |
| `/thredds/*` | Disabled | Raw WMS passthrough            |
| `*`          | Disabled | Frontend / misc                |

> **Note:** Behavior order is critical: `/tiles/*` and `/legends/*` must be evaluated before `/thredds/*`.

---

## `/tiles/*` – WMS Tile Caching

### Client Request

```
/tiles/{z}/{x}/{y}/thredds/wms/IMOS/...nc
```

### Edge Processing

**Lambda@Edge (origin-request)**
Function: `imoslive-thredds-xyz-to-wms`

This function runs only on cache miss and performs the following:

1. Extract `{z, x, y}` from the request path
2. Convert XYZ tile coordinates to an EPSG:3857 BBOX
3. Inject required WMS parameters:
   - `SERVICE=WMS`
   - `REQUEST=GetMap`
   - `BBOX`
   - `WIDTH=256`
   - `HEIGHT=256`
4. Rewrite the request URI to: `/thredds/wms/IMOS/...nc`
5. Forward the rewritten request to the origin

### Cache Key and Rewrite Example

Mapbox needs stable, predictable tile URLs as cache keys. WMS only accepts BBOX-based requests — floating-point coordinates are imprecise and arrive in unpredictable forms, making them poor cache keys. The solution: **cache by clean XYZ address, forward as WMS BBOX**.

```
Browser → CloudFront (cache key)
GET /tiles/5/28/19/thredds/wms/IMOS/GSLA/NRT00/...nc
    ?LAYERS=sea_level&STYLES=boxfill/rainbow&CRS=EPSG:3857

                    ↓ cache MISS → Lambda@Edge rewrites

CloudFront → THREDDS origin
GET /thredds/wms/IMOS/GSLA/NRT00/...nc
    ?SERVICE=WMS&REQUEST=GetMap
    &BBOX=10018754.17,3503549.84,11271098.44,4694705.75
    &WIDTH=256&HEIGHT=256
    &LAYERS=sea_level&STYLES=boxfill/rainbow&CRS=EPSG:3857

                    ↓ cache HIT (same tile, second request)

Browser → CloudFront returns cached PNG immediately
    (Lambda never runs again for this tile)
```

The THREDDS origin is never aware that tiles exist — it only ever sees valid WMS requests.

---

## `/legends/*` – WMS Legend Caching

### Client Request

```
/legends/thredds/wms/IMOS/...nc?REQUEST=GetLegendGraphic&...
```

### Edge Processing

**CloudFront Function (viewer-request)**
Function: `imoslive_legends_path_modify`

This function runs before cache key evaluation and performs:

1. Removal of the `/legends` prefix
2. Canonicalization of query string parameter ordering
3. No semantic changes to query parameters

Resulting rewrite:

```
/legends/thredds/wms/... → /thredds/wms/...
```

### Why Canonicalization Is Required

CloudFront cache keys are order-sensitive — `?A=1&B=2` and `?B=2&A=1` are treated as different keys even though they represent the same request. Without canonicalisation, the same legend produces multiple cache entries (cache fragmentation).

The CloudFront Function runs **before** cache key evaluation and sorts all query parameters alphabetically, so both requests resolve to the same cache entry:

```
Request A:  /legends/thredds/wms/...nc?LAYERS=sea_level&STYLES=boxfill/rainbow&REQUEST=GetLegendGraphic
Request B:  /legends/thredds/wms/...nc?REQUEST=GetLegendGraphic&STYLES=boxfill/rainbow&LAYERS=sea_level

                    ↓ imoslive_legends_path_modify canonicalises both to:

Canonical cache key:  /legends/thredds/wms/...nc?LAYERS=sea_level&REQUEST=GetLegendGraphic&STYLES=boxfill/rainbow
```

The `/legends` prefix is stripped before forwarding to the origin:

```
Cache key (browser):  /legends/thredds/wms/...nc?LAYERS=sea_level&REQUEST=GetLegendGraphic&...
Origin request:       /thredds/wms/...nc?LAYERS=sea_level&REQUEST=GetLegendGraphic&...
```

---

## `/thredds/*` – Non-Cached WMS Passthrough

### Purpose

- Serve interactive or highly dynamic WMS requests
- Avoid unbounded cache cardinality
- Preserve correctness for user-driven queries

### Configuration

- **Cache policy:** `CachingDisabled`
- No edge rewrite
- Direct origin request

---

## Function Reference

### `imoslive-thredds-xyz-to-wms` (Lambda@Edge)

Deployed as an origin-request Lambda@Edge. Rewrites XYZ tile paths to WMS `GetMap` requests with a computed EPSG:3857 BBOX.

```js
const EARTH_RADIUS = 6378137;
const MAX_EXTENT = Math.PI * EARTH_RADIUS;

const PRECISION = 100;

function xyzToBbox(z, x, y) {
  const tileCount = Math.pow(2, z);
  const tileSize = (2 * MAX_EXTENT) / tileCount;

  let minX = -MAX_EXTENT + x * tileSize;
  let maxX = -MAX_EXTENT + (x + 1) * tileSize;
  let maxY = MAX_EXTENT - y * tileSize;
  let minY = MAX_EXTENT - (y + 1) * tileSize;

  minX = Math.round(minX * PRECISION) / PRECISION;
  minY = Math.round(minY * PRECISION) / PRECISION;
  maxX = Math.round(maxX * PRECISION) / PRECISION;
  maxY = Math.round(maxY * PRECISION) / PRECISION;

  return `${minX},${minY},${maxX},${maxY}`;
}

function parseTilePath(uri) {
  const match = uri.match(/^\/tiles\/(\d+)\/(\d+)\/(\d+)(\/thredds\/wms\/.+)$/);

  if (!match) {
    return null;
  }

  const z = parseInt(match[1], 10);
  const x = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);
  const wmsPath = match[4];

  if (isNaN(z) || isNaN(x) || isNaN(y)) {
    return null;
  }

  const maxTile = Math.pow(2, z) - 1;
  if (z < 0 || z > 22 || x < 0 || x > maxTile || y < 0 || y > maxTile) {
    return null;
  }

  return { z, x, y, wmsPath };
}

function parseQueryString(querystring) {
  if (!querystring) return {};

  const params = {};
  querystring.split('&').forEach(pair => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex > 0) {
      const key = decodeURIComponent(pair.substring(0, eqIndex));
      const value = decodeURIComponent(pair.substring(eqIndex + 1));
      params[key] = value;
    } else if (pair) {
      params[decodeURIComponent(pair)] = '';
    }
  });
  return params;
}

function buildWmsQueryString(tile, queryParams) {
  const bbox = xyzToBbox(tile.z, tile.x, tile.y);

  const params = { ...queryParams };

  if (!params.service && !params.SERVICE) {
    params.service = 'WMS';
  }
  if (!params.request && !params.REQUEST) {
    params.request = 'GetMap';
  }

  delete params.bbox;
  delete params.BBOX;
  params.BBOX = bbox;

  if (!params.width && !params.WIDTH) {
    params.width = '256';
  }
  if (!params.height && !params.HEIGHT) {
    params.height = '256';
  }

  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  return queryParts.join('&');
}

export const handler = async event => {
  try {
    const request = event.Records[0].cf.request;
    const uri = request.uri;

    if (!uri.startsWith('/tiles/')) {
      return request;
    }

    const tile = parseTilePath(uri);

    if (!tile) {
      console.log(`Invalid tile path, passing through: ${uri}`);
      return request;
    }

    const querystring = request.querystring || '';
    const queryParams = parseQueryString(querystring);

    const wmsQuery = buildWmsQueryString(tile, queryParams);

    request.uri = tile.wmsPath;
    request.querystring = wmsQuery;

    var bboxMatch = wmsQuery.match(/BBOX=([^&]+)/);
    console.log(
      JSON.stringify({
        action: 'rewrite',
        originalUri: uri,
        newUri: tile.wmsPath,
        bbox: bboxMatch ? bboxMatch[1] : 'not found',
      }),
    );

    return request;
  } catch (error) {
    console.error('Lambda@Edge error:', error.message, error.stack);
    return event.Records[0].cf.request;
  }
};
```

---

### `imoslive_legends_path_modify` (CloudFront Function)

Deployed as a viewer-request CloudFront Function. Strips the `/legends` prefix and canonicalizes query string key order before cache key evaluation.

```js
function handler(event) {
  var request = event.request;

  if (request.uri.startsWith('/legends/')) {
    request.uri = request.uri.replace('/legends', '');
  }

  // Canonicalize query order
  var qs = request.querystring || {};
  var keys = Object.keys(qs).sort();
  var canonical = {};

  for (var i = 0; i < keys.length; i++) {
    canonical[keys[i]] = qs[keys[i]];
  }

  request.querystring = canonical;
  return request;
}
```
