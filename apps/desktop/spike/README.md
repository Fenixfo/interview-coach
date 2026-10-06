# Spike: loopback de Windows + Whisper local

Valida la fase 1 antes de construir la interfaz.

```
pnpm install
node apps/desktop/node_modules/electron/install.js    # una vez: descarga el binario de Electron
pnpm --filter @interview-coach/desktop model base.en  # y tiny.en
pnpm --filter @interview-coach/desktop bench base.en  # latencia sin Electron
pnpm --filter @interview-coach/desktop spike          # app: audio del sistema → texto
```

`sample.wav` (no versionado) se genera con la voz SAPI en inglés de Windows, 16 kHz mono.

Requisito en Windows: Visual C++ Redistributable 2015-2022 x64. El instalador final debe incluirlo o instalarlo.
