// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SessionRecorder } from '../src/session-recorder.js';
import { buildRawRows, createRawCsv, csvColumns, escapeCsvCell } from '../src/csv-export.js';

function fixture() {
    return {
        session: { id: 'session-1', ageGroup: 'child', startedAt: '2026-10-16T10:00:00.000Z' },
        payload: {
            source: 'trail_making_phaser4', experimentKey: 'trail_making', locale: 'hu',
            schemaVersion: 'trail-making-raw-v3', completedSection: 'cognitive_flexibility',
            submittedAt: '2026-10-16T10:03:00.000Z',
            baselineStatus: { source: 'cognitive_a', rawInhibitionBaselineMs: 0, supersededByCognitiveA: false },
            records: {
                A: 1000, B: 2000, inhibitionBaseline15: 0, C: 0, D: 0, isForChildren: true,
                errorCounters: { A: 1, B: 0, inhibition_baseline_15: 0, C: 0, D: 0 },
                errorRows: [{ task: 'A', errorNumber: 1, taskErrorNumber: 1, stepNumber: 1, expectedIndex: 0, selectedIndex: 1, expectedLabel: '1', selectedLabel: '2', elapsedMs: 50 }],
            },
        },
    };
}

function parseCsv(csv) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    const text = csv.replace(/^\uFEFF/, '');
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === '"') {
            if (quoted && text[index + 1] === '"') { cell += '"'; index++; }
            else quoted = !quoted;
        } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
        else if (char === '\r' && text[index + 1] === '\n' && !quoted) {
            row.push(cell); rows.push(row); row = []; cell = ''; index++;
        } else cell += char;
    }
    assert.equal(quoted, false);
    return rows;
}

test('CSV preserves Unicode, quotes, commas, line breaks, zero and false', () => {
    const { session, payload } = fixture();
    const label = 'Árvíz,"teszt"\n1';
    payload.records.errorRows[0].selectedLabel = label;
    const csv = createRawCsv(payload, session, []);
    assert.equal(csv.charCodeAt(0), 0xFEFF);
    const [header, ...rows] = parseCsv(csv);
    assert.deepEqual(header, csvColumns);
    assert.equal(rows.every((row) => row.length === header.length), true);
    const objects = rows.map((row) => Object.fromEntries(header.map((column, index) => [column, row[index]])));
    assert.equal(objects.every((row) => row.session_id === session.id), true);
    assert.equal(objects[0].export_schema_version, 'trail-making-csv-v3');
    assert.equal(header.includes('participant_id'), false);
    assert.equal(objects[0].baseline_superseded, 'false');
    assert.equal(objects.find((row) => row.task === 'C').time_ms, '0');
    assert.equal(objects.find((row) => row.record_type === 'error').selected_label, label);
    assert.equal(escapeCsvCell('=1+1'), "'=1+1");
    assert.equal(escapeCsvCell(-1), '-1');
});

test('export includes every point and click without converting background clicks to errors', () => {
    const { session, payload } = fixture();
    const recorder = new SessionRecorder();
    const attempt = recorder.start('A', [{ index: 0, label: '1', x: 50, y: 75, radius: 30 }, { index: 1, label: '2', x: 200, y: 100, radius: 30 }]);
    recorder.click(attempt, { target: 'node', phase: 'measurement', expectedIndex: 0, selectedIndex: 1, correct: false, countedAsError: true, elapsedMs: 50, x: 201, y: 99, stageWidth: 1024, stageHeight: 672 });
    recorder.click(attempt, { target: 'background', phase: 'measurement', expectedIndex: 0, selectedIndex: null, correct: null, countedAsError: false, elapsedMs: 75, x: 500, y: 400 });
    recorder.click(attempt, { target: 'node', phase: 'measurement', expectedIndex: 0, selectedIndex: 0, correct: true, countedAsError: false, elapsedMs: 100 });
    recorder.complete(attempt, 1000);
    const rows = buildRawRows(payload, session, recorder.attempts);
    assert.equal(rows.filter((row) => row.record_type === 'task').length, 5);
    assert.equal(rows.filter((row) => row.record_type === 'node').length, 2);
    const clicks = rows.filter((row) => row.record_type === 'click');
    assert.equal(clicks.length, 3);
    assert.equal(clicks[0].expected_label, '1');
    assert.equal(clicks[0].selected_label, '2');
    assert.equal(clicks[0].counted_as_error, true);
    assert.equal(clicks[1].selected_index, null);
    assert.equal(clicks[1].correct, null);
    assert.equal(clicks[1].counted_as_error, false);
    assert.equal(clicks[2].correct, true);
    assert.equal(rows.find((row) => row.record_type === 'attempt').error_count, 1);
});

test('restarts retain separate attempts and layouts while marking previous results as discarded', () => {
    const recorder = new SessionRecorder();
    const originalNodes = [{ index: 0, label: '1', x: 10, y: 20, radius: 30 }];
    const first = recorder.start('A', originalNodes);
    originalNodes[0].x = 999;
    recorder.complete(first, 1000);
    const secondTask = recorder.start('B', []);
    recorder.complete(secondTask, 2000);
    recorder.resetTask('A');
    const second = recorder.start('A', []);
    assert.equal(first.retained, false);
    assert.equal(first.nodes[0].x, 10);
    assert.equal(secondTask.retained, true);
    assert.equal(second.taskAttempt, 2);
    assert.equal(second.completed, false);
    recorder.complete(second, 1200);
    recorder.resetAll();
    assert.equal(recorder.attempts.length, 3);
    assert.equal(recorder.attempts.every((attempt) => !attempt.retained), true);
});
