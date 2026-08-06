import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://hdcdrjjonuarxfdxkwia.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_Wmwz_HvcKllXzQ8Xi-9o-w_muS6WW1F";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
