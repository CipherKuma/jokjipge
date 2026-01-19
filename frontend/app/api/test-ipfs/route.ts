import { NextResponse } from 'next/server';
import { pinJSONToIPFS } from '@/lib/web3/pinata';

const IPFS_FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test data
  const testData = {
    title: 'Test Job',
    description: 'Testing Pinata upload and gateway fetch',
    category: 'development',
    testTimestamp: Date.now(),
  };

  // Step 1: Upload to Pinata
  console.log('[test-ipfs] Step 1: Uploading to Pinata...');
  let ipfsHash: string;
  try {
    const uploadResult = await pinJSONToIPFS(testData, {
      pinataMetadata: { name: `test-${Date.now()}` },
      pinataOptions: { cidVersion: 1 },
    });
    ipfsHash = uploadResult.IpfsHash;
    results.tests = {
      ...results.tests as object,
      upload: {
        success: true,
        ipfsHash,
        pinSize: uploadResult.PinSize,
      },
    };
    console.log('[test-ipfs] Upload success:', ipfsHash);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.tests = {
      ...results.tests as object,
      upload: { success: false, error: errorMsg },
    };
    console.error('[test-ipfs] Upload failed:', errorMsg);
    return NextResponse.json(results, { status: 500 });
  }

  // Step 2: Test fetching via different gateways
  const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  const pinataGatewayKey = process.env.PINATA_GATEWAY_KEY;
  const gateways: { name: string; url: string }[] = [];

  if (pinataGateway) {
    const normalized = pinataGateway.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    let dedicatedUrl = `https://${normalized}/ipfs/${ipfsHash}`;
    if (pinataGatewayKey) {
      dedicatedUrl += `?pinataGatewayToken=${pinataGatewayKey}`;
    }
    gateways.push({
      name: pinataGatewayKey ? 'Pinata Dedicated (with server key)' : 'Pinata Dedicated',
      url: dedicatedUrl,
    });
  }

  gateways.push(
    { name: 'dweb.link', url: `https://dweb.link/ipfs/${ipfsHash}` },
    { name: 'Cloudflare', url: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}` },
    { name: 'Pinata Public', url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}` },
    { name: 'ipfs.io', url: `https://ipfs.io/ipfs/${ipfsHash}` }
  );

  console.log('[test-ipfs] Step 2: Testing gateways...');
  const gatewayResults: Record<string, unknown>[] = [];

  for (const gateway of gateways) {
    const start = Date.now();
    try {
      const logUrl = gateway.url.split('?')[0];
      console.log(`[test-ipfs] Testing ${gateway.name}: ${logUrl}`);
      const response = await fetchWithTimeout(gateway.url, IPFS_FETCH_TIMEOUT);
      const elapsed = Date.now() - start;
      const safeUrl = gateway.url.split('?')[0];

      if (response.ok) {
        const data = await response.json();
        const matches = JSON.stringify(data) === JSON.stringify(testData);
        gatewayResults.push({
          name: gateway.name,
          url: safeUrl,
          success: true,
          timeMs: elapsed,
          dataMatches: matches,
        });
        console.log(`[test-ipfs] ${gateway.name}: OK (${elapsed}ms)`);
      } else {
        gatewayResults.push({
          name: gateway.name,
          url: safeUrl,
          success: false,
          timeMs: elapsed,
          error: `HTTP ${response.status}`,
        });
        console.log(`[test-ipfs] ${gateway.name}: HTTP ${response.status} (${elapsed}ms)`);
      }
    } catch (error) {
      const elapsed = Date.now() - start;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const safeUrl = gateway.url.split('?')[0];
      gatewayResults.push({
        name: gateway.name,
        url: safeUrl,
        success: false,
        timeMs: elapsed,
        error: errorMsg.includes('abort') ? 'Timeout' : errorMsg,
      });
      console.log(`[test-ipfs] ${gateway.name}: Failed (${elapsed}ms) - ${errorMsg}`);
    }
  }

  results.tests = {
    ...results.tests as object,
    gateways: gatewayResults,
  };

  const successfulGateways = gatewayResults.filter((g) => g.success);
  results.summary = {
    uploadSuccess: true,
    gatewaysTested: gatewayResults.length,
    gatewaysSucceeded: successfulGateways.length,
    fastestGateway: successfulGateways.length > 0
      ? successfulGateways.sort((a, b) => (a.timeMs as number) - (b.timeMs as number))[0]
      : null,
    pinataGatewayConfigured: !!pinataGateway,
  };

  console.log('[test-ipfs] Complete:', results.summary);
  return NextResponse.json(results);
}
