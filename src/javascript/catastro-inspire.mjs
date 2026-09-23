import { normalizeRefCat, parcelRef } from "./catastro-client.mjs";

export const INSPIRE = Object.freeze({
  wfsCP: "https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx",
  wfsAD: "https://ovc.catastro.meh.es/INSPIRE/wfsAD.aspx",
  wfsBU: "https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx",
  wms: "https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx",
  generalWms: "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx",
  atomCP: "https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/ES.SDGC.CP.atom.xml",
  atomAD: "https://www.catastro.hacienda.gob.es/INSPIRE/Addresses/ES.SDGC.AD.atom.xml",
  atomBU: "https://www.catastro.hacienda.gob.es/INSPIRE/buildings/ES.SDGC.BU.atom.xml",
});

function makeUrl(base, params) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  }
  return u.toString();
}

export function wfsCapabilitiesUrl(base) {
  return makeUrl(base, { service: "WFS", version: "2.0.0", request: "GetCapabilities" });
}

export function parcelGeometryUrl(refCat, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsCP, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: "GetParcel",
    refcat: parcelRef(refCat),
    srsname: srs,
  });
}

export function neighbourParcelsUrl(refCat, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsCP, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: "GetNeighbourParcel",
    refcat: parcelRef(refCat),
    srsname: srs,
  });
}

export function zoningUrl(zoneCode, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsCP, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: "GetZoning",
    cod_zona: zoneCode,
    srsname: srs,
  });
}

export function parcelsByZoningUrl(zoneCode, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsCP, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: "GetParcelsByZoning",
    cod_zona: zoneCode,
    srsname: srs,
  });
}

export function addressesByParcelUrl(refCat, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsAD, {
    service: "wfs",
    version: "2.0.0",
    request: "getfeature",
    StoredQuerie_id: "GetADByRefCat",
    REFCAT: parcelRef(refCat),
    srsname: srs,
  });
}

export function addressesByPostalCodeUrl(postalCode, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsAD, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: "GetADByPostalCode",
    postalcode: postalCode,
    srsname: srs,
  });
}

export function addressesByRoadCodeUrl({ roadCode, delegationCode, municipalityCode, srs = "EPSG::25830" }) {
  return makeUrl(INSPIRE.wfsAD, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: "GetADByCodVIA",
    codvia: roadCode,
    del: delegationCode,
    mun: municipalityCode,
    srsname: srs,
  });
}

function buildingUrl(storedQuery, refCat, srs = "EPSG::25830") {
  return makeUrl(INSPIRE.wfsBU, {
    service: "wfs",
    version: "2",
    request: "getfeature",
    STOREDQUERIE_ID: storedQuery,
    refcat: parcelRef(refCat),
    srsname: srs,
  });
}

export const buildingsByParcelUrl = (refCat, srs) => buildingUrl("GetBuildingByParcel", refCat, srs);
export const buildingPartsByParcelUrl = (refCat, srs) => buildingUrl("GetBuildingPartByParcel", refCat, srs);
export const otherConstructionsByParcelUrl = (refCat, srs) => buildingUrl("GetOtherBuildingByParcel", refCat, srs);

export function wfsBboxUrl({ dataset = "CP", typeName, bbox, srs }) {
  const base = dataset === "AD" ? INSPIRE.wfsAD : dataset === "BU" ? INSPIRE.wfsBU : INSPIRE.wfsCP;
  return makeUrl(base, {
    service: "wfs",
    version: "2.0.0",
    request: "getfeature",
    typenames: typeName,
    bbox: Array.isArray(bbox) ? bbox.join(",") : bbox,
    srsname: srs,
  });
}

export function wmsCapabilitiesUrl({ inspire = true } = {}) {
  return makeUrl(inspire ? INSPIRE.wms : INSPIRE.generalWms, {
    service: "WMS",
    request: "GetCapabilities",
  });
}

export class CatastroInspireClient {
  constructor({ timeoutMs = 15000, fetchImpl = globalThis.fetch } = {}) {
    if (!fetchImpl) throw new Error("No fetch implementation available.");
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }

  async fetchText(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetch(url, { headers: { Accept: "application/xml,text/xml,*/*" }, signal: controller.signal });
      const text = await res.text();
      if (!res.ok) throw new Error(`Catastro geospatial HTTP ${res.status}: ${text.slice(0, 500)}`);
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  parcelGeometry(refCat, srs = "EPSG::25830") {
    return this.fetchText(parcelGeometryUrl(refCat, srs));
  }

  neighbourParcels(refCat, srs = "EPSG::25830") {
    return this.fetchText(neighbourParcelsUrl(refCat, srs));
  }

  addressesByParcel(refCat, srs = "EPSG::25830") {
    return this.fetchText(addressesByParcelUrl(refCat, srs));
  }

  buildingsByParcel(refCat, srs = "EPSG::25830") {
    return this.fetchText(buildingsByParcelUrl(refCat, srs));
  }

  buildingPartsByParcel(refCat, srs = "EPSG::25830") {
    return this.fetchText(buildingPartsByParcelUrl(refCat, srs));
  }

  otherConstructionsByParcel(refCat, srs = "EPSG::25830") {
    return this.fetchText(otherConstructionsByParcelUrl(refCat, srs));
  }
}
