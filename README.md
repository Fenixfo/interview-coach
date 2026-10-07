# Coach de entrevistas en inglés

Aplicación para practicar entrevistas de trabajo en inglés. Escucha al entrevistador, muestra la transcripción en inglés y su traducción al español en vivo, detecta cuándo termina la pregunta y sugiere una respuesta en primera persona basada en tu perfil.

> Estado: **Fases 1 y 2 (escritorio, Windows).** La web y el celular vienen después. Ver el plan por fases más abajo.

## Cómo funciona

1. Captura el audio del sistema (YouTube, Zoom, Meet, Teams) o el micrófono.
2. Transcribe en inglés con **Whisper local** (gratis, sin gastar cuota).
3. Traduce al español en vivo con el traductor gratuito de Google; si falla, usa Gemini solo para frases completas.
4. Cierra la pregunta tras una pausa (1,5 s por defecto, configurable).
5. Si el texto parece una pregunta, genera con **Gemini** una respuesta de 60 a 120 palabras, en inglés sencillo (nivel B2 por defecto), con método STAR en preguntas de comportamiento. Si a tu perfil le falta un dato, deja un marcador como `[número de clientes]` en lugar de inventarlo.

## Modos

- **En vivo:** escucha el audio del sistema (o el micrófono) y muestra pregunta, traducción y respuesta sugerida. Incluye ventana flotante siempre visible.
- **Simulación:** escribes un cargo y Gemini genera preguntas, las lee en voz alta y escucha tu respuesta por el micrófono. Al final recibes retroalimentación en español sobre gramática, vocabulario y claridad. Necesita tu clave de Gemini.
- **Historial:** cada sesión en vivo o simulación se guarda en tu equipo (hasta 200). Puedes verla, eliminarla o exportarla a Markdown.

## Actualizaciones automáticas

La app instalada busca versiones nuevas en GitHub Releases al abrir, las descarga y te avisa con un botón "Reiniciar e instalar". En desarrollo no se activan. El instalador no está firmado, así que Windows puede mostrar una advertencia de SmartScreen.

## Instalación para desarrollo (Windows)

Requisitos: Node 22 o superior, pnpm y el *Visual C++ Redistributable 2015-2022 x64* (lo necesita Whisper).

```
pnpm install
node apps/desktop/node_modules/electron/install.js   # una vez: descarga el binario de Electron
pnpm --filter @interview-coach/desktop dev
```

La primera vez, la app descarga el modelo de voz (`ggml-base.en`, unos 140 MB) y muestra el progreso.

Otros comandos útiles:

```
pnpm test                                  # pruebas unitarias de packages/core
pnpm typecheck                             # TypeScript estricto en todo el monorepo
pnpm --filter @interview-coach/desktop demo   # pantalla con datos sintéticos, sin audio ni clave
```

## Tu clave de Gemini

Cada persona usa **su propia clave gratuita** (no hay servidor ni clave compartida).

1. Entra a [Google AI Studio](https://aistudio.google.com/apikey) y crea una clave.
2. En la app: Ajustes → Clave de Gemini → pegar → Guardar.

La clave se cifra con el sistema operativo (`safeStorage`, DPAPI en Windows) y se guarda solo en tu equipo. Nunca se escribe en el repositorio ni en archivos de texto.

El modelo por defecto es el Flash-Lite vigente, que tiene la cuota gratuita más amplia. Los límites exactos cambian: consúltalos en AI Studio. Si se agota la cuota, la app te lo dice en español y puedes seguir usando la transcripción y la traducción.

## Privacidad

El audio no sale de tu equipo para transcribir (Whisper corre en local). Sí pueden procesarse con servicios de Google: el **texto** que se traduce y el texto de las preguntas y tu perfil que se envían a Gemini.

## Estructura

```
packages/core   lógica sin dependencias de plataforma (TypeScript): proveedores, detección
                de preguntas, segmentación de turnos, transcripción en vivo, prompts y cliente de Gemini
packages/ui     interfaz React compartida (pantalla principal, ajustes)
apps/desktop    Electron (Windows primero)
apps/web        (pendiente) Vite + PWA en GitHub Pages
apps/mobile     (pendiente) Capacitor, Android primero
```

## Seguridad de Electron

`contextIsolation` activado, `nodeIntegration` desactivado, `sandbox` activado, preload con API mínima (canales IPC fijos), CSP estricta en la compilación y navegación externa bloqueada.

## Plan

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Investigación y plan | Hecha |
| 1 | Escritorio Windows (MVP): audio del sistema, Whisper local, traducción, Gemini, pantalla, instalador | Hecha (PR abierto) |
| 2 | Modo simulación con voz, historial exportable, actualizaciones automáticas | En revisión |
| 3 | Web (PWA en GitHub Pages) | Pendiente |
| 4 | Celular (Capacitor, Android primero) | Pendiente |

## Limitaciones conocidas

- La simulación lee las preguntas con las voces de Windows: la calidad depende de las voces en inglés que tengas instaladas.
- Las actualizaciones automáticas no se han probado todavía (hacen falta dos versiones publicadas).
- Solo Windows para el audio del sistema (el *loopback* de Electron es exclusivo de Windows).
- El traductor gratuito usa un endpoint no oficial de Google y puede dejar de funcionar.
- Las pausas de la persona que habla pueden partir una pregunta larga en dos fichas.
- La transcripción parcial se recalcula cada segundo; en equipos sin GPU compatible con Vulkan la latencia sube a 1,5 s.
