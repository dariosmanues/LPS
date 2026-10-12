import { syncArmadaToTimbangQr } from '../src/lib/timbangqr-sync-service';

async function main() {
  console.log('Syncing Rintis armada (b720052c-4213-4bde-bc56-419be1d569ca) to TimbangQR...');
  const result = await syncArmadaToTimbangQr('b720052c-4213-4bde-bc56-419be1d569ca');
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
