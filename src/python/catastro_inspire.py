"""URL builders and simple text fetcher for Catastro INSPIRE WFS/WMS/ATOM services."""

from __future__ import annotations

from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from catastro_client import parcel_ref

WFS_CP = "https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx"
WFS_AD = "https://ovc.catastro.meh.es/INSPIRE/wfsAD.aspx"
WFS_BU = "https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx"
WMS_INSPIRE = "https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx"
WMS_GENERAL = "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx"
ATOM_CP = "https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/ES.SDGC.CP.atom.xml"
ATOM_AD = "https://www.catastro.hacienda.gob.es/INSPIRE/Addresses/ES.SDGC.AD.atom.xml"
ATOM_BU = "https://www.catastro.hacienda.gob.es/INSPIRE/buildings/ES.SDGC.BU.atom.xml"


def make_url(base: str, **params) -> str:
    clean = {k: v for k, v in params.items() if v is not None and v != ""}
    return f"{base}?{urlencode(clean)}"


def parcel_geometry_url(refcat: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_CP,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID="GetParcel",
        refcat=parcel_ref(refcat),
        srsname=srs,
    )


def neighbour_parcels_url(refcat: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_CP,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID="GetNeighbourParcel",
        refcat=parcel_ref(refcat),
        srsname=srs,
    )


def zoning_url(zone_code: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_CP,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID="GetZoning",
        cod_zona=zone_code,
        srsname=srs,
    )


def parcels_by_zoning_url(zone_code: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_CP,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID="GetParcelsByZoning",
        cod_zona=zone_code,
        srsname=srs,
    )


def addresses_by_parcel_url(refcat: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_AD,
        service="wfs",
        version="2.0.0",
        request="getfeature",
        StoredQuerie_id="GetADByRefCat",
        REFCAT=parcel_ref(refcat),
        srsname=srs,
    )


def addresses_by_postal_code_url(postal_code: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_AD,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID="GetADByPostalCode",
        postalcode=postal_code,
        srsname=srs,
    )


def addresses_by_road_code_url(road_code: str, delegation_code: str, municipality_code: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_AD,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID="GetADByCodVIA",
        codvia=road_code,
        **{"del": delegation_code, "mun": municipality_code, "srsname": srs},
    )


def _building_url(stored_query: str, refcat: str, srs: str = "EPSG::25830") -> str:
    return make_url(
        WFS_BU,
        service="wfs",
        version="2",
        request="getfeature",
        STOREDQUERIE_ID=stored_query,
        refcat=parcel_ref(refcat),
        srsname=srs,
    )


def buildings_by_parcel_url(refcat: str, srs: str = "EPSG::25830") -> str:
    return _building_url("GetBuildingByParcel", refcat, srs)


def building_parts_by_parcel_url(refcat: str, srs: str = "EPSG::25830") -> str:
    return _building_url("GetBuildingPartByParcel", refcat, srs)


def other_constructions_by_parcel_url(refcat: str, srs: str = "EPSG::25830") -> str:
    return _building_url("GetOtherBuildingByParcel", refcat, srs)


def wfs_bbox_url(dataset: str, type_name: str, bbox, srs: str) -> str:
    base = {"CP": WFS_CP, "AD": WFS_AD, "BU": WFS_BU}[dataset.upper()]
    bbox_value = ",".join(map(str, bbox)) if not isinstance(bbox, str) else bbox
    return make_url(
        base,
        service="wfs",
        version="2.0.0",
        request="getfeature",
        typenames=type_name,
        bbox=bbox_value,
        srsname=srs,
    )


class CatastroInspireClient:
    def __init__(self, timeout: float = 15.0, user_agent: str = "catastro-public-api-skill/1.0"):
        self.timeout = timeout
        self.user_agent = user_agent

    def fetch_text(self, url: str) -> str:
        req = Request(url, headers={"Accept": "application/xml,text/xml,*/*", "User-Agent": self.user_agent})
        try:
            with urlopen(req, timeout=self.timeout) as response:
                return response.read().decode("utf-8", errors="replace")
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Catastro geospatial HTTP {exc.code}: {body[:500]}") from exc
        except URLError as exc:
            raise RuntimeError(f"Catastro geospatial network error: {exc.reason}") from exc

    def parcel_geometry(self, refcat: str, srs: str = "EPSG::25830") -> str:
        return self.fetch_text(parcel_geometry_url(refcat, srs))

    def neighbour_parcels(self, refcat: str, srs: str = "EPSG::25830") -> str:
        return self.fetch_text(neighbour_parcels_url(refcat, srs))

    def addresses_by_parcel(self, refcat: str, srs: str = "EPSG::25830") -> str:
        return self.fetch_text(addresses_by_parcel_url(refcat, srs))

    def buildings_by_parcel(self, refcat: str, srs: str = "EPSG::25830") -> str:
        return self.fetch_text(buildings_by_parcel_url(refcat, srs))

    def building_parts_by_parcel(self, refcat: str, srs: str = "EPSG::25830") -> str:
        return self.fetch_text(building_parts_by_parcel_url(refcat, srs))

    def other_constructions_by_parcel(self, refcat: str, srs: str = "EPSG::25830") -> str:
        return self.fetch_text(other_constructions_by_parcel_url(refcat, srs))
