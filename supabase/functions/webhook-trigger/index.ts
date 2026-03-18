import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://gerentefrotas.com.br",
  "https://www.gerentefrotas.com.br",
  "https://gerenciarfrotas.com.br",
  "https://www.gerenciarfrotas.com.br",
  "https://gerenciarfrotas.lovable.app",
  "https://id-preview--ac08c6c0-6711-41ae-9c07-912886083cce.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = allowedOrigins.some((allowed) => origin === allowed || origin.endsWith(".lovable.app"));
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

async function generateHmacSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================
    // AUTHENTICATION: Verify caller identity
    // ==========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client with the user's token to verify their identity
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { organization_id, event_type, payload } = await req.json();

    if (!organization_id || !event_type || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format for organization_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==========================================
    // AUTHORIZATION: Verify organization membership and admin role
    // ==========================================
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller belongs to the target organization
    if (profile.organization_id !== organization_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller has admin role (only admins should trigger webhooks)
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organization_id)
      .single();

    if (roleError || !userRole || userRole.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================
    // BUSINESS LOGIC: Trigger webhooks
    // ==========================================
    
    // Get active webhooks for this organization and event type
    const { data: webhooks, error: webhooksError } = await supabase
      .from("webhook_configs")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (webhooksError) {
      console.error("Error fetching webhooks:", webhooksError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ message: "No webhooks configured for this event" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const webhook of webhooks) {
      const webhookPayload = {
        event: event_type,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const payloadString = JSON.stringify(webhookPayload);
      const signature = await generateHmacSignature(webhook.secret, payloadString);

      let responseStatus: number | null = null;
      let responseBody: string | null = null;
      let success = false;

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event_type,
          },
          body: payloadString,
        });

        responseStatus = response.status;
        responseBody = await response.text();
        success = response.ok;

        // Update last triggered
        await supabase
          .from("webhook_configs")
          .update({ last_triggered_at: new Date().toISOString() })
          .eq("id", webhook.id);
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.id}`);
        responseBody = "Delivery failed";
      }

      // Log the delivery
      await supabase.from("webhook_logs").insert({
        webhook_id: webhook.id,
        organization_id: organization_id,
        event_type: event_type,
        payload: webhookPayload,
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 1000),
        success,
      });

      results.push({
        webhook_id: webhook.id,
        success,
        status: responseStatus,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in webhook-trigger function");
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
