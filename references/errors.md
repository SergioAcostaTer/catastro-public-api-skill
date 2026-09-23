# Public Catastro service errors

The Catastro services can return a domain/application error even when the HTTP transport itself succeeds. Your adapter should inspect the body and expose the cadastral error to the agent.

The official public-service documentation lists these notable error codes for the public street/property/coordinate services.

| Code | Meaning (normalized English summary) |
|---:|---|
| 1 | Server error / general service error |
| 2 | Cadastral reference is required |
| 3 | Cadastral reference must have 14, 18, or 20 characters |
| 4 | Cadastral reference format is invalid |
| 5 | No property exists for the supplied parameters |
| 6 | Error while querying the reference |
| 7 | RC must be alphanumeric, up to 20 characters |
| 8 | Geographic zone/huso value too long |
| 9 | Cadastral reference does not exist |
| 10 | Error querying reference |
| 11 | Province is required |
| 12 | Province does not exist |
| 13 | Province exceeds allowed length |
| 15 | Error finding coordinates |
| 16 | No cadastral reference is available at those coordinates |
| 17 | Cadastral reference is required |
| 20 | Error querying municipality |
| 21 | Municipality is required |
| 22 | Municipality does not exist |
| 23 | Municipality code exceeds 3 digits |
| 24 | Municipality name exceeds allowed length |
| 31 | Street type is required |
| 32 | Street is required |
| 33 | Street does not exist |
| 34 | Street name exceeds allowed length |
| 35 | Street-type code exceeds allowed length |
| 36 | Street code exceeds 5 digits |
| 41 | Number is required |
| 42 | Number exceeds 4 digits |
| 43 | Number does not exist |
| 51 | Block value exceeds allowed length |
| 53 | Invalid block/staircase/floor/door format |
| 61 | Rural polygon is required |
| 62 | Rural parcel is required |
| 63 | Polygon exceeds 3 digits |
| 64 | Parcel exceeds 5 digits |
| 71 | Error retrieving address |
| 72 | No cartography available |
| 73 | Error finding parcel |
| 74 | Error generating response |
| 75 | SRS is required |
| 76 | X coordinate is required |
| 77 | X coordinate must be numeric |
| 78 | Y coordinate must be numeric |
| 79 | Y coordinate is required |

## Error-handling policy for your agent

1. Validate obvious input issues before calling Catastro.
2. If HTTP status is 429/5xx or the network fails, retry at most a small number of times with backoff.
3. If Catastro reports an input/domain error, do not retry unchanged input.
4. If a street/number lookup returns candidates, present them as ambiguity-resolution options.
5. Never convert "no cartography" or "no reference at coordinates" into a guessed parcel.
