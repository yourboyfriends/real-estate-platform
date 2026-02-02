import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_KEY:', supabaseKey ? 'Found' : 'Missing');
  console.error('');
  console.error(' Missing Supabase credentials in .env file!');
  console.error('Required: SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log(' Supabase connected successfully!');
    return true;
  } catch (error: any) {
    console.error('Supabase connection failed:', error.message);
    return false;
  }
};