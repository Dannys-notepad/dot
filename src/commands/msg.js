import { createCommand } from '../components/cmd/base-command.js';

const msgCommand = createCommand('msg',
  async (message, args, userType) => {
    const sock = message.sock;
    
    if (args.length < 2) {
      return '❌ Usage: $msg [phone-number] [message]\nExample: $msg +2349034138536 Hello there!';
    }
    
    const phoneNumber = args[0];
    const messageText = args.slice(1).join(' ');
    
    // Validate phone number
    let jid;
    if (phoneNumber.includes('@s.whatsapp.net')) {
      jid = phoneNumber; // Already a JID
    } else {
      // Clean phone number
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      jid = `${cleanNumber.replace('+', '')}@s.whatsapp.net`;
    }
    
    // Send confirmation
    await message.reply(`📤 Sending message to ${jid}...`);
    
    try {
      // Validate if contact exists
      const [user] = await sock.onWhatsApp(jid);
      
      if (!user || !user.exists) {
        return `❌ Contact ${jid} not found on WhatsApp.`;
      }
      
      // Send message
      await sock.sendMessage(jid, { 
        text: messageText,
        mentions: [jid]
      });
      
      return `✅ Message sent successfully to ${jid}\n📝 Content: "${messageText}"`;
      
    } catch (error) {
      console.error('Message send error:', error);
      
      if (error.message.includes('not-authorized')) {
        return `❌ Cannot message ${jid}. The user may have privacy settings enabled.`;
      }
      
      return `❌ Error sending message: ${error.message}`;
    }
  },
  { 
    description: 'Send message to specific contact',
    aliases: ['message', 'send'],
    category: 'administration',
    chatType: 'private',
    example: '$msg +2349034138536 Hello! How are you?',
    permissions: ['super-user'],
    cooldown: 10
  }
);

export default msgCommand;