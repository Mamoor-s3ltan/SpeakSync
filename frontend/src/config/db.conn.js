import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

if(supabase != null){
    console.log("Connected to supabase succesfully")
}
else{
    console.log("Check your connection")
}