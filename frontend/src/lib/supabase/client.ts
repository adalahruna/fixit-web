import { createClient } from '@supabase/supabase-js';

// Mengambil kunci dari file .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Membuat jembatan koneksi ke database
export const supabase = createClient(supabaseUrl, supabaseKey);