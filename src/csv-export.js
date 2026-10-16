// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

export const csvColumns = [
    'export_schema_version', 'session_id', 'language', 'age_group', 'is_for_children',
    'session_started_at', 'submitted_at', 'exported_at', 'game_source', 'experiment_key', 'game_schema_version', 'completed_section',
    'baseline_source', 'baseline_raw_ms', 'baseline_superseded',
    'record_type', 'task', 'attempt_id', 'task_attempt', 'attempt_started_at', 'completed', 'retained',
    'time_ms', 'error_count', 'sequence_number', 'point_index', 'point_label', 'x', 'y', 'radius',
    'click_target', 'click_phase', 'clicked_at', 'expected_index', 'expected_label', 'selected_index', 'selected_label',
    'correct', 'counted_as_error', 'elapsed_ms', 'stage_width', 'stage_height',
    'error_number', 'task_error_number', 'step_number',
];

export function buildRawRows(payload, session, attempts, exportedAt = new Date().toISOString()) {
    const common = {
        export_schema_version: 'trail-making-csv-v3',
        session_id: session.id,
        language: payload.locale,
        age_group: session.ageGroup,
        is_for_children: payload.records.isForChildren,
        session_started_at: session.startedAt,
        submitted_at: payload.submittedAt,
        exported_at: exportedAt,
        game_source: payload.source,
        experiment_key: payload.experimentKey,
        game_schema_version: payload.schemaVersion,
        completed_section: payload.completedSection,
        baseline_source: payload.baselineStatus.source,
        baseline_raw_ms: payload.baselineStatus.rawInhibitionBaselineMs,
        baseline_superseded: payload.baselineStatus.supersededByCognitiveA,
    };
    const rows = [{ ...common, record_type: 'session' }];
    const tasks = { A: 'A', B: 'B', inhibition_baseline_15: 'inhibitionBaseline15', C: 'C', D: 'D' };

    for (const [task, key] of Object.entries(tasks)) {
        rows.push({
            ...common, record_type: 'task', task,
            time_ms: payload.records[key],
            error_count: payload.records.errorCounters[task],
            completed: payload.records[key] > 0,
        });
    }

    for (const error of payload.records.errorRows) {
        rows.push({
            ...common, record_type: 'error', task: error.task,
            error_number: error.errorNumber, task_error_number: error.taskErrorNumber,
            step_number: error.stepNumber, expected_index: error.expectedIndex, selected_index: error.selectedIndex,
            expected_label: error.expectedLabel, selected_label: error.selectedLabel, elapsed_ms: error.elapsedMs,
        });
    }

    for (const attempt of attempts) {
        const attemptFields = {
            ...common, task: attempt.task, attempt_id: attempt.id, task_attempt: attempt.taskAttempt,
            attempt_started_at: attempt.startedAt, completed: attempt.completed, retained: attempt.retained,
        };
        rows.push({
            ...attemptFields, record_type: 'attempt', time_ms: attempt.timeMs,
            error_count: attempt.clicks.filter((click) => click.countedAsError).length,
        });
        for (const node of attempt.nodes) {
            rows.push({
                ...attemptFields, record_type: 'node', point_index: node.index, point_label: node.label,
                x: node.x, y: node.y, radius: node.radius,
            });
        }
        for (const click of attempt.clicks) {
            rows.push({
                ...attemptFields, record_type: 'click', sequence_number: click.number,
                click_target: click.target, click_phase: click.phase, clicked_at: click.at,
                expected_index: click.expectedIndex,
                expected_label: attempt.nodes[click.expectedIndex]?.label,
                selected_index: click.selectedIndex,
                selected_label: attempt.nodes[click.selectedIndex]?.label,
                correct: click.correct, counted_as_error: click.countedAsError,
                elapsed_ms: click.elapsedMs, x: click.x, y: click.y,
                stage_width: click.stageWidth, stage_height: click.stageHeight,
            });
        }
    }

    return rows;
}

export function escapeCsvCell(value) {
    if (value === undefined || value === null) {
        return '';
    }

    let text = String(value);
    // Keep text values from being interpreted as spreadsheet formulas.
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) {
        text = `'${text}`;
    }

    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createRawCsv(payload, session, attempts) {
    const rows = buildRawRows(payload, session, attempts);

    return '\uFEFF' + [csvColumns.join(','), ...rows.map((row) => csvColumns.map((column) => escapeCsvCell(row[column])).join(','))].join('\r\n') + '\r\n';
}
