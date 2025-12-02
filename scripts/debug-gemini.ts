import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
console.log(`📂 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

console.log(`Key loaded: ${GEMINI_API_KEY ? 'YES' : 'NO'}`);
if (GEMINI_API_KEY) {
    console.log(`Key prefix: ${GEMINI_API_KEY.substring(0, 5)}...`);
    console.log(`Key length: ${GEMINI_API_KEY.length}`);
}

async function testKey() {
    if (!GEMINI_API_KEY) {
        console.error('❌ No API Key found');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        console.log('Testing embedding...');
        const result = await model.embedContent("Hello world");
        console.log('✅ Embedding success!');
        console.log('Vector length:', result.embedding.values.length);
    } catch (error: any) {
        console.error('❌ API Call Failed:');
        console.error(error.message);
    }
}

testKey();
