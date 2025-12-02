import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 1. .env Dosyasını Zorla Oku
const envPath = path.resolve(process.cwd(), '.env');
console.log(`📂 .env dosyası okunuyor: ${envPath}`);
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
    console.error('❌ .env dosyası okunamadı:', envConfig.error);
}

// 2. Değişkenleri Al
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Service Role Key yoksa Anon Key'i fallback olarak kullanma, RLS hatası verir.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY_RAW = process.env.GEMINI_API_KEY;
const VITE_GEMINI_API_KEY_RAW = process.env.VITE_GEMINI_API_KEY;

console.log(`DEBUG: GEMINI_API_KEY_RAW length: ${GEMINI_API_KEY_RAW?.length}`);
console.log(`DEBUG: VITE_GEMINI_API_KEY_RAW length: ${VITE_GEMINI_API_KEY_RAW?.length}`);

let GEMINI_API_KEY = GEMINI_API_KEY_RAW;
if (GEMINI_API_KEY && GEMINI_API_KEY.length > 40) {
    console.warn('⚠️ GEMINI_API_KEY seems too long. Checking VITE_GEMINI_API_KEY...');
    if (VITE_GEMINI_API_KEY_RAW && VITE_GEMINI_API_KEY_RAW.length === 39) {
        GEMINI_API_KEY = VITE_GEMINI_API_KEY_RAW;
        console.log('✅ Switched to VITE_GEMINI_API_KEY (Length: 39)');
    } else {
        // Try to clean it up if it looks like a duplicate (e.g. key,key)
        if (GEMINI_API_KEY.includes(',')) {
            GEMINI_API_KEY = GEMINI_API_KEY.split(',')[0];
            console.log(`✅ Fixed comma-separated key. New length: ${GEMINI_API_KEY.length}`);
        } else {
            // Maybe it's just the first 39 chars?
            GEMINI_API_KEY = GEMINI_API_KEY.substring(0, 39);
            console.log(`⚠️ Truncated key to 39 chars. New length: ${GEMINI_API_KEY.length}`);
        }
    }
} else if (!GEMINI_API_KEY && VITE_GEMINI_API_KEY_RAW) {
    GEMINI_API_KEY = VITE_GEMINI_API_KEY_RAW;
}

// 3. Debug Logları (Değerleri gizleyerek göster)
console.log('🔍 Ortam Değişkenleri Kontrolü:');
console.log(`   - URL: ${SUPABASE_URL ? '✅ Yüklü' : '❌ Eksik'}`);
console.log(`   - SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Yüklü (' + SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '...)' : '❌ Eksik'}`);
console.log(`   - GEMINI_API_KEY: ${GEMINI_API_KEY ? '✅ Yüklü (' + (GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 5) : 'NONE') + '...)' : '❌ Eksik'}`);

// 4. Eksiklik Kontrolü
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
    console.error('❌ HATA: Kritik değişkenler eksik. İşlem durduruluyor.');
    process.exit(1);
}

// 5. İstemcileri Başlat (Yönetici Yetkisiyle)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Switching back to text-embedding-004 as it is confirmed to work in list_models.ts
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
// Switching to gemini-1.5-flash now that key is fixed (gemini-2.0 might be restricted)
const generationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateEmbedding(text: string, retries = 3): Promise<number[] | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (e: any) {
            console.error(`   ⚠️ Embedding hatası (Deneme ${i + 1}/${retries}):`, JSON.stringify(e, null, 2));
            if (e.status === 429 || e.message?.includes('429')) {
                console.log('   ⏳ Rate limit (429). 20 saniye bekleniyor...');
                await new Promise(resolve => setTimeout(resolve, 20000));
            } else {
                // Diğer hatalar için de kısa bir bekleme
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    console.error("   ❌ Embedding başarısız oldu (Tüm denemeler tükendi).");
    return null;
}

async function generateQuestions(text: string, retries = 3): Promise<string[]> {
    const prompt = `
    Analyze the following text chunk and generate 3-5 specific questions that this text answers.
    Return ONLY a raw JSON array of strings, e.g. ["Question 1?", "Question 2?"].
    Do not include markdown formatting.
    Text: "${text.substring(0, 1000)}..."
    `;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await generationModel.generateContent(prompt);
            const textResponse = result.response.text();
            const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error: any) {
            console.error(`   ⚠️ Soru üretme hatası (Deneme ${i + 1}/${retries}):`, error.message);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return [];
}

async function ingestDocuments() {
    console.log("🚀 Ingestion Başlatılıyor...");

    // Dosya Bulma
    const possiblePaths = [
        path.join(process.cwd(), 'Move2Germany_Arastırma_Tasarım_Briefi.md'),
        path.join(process.cwd(), 'docs', 'briefs', 'Move2Germany_Arastırma_Tasarım_Briefi.md'),
    ];

    let filePath = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            filePath = p;
            break;
        }
    }

    if (!filePath) {
        console.error('❌ Dosya bulunamadı.');
        process.exit(1);
    }
    console.log(`✅ Kaynak Dosya: ${filePath}`);

    // Tablo Temizliği
    console.log('🧹 Tablo temizleniyor...');
    const { error: delError } = await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) console.error('   ⚠️ Silme hatası:', delError.message);
    else console.log('   - Tablo temizlendi.');

    // Dosya İşleme
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const content = rawContent.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');

    // Strateji B: Numaralı Başlıklar
    const regexNumbered = /(?=^\d+\.\s)/gm;
    let sections = content.split(regexNumbered);

    // Boşları temizle
    sections = sections.map(s => s.trim()).filter(s => s.length > 50);

    console.log(`📄 Toplam Bölüm: ${sections.length}`);

    for (let i = 0; i < sections.length; i++) {
        const sectionText = sections[i];
        const firstLine = sectionText.split('\n')[0];
        const title = firstLine.substring(0, 100).replace(/[#*]/g, '').trim();

        console.log(`Processing [${i + 1}/${sections.length}]: ${title.substring(0, 40)}...`);

        try {
            // Sorular için de basit bir bekleme ekleyelim
            console.log('   - Generating questions... (SKIPPED)');
            // const questions = await generateQuestions(sectionText);
            const questions: string[] = [];

            // Embedding için retry logic'li fonksiyonu kullan
            console.log('   - Generating embedding...');
            console.log(`   - Key used for embedding: ${GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 5) + '...' : 'UNDEFINED'} (Length: ${GEMINI_API_KEY ? GEMINI_API_KEY.length : 0})`);
            const embedding = await generateEmbedding(sectionText);

            if (embedding) {
                const { error } = await supabase.from('documents').insert({
                    content: sectionText,
                    metadata: { title, source: 'Brief' },
                    embedding,
                    generated_questions: questions,
                    storage_key: `brief/${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`, // Dummy key to satisfy constraint
                    file_name: 'Move2Germany_Arastırma_Tasarım_Briefi.md', // Dummy file name to satisfy constraint
                    mime_type: 'text/markdown', // Dummy mime type to satisfy constraint
                    size: sectionText.length // Dummy size to satisfy constraint
                });
                if (error) console.error('   ❌ DB Kayıt Hatası:', error.message);
                else console.log(`   ✅ OK (${questions.length} soru)`);
            } else {
                console.error('   ❌ Embedding alınamadığı için kayıt atlandı.');
            }
        } catch (err) {
            console.error(`   ❌ Hata:`, err);
        }

        // Rate Limit (Bekleme) - 20 saniye
        console.log('   ⏳ Bekleniyor (20s)...');
        await new Promise(resolve => setTimeout(resolve, 20000));
    }

    console.log('🎉 Ingestion Tamamlandı!');
}

ingestDocuments();