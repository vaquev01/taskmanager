import { spawn } from 'child_process';
import path from 'path';

const MAX_RESTARTS = 10;
const RESTART_DELAY = 3000; // 3 seconds
let restartCount = 0;

function startServer() {
    console.log('🚀 [Launcher] Starting Backend Server...');

    const server = spawn('npx', ['ts-node', 'server.ts'], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    server.on('close', (code) => {
        if (code !== 0) {
            restartCount++;
            console.error(`❌ [Launcher] Server crashed with code ${code}. Restarting (${restartCount}/${MAX_RESTARTS})...`);

            if (restartCount < MAX_RESTARTS) {
                setTimeout(startServer, RESTART_DELAY);
            } else {
                console.error('🛑 [Launcher] Too many restarts. Giving up.');
                process.exit(1);
            }
        } else {
            console.log('✅ [Launcher] Server stopped gracefully.');
            process.exit(0);
        }
    });

    server.on('error', (err) => {
        console.error('❌ [Launcher] Failed to start server:', err);
    });
}

startServer();
