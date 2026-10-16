// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

export function playErrorTone(soundManager) {
    const context = soundManager?.context;

    if (! context || context.state === 'closed') {
        return;
    }

    const play = () => {
        if (context.state !== 'running') {
            return;
        }

        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = context.currentTime;
        const duration = 0.15;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, start);
        oscillator.frequency.exponentialRampToValueAtTime(180, start + duration);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(0.12, start + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(soundManager.destination ?? context.destination);
        oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + duration);
    };

    if (context.state === 'suspended') {
        void context.resume().then(play).catch(() => {});
    } else {
        play();
    }
}
