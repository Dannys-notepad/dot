import { createCommand } from '../components/cmd/base-command.js';

const infoCommand = createCommand('info',
  async (message, args, userType) => {
    const sock = message.sock;
    const chatId = message.chatId;
    const senderId = message.senderId;
    
    // Determine target (self or mentioned user)
    let targetJid = senderId;
    let targetName = 'You';
    
    // Check if user mentioned someone
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length > 0) {
      targetJid = mentionedIds[0];
      targetName = 'User';
    }
    
    // Check if it's a group
    const isGroup = chatId.endsWith('@g.us');
    
    let info = '';
    
    try {
      // Get user info
      info += `👤 **USER INFORMATION**\n`;
      info += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      // Basic info
      info += `🆔 **User ID:** ${targetJid}\n`;
      info += `👑 **Access Level:** ${targetJid === senderId ? userType : 'Unknown'}\n`;
      info += `💬 **Chat Type:** ${isGroup ? 'Group' : 'Private'}\n`;
      info += `🕐 **Time:** ${new Date().toLocaleTimeString()}\n\n`;
      
      // If in group, get group role
      if (isGroup) {
        try {
          const metadata = await sock.groupMetadata(chatId);
          const participant = metadata.participants.find(p => p.id === targetJid);
          
          if (participant) {
            info += `👥 **Group Info:**\n`;
            info += `  • Group: ${metadata.subject}\n`;
            info += `  • Role: ${participant.admin || 'member'}\n`;
            info += `  • Participants: ${metadata.participants.length}\n\n`;
          }
        } catch (groupError) {
          // Silently continue if group metadata fails
        }
      }
      
      // WhatsApp profile info (if available)
      try {
        const [profile] = await sock.fetchStatus(targetJid).catch(() => [null]);
        if (profile) {
          info += `📱 **WhatsApp Profile:**\n`;
          if (profile.status) info += `  • Status: ${profile.status}\n`;
          if (profile.setAt) info += `  • Last Updated: ${new Date(profile.setAt).toLocaleDateString()}\n`;
        }
      } catch (profileError) {
        // Profile might not be available
      }
      
      // Check if user is online (if it's not a group and not ourselves)
      if (!isGroup && targetJid !== senderId) {
        try {
          const [presence] = await sock.presenceSubscribe(targetJid).catch(() => [null]);
          if (presence) {
            info += `\n📶 **Presence:** ${presence.lastKnownPresence || 'unknown'}\n`;
            info += `⏰ **Last Seen:** ${presence.lastSeen ? new Date(presence.lastSeen).toLocaleString() : 'Unknown'}\n`;
          }
        } catch (presenceError) {
          // Presence might not be available
        }
      }
      
      info += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      // Add privacy note
      info += `\nℹ️ *Note: Some information may not be available due to privacy settings.*`;
      
      return info;
      
    } catch (error) {
      console.error('Info error:', error);
      return `❌ Error getting information: ${error.message}`;
    }
  },
  { 
    description: 'Show user information',
    aliases: ['whois', 'userinfo', 'profile'],
    category: 'utility',
    chatType: 'both',
    example: '$info | $info @mention',
    permissions: ['user', 'admin', 'super-user'],
    cooldown: 5
  }
);

export default infoCommand;