import semver from 'semver';
import log from './log.js'
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

async function hasInternetConnection() {
  try {
    await dnsLookup('google.com');
    log.info('Internet', 'active internet connection found')
  } catch (error) {
    log.warn('internet', 'Internet connection not found, the bot will function')
  }
}

async function checkNodeVersion() {
  const current = process.versions.node;
  const required = ">=18.0.0";
  if (!semver.satisfies(current, required)) {
    log.warn("Node", `Node.js ${required} required, found ${current}`);
  } else {
    log.info("Node", `Node.js ${current}`);
  }
}


async function requirementCheck(){
  log.info('Startup', 'Requirement check...')
  await hasInternetConnection()
  await checkNodeVersion()
  log.info('Startup', 'Requirement check done, starting bot...')
}

export default requirementCheck