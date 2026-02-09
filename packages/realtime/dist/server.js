import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TranscriptHandler } from './transcript-handler.js';
import { verifyAuthToken, isUserAuthorizedForSession } from './supabase.js';
import { env } from './env.js';
import { createLogger } from './logger.js';
const log = createLogger('server');
const SONIOX_WS_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';
function createSonioxConnection(connection, config) {
    const sonioxWs = new WebSocket(SONIOX_WS_URL);
    sonioxWs.on('open', () => {
        log.debug({ participant: config.participantName, queuedMessages: connection.messageQueue.length }, 'Soniox connected');
        // Send configuration to Soniox
        const sonioxConfig = {
            api_key: env.SONIOX_API_KEY,
            audio_format: 'auto',
            model: 'stt-rt-v4',
            language_hints: config.languageHints,
            enable_language_identification: config.enableLanguageIdentification ?? true,
            enable_speaker_diarization: config.enableSpeakerDiarization ?? false,
            enable_endpoint_detection: config.enableEndpointDetection ?? true,
            max_endpoint_delay_ms: env.MAX_ENDPOINT_DELAY_MS,
            translation: config.translation,
            context: config.context,
        };
        sonioxWs.send(JSON.stringify(sonioxConfig));
        // Initialize session state
        connection.session = {
            sessionCode: config.sessionCode,
            participantId: config.participantId,
            participantName: config.participantName,
            translationConfig: config.translation,
            processedFinalTokenCount: 0,
        };
        // Initialize transcript handler
        connection.transcriptHandler = new TranscriptHandler(connection.session);
        // Process queued messages
        connection.isReady = true;
        let sentCount = 0;
        let totalBytes = 0;
        while (connection.messageQueue.length > 0) {
            const msg = connection.messageQueue.shift();
            if (msg && sonioxWs.readyState === WebSocket.OPEN) {
                const size = Buffer.isBuffer(msg) ? msg.length : msg.byteLength || 0;
                totalBytes += size;
                sonioxWs.send(msg);
                sentCount++;
            }
        }
        log.debug({ sentCount, totalBytes }, 'Sent queued audio chunks to Soniox');
        // Notify client that connection is ready
        sendToClient(connection.clientWs, {
            type: 'status',
            status: 'ready',
        });
        // Start idle timer when connection is ready
        resetIdleTimer(connection);
    });
    sonioxWs.on('message', async (data) => {
        try {
            const result = JSON.parse(data.toString());
            // Reset idle timer when Soniox returns tokens (indicates speech activity)
            if (result.tokens && result.tokens.length > 0) {
                resetIdleTimer(connection);
            }
            // Process tokens for transcript handling (broadcast + save)
            if (connection.transcriptHandler && result.tokens) {
                await connection.transcriptHandler.processTokens(result.tokens);
            }
            // Forward result to client
            sendToClient(connection.clientWs, {
                type: 'result',
                tokens: result.tokens,
            });
        }
        catch (err) {
            log.error({ err }, 'Error parsing Soniox message');
        }
    });
    sonioxWs.on('close', (code, reason) => {
        log.debug({ code, reason: reason.toString() || 'No reason' }, 'Soniox disconnected');
        connection.isReady = false;
        connection.sonioxWs = null;
        // Clear idle timers since connection is closed
        clearIdleTimer(connection);
        if (connection.isPaused) {
            // Already marked as paused by our pause logic - don't send anything
            return;
        }
        // If we still have config, treat unexpected disconnection as pause
        // (Soniox may have its own idle timeout that closed the connection)
        // This allows the client to resume when they start speaking again
        if (connection.config) {
            log.debug('Unexpected Soniox disconnection - treating as pause for potential resume');
            connection.isPaused = true;
            sendToClient(connection.clientWs, {
                type: 'status',
                status: 'paused',
                reason: 'connection_closed',
            });
        }
        else {
            // No config means we can't resume - send finished
            sendToClient(connection.clientWs, {
                type: 'status',
                status: 'finished',
            });
        }
    });
    sonioxWs.on('error', (err) => {
        log.error({ err }, 'Soniox WebSocket error');
        sendToClient(connection.clientWs, {
            type: 'error',
            message: err.message,
        });
    });
    return sonioxWs;
}
function sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
function resetIdleTimer(connection) {
    // Clear existing timers
    if (connection.idleTimer) {
        clearTimeout(connection.idleTimer);
        connection.idleTimer = null;
    }
    if (connection.preparePauseTimer) {
        clearTimeout(connection.preparePauseTimer);
        connection.preparePauseTimer = null;
    }
    // Don't set timer if already paused or no timeout configured
    if (connection.isPaused || connection.idleTimeoutMs <= 0) {
        return;
    }
    // Set idling timer at 80% of idle timeout
    const idleWarningDelay = Math.floor(connection.idleTimeoutMs * 0.8);
    connection.preparePauseTimer = setTimeout(() => {
        log.debug({ elapsedMs: idleWarningDelay, pauseInMs: connection.idleTimeoutMs - idleWarningDelay }, 'Sending idling signal');
        sendToClient(connection.clientWs, {
            type: 'status',
            status: 'idling',
        });
    }, idleWarningDelay);
    // Set new idle timer for actual pause
    connection.idleTimer = setTimeout(() => {
        pauseSonioxConnection(connection);
    }, connection.idleTimeoutMs);
}
function pauseSonioxConnection(connection) {
    if (connection.isPaused || !connection.sonioxWs) {
        return;
    }
    log.debug({ idleTimeoutMs: connection.idleTimeoutMs }, 'Pausing Soniox connection due to no transcription');
    // Set paused flag BEFORE closing to prevent 'finished' status being sent
    connection.isPaused = true;
    connection.isReady = false;
    // Clear the message queue to discard any stale audio data
    const discardedCount = connection.messageQueue.length;
    connection.messageQueue = [];
    if (discardedCount > 0) {
        log.debug({ discardedCount }, 'Discarded queued audio chunks');
    }
    // Close the Soniox connection
    if (connection.sonioxWs.readyState === WebSocket.OPEN) {
        connection.sonioxWs.close();
    }
    connection.sonioxWs = null;
    // Notify client
    sendToClient(connection.clientWs, {
        type: 'status',
        status: 'paused',
        reason: 'no_transcription',
    });
}
function startSonioxConnection(connection, config) {
    log.debug({ participant: config.participantName }, 'Starting Soniox connection');
    // Reset paused state
    connection.isPaused = false;
    // Create the Soniox connection (client will receive 'ready' when it opens)
    connection.sonioxWs = createSonioxConnection(connection, config);
}
function clearIdleTimer(connection) {
    if (connection.idleTimer) {
        clearTimeout(connection.idleTimer);
        connection.idleTimer = null;
    }
    if (connection.preparePauseTimer) {
        clearTimeout(connection.preparePauseTimer);
        connection.preparePauseTimer = null;
    }
}
async function handleClientMessage(connection, data, isBinary) {
    // Handle text messages (config)
    if (!isBinary) {
        try {
            const message = JSON.parse(data.toString());
            if (message.type === 'config') {
                const config = message;
                log.debug({ session: config.sessionCode, participant: config.participantName }, 'Client config received');
                // Verify authentication token
                if (!config.authToken) {
                    log.error('No auth token provided');
                    sendToClient(connection.clientWs, {
                        type: 'error',
                        message: 'Authentication required',
                        code: 401,
                    });
                    connection.clientWs.close(4001, 'Authentication required');
                    return;
                }
                const user = await verifyAuthToken(config.authToken);
                if (!user) {
                    log.error('Invalid auth token');
                    sendToClient(connection.clientWs, {
                        type: 'error',
                        message: 'Invalid authentication token',
                        code: 401,
                    });
                    connection.clientWs.close(4001, 'Invalid authentication token');
                    return;
                }
                log.debug({ email: user.email }, 'User authenticated');
                // Verify user is authorized for this session
                const authResult = await isUserAuthorizedForSession(config.sessionCode, user.email || '', user.id);
                if (!authResult.authorized) {
                    log.error({ email: user.email, sessionCode: config.sessionCode, reason: authResult.reason }, 'User not authorized for session');
                    sendToClient(connection.clientWs, {
                        type: 'error',
                        message: authResult.reason || 'Not authorized for this session',
                        code: 403,
                    });
                    connection.clientWs.close(4003, authResult.reason || 'Not authorized for this session');
                    return;
                }
                log.debug({ email: user.email, sessionCode: config.sessionCode }, 'User authorized for session');
                // Store config for potential reconnection after idle pause
                connection.config = config;
                // Client cannot set idle timeout higher than server default
                const clientTimeout = config.idleTimeoutMs ?? env.IDLE_TIMEOUT_MS;
                connection.idleTimeoutMs = Math.min(clientTimeout, env.IDLE_TIMEOUT_MS);
                // Start Soniox connection (idle timer starts when connection is ready)
                startSonioxConnection(connection, config);
                return;
            }
            // Handle resume command from client (after VAD detects speech)
            if (message.type === 'resume') {
                log.debug('Client resume command received');
                if (connection.isPaused && connection.config) {
                    startSonioxConnection(connection, connection.config);
                }
                else {
                    log.debug({ isPaused: connection.isPaused, hasConfig: !!connection.config }, 'Ignoring resume command');
                }
                return;
            }
            // Handle stop signal (empty string)
            if (data.toString() === '' || message === '') {
                log.debug('Client stop signal received');
                if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
                    connection.sonioxWs.send('');
                }
                return;
            }
        }
        catch {
            // Not JSON, might be stop signal
            if (data.toString() === '') {
                log.debug('Client stop signal received');
                if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
                    connection.sonioxWs.send('');
                }
                return;
            }
        }
    }
    // Handle binary messages (audio data)
    if (isBinary) {
        // Discard audio when paused - client should send resume command first
        if (connection.isPaused) {
            log.debug({ dataSize: Buffer.isBuffer(data) ? data.length : 'unknown' }, 'Discarding audio while paused');
            return;
        }
        if (connection.isReady && connection.sonioxWs?.readyState === WebSocket.OPEN) {
            log.trace({ bytes: Buffer.isBuffer(data) ? data.length : 0 }, 'Sending audio chunk');
            connection.sonioxWs.send(data);
        }
        else {
            // Queue message until Soniox connection is ready
            log.debug({ isReady: connection.isReady, wsState: connection.sonioxWs?.readyState }, 'Queueing audio chunk');
            connection.messageQueue.push(data);
        }
    }
}
function startServer() {
    const server = createServer((req, res) => {
        // Health check endpoint
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
            return;
        }
        res.writeHead(404);
        res.end();
    });
    const wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
        const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
        // Accept all paths if WS_PATH is '/', otherwise match exactly
        if (env.WS_PATH === '/' || pathname === env.WS_PATH) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
        else {
            log.debug({ pathname, expected: env.WS_PATH }, 'Rejected WebSocket connection on invalid path');
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
        }
    });
    server.listen(env.PORT, () => {
        log.info({ port: env.PORT, path: env.WS_PATH }, 'Realtime proxy server started');
    });
    wss.on('connection', (clientWs) => {
        log.debug('New client connection');
        const connection = {
            clientWs,
            sonioxWs: null,
            messageQueue: [],
            isReady: false,
            session: null,
            transcriptHandler: null,
            config: null,
            idleTimeoutMs: env.IDLE_TIMEOUT_MS,
            idleTimer: null,
            preparePauseTimer: null,
            isPaused: false,
        };
        // Send connected status
        sendToClient(clientWs, {
            type: 'status',
            status: 'connected',
        });
        clientWs.on('message', (data, isBinary) => {
            handleClientMessage(connection, data, isBinary);
        });
        clientWs.on('close', () => {
            log.debug('Client disconnected');
            // Clear idle timer
            clearIdleTimer(connection);
            // Close Soniox connection if open
            if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
                connection.sonioxWs.close();
            }
            connection.sonioxWs = null;
            connection.transcriptHandler = null;
        });
        clientWs.on('error', (err) => {
            log.error({ err }, 'Client WebSocket error');
        });
    });
    // Graceful shutdown
    process.on('SIGINT', () => {
        log.info('Shutting down server...');
        wss.close(() => {
            server.close(() => {
                log.info('Server closed');
                process.exit(0);
            });
        });
    });
}
startServer();
//# sourceMappingURL=server.js.map