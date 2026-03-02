// Web Audio API based notification sounds

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Play a pleasant chime for check-ins (ascending notes)
export function playCheckInSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillator for main tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Pleasant ascending chord (C5 -> E5 -> G5)
    osc1.type = 'sine';
    osc2.type = 'sine';
    
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.3); // G5

    osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5 harmony
    osc2.frequency.setValueAtTime(783.99, now + 0.25); // G5 harmony

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Could not play check-in sound:', e);
  }
}

// Play a notification bell for new appointments
export function playNewAppointmentSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Bell-like sound with multiple harmonics
    const frequencies = [880, 1760, 2640]; // A5 and harmonics
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Bell envelope with decay
      const volume = 0.2 / (i + 1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.8);
    });

    // Second bell strike
    setTimeout(() => {
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.06, now + 0.3); // Slightly higher
        
        const volume = 0.15 / (i + 1);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      });
    }, 300);
  } catch (e) {
    console.warn('Could not play new appointment sound:', e);
  }
}

// Play a subtle alert sound
export function playAlertSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    osc.frequency.setValueAtTime(440, now + 0.2);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn('Could not play alert sound:', e);
  }
}
