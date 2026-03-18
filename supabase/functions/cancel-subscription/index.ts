import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - production and development
const allowedOrigins = [
  "https://gerentefrotas.com.br",
  "https://www.gerentefrotas.com.br",
  "https://gerenciarfrotas.com.br",
  "https://www.gerenciarfrotas.com.br",
  "https://gerenciarfrotas.lovable.app",
  "https://id-preview--ac08c6c0-6711-41ae-9c07-912886083cce.lovable.app",
  "https://ac08c6c0-6711-41ae-9c07-912886083cce.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Create user-scoped client to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile and organization
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "Usuário sem organização" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem cancelar o plano" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization details
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("subscription_status, plan_id, subscription_ends_at, trial_ends_at")
      .eq("id", profile.organization_id)
      .single();

    if (!org || org.subscription_status !== "active" || !org.plan_id) {
      return new Response(
        JSON.stringify({ error: "Não há assinatura ativa para cancelar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the most recent approved payment for this organization
    const { data: paymentEvent } = await supabaseAdmin
      .from("payment_events")
      .select("payment_id, created_at, status, amount")
      .eq("organization_id", profile.organization_id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();

    // Determine new status: back to trialing if trial days remain
    const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
    const hasTrialRemaining = trialEndsAt && trialEndsAt > now;

    let refundProcessed = false;

    if (paymentEvent) {
      // Check if within 7-day grace period
      const paymentDate = new Date(paymentEvent.created_at);
      const diffMs = now.getTime() - paymentDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 7) {
        // After grace period: do NOT cancel, do NOT refund
        return new Response(
          JSON.stringify({ error: "O período de carência de 7 dias já expirou. O cancelamento por autoatendimento não está disponível. Entre em contato com o suporte." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Skip Mercado Pago refund for simulated/test payments
      const isSimulated = paymentEvent.payment_id.startsWith("SIM-");

      if (!isSimulated) {
        // Process refund via Mercado Pago API
        const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
        if (!accessToken) {
          return new Response(
            JSON.stringify({ error: "Serviço temporariamente indisponível" }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const refundResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentEvent.payment_id}/refunds`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": `refund-${paymentEvent.payment_id}-${profile.organization_id}`,
            },
          }
        );

        if (!refundResponse.ok) {
          const refundError = await refundResponse.text();
          console.error("Mercado Pago refund error:", refundError);
          return new Response(
            JSON.stringify({ error: "Erro ao processar reembolso. Tente novamente ou entre em contato com o suporte." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        console.log("Simulated payment detected, skipping Mercado Pago refund:", paymentEvent.payment_id);
      }

      // Update payment event status
      await supabaseAdmin
        .from("payment_events")
        .update({ status: "refunded" })
        .eq("payment_id", paymentEvent.payment_id);

      refundProcessed = true;
    }

    // Update organization: cancel subscription — user falls to Free plan (no blocking)
    const { error: updateError } = await supabaseAdmin
      .from("organizations")
      .update({
        subscription_status: "canceled",
        plan_id: null,
        subscription_ends_at: null,
      })
      .eq("id", profile.organization_id);

    if (updateError) {
      console.error("Failed to update organization:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar o plano. Entre em contato com o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = refundProcessed
      ? "Plano cancelado com sucesso. Reembolso processado. Você agora está no plano Free."
      : "Plano cancelado com sucesso. Você agora está no plano Free.";

    return new Response(
      JSON.stringify({
        success: true,
        message,
        new_status: "canceled",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
