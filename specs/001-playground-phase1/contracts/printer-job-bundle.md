# Printer Job Bundle (Printer-Assignment Payload)

**Purpose**: Well-defined contract for job handoff to a future Bambu Lab (or other) connector. This phase only produces and stores the payload; no direct printer telemetry or control.

**Consumer**: Future connector service (out of scope for Phase 1).  
**Producer**: Backend service that builds the payload from OrderLine/Job and stores it (e.g. `PrinterAssignmentPayload` table or queue).

---

## Payload Shape (JSON)

```json
{
  "version": "1.0",
  "id": "uuid",
  "idempotencyKey": "string",
  "orderId": "uuid",
  "orderLineId": "uuid",
  "jobId": "uuid",
  "createdAt": "ISO8601",
  "deadlineAt": "ISO8601 | null",
  "printOptions": {
    "materialId": "string",
    "materialName": "string",
    "qualityId": "string",
    "qualityName": "string",
    "toleranceClassId": "string",
    "quantity": 1,
    "turnaroundProfileId": "string",
    "turnaroundName": "string"
  },
  "files": [
    {
      "storageKey": "string",
      "format": "stl|obj|3mf|amf|ply|wrl|vrml|glb|gltf|usd|usdz|usda|usdc",
      "displayName": "string",
      "checksumSha256": "string"
    }
  ],
  "metadata": {
    "customerOrderNumber": "string",
    "customerReference": "string | null"
  }
}
```

### Field Semantics

- **version**: Contract version for connector compatibility.
- **id**: Unique payload id (UUID); connector can use for idempotency.
- **idempotencyKey**: Key supplied when creating the assignment; connector should deduplicate on this.
- **orderId / orderLineId / jobId**: References back to platform order/job for traceability.
- **createdAt / deadlineAt**: When the assignment was created; optional deadline for production.
- **printOptions**: Snapshot of material, quality, tolerance, quantity, turnaround at time of assignment.
- **files**: List of stored file references (storageKey), format, display name, and optional checksum for integrity.
- **metadata**: Human-readable order number and optional customer reference for labeling.

### Constraints

- All file `storageKey` values must point to validated, existing uploads (no arbitrary paths).
- `printOptions` must reflect admin-configured option ids and names at time of creation.
- Connector must not be called from this codebase in Phase 1; payload is stored for later consumption (e.g. poll, webhook, or queue in a future phase).
