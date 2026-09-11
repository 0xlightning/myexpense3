# Graphify
Tool: Knowledge Graph Engine.
Goal: Reduce token usage by mapping the narrow path before reading.

## Protocol
1. **Map:** Initialize graph. Identify "God Nodes" (central files) and communities (related clusters).
2. **Path:** Find the shortest path between a requirement and the code that implements it.
3. **Traverse:** Navigate `Route → Component → State/Logic → Style`.

## Operational Workflow
1. **Verification:** Confirm graph exists before traversal.
2. **Query Expansion:** Use "Constrained query expansion". Select up to 12 tokens from the graph's actual vocabulary. **Do not invent tokens.**
3. **Execution:** Answer using only graph data. Always cite `source_location`.
4. **Feedback:** Store answers via `graphify save-result` with an `--outcome` (useful, dead_end, corrected).
5. **Reflection:** Review `LESSONS.md` via `graphify reflect --if-stale`.

## Traversal Modes
- **BFS (Breadth-First Search):** Default. Use for broad context and exploring neighborhoods.
- **DFS (Depth-First Search):** Use to trace a specific chain or deep dependency path.

## Commands
- `/graphify`: Initialize graph from folder/docs.
- `/graphify query`: Ask questions about architecture.
- `/graphify path`: Find the shortest path between two named concepts.
- `/graphify explain`: Plain-language explanation of a single node and its links.

## Value
Prevents "repo-wide browsing". Instead of grepping everything, use the graph to find the exactly 3-5 files that matter.
