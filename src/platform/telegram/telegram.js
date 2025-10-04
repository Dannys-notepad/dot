require("dotenv").config();
const { TelegramClient, Api } = require("telegram"); // ⬅️ Added `Api`
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");

const { processMessage, messageTemplates } = require("../../core/core");
const log = require("../../utils/log");

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_STRING_SESSION);

(async () => {
  console.log("🤖 Starting Delvin Telegram client...");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Please enter your phone number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () => await input.text("Please enter the code you received: "),
    onError: (err) => console.error("❌ Error:", err),
  });

  log("✅ Delvin is now connected to Telegram!");

  // Conversation tracking to avoid spam
  const lastResponse = new Map();
  const COOLDOWN = 2000; // 2 second cooldown

  client.addEventHandler(async (event) => {
    try {
      const message = event.message;

      if (message.isFromMe) return;
      if (!message.text) return;

      const chatId = message.chatId.toString();
      const sender = await message.getSender();
      const userName = sender?.firstName || "friend";
      const messageText = message.text;

      log(`\n📩 Message from ${userName}: ${messageText}`);

      const lastTime = lastResponse.get(chatId) || 0;
      const now = Date.now();
      if (now - lastTime < COOLDOWN) {
        log("⏱️  Cooldown active, skipping...");
        return;
      }

      // ✅ FIXED: use proper Api class instead of raw object
      const peer = await client.getInputEntity(message.chatId);
      await client.invoke(
        new Api.messages.SetTyping({
          peer,
          action: new Api.SendMessageTypingAction(), // ⬅️ fixed action
        })
      );

      // Process the message through Delvin's brain
      const response = await processMessage(messageText, userName);

      if (!response) return;

      await client.sendMessage(message.chatId, {
        message: response,
        parseMode: "markdown",
      });

      log(`✅ Replied to ${userName}`);
      lastResponse.set(chatId, now);

    } catch (error) {
      console.error("❌ Event handler error:", error);

      try {
        await client.sendMessage(event.message.chatId, { // ⬅️ fixed: ensure event.message
          message: messageTemplates.error,
        });
      } catch (e) {
        console.error("Failed to send error message:", e);
      }
    }
  }, new NewMessage({}));

  log("🎧 Delvin is listening for messages...\n");
})();