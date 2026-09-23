---
name: catastro-public-api
version: 1.0.0
description: Use Spain's Dirección General del Catastro public services to resolve cadastral references, addresses, coordinates, parcel geometry, neighboring parcels, buildings, addresses, maps, and bulk INSPIRE datasets without accessing protected owner/value data.
license-note: Uses official Spanish Cadastre public services. Review references/legal-and-limits.md before production use.
---

# Catastro Public API Skill

## Purpose

Use this skill when an AI agent needs public cadastral information from Spain's Dirección General del Catastro (DGC), including:

- Resolve a cadastral reference (Referencia Catastral / RC) from an address or coordinates.
- Retrieve non-protected property data from a cadastral reference, address, or rural polygon/parcel.
- Convert a cadastral parcel reference to a centroid coordinate.
- Find cadastral references near a coordinate.
- Retrieve exact cadastral parcel geometry, neighboring parcels, cadastral zones, INSPIRE addresses, buildings, building parts, or other constructions.
- Render cadastral map layers through WMS.
- Obtain municipality-level bulk INSPIRE datasets through ATOM.

The public services do **not** provide protected owner identity or cadastral value. Never invent, infer, or imply those fields are available from this skill.

## Primary endpoint choice

Choose the smallest service that directly satisfies the request:

1. **Property attributes from RC** -> `Consulta_DNPRC` on the public WCF JSON endpoint.
2. **Address -> property / RC** -> use the callejero flow (`ObtenerMunicipios`, `ObtenerCallejero`, `ObtenerNumerero`) when needed, then `Consulta_DNPLOC`.
3. **Rural polygon + parcel -> property** -> `Consulta_DNPPP`.
4. **Longitude/latitude -> parcel RC** -> `Consulta_RCCOOR` with `SRS=EPSG:4326`, `CoorX=longitude`, `CoorY=latitude`.
5. **RC -> centroid** -> `Consulta_CPMRC`; pass the 14-character parcel/finca RC, not an arbitrary 20-character unit RC.
6. **Nearby parcels from a point** -> `Consulta_RCCOOR_Distancia`.
7. **Exact parcel polygon** -> INSPIRE WFS CP stored query `GetParcel`.
8. **Parcel plus neighbors** -> INSPIRE WFS CP stored query `GetNeighbourParcel`.
9. **Buildings on parcel** -> INSPIRE WFS BU stored queries.
10. **Addresses for a parcel, postal code, or road** -> INSPIRE WFS AD stored queries.
11. **Map image / visual overlay** -> WMS. Do not use WMS as a substitute for vector geometry.
12. **Bulk municipality dataset** -> ATOM. Do not emulate bulk download by repeatedly querying or tiling WMS.

## Core public REST JSON bases

Use HTTPS.

- Names-based street directory/property service:
  `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json`
- Codes-based street directory/property service:
  `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejeroCodigos.svc/json`
- Coordinate service:
  `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/json`

See `references/endpoints.md` for every operation and parameter.

## Important behavior rules for the agent

- Treat public Catastro responses as authoritative cadastral-source data, but not as legal certification. Describe them as public cadastral information.
- Do not claim the public API returns owners, NIF/CIF, cadastral value, land value, or construction value.
- A full cadastral reference is normally 20 characters. Some services intentionally operate on the first 14 characters representing the parcel/finca.
- For geographic coordinates in the WCF coordinate service, the official documentation defines `X = longitude` and `Y = latitude`.
- Preserve the requested CRS/SRS and always state the SRS when returning coordinates.
- Do not confuse the WCF centroid with the full parcel polygon. Use WFS CP for geometry.
- URL-encode all query values, especially names with spaces/accents and values such as `EPSG:4326`.
- When an address lookup is ambiguous, return candidates instead of silently choosing one.
- When Catastro returns an application-level error inside a successful HTTP response, surface the Catastro error code/message; do not treat HTTP 200 as proof of a successful cadastral lookup.
- For WFS, respect BBOX/feature-count limits and use stored queries when a cadastral reference is known.
- For WMS, avoid tiled scraping or repeated mass image downloads. Use ATOM/WFS for data extraction.
- The DGC's general territorial scope excludes Navarra and the Basque Country; do not assume these endpoints cover those cadastral systems.

## Response strategy for AI answers

When presenting results to a user, clearly separate:

- `source`: Dirección General del Catastro public service
- `query`: the exact RC/address/coordinates used
- `result`: normalized human-readable fields
- `srs`: whenever coordinates or geometry are involved
- `limitations`: ambiguity, missing cartography, no protected data, or service errors

If exact legal proof/certification is needed, direct the user to the official Sede Electrónica del Catastro workflow rather than presenting a public API response as a certificate.

## Integration

For a generic agent project:

1. Copy this entire folder into your repository, e.g. `skills/catastro-public-api/`.
2. Load `SKILL.md` into the agent's system/developer context when Catastro-related intent is detected.
3. Expose the functions in `schemas/catastro-tools.json` as callable tools, mapping them to either `src/javascript/catastro-client.mjs` or `src/python/catastro_client.py`.
4. Let the agent read `references/endpoints.md` and `references/inspire.md` on demand rather than placing every detail in its permanent prompt.
5. Keep HTTP calls server-side where possible so you can enforce timeouts, logging, retries, and usage limits centrally.
6. Validate user input before calling the service; normalize cadastral references by removing spaces and uppercasing.
7. Add caching only where appropriate. Directory data can be cached more aggressively than property lookups.

See `README.md` for copy-paste examples.
