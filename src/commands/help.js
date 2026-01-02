// commands/help-simple-dynamic.js
import { createCommand } from '../components/cmd/base-command.js';
import BOT from '../config/constants.js';

const helpSimpleDynamicCommand = createCommand('help',
  async (message, args, userType, handler) => {
    const [query] = args;
    const isGroup = message.chatId.endsWith('@g.us');
    const chatType = isGroup ? 'group' : 'private';
    
    // If query is provided
    if (query) {
      // Try to get command
      const command = handler.get(query);
      if (command) {
        // Check permissions and chat type
        if (!command.permissions.includes(userType)) {
          return `🚫 You need ${command.permissions.join(' or ')} permissions`;
        }
        if (command.chatType !== 'both' && command.chatType !== chatType) {
          return `⚠️ This command works in ${command.chatType} only`;
        }
        
        // Return command info
        return formatCommandInfo(command);
      }
      
      // If not a command, show available commands
      return `Command "${query}" not found.\n\n` +
             `Available commands:\n${await getAvailableCommandsList(handler, userType, chatType)}`;
    }
    
    // Show all available commands
    return await getAllCommands(handler, userType, chatType);
  },
  { 
    description: 'Show help for commands',
    aliases: ['h', 'commands'],
    category: 'general',
    chatType: 'both',
    example: '$help | $help ping',
    permissions: ['user', 'admin', 'super-user']
  }
);

// Helper: Format command info
function formatCommandInfo(command) {
  return `
*${command.name.toUpperCase()}*
${command.description}

*Usage:* ${command.example || `${BOT.COMMAND_PREFIX}${command.name}`}
*Category:* ${command.category}
*Cooldown:* ${command.cooldown || 0}s
*Aliases:* ${command.aliases.join(', ') || 'none'}
*Permissions:* ${command.permissions.join(', ')}
*Chat Type:* ${command.chatType}
  `.trim();
}

// Helper: Get list of available commands
async function getAvailableCommandsList(handler, userType, chatType) {
  const commandsByCategory = await handler.listForUser(userType, chatType);
  let list = '';
  
  for (const [category, commands] of Object.entries(commandsByCategory)) {
    const commandNames = commands.map(c => `\`${BOT.COMMAND_PREFIX}${c.name}\``).join(', ');
    list += `*${category}:* ${commandNames}\n`;
  }
  
  return list;
}

// Helper: Get all commands formatted
async function getAllCommands(handler, userType, chatType) {
  const commandsByCategory = await handler.listForUser(userType, chatType);
  
  if (Object.keys(commandsByCategory).length === 0) {
    return 'No commands available for you.';
  }
  
  let response = `*${BOT.NAME} Commands*\n`;
  response += `Prefix: ${BOT.COMMAND_PREFIX}\n\n`;
  
  let totalCommands = 0;
  
  for (const [category, commands] of Object.entries(commandsByCategory)) {
    response += `*${category.toUpperCase()}*\n`;
    
    commands.forEach(cmd => {
      response += `• ${BOT.COMMAND_PREFIX}${cmd.name} - ${cmd.description}`;
      if (cmd.cooldown) response += ` ⏱️${cmd.cooldown}s`;
      if (cmd.permissions.includes('super-user') && !cmd.permissions.includes('user')) {
        response += ` 👑`;
      }
      response += '\n';
    });
    
    response += '\n';
    totalCommands += commands.length;
  }
  
  response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  response += `📊 Total: ${totalCommands} commands\n`;
  response += `ℹ️ Use \`${BOT.COMMAND_PREFIX}help [command]\` for details\n`;
  response += `🔑 👑 = Super-user only`;
  
  return response;
}

export default helpSimpleDynamicCommand;