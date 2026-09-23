"""Zero-dependency Python client for Spain's public Catastro WCF JSON APIs."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Mapping
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BASE = "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero"
NAMES_JSON = f"{BASE}/COVCCallejero.svc/json"
CODES_JSON = f"{BASE}/COVCCallejeroCodigos.svc/json"
COORDS_JSON = f"{BASE}/COVCCoordenadas.svc/json"


def normalize_refcat(value: str) -> str:
    return re.sub(r"[\s-]+", "", str(value or "").strip()).upper()


def parcel_ref(value: str) -> str:
    rc = normalize_refcat(value)
    if len(rc) < 14:
        raise ValueError("A parcel/finca cadastral reference needs at least 14 characters.")
    return rc[:14]


@dataclass
class CatastroHttpError(RuntimeError):
    message: str
    status: int | None = None
    url: str | None = None
    body: str | None = None

    def __str__(self) -> str:
        return self.message


class CatastroClient:
    def __init__(self, timeout: float = 12.0, user_agent: str = "catastro-public-api-skill/1.0") -> None:
        self.timeout = timeout
        self.user_agent = user_agent

    def _get_json(self, base: str, operation: str, params: Mapping[str, Any] | None = None) -> Any:
        query = urlencode({k: str(v) for k, v in (params or {}).items() if v is not None})
        url = f"{base}/{operation}" + (f"?{query}" if query else "")
        request = Request(url, headers={"Accept": "application/json", "User-Agent": self.user_agent})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                body = response.read().decode("utf-8", errors="replace")
                status = getattr(response, "status", 200)
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise CatastroHttpError(f"Catastro HTTP {exc.code}", exc.code, url, body) from exc
        except URLError as exc:
            raise CatastroHttpError(f"Catastro network error: {exc.reason}", None, url, None) from exc

        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            raise CatastroHttpError(
                "Catastro returned a non-JSON response from a JSON endpoint", status, url, body
            ) from exc

    def provinces(self) -> Any:
        return self._get_json(NAMES_JSON, "ObtenerProvincias")

    def municipalities(self, province: str, municipality: str = "") -> Any:
        return self._get_json(
            NAMES_JSON,
            "ObtenerMunicipios",
            {"Provincia": province, "Municipio": municipality},
        )

    def streets(self, province: str, municipality: str, street_type: str = "", street_name: str = "") -> Any:
        return self._get_json(
            NAMES_JSON,
            "ObtenerCallejero",
            {
                "Provincia": province,
                "Municipio": municipality,
                "TipoVia": street_type,
                "NomVia": street_name,
            },
        )

    def numbers(self, province: str, municipality: str, street_type: str, street_name: str, number: str | int) -> Any:
        return self._get_json(
            NAMES_JSON,
            "ObtenerNumerero",
            {
                "Provincia": province,
                "Municipio": municipality,
                "TipoVia": street_type,
                "NomVia": street_name,
                "Numero": number,
            },
        )

    def property_by_address(
        self,
        *,
        province: str,
        municipality: str,
        street_type: str,
        street_name: str,
        number: str | int,
        block: str = "",
        staircase: str = "",
        floor: str = "",
        door: str = "",
    ) -> Any:
        return self._get_json(
            NAMES_JSON,
            "Consulta_DNPLOC",
            {
                "Provincia": province,
                "Municipio": municipality,
                "Sigla": street_type,
                "Calle": street_name,
                "Numero": number,
                "Bloque": block,
                "Escalera": staircase,
                "Planta": floor,
                "Puerta": door,
            },
        )

    def property_by_reference(self, refcat: str, province: str = "", municipality: str = "") -> Any:
        rc = normalize_refcat(refcat)
        if len(rc) not in (14, 18, 20):
            raise ValueError("Consulta_DNPRC expects a cadastral reference of 14, 18, or 20 characters.")
        return self._get_json(
            NAMES_JSON,
            "Consulta_DNPRC",
            {"Provincia": province, "Municipio": municipality, "RefCat": rc},
        )

    def property_by_rural_parcel(self, province: str, municipality: str, polygon: str, parcel: str) -> Any:
        return self._get_json(
            NAMES_JSON,
            "Consulta_DNPPP",
            {
                "Provincia": province,
                "Municipio": municipality,
                "Poligono": polygon,
                "Parcela": parcel,
            },
        )

    def municipalities_by_code(self, province_code: str, municipality_code: str = "", municipality_ine_code: str = "") -> Any:
        return self._get_json(
            CODES_JSON,
            "ObtenerMunicipiosCodigos",
            {
                "CodigoProvincia": province_code,
                "CodigoMunicipio": municipality_code,
                "CodigoMunicipioINE": municipality_ine_code,
            },
        )

    def streets_by_code(
        self,
        province_code: str,
        municipality_code: str = "",
        municipality_ine_code: str = "",
        street_code: str = "",
    ) -> Any:
        return self._get_json(
            CODES_JSON,
            "ObtenerCallejeroCodigos",
            {
                "CodigoProvincia": province_code,
                "CodigoMunicipio": municipality_code,
                "CodigoMunicipioINE": municipality_ine_code,
                "CodigoVia": street_code,
            },
        )

    def numbers_by_code(
        self,
        *,
        province_code: str,
        street_code: str,
        number: str | int,
        municipality_code: str = "",
        municipality_ine_code: str = "",
    ) -> Any:
        return self._get_json(
            CODES_JSON,
            "ObtenerNumereroCodigos",
            {
                "CodigoProvincia": province_code,
                "CodigoMunicipio": municipality_code,
                "CodigoMunicipioINE": municipality_ine_code,
                "CodigoVia": street_code,
                "Numero": number,
            },
        )

    def property_by_address_codes(
        self,
        *,
        province_code: str,
        street_code: str,
        number: str | int,
        municipality_code: str = "",
        municipality_ine_code: str = "",
        block: str = "",
        staircase: str = "",
        floor: str = "",
        door: str = "",
    ) -> Any:
        return self._get_json(
            CODES_JSON,
            "Consulta_DNPLOC_Codigos",
            {
                "CodigoMunicipio": municipality_code,
                "CodigoMunicipioINE": municipality_ine_code,
                "CodigoProvincia": province_code,
                "CodigoVia": street_code,
                "Numero": number,
                "Bloque": block,
                "Escalera": staircase,
                "Planta": floor,
                "Puerta": door,
            },
        )

    def property_by_reference_codes(
        self,
        refcat: str,
        province_code: str = "",
        municipality_code: str = "",
        municipality_ine_code: str = "",
    ) -> Any:
        rc = normalize_refcat(refcat)
        if len(rc) not in (14, 18, 20):
            raise ValueError("Consulta_DNPRC_Codigos expects a cadastral reference of 14, 18, or 20 characters.")
        return self._get_json(
            CODES_JSON,
            "Consulta_DNPRC_Codigos",
            {
                "CodigoMunicipio": municipality_code,
                "CodigoMunicipioINE": municipality_ine_code,
                "CodigoProvincia": province_code,
                "RefCat": rc,
            },
        )

    def property_by_rural_parcel_codes(
        self,
        *,
        province_code: str,
        polygon: str,
        parcel: str,
        municipality_code: str = "",
        municipality_ine_code: str = "",
    ) -> Any:
        return self._get_json(
            CODES_JSON,
            "Consulta_DNPPP_Codigos",
            {
                "CodigoMunicipio": municipality_code,
                "CodigoMunicipioINE": municipality_ine_code,
                "CodigoProvincia": province_code,
                "Poligono": polygon,
                "Parcela": parcel,
            },
        )

    def reference_at_coordinates(self, x: float, y: float, srs: str = "EPSG:4326") -> Any:
        return self._get_json(
            COORDS_JSON,
            "Consulta_RCCOOR",
            {"CoorX": x, "CoorY": y, "SRS": srs},
        )

    def nearby_references(self, x: float, y: float, srs: str = "EPSG:4326") -> Any:
        return self._get_json(
            COORDS_JSON,
            "Consulta_RCCOOR_Distancia",
            {"CoorX": x, "CoorY": y, "SRS": srs},
        )

    def coordinates_for_reference(
        self, refcat: str, province: str = "", municipality: str = "", srs: str = ""
    ) -> Any:
        return self._get_json(
            COORDS_JSON,
            "Consulta_CPMRC",
            {
                "Provincia": province,
                "Municipio": municipality,
                "SRS": srs,
                "RefCat": parcel_ref(refcat),
            },
        )
