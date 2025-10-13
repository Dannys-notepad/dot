// TODO
/*
  setup db firebase or sql(sequelize)
*/
import 'dotenv/config';
import log from './src/components/utils/log.js';
import MemoryMonitor from './src/components/utils/memoryMonitor.js';
import { initWhatsAppClient } from './src/interface/whatsapp/client.js';
//import { } from './src/components/utils/requirements.js';

const monitor = new MemoryMonitor({
  interval: 120000, // 2 minutes
  thresholdMB: parseInt(process.env.MEMORY_THRESHOLD_MB || '512', 10), // Default to 512 MB
});

async function main() {
  try {
    await Promise.all([monitor.start()]);
    log.info('Main', 'Starting Delvin... 🚀');
    await initWhatsAppClient();
  } catch (error) {
    log.error('Main', `Error: ${error.message}`);
  }
}

main();