import { createClient } from '@supabase/supabase-js';

// Paste your Supabase Project URL and anon key here
const SUPABASE_URL = 'https://vnuhmcsoodgeuhbtgxop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudWhtY3Nvb2RnZXVoYnRneG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjIyOTEsImV4cCI6MjA5MTA5ODI5MX0.2J8bWDXunjqJjX1eDczTMBvCJ4d3ov91jWotHRZcCmo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
