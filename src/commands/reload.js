import { createCommand } from '../components/cmd/base-command.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reloadSimpleCommand = createCommand('reload',
  async (message, args, userType, handler) => {
    try {
      // Try to find commands directory
      let commandsPath = null;
      
      // Method 1: Check common locations
      const locations = [
        path.join(process.cwd(), 'commands'),
        path.join(__dirname, '..'),
        path.join(__dirname, '../commands'),
        path.join(__dirname, '../../commands'),
        './commands',
        '../commands'
      ];
      
      for (const location of locations) {
        const resolved = path.resolve(location);
        if (fs.existsSync(resolved)) {
          const files = fs.readdirSync(resolved).filter(f => f.endsWith('.js'));
          if (files.length > 0) {
            commandsPath = resolved;
            break;
          }
        }
      }
      
      if (!commandsPath) {
        return `❌ Could not find commands directory!\n` +
               `Current directory: ${process.cwd()}\n` +
               `Checked: ${locations.join(', ')}`;
      }
      
      await message.reply(`🔄 Reloading commands from:\n${commandsPath}`);
      
      // Get all .js files
      const files = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js') && !file.startsWith('_'));
      
      if (files.length === 0) {
        return `❌ No .js files found in ${commandsPath}`;
      }
      
      // Clear existing commands if handler supports it
      let cleared = 0;
      if (handler.clear) {
        cleared = handler.clear();
      }
      
      // Load each command
      let loaded = 0;
      let errors = [];
      
      for (const file of files) {
        try {
          const fullPath = path.join(commandsPath, file);
          const module = await import(`file://${fullPath}`);
          const command = module.default || module;
          
          if (command && command.name && handler.register) {
            handler.register(command);
            loaded++;
          } else {
            errors.push(`${file}: Invalid command format`);
          }
        } catch (error) {
          errors.push(`${file}: ${error.message}`);
        }
      }
      
      // Build response
      let response = `✅ **Reload Complete**\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      response += `📁 Directory: ${commandsPath}\n`;
      response += `🗑️ Cleared: ${cleared} old commands\n`;
      response += `📦 Loaded: ${loaded} new commands\n`;
      response += `📋 Total files: ${files.length}\n`;
      
      if (errors.length > 0) {
        response += `❌ Errors: ${errors.length}\n\n`;
        response += `**Error list (first 5):**\n`;
        response += errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
          response += `\n... and ${errors.length - 5} more`;
        }
      }
      
      response += `\n\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      response += `ℹ️ Use \`$list\` to see reloaded commands`;
      
      return response;
      
    } catch (error) {
      console.error('Reload error:', error);
      return `❌ Reload failed: ${error.message}`;
    }
  },
  { 
    description: 'Simple command reload',
    aliases: ['refresh'],
    category: 'administration',
    chatType: 'private',
    example: '$reload',
    permissions: ['super-user'],
    cooldown: 30
  }
);

export default reloadSimpleCommand;