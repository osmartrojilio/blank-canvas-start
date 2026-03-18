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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", profile.organization_id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...body } = await req.json();

    if (action === "create") {
      const { name, scopes, expires_in_days } = body;

      if (!name || typeof name !== "string") {
        return new Response(JSON.stringify({ error: "Name is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate API key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const apiKey = `sk_${Array.from(keyBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

      // Hash the key with a random salt using PBKDF2
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(apiKey),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        256
      );
      const keyHash = saltHex + ":" + Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const keyPrefix = apiKey.substring(0, 10);

      const expiresAt = expires_in_days
        ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: newKey, error: insertError } = await supabase
        .from("api_keys")
        .insert({
          organization_id: profile.organization_id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes: scopes || ["read"],
          expires_at: expiresAt,
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating API key:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return the full key only once (it won't be stored)
      return new Response(
        JSON.stringify({
          success: true,
          api_key: apiKey,
          id: newKey.id,
          name: newKey.name,
          key_prefix: newKey.key_prefix,
          scopes: newKey.scopes,
          expires_at: newKey.expires_at,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "revoke") {
      const { key_id } = body;

      if (!key_id) {
        return new Response(JSON.stringify({ error: "Key ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase
        .from("api_keys")
        .update({ is_active: false })
        .eq("id", key_id)
        .eq("organization_id", profile.organization_id);

      if (updateError) {
        console.error("Error revoking API key:", updateError);
        return new Response(JSON.stringify({ error: "Failed to revoke API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in api-keys function:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
