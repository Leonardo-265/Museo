// =========================================================
// Configuración de Supabase
// Reemplazá estos dos valores con los de tu proyecto:
// Supabase > Project Settings > API
// =========================================================
export const SUPABASE_URL = "https://bogmnjgamfjhdxxknode.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZ21uamdhbWZqaGR4eGtub2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNDU1ODIsImV4cCI6MjEwMDkyMTU4Mn0.GV7jLau_uP_yp8S7pHHccdf3SiyvJ2klaCltGI3rKnE";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
