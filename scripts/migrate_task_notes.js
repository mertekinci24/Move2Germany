
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
    console.error("Error: VITE_SUPABASE_URL not set.");
    process.exit(1);
}

if (!serviceRoleKey && !anonKey) {
    console.error("Error: Neither SUPABASE_SERVICE_ROLE_KEY nor VITE_SUPABASE_ANON_KEY set.");
    process.exit(1);
}

// Prefer Service Role Key for migration to bypass RLS
const key = serviceRoleKey || anonKey;

if (!serviceRoleKey) {
    console.warn("WARNING: Running with ANON KEY. RLS may prevent seeing tasks. Please set SUPABASE_SERVICE_ROLE_KEY in .env for full access.");
} else {
    console.log("Running with SERVICE ROLE KEY (RLS Bypassed).");
}

const supabase = createClient(url, key);

async function migrate() {
    console.log("Starting migration of task notes to 'notes' table...");

    // 1. Fetch user_tasks with notes
    const { data: tasks, error: fetchError } = await supabase
        .from('user_tasks')
        .select('id, user_id, notes, created_at')
        .neq('notes', '')
        .not('notes', 'is', null);

    if (fetchError) {
        console.error("Error fetching tasks:", fetchError);
        return;
    }

    console.log(`Found ${tasks.length} tasks with notes.`);

    let successCount = 0;
    let failCount = 0;

    for (const task of tasks) {
        // 2. Insert into notes table
        const { error: insertError } = await supabase
            .from('notes')
            .insert({
                user_id: task.user_id,
                title: 'Task Note',
                content: task.notes,
                related_task_id: task.id,
                created_at: task.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error(`Failed to migrate note for task ${task.id}:`, insertError.message);
            failCount++;
        } else {
            successCount++;
        }
    }

    console.log(`Migration complete. Success: ${successCount}, Failed: ${failCount}`);

    if (successCount > 0) {
        console.log("Note: Original notes in 'user_tasks' were NOT deleted. You may want to clear them manually after verification.");
    }
}

migrate();
