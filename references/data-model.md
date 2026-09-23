# Catastro public data model notes

## Cadastral reference (RC)

A cadastral reference is the official identifier used to locate real property in the cadastral system. A full reference is generally 20 alphanumeric characters.

For typical urban references, the structure commonly includes:

- positions 1-7: parcel/finca identifier,
- positions 8-14: map-sheet component,
- positions 15-18: property/unit component,
- positions 19-20: control characters.

Several public services intentionally work with the first 14 characters because they operate at parcel/finca level.

## Public non-protected property data

The DNP operations can return, depending on the property and match specificity:

- property class/type (for example urban/rural),
- cadastral reference,
- cadastral/tax location,
- use/destination,
- surface area,
- participation coefficient,
- age/antiquity,
- construction-unit list and surfaces,
- property/finca physical information,
- graphical-information indicator,
- common-element surface,
- rural subparcels, crop/use class, productive intensity, and surface.

The exact JSON shape mirrors the Catastro service's nested XML-oriented model. Keep your client tolerant of absent optional fields and schema additions.

## Protected data not available from this public skill

Do not expect or infer:

- cadastral owner name/company,
- owner identification number,
- owner's address,
- cadastral value,
- cadastral land value,
- cadastral construction value.

Those belong to protected/authenticated access rules.

## Address lookup model

The reliable progressive workflow is:

1. Province
2. Municipality
3. Street/road type and name
4. Number
5. Optional block/staircase/floor/door
6. Property match

Catastro can return candidate lists when a name or number is not exact. An agent should surface the candidates and ask the user to choose if the ambiguity cannot be resolved from the user's input.

## Geometry vs centroid

Do not confuse:

- `Consulta_CPMRC`: one representative/centroid point for the parcel.
- INSPIRE WFS CP `GetParcel`: polygon geometry for the cadastral parcel.
- WMS: rendered map image, not vector geometry.

## Rural properties

Rural lookups can use municipality + polygon (`Poligono`) + parcel (`Parcela`). Rural responses can include subparcel/crop information. Preserve leading zeros in polygon/parcel codes when present.
