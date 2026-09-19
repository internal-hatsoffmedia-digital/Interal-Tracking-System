import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://cdgavcikyyxaydroihwp.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZ2F2Y2lreXl4YXlkcm9paHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTkwMTMsImV4cCI6MjEwMzU3NTAxM30.eC9S-QzKF9k1iFeaF0byIx1WPwf9020BGqVZ6iiDunU";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file or Vercel settings.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);