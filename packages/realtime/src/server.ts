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

interface ClientConnection {
  clientWs: WebSocket;
  sonioxWs: WebSocket | null;
  messageQueue: RawData[];
  isReady: boolean;
  session: ClientSession | null;
  transcriptHandler: TranscriptHandler | null;
}

function createSonioxConnection(
  connection: ClientConnection,
  config: ClientConfig
): WebSocket {
  const sonioxWs = new WebSocket(SONIOX_WS_URL);

  sonioxWs.on('open', () => {
    console.log(`[Soniox] Connected for participant: ${config.participantName}`);

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
    while (connection.messageQueue.length > 0) {
      const msg = connection.messageQueue.shift();
      if (msg && sonioxWs.readyState === WebSocket.OPEN) {
        sonioxWs.send(msg);
      }
    }

    // Notify client that connection is ready
    sendToClient(connection.clientWs, {
      type: 'status',
      status: 'ready',
    } as ProxyStatus);
  });

  sonioxWs.on('message', async (data: RawData) => {
    try {
      const result: SonioxResult = JSON.parse(data.toString());

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
    console.log(
      `[Soniox] Disconnected: ${code} - ${reason.toString() || 'No reason'}`
    );
    connection.isReady = false;
    connection.sonioxWs = null;

    sendToClient(connection.clientWs, {
      type: 'status',
      status: 'finished',
    } as ProxyStatus);
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
        console.log(
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

        console.log(`[Auth] Authenticated user: ${user.email}`);

        // Create Soniox connection
        connection.sonioxWs = createSonioxConnection(connection, config);
        return;
      }

      // Handle stop signal (empty string)
      if (data.toString() === '' || message === '') {
        console.log('[Client] Stop signal received');
        if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
          connection.sonioxWs.send('');
        }
        return;
      }
    } catch {
      // Not JSON, might be stop signal
      if (data.toString() === '') {
        console.log('[Client] Stop signal received');
        if (connection.sonioxWs?.readyState === WebSocket.OPEN) {
          connection.sonioxWs.send('');
        }
        return;
      }
    }
  }

  // Handle binary messages (audio data)
  if (isBinary) {
    if (connection.isReady && connection.sonioxWs?.readyState === WebSocket.OPEN) {
      connection.sonioxWs.send(data);
    } else {
      // Queue message until Soniox connection is ready
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
    console.log('[Client] New connection');

    const connection: ClientConnection = {
      clientWs,
      sonioxWs: null,
      messageQueue: [],
      isReady: false,
      session: null,
      transcriptHandler: null,
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
      console.log('[Client] Disconnected');

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
