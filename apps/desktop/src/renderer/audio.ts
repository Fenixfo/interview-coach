import type { AudioSourceKind } from "@interview-coach/core";

/** Captura de audio mono a 16 kHz: loopback del sistema (Windows) o micrófono. */
export async function startAudio(
  source: AudioSourceKind,
  onChunk: (pcm: Float32Array) => void,
): Promise<() => void> {
  const stream =
    source === "system"
      ? await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
      : await navigator.mediaDevices.getUserMedia({ audio: true });

  // El loopback exige pedir video; no lo necesitamos.
  stream.getVideoTracks().forEach((t) => t.stop());
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) throw new Error("NotAllowed: la fuente no entregó audio");

  const ctx = new AudioContext({ sampleRate: 16000 });
  await ctx.audioWorklet.addModule("capture-worklet.js");
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
