import { createCommand } from '../components/cmd/base-command.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reloadCommand = createCommand('reload',
  async (message, args, userType, handler) => {
    const sock = message.sock;
    
    // Get reload type (all, specific, or new)
    const [reloadType, ...targets] = args;
    
    try {
      // Path to commands directory
      const commandsPath = path.join(__dirname, '../../commands');
      
      if (!fs.existsSync(commandsPath)) {
        return '❌ Commands directory not found!';
      }
      
      let response = '🔄 **COMMAND RELOAD**\n━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      // Get current command files
      const currentFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js') && !file.startsWith('_'));
      
      // Get previously loaded commands (from global context or handler)
      let previousCount = 0;
      let previousCommands = [];
      
      // Try to get command handler stats
      try {
        // You might need to adjust this based on your handler implementation
        if (global.commandHandler && global.commandHandler.stats) {
          const stats = global.commandHandler.stats();
          previousCount = stats.total || 0;
          previousCommands = Object.keys(global.commandHandler._commands || {}).map(name => ({
            name,
            file: `${name}.js`
          }));
        }
      } catch (e) {
        // If we can't get stats, continue anyway
        console.log('Could not get previous command stats:', e.message);
      }
      
      response += `📁 Commands directory: ${commandsPath}\n`;
      response += `📋 Found ${currentFiles.length} command files\n\n`;
      
      // Handle different reload types
      if (reloadType === 'single' && targets.length > 0) {
        // Reload single command
        const commandName = targets[0];
        const fileName = `${commandName}.js`;
        
        if (!currentFiles.includes(fileName)) {
          return `❌ Command file "${fileName}" not found!`;
        }
        
        try {
          // Clear cache for specific file
          const fullPath = path.join(commandsPath, fileName);
          const cacheKey = require.resolve(fullPath);
          delete require.cache[cacheKey];
          
          // For ES modules, we need to handle differently
          const module = await import(`file://${fullPath}`);
          const command = module.default || module;
          
          if (command && command.name) {
            // Unregister old command
            if (global.commandHandler && global.commandHandler.unregister) {
              global.commandHandler.unregister(commandName);
            }
            
            // Register new command
            if (global.commandHandler && global.commandHandler.register) {
              global.commandHandler.register(command);
            }
            
            response += `✅ Reloaded command: ${command.name}\n`;
            response += `📝 Description: ${command.description || 'No description'}\n`;
            response += `📂 Category: ${command.category || 'general'}\n`;
            
            return response;
          } else {
            return `❌ Failed to load command from ${fileName}`;
          }
          
        } catch (error) {
          console.error(`Error reloading ${fileName}:`, error);
          return `❌ Error reloading ${commandName}: ${error.message}`;
        }
        
      } else if (reloadType === 'new') {
        // Only load new commands
        response += '🔍 **Looking for new commands...**\n\n';
        
        // This would require tracking previously loaded files
        // For now, we'll reload everything
        response += '⚠️ New-only reload not fully implemented. Reloading all commands instead.\n\n';
        
        // Fall through to full reload
      }
      
      // Full reload (default)
      response += '🔄 **Performing full command reload...**\n\n';
      
      // Clear all command cache
      for (const file of currentFiles) {
        const fullPath = path.join(commandsPath, file);
        try {
          // Clear from require cache if using CommonJS
          if (require.cache && require.cache[require.resolve(fullPath)]) {
            delete require.cache[require.resolve(fullPath)];
          }
        } catch (e) {
          // Ignore cache clearing errors for ES modules
        }
      }
      
      // Clear the command handler's internal maps
      if (global.commandHandler) {
        // You might need to add a clear() method to your handler
        if (global.commandHandler.clear) {
          global.commandHandler.clear();
        }
        
        // Re-register all commands
        let reloadedCount = 0;
        let failedCount = 0;
        const reloadResults = [];
        
        for (const file of currentFiles) {
          try {
            const module = await import(`file://${path.join(commandsPath, file)}`);
            const command = module.default || module;
            
            if (command && command.name) {
              if (global.commandHandler.register) {
                global.commandHandler.register(command);
                reloadedCount++;
                reloadResults.push(`✅ ${command.name}`);
              }
            } else {
              failedCount++;
              reloadResults.push(`❌ ${file} (Invalid command)`);
            }
          } catch (error) {
            failedCount++;
            reloadResults.push(`❌ ${file}: ${error.message}`);
          }
        }
        
        response += `📊 **Reload Results:**\n`;
        response += `✅ Successfully reloaded: ${reloadedCount}\n`;
        response += `❌ Failed: ${failedCount}\n\n`;
        
        // Show first 10 results
        response += reloadResults.slice(0, 10).join('\n');
        if (reloadResults.length > 10) {
          response += `\n... and ${reloadResults.length - 10} more`;
        }
        
      } else {
        response += '❌ Command handler not available globally!\n';
        response += '⚠️ Try restarting the bot instead.';
      }
      
      response += '\n\n━━━━━━━━━━━━━━━━━━━━━━\n';
      response += 'ℹ️ **Note:** Some commands may need bot restart if they have persistent state.';
      
      return response;
      
    } catch (error) {
      console.error('Reload error:', error);
      return `❌ Reload failed: ${error.message}\n\nTry restarting the bot instead.`;
    }
  },
  { 
    description: 'Reload commands dynamically (for development)',
    aliases: ['refresh', 'restartcmds', 'rc'],
    category: 'administration',
    chatType: 'private', // Should only be used in private
    example: '$reload | $reload single ping | $reload new',
    permissions: ['super-user'],
    cooldown: 30
  }
);

export default reloadCommand;