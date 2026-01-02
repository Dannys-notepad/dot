// commands/about-simple.js
import { createCommand } from '../components/cmd/base-command.js';
import BOT from '../config/constants.js';
import fs from 'fs';
import path from 'path';

const aboutSimpleCommand = createCommand('about',
  async (message, args, userType) => {
    const sock = message.sock;
    
    const caption = `
*🤖 ${BOT.NAME} ${BOT.EMOJI}*
${BOT.TAGLINE}

*Version:* ${BOT.VERSION} (${BOT.VERSION_NAME})
*Prefix:* \`${BOT.COMMAND_PREFIX}\`
*Developer:* ${BOT.DEVELOPER.DISPLAY_NAME}

🔗 ${BOT.DEVELOPER.REPO}
📧 ${BOT.DEVELOPER.EMAIL}
📱 ${BOT.DEVELOPER.NUMBER}

Use \`${BOT.COMMAND_PREFIX}help\` for commands
    `.trim();
    
    try {
      // Try from project root (most reliable)
      const logoPath1 = path.join(process.cwd(), 'assets', 'dot.jpeg');
      const logoPath2 = path.join(process.cwd(), 'assets', 'bot.jpg');
      
      let imageBuffer = null;
      let mimeType = 'image/jpeg';
      
      if (fs.existsSync(logoPath1)) {
        imageBuffer = fs.readFileSync(logoPath1);
        console.log('Using dot.jpeg from project root');
      } else if (fs.existsSync(logoPath2)) {
        imageBuffer = fs.readFileSync(logoPath2);
        console.log('Using bot.jpg from project root');
      } else {
        // Try relative from commands folder
        const logoPath3 = path.join(__dirname, '../../assets/dot.jpeg');
        if (fs.existsSync(logoPath3)) {
          imageBuffer = fs.readFileSync(logoPath3);
          console.log('Using dot.jpeg from relative path');
        }
      }
      
      if (imageBuffer) {
        await sock.sendMessage(message.chatId, {
          image: imageBuffer,
          caption: caption,
          mimetype: mimeType
        });
        return '';
      } else {
        console.log('No image found, sending text only');
        return caption;
      }
      
    } catch (error) {
      console.error('Error sending about:', error);
      return caption; // Fallback to text
    }
  },
  { 
    description: 'Show bot information with image',
    aliases: ['bot', 'info'],
    category: 'general',
    chatType: 'both',
    example: '$about',
    permissions: ['user', 'admin', 'super-user']
  }
);

export default aboutSimpleCommand;