import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for group admins
const adminCache = new Map();

const createUserPermissionChecker = (sock) => {
  // Default: host account is super-user
  let hostAccount = '';
  
  // List of additional admins (can be loaded from file)
  let additionalAdmins = [];
  
  // Try to load saved admins
  try {
    const adminsPath = path.join(__dirname, 'admins.json');
    if (fs.existsSync(adminsPath)) {
      const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
      additionalAdmins = Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.log('No saved admin list, starting fresh');
  }
  
  // Set host account (bot's own number)
  const setHostAccount = (jid) => {
    // Clean the JID format
    hostAccount = jid.includes(':') ? jid.split(':')[0] : jid;
    console.log(`🤖 Bot running as: ${hostAccount}`);
  };
  
  // Check if user is group admin 
  const isGroupAdmin = async (groupId, userId) => {
    try {
      // Check cache first
      const cacheKey = `${groupId}-${userId}`;
      if (adminCache.has(cacheKey)) {
        return adminCache.get(cacheKey);
      }
      
      // Get group metadata
      const metadata = await sock.groupMetadata(groupId);
      const participant = metadata.participants.find(p => p.id === userId);
      
      const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
      
      // Cache for 5 minutes
      adminCache.set(cacheKey, isAdmin);
      setTimeout(() => adminCache.delete(cacheKey), 5 * 60 * 1000);
      
      return isAdmin;
    } catch (error) {
      console.error('Error checking group admin:', error.message);
      return false;
    }
  };
  
  // Determine user type for a message
  const getUserType = async (message) => {
    const senderId = message.senderId || '';
    
    console.log(`🔍 Checking permissions for: ${senderId}`);
    console.log(`🔍 Host account is: ${hostAccount}`);
    
    // 1. Check if message is from self (bot account)
    if (message.fromMe) {
      console.log(`✅ FromMe detected -> super-user`);
      return 'super-user';
    }
    
    // 2. Check if host account (super-user) - direct match
    if (senderId === hostAccount) {
      console.log(`✅ Host account match -> super-user`);
      return 'super-user';
    }
    
    // 3. Clean and compare JIDs (remove any device/session info)
    const cleanSenderId = senderId.includes(':') ? senderId.split(':')[0] : senderId;
    const cleanHostAccount = hostAccount.includes(':') ? hostAccount.split(':')[0] : hostAccount;
    
    if (cleanSenderId === cleanHostAccount) {
      console.log(`✅ Clean JID match -> super-user`);
      return 'super-user';
    }
    
    // 4. Check if in additional admins list
    if (additionalAdmins.includes(senderId) || additionalAdmins.includes(cleanSenderId)) {
      console.log(`✅ In admin list -> admin`);
      return 'admin';
    }
    
    // 5. Check if group admin (only if in a group)
    if (message.chatId && message.chatId.endsWith('@g.us')) {
      const isAdmin = await isGroupAdmin(message.chatId, senderId);
      if (isAdmin) {
        console.log(`✅ Group admin detected -> admin`);
        return 'admin';
      }
    }
    
    // 6. Default to user
    console.log(`➡️ Defaulting to user`);
    return 'user';
  };
  
  // Add admin manually
  const addAdmin = (jid) => {
    if (!additionalAdmins.includes(jid)) {
      additionalAdmins.push(jid);
      
      // Save to file
      try {
        const adminsPath = path.join(__dirname, 'admins.json');
        fs.writeFileSync(adminsPath, JSON.stringify(additionalAdmins, null, 2));
        console.log(`✅ Added admin: ${jid}`);
      } catch (error) {
        console.error('Failed to save admin list:', error);
      }
    }
    return additionalAdmins;
  };
  
  // Remove admin
  const removeAdmin = (jid) => {
    const index = additionalAdmins.indexOf(jid);
    if (index > -1) {
      additionalAdmins.splice(index, 1);
      
      try {
        const adminsPath = path.join(__dirname, 'admins.json');
        fs.writeFileSync(adminsPath, JSON.stringify(additionalAdmins, null, 2));
        console.log(`❌ Removed admin: ${jid}`);
      } catch (error) {
        console.error('Failed to save admin list:', error);
      }
    }
    return additionalAdmins;
  };
  
  // List all admins
  const listAdmins = () => {
    return {
      'super-user': hostAccount ? [hostAccount] : [],
      'admins': [...additionalAdmins]
    };
  };
  
  return {
    setHostAccount,
    getUserType,
    addAdmin,
    removeAdmin,
    listAdmins
  };
};

export default createUserPermissionChecker;