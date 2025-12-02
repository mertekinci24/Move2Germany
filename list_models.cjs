const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually to avoid dependencies
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim() : null;

if (!key) {
    console.error('Key not found in .env');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
            const models = JSON.parse(data);
            const names = models.models.map(m => m.name).join('\n');
            fs.writeFileSync('model_names.txt', names);
            console.log('Wrote model names to model_names.txt');
        } else {
            console.log('Error:', data);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
