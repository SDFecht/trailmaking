// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

export class SessionRecorder {
    constructor() {
        this.attempts = [];
    }

    start(task, nodes) {
        const attempt = {
            id: this.attempts.length + 1,
            task,
            taskAttempt: this.attempts.filter((item) => item.task === task).length + 1,
            startedAt: new Date().toISOString(),
            completed: false,
            retained: false,
            timeMs: null,
            nodes: nodes.map((node) => ({ ...node })),
            clicks: [],
        };
        this.attempts.push(attempt);

        return attempt;
    }

    click(attempt, event) {
        if (attempt) {
            attempt.clicks.push({ ...event, number: attempt.clicks.length + 1, at: new Date().toISOString() });
        }
    }

    complete(attempt, timeMs) {
        if (attempt) {
            attempt.completed = true;
            attempt.retained = true;
            attempt.timeMs = timeMs;
        }
    }

    resetTask(task) {
        this.attempts.filter((attempt) => attempt.task === task).forEach((attempt) => { attempt.retained = false; });
    }

    resetAll() {
        this.attempts.forEach((attempt) => { attempt.retained = false; });
    }
}
