import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log from '../../components/utils/log.js';
import qrcode from 'qrcode-terminal';
import Pino from 'pino';
import {
  default as makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';

// Recreate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_FOLDER = path.join(__dirname, '../../../auth_whatsapp');

/**
 * Main function to start the WhatsApp client
 */

async function initWhatsAppClient() {
  try {
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    const { version, isLatest } = await fetchLatestBaileysVersion();

    log.info('WhatsApp Client', `Using WhatsApp Web v${version.join('.')} (isLatest: ${isLatest})`);

    const sock = makeWASocket({
      version,
      //logger,
      logger: Pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    let reconnectAttempt = 0;
    const MAX_RECONNECT_ATTEMPTS = 4;

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        log.info('QR Code', '📱 Scan this QR with WhatsApp (Linked Devices):');
        qrcode.generate(qr, { small: true });
      }

      const disconnectReasons = {
        [DisconnectReason.badSession]: 'Bad session file',
        [DisconnectReason.connectionClosed]: 'Connection closed',
        [DisconnectReason.connectionLost]: 'Connection lost',
        [DisconnectReason.connectionReplaced]: 'Connection replaced by another device',
        [DisconnectReason.loggedOut]: 'Logged out',
        [DisconnectReason.restartRequired]: 'Restart required',
        [DisconnectReason.timedOut]: 'Connection timed out',
      };

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorCode = lastDisconnect?.error?.output?.payload?.attrs?.code;
        const reason = disconnectReasons[statusCode] || 'Unknown reason';

        log.warn('WhatsApp Client', `Disconnected: ${reason} (${statusCode})`);

        if (statusCode === DisconnectReason.loggedOut) {
          log.error(
            'WhatsApp Client',
            'You have been logged out. Please delete the auth_whatsapp folder and restart the bot.'
          );
          reconnectAttempt = 0;
          return;
        }

        if (errorCode === '515') {
          try {
            log.warn(
              'WhatsApp Client',
              '⚠️  Auth state corrupted (code 515). Resetting session...'
            );
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            log.info('WhatsApp Client', '🗑️  Old auth state deleted. Restarting for fresh QR...');
          } catch (error) {
            log.error('WhatsApp Client', `Failed to delete auth folder: ${error.message}`);
          }
          setTimeout(startWhatsApp, 2000);
          return;
        }

        if (reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempt++;
          const delay = reconnectAttempt * 2000;
          log.info(
            'WhatsApp Client',
            `Reconnecting... (Attempt ${reconnectAttempt} of ${MAX_RECONNECT_ATTEMPTS})`
          );
          setTimeout(startWhatsApp, delay);
        } else {
          log.error(
            'WhatsApp Client',
            'Max reconnection attempts reached. Please restart manually.'
          );
          reconnectAttempt = 0;
        }
      }

      if (connection === 'open') {
        log.info('WhatsApp Client', 'Connected to WhatsApp ✅');
        reconnectAttempt = 0;
      }
    });
  } catch (error) {
    log.error('WhatsApp Client', `Error: ${error.message}`);
  }
}

export { initWhatsAppClient };
/**
 * @deprecated Use initWhatsAppClient instead
 */
export default initWhatsAppClient;
