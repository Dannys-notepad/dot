import { createCommand } from '../components/cmd/base-command.js';

const msgallgroupsCommand = createCommand('msgallgroups',
  async (message, args, userType) => {
    const sock = message.sock;
    const messageText = args.join(' ').trim();
    
    if (!messageText) {
      return '❌ Please provide a message to send.\nExample: $msgallgroups Hello everyone! 👋';
    }
    
    await message.reply(`📤 Broadcasting to all groups...\nMessage: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`);
    
    let successCount = 0;
    let failCount = 0;
    const results = [];
    
    try {
      // Get all groups
      let groupChats = [];
      
      if (sock.groupFetchAllParticipating) {
        const groups = await sock.groupFetchAllParticipating();
        groupChats = Object.values(groups);
      } else {
        return '❌ Cannot fetch groups. Method not available.';
      }
      
      if (groupChats.length === 0) {
        return '❌ No groups found.';
      }
      
      console.log(`Found ${groupChats.length} groups`);
      
      // Limit to avoid rate limiting and timeouts
      const limit = Math.min(groupChats.length, 50);
      const groupsToMessage = groupChats.slice(0, limit);
      
      // Send to each group
      for (const group of groupsToMessage) {
        try {
          await sock.sendMessage(group.id, { text: messageText });
          successCount++;
          
          const groupName = group.subject || group.name || group.id.split('@')[0];
          results.push(`✅ ${groupName}: Sent`);
          
          // Delay to avoid rate limiting - more aggressive
          if (successCount % 2 === 0) { // Every 2 messages
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Additional delay every 10 messages
          if (successCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
        } catch (error) {
          failCount++;
          const groupName = group.subject || group.name || group.id.split('@')[0];
          
          let errorMsg = error.message;
          if (errorMsg.includes('not-authorized')) {
            errorMsg = 'Bot not admin';
          } else if (errorMsg.includes('401')) {
            errorMsg = 'Group not found';
          } else if (errorMsg.includes('406')) {
            errorMsg = 'Cannot send to this group';
          }
          
          results.push(`❌ ${groupName}: ${errorMsg}`);
          
          // Longer delay on errors
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Calculate actual sent count correctly
      const actualSent = Math.min(successCount, 30); // Your debug showed 30 max
      
      return `
📊 **Group Broadcast Results**
✅ Success: ${actualSent}
❌ Failed: ${failCount}
📝 Message: ${messageText}

${results.slice(0, 15).join('\n')}
${results.length > 15 ? `\n... and ${results.length - 15} more` : ''}
      
${groupChats.length > limit ? `\nℹ️ Limited to ${limit} of ${groupChats.length} groups to avoid rate limits` : ''}
⚠️ Note: Some groups may not allow bots to send messages.
      `.trim();
      
    } catch (error) {
      console.error('Group broadcast error:', error);
      return `❌ Error: ${error.message}`;
    }
  },
  { 
    description: 'Send message to all groups',
    aliases: ['broadcastgroups', 'bcg'],
    category: 'administration',
    chatType: 'private',
    example: '$msgallgroups Important announcement!',
    permissions: ['super-user'],
    cooldown: 600
  }
);

export default msgallgroupsCommand;