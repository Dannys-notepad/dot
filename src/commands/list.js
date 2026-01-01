import { createCommand } from '../components/cmd/base-command.js';

const listCommand = createCommand('list',
  async (message, args, userType, handler) => {
    const [filterType, filterValue] = args;
    const isGroup = message.chatId.endsWith('@g.us');
    const chatType = isGroup ? 'group' : 'private';
    
    // Get all commands for the user
    const commandsByCategory = await handler.listForUser(userType, chatType);
    
    if (Object.keys(commandsByCategory).length === 0) {
      return 'No commands available for you.';
    }
    
    let response = '';
    let totalCommands = 0;
    
    // Apply filters if specified
    if (filterType) {
      response += `🔍 **Filtered Commands**\n`;
      response += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      response += `👤 User: ${userType}\n`;
      response += `💬 Chat: ${isGroup ? 'Group' : 'Private'}\n`;
      response += `🎯 Filter: ${filterType}${filterValue ? ` = ${filterValue}` : ''}\n\n`;
      
      const filteredCommands = [];
      
      for (const [category, commandsList] of Object.entries(commandsByCategory)) {
        for (const cmd of commandsList) {
          let include = false;
          
          switch (filterType.toLowerCase()) {
            case 'category':
            case 'cat':
              if (filterValue) {
                include = category.toLowerCase().includes(filterValue.toLowerCase());
              } else {
                // List all categories if no value specified
                include = true;
              }
              break;
              
            case 'permission':
            case 'perm':
              if (filterValue) {
                include = cmd.permissions.some(p => p.toLowerCase().includes(filterValue.toLowerCase()));
              } else {
                include = true;
              }
              break;
              
            case 'cooldown':
              if (filterValue) {
                const value = parseInt(filterValue);
                if (!isNaN(value)) {
                  include = cmd.cooldown >= value;
                } else if (filterValue === 'none') {
                  include = cmd.cooldown === 0;
                } else if (filterValue === 'any') {
                  include = cmd.cooldown > 0;
                }
              } else {
                include = true;
              }
              break;
              
            case 'chat':
            case 'chattype':
              if (filterValue) {
                include = cmd.chatType.toLowerCase().includes(filterValue.toLowerCase());
              } else {
                include = true;
              }
              break;
              
            case 'name':
              if (filterValue) {
                include = cmd.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                         cmd.aliases.some(a => a.toLowerCase().includes(filterValue.toLowerCase()));
              } else {
                include = true;
              }
              break;
              
            default:
              include = false;
              response += `❌ Unknown filter type. Available: category, permission, cooldown, chat, name\n\n`;
          }
          
          if (include) {
            filteredCommands.push({ ...cmd, category });
          }
        }
      }
      
      if (filterType === 'category' && !filterValue) {
        // List categories only
        const categories = Object.keys(commandsByCategory);
        response += `📂 **Available Categories (${categories.length})**\n\n`;
        categories.forEach(cat => {
          const count = commandsByCategory[cat].length;
          response += `• ${cat} (${count} command${count !== 1 ? 's' : ''})\n`;
        });
        totalCommands = Object.values(commandsByCategory).flat().length;
      } else if (filteredCommands.length > 0) {
        // Group filtered commands by category
        const grouped = {};
        filteredCommands.forEach(cmd => {
          if (!grouped[cmd.category]) grouped[cmd.category] = [];
          grouped[cmd.category].push(cmd);
        });
        
        for (const [category, commandsList] of Object.entries(grouped)) {
          response += `**${category.toUpperCase()}** (${commandsList.length})\n`;
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
        totalCommands = filteredCommands.length;
      } else {
        response += `❌ No commands match your filter.\n`;
        response += `Try: $list category | $list permission admin | $list cooldown 10\n`;
        return response;
      }
      
    } else {
      // No filter - show all commands
      response += `📚 **All Available Commands**\n`;
      response += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      response += `👤 You are: ${userType}\n`;
      response += `💬 Chat: ${isGroup ? 'Group' : 'Private'}\n`;
      response += `🔤 Prefix: $\n\n`;
      
      for (const [category, commandsList] of Object.entries(commandsByCategory)) {
        response += `**${category.toUpperCase()}** (${commandsList.length})\n`;
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
        totalCommands += commandsList.length;
      }
    }
    
    // Add summary
    response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `📊 Total: ${totalCommands} command${totalCommands !== 1 ? 's' : ''}\n\n`;
    response += `🔍 **Filter Options:**\n`;
    response += `• \`$list category\` - Show all categories\n`;
    response += `• \`$list category utility\` - Show utility commands\n`;
    response += `• \`$list permission admin\` - Commands for admins\n`;
    response += `• \`$list cooldown 10\` - Commands with ≥10s cooldown\n`;
    response += `• \`$list chat group\` - Group-only commands\n`;
    response += `• \`$list name ping\` - Search by name/alias\n`;
    
    return response;
  },
  { 
    description: 'List all available commands with filters',
    aliases: ['ls', 'commands', 'cmds', 'show'],
    category: 'general',
    chatType: 'both',
    example: '$list | $list category utility | $list permission super-user',
    permissions: ['user', 'admin', 'super-user']
  }
);

export default listCommand;