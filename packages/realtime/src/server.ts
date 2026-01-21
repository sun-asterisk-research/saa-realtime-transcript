import 'dotenv/config';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import type {
  ClientConfig,
  SonioxConfig,
  SonioxResult,
  ProxyResult,
  ProxyError,
  ProxyStatus,
  ClientSession,
} from './types.js';
import { TranscriptHandler } from './transcript-handler.js';
import { verifyAuthToken } from './supabase.js';

const SONIOX_WS_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';
const PORT = parseInt(process.env.PORT || '3001', 10);
const DEFAULT_IDLE_TIMEOUT_MS = parseInt(process.env.IDLE_TIMEOUT_MS || '60000', 10); // Default: 1 minute

interface ClientConnection {
  clientWs: WebSocket;
  sonioxWs: WebSocket | null;
  messageQueue: RawData[];
  isReady: boolean;
  session: ClientSession | null;
  transcriptHandler: TranscriptHandler | null;
  // Idle timeout management
  config: ClientConfig | null;
  idleTimeoutMs: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  preparePauseTimer: ReturnType<typeof setTimeout> | null;
  isPaused: boolean;
}

function createSonioxConnection(
  connection: ClientConnection,
  config: ClientConfig
): WebSocket {
  const sonioxWs = new WebSocket(SONIOX_WS_URL);

  sonioxWs.on('open', () => {
    console.debug(`[Soniox] Connected for participant: ${config.participantName}, queued messages: ${connection.messageQueue.length}`);

    // Send configuration to Soniox
    const sonioxConfig: SonioxConfig = {
      api_key: process.env.SONIOX_API_KEY!,
      audio_format: 'auto',
      model: config.model || 'stt-rt-preview',
      language_hints: config.languageHints,
      enable_language_identification: config.enableLanguageIdentification ?? true,
      enable_speaker_diarization: config.enableSpeakerDiarization ?? false,
      enable_endpoint_detection: config.enableEndpointDetection ?? true,
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
        const size = Buffer.isBuffer(msg) ? msg.length : (msg as ArrayBuffer).byteLength || 0;
        totalBytes += size;
        sonioxWs.send(msg);
        sentCount++;
      }
    }
    console.debug(`[Soniox] Sent ${sentCount} queued audio chunks (${totalBytes} bytes total)`);

    // Notify client that connection is ready
    sendToClient(connection.clientWs, {
      type: 'status',
      status: 'ready',
    } as ProxyStatus);

    // Start idle timer when connection is ready
    resetIdleTimer(connection);
  });

  sonioxWs.on('message', async (data: RawData) => {
    try {
      const result: SonioxResult = JSON.parse(data.toString());

      // Reset idle timer when Soniox returns tokens (indicates speech activity)
      if (result.tokens && result.tokens.length > 0) {
        console.debug(`[Soniox] Received ${result.tokens.length} tokens`);
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
      } as ProxyResult);
    } catch (error) {
      console.error('[Soniox] Error parsing message:', error);
    }
  });

  sonioxWs.on('close', (code, reason) => {
    console.debug(
      `[Soniox] Disconnected: ${code} - ${reason.toString() || 'No reason'}`
    );
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
      console.debug('[Soniox] Unexpected disconnection - treating as pause for potential resume');
      connection.isPaused = true;
      sendToClient(connection.clientWs, {
        type: 'status',
        status: 'paused',
        reason: 'connection_closed',
      } as ProxyStatus);
    } else {
      // No config means we can't resume - send finished
      sendToClient(connection.clientWs, {
        type: 'status',
        status: 'finished',
      } as ProxyStatus);
    }
  });

  sonioxWs.on('error', (error) => {
    console.error('[Soniox] WebSocket error:', error.message);
    sendToClient(connection.clientWs, {
      type: 'error',
      message: error.message,
    } as ProxyError);
  });

  return sonioxWs;
}

function sendToClient(ws: WebSocket, message: ProxyResult | ProxyError | ProxyStatus): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function resetIdleTimer(connection: ClientConnection): void {
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
    console.debug(`[Idle] Sending idling signal (${idleWarningDelay}ms elapsed, pause in ${connection.idleTimeoutMs - idleWarningDelay}ms)`);
    sendToClient(connection.clientWs, {
      type: 'status',
      status: 'idling',
    } as ProxyStatus);
  }, idleWarningDelay);

  // Set new idle timer for actual pause
  connection.idleTimer = setTimeout(() => {
    pauseSonioxConnection(connection);
  }, connection.idleTimeoutMs);
}

function pauseSonioxConnection(connection: ClientConnection): void {
  if (connection.isPaused || !connection.sonioxWs) {
    return;
  }

  console.debug(`[Idle] Pausing Soniox connection due to no transcription for ${connection.idleTimeoutMs}ms`);

  // Set paused flag BEFORE closing to prevent 'finished' status being sent
  connection.isPaused = true;
  connection.isReady = false;

  // Clear the message queue to discard any stale audio data
  const discardedCount = connection.messageQueue.length;
  connection.messageQueue = [];
  if (discardedCount > 0) {
    console.debug(`[Idle] Discarded ${discardedCount} queued audio chunks`);
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
  } as ProxyStatus);
}

function startSonioxConnection(connection: ClientConnection, config: ClientConfig): void {
  console.debug(`[Soniox] Starting connection for participant: ${config.participantName}`);

  // Reset paused state
  connection.isPaused = false;

  // Create the Soniox connection (client will receive 'ready' when it opens)
  connection.sonioxWs = createSonioxConnection(connection, config);
}

function clearIdleTimer(connection: ClientConnection): void {
  if (connection.idleTimer) {
    clearTimeout(connection.idleTimer);
    connection.idleTimer = null;
  }
  if (connection.preparePauseTimer) {
    clearTimeout(connection.preparePauseTimer);
    connection.preparePauseTimer = null;
  }
}

async function handleClientMessage(
  connection: ClientConnection,
  data: RawData,
  isBinary: boolean
): Promise<void> {
  // Handle text messages (config)
  if (!isBinary) {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'config') {
        const config = message as ClientConfig;
        console.debug(
          `[Client] Config received for session: ${config.sessionCode}, participant: ${config.participantName}`
        );

        // Verify authentication token
        if (!config.authToken) {
          console.error('[Auth] No auth token provided');
          sendToClient(connection.clientWs, {
            type: 'error',
            message: 'Authentication required',
            code: 401,
          } as ProxyError);
          connection.clientWs.close(4001, 'Authentication required');
          return;
        }

        const user = await verifyAuthToken(config.authToken);
        if (!user) {
          console.error('[Auth] Invalid auth token');
          sendToClient(connection.clientWs, {
            type: 'error',
            message: 'Invalid authentication token',
            code: 401,
          } as ProxyError);
          connection.clientWs.close(4001, 'Invalid authentication token');
          return;
        }

        console.debug(`[Auth] Authenticated user: ${user.email}`);

        // Store config for potential reconnection after idle pause
        connection.config = config;
        // Client cannot set idle timeout higher than server default
        const clientTimeout = config.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
        connection.idleTimeoutMs = Math.min(clientTimeout, DEFAULT_IDLE_TIMEOUT_MS);

        // Start Soniox connection (idle timer starts when connection is ready)
        startSonioxConnection(connection, config);
        return;
      }

      // Handle resume command from client (after VAD detects speech)
      if (message.type === 'resume') {
        console.debug('[Client] Resume command received');
        if (connection.isPaused && connection.config) {
          startSonioxConnection(connection, connection.config);
        } else {
          console.debug(`[Client] Ignoring resume command - isPaused=${connection.isPaused}, hasConfig=${!!connection.config}`);
        }
        return;
      }

      // Handle stop signal (empty string)
      if (data.toString() === '' || message === '') {
        console.debug('[Client] Stop signal received');
        if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
          connection.sonioxWs.send('');
        }
        return;
      }
    } catch {
      // Not JSON, might be stop signal
      if (data.toString() === '') {
        console.debug('[Client] Stop signal received');
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
      console.debug(`[Audio] Discarding audio while paused (data size: ${Buffer.isBuffer(data) ? data.length : 'unknown'})`);
      return;
    }

    if (connection.isReady && connection.sonioxWs?.readyState === WebSocket.OPEN) {
      console.debug(`[Audio] Sending audio chunk (${Buffer.isBuffer(data) ? data.length : 0} bytes)`);
      connection.sonioxWs.send(data);
    } else {
      // Queue message until Soniox connection is ready
      console.debug(`[Audio] Queueing audio chunk (isReady: ${connection.isReady}, wsState: ${connection.sonioxWs?.readyState})`);
      connection.messageQueue.push(data);
    }
  }
}

function startServer(): void {
  if (!process.env.SONIOX_API_KEY) {
    console.error('Error: SONIOX_API_KEY environment variable is not set');
    process.exit(1);
  }

  const wss = new WebSocketServer({ port: PORT });

  console.log(`Realtime proxy server started on ws://localhost:${PORT}`);

  wss.on('connection', (clientWs: WebSocket) => {
    console.debug('[Client] New connection');

    const connection: ClientConnection = {
      clientWs,
      sonioxWs: null,
      messageQueue: [],
      isReady: false,
      session: null,
      transcriptHandler: null,
      config: null,
      idleTimeoutMs: DEFAULT_IDLE_TIMEOUT_MS,
      idleTimer: null,
      preparePauseTimer: null,
      isPaused: false,
    };

    // Send connected status
    sendToClient(clientWs, {
      type: 'status',
      status: 'connected',
    } as ProxyStatus);

    clientWs.on('message', (data: RawData, isBinary: boolean) => {
      handleClientMessage(connection, data, isBinary);
    });

    clientWs.on('close', () => {
      console.debug('[Client] Disconnected');

      // Clear idle timer
      clearIdleTimer(connection);

      // Close Soniox connection if open
      if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
        connection.sonioxWs.close();
      }

      connection.sonioxWs = null;
      connection.transcriptHandler = null;
    });

    clientWs.on('error', (error) => {
      console.error('[Client] WebSocket error:', error.message);
    });
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    wss.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

startServer();
