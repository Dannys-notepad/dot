require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { processMessage, messageTemplates } = require('../../core/core');
const log = require('../../utils/log');

const AUTH_FOLDER = path.join(__dirname, '../../../auth_whatsapp');

// Whitelist - Only respond to these phone numbers
// Format: country_code + number (without + or spaces)
const ALLOWED_NUMBERS = ['2349135634324', '2349134598141', '2349067390162'];

/**
 * Check if user is allowed to interact with Delvin
 */
function isAllowedUser(sender) {
  if (!sender) return false;

  // Extract phone number from JID (e.g., "2348012345678@s.whatsapp.net")
  const phoneNumber = sender.split('@')[0];

  // Check if number is in whitelist
  for (let i = 0; i < ALLOWED_NUMBERS.length; i++) {
    if (phoneNumber === ALLOWED_NUMBERS[i]) {
      return true;
    }
  }

  return false;
}

// Simple in-memory message store, to store previous 6 messages
const messageStore = new Map();
const MAX_HISTORY = 6;

/**
 * Store a message in history
 */
function storeMessage(chatId, message, userName) {
  if (!messageStore.has(chatId)) {
    messageStore.set(chatId, []);
  }

  const history = messageStore.get(chatId);
  history.push({
    text: message,
    userName: userName,
    timestamp: Date.now(),
  });

  // Keep only last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
}

/**
 * Get conversation history
 */
function getHistory(chatId) {
  if (!messageStore.has(chatId)) {
    return '';
  }

  const history = messageStore.get(chatId);
  const formatted = [];

  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    formatted.push(msg.userName + ': ' + msg.text);
  }

  return formatted.join('\n');
}

async function startWhatsApp() {
  log('🤖 Starting Delvin WhatsApp client...');

  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log('📱 Scan this QR with WhatsApp (Linked Devices):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (lastDisconnect?.error?.output?.payload?.attrs?.code === '515') {
        log('⚠️  Auth state corrupted (code 515). Resetting session...');
        try {
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          log('🗑️  Old auth state deleted. Restarting for fresh QR...');
        } catch (err) {
          console.error('❌ Failed to delete auth folder:', err);
        }
        setTimeout(startWhatsApp, 2000);
        return;
      }

      log('❌ WhatsApp connection closed');
      if (shouldReconnect) {
        log('🔄 Reconnecting...');
        startWhatsApp();
      } else {
        log('🚪 Logged out. Please restart and scan QR code again.');
      }
    } else if (connection === 'open') {
      log('✅ Delvin is now connected to WhatsApp!');
    }
  });

  // Conversation tracking
  const lastResponse = new Map();
  const COOLDOWN = 2000;

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    try {
      const sender = msg.key.remoteJid;
      const userName = msg.pushName || sender.split('@')[0] || 'Unknown';
      const phoneNumber = sender.split('@')[0];

      // 🔒 Check if user is allowed by phone number
      if (!isAllowedUser(sender)) {
        log(`🚫 Ignored message from unauthorized number: ${phoneNumber}`);
        await sock.readMessages([msg.key]);
        return;
      }

      // 👀 Mark as read (blue tick)
      await sock.readMessages([msg.key]);

      // 🎤 Detect voice notes
      if (msg.message.audioMessage?.ptt) {
        log('🎤 Voice message received from ' + userName);
        await sock.sendMessage(sender, {
          text: "Sorry I don't understand voice messages yet.",
        });
        return;
      }

      // 📩 Handle text messages
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (!text.trim()) return;

      log(`\n📩 [WhatsApp] ${userName} (${phoneNumber}): ${text}`);

      const chatId = sender.toString();
      const lastTime = lastResponse.get(chatId) || 0;
      const now = Date.now();

      if (now - lastTime < COOLDOWN) {
        log('⏱️  Cooldown active, skipping...');
        return;
      }

      // 📜 Get conversation history
      const history = getHistory(chatId);

      if (history) {
        log('📜 Recent conversation:\n' + history);
      }

      // 🤖 Create contextual input
      const context = history ? `Recent conversation:\n${history}\n\n${userName}: ${text}` : text;

      // ✨ Process with Delvin's brain
      await sock.sendPresenceUpdate('composing', sender);
      const response = await processMessage(context, userName, 'whatsapp');
      await sock.sendPresenceUpdate('paused', sender);

      if (!response) return;

      // 💾 Store both user message and bot response in history
      storeMessage(chatId, text, userName);
      storeMessage(chatId, response, 'Delvin');

      await sock.sendMessage(sender, { text: response });
      log(`✅ Replied to ${userName}`);
      lastResponse.set(chatId, now);
    } catch (error) {
      console.error('❌ Event handler error:', error);
      try {
        if (msg?.key?.remoteJid) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: messageTemplates.error,
          });
        }
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    }
  });

  log('🎧 Delvin is listening for WhatsApp messages...');
  log('🔒 Only responding to whitelisted phone numbers\n');
}

startWhatsApp();
