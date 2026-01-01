import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createAutoReloader = (commandHandler, commandsPath) => {
  if (!fs.existsSync(commandsPath)) {
    console.log(`❌ Commands path not found: ${commandsPath}`);
    return null;
  }
  
  console.log(`👀 Setting up auto-reload for: ${commandsPath}`);
  
  // Track file modification times
  const fileModTimes = new Map();
  
  const watcher = chokidar.watch(commandsPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    depth: 1
  });
  
  const reloadSingleCommand = async (filePath) => {
    const fileName = path.basename(filePath);
    
    if (!fileName.endsWith('.js') || fileName.startsWith('_')) {
      return;
    }
    
    try {
      // Extract command name from filename
      const commandName = fileName.replace('.js', '');
      
      console.log(`🔄 Auto-reloading: ${fileName}`);
      
      // Clear module cache
      const cacheKey = require.resolve(filePath);
      if (require.cache[cacheKey]) {
        delete require.cache[cacheKey];
      }
      
      // Load new module (ES modules)
      const module = await import(`file://${filePath}`);
      const command = module.default || module;
      
      if (command && command.name) {
        // Unregister old command if exists
        if (commandHandler.unregister) {
          commandHandler.unregister(commandName);
        }
        
        // Register new command
        commandHandler.register(command, fileName);
        
        console.log(`✅ Auto-reloaded: ${command.name}`);
        return command.name;
      }
    } catch (error) {
      console.error(`❌ Auto-reload failed for ${fileName}:`, error.message);
    }
    
    return null;
  };
  
  // Watch for file changes
  watcher
    .on('add', async (filePath) => {
      console.log(`📄 New command file: ${path.basename(filePath)}`);
      await reloadSingleCommand(filePath);
    })
    .on('change', async (filePath) => {
      console.log(`✏️  Command file changed: ${path.basename(filePath)}`);
      await reloadSingleCommand(filePath);
    })
    .on('unlink', (filePath) => {
      const fileName = path.basename(filePath);
      const commandName = fileName.replace('.js', '');
      
      console.log(`🗑️  Command file removed: ${fileName}`);
      
      // Unregister command
      if (commandHandler.unregister) {
        commandHandler.unregister(commandName);
      }
    })
    .on('error', (error) => {
      console.error('❌ File watcher error:', error);
    });
  
  console.log('✅ Auto-reloader activated! Commands will reload automatically when modified.');
  
  return {
    stop: () => {
      watcher.close();
      console.log('🛑 Auto-reloader stopped');
    },
    status: () => {
      return {
        watching: commandsPath,
        active: true
      };
    }
  };
};

export { createAutoReloader };