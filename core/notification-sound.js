let audioContext;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextType = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextType) return null;
  audioContext ??= new AudioContextType();
  return audioContext;
}

export function unlockNotificationSound() {
  const context = getAudioContext();
  if (context?.state === "suspended") void context.resume().catch(() => {});
}

export function playNotificationSound() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume().catch(() => {});

  const startAt = context.currentTime + 0.015;
  [740, 988].forEach((frequency, index) => {
    const start = startAt + index * 0.105;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.075, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.1);
  });
}
