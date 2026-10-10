import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yujkuflxeriyirsamhht.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_GfDJrXpu5R0piINCM72WKw_tI5xrXnh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});