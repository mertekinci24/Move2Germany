import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

console.log('GEMINI_API_KEY present:', !!GEMINI_API_KEY);
if (GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY prefix:', GEMINI_API_KEY.substring(0, 5));
    console.log('GEMINI_API_KEY suffix:', GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5));
    console.log('GEMINI_API_KEY length:', GEMINI_API_KEY.length);
    if (GEMINI_API_KEY.includes(' ')) console.log('WARNING: Key contains spaces!');
    if (GEMINI_API_KEY.includes('\n')) console.log('WARNING: Key contains newlines!');
}
