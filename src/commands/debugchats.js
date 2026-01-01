import { createCommand } from '../components/cmd/base-command.js';

const debugChatsCommand = createCommand('debugchats',
  async (message, args, userType) => {
    const sock = message.sock;
    
    let debugInfo = `🔍 **Socket Debug Info**\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Check socket properties
    debugInfo += `**Socket Properties:**\n`;
    debugInfo += `• sock type: ${typeof sock}\n`;
    debugInfo += `• sock.user: ${sock.user ? '✅' : '❌'}\n`;
    debugInfo += `• sock.chats: ${sock.chats ? '✅' : '❌'}\n`;
    debugInfo += `• sock.ev: ${sock.ev ? '✅' : '❌'}\n`;
    debugInfo += `• sock.groupFetchAllParticipating: ${sock.groupFetchAllParticipating ? '✅' : '❌'}\n\n`;
    
    // Check store
    if (sock.ev?.store) {
      debugInfo += `**Store Contents:**\n`;
      const store = sock.ev.store;
      
      debugInfo += `• chats: ${store.chats ? Object.keys(store.chats).length : 0}\n`;
      debugInfo += `• contacts: ${store.contacts ? Object.keys(store.contacts).length : 0}\n`;
      debugInfo += `• messages: ${store.messages ? Object.keys(store.messages).length : 0}\n\n`;
      
      // Sample chats
      if (store.chats) {
        const chatKeys = Object.keys(store.chats);
        debugInfo += `**Sample Chats (${Math.min(5, chatKeys.length)} of ${chatKeys.length}):**\n`;
        chatKeys.slice(0, 5).forEach(key => {
          const chat = store.chats[key];
          debugInfo += `• ${key} - ${chat.name || 'No name'}\n`;
        });
      }
    } else {
      debugInfo += `❌ No store found in sock.ev\n\n`;
    }
    
    // Try to fetch chats directly
    debugInfo += `**Direct Fetch Attempts:**\n`;
    
    try {
      if (sock.groupFetchAllParticipating) {
        const groups = await sock.groupFetchAllParticipating();
        debugInfo += `• groupFetchAllParticipating: ${Object.keys(groups).length} groups\n`;
      }
    } catch (error) {
      debugInfo += `• groupFetchAllParticipating: ❌ ${error.message}\n`;
    }
    
    try {
      if (sock.fetchBlocklist) {
        const blocklist = await sock.fetchBlocklist();
        debugInfo += `• fetchBlocklist: ${blocklist ? blocklist.length : 0} contacts\n`;
      }
    } catch (error) {
      debugInfo += `• fetchBlocklist: ❌ ${error.message}\n`;
    }
    
    debugInfo += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    debugInfo += `ℹ️ Use this info to fix broadcast commands`;
    
    return debugInfo;
  },
  { 
    description: 'Debug chat/contact access',
    aliases: ['debug', 'checkchats'],
    category: 'debug',
    chatType: 'private',
    example: '$debugchats',
    permissions: ['super-user']
  }
);

export default debugChatsCommand;