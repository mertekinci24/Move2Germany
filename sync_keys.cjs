const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    console.log('Fetching Supabase status...');
    const statusJson = execSync('npx supabase status -o json', { encoding: 'utf-8' });
    const status = JSON.parse(statusJson);

    const anonKey = status.ANON_KEY;
    const apiUrl = status.API_URL;

    if (!anonKey || !apiUrl) {
        console.error('Failed to get keys from status output.');
        process.exit(1);
    }

    console.log('Found Anon Key:', anonKey.substring(0, 10) + '...');
    console.log('Found API URL:', apiUrl);

    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Update VITE_SUPABASE_URL
    envContent = envContent.replace(/VITE_SUPABASE_URL=.*/, `VITE_SUPABASE_URL=${apiUrl}`);

    // Update VITE_SUPABASE_ANON_KEY
    envContent = envContent.replace(/VITE_SUPABASE_ANON_KEY=.*/, `VITE_SUPABASE_ANON_KEY=${anonKey}`);

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file.');

    // Also update supabase/functions/.env
    const funcEnvPath = path.resolve(process.cwd(), 'supabase/functions/.env');
    if (fs.existsSync(funcEnvPath)) {
        fs.writeFileSync(funcEnvPath, envContent);
        console.log('✅ Updated supabase/functions/.env file.');
    }

} catch (error) {
    console.error('Error:', error.message);
}
