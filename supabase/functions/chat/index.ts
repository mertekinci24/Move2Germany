import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.12.0'
import { corsHeaders } from '../_shared/cors.ts'

// Deno runtime automatically loads .env from Supabase secrets
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '')
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

console.log('Chat function initialized. GEMINI_API_KEY present:', !!GEMINI_API_KEY)

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing')
            throw new Error('Server configuration error: Missing GEMINI_API_KEY')
        }
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Supabase configuration is missing')
            throw new Error('Server configuration error: Missing Supabase credentials')
        }

        const { query, locale } = await req.json()
        console.log('Received query:', query)

        if (!query) {
            throw new Error('Query is required')
        }

        // 1. Generate Embedding for the query
        console.log('Generating embedding...')
        const embeddingResult = await embeddingModel.embedContent(query)
        const embedding = embeddingResult.embedding.values
        console.log('Embedding generated, dimension:', embedding.length)

        // 2. Search for relevant documents
        console.log('Searching documents...')
        const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.1, // Adjust threshold as needed
            match_count: 5,
        })

        if (searchError) {
            console.error('Supabase RPC error:', searchError)
            throw searchError
        }
        console.log('Found documents:', documents?.length || 0)
        if (documents && documents.length > 0) {
            console.log('Sources:', documents.map((d: any) => d.metadata?.title))
        }

        // 3. Construct Context
        let contextText = ''
        if (documents && documents.length > 0) {
            contextText = documents.map((doc: any) => {
                return `[Source: ${doc.metadata?.title || 'Unknown'}]\n${doc.content}`
            }).join('\n\n')
        } else {
            console.log('No relevant documents found, using fallback context.')
            contextText = "No specific context found in the knowledge base."
        }

        // 4. The Judge Prompt
        const prompt = `
    You are an AI assistant for "Move2Germany", a platform helping people relocate to Germany.
    Your role is to answer user questions strictly based on the provided CONTEXT from our knowledge base.
    
    RULES:
    1. Answer the question ONLY using the information in the CONTEXT below.
    2. If the answer is not in the CONTEXT, say "I'm sorry, I don't have information about that in my current knowledge base."
    3. Do NOT make up facts or use outside knowledge not present in the context.
    4. If possible, cite the source section title (e.g., "According to [Section Name]...") in your answer.
    5. Be helpful, professional, and concise.
    6. Answer in the requested language: ${locale === 'tr' ? 'Turkish' : locale === 'de' ? 'German' : 'English'}.
    
    CONTEXT:
    ${contextText}
    
    USER QUESTION:
    ${query}
    `

        // 5. Generate Response (Direct Fetch)
        console.log('Generating response via direct fetch...')
        // Using gemini-2.0-flash as it is available in the model list.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini API Error:', response.status, response.statusText, errorText)
            throw new Error(`Gemini API Error: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated."

        return new Response(text, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
        })

    } catch (error) {
        console.error('Chat function error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
