// TODO
/*
  setup db firebase or sql(sequelize)
*/

import 'dotenv/config';
import BOT from './src/config/constants.js';
import log from './src/components/utils/log.js';
//import MemoryMonitor from './src/components/utils/memoryMonitor.js';
import { initWhatsAppClient } from './src/interface/whatsapp/client.js';
import requirementCheck from './src/components/utils/requirements.js';

/*const monitor = new MemoryMonitor({
  interval: 120000, // 2 minutes
  thresholdMB: parseInt(process.env.MEMORY_THRESHOLD_MB || '512', 10), // Default to 512 MB
});*/

async function main() {
  try {
    await requirementCheck();
    //await Promise.all([monitor.start()]);
    log.info('Main', `Starting ${BOT.ALIAS}... 🚀`);
    await initWhatsAppClient();
  } catch (error) {
    log.error('Main', `Error: ${error.message}`);
  }
}


// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info('Main', '🛑 Shutting down bot...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  log.info('Main', '🛑 Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

main();