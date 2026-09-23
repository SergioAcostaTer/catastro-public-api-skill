/**
 * Zero-dependency client for Spain's Dirección General del Catastro public APIs.
 * Node.js 18+ (global fetch required).
 */

const BASE = "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero";
const NAMES_JSON = `${BASE}/COVCCallejero.svc/json`;
const CODES_JSON = `${BASE}/COVCCallejeroCodigos.svc/json`;
const COORDS_JSON = `${BASE}/COVCCoordenadas.svc/json`;

export function normalizeRefCat(value) {
  return String(value ?? "")
    .trim()
    .replace(/[\s-]+/g, "")
    .toUpperCase();
}

export function parcelRef(value) {
  const rc = normalizeRefCat(value);
  if (rc.length < 14) throw new Error("A parcel/finca cadastral reference needs at least 14 characters.");
  return rc.slice(0, 14);
}

function addParam(search, key, value) {
  if (value === undefined || value === null) return;
  search.set(key, String(value));
}

export class CatastroHttpError extends Error {
  constructor(message, { status, url, body } = {}) {
    super(message);
    this.name = "CatastroHttpError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export class CatastroClient {
  constructor({ timeoutMs = 12000, fetchImpl = globalThis.fetch } = {}) {
    if (!fetchImpl) throw new Error("No fetch implementation available. Use Node.js 18+ or pass fetchImpl.");
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }

  async #getJson(base, operation, params = {}) {
    const url = new URL(`${base}/${operation}`);
    for (const [key, value] of Object.entries(params)) addParam(url.searchParams, key, value);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok) {
        throw new CatastroHttpError(`Catastro HTTP ${response.status}`, {
          status: response.status,
          url: url.toString(),
          body: text,
        });
      }
      try {
        return JSON.parse(text);
      } catch (cause) {
        throw new CatastroHttpError("Catastro returned a non-JSON response from a JSON endpoint", {
          status: response.status,
          url: url.toString(),
          body: text,
          cause,
        });
      }
    } finally {
      clearTimeout(timer);
    }
  }

  provinces() {
    return this.#getJson(NAMES_JSON, "ObtenerProvincias");
  }

  municipalities({ province, municipality = "" }) {
    return this.#getJson(NAMES_JSON, "ObtenerMunicipios", {
      Provincia: province,
      Municipio: municipality,
    });
  }

  streets({ province, municipality, streetType = "", streetName = "" }) {
    return this.#getJson(NAMES_JSON, "ObtenerCallejero", {
      Provincia: province,
      Municipio: municipality,
      TipoVia: streetType,
      NomVia: streetName,
    });
  }

  numbers({ province, municipality, streetType, streetName, number }) {
    return this.#getJson(NAMES_JSON, "ObtenerNumerero", {
      Provincia: province,
      Municipio: municipality,
      TipoVia: streetType,
      NomVia: streetName,
      Numero: number,
    });
  }

  propertyByAddress({
    province,
    municipality,
    streetType,
    streetName,
    number,
    block = "",
    staircase = "",
    floor = "",
    door = "",
  }) {
    return this.#getJson(NAMES_JSON, "Consulta_DNPLOC", {
      Provincia: province,
      Municipio: municipality,
      Sigla: streetType,
      Calle: streetName,
      Numero: number,
      Bloque: block,
      Escalera: staircase,
      Planta: floor,
      Puerta: door,
    });
  }

  propertyByReference({ refCat, province = "", municipality = "" }) {
    const rc = normalizeRefCat(refCat);
    if (![14, 18, 20].includes(rc.length)) {
      throw new Error("Consulta_DNPRC expects a cadastral reference of 14, 18, or 20 characters.");
    }
    return this.#getJson(NAMES_JSON, "Consulta_DNPRC", {
      Provincia: province,
      Municipio: municipality,
      RefCat: rc,
    });
  }

  propertyByRuralParcel({ province, municipality, polygon, parcel }) {
    return this.#getJson(NAMES_JSON, "Consulta_DNPPP", {
      Provincia: province,
      Municipio: municipality,
      Poligono: polygon,
      Parcela: parcel,
    });
  }

  municipalitiesByCode({ provinceCode, municipalityCode = "", municipalityIneCode = "" }) {
    return this.#getJson(CODES_JSON, "ObtenerMunicipiosCodigos", {
      CodigoProvincia: provinceCode,
      CodigoMunicipio: municipalityCode,
      CodigoMunicipioINE: municipalityIneCode,
    });
  }

  streetsByCode({ provinceCode, municipalityCode = "", municipalityIneCode = "", streetCode = "" }) {
    return this.#getJson(CODES_JSON, "ObtenerCallejeroCodigos", {
      CodigoProvincia: provinceCode,
      CodigoMunicipio: municipalityCode,
      CodigoMunicipioINE: municipalityIneCode,
      CodigoVia: streetCode,
    });
  }

  numbersByCode({ provinceCode, municipalityCode = "", municipalityIneCode = "", streetCode, number }) {
    return this.#getJson(CODES_JSON, "ObtenerNumereroCodigos", {
      CodigoProvincia: provinceCode,
      CodigoMunicipio: municipalityCode,
      CodigoMunicipioINE: municipalityIneCode,
      CodigoVia: streetCode,
      Numero: number,
    });
  }

  propertyByAddressCodes({
    provinceCode,
    municipalityCode = "",
    municipalityIneCode = "",
    streetCode,
    number,
    block = "",
    staircase = "",
    floor = "",
    door = "",
  }) {
    return this.#getJson(CODES_JSON, "Consulta_DNPLOC_Codigos", {
      CodigoMunicipio: municipalityCode,
      CodigoMunicipioINE: municipalityIneCode,
      CodigoProvincia: provinceCode,
      CodigoVia: streetCode,
      Numero: number,
      Bloque: block,
      Escalera: staircase,
      Planta: floor,
      Puerta: door,
    });
  }

  propertyByReferenceCodes({ refCat, provinceCode = "", municipalityCode = "", municipalityIneCode = "" }) {
    const rc = normalizeRefCat(refCat);
    if (![14, 18, 20].includes(rc.length)) {
      throw new Error("Consulta_DNPRC_Codigos expects a cadastral reference of 14, 18, or 20 characters.");
    }
    return this.#getJson(CODES_JSON, "Consulta_DNPRC_Codigos", {
      CodigoMunicipio: municipalityCode,
      CodigoMunicipioINE: municipalityIneCode,
      CodigoProvincia: provinceCode,
      RefCat: rc,
    });
  }

  propertyByRuralParcelCodes({ provinceCode, municipalityCode = "", municipalityIneCode = "", polygon, parcel }) {
    return this.#getJson(CODES_JSON, "Consulta_DNPPP_Codigos", {
      CodigoMunicipio: municipalityCode,
      CodigoMunicipioINE: municipalityIneCode,
      CodigoProvincia: provinceCode,
      Poligono: polygon,
      Parcela: parcel,
    });
  }

  referenceAtCoordinates({ x, y, srs = "EPSG:4326" }) {
    return this.#getJson(COORDS_JSON, "Consulta_RCCOOR", {
      CoorX: x,
      CoorY: y,
      SRS: srs,
    });
  }

  nearbyReferences({ x, y, srs = "EPSG:4326" }) {
    return this.#getJson(COORDS_JSON, "Consulta_RCCOOR_Distancia", {
      CoorX: x,
      CoorY: y,
      SRS: srs,
    });
  }

  coordinatesForReference({ refCat, province = "", municipality = "", srs = "" }) {
    return this.#getJson(COORDS_JSON, "Consulta_CPMRC", {
      Provincia: province,
      Municipio: municipality,
      SRS: srs,
      RefCat: parcelRef(refCat),
    });
  }
}

export const endpoints = Object.freeze({
  namesJson: NAMES_JSON,
  codesJson: CODES_JSON,
  coordinatesJson: COORDS_JSON,
  wfsParcels: "https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx",
  wfsAddresses: "https://ovc.catastro.meh.es/INSPIRE/wfsAD.aspx",
  wfsBuildings: "https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx",
  inspireWms: "https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx",
  generalWms: "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx",
});
