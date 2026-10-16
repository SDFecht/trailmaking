// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>
// Includes Random-Irregular-Polygon by Kelvin Au; see the attribution below.

import { createPhaserGame, Phaser } from '../runtime/phaser-runtime.js';
import { createPhaserTestKit } from '../runtime/phaser-test-kit.js';
import { playErrorTone } from '../runtime/feedback-tone.js';
import { trailConfig } from './trail-config.js';

const gameCode = 'trail_making_phaser4';
const gameWidth = trailConfig.width;
const gameHeight = trailConfig.height;
const inhibitionBaselineTaskKey = 'inhibition_baseline_15';
const taskKeys = ['A', 'B', inhibitionBaselineTaskKey, 'C', 'D'];

export default {
    code: gameCode,
    label: 'Trail Making',
    phaser: trailConfig.phaserVersionLabel,
    async mount({ element, context, runtime }) {
        const locale = resolveLocale(context);
        const texts = resolveTexts(locale);
        runtime.setStatus?.(
            locale === 'hu'
                ? 'A teszt \u00e1llom\u00e1nyainak bet\u00f6lt\u00e9se...'
                : 'Loading test files...',
            'info',
        );

        const testKit = createPhaserTestKit({
            Phaser,
            width: gameWidth,
            height: gameHeight,
            fontFamily: 'Verdana',
            fullscreenLabel: texts.fullscreen,
            fullscreenErrorLabel: context.label ?? 'Trail Making',
        });

        const mountedGame = createPhaserGame({
            element,
            width: gameWidth,
            height: gameHeight,
            title: `${context.label ?? 'Trail Making'} - ${trailConfig.phaserVersionLabel}`,
            backgroundColor: trailConfig.backgroundColor,
            scaleMode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.NO_CENTER,
            scenes: createTrailScenes({
                context,
                locale,
                runtime,
                testKit,
                texts,
            }),
        });

        return {
            destroy() {
                mountedGame.destroy();
            },
        };
    },
};

function createTrailScenes({
    context,
    locale,
    runtime,
    testKit,
    texts,
}) {
    const state = createInitialState(locale, context.ageGroup === 'child', context.recorder);
    const {
        addCountdownText,
        createFullscreenRecoveryButton,
        createLandscapeFullscreenGuard,
        getMeasurementArea,
        getStageSize,
        mapPoint,
        requestFullscreenForGame,
        scaleNumber,
        watchLayoutChanges,
    } = testKit;

    class BaseTrailScene extends Phaser.Scene {
        constructor(key) {
            super(key);
            this.recorder = context.recorder;
        }

        createMenuButton(y, label, callback, options = {}) {
            return createFullWidthMenuButton(this, {
                ...trailConfig.menuButton,
                callback,
                getMeasurementArea,
                getStageSize,
                label,
                mapPoint,
                scaleNumber,
                watchLayoutChanges,
                y,
                ...options,
            });
        }

        createFullWidthMessage(y, label, options = {}) {
            return createFullWidthMenuButton(this, {
                ...trailConfig.menuButton,
                callback: null,
                getMeasurementArea,
                getStageSize,
                interactive: false,
                label,
                mapPoint,
                scaleNumber,
                watchLayoutChanges,
                y,
                ...options,
            });
        }

        createFullscreenRecoveryButton() {
            createLandscapeFullscreenGuard(this, {
                title: texts.landscapeTitle,
                message: texts.landscapeMessage,
                exitLabel: texts.exitFullscreen,
                refreshLabel: texts.retry,
            });

            return createFullscreenRecoveryButton(this);
        }
    }

    class TitleScene extends BaseTrailScene {
        constructor() {
            super('TitleScene');
        }

        create() {
            this.createMenuButton(
                gameHeight / 2,
                texts.start,
                async () => {
                    await requestFullscreenForGame(this);
                    this.scene.start('MainMenuScene');
                },
                { fontSize: 48 },
            );
        }
    }

    class MainMenuScene extends BaseTrailScene {
        constructor() {
            super('MainMenuScene');
        }

        create() {
            this.createFullscreenRecoveryButton();

            const cognitiveComplete = isCognitiveComplete(state);
            const inhibitionComplete = isInhibitionComplete(state);
            const canSave = cognitiveComplete || inhibitionComplete;
            const mainMenuButtonOptions = { height: 86, fontSize: 38 };

            this.createMenuButton(112, cognitiveComplete ? texts.cognitiveDone : texts.cognitive, () => {
                if (cognitiveComplete) {
                    resetCognitiveState(state);
                }

                state.activeGroup = 'cognitive';
                this.scene.start('CognitiveMenuScene');
            }, mainMenuButtonOptions);

            this.createMenuButton(244, inhibitionMainMenuLabel(texts, inhibitionComplete), () => {
                if (inhibitionComplete) {
                    resetInhibitionState(state);
                }

                state.activeGroup = 'inhibition';
                this.scene.start('InhibitionMenuScene');
            }, mainMenuButtonOptions);

            this.createMenuButton(376, saveMainMenuLabel(texts, cognitiveComplete, inhibitionComplete), () => {
                if (! canSave) {
                    return;
                }

                this.scene.start('SaveScene');
            }, canSave
                ? mainMenuButtonOptions
                : { ...disabledButtonOptions(), ...mainMenuButtonOptions });

            this.createMenuButton(524, texts.restartAll, () => {
                resetAllState(state);
                this.scene.start('MainMenuScene');
            }, mainMenuButtonOptions);
        }
    }

    class CognitiveMenuScene extends BaseTrailScene {
        constructor() {
            super('CognitiveMenuScene');
        }

        create() {
            this.createFullscreenRecoveryButton();
            createTaskMenu(this, state, texts, ['A', 'B'], () => {
                this.scene.start('MainMenuScene');
            }, texts.backToMainMenu);
        }
    }

    class InhibitionMenuScene extends BaseTrailScene {
        constructor() {
            super('InhibitionMenuScene');
        }

        create() {
            this.createFullscreenRecoveryButton();

            createInhibitionTaskMenu(this, state, texts, () => {
                this.scene.start('MainMenuScene');
            });
        }
    }

    class TaskChoiceScene extends BaseTrailScene {
        constructor() {
            super('TaskChoiceScene');
        }

        init(data = {}) {
            this.taskKey = resolveTaskKey(data.taskKey);
        }

        create() {
            this.createFullscreenRecoveryButton();

            this.createMenuButton(gameHeight / 3, texts.test, () => {
                state.activeTask = this.taskKey;
                resetTaskResult(state, this.taskKey);
                this.scene.start('CounterScene', { taskKey: this.taskKey });
            });

            this.createMenuButton(gameHeight * 2 / 3, texts.back, () => {
                this.scene.start(groupMenuSceneForTask(this.taskKey));
            });
        }
    }

    class CounterScene extends BaseTrailScene {
        constructor() {
            super('CounterScene');
        }

        init(data = {}) {
            this.taskKey = resolveTaskKey(data.taskKey);
        }

        create() {
            this.createFullscreenRecoveryButton();

            const counterText = addCountdownText(this);
            let counter = trailConfig.timings.countdownStart;

            this.time.addEvent({
                delay: trailConfig.timings.countdownStepTime,
                callback: () => {
                    counter -= 1;

                    if (counter > -1) {
                        counterText.setText(counter);

                        return;
                    }

                    state.baseTimeStamp = this.time.now;
                    this.scene.start('TestScene', { taskKey: this.taskKey });
                },
                repeat: trailConfig.timings.countdownStart,
            });
        }
    }

    class TestScene extends BaseTrailScene {
        constructor() {
            super('TestScene');
        }

        init(data = {}) {
            this.taskKey = resolveTaskKey(data.taskKey);
        }

        create() {
            this.createFullscreenRecoveryButton();
            createTrailField(this, state, this.taskKey, texts, testKit);
        }
    }

    class CognitiveCompleteScene extends BaseTrailScene {
        constructor() {
            super('CognitiveCompleteScene');
        }

        create() {
            this.createFullscreenRecoveryButton();

            this.createFullWidthMessage(180, texts.cognitiveClosed, {
                fontSize: 40,
                height: 86,
            });

            this.createMenuButton(380, texts.backToMainMenu, () => {
                this.scene.start('MainMenuScene');
            }, { height: 86, fontSize: 40 });
        }
    }

    class SummaryScene extends BaseTrailScene {
        constructor() {
            super('SummaryScene');
        }

        create() {
            this.createFullscreenRecoveryButton();

            this.createFullWidthMessage(180, texts.inhibitionClosed, {
                fontSize: 40,
                height: 86,
            });

            this.createMenuButton(380, texts.backToMainMenu, () => {
                this.scene.start('MainMenuScene');
            }, { height: 86, fontSize: 40 });
        }
    }

    class SaveScene extends BaseTrailScene {
        constructor() {
            super('SaveScene');
        }

        create() {
            this.createFullscreenRecoveryButton();
            this.createFullWidthMessage(gameHeight / 2, texts.saving);

            void saveSummary(runtime, context, state);
        }
    }

    return [
        TitleScene,
        MainMenuScene,
        CognitiveMenuScene,
        InhibitionMenuScene,
        TaskChoiceScene,
        CounterScene,
        TestScene,
        CognitiveCompleteScene,
        SummaryScene,
        SaveScene,
    ];
}

function createTaskMenu(scene, state, texts, keys, onBack, backLabel = texts.back) {
    scene.createMenuButton(190, taskMenuLabel(texts, state, keys[0]), () => {
        startTaskFromMenu(scene, state, keys[0]);
    });

    scene.createMenuButton(336, taskMenuLabel(texts, state, keys[1]), () => {
        startTaskFromMenu(scene, state, keys[1]);
    });

    scene.createMenuButton(486, backLabel, onBack);
}

function createInhibitionTaskMenu(scene, state, texts, onBack) {
    const hasBaseline = hasEffectiveInhibitionBaseline(state);
    const baselineUsesCognitiveA = hasCognitiveBaseline(state);
    const baselineLabel = baselineUsesCognitiveA
        ? texts.tasks.inhibition_baseline_from_a
        : taskMenuLabel(texts, state, inhibitionBaselineTaskKey);

    scene.createMenuButton(
        132,
        baselineLabel,
        () => {
            if (hasCognitiveBaseline(state)) {
                return;
            }

            startTaskFromMenu(scene, state, inhibitionBaselineTaskKey);
        },
        baselineUsesCognitiveA
            ? { ...disabledButtonOptions(), height: 86, fontSize: 40 }
            : { height: 86, fontSize: 40 },
    );

    scene.createMenuButton(
        264,
        taskMenuLabel(texts, state, 'C'),
        () => {
            if (! hasEffectiveInhibitionBaseline(state)) {
                return;
            }

            startTaskFromMenu(scene, state, 'C');
        },
        hasBaseline
            ? { height: 86, fontSize: 40 }
            : { ...disabledButtonOptions(), height: 86, fontSize: 40 },
    );

    scene.createMenuButton(
        396,
        taskMenuLabel(texts, state, 'D'),
        () => {
            if (! hasEffectiveInhibitionBaseline(state)) {
                return;
            }

            startTaskFromMenu(scene, state, 'D');
        },
        hasBaseline
            ? { height: 86, fontSize: 40 }
            : { ...disabledButtonOptions(), height: 86, fontSize: 40 },
    );

    scene.createMenuButton(540, texts.backToMainMenu ?? texts.back, onBack, { height: 86, fontSize: 40 });
}

function startTaskFromMenu(scene, state, taskKey) {
    if (hasTaskResult(state, taskKey)) {
        resetTaskResult(state, taskKey);
    }

    state.activeTask = taskKey;
    scene.scene.start('TaskChoiceScene', { taskKey });
}

function createTrailField(scene, state, taskKey, texts, testKit) {
    const task = trailConfig.tasks[taskKey];
    const pointCount = pointCountForTask(task, state.isForChildren);
    const coords = generatePoints(task, pointCount);
    const labels = createLabels(taskKey, pointCount);
    const lineGraphics = scene.add.graphics().setDepth(1);
    const nodes = coords.map((coord, index) => {
        const circleConfig = circleConfigForTask(task, index);
        const colors = colorsForNode(index);
        const circle = scene.add.circle(0, 0, circleConfig.radius, colors.idle)
            .setOrigin(0.5, 0.5)
            .setDepth(2)
            .setStrokeStyle(4, colors.stroke)
            .setInteractive({ useHandCursor: true });
        const text = scene.add.text(0, 0, labels[index], {
            fontFamily: 'Verdana',
            fontSize: `${circleConfig.fontSize}px`,
            color: trailConfig.colors.text,
            align: 'center',
        })
            .setOrigin(0.5)
            .setDepth(3);

        circle
            .on('pointerdown', (pointer) => {
                handleNodeClick(scene, state, taskKey, index, pointer);
                circle.setFillStyle(colors.active, 1);
            })
            .on('pointerup', () => {
                circle.setFillStyle(colors.hover, 1);
            })
            .on('pointerover', () => {
                circle.setFillStyle(colors.hover, 1);
            })
            .on('pointerout', () => {
                circle.setFillStyle(colors.idle, 1);
            });

        return {
            circle,
            colors,
            coord,
            fontSize: circleConfig.fontSize,
            radius: circleConfig.radius,
            text,
        };
    });
    const finishButton = createFinishButton(scene, texts, testKit, () => {
        continueAfterTask(scene, state, taskKey);
    });

    scene.trailField = {
        coords,
        finishButton,
        labels,
        lineGraphics,
        nodes,
        progress: 0,
        segments: [],
        testKit,
        recording: scene.recorder?.start(taskKey, nodes.map((node, index) => ({
            index,
            label: labels[index],
            x: node.coord.x,
            y: node.coord.y,
            radius: node.radius,
        }))),
    };

    const recordBackgroundClick = (pointer, objects) => {
        if (objects.some((object) => object === finishButton || nodes.some((node) => node.circle === object))) {
            return;
        }

        recordTrailClick(scene, state, scene.trailField, null, pointer);
    };
    scene.input.on('pointerdown', recordBackgroundClick);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.off('pointerdown', recordBackgroundClick));

    const updateLayout = () => {
        const area = testKit.getMeasurementArea(scene);

        nodes.forEach((node) => {
            const position = testKit.mapPoint(area, node.coord.x, node.coord.y);

            node.circle
                .setPosition(position.x, position.y)
                .setScale(area.scale)
                .setStrokeStyle(4, node.colors.stroke);

            node.text
                .setPosition(position.x, position.y)
                .setStyle({ fontSize: `${Math.round(testKit.scaleNumber(area, node.fontSize))}px` });
        });

        drawTrailSegments(scene, testKit);
    };

    updateLayout();
    testKit.watchLayoutChanges(scene, updateLayout);
}

function handleNodeClick(scene, state, taskKey, index, pointer) {
    const field = scene.trailField;

    if (! field) {
        return;
    }

    recordTrailClick(scene, state, field, index, pointer);

    if (field.progress >= field.coords.length) {
        return;
    }

    if (field.progress !== index) {
        playErrorTone(scene.sound);

        recordTrailError(scene, state, taskKey, field, index);

        return;
    }

    if (index > 0) {
        field.segments.push([index - 1, index]);
        drawTrailSegments(scene, field.testKit);
    }

    field.progress += 1;

    if (field.progress < field.coords.length) {
        return;
    }

    state.records[trailConfig.tasks[taskKey].recordKey] = Math.round(scene.time.now - state.baseTimeStamp);

    scene.recorder?.complete(field.recording, state.records[trailConfig.tasks[taskKey].recordKey]);

    field.finishButton.setVisible(true);
}

function recordTrailClick(scene, state, field, selectedIndex, pointer) {
    const completed = field.progress >= field.coords.length;
    const area = field.testKit.getMeasurementArea(scene);

    scene.recorder?.click(field.recording, {
        target: selectedIndex === null ? 'background' : 'node',
        phase: completed ? 'after_completion' : 'measurement',
        expectedIndex: completed ? null : field.progress,
        selectedIndex,
        correct: completed || selectedIndex === null ? null : selectedIndex === field.progress,
        countedAsError: ! completed && selectedIndex !== null && selectedIndex !== field.progress,
        elapsedMs: Math.max(0, Math.round(scene.time.now - state.baseTimeStamp)),
        x: pointer ? (pointer.x - area.left) / area.scale : null,
        y: pointer ? (pointer.y - area.top) / area.scale : null,
        stageWidth: scene.scale.width,
        stageHeight: scene.scale.height,
    });
}

function recordTrailError(scene, state, taskKey, field, selectedIndex) {
    ensureTrailErrorRecords(state);

    const expectedIndex = field.progress;
    const taskErrorNumber = Number(state.records.errorCounters[taskKey] ?? 0) + 1;
    state.records.errorCounters[taskKey] = taskErrorNumber;

    state.records.errorRows.push({
        task: taskKey,
        errorNumber: state.records.errorRows.length + 1,
        taskErrorNumber,
        stepNumber: expectedIndex + 1,
        expectedIndex,
        selectedIndex,
        expectedLabel: field.labels?.[expectedIndex] || String(expectedIndex + 1),
        selectedLabel: field.labels?.[selectedIndex] || String(selectedIndex + 1),
        elapsedMs: Math.max(0, Math.round(scene.time.now - state.baseTimeStamp)),
    });
}

function drawTrailSegments(scene, testKit) {
    const field = scene.trailField;

    if (! field) {
        return;
    }

    const area = testKit.getMeasurementArea(scene);

    field.lineGraphics.clear();
    field.lineGraphics.lineStyle(
        Math.max(1, Math.round(testKit.scaleNumber(area, 1))),
        parseHexColor(trailConfig.colors.line),
        1,
    );

    field.segments.forEach(([fromIndex, toIndex]) => {
        const from = testKit.mapPoint(area, field.coords[fromIndex].x, field.coords[fromIndex].y);
        const to = testKit.mapPoint(area, field.coords[toIndex].x, field.coords[toIndex].y);

        field.lineGraphics.beginPath();
        field.lineGraphics.moveTo(from.x, from.y);
        field.lineGraphics.lineTo(to.x, to.y);
        field.lineGraphics.strokePath();
    });
}

function createFinishButton(scene, texts, testKit, callback) {
    let pointerState = 'idle';
    const colors = {
        idle: trailConfig.colors.startCircleIdle,
        hover: trailConfig.colors.startCircleHover,
        active: trailConfig.colors.startCircleActive,
    };
    const button = scene.add.text(0, 0, texts.finish, {
        fontFamily: 'Verdana',
        fontSize: `${trailConfig.endButton.fontSize}px`,
        color: '#ffffff',
        backgroundColor: colors.idle,
        align: 'center',
    })
        .setOrigin(0.5)
        .setPadding({
            y: 5,
            left: 10,
            right: 10,
        })
        .setDepth(10)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });

    const applyState = () => {
        if (pointerState === 'active') {
            button.setStyle({ backgroundColor: colors.active, color: trailConfig.colors.text });

            return;
        }

        if (pointerState === 'hover') {
            button.setStyle({ backgroundColor: colors.hover, color: trailConfig.colors.text });

            return;
        }

        button.setStyle({ backgroundColor: colors.idle, color: '#ffffff' });
    };

    button
        .on('pointerdown', () => {
            pointerState = 'active';
            applyState();
            void callback();
        })
        .on('pointerup', () => {
            pointerState = 'hover';
            applyState();
        })
        .on('pointerover', () => {
            pointerState = 'hover';
            applyState();
        })
        .on('pointerout', () => {
            pointerState = 'idle';
            applyState();
        });

    const updateLayout = () => {
        const area = testKit.getMeasurementArea(scene);
        const position = testKit.mapPoint(area, gameWidth - 42, gameHeight - 22);

        button
            .setPosition(position.x, position.y)
            .setStyle({ fontSize: `${Math.round(testKit.scaleNumber(area, trailConfig.endButton.fontSize))}px` })
            .setPadding({
                y: testKit.scaleNumber(area, 5),
                left: testKit.scaleNumber(area, 10),
                right: testKit.scaleNumber(area, 10),
            });
    };

    updateLayout();
    testKit.watchLayoutChanges(scene, updateLayout);

    return button;
}

function continueAfterTask(scene, state, taskKey) {
    const task = trailConfig.tasks[taskKey];

    if (task.group === 'cognitive') {
        if (isCognitiveComplete(state)) {
            state.completedSection = 'cognitive_flexibility';
        }

        scene.scene.start(isCognitiveComplete(state) ? 'CognitiveCompleteScene' : 'CognitiveMenuScene');

        return;
    }

    if (taskKey === inhibitionBaselineTaskKey) {
        scene.scene.start('InhibitionMenuScene');

        return;
    }

    if (isInhibitionComplete(state)) {
        state.completedSection = 'inhibition';
    }

    scene.scene.start(isInhibitionComplete(state) ? 'SummaryScene' : 'InhibitionMenuScene');
}

function createFullWidthMenuButton(scene, {
    getMeasurementArea,
    getStageSize,
    label,
    mapPoint,
    scaleNumber,
    watchLayoutChanges,
    y,
    callback = null,
    backgroundColor = trailConfig.colors.menuIdle,
    hoverBackgroundColor = trailConfig.colors.menuHover,
    activeBackgroundColor = trailConfig.colors.menuActive,
    color = trailConfig.colors.menuText,
    hoverColor = trailConfig.colors.menuHoverText,
    activeColor = trailConfig.colors.menuHoverText,
    fontSize = 56,
    height = 108,
    horizontalPadding = 48,
    interactive = true,
    depth = 10,
}) {
    let pointerState = 'idle';
    const background = scene.add.rectangle(0, 0, 1, 1, parseHexColor(backgroundColor))
        .setOrigin(0.5)
        .setDepth(depth);
    const text = scene.add.text(0, 0, label, {
        fontFamily: 'Verdana',
        fontSize: '56px',
        color,
        align: 'center',
        wordWrap: { width: 900 },
    })
        .setOrigin(0.5)
        .setDepth(depth + 1);

    const applyVisualState = () => {
        if (pointerState === 'active') {
            background.setFillStyle(parseHexColor(activeBackgroundColor));
            text.setStyle({ color: activeColor });

            return;
        }

        if (pointerState === 'hover') {
            background.setFillStyle(parseHexColor(hoverBackgroundColor));
            text.setStyle({ color: hoverColor });

            return;
        }

        background.setFillStyle(parseHexColor(backgroundColor));
        text.setStyle({ color });
    };

    const updateLayout = () => {
        const stage = getStageSize(scene);
        const area = getMeasurementArea(scene);
        const position = mapPoint(area, gameWidth / 2, y);
        const buttonHeight = Math.round(scaleNumber(area, height));
        const textWidth = Math.max(160, stage.width - Math.round(scaleNumber(area, horizontalPadding * 2)));

        background.setPosition(stage.width / 2, position.y);
        background.setSize(stage.width, buttonHeight);

        text.setPosition(stage.width / 2, position.y);
        text.setStyle({
            fontSize: `${Math.round(scaleNumber(area, fontSize))}px`,
            wordWrap: { width: textWidth },
        });
    };

    if (interactive) {
        background
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                pointerState = 'active';
                applyVisualState();

                if (typeof callback === 'function') {
                    void callback();
                }
            })
            .on('pointerup', () => {
                pointerState = 'hover';
                applyVisualState();
            })
            .on('pointerover', () => {
                pointerState = 'hover';
                applyVisualState();
            })
            .on('pointerout', () => {
                pointerState = 'idle';
                applyVisualState();
            });
    }

    updateLayout();
    watchLayoutChanges(scene, updateLayout);

    return {
        background,
        text,
    };
}

function disabledButtonOptions() {
    return {
        backgroundColor: trailConfig.colors.disabledIdle,
        hoverBackgroundColor: trailConfig.colors.disabledIdle,
        activeBackgroundColor: trailConfig.colors.disabledIdle,
        color: trailConfig.colors.disabledText,
        hoverColor: trailConfig.colors.disabledText,
        activeColor: trailConfig.colors.disabledText,
        interactive: false,
    };
}

function disabledMessageOptions() {
    return {
        backgroundColor: trailConfig.colors.disabledIdle,
        color: trailConfig.colors.disabledText,
    };
}

function createLabels(taskKey, pointCount) {
    if (taskKey === 'A' || taskKey === inhibitionBaselineTaskKey) {
        return Array.from({ length: pointCount }, (_, index) => String(index + 1));
    }

    if (taskKey === 'B') {
        let letterIndex = 0;

        return Array.from({ length: pointCount }, (_, index) => {
            if (index % 2 === 1) {
                const label = mixedLetter(letterIndex);

                letterIndex += 1;

                return label;
            }

            return String(letterIndex + 1);
        });
    }

    if (taskKey === 'D') {
        return Phaser.Utils.Array.Shuffle(Array.from({ length: pointCount }, (_, index) => String(index + 1)));
    }

    return Array.from({ length: pointCount }, () => '');
}

function mixedLetter(index) {
    return String.fromCharCode('A'.charCodeAt(0) + index);
}

function pointCountForTask(task, isForChildren) {
    return isForChildren
        ? task.pointCounts.child
        : task.pointCounts.adult;
}

function circleConfigForTask(task, index) {
    const radius = task.circle.radius
        ?? task.circle.radiusSequence[index]
        ?? task.circle.radiusSequence[task.circle.radiusSequence.length - 1];

    return {
        radius,
        fontSize: task.circle.fontSize ?? ((task.circle.fontScale * radius) + task.circle.fontOffset),
    };
}

function colorsForNode(index) {
    if (index === 0) {
        return {
            idle: parseHexColor(trailConfig.colors.startCircleIdle),
            hover: parseHexColor(trailConfig.colors.startCircleHover),
            active: parseHexColor(trailConfig.colors.startCircleActive),
            stroke: parseHexColor(trailConfig.colors.startCircleStroke),
        };
    }

    return {
        idle: parseHexColor(trailConfig.colors.circleIdle),
        hover: parseHexColor(trailConfig.colors.circleHover),
        active: parseHexColor(trailConfig.colors.circleActive),
        stroke: parseHexColor(trailConfig.colors.circleStroke),
    };
}

function taskMenuLabel(texts, state, taskKey) {
    const label = texts.tasks[taskKey] ?? taskKey;
    const recordKey = trailConfig.tasks[taskKey]?.recordKey ?? taskKey;

    return Number(state.records[recordKey] ?? 0) > 0
        ? `${label}${texts.taskDoneSuffix}`
        : label;
}

function saveMainMenuLabel(texts, cognitiveComplete, inhibitionComplete) {
    if (cognitiveComplete && inhibitionComplete) {
        return `${texts.save} - (${texts.saveCombined})`;
    }

    if (cognitiveComplete) {
        return `${texts.save} - (${texts.saveCognitive})`;
    }

    if (inhibitionComplete) {
        return `${texts.save} - (${texts.saveInhibition})`;
    }

    return texts.save;
}

function inhibitionMainMenuLabel(texts, inhibitionComplete) {
    if (inhibitionComplete) {
        return texts.inhibitionDone;
    }

    return texts.inhibition;
}

function groupMenuSceneForTask(taskKey) {
    return trailConfig.tasks[taskKey].group === 'cognitive'
        ? 'CognitiveMenuScene'
        : 'InhibitionMenuScene';
}

function resolveTaskKey(value) {
    return taskKeys.includes(value) ? value : 'A';
}

function isCognitiveComplete(state) {
    return state.records.A > 0 && state.records.B > 0;
}

function hasTaskResult(state, taskKey) {
    const recordKey = trailConfig.tasks[taskKey]?.recordKey ?? taskKey;

    return Number(state.records[recordKey] ?? 0) > 0;
}

function hasCognitiveBaseline(state) {
    return Number(state.records.A ?? 0) > 0;
}

function hasRawInhibitionBaseline(state) {
    return Number(state.records.inhibitionBaseline15 ?? 0) > 0;
}

function hasEffectiveInhibitionBaseline(state) {
    return hasCognitiveBaseline(state) || hasRawInhibitionBaseline(state);
}

function isInhibitionComplete(state) {
    return hasEffectiveInhibitionBaseline(state) && state.records.C > 0 && state.records.D > 0;
}

function resetAllState(state) {
    state.recorder?.resetAll();
    state.activeGroup = 'cognitive';
    state.activeTask = 'A';
    state.baseTimeStamp = 0;
    state.saving = false;
    state.completedSection = null;
    state.records = createEmptyRecords(state.isForChildren);
}

function resetCognitiveState(state) {
    preserveCognitiveBaselineForCompletedInhibition(state);
    state.activeGroup = 'cognitive';
    state.activeTask = 'A';
    state.baseTimeStamp = 0;
    state.saving = false;
    state.completedSection = null;
    resetTaskResult(state, 'A');
    resetTaskResult(state, 'B');
}

function resetInhibitionState(state) {
    const hasReusableCognitiveBaseline = hasCognitiveBaseline(state);
    state.activeGroup = 'inhibition';
    state.activeTask = hasReusableCognitiveBaseline ? 'C' : inhibitionBaselineTaskKey;
    state.baseTimeStamp = 0;
    state.saving = false;
    state.completedSection = null;
    resetTaskResult(state, inhibitionBaselineTaskKey);
    resetTaskResult(state, 'C');
    resetTaskResult(state, 'D');
}

function preserveCognitiveBaselineForCompletedInhibition(state) {
    if (! isInhibitionComplete(state) || hasRawInhibitionBaseline(state) || ! hasCognitiveBaseline(state)) {
        return;
    }

    ensureTrailErrorRecords(state);

    state.records.inhibitionBaseline15 = Math.max(0, Math.round(Number(state.records.A ?? 0)));
    state.records.errorCounters[inhibitionBaselineTaskKey] = Math.max(
        0,
        Math.round(Number(state.records.errorCounters.A ?? 0)),
    );
}

function resetTaskResult(state, taskKey) {
    state.recorder?.resetTask(taskKey);
    ensureTrailErrorRecords(state);

    const recordKey = trailConfig.tasks[taskKey]?.recordKey;
    if (recordKey) {
        state.records[recordKey] = 0;
    }

    state.records.errorCounters[taskKey] = 0;
    state.records.errorRows = state.records.errorRows.filter((row) => row?.task !== taskKey);
}

function createInitialState(locale, isForChildren, recorder) {
    return {
        locale,
        isForChildren,
        recorder,
        activeGroup: 'cognitive',
        activeTask: 'A',
        baseTimeStamp: 0,
        saving: false,
        completedSection: null,
        records: createEmptyRecords(isForChildren),
    };
}

function createEmptyRecords(isForChildren) {
    return {
        A: 0,
        B: 0,
        inhibitionBaseline15: 0,
        C: 0,
        D: 0,
        isForChildren,
        errorCounters: createEmptyErrorCounters(),
        errorRows: [],
    };
}

function createEmptyErrorCounters() {
    return Object.fromEntries(taskKeys.map((taskKey) => [taskKey, 0]));
}

function ensureTrailErrorRecords(state) {
    if (! state.records || typeof state.records !== 'object') {
        state.records = createEmptyRecords(state.isForChildren);
    }

    if (! state.records.errorCounters || typeof state.records.errorCounters !== 'object') {
        state.records.errorCounters = createEmptyErrorCounters();
    }

    taskKeys.forEach((taskKey) => {
        state.records.errorCounters[taskKey] = Number(state.records.errorCounters[taskKey] ?? 0);
    });

    if (! Array.isArray(state.records.errorRows)) {
        state.records.errorRows = [];
    }
}

async function saveSummary(runtime, context, state) {
    if (state.saving) {
        return;
    }

    state.saving = true;

    await runtime.finish({
        source: gameCode,
        experimentKey: context.experimentKey,
        runPublicId: context.runPublicId,
        recordPublicId: context.recordPublicId,
        data_id: context.runPublicId,
        locale: state.locale,
        schemaVersion: trailConfig.schemaVersion,
        completedSection: resolveCompletedSection(state),
        baselineStatus: createBaselineStatus(state),
        records: state.records,
        submittedAt: new Date().toISOString(),
    });
}

function resolveCompletedSection(state) {
    if (state.completedSection) {
        return state.completedSection;
    }

    if (isInhibitionComplete(state)) {
        return 'inhibition';
    }

    if (isCognitiveComplete(state)) {
        return 'cognitive_flexibility';
    }

    return null;
}

function createBaselineStatus(state) {
    const rawMs = Number(state.records.inhibitionBaseline15 ?? 0);
    const cognitiveAMs = Number(state.records.A ?? 0);

    return {
        source: cognitiveAMs > 0
            ? 'cognitive_a'
            : (rawMs > 0 ? inhibitionBaselineTaskKey : null),
        rawInhibitionBaselineMs: Math.max(0, Math.round(rawMs)),
        supersededByCognitiveA: cognitiveAMs > 0 && rawMs > 0,
    };
}

function resolveLocale(context) {
    const locale = String(
        context.locale
            ?? document.documentElement.lang
            ?? 'hu',
    ).toLowerCase();

    return locale.startsWith('en') ? 'en' : 'hu';
}

function resolveTexts(locale) {
    return trailConfig.texts[locale] ?? trailConfig.texts.hu;
}

function generatePoints(task, pointCount) {
    const options = task.pointOptions;
    const generator = new RIP({
        numOfPoints: pointCount,
        minHeight: options.minHeight,
        maxHeight: gameHeight - options.maxHeightPadding,
        minWidth: options.minWidth,
        maxWidth: gameWidth - options.maxWidthPadding,
        minDistance: options.minDistance,
        isIntCoord: true,
    });

    return generator.getPolygonCoord();
}

// Random-Irregular-Polygon: https://github.com/kelvinau/Random-Irregular-Polygon
// Copyright (c) 2017 Kelvin Au. MIT license:
// ../../vendor/random-irregular-polygon/LICENSE.md
// Adaptations: separate coordinate bounds and minimum point-distance checks.
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class RIP {
    constructor(opts) {
        this.numOfPoints = opts.numOfPoints;
        this.minHeight = opts.minHeight;
        this.maxHeight = opts.maxHeight;
        this.minWidth = opts.minWidth;
        this.maxWidth = opts.maxWidth;
        this.minDistance = opts.minDistance;
        this.isIntCoord = !! opts.isIntCoord;
    }

    getPolygonCoord() {
        const points = this.spacePartition(this.getRandomPoints());
        this.sortPoints(points);

        return points;
    }

    getRandomPoints() {
        const points = [];
        const pointSet = new Set();

        for (let i = 0; i < this.numOfPoints;) {
            let x;
            let y;

            while (! this.goodPosCheck(x, y, points)) {
                x = this.getRandomNum(this.minWidth, this.maxWidth, this.isIntCoord);
                y = this.getRandomNum(this.minHeight, this.maxHeight, this.isIntCoord);
            }

            const key = `${x}-${y}`;

            if (! pointSet.has(key)) {
                pointSet.add(key);
                points.push(new Point(x, y));
                i += 1;
            }
        }

        return points;
    }

    goodPosCheck(x, y, points) {
        let good = true;

        for (let i = 0; i < points.length; i += 1) {
            if (this.pointDistance(points[i].x, points[i].y, x, y) < this.minDistance) {
                good = false;
            }
        }

        return !! (good && x && y);
    }

    pointDistance(x1, y1, x2, y2) {
        const a = x1 - x2;
        const b = y1 - y2;

        return Math.sqrt((a * a) + (b * b));
    }

    getRandomNum(min, max, isInt) {
        if (! isInt) {
            return (Math.random() * (max - min)) + min;
        }

        return Math.floor((Math.random() * (max - min + 1)) + min);
    }

    spacePartition(points) {
        const firstPoint = points[0];
        const secondIndex = this.getRandomNum(1, this.numOfPoints - 1, true);
        const secondPoint = points[secondIndex];

        this.swapPoints(points, 1, secondIndex);

        let i = 2;
        let j = this.numOfPoints - 1;

        while (i <= j) {
            while (i < this.numOfPoints && this.isToLeftOrOnLine(firstPoint, secondPoint, points[i])) {
                i += 1;
            }

            while (j > 1 && ! this.isToLeftOrOnLine(firstPoint, secondPoint, points[j])) {
                j -= 1;
            }

            if (i <= j) {
                this.swapPoints(points, i, j);
                i += 1;
                j -= 1;
            }
        }

        this.swapPoints(points, 1, j);
        this.spacePartitionRec(points, 0, j);

        return points;
    }

    spacePartitionRec(points, l, r) {
        if (r > l + 1) {
            const rp = this.getRandomNum(l + 1, r - l - 1, true);
            const firstPoint = points[l];
            const secondPoint = r === this.numOfPoints ? points[0] : points[r];
            const randomStartPoint = this.getRandomPointOnSegment(firstPoint, secondPoint);
            const randomEndPoint = points[rp];

            this.swapPoints(points, l + 1, rp);

            let i = l + 2;
            let j = r - 1;
            const isToLeft = this.isToLeftOrOnLine(randomStartPoint, randomEndPoint, points[l]);

            while (i <= j) {
                while (i < r && this.isToLeftOrOnLine(randomStartPoint, randomEndPoint, points[i]) === isToLeft) {
                    i += 1;
                }

                while (j > l + 1 && this.isToLeftOrOnLine(randomStartPoint, randomEndPoint, points[j]) !== isToLeft) {
                    j -= 1;
                }

                if (i <= j) {
                    this.swapPoints(points, i, j);
                    i += 1;
                    j -= 1;
                }
            }

            this.swapPoints(points, l + 1, j);
            this.spacePartitionRec(points, l, j);
            this.spacePartitionRec(points, j, r);
        }
    }

    swapPoints(points, i, j) {
        const tmp = points[i];

        points[i] = points[j];
        points[j] = tmp;
    }

    isToLeftOrOnLine(start, end, point) {
        return this.isLeft(start, end, point) <= 0;
    }

    isLeft(start, end, point) {
        return ((end.x - start.x) * (point.y - start.y)) - ((end.y - start.y) * (point.x - start.x));
    }

    getRandomPointOnSegment(start, end) {
        const randomRatio = Math.random();

        return new Point(
            start.x + ((end.x - start.x) * randomRatio),
            start.y + ((end.y - start.y) * randomRatio),
        );
    }

    sortPoints(points) {
        const p0 = {};

        p0.y = Math.min.apply(null, points.map((point) => point.y));
        p0.x = Math.max.apply(null, points.filter((point) => point.y === p0.y).map((point) => point.x));
        points.sort((a, b) => {
            const isLeft = this.isLeft(a, b, p0);

            if (isLeft === 0) {
                return distCompare(a, b, p0);
            }

            return isLeft;
        });

        function distCompare(a, b, p0) {
            const distA = ((p0.x - a.x) * (p0.x - a.x)) + ((p0.y - a.y) * (p0.y - a.y));
            const distB = ((p0.x - b.x) * (p0.x - b.x)) + ((p0.y - b.y) * (p0.y - b.y));

            return distA - distB;
        }
    }
}

function parseHexColor(value) {
    const normalized = String(value ?? '').replace('#', '').trim();
    const parsed = Number.parseInt(normalized, 16);

    return Number.isFinite(parsed) ? parsed : 0xffffff;
}
