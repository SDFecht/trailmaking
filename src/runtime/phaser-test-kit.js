// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

export function createPhaserTestKit({
    Phaser,
    width,
    height,
    fontFamily = 'Verdana',
    fullscreenLabel = 'Fullscreen',
    fullscreenErrorLabel = 'Phaser test game',
    measurementMode = 'contain',
}) {
    function getStageSize(scene) {
        const targetSize = getGameTargetSize(scene);

        if (targetSize) {
            return targetSize;
        }

        return {
            width: scene.scale.width || width,
            height: scene.scale.height || height,
        };
    }

    function getMeasurementArea(scene) {
        const stage = getStageSize(scene);
        const scaleX = stage.width / width;
        const scaleY = stage.height / height;
        const scale = measurementMode === 'cover'
            ? Math.max(scaleX, scaleY)
            : Math.min(scaleX, scaleY);
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        return {
            scale,
            width: scaledWidth,
            height: scaledHeight,
            left: (stage.width - scaledWidth) / 2,
            top: (stage.height - scaledHeight) / 2,
            centerX: stage.width / 2,
            centerY: stage.height / 2,
        };
    }

    function mapPoint(area, x, y) {
        return {
            x: area.left + (x * area.scale),
            y: area.top + (y * area.scale),
        };
    }

    function scaleNumber(area, value) {
        const numericValue = typeof value === 'string'
            ? Number.parseFloat(value)
            : Number(value);

        return Math.max(1, numericValue * area.scale);
    }

    function scaledFontSize(area, value) {
        return `${Math.round(scaleNumber(area, value))}px`;
    }

    function createTextButton(scene, x, y, label, leftPad, rightPad, callback, options = {}) {
        const area = getMeasurementArea(scene);
        const position = options.stageCoordinates ? { x, y } : mapPoint(area, x, y);
        const idleStyle = {
            backgroundColor: options.backgroundColor ?? '#8f8f8f',
            color: options.color ?? '#ffffff',
        };
        const hoverStyle = {
            backgroundColor: options.hoverBackgroundColor ?? '#cccccc',
            color: options.hoverColor ?? '#000000',
        };
        const activeStyle = {
            backgroundColor: options.activeBackgroundColor ?? '#d00000',
            color: options.activeColor ?? '#ffffff',
        };

        const button = scene.add.text(position.x, position.y, label)
            .setOrigin(options.originX ?? 0.5, options.originY ?? 0.5)
            .setPadding({
                y: scaleNumber(area, options.paddingY ?? 25),
                left: scaleNumber(area, leftPad),
                right: scaleNumber(area, rightPad),
            })
            .setStyle({
                fontSize: scaledFontSize(area, options.fontSize ?? 56),
                fontFamily,
                color: idleStyle.color,
                align: 'center',
                backgroundColor: idleStyle.backgroundColor,
            })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                button.setStyle(activeStyle);
                void callback();
            })
            .on('pointerup', () => button.setStyle(hoverStyle))
            .on('pointerover', () => button.setStyle(hoverStyle))
            .on('pointerout', () => button.setStyle(idleStyle));

        if (typeof options.depth === 'number') {
            button.setDepth(options.depth);
        }

        return button;
    }

    function createLandscapeFullscreenGuard(scene, options = {}) {
        const target = getGameTarget(scene);

        if (! target) {
            return null;
        }

        target.querySelector(':scope > [data-test-orientation-guard]')?.remove();

        let pausedByGuard = false;
        let updateScheduled = false;
        let scaleSyncRequested = false;
        let destroyed = false;
        const overlay = document.createElement('div');
        overlay.setAttribute('data-test-orientation-guard', '');
        overlay.setAttribute('role', 'status');
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.zIndex = String(options.depth ?? 2000);
        overlay.style.display = 'none';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.gap = '1rem';
        overlay.style.padding = '2rem';
        overlay.style.background = options.background ?? '#ffffff';
        overlay.style.color = options.color ?? '#18181b';
        overlay.style.textAlign = 'center';
        overlay.style.fontFamily = fontFamily;

        const title = document.createElement('div');
        title.textContent = options.title ?? 'A feladat fekvő képernyőn használható';
        title.style.fontSize = '1.5rem';
        title.style.fontWeight = '700';
        title.style.lineHeight = '1.2';

        const message = document.createElement('div');
        message.textContent = options.message ?? 'Fordítsa el a kijelzőt fekvő helyzetbe, vagy lépjen ki teljes képernyőből.';
        message.style.maxWidth = '34rem';
        message.style.fontSize = '1rem';
        message.style.lineHeight = '1.5';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.flexWrap = 'wrap';
        actions.style.justifyContent = 'center';
        actions.style.gap = '0.75rem';

        const exitButton = createDomButton(options.exitLabel ?? 'Kilépés teljes képernyőből');
        exitButton.addEventListener('click', () => {
            void exitFullscreenForGame(scene);
        });

        const refreshButton = createDomButton(options.refreshLabel ?? 'Újrapróbálás');
        refreshButton.addEventListener('click', async () => {
            refreshButton.disabled = true;
            refreshButton.style.cursor = 'wait';

            await requestLandscapeOrientationForGame(scene);
            await refreshScaleAfterLayoutChange(scene);
            update();

            refreshButton.disabled = false;
            refreshButton.style.cursor = 'pointer';
        });

        actions.append(exitButton, refreshButton);
        overlay.append(title, message, actions);
        target.appendChild(overlay);

        const update = () => {
            const stage = getStageSize(scene);
            const isFullscreen = isGameFullscreen(scene);
            const shouldBlock = isFullscreen && stage.width < stage.height;

            if (! isFullscreen) {
                unlockOrientationForGame();
            }

            overlay.style.display = shouldBlock ? 'flex' : 'none';
            setScenePausedByGuard(shouldBlock);
        };
        const scheduleUpdate = (syncScale = false) => {
            if (destroyed || updateScheduled) {
                scaleSyncRequested = scaleSyncRequested || syncScale;

                return;
            }

            scaleSyncRequested = syncScale;
            updateScheduled = true;
            requestAnimationFrame(() => {
                updateScheduled = false;

                if (destroyed) {
                    return;
                }

                if (scaleSyncRequested) {
                    refreshScaleToTarget(scene);
                    scaleSyncRequested = false;
                }

                update();
            });
        };
        const scheduleScaleSyncAndUpdate = () => scheduleUpdate(true);
        const scheduleGuardUpdate = () => scheduleUpdate(false);
        const fullscreenEvents = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange',
        ];
        const scaleResizeEvent = Phaser.Scale?.Events?.RESIZE ?? 'resize';

        fullscreenEvents.forEach((eventName) => {
            document.addEventListener(eventName, scheduleScaleSyncAndUpdate);
        });
        window.addEventListener('resize', scheduleScaleSyncAndUpdate);
        window.addEventListener('orientationchange', scheduleScaleSyncAndUpdate);
        window.visualViewport?.addEventListener('resize', scheduleScaleSyncAndUpdate);
        scene.scale.on?.(scaleResizeEvent, scheduleGuardUpdate);

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            destroyed = true;
            fullscreenEvents.forEach((eventName) => {
                document.removeEventListener(eventName, scheduleScaleSyncAndUpdate);
            });
            window.removeEventListener('resize', scheduleScaleSyncAndUpdate);
            window.removeEventListener('orientationchange', scheduleScaleSyncAndUpdate);
            window.visualViewport?.removeEventListener('resize', scheduleScaleSyncAndUpdate);
            scene.scale.off?.(scaleResizeEvent, scheduleGuardUpdate);
            setScenePausedByGuard(false);
            overlay.remove();
        });

        update();

        return {
            element: overlay,
            refresh: update,
        };

        function setScenePausedByGuard(shouldPause) {
            if (options.pauseScene === false) {
                return;
            }

            if (shouldPause && ! pausedByGuard) {
                try {
                    scene.scene.pause();
                    pausedByGuard = true;
                } catch {
                    pausedByGuard = false;
                }

                return;
            }

            if (! shouldPause && pausedByGuard) {
                try {
                    scene.scene.resume();
                } catch {
                    // Ha a scene épp váltás vagy bezárás alatt áll, nincs mit visszaállítani.
                } finally {
                    pausedByGuard = false;
                }
            }
        }
    }

    function createDomButton(label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.style.minHeight = '2.5rem';
        button.style.border = '1px solid #bae6fd';
        button.style.borderRadius = '0.5rem';
        button.style.background = '#ffffff';
        button.style.color = '#075985';
        button.style.padding = '0.625rem 1rem';
        button.style.fontFamily = fontFamily;
        button.style.fontSize = '0.875rem';
        button.style.fontWeight = '600';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.08)';

        button.addEventListener('pointerenter', () => {
            button.style.background = '#f0f9ff';
        });
        button.addEventListener('pointerleave', () => {
            button.style.background = '#ffffff';
        });

        return button;
    }

    function addCenteredMessage(scene, label, options = {}) {
        const area = getMeasurementArea(scene);
        const position = mapPoint(area, options.x ?? width / 2, options.y ?? height / 2);

        return scene.add.text(position.x, position.y, label)
            .setOrigin(options.originX ?? 0.5, options.originY ?? 0.5)
            .setPadding({
                y: scaleNumber(area, options.paddingY ?? 25),
                left: scaleNumber(area, options.paddingX ?? 0),
                right: scaleNumber(area, options.paddingX ?? 0),
            })
            .setStyle({
                fontSize: scaledFontSize(area, options.fontSize ?? 56),
                fontFamily,
                color: options.color ?? '#ffffff',
                align: 'center',
                backgroundColor: options.backgroundColor ?? '#8f8f8f',
            });
    }

    function addCountdownText(scene, options = {}) {
        const text = scene.add.text(0, 0, options.label ?? '')
            .setOrigin(options.originX ?? 0.5, options.originY ?? 0.5)
            .setStyle({
                fontSize: '384px',
                fontFamily: options.fontFamily ?? fontFamily,
                fontStyle: options.fontStyle ?? 'bold',
                color: options.color ?? '#000000',
                align: 'center',
            });

        if (typeof options.depth === 'number') {
            text.setDepth(options.depth);
        }

        const updateLayout = () => {
            const area = getMeasurementArea(scene);
            const position = mapPoint(area, options.x ?? width / 2, options.y ?? height / 2);

            text.setPosition(position.x, position.y);
            text.setStyle({
                fontSize: scaledFontSize(area, options.fontSize ?? 384),
                fontFamily: options.fontFamily ?? fontFamily,
                fontStyle: options.fontStyle ?? 'bold',
                color: options.color ?? '#000000',
            });
        };

        updateLayout();

        if (options.watchLayoutChanges ?? true) {
            watchLayoutChanges(scene, updateLayout);
        }

        return text;
    }

    function createFullscreenRecoveryButton(scene, options = {}) {
        const button = scene.add.text(options.x ?? 18, options.y ?? 18, options.label ?? fullscreenLabel)
            .setOrigin(0, 0)
            .setPadding({
                y: options.paddingY ?? 8,
                left: options.paddingX ?? 12,
                right: options.paddingX ?? 12,
            })
            .setStyle({
                fontSize: options.fontSize ?? '18px',
                fontFamily,
                color: '#ffffff',
                align: 'center',
                backgroundColor: '#8f8f8f',
            })
            .setDepth(options.depth ?? 1000)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', async () => {
                await requestFullscreenForGame(scene);
                updateFullscreenRecoveryButtonVisibility(scene, button);
            })
            .on('pointerup', () => button.setStyle({ backgroundColor: '#cccccc', color: '#000000' }))
            .on('pointerover', () => button.setStyle({ backgroundColor: '#cccccc', color: '#000000' }))
            .on('pointerout', () => button.setStyle({ backgroundColor: '#8f8f8f', color: '#ffffff' }));

        const refreshVisibility = () => updateFullscreenRecoveryButtonVisibility(scene, button);
        const fullscreenEvents = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange',
        ];

        fullscreenEvents.forEach((eventName) => {
            document.addEventListener(eventName, refreshVisibility);
        });

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            fullscreenEvents.forEach((eventName) => {
                document.removeEventListener(eventName, refreshVisibility);
            });
        });

        refreshVisibility();

        return button;
    }

    function updateFullscreenRecoveryButtonVisibility(scene, button) {
        button.setVisible(! isGameFullscreen(scene));
    }

    async function requestFullscreenForGame(scene) {
        const target = scene.game.canvas?.parentElement ?? scene.game.canvas;

        if (! target) {
            return false;
        }

        const fullscreenElement = document.fullscreenElement
            ?? document.webkitFullscreenElement
            ?? document.mozFullScreenElement
            ?? document.msFullscreenElement;

        if (fullscreenElement === target) {
            await requestLandscapeOrientationForGame(scene);
            await refreshScaleAfterLayoutChange(scene);

            return true;
        }

        const requestFullscreen = target.requestFullscreen
            ?? target.webkitRequestFullscreen
            ?? target.mozRequestFullScreen
            ?? target.msRequestFullscreen;

        if (requestFullscreen) {
            try {
                const result = requestFullscreen.call(target);

                if (result && typeof result.then === 'function') {
                    await result;
                }

                await requestLandscapeOrientationForGame(scene);
                await refreshScaleAfterLayoutChange(scene);

                return true;
            } catch (error) {
                console.warn(`The browser rejected fullscreen mode for ${fullscreenErrorLabel}.`, error);
            }
        }

        try {
            scene.scale.startFullscreen();
            await requestLandscapeOrientationForGame(scene);
            await refreshScaleAfterLayoutChange(scene);

            return true;
        } catch (error) {
            console.warn(`Phaser fullscreen fallback failed for ${fullscreenErrorLabel}.`, error);
        }

        return false;
    }

    async function exitFullscreenForGame(scene) {
        const exitFullscreen = document.exitFullscreen
            ?? document.webkitExitFullscreen
            ?? document.mozCancelFullScreen
            ?? document.msExitFullscreen;

        if (exitFullscreen) {
            try {
                const result = exitFullscreen.call(document);

                if (result && typeof result.then === 'function') {
                    await result;
                }

                unlockOrientationForGame();
                await refreshScaleAfterLayoutChange(scene);

                return true;
            } catch (error) {
                console.warn(`The browser rejected exiting fullscreen mode for ${fullscreenErrorLabel}.`, error);
            }
        }

        try {
            scene.scale.stopFullscreen?.();
            unlockOrientationForGame();
            await refreshScaleAfterLayoutChange(scene);

            return true;
        } catch (error) {
            console.warn(`Phaser fullscreen exit fallback failed for ${fullscreenErrorLabel}.`, error);
        }

        return false;
    }

    async function requestLandscapeOrientationForGame(scene) {
        if (! isGameFullscreen(scene)) {
            return false;
        }

        const orientation = window.screen?.orientation;
        const lock = orientation?.lock;

        if (typeof lock !== 'function') {
            return false;
        }

        for (const lockMode of ['landscape', 'landscape-primary']) {
            try {
                const result = lock.call(orientation, lockMode);

                if (result && typeof result.then === 'function') {
                    await withTimeout(result, 2000);
                }

                return true;
            } catch {
                // Több böngésző csak bizonyos eszközön, fullscreenben vagy felhasználói gesztus után engedi.
            }
        }

        return false;
    }

    function unlockOrientationForGame() {
        try {
            window.screen?.orientation?.unlock?.();
        } catch {
            // Nem minden böngésző támogatja, és van ahol fullscreenből kilépéskor automatikusan felszabadul.
        }
    }

    async function refreshScaleAfterLayoutChange(scene) {
        refreshScaleToTarget(scene);
        await nextAnimationFrame();
        refreshScaleToTarget(scene);
        await nextAnimationFrame();
        refreshScaleToTarget(scene);
    }

    function refreshScaleToTarget(scene) {
        const targetSize = getGameTargetSize(scene);

        if (! targetSize) {
            return false;
        }

        const currentWidth = Math.round(scene.scale.width || 0);
        const currentHeight = Math.round(scene.scale.height || 0);

        if (currentWidth === targetSize.width && currentHeight === targetSize.height) {
            return false;
        }

        if (typeof scene.scale.resize === 'function') {
            scene.scale.resize(targetSize.width, targetSize.height);

            return true;
        }

        scene.scale.refresh?.();

        return true;
    }

    function getGameTarget(scene) {
        return scene.game.canvas?.parentElement ?? scene.game.canvas ?? null;
    }

    function getGameTargetSize(scene) {
        const target = getGameTarget(scene);
        const bounds = target?.getBoundingClientRect?.();

        if (! bounds) {
            return null;
        }

        const targetWidth = Math.round(bounds.width);
        const targetHeight = Math.round(bounds.height);

        if (targetWidth < 1 || targetHeight < 1) {
            return null;
        }

        return {
            width: targetWidth,
            height: targetHeight,
        };
    }

    function nextAnimationFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(resolve);
        });
    }

    function withTimeout(promise, timeoutMs) {
        let timeoutId;

        return Promise.race([
            Promise.resolve(promise).finally(() => {
                clearTimeout(timeoutId);
            }),
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('Orientation lock timed out.'));
                }, timeoutMs);
            }),
        ]);
    }

    function watchLayoutChanges(scene, callback) {
        let scheduled = false;
        let destroyed = false;

        const schedule = () => {
            if (destroyed || scheduled) {
                return;
            }

            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;

                if (! destroyed) {
                    callback();
                }
            });
        };
        const scaleResizeEvent = Phaser.Scale?.Events?.RESIZE ?? 'resize';

        window.addEventListener('resize', schedule);
        window.addEventListener('orientationchange', schedule);
        window.visualViewport?.addEventListener('resize', schedule);
        scene.scale.on?.(scaleResizeEvent, schedule);

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            destroyed = true;
            window.removeEventListener('resize', schedule);
            window.removeEventListener('orientationchange', schedule);
            window.visualViewport?.removeEventListener('resize', schedule);
            scene.scale.off?.(scaleResizeEvent, schedule);
        });

        schedule();

        return schedule;
    }

    function isGameFullscreen(scene) {
        const target = getGameTarget(scene);
        const fullscreenElement = document.fullscreenElement
            ?? document.webkitFullscreenElement
            ?? document.mozFullScreenElement
            ?? document.msFullscreenElement;

        return Boolean(target && fullscreenElement === target);
    }

    return {
        addCenteredMessage,
        addCountdownText,
        createFullscreenRecoveryButton,
        createLandscapeFullscreenGuard,
        createTextButton,
        exitFullscreenForGame,
        getMeasurementArea,
        getStageSize,
        isGameFullscreen,
        mapPoint,
        refreshScaleToTarget,
        requestLandscapeOrientationForGame,
        requestFullscreenForGame,
        scaleNumber,
        scaledFontSize,
        watchLayoutChanges,
    };
}

export async function saveStandardTestResult(runtime, context, records) {
    await runtime.finish({
        testPublicId: context.testPublicId,
        records,
    });
}

export async function saveStandardExperimentResult(runtime, context, records) {
    await runtime.finish({
        experimentKey: context.experimentKey,
        runPublicId: context.runPublicId,
        records,
    });
}

export function relativeToBaseTime(value, baseTimeStamp) {
    return Number(Math.round(Number(value)) - Math.round(Number(baseTimeStamp)));
}

export function arraysEqual(left, right) {
    if (! Array.isArray(left) || ! Array.isArray(right) || left.length !== right.length) {
        return false;
    }

    return left.every((value, index) => value === right[index]);
}
