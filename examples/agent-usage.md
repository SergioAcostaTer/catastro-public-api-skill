# Agent usage patterns

## Intent routing

### "Tell me the public cadastral data for RC 2749704YJ0624N0001DI"

Tool path:

1. Normalize RC.
2. Call `Consulta_DNPRC` / `propertyByReference`.
3. Return non-protected fields only.

### "Which parcel is at 40.4168, -3.7038?"

Interpret conventional user input as latitude, longitude, then map to Catastro's coordinate service as:

- `CoorX=-3.7038` (longitude)
- `CoorY=40.4168` (latitude)
- `SRS=EPSG:4326`

Call `Consulta_RCCOOR`.

### "Give me the polygon for this cadastral reference"

1. Normalize to 14-character parcel RC.
2. Call WFS CP `GetParcel`.
3. Parse GML geometry.
4. Return/convert geometry to the format your app needs, preserving the source CRS or explicitly transforming it.

### "What parcels border this one?"

Use WFS CP `GetNeighbourParcel` with the 14-character parcel RC.

### "Show buildings on this parcel"

Use WFS BU:

- `GetBuildingByParcel`
- optionally `GetBuildingPartByParcel`
- optionally `GetOtherBuildingByParcel`

### "Find a property at this street address"

If all fields are known and valid, call `Consulta_DNPLOC`. If the user gave fuzzy/free-text address data, progressively resolve:

1. municipality,
2. street,
3. number,
4. final property query.

Do not silently choose among multiple candidates.

## Tool-result normalization

Do not force the raw Catastro JSON into a fragile strongly typed schema. It mirrors a nested XML model and can contain optional/list variants.

Recommended adapter output:

```json
{
  "ok": true,
  "source": "Dirección General del Catastro",
  "operation": "Consulta_DNPRC",
  "query": {"refCat": "..."},
  "raw": {"...": "official response"},
  "normalized": {
    "reference": "...",
    "address": "...",
    "use": "...",
    "surfaceM2": null,
    "year": null
  },
  "warnings": []
}
```

Keep `raw` available for debugging and future schema changes, but only expose necessary fields to end users.

## Retry and timeout policy

Suggested defaults:

- connect/read timeout: 10-15 seconds,
- retry only network errors and 5xx responses,
- maximum 1-2 retries with exponential backoff,
- no retries on Catastro validation/domain errors without changing input.

## Caching

Good candidates for moderate caching:

- province list,
- municipality lists,
- street-directory lookups.

Use a shorter TTL for property/geometry data because cadastral data can change.

## Security

- Treat address/RC input as untrusted.
- Use URL/query builders, never raw string concatenation.
- Log enough for debugging but avoid unnecessary personal context around property queries.
- Do not add protected-data scraping or authentication bypasses to this skill.
