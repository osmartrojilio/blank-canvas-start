import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const publicKey = Deno.env.get("VITE_MERCADO_PAGO_PUBLIC_KEY") || Deno.env.get("MERCADO_PAGO_PUBLIC_KEY") || "";

  return new Response(
    JSON.stringify({ public_key: publicKey }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
