import { createCommand, createHandlerContext } from './base-command.js';

const createCommandHandler = (getUserType) => {
  const commands = new Map();
  const aliases = new Map();
  const categories = new Map();
  
  const register = (command) => {
    commands.set(command.name, command);
    command.aliases.forEach(alias => aliases.set(alias, command.name));
    categories.set(command.name, command.category);
    console.log(`✅ Registered: ${command.name} (${command.category})`);
  };
  
  const unregister = (commandName) => {
    const command = commands.get(commandName);
    if (!command) return false;
    
    // Remove command
    commands.delete(commandName);
    
    // Remove aliases
    for (const [alias, name] of aliases.entries()) {
      if (name === commandName) {
        aliases.delete(alias);
      }
    }
    
    // Remove category tracking
    categories.delete(commandName);
    
    console.log(`🗑️ Unregistered: ${commandName}`);
    return true;
  };
  
  const clear = () => {
    const count = commands.size;
    commands.clear();
    aliases.clear();
    categories.clear();
    console.log(`🧹 Cleared all commands (${count} removed)`);
    return count;
  };
  
  const get = (name) => {
    const commandName = aliases.get(name) || name;
    return commands.get(commandName);
  };
  
  const execute = async (message, commandName, args) => {
    const command = get(commandName);
    if (!command) return null;
    
    try {
      const userType = await getUserType(message);
      
      // Create handler context for commands that need it
      const handler = createHandlerContext(commands, aliases, categories);
      
      // Add additional methods for reload functionality
      handler.unregister = (name) => unregister(name);
      handler.clear = () => clear();
      handler.register = (cmd) => register(cmd);
      
      // Execute command with handler context
      return await command.execute(message, args, userType, handler);
    } catch (error) {
      console.error(`Error executing ${commandName}:`, error);
      return error.message;
    }
  };
  
  return { 
    register, 
    get, 
    execute,
    unregister,
    clear
  };
};

export default createCommandHandler;