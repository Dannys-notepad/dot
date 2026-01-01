import { createCommand } from '../components/cmd/base-command.js';

const pingCommand = createCommand('ping', 
  async (message) => {
    const start = Date.now();
    const reply = await message.reply('🏓 Pinging...');
    const latency = Date.now() - start;
    return `Pong! Latency: ${latency}ms`;
  },
  { 
    description: 'Check bot response time',
    aliases: ['p', 'latency'],
    category: 'utility',
    chatType: 'both',
    example: '$ping',
    permissions: ['user', 'admin', 'super-user']
  }
);

export default pingCommand;