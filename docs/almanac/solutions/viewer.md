# The viewer

The one viewer of every interface (`src/gui/index.vue`): Bulma, mermaid
for ties, Cytoscape.js for their minimap, sigma.js for the map of the law.

- Sigma 4: `visibility: "hidden"` hides, 6-digit colours only, positions
  through `graphToViewport(graph.getNodeAttributes(node))`.
- Mermaid is loaded lazily (about 6 MB), only when an act has ties.
- Vectors are parquet in snappy, which hyparquet reads alone.

## Cases

- [The map of the law shows hidden edges in wrong colours](../cataclistics/sigma-edges.md)
- [The viewer cannot read the vectors](../cataclistics/hyparquet-zstd.md)
- [Notices of changed files stop when two api servers run](../cataclistics/inotify-watches.md)
