# Public WCF endpoints: street directory, non-protected property data, coordinates

## 1. Transport variants

The public WCF services expose three practical invocation styles:

- REST JSON GET: use `/json/<operation>`.
- REST XML GET/POST: use `/rest/<operation>`.
- SOAP: use `/soap`; WSDL is available with `?singleWsdl`.

For AI/tool integrations, REST JSON GET is usually the simplest. REST XML POST is useful when you want typed XML input/output. SOAP is mainly relevant to existing enterprise integrations.

### Names-based service

Base service:

`https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc`

- JSON help: `/json/help`
- XML REST help: `/rest/help`
- SOAP endpoint: `/soap`
- WSDL: `?singleWsdl`

### Codes-based service

Base service:

`https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejeroCodigos.svc`

- JSON help: `/json/help`
- XML REST help: `/rest/help`
- SOAP endpoint: `/soap`
- WSDL: `?singleWsdl`

### Coordinates service

Base service:

`https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc`

- JSON help: `/json/help`
- XML REST help: `/rest/help`
- SOAP endpoint: `/soap`
- WSDL: `?singleWsdl`

> Documentation naming note: the PDF documentation describes logical methods such as `ConsultaProvincia`, `ConsultaMunicipio`, `ConsultaVia`, and `ConsultaNumero`. The live REST help exposes the street-directory routes as `ObtenerProvincias`, `ObtenerMunicipios`, `ObtenerCallejero`, and `ObtenerNumerero`. For REST integrations, use the live `Obtener*` route names below.

---

## 2. Names-based REST JSON operations

Base:

`https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json`

### GET /ObtenerProvincias

Lists provinces covered by DGC.

Parameters: none.

### GET /ObtenerMunicipios

Query:

- `Provincia` — required province name as returned by the province list.
- `Municipio` — optional whole/partial municipality name; blank returns municipalities in the province.

### GET /ObtenerCallejero

Query:

- `Provincia` — required.
- `Municipio` — required.
- `TipoVia` — optional street-type abbreviation, e.g. `CL`, `AV`, `PZ`.
- `NomVia` — optional full/partial road name.

The current output also includes INE-related road/location identifiers.

### GET /ObtenerNumerero

Query:

- `Provincia` — required.
- `Municipio` — required.
- `TipoVia` — required.
- `NomVia` — required.
- `Numero` — required.

If the exact number does not exist, Catastro may return an error plus nearby number candidates.

### GET /Consulta_DNPLOC

Looks up non-protected cadastral data by address/localization.

Live REST query names:

- `Provincia` — required.
- `Municipio` — required.
- `Sigla` — required street-type abbreviation. This corresponds to the documentation's `TipoVia` concept.
- `Calle` — required street name. This corresponds to the documentation's `NomVia` concept.
- `Numero` — required.
- `Bloque` — optional.
- `Escalera` — optional.
- `Planta` — optional.
- `Puerta` — optional.

The service can return either a list of matching properties or, when the criteria identify one property, detailed non-protected data.

### GET /Consulta_DNPRC

Looks up non-protected cadastral data by cadastral reference.

Query:

- `RefCat` — required; accepts 14, 18, or 20 characters.
- `Provincia` — optional.
- `Municipio` — optional.

When a 14-character parcel/finca reference is supplied, the service can return the properties whose references share those first 14 characters.

### GET /Consulta_DNPPP

Looks up non-protected cadastral data by rural polygon/parcel.

Query:

- `Provincia` — required.
- `Municipio` — required.
- `Poligono` — required.
- `Parcela` — required.

---

## 3. Codes-based REST JSON operations

Base:

`https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejeroCodigos.svc/json`

### GET /ObtenerProvincias

No parameters.

### GET /ObtenerMunicipiosCodigos

- `CodigoProvincia` — required.
- `CodigoMunicipio` — optional DGC municipality code.
- `CodigoMunicipioINE` — optional INE municipality code.

### GET /ObtenerCallejeroCodigos

- `CodigoProvincia` — required.
- `CodigoMunicipio` or `CodigoMunicipioINE` — one municipality identifier is required.
- `CodigoVia` — optional DGC road code.

### GET /ObtenerNumereroCodigos

- `CodigoProvincia` — required.
- `CodigoMunicipio` or `CodigoMunicipioINE` — one required.
- `CodigoVia` — required.
- `Numero` — required.

### GET /Consulta_DNPLOC_Codigos

- `CodigoProvincia` — required.
- `CodigoMunicipio` or `CodigoMunicipioINE` — one required.
- `CodigoVia` — required.
- `Numero` — required.
- `Bloque` — optional.
- `Escalera` — optional.
- `Planta` — optional.
- `Puerta` — optional.

### GET /Consulta_DNPRC_Codigos

- `RefCat` — required, 14/18/20 characters.
- `CodigoProvincia` — optional.
- `CodigoMunicipio` — optional.
- `CodigoMunicipioINE` — optional.

### GET /Consulta_DNPPP_Codigos

- `CodigoProvincia` — required.
- `CodigoMunicipio` or `CodigoMunicipioINE` — one required.
- `Poligono` — required.
- `Parcela` — required.

---

## 4. Coordinate REST JSON operations

Base:

`https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/json`

### GET /Consulta_RCCOOR

Find the cadastral parcel reference containing a point.

- `CoorX` — required.
- `CoorY` — required.
- `SRS` — required.

For geographic CRS values, official documentation defines `X = longitude`, `Y = latitude`, in decimal degrees.

### GET /Consulta_RCCOOR_Distancia

Returns cadastral references near a point, including distance information.

- `CoorX` — required.
- `CoorY` — required.
- `SRS` — required.

### GET /Consulta_CPMRC

Returns the parcel centroid coordinate and address for a cadastral parcel reference.

- `Provincia` — optional; required only when municipality is supplied.
- `Municipio` — optional.
- `SRS` — optional target SRS.
- `RefCat` — required; the coordinate-service documentation specifies a 14-character parcel/finca reference.

If your application starts from a 20-character RC, normally use its first 14 characters for parcel geometry/centroid operations.

### Accepted SRS values documented for the WCF coordinate service

- `EPSG:4230` — geographic ED50.
- `EPSG:4326` — geographic WGS84.
- `EPSG:4258` — geographic ETRS89.
- `EPSG:32627` — WGS84 / UTM 27N.
- `EPSG:32628` — WGS84 / UTM 28N.
- `EPSG:32629` — WGS84 / UTM 29N.
- `EPSG:32630` — WGS84 / UTM 30N.
- `EPSG:32631` — WGS84 / UTM 31N.
- `EPSG:25829` — ETRS89 / UTM 29N.
- `EPSG:25830` — ETRS89 / UTM 30N.
- `EPSG:25831` — ETRS89 / UTM 31N.
- `EPSG:23029` — ED50 / UTM 29N.
- `EPSG:23030` — ED50 / UTM 30N.
- `EPSG:23031` — ED50 / UTM 31N.

---

## 5. REST XML paths

Replace `/json/` with `/rest/` for XML responses. The names-based and coordinate REST help pages document both GET and POST.

Example XML GET:

```text
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPRC?RefCat=2749704YJ0624N0001DI
```

Example XML POST path:

```text
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPRC
```

For XML POST, the official examples require the Catastro XML namespace:

```xml
<ConsultaRest_DNPRC_In xmlns="http://www.catastro.hacienda.gob.es/">
  <RefCat>2749704YJ0624N0001DI</RefCat>
</ConsultaRest_DNPRC_In>
```

Use the live `/rest/help` links to inspect the exact POST wrapper for each operation.

---

## 6. SOAP/WSDL

WSDLs:

```text
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc?singleWsdl
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejeroCodigos.svc?singleWsdl
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc?singleWsdl
```

SOAP endpoints:

```text
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/soap
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejeroCodigos.svc/soap
https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/soap
```

Namespace used by official examples:

`http://www.catastro.hacienda.gob.es/`

---

## 7. URL construction rules

- Always URL-encode parameter values.
- Do not concatenate untrusted user text directly into a URL.
- Normalize RC with: trim -> remove spaces/hyphens if your UI accepts them -> uppercase.
- Keep numeric identifiers as strings to preserve leading zeros.
- Send blank optional values only when required by your HTTP adapter; otherwise omit them.
- Prefer a short timeout plus limited retry/backoff on transient 5xx/network errors. Do not blindly retry application-level Catastro validation errors.
