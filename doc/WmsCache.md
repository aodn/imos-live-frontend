# WMS Tiles & Legends Cache Architecture

This document describes how CloudFront is used to selectively cache WMS map tiles and legend images while keeping all other WMS requests uncached and forwarded directly to the origin.

The design separates cache identity from origin request shape, allowing efficient caching without modifying the WMS/THREDDS origin or exposing redirects to clients.

## Objectives

- Cache WMS map tiles derived from XYZ requests
- Cache WMS legend images
- Prevent caching of raw `/thredds/*` WMS requests
- Avoid cache fragmentation caused by query string ordering
- Keep edge compute cost and latency minimal
- Maintain a clean, WMS-compliant origin interface

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

## CloudFront Behaviors

| Path Pattern | Cache    | Purpose                        |
| ------------ | -------- | ------------------------------ |
| `/tiles/*`   | Enabled  | Cached XYZ → WMS tile requests |
| `/legends/*` | Enabled  | Cached WMS legend images       |
| `/thredds/*` | Disabled | Raw WMS passthrough            |
| `*`          | Disabled | Frontend / misc                |

> **Note:** Behavior order is critical: `/tiles/*` and `/legends/*` must be evaluated before `/thredds/*`.

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

### Cache Key

- **Path:** `/tiles/{z}/{x}/{y}/...`
- **Query string:** full
- Cache identity is stable and tile-addressable

### Origin Request

```
/thredds/wms/IMOS/...nc?SERVICE=WMS&REQUEST=GetMap&BBOX=...
```

The origin is unaware that tiles exist.

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

CloudFront cache keys are order-sensitive:

```
?A=1&B=2 ≠ ?B=2&A=1
```

Canonical ordering ensures:

- A single cache entry per logical legend
- No silent cache fragmentation

### Cache Key

- **Path:** `/legends/thredds/wms/...`
- **Query string:** full, ordered
- Suitable for static or low-entropy legend requests

## `/thredds/*` – Non-Cached WMS Passthrough

### Purpose

- Serve interactive or highly dynamic WMS requests
- Avoid unbounded cache cardinality
- Preserve correctness for user-driven queries

### Configuration

- **Cache policy:** `CachingDisabled`
- No edge rewrite
- Direct origin request

## Design Rationale

### Why Not Cache `/thredds/*` Directly?

- WMS query parameters are high-cardinality
- Cache explosion risk is significant
- Cache intent is implicit and uncontrolled

Using `/tiles/*` and `/legends/*` makes caching explicit and intentional.

### Why Different Rewrite Stages?

| Path         | Rewrite Stage                | Reason                             |
| ------------ | ---------------------------- | ---------------------------------- |
| `/tiles/*`   | Origin request (Lambda@Edge) | Heavy computation, cache-miss only |
| `/legends/*` | Viewer request (CF Function) | Cache key normalization            |
