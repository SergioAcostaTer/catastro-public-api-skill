# INSPIRE and map services

Use these services when the user needs geometry, neighboring parcels, buildings, addresses, map images, or bulk municipality datasets.

## 1. INSPIRE WMS

Endpoint:

`https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx`

Officially documented operations:

- `GetCapabilities`
- `GetMap`
- `GetFeatureInfo`

Example capability request:

```text
https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx?service=WMS&request=GetCapabilities
```

Use WMS for visualization. Do not parse a rendered map image to obtain parcel geometry.

## 2. General cadastral WMS

Endpoint:

`https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx`

The official DGC page documents WMS 1.0.0, 1.1.0, and 1.1.1 plus `GetFeatureInfo`. It also documents a Catastro-specific `TIME=YYYY-MM-DD` parameter for historical digital cartography where available (not earlier than the digital archive period).

Important: the DGC explicitly discourages tiled/massive download behavior on this WMS. Use WFS or ATOM for data extraction/bulk use.

## 3. WFS Cadastral Parcels (CP)

Endpoint:

`https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx`

WFS version: 2.0.0.

Supported operations include:

- `GetCapabilities`
- `DescribeFeatureType`
- `ListStoredQueries`
- `DescribeStoredQueries`
- `GetFeature`

### Feature types / BBOX use

Official examples use:

- `cp.cadastralparcel`
- `cp.cadastralzoning`

Example:

```text
https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&request=getfeature&typenames=cp.cadastralparcel&SRSname=EPSG::25830&bbox=233673,4015968,233761,4016008
```

### Stored queries

- `GetParcel`
  - parameter: `refcat` (14-character parcel reference)
  - returns cadastral parcel geometry.
- `GetNeighbourParcel`
  - parameter: `refcat`
  - returns the parcel and neighboring parcels.
- `GetZoning`
  - parameter: `cod_zona`
  - returns cadastral zoning.
- `GetParcelsByZoning`
  - parameter: `cod_zona`
  - returns parcels within a cadastral zone.

Example parcel by RC:

```text
https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GetParcel&refcat=3662001TF3136S&srsname=EPSG::25830
```

The official documentation spells the request parameter `STOREDQUERIE_ID` in examples. Preserve the server's accepted spelling shown by live capabilities/stored-query metadata if you generate requests dynamically.

### CP limits documented by DGC

- Cadastral parcel BBOX: up to 1 km² and 5,000 elements.
- Cadastral zoning BBOX: up to 25 km² and 500 elements.
- Generic SQL queries are not supported.

## 4. WFS Addresses (AD)

Endpoint:

`https://ovc.catastro.meh.es/INSPIRE/wfsAD.aspx`

Feature type example:

- `ad.address`

Stored queries:

- `GetADByRefCat`
  - `refcat`: 14-character cadastral parcel reference.
- `GetADByCodVIA`
  - `codvia`: Catastro road code.
  - `del`: Catastro delegation code.
  - `mun`: Catastro municipality code.
- `GetADByPostalCode`
  - `postalcode`.

Example by parcel RC:

```text
https://ovc.catastro.meh.es/INSPIRE/wfsAD.aspx?service=wfs&version=2.0.0&request=getfeature&StoredQuerie_id=GetADByRefCat&REFCAT=3662303TF3136B
```

AD BBOX limit documented by DGC: 4 km² and 5,000 elements. Generic SQL is not supported.

## 5. WFS Buildings (BU)

Endpoint:

`https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx`

Feature types:

- `BU.BUILDING`
- `BU.BUILDINGPART`
- `BU.OTHERCONSTRUCTION`

Stored queries:

- `GetBuildingByParcel` — `refcat`, optional `srsname`.
- `GetBuildingPartByParcel` — `refcat`, optional `srsname`.
- `GetOtherBuildingByParcel` — `refcat`, optional `srsname`.

Example:

```text
https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx?service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GETBUILDINGBYPARCEL&refcat=9398516VK3799G&srsname=EPSG::25829
```

BU BBOX limit documented by DGC: 4 km² and 5,000 elements. Generic SQL is not supported.

## 6. WFS common CRS options documented by DGC

The CP/AD/BU WFS documentation lists:

- `EPSG:4326` — WGS84 geographic.
- `EPSG:4258` — ETRS89 geographic.
- `EPSG:25829` — ETRS89 / UTM 29N.
- `EPSG:25830` — ETRS89 / UTM 30N.
- `EPSG:25831` — ETRS89 / UTM 31N.
- `EPSG:3785` — legacy Web Mercator identifier.
- `EPSG:3857` — Web Mercator.

WFS responses are GML. The official documents describe GML 3.2.1 for these download services.

## 7. ATOM bulk feeds

Use ATOM when you need a complete predefined INSPIRE dataset by municipality rather than repeated small requests.

Master feeds:

- Cadastral Parcels (CP):
  `https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/ES.SDGC.CP.atom.xml`
- Addresses (AD):
  `https://www.catastro.hacienda.gob.es/INSPIRE/Addresses/ES.SDGC.AD.atom.xml`
- Buildings (BU):
  `https://www.catastro.hacienda.gob.es/INSPIRE/buildings/ES.SDGC.BU.atom.xml`

Downloads are ZIP packages containing GML plus metadata. The DGC documentation states ATOM municipality datasets are regenerated on an approximately six-month cycle / twice a year, unlike WFS/WMS data that are presented as continuously updated.

## 8. Choosing WCF vs WFS vs WMS vs ATOM

| Need | Best service |
|---|---|
| Public property attributes | WCF `Consulta_DNPRC` / DNP operations |
| Address -> RC | WCF street directory + `Consulta_DNPLOC` |
| Point -> RC | WCF `Consulta_RCCOOR` |
| RC -> centroid | WCF `Consulta_CPMRC` |
| Exact parcel polygon | WFS CP `GetParcel` |
| Neighboring parcels | WFS CP `GetNeighbourParcel` |
| Buildings | WFS BU |
| INSPIRE addresses | WFS AD |
| Map image/overlay | WMS |
| Municipality-scale bulk dataset | ATOM |
