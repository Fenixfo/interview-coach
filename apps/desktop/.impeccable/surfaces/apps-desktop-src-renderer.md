---
version: 1
slug: "apps-desktop-src-renderer"
primary_target: "apps/desktop/src/renderer"
related_targets: []
---

## Scope

Pantalla principal de escritorio (Electron, Windows). Modo Operate. Un solo layout con dos densidades: completo (tres columnas) y flotante compacto (siempre visible sobre Zoom/Meet).

## Task

Persona que se entrevista en inglés, de noche, con luz baja, que no debe delatar la herramienta en cámara. Al terminar el entrevistador, pregunta (con su traducción) y respuesta sugerida se leen de un vistazo y pesan lo mismo; la respuesta es el texto más grande porque se lee en voz alta.

Controles: Iniciar/Pausar, Mi turno, Responder última, Limpiar, Ajustes, Flotante. Estados: primera vez sin clave, escuchando sin voz, pregunta detectada, respuesta generándose, cuota agotada (429), clave inválida.

## Direction contract

THESIS: la pantalla es una sala de museo, no un panel de IA. Cada pregunta del entrevistador es una pieza con ficha: número de catálogo (P-07) y cartela bilingüe, inglés arriba y español debajo. Rechaza el tablero oscuro de tres paneles con acento neón.

OWN-WORLD: pared de verde tinta profundo (no gris), cartelas separadas por costuras de 1 px, sin sombras ni tarjetas anidadas. Tipo grotesca institucional (Public Sans variable) en hueso apagado, brillo máximo bajo. Latón mate como único acento (escuchando, acción principal); terracota apagada solo para errores. Parcial en verde-gris, final en hueso. Reconocible sin contenido por la pared verde, las costuras finas y la escala tipográfica contrastada.

STORY: el usuario entiende qué le preguntaron (inglés + español en la misma ficha) y sabe qué decir (la cartela mayor con la respuesta). Cree que la herramienta no lo expone: nada parpadea, nada brilla. Actúa leyendo la respuesta en voz alta.

FIRST VIEWPORT: barra superior con estado y controles estándar (Iniciar primario en latón, Mi turno, Responder última, Limpiar, fuente de audio, Flotante, Ajustes). Debajo, tres columnas separadas por costuras: inglés en vivo (1fr), español (1fr) y la columna foco (1.5fr) con la ficha de la pregunta arriba y la respuesta sugerida en letra grande debajo. Línea de privacidad discreta al pie. En modo flotante colapsa a pregunta + respuesta y la transcripción queda tras un toque.

FORM: cartela de museo bilingüe, candidato 6 de mi lista (asignado por el sorteo), seed key 05b7b40b. Raise: de la consola oscura, paneles persistentes con costuras de 1 px y colapso por prioridad.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions

Nombre y logo del producto; tema claro; forma del aviso de privacidad.
