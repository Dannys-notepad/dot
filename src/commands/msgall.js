import { createCommand } from '../components/cmd/base-command.js';

const msgallCommand = createCommand('msgall',
  async (message, args, userType) => {
    const sock = message.sock;
    const messageText = args.join(' ').trim();
    
    if (!messageText) {
      return '❌ Please provide a message to send.\nExample: $msgall Happy New Year! 🎉';
    }
    
    // Send initial confirmation
    await message.reply(`📤 Starting broadcast to all contacts...\nMessage: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`);
    
    let successCount = 0;
    let failCount = 0;
    const results = [];
    
    try {
      // Method 1: Get all chats (including groups) and filter for personal chats
      let allChats = [];
      
      // First try to get all chats from WhatsApp
      if (sock.groupFetchAllParticipating) {
        // Get groups first
        const groups = await sock.groupFetchAllParticipating();
        const groupArray = Object.values(groups);
        
        // For personal contacts, we need to get them differently
        // WhatsApp Web doesn't directly expose contact list, so we need to use conversations
        
        // Method A: Get from recent chats/messages
        try {
          // Get recent chats from store if available
          if (sock.ev?.store?.chats) {
            allChats = Object.values(sock.ev.store.chats);
          } else {
            // Try to get from conversations
            // We'll simulate getting contacts by checking who we've messaged
            allChats = [];
          }
        } catch (error) {
          console.log('Could not get chats from store:', error.message);
        }
        
        // Method B: Use blocklist as a proxy for contacts
        try {
          const blocklist = await sock.fetchBlocklist();
          if (blocklist && blocklist.length > 0) {
            // Add blocklist contacts
            blocklist.forEach(id => {
              if (!allChats.some(chat => chat.id === id)) {
                allChats.push({ id, name: id.split('@')[0] });
              }
            });
          }
        } catch (error) {
          console.log('Could not get blocklist:', error.message);
        }
        
        // Combine groups with found contacts
        allChats = [...groupArray, ...allChats];
      }
      
      // Filter to get only personal chats (not groups, not broadcasts)
      const personalChats = allChats.filter(chat => 
        chat.id && 
        !chat.id.endsWith('@g.us') && 
        !chat.id.endsWith('@broadcast') &&
        !chat.id.includes('status') &&
        !chat.id.includes('@lid') &&
        !chat.id.includes('@newsletter')
      );
      
      console.log(`Found ${personalChats.length} potential personal contacts`);
      
      if (personalChats.length === 0) {
        // Alternative method: Get contacts from phone's address book
        return `❌ No personal contacts found via standard methods.\n\n` +
               `📱 **Alternative:**\n` +
               `1. You can use \`$msg [number] [message]\` to message individuals\n` +
               `2. Or forward messages manually for now\n` +
               `3. Try using the bot in a group first to build chat history`;
      }
      
      // Send to each contact (with aggressive filtering)
      for (const contact of personalChats.slice(0, 100)) { // Increased limit
        // Skip if it's the bot itself
        if (contact.id === sock.user?.id) continue;
        
        // Skip if it looks like a WhatsApp service number
        if (contact.id.includes('@s.whatsapp.net') && 
            contact.id.split('@')[0].length < 8) continue;
        
        try {
          // Verify contact exists on WhatsApp
          const [exists] = await sock.onWhatsApp(contact.id);
          
          if (exists && exists.exists) {
            await sock.sendMessage(contact.id, { text: messageText });
            successCount++;
            
            const contactName = contact.name || contact.notify || contact.id.split('@')[0];
            results.push(`✅ ${contactName}: Sent`);
            
            // Small delay to avoid rate limiting
            if (successCount % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          } else {
            console.log(`Skipping ${contact.id} - not on WhatsApp`);
          }
        } catch (error) {
          failCount++;
          const contactName = contact.name || contact.notify || contact.id.split('@')[0];
          results.push(`❌ ${contactName}: ${error.message}`);
          
          // If it's a privacy error, note it
          if (error.message.includes('not-authorized') || 
              error.message.includes('privacy')) {
            results[results.length - 1] += ' (Privacy settings)';
          }
        }
      }
      
      return `
📊 **Broadcast Results**
✅ Success: ${successCount}
❌ Failed: ${failCount}
📝 Message: ${messageText}

${results.slice(0, 15).join('\n')}
${results.length > 15 ? `\n... and ${results.length - 15} more` : ''}

${successCount === 0 ? `\n⚠️ **Tip:** The bot might not have access to your contact list. Try:\n` +
`1. Message someone first with the bot\n` +
`2. Use the bot in groups to build history\n` +
`3. Check WhatsApp Web privacy settings` : ''}
      `.trim();
      
    } catch (error) {
      console.error('Broadcast error:', error);
      return `❌ Error: ${error.message}\n\n` +
             `Try using: $msg [phone-number] [message] for individual messages`;
    }
  },
  { 
    description: 'Send message to all personal contacts',
    aliases: ['broadcast', 'bc'],
    category: 'administration',
    chatType: 'private',
    example: '$msgall Happy New Year! 🎉',
    permissions: ['super-user'],
    cooldown: 300
  }
);

export default msgallCommand;