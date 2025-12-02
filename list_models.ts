import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('No API key found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
    try {
        // This is a bit of a hack as the SDK doesn't expose listModels directly on the main class in all versions
        // But we can try to use the model manager if available, or just try to get a model and see if it works.
        // Actually, let's just try to embed with a few known models and see which one doesn't error.

        const models = ['text-embedding-004', 'embedding-001', 'models/text-embedding-004', 'models/embedding-001'];

        console.log('Testing embedding models...');

        for (const modelName of models) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.embedContent("Hello world");
                console.log(`✅ ${modelName} WORKED!`);
                console.log('Embedding length:', result.embedding.values.length);
                return; // Found one!
            } catch (e: any) {
                console.log(`❌ ${modelName} failed:`, e.message);
            }
        }

        console.log('No working embedding model found.');

    } catch (e) {
        console.error('Error:', e);
    }
}

listModels();
