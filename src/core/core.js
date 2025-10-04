const axios = require('axios');
const log = require('../utils/log');

// ==================== DELVIN'S PERSONALITY ====================

const DELVIN_SYSTEM_PROMPT = `You are Delvin, a smart and friendly AI assistant operating as a real person on messaging platforms. 

Your personality:
- Friendly and conversational, like chatting with a tech-savvy friend, not every friend is tech-savvy though
- Efficient but warm - get to the point naturally
- Use emojis naturally (1-2 per message)
- Professional when needed, casual when appropriate

Your capabilities:
- Download media from social platforms
- Help manage groups and channels
- Answer questions and have real conversations
- Provide information and assistance

Keep responses concise and natural. You're chatting like a real person, not a formal bot.`;

// ==================== MESSAGE TEMPLATES ====================

const messageTemplates = {
  greetings: [
    "Hey! 👋 What's up?",
    "Hi there! How can I help?",
    "Hello! 😊 What do you need?",
    "Hey hey! What brings you here?"
  ],

  help: `🤖 *What I can do:*

• Chat naturally about anything
• Download videos (TikTok, YouTube, IG, Twitter)
• Help with group management
• Answer questions

Just send me a message or link!`,

  error: "Hmm, something went wrong 😅 Try again?",
};

// ==================== SMART DETECTION ====================

function isGreeting(text) {
  const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'morning', 'evening', 'afternoon'];
  const lower = text.toLowerCase().trim();
  return greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ','));
}

function isHelpCommand(text) {
  const helpWords = ['help', 'menu', 'commands', 'what can you do', 'features'];
  const lower = text.toLowerCase().trim();
  return helpWords.some(h => lower.includes(h));
}

function isMediaUrl(text) {
  const mediaPatterns = [
    /tiktok\.com/i,
    /vm\.tiktok\.com/i,
    /youtube\.com|youtu\.be/i,
    /instagram\.com/i,
    /twitter\.com|x\.com/i,
    /facebook\.com/i,
  ];
  return mediaPatterns.some(pattern => pattern.test(text));
}

function shouldIgnore(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.trim().length < 2) return true;
  return false;
}

// ==================== AI INTEGRATION ====================

async function getAIResponse(userMessage, userName = "friend") {
  try {
    // Keep it short for Hercai
    const contextPrompt = `Reply as Delvin (concise, friendly, natural) and also stop saying hey everytime. The user says: ${userMessage}`;

    const response = await axios.get("https://hercai.onrender.com/v3/hercai", {
      params: { question: contextPrompt },
      timeout: 20000,
    });

    if (response.data && response.data.reply) {
      return response.data.reply;
    }

    throw new Error("Invalid API response");
  } catch (error) {
    console.error("❌ AI API Error:", error);
    return messageTemplates.error;
  }
}


// ==================== MAIN MESSAGE PROCESSOR ====================

async function processMessage(text, userName = "friend") {
  try {
    // Ignore empty or very short messages
    if (shouldIgnore(text)) return null;

    const trimmed = text.trim();

    // Quick greeting response
    if (isGreeting(trimmed)) {
      const greeting = messageTemplates.greetings[
        Math.floor(Math.random() * messageTemplates.greetings.length)
      ];
      return greeting;
    }

    // Help command
    if (isHelpCommand(trimmed)) {
      return messageTemplates.help;
    }

    // Media download (placeholder for now)
    if (isMediaUrl(trimmed)) {
      return "🎬 I see a media link! Download feature coming soon. For now, let's chat about something else?";
    }

    // For everything else, ask AI
    return await getAIResponse(trimmed, userName);

  } catch (error) {
    console.error('❌ Processing error:', error);
    return messageTemplates.error;
  }
}

// ==================== EXPORTS ====================

module.exports = {
  processMessage,
  messageTemplates
};