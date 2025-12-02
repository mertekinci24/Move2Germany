
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.");
    process.exit(1);
}

const supabase = createClient(url, key);

async function inspect() {
    console.log("Inspecting 'notes' table...");
    const { data, error } = await supabase.from('notes').select('*').limit(1);

    if (error) {
        console.error("Error selecting from notes:", error);
        // If error is column not found, it might show up here
    } else {
        console.log("Select success.");
        if (data && data.length > 0) {
            console.log("Columns found:", Object.keys(data[0]));
        } else {
            console.log("Table is empty. Attempting insert to check columns...");
            const { error: insertError } = await supabase.from('notes').insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                title: 'Test',
                content: 'Test',
                event_date: new Date().toISOString(),
                related_task_id: 'test-task'
            });

            if (insertError) {
                console.log("Insert failed:", insertError.message);
                console.log("Details:", insertError.details);
                console.log("Hint:", insertError.hint);
            } else {
                console.log("Insert success (unexpected for dummy data but columns exist).");
            }
        }
    }
}

inspect();
