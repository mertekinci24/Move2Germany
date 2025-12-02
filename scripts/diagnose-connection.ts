import * as dns from 'dns';
import * as os from 'os';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
console.log(`📂 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

async function diagnose() {
    console.log('--- DIAGNOSIS START ---');

    // 1. Node.js Version
    console.log(`Node.js Version: ${process.version}`);
    console.log(`OS Platform: ${os.platform()}`);
    console.log(`OS Release: ${os.release()}`);

    // 2. Supabase URL
    console.log(`Supabase URL: ${SUPABASE_URL}`);

    if (!SUPABASE_URL) {
        console.error('❌ VITE_SUPABASE_URL is missing in .env');
        return;
    }

    // Extract hostname
    let hostname = '';
    try {
        const url = new URL(SUPABASE_URL);
        hostname = url.hostname;
        console.log(`Target Hostname: ${hostname}`);
    } catch (e) {
        console.error('❌ Invalid Supabase URL format');
        return;
    }

    // 3. DNS Lookup
    console.log(`\n--- DNS LOOKUP (${hostname}) ---`);
    try {
        const addresses = await dns.promises.lookup(hostname, { all: true });
        console.log('Resolved Addresses:', JSON.stringify(addresses, null, 2));

        const ipv4 = addresses.find(a => a.family === 4);
        const ipv6 = addresses.find(a => a.family === 6);

        if (ipv4) console.log(`✅ IPv4 found: ${ipv4.address}`);
        else console.warn('⚠️ No IPv4 address found');

        if (ipv6) console.log(`ℹ️ IPv6 found: ${ipv6.address}`);

    } catch (e: any) {
        console.error('❌ DNS Lookup Failed:', e.message);
        console.error('Full Error:', e);
    }

    // 4. Fetch Test
    console.log(`\n--- FETCH TEST (${SUPABASE_URL}) ---`);
    try {
        const startTime = performance.now();
        // Attempt to fetch the root or a health endpoint if known, otherwise just the base URL
        // Supabase usually returns a 404 or JSON on root, but connection success is what matters.
        const response = await fetch(SUPABASE_URL, {
            method: 'GET',
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY || ''
            }
        });
        const endTime = performance.now();

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Time: ${(endTime - startTime).toFixed(2)}ms`);

        const text = await response.text();
        console.log(`Response Preview: ${text.substring(0, 200)}...`);

        if (response.ok || response.status === 404) {
            console.log('✅ Connection Successful (HTTP layer reached)');
        } else {
            console.warn('⚠️ Connection made but returned error status');
        }

    } catch (error: any) {
        console.error('❌ FETCH FAILED');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.cause) {
            console.error('Error Cause:', error.cause);
        }
        if ((error as any).code) {
            console.error('Error Code:', (error as any).code);
        }
        console.error('Full Error Object:', error);
    }

    console.log('\n--- DIAGNOSIS END ---');
}

diagnose();
