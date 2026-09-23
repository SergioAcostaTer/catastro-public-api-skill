# Legal, privacy, geographic, and service limits

## Public data boundary

The public/non-protected Catastro services are open-access. Public cadastral information can include location, cadastral reference, surface, use/destination, crop/use information, construction-related characteristics, and cartography.

Protected information is outside this skill. In particular, do not use this public integration to claim access to:

- cadastral owner identity,
- owner tax/identity number,
- owner's address,
- cadastral value or its land/construction components.

Those require the appropriate authenticated/authorized Catastro access and legal basis.

## Geographic scope

The Dirección General del Catastro's ordinary cadastral/cartographic scope covers Spain except Navarra and the Basque Country, which have their own cadastral systems. Your application should detect or gracefully handle locations outside the DGC service scope.

## WMS usage

The DGC describes its public WMS as free, but explicitly says not to perform mass downloads of map portions through successive requests. It also warns that the service is not designed as a tiled WMS-C/WMTS backend and may apply service quotas/degraded service for tiled behavior.

For bulk/vector extraction use WFS or ATOM instead.

## WFS limits

Documented limits include:

- CP cadastral parcels: 1 km² BBOX and 5,000 elements.
- CP cadastral zoning: 25 km² BBOX and 500 elements.
- AD addresses: 4 km² BBOX and 5,000 elements.
- BU buildings/parts/other constructions: 4 km² BBOX and 5,000 elements.
- Generic SQL is not supported in these WFS services.

## License and redistribution

The official INSPIRE license states that using the web/download services implies acceptance of its access/use conditions. It permits use for the licensee and for value-added products based on transformed cadastral information, while placing conditions on redistribution of original supplied information.

Before shipping a product that republishes or commercially redistributes cadastral datasets, review the current official license text rather than relying only on this summary.

Official license:

`https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf`

## Reliability and legal effect

Public API output can be current official-source information, but it should not be presented as a legal certification. The DGC's license/conditions also warn that downloaded/service information may contain outdated or incorrect data.

For a legally effective certificate or authenticated protected-data workflow, use the official Sede Electrónica del Catastro procedures.
