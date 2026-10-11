## Seguimiento de trabajo (claude-mem)

- Todo plan o lista de pasos numerados se guarda con `work_state_write` (una lista por plan, una tarea por paso) ANTES de empezar a ejecutarlo.
- Actualiza el estado de cada tarea (`todo` / `doing` / `done` / `dropped`) al avanzar y al cerrar la sesión.
- Si el usuario se refiere a "el punto N" o a un plan previo, consulta primero `work_state_read` con `includeClosed=true`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
