import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createCommand = (name, executeFn, options = {}) => {
  let cooldowns = new Map();
  
  const defaults = {
    aliases: [],
    cooldown: 0,
    description: '',
    permissions: ['user'],
    category: 'general',
    chatType: 'both', // 'both', 'group', 'private'
    example: '', // Example usage
  };
  
  const config = { ...defaults, ...options };
  
  const checkCooldown = (userId) => {
    if (config.cooldown <= 0) return true;
    const userCooldown = cooldowns.get(userId);
    if (!userCooldown) return true;
    return Date.now() - userCooldown > config.cooldown * 1000;
  };
  
  const setCooldown = (userId) => {
    if (config.cooldown > 0) {
      cooldowns.set(userId, Date.now());
      setTimeout(() => cooldowns.delete(userId), config.cooldown * 1000);
    }
  };
  
  const checkChatType = (chatId) => {
    if (config.chatType === 'both') return true;
    
    const isGroup = chatId.endsWith('@g.us');
    
    if (config.chatType === 'group') return isGroup;
    if (config.chatType === 'private') return !isGroup;
    
    return true;
  };
  
  // Updated execute function to accept handler as 4th parameter
  const execute = async (message, args, userType, handler) => {
    // Check permissions
    if (!config.permissions.includes(userType)) {
      throw new Error(`🚫 Requires: ${config.permissions.join(' or ')} (you are: ${userType})`);
    }
    
    // Check chat type
    if (!checkChatType(message.chatId)) {
      const allowedIn = config.chatType === 'both' ? 'groups and private chats' : 
                       config.chatType === 'group' ? 'groups only' : 'private chats only';
      throw new Error(`⚠️ This command works in ${allowedIn}`);
    }
    
    // Check cooldown
    if (!checkCooldown(message.senderId)) {
      const remaining = Math.ceil((cooldowns.get(message.senderId) + (config.cooldown * 1000) - Date.now()) / 1000);
      throw new Error(`⏳ Wait ${remaining}s before using again`);
    }
    
    setCooldown(message.senderId);
    
    // Pass the handler to the command if provided
    // This allows commands like 'help' to access other commands
    return await executeFn(message, args, userType, handler);
  };
  
  return Object.freeze({ 
    name, 
    aliases: config.aliases,
    description: config.description,
    cooldown: config.cooldown,
    permissions: config.permissions,
    category: config.category,
    chatType: config.chatType,
    example: config.example,
    execute,
  });
};

// Helper to load all commands and organize by category
const loadCommandsByCategory = async (commandsPath) => {
  const categories = {};
  
  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      try {
        const module = await import(`file://${path.join(commandsPath, file)}`);
        const command = module.default || module;
        
        if (command && command.name) {
          if (!categories[command.category]) {
            categories[command.category] = [];
          }
          categories[command.category].push(command);
        }
      } catch (error) {
        console.error(`Failed to load ${file}:`, error.message);
      }
    }
  }
  
  return categories;
};

// Helper function to create handler context for commands
const createHandlerContext = (commands, aliases, categories) => {
  return {
    get: (name) => {
      const commandName = aliases.get(name) || name;
      return commands.get(commandName);
    },
    
    listForUser: async (userType, chatType = 'both') => {
      const result = {};
      
      for (const [name, command] of commands) {
        // Check permissions
        if (!command.permissions.includes(userType)) continue;
        
        // Check chat type compatibility
        if (command.chatType !== 'both' && command.chatType !== chatType) continue;
        
        // Group by category
        const category = categories.get(name) || 'general';
        if (!result[category]) {
          result[category] = [];
        }
        
        result[category].push({
          name: command.name,
          description: command.description,
          aliases: command.aliases,
          cooldown: command.cooldown,
          example: command.example,
          chatType: command.chatType,
          permissions: command.permissions
        });
      }
      
      return result;
    },
    
    getCategories: () => {
      const uniqueCategories = new Set();
      categories.forEach(cat => uniqueCategories.add(cat));
      return Array.from(uniqueCategories);
    },
    
    getCommandsByCategory: (category) => {
      const result = [];
      for (const [name, command] of commands) {
        if ((categories.get(name) || 'general') === category) {
          result.push(command);
        }
      }
      return result;
    },
    
    stats: () => {
      const statsByCategory = {};
      const commandList = [];
      
      categories.forEach((category, name) => {
        statsByCategory[category] = (statsByCategory[category] || 0) + 1;
        const command = commands.get(name);
        if (command) {
          commandList.push({
            name,
            category,
            permissions: command.permissions,
            chatType: command.chatType
          });
        }
      });
      
      return {
        total: commands.size,
        byCategory: statsByCategory,
        commands: commandList,
        categories: Array.from(new Set(categories.values()))
      };
    }
  };
};

export { createCommand, loadCommandsByCategory, createHandlerContext };