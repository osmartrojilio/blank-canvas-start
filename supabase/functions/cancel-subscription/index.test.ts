import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Não autorizado");
});

Deno.test("rejects invalid token", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer invalid-token",
    },
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Não autorizado");
});

Deno.test("CORS preflight works", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
    method: "OPTIONS",
    headers: { "apikey": SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});
