import { createCommand } from '../components/cmd/base-command.js';

const tagallCommand = createCommand('tagall',
  async (message, args, userType) => {
    const sock = message.sock;
    const chatId = message.chatId;
    
    // Check if in group
    if (!chatId.endsWith('@g.us')) {
      return '❌ This command only works in groups!';
    }
    
    // Optional custom message
    const customMessage = args.join(' ') || 'Attention everyone! 👋';
    
    await message.reply(`🔔 Tagging all members...`);
    
    try {
      // Get group metadata
      const metadata = await sock.groupMetadata(chatId);
      const participants = metadata.participants;
      
      // Extract all JIDs
      const mentions = participants.map(p => p.id);
      
      // Create mention text
      let mentionText = `${customMessage}\n\n`;
      mentionText += `👥 **Total Members:** ${participants.length}\n\n`;
      
      // Add mentions (WhatsApp supports up to 20 mentions per message)
      const maxMentions = 20;
      const mentionsToSend = mentions.slice(0, maxMentions);
      
      if (mentions.length > maxMentions) {
        mentionText += `📢 Mentioning ${maxMentions} of ${participants.length} members:\n`;
      } else {
        mentionText += `📢 Mentioning all ${participants.length} members:\n`;
      }
      
      // Send the mention message
      await sock.sendMessage(chatId, { 
        text: mentionText,
        mentions: mentionsToSend
      });
      
      // If there are more members than we can mention, send additional info
      if (mentions.length > maxMentions) {
        const remaining = mentions.length - maxMentions;
        return `✅ Tagged ${maxMentions} members. ${remaining} more members not mentioned due to WhatsApp limits.`;
      }
      
      return `✅ Successfully tagged ${mentions.length} members!`;
      
    } catch (error) {
      console.error('Tagall error:', error);
      
      if (error.message.includes('not-authorized')) {
        return '❌ Bot needs admin permissions to tag everyone in this group.';
      }
      
      return `❌ Error: ${error.message}`;
    }
  },
  { 
    description: 'Mention all members in a group',
    aliases: ['everyone', 'mentionall', 'alert'],
    category: 'group',
    chatType: 'group',
    example: '$tagall Meeting starts in 5 minutes!',
    permissions: ['admin', 'super-user'],
    cooldown: 30
  }
);

export default tagallCommand;