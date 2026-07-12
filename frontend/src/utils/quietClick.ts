let audioCtx: AudioContext | null = null;
const lastPlayedByKey = new Map<string, number>();

/** Короткий тихий «щелчок» при наведении (Web Audio, без файлов). */
export function playQuietClick(key = "default", minIntervalMs = 40) {
  const now = Date.now();
  const last = lastPlayedByKey.get(key) ?? 0;
  if (now - last < minIntervalMs) return;
  lastPlayedByKey.set(key, now);

  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    const ctx = audioCtx;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const duration = 0.028;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18);
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1100;

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    /* autoplay policy or unsupported */
  }
}
