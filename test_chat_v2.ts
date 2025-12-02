import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    try {
        console.log('🚀 Invoking function via Supabase Client...');
        const { data, error } = await supabase.functions.invoke('chat', {
            body: { query: 'Mavi Kart nedir?' }
        });

        if (error) {
            console.error('❌ Function Error:', error);
            if (error instanceof Error) {
                console.error('   Message:', error.message);
                console.error('   Stack:', error.stack);
            }
        } else {
            console.log('✅ Success!');
            console.log('Data:', data);
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

runTest();
