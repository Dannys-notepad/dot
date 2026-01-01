import { createCommand } from '../components/cmd/base-command.js';

const adminCommand = createCommand('admin',
  async (message, args, userType) => {
    const [action, ...params] = args;
    
    if (action === 'list') {
      return `👑 You are: ${userType}\nAvailable to: ${userType === 'super-user' ? 'Manage everything' : 'Moderate groups'}`;
    }
    
    if (action === 'promote' && userType === 'super-user') {
      const target = params[0];
      if (!target) return 'Please mention someone to promote';
      return `✅ Promoted ${target} to admin`;
    }
    
    return 'Usage: $admin list | (super-user: $admin promote @user)';
  },
  { 
    description: 'Admin management commands',
    category: 'administration',
    chatType: 'both',
    example: '$admin list',
    permissions: ['admin', 'super-user'],
    cooldown: 5
  }
);

export default adminCommand;