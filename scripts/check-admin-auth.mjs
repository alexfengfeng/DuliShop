import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.MVP_ADMIN_EMAIL ?? "admin@solacesupply.test";
const password = process.env.MVP_ADMIN_PASSWORD;

if (!url || !anonKey || anonKey === "YOUR_SUPABASE_ANON_KEY") {
  console.error("Supabase Auth env is missing.");
  process.exit(1);
}

if (!password) {
  console.error("Set MVP_ADMIN_PASSWORD for this command. It is read from the shell only and must not be committed.");
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const { error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  console.error(`Admin auth check failed: ${error.message}`);
  process.exit(1);
}

console.log(`Admin auth check passed for ${email}.`);
