import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

console.log('URL:', process.env.VITE_SUPABASE_URL)
console.log('KEY:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10))

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

supabase.functions.invoke('chat', { body: { query: 'test' } })
    .then(({ data, error }) => {
        if (error) {
            console.log('ERROR_OBJ:', JSON.stringify(error, null, 2))
        } else {
            console.log('SUCCESS_DATA:', data)
        }
    })
    .catch(e => {
        console.log('EXCEPTION:', e)
    })
