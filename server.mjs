// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.json': 'application/json' };

http.createServer((request, response) => {
    if (! ['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
    }

    let filename;
    try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        filename = path.resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
    } catch {
        response.writeHead(400).end();
        return;
    }
    if (! filename.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
    }

    fs.stat(filename, (error, info) => {
        if (error || ! info.isFile()) {
            response.writeHead(404).end();
            return;
        }

        let start = 0;
        let end = info.size - 1;
        const headers = { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
        if (request.headers.range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
            if (! match || (! match[1] && ! match[2])) {
                response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
                return;
            }
            if (! match[1]) start = Math.max(0, info.size - Number(match[2]));
            else start = Number(match[1]);
            if (match[1] && match[2]) end = Math.min(end, Number(match[2]));
            if (start > end || start >= info.size) {
                response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
                return;
            }
            headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
        }
        headers['Content-Length'] = Math.max(0, end - start + 1);
        response.writeHead(request.headers.range ? 206 : 200, headers);
        if (request.method === 'HEAD' || info.size === 0) response.end();
        else fs.createReadStream(filename, { start, end }).on('error', () => response.destroy()).pipe(response);
    });
}).listen(port, '127.0.0.1', () => console.log(`Trail Making: http://localhost:${port}`));
