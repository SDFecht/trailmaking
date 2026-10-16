// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

import Phaser from '../../vendor/phaser/phaser.esm.min.js';

export { Phaser };

export function createPhaserGame({
    element,
    scenes,
    width = 1024,
    height = 672,
    title = 'Trail Making',
    backgroundColor = '#ffffff',
    scaleMode = Phaser.Scale.FIT,
    autoCenter = Phaser.Scale.CENTER_BOTH,
}) {
    let destroyed = false;

    ensurePhaserRuntimeStyles();
    element.replaceChildren();

    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: element,
        width,
        height,
        backgroundColor,
        title,
        scale: {
            width,
            height,
            mode: scaleMode,
            autoCenter,
            fullscreenTarget: element,
        },
        scene: scenes,
    });

    return {
        destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            game.destroy(true);
            element.replaceChildren();
        },
    };
}

function ensurePhaserRuntimeStyles() {
    if (document.getElementById('adapsyd-experiment-phaser-runtime-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'adapsyd-experiment-phaser-runtime-styles';
    style.textContent = `
        [data-experiment-runtime] {
            position: relative;
            display: block;
            width: 100%;
            aspect-ratio: 1024 / 672;
            min-height: 0;
            overflow: hidden;
        }

        [data-experiment-runtime] canvas {
            display: block;
            margin: 0 auto;
        }

        [data-experiment-runtime]:fullscreen,
        [data-experiment-runtime]:-webkit-full-screen {
            width: 100vw !important;
            height: 100vh !important;
            min-height: 100vh !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
        }

        [data-experiment-runtime]:fullscreen canvas,
        [data-experiment-runtime]:-webkit-full-screen canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
        }
    `;

    document.head.appendChild(style);
}
