import { createCommand } from '../components/cmd/base-command.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const debugPathsCommand = createCommand('debugpaths',
  async (message, args, userType) => {
    let response = `🔍 **PATH DEBUG INFORMATION**\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Basic path info
    response += `**Current File Info:**\n`;
    response += `• __filename: ${__filename}\n`;
    response += `• __dirname: ${__dirname}\n`;
    response += `• process.cwd(): ${process.cwd()}\n\n`;
    
    // Check common command paths
    response += `**Checking Command Paths:**\n`;
    
    const pathsToCheck = [
      { name: 'Current dir', path: __dirname },
      { name: 'Parent dir', path: path.join(__dirname, '..') },
      { name: 'Grandparent dir', path: path.join(__dirname, '../..') },
      { name: 'CWD/commands', path: path.join(process.cwd(), 'commands') },
      { name: 'CWD/src/commands', path: path.join(process.cwd(), 'src/commands') },
      { name: './commands', path: './commands' },
      { name: '../commands', path: '../commands' }
    ];
    
    for (const item of pathsToCheck) {
      try {
        const resolved = path.resolve(item.path);
        const exists = fs.existsSync(resolved) ? '✅' : '❌';
        let details = '';
        
        if (fs.existsSync(resolved)) {
          const isDir = fs.statSync(resolved).isDirectory();
          const files = isDir ? fs.readdirSync(resolved) : ['Not a directory'];
          const jsFiles = files.filter(f => f.endsWith('.js'));
          details = ` (${isDir ? 'Dir' : 'File'}, ${files.length} items, ${jsFiles.length} .js)`;
        }
        
        response += `${exists} ${item.name}: ${resolved}${details}\n`;
      } catch (error) {
        response += `❌ ${item.name}: ${error.message}\n`;
      }
    }
    
    // List files in current directory
    response += `\n**Files in current directory (${__dirname}):**\n`;
    try {
      const currentFiles = fs.readdirSync(__dirname);
      response += currentFiles.slice(0, 10).join(', ');
      if (currentFiles.length > 10) {
        response += `\n... and ${currentFiles.length - 10} more`;
      }
    } catch (error) {
      response += `Error: ${error.message}`;
    }
    
    response += `\n\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `ℹ️ Use this info to fix path issues in commands`;
    
    return response;
  },
  { 
    description: 'Debug path resolution issues',
    aliases: ['paths', 'debugdir'],
    category: 'debug',
    chatType: 'private',
    example: '$debugpaths',
    permissions: ['super-user']
  }
);

export default debugPathsCommand;