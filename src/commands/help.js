import { createCommand } from '../components/cmd/base-command.js';

const helpCommand = createCommand('help',
  async (message, args, userType, handler) => {
    const [categoryOrCommand] = args;
    const isGroup = message.chatId.endsWith('@g.us');
    const chatType = isGroup ? 'group' : 'private';
    
    // If asking for specific command
    if (categoryOrCommand) {
      const command = handler.get(categoryOrCommand);
      if (!command) return `Command "${categoryOrCommand}" not found`;
      
      if (!command.permissions.includes(userType)) {
        return `You don't have permission to use ${command.name}`;
      }
      
      if (command.chatType !== 'both' && command.chatType !== chatType) {
        const allowed = command.chatType === 'group' ? 'groups only' : 'private chats only';
        return `⚠️ ${command.name} works in ${allowed}`;
      }
      
      return `
📚 **${command.name}**
${command.description}

📂 Category: ${command.category}
👥 Works in: ${command.chatType === 'both' ? 'Groups & Private' : command.chatType === 'group' ? 'Groups only' : 'Private only'}
🎯 Usage: ${command.example || `$${command.name}`}
⚡ Cooldown: ${command.cooldown || 0}s
🔤 Aliases: ${command.aliases.join(', ') || 'none'}
👑 Required: ${command.permissions.join(', ')}
      `.trim();
    }
    
    // Show all commands by category
    const commandsByCategory = await handler.listForUser(userType, chatType);
    
    if (Object.keys(commandsByCategory).length === 0) {
      return 'No commands available for you in this chat type.';
    }
    
    let response = `📚 **AVAILABLE COMMANDS**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    response += `👤 You are: ${userType}\n`;
    response += `💬 Chat: ${isGroup ? 'Group' : 'Private'}\n\n`;
    
    for (const [category, commandsList] of Object.entries(commandsByCategory)) {
      response += `**${category.toUpperCase()}**\n`;
      commandsList.forEach(cmd => {
        response += `• $${cmd.name} - ${cmd.description}`;
        if (cmd.example) response += `\n  📝 *Example:* ${cmd.example}`;
        if (cmd.cooldown) response += ` ⏱️${cmd.cooldown}s`;
        if (cmd.permissions && cmd.permissions.length === 1 && cmd.permissions[0] === 'super-user') {
          response += ` 👑`;
        }
        response += '\n';
      });
      response += '\n';
    }
    
    response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `ℹ️ Use \`$help [command]\` for detailed info\n`;
    response += `🔑 👑 = Super-user only | ⏱️ = Cooldown`;
    
    return response;
  },
  { 
    description: 'Show available commands',
    aliases: ['h', 'commands', 'menu'],
    category: 'general',
    chatType: 'both',
    example: '$help | $help ping | $help administration',
    permissions: ['user', 'admin', 'super-user']
  }
);

export default helpCommand;