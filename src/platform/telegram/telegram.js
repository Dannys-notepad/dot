require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");

const fs = require("fs");
const path = require("path");

const apiId = 22803509;
const apiHash = "9e8efd164f31cd43570185cb347f903d"; 
const stringSession = new StringSession(process.env.TELEGRAM_STRING_SESSION);

//const filePath = path.join(__dirname, "session.json");

(async () => {
  console.log("Starting Delvin Telegram client...");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Please enter your phone number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () => await input.text("Please enter the code you received: "),
    onError: (err) => console.log("Error:", err),
  });

  console.log("✅ Delvin is now connected to Telegram!");
  
  // Save session string after successful login
  const savedSession = client.session.save();
  // fs.writeFileSync(filePath, JSON.stringify({ session: savedSession }, null, 2));
  // console.log("💾 Session saved to session.json");

  // 🔥 Listen for new messages
  client.addEventHandler(async (event) => {
    const message = event.message;
    if (message.isFromMe) return; // skip your own messages

    const sender = await message.getSender();
    const name = sender?.firstName || "Unknown";

    console.log(`📩 New message from ${name}: ${message.text}`);

    await client.sendMessage(message.chatId, { 
      message: `Hey ${name}! How's it going?` 
    });
  }, new NewMessage({}));

})();
