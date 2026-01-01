import { createCommand } from '../components/cmd/base-command.js';
import os from 'os';

const statusCommand = createCommand('status',
  async (message, args, userType) => {
    const sock = message.sock;
    
    // Collect various status information
    let statusInfo = '';
    
    try {
      // Bot connection status
      const chats = sock.chats ? sock.chats.all() : [];
      const groups = chats.filter(c => c.id.endsWith('@g.us'));
      const contacts = chats.filter(c => !c.id.endsWith('@g.us') && !c.id.includes('broadcast'));
      
      // System information
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      
      // Memory usage
      const usedMemory = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(1);
      
      // Build status report
      statusInfo = `
🤖 **BOT STATUS REPORT**
━━━━━━━━━━━━━━━━━━━━━━

📡 **Connection Status:** ${sock.user ? '✅ Connected' : '❌ Disconnected'}
👤 **Logged in as:** ${sock.user?.id || 'Unknown'}
📊 **Chats Loaded:** ${chats.length}
👥 **Groups:** ${groups.length}
📇 **Contacts:** ${contacts.length}

⏱️ **Bot Uptime:** ${uptimeStr}
📅 **Server Time:** ${new Date().toLocaleString()}

💾 **Memory Usage:**
  • Total: ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB
  • Used: ${((totalMemory - freeMemory) / 1024 / 1024 / 1024).toFixed(2)} GB
  • Free: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB
  • Usage: ${memoryUsagePercent}%

🖥️ **System Info:**
  • Platform: ${os.platform()} ${os.arch()}
  • CPU: ${os.cpus()[0]?.model || 'Unknown'}
  • CPU Cores: ${os.cpus().length}
  • Load Avg: ${os.loadavg().map(l => l.toFixed(2)).join(', ')}

🔧 **Process Info:**
  • Node.js: ${process.version}
  • PID: ${process.pid}
  • Heap Used: ${(usedMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
  • RSS: ${(usedMemory.rss / 1024 / 1024).toFixed(2)} MB

━━━━━━━━━━━━━━━━━━━━━━
👑 **Access Level:** ${userType}
      `.trim();
      
      // Add warning if memory usage is high
      if (parseFloat(memoryUsagePercent) > 80) {
        statusInfo += '\n\n⚠️ **Warning:** High memory usage detected!';
      }
      
      return statusInfo;
      
    } catch (error) {
      console.error('Status error:', error);
      return `❌ Error generating status report: ${error.message}`;
    }
  },
  { 
    description: 'Show bot status and system information',
    aliases: ['stats', 'botinfo', 'health'],
    category: 'utility',
    chatType: 'both',
    example: '$status',
    permissions: ['super-user'],
    cooldown: 10
  }
);

export default statusCommand;