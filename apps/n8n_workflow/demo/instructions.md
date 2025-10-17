Here’s a clean, drop-in instructions file you can hand to Claude. It’s opinionated, end-to-end, and aligned with your NDJSON model + R3F pipeline.

---

# CLAUDE_AGENT_INSTRUCTIONS.md

## 0) Mission

You are a **code agent** that ingests a **vehicle electrical NDJSON graph**, validates/normalizes it, and produces:

1. a validated in-memory graph model,
2. optional fixed NDJSON (auto-repaired),
3. ready-to-use **React Three Fiber** scene scaffolding (components + JSON scene config),
4. optional exports (GLTF/OBJ for harness centerlines, CSV inventories).

You **must not** invent data. Use only the provided NDJSON. When unsure, mark fields as `null` and log a warning.

---

## 1) Inputs

* One or more **NDJSON** files. Each line is a JSON object with `kind` ∈ `meta | node | edge`.
* Optional CLI args / function params:

  * `--files [...]` list of NDJSON paths (ordered).
  * `--strict` fail on first schema violation.
  * `--auto-repair` attempt safe repairs (see §5).
  * `--systems` filter to specific systems (e.g., `["lighting","hvac"]`).
  * `--emit-r3f` write React components and scene JSON.
  * `--export` choose `"gltf" | "obj" | "csv"` outputs.

---

## 2) Outputs (artifacts)

* `graph/model.json` (internal serialized model)
* `graph/fixed.ndjson` (if `--auto-repair`)
* `scene/scene.config.json` (R3F consumable scene graph)
* `scene/components/*` (R3F components)
* `exports/harness.gltf` (optional centerline geometry)
* `exports/inventory.csv` (nodes by type; pins/wires counts)
* `logs/report.md` (validation + repair report)

---

## 3) Data model (NDJSON)

### 3.1 `meta`

```json
{"kind":"meta",
 "model":"PajeroPininV60",
 "version":"1.0.0",
 "units":{"length":"m","angle":"deg","voltage":"V"},
 "coord_frame":{"x":"forward","y":"left","z":"up","origin":"front_axle_centerline_floor"},
 "created_at":"2025-10-16T12:00:00Z"}
```

### 3.2 `node`

```json
{"kind":"node",
 "id":"comp_engine_ecu",
 "node_type":"component",
 "canonical_id":"Engine Control Unit (ECU)",
 "code_id":"Engine-ECU",
 "anchor_zone":"Dash",
 "anchor_xyz":[1.12,-0.15,0.65],
 "anchor_ypr_deg":[0,0,0],
 "bbox_m":[0.28,0.18,0.06],
 "rail":null,
 "path_xyz":null,
 "color":null,
 "gauge":null,
 "signal":null,
 "voltage":null,
 "oem_id":null,
 "service_ref":null,
 "notes":""}
```

Allowed `node_type`:
`ground_plane, location, harness, harness_segment, component, connector, pin, wire, splice, ground_point, fuse, relay, bus`

Spatial fields:

* `anchor_xyz:[x,y,z]` (m)
* `anchor_ypr_deg:[yaw,pitch,roll]` (deg)
* `bbox_m:[lx,ly,lz]` (m)
* `path_xyz:[[x,y,z],…]` for wires/harness segments

### 3.3 `edge`

```json
{"kind":"edge",
 "source":"comp_engine_ecu",
 "target":"conn_engine_ecu_A",
 "relationship":"has_connector",
 "notes":""}
```

Allowed `relationship`:
`in_location, has_connector, has_pin, part_of, mounted_to, pin_to_wire, wire_to_pin, wire_to_fuse, fuse_to_wire, wire_to_relay, wire_to_ground, ground_to_plane, wire_to_splice, bus_feed, bus_to_wire, routed_on, passes_through`

---

## 4) Pipeline (high-level)

1. **Load** NDJSON line-by-line (streaming).
2. **Validate** per-record (Ajv JSON Schemas below).
3. **Normalize** (units, arrays, enums).
4. **Index** (by type, neighbors, pins per connector, wires per harness).
5. **Integrity checks** (IDs, degree constraints, spatial constraints).
6. **Auto-repair** (optional, conservative).
7. **Synthesize spatial** defaults for missing anchors/paths.
8. **Emit scene config** for R3F + reusable components.
9. **Export** optional GLTF/OBJ centerlines and CSV.
10. **Report** warnings/errors/fixes.

---

## 5) Validation & Auto-repair rules

### 5.1 JSON Schemas (Ajv)

**Node schema**

```json
{
  "type":"object",
  "required":["kind","id","node_type"],
  "properties":{
    "kind":{"const":"node"},
    "id":{"type":"string"},
    "node_type":{"type":"string"},
    "canonical_id":{"type":["string","null"]},
    "code_id":{"type":["string","null"]},
    "anchor_zone":{"type":["string","null"]},
    "anchor_xyz":{"type":["array","null"],"items":{"type":"number"},"minItems":3,"maxItems":3},
    "anchor_ypr_deg":{"type":["array","null"],"items":{"type":"number"},"minItems":3,"maxItems":3},
    "bbox_m":{"type":["array","null"],"items":{"type":"number"},"minItems":3,"maxItems":3},
    "rail":{"type":["string","null"]},
    "path_xyz":{"type":["array","null"],"items":{"type":"array","items":{"type":"number"},"minItems":3,"maxItems":3}},
    "color":{"type":["string","null"]},
    "gauge":{"type":["string","null"]},
    "signal":{"type":["string","null"]},
    "voltage":{"type":["string","null"]},
    "oem_id":{"type":["string","null"]},
    "service_ref":{"type":["string","null"]},
    "notes":{"type":["string","null"]}
  },
  "additionalProperties": true
}
```

**Edge schema**

```json
{
  "type":"object",
  "required":["kind","source","target","relationship"],
  "properties":{
    "kind":{"const":"edge"},
    "source":{"type":"string"},
    "target":{"type":"string"},
    "relationship":{"type":"string"},
    "notes":{"type":["string","null"]}
  },
  "additionalProperties": true
}
```

### 5.2 Integrity checks (fail if `--strict`, else warn)

* Unknown `id` on `edge.source/target`.
* `has_pin`: source **must** be a `connector`.
* `pin_to_wire` / `wire_to_pin`: end types must match (`pin` ↔ `wire`).
* `wire_to_fuse`: target must be `fuse`.
* `wire_to_ground`: target must be `ground_point`.
* `ground_to_plane`: target must be `ground_plane`.
* Spatial: `anchor_xyz.length===3`, `path_xyz` is Nx3.
* For `wire`: require at least one of (`path_xyz`, `routed_on` edge, or both endpoints’ anchors).
* For `harness`: prefer `path_xyz`; otherwise derive from contained connectors’ anchors.

### 5.3 Auto-repair (when `--auto-repair`)

* **String arrays → arrays**: parse `"[-, -, -]"` safely.
* **Clamp path noise**: merge points closer than 1e-4 m.
* **Bridge missing wire path**: if both endpoints have `anchor_xyz`, create straight polyline `[p_src,p_mid,p_dst]` with `p_mid` projected along vehicle X by 0.15–0.30 m for readability.
* **Infer missing `in_location`**: from `anchor_zone`.
* **Normalize colors**: `B/W` → `B-W`, trim spaces.
* **Gauge coercion**: `"1.5 mm^2"` → `"1.5 mm^2"` (preserve string), and derive `gauge_mm2:number` internally if needed.

Repairs are logged in `logs/report.md`. Never alter IDs.

---

## 6) Indexes you must build

* `nodesById: Record<string, Node>`
* `edges: Edge[]`
* `byType: Record<NodeType, string[]>`
* `neighbors: Record<string, string[]>`
* `pinsByConnector: Record<string, string[]>` (from `has_pin`)
* `wiresByHarnessRail: Record<string, string[]>` (node.rail on wires)
* `anchors: Record<string, {xyz:[number,number,number], ypr:[number,number,number]|null, bbox:[number,number,number]|null}>`

---

## 7) Spatial synthesis defaults

* **Coordinate frame**: +X forward, +Y left, +Z up; meters.
* **Zones → coarse anchors** (fallback only):

  * EngineBay ~ `[1.10, 0.0, 0.75]`
  * Dash ~ `[0.60, 0.0, 0.90]`
  * Firewall ~ `[0.90, 0.0, 0.85]`
  * Floor ~ `[0.40, 0.0, 0.25]`
  * Roof ~ `[0.40, 0.0, 1.30]`
  * Rear ~ `[-0.60, 0.0, 0.80]`
  * Doors (LF/RF) ~ `[0.55, ±0.55, 0.95]`
* **Harness lane offset**: when routing multiple wires on same harness, offset lateral `±0.01–0.03 m` in Y with round-robin to reduce Z-fighting.
* **Soft curves**: convert polylines to Catmull-Rom with tension `0.5`. Sample every 0.02–0.05 m for GLTF export.

---

## 8) React Three Fiber scene

### 8.1 Scene config (JSON emitted)

```json
{
  "frame":{"x":"forward","y":"left","z":"up"},
  "materials":{
    "wire":{"thickness":0.006},
    "harness":{"thickness":0.015},
    "ground":{"thickness":0.008}
  },
  "groups":[
    {"id":"EngineBay","filter":{"anchor_zone":"Engine Compartment"}},
    {"id":"Dash","filter":{"anchor_zone":"Dash"}},
    {"id":"Rear","filter":{"anchor_zone":"Rear Cargo/Tailgate"}}
  ],
  "instances":{
    "components":["component","fuse","relay","bus","ground_point","connector"],
    "wires":["wire"],
    "harnesses":["harness","harness_segment"]
  }
}
```

### 8.2 R3F components to generate

* `SceneRoot` – loads `scene.config.json`, mounts groups.
* `HarnessCurve` – draws tube along `path_xyz` (Catmull-Rom).
* `WireCurve` – same as harness but thinner + color by `node.color`.
* `Device` – box or icon at `anchor_xyz` with `bbox_m` scale.
* `ConnectorPins` – small spheres/cones around connector anchor (fan out).
* `GroundStrap` – short strap from `ground_point` to plane.
* `Labels` – optional `<Html>` overlays for `canonical_id`/`code_id`.
* `SystemFilters` – UI toggles by `rail`, `anchor_zone`, or `byType`.

**Interactivity:** on hover, outline; on click, show properties panel (reads from `nodesById`).

---

## 9) Exporters

* **GLTF**: convert harness/wire curves to tubes (radius from scene config). Name nodes with original `id`.
* **OBJ**: same geometry; group by harness/rail.
* **CSV**:

  * `inventory.csv`: columns = `id,node_type,canonical_id,code_id,anchor_zone,gauge,color,voltage`
  * `wires.csv`: one row per `wire` with `path_length_m` (compute from path).

---

## 10) Logging & reports

* Write `logs/report.md` with sections:

  * Summary counts by `node_type`
  * Schema violations (line numbers if available)
  * Integrity failures
  * Auto-repairs (before → after)
  * Missing anchors/paths that required synthesis

---

## 11) Constraints & rules

* **No hallucination**: never invent components or edges not present in NDJSON. Only synthesize **spatial** fallbacks per §7.
* **IDs are immutable**.
* Prefer **arrays** over stringified arrays; if strings found, coerce and warn.
* Keep **SI units** (meters/deg); do not rescale.
* **Deterministic** output (stable sorting by `id` and `node_type`).

---

## 12) Reference helpers (pseudo-APIs)

```ts
type NodeType =
  | "ground_plane" | "location" | "harness" | "harness_segment"
  | "component" | "connector" | "pin" | "wire" | "splice"
  | "ground_point" | "fuse" | "relay" | "bus";

interface GNode {
  id: string; node_type: NodeType;
  canonical_id?: string|null; code_id?: string|null;
  anchor_zone?: string|null;
  anchor_xyz?: [number,number,number]|null;
  anchor_ypr_deg?: [number,number,number]|null;
  bbox_m?: [number,number,number]|null;
  rail?: string|null;
  path_xyz?: [number,number,number][]|null;
  color?: string|null; gauge?: string|null;
  signal?: string|null; voltage?: string|null;
  oem_id?: string|null; service_ref?: string|null;
  notes?: string|null;
}

interface GEdge {
  source: string; target: string; relationship: string; notes?: string|null;
}

interface GraphModel {
  nodesById: Record<string,GNode>;
  edges: GEdge[];
  byType: Record<NodeType,string[]>;
  neighbors: Record<string,string[]>;
  pinsByConnector: Record<string,string[]>;
  wiresByHarnessRail: Record<string,string[]>;
}
```

---

## 13) Suggested commands / tasks

* **Build**: `ingest → validate → normalize → index → check → synthesize → emit scene → export → report`
* **Validate only**: stop after checks; exit non-zero on errors.
* **Repair**: run with `--auto-repair`, emit `graph/fixed.ndjson`.
* **Scene only**: accept an already loaded `GraphModel`, emit R3F artifacts.

---

## 14) Edge cases & policies

* If **both** `path_xyz` and endpoints exist, **respect** `path_xyz`; do not overwrite.
* If a `wire` has neither endpoints nor path → **error** (cannot place).
* `has_pin` without a `pin` node → error; suggest missing node in report.
* Reverse/duplicate edges: keep **first**, drop duplicates (log).
* Non-manifold splices: allowed; visualize as small hub at `anchor_xyz` (or interpolate from member wires).

---

## 15) Quality gates (must pass)

* No unresolved IDs.
* 100% schema-valid records.
* Every `wire` either has `path_xyz` or both endpoints with anchors or a `routed_on` harness with path.
* Scene renders with **no NaN** transforms.
* Report generated.

---

## 16) What you should NOT do

* Do not fetch external data or infer unknown pinouts.
* Do not change measurement units.
* Do not reorder IDs or rename nodes.
* Do not bake materials/colors beyond what the scene config specifies.

---

## 17) Minimal end-to-end smoke test (expect green)

* Load sample with: 1 harness (with path), 2 components (battery, fusebox), 1 wire with endpoints and no path (autobridge), 1 ground plane + ground point.
* Expect: 0 errors, 1 auto-repair (wire path), R3F scene renders a tube and two device boxes.

---

*End of instructions.*
