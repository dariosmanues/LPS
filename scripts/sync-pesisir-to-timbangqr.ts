import { syncArmadaToTimbangQr } from '../src/lib/timbangqr-sync-service';

async function main() {
  console.log('Syncing Pesisir armada (d2d722a7-dc61-426b-8bf5-01b9603eefd3) to TimbangQR...');
  const result = await syncArmadaToTimbangQr('d2d722a7-dc61-426b-8bf5-01b9603eefd3');
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
