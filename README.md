# Catastro Public API AI Skill

A ready-to-drop skill for AI/agent projects that need Spain's public cadastral services.

## What is included

- `SKILL.md` — compact operational instructions for the AI.
- `references/endpoints.md` — all public WCF street/property/coordinate operations, including JSON, XML REST, SOAP/WSDL bases.
- `references/inspire.md` — WMS, WFS CP/AD/BU, stored queries, feature types, CRS options, and ATOM feeds.
- `references/data-model.md` — important cadastral concepts and response fields.
- `references/errors.md` — documented public-service error codes and handling guidance.
- `references/street-types.md` — complete Catastro street-type abbreviation table.
- `references/legal-and-limits.md` — protected-data boundaries, geographic scope, WMS/WFS limits, licensing notes.
- `schemas/catastro-tools.json` — generic JSON Schema tool definitions for an LLM agent.
- `schemas/endpoints.json` — machine-readable registry of all service bases/operations.
- `openapi/catastro-public-json.openapi.yaml` — OpenAPI 3.1 description of the public JSON GET operations.
- `src/javascript/catastro-client.mjs` — zero-dependency Node.js 18+ WCF client.
- `src/javascript/catastro-inspire.mjs` — WFS/WMS/ATOM helpers and GML fetcher.
- `src/python/catastro_client.py` — zero-dependency Python 3 WCF client.
- `src/python/catastro_inspire.py` — WFS/WMS/ATOM helpers and GML fetcher.
- `examples/agent-usage.md` — routing examples and suggested architecture.

## Quick install

Copy the directory into your project:

```text
my-project/
  skills/
    catastro-public-api/
      SKILL.md
      references/
      schemas/
      src/
```

Then make `SKILL.md` available to your AI when the user asks about cadastral references, Catastro, parcel geometry, cadastral coordinates, buildings, or cadastral addresses.

## JavaScript example

```js
import { CatastroClient } from "./skills/catastro-public-api/src/javascript/catastro-client.mjs";

const catastro = new CatastroClient();

const property = await catastro.propertyByReference({
  refCat: "2749704YJ0624N0001DI"
});

console.log(property);
```

Coordinate -> cadastral reference:

```js
const result = await catastro.referenceAtCoordinates({
  x: -3.7038,
  y: 40.4168,
  srs: "EPSG:4326"
});
```

## Python example

```python
from catastro_client import CatastroClient

catastro = CatastroClient()
result = catastro.property_by_reference("2749704YJ0624N0001DI")
print(result)
```

## Recommended agent architecture

Use a small server-side adapter:

```text
User -> AI agent -> tool/function call -> CatastroClient -> official Catastro endpoint
                                        -> normalized result -> AI answer
```

This keeps endpoint details, retries, input validation, and logging out of the model prompt.

## Public vs protected data

The free public service provides non-protected cadastral information. It does not expose owner identity or cadastral value. If your product needs protected data, that is a separate authenticated/authorized Catastro integration and is intentionally outside this public skill.

## Important production notes

- Use HTTPS.
- Set conservative request timeouts and limited retries.
- Do not interpret an HTTP 200 response as automatic success; Catastro can report domain errors in the response body.
- For exact parcel geometry, use WFS CP, not the centroid coordinate service.
- For bulk data, use ATOM feeds instead of repeatedly scraping WMS or making thousands of point queries.
- The DGC's ordinary scope excludes Navarra and the Basque Country.
- Review `references/legal-and-limits.md` before redistributing cadastral data.

## Official documentation checked

This package was prepared against the DGC's current public-service documentation available in September 2026, including the public-services document version 2.62 and the official live WCF help pages. See `references/sources.md` for source URLs.
