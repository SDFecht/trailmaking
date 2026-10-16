// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

import trailGame from './src/games/trail.phaser4.js';
import { SessionRecorder } from './src/session-recorder.js';
import { createRawCsv } from './src/csv-export.js';

const copy = {
    hu: {
        eyebrow: 'Önálló teszt',
        intro: 'Kognitív flexibilitás és gátlás. A mérés végén a nyers adatok CSV-fájlként tölthetők le.',
        ageGroup: 'Korcsoport',
        child: '12 éves kor alatt', adult: '12 éves kortól', language: 'Nyelv',
        localOnly: 'Az adatok a böngészőben maradnak. A program nem tölti fel őket szerverre.',
        start: 'Teszt betöltése', loading: 'A teszt betöltése…',
        failed: 'A teszt betöltése nem sikerült. Ellenőrizze, hogy a teljes mappát HTTP-kiszolgálón keresztül nyitotta-e meg.',
        fileProtocol: 'A tesztet HTTP-kiszolgálón keresztül nyissa meg. A mappában futtassa az npm start parancsot, majd nyissa meg a http://localhost:8080 címet.',
        saved: 'A CSV elkészült', downloadHelp: 'A letöltés elindult. Ha szükséges, a fájl újra letölthető az alábbi gombbal.',
        download: 'CSV letöltése', newSession: 'Új mérés',
        details: (attempts, clicks) => `${attempts} feladatpróbálkozás, ${clicks} kattintás. A CSV a pontok koordinátáit is tartalmazza.`,
    },
    en: {
        eyebrow: 'Standalone test',
        intro: 'Cognitive flexibility and inhibition. Download the raw measurement data as a CSV file at the end.',
        ageGroup: 'Age group',
        child: 'Under 12 years', adult: '12 years and older', language: 'Language',
        localOnly: 'Data stays in this browser. The application does not upload it to a server.',
        start: 'Load test', loading: 'Loading test…',
        failed: 'The test could not be loaded. Make sure the complete folder is being served over HTTP.',
        fileProtocol: 'Open this test through an HTTP server. Run npm start inside the folder, then open http://localhost:8080.',
        saved: 'CSV ready', downloadHelp: 'The download has started. Use the button below to download the file again.',
        download: 'Download CSV', newSession: 'New session',
        details: (attempts, clicks) => `${attempts} task attempts, ${clicks} clicks. Point coordinates are included in the CSV.`,
    },
};

const setup = document.getElementById('setup');
const languageSelect = document.getElementById('language');
const gameElement = document.getElementById('game');
const gamePanel = document.getElementById('game-panel');
const resultPanel = document.getElementById('result');
const status = document.getElementById('status');
const download = document.getElementById('download');
let mountedGame = null;
let downloadUrl = null;

function translate() {
    document.documentElement.lang = languageSelect.value;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = copy[languageSelect.value][element.dataset.i18n];
    });
}

function setStatus(message, type = 'info') {
    status.textContent = message;
    status.dataset.type = type;
    status.hidden = message === '';
}

async function finishSession(payload, session, recorder) {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    const csv = createRawCsv(payload, session, recorder.attempts);
    downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    download.href = downloadUrl;
    download.download = `trail-making_${session.startedAt.replaceAll(':', '-')}_${session.id.slice(0, 8)}.csv`;
    download.click();

    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.webkitFullscreenElement) document.webkitExitFullscreen?.();
    } catch {
        // The CSV remains available even if the browser keeps fullscreen active.
    }

    mountedGame?.destroy();
    mountedGame = null;
    gamePanel.hidden = true;
    document.getElementById('export-details').textContent = copy[session.locale].details(
        recorder.attempts.length,
        recorder.attempts.reduce((total, attempt) => total + attempt.clicks.length, 0),
    );
    resultPanel.hidden = false;
    setStatus('');
    download.focus();
}

setup.addEventListener('submit', async (event) => {
    event.preventDefault();
    const locale = languageSelect.value;
    if (window.location.protocol === 'file:') {
        setStatus(copy[locale].fileProtocol, 'error');
        return;
    }

    const session = {
        id: crypto.randomUUID(),
        ageGroup: document.getElementById('age-group').value,
        locale,
        startedAt: new Date().toISOString(),
    };
    const recorder = new SessionRecorder();
    setup.hidden = true;
    resultPanel.hidden = true;
    gamePanel.hidden = false;
    setStatus(copy[locale].loading);

    try {
        mountedGame = await trailGame.mount({
            element: gameElement,
            context: { experimentKey: 'trail_making', label: 'Trail Making', locale, ageGroup: session.ageGroup, recorder },
            runtime: {
                setStatus,
                finish: (payload) => finishSession(payload, session, recorder),
            },
        });
        setStatus('');
    } catch (error) {
        console.error(error);
        mountedGame?.destroy();
        mountedGame = null;
        gamePanel.hidden = true;
        setup.hidden = false;
        setStatus(copy[locale].failed, 'error');
    }
});

languageSelect.addEventListener('change', translate);
document.getElementById('new-session').addEventListener('click', () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
    resultPanel.hidden = true;
    setup.hidden = false;
    document.getElementById('age-group').focus();
});
translate();
