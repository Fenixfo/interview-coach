import type { AudioSourceKind } from "@interview-coach/core";

/** Captura de audio mono a 16 kHz: audio de una pestaña compartida o micrófono. */
export async function startAudio(
  source: AudioSourceKind,
  onChunk: (pcm: Float32Array) => void,
): Promise<() => void> {
  const stream =
    source === "tab"
      ? await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
      : await navigator.mediaDevices.getUserMedia({ audio: true });

  // Compartir una pestaña exige pedir video; no lo necesitamos.
  stream.getVideoTracks().forEach((t) => t.stop());
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("NotAllowed: la fuente no entregó audio (marca «Compartir audio de la pestaña»)");
  }

  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    await ctx.audioWorklet.addModule(`${import.meta.env.BASE_URL}capture-worklet.js`);
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
    throw err;
  }
  const src = ctx.createMediaStreamSource(new MediaStream(audioTracks));
  const node = new AudioWorkletNode(ctx, "capture");
  node.port.onmessage = (e: MessageEvent<Float32Array>) => onChunk(e.data);
  src.connect(node);

  return () => {
    node.port.onmessage = null;
    node.disconnect();
    src.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
}
