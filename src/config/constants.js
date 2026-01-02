const BOT = {
  // Basic Bot Identity
  NAME: 'Dot',
  ALIAS: 'Dot',
  VERSION: '1.0.0-alpha',
  VERSION_NAME: 'Genesis',
  COMMAND_PREFIX: '$',
  EMOJI: '🤖',
  TAGLINE: 'Your Intelligent WhatsApp Assistant',
  
  // Bot Behavior Settings
  LISTEN_TO_SELF: true,
  
  // Developer Information
  DEVELOPER: {
    NAME: 'Etim Daniel Udeme',
    DISPLAY_NAME: 'Udeme',
    NUMBER: '+2348025089292',
    EMAIL: 'etimdnl41@gmail.com',
    GITHUB: 'https://github.com/Dannys-notepad',
    REPO: 'https://github.com/Dannys-notepad/dot'
  }
}

// Freeze the object to prevent accidental modifications
/*Object.freeze(BOT);
Object.freeze(BOT.DEVELOPER);*/

export default BOT;
