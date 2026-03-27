import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - production and development
const allowedOrigins = [
  "https://gerentefrotas.com.br",
  "https://www.gerentefrotas.com.br",
  "https://gerenciarfrotas.com.br",
  "https://www.gerenciarfrotas.com.br",
  "https://gerenciarfrotas.lovable.app",
  "https://id-preview--8b65be95-4cfa-46f4-99e6-53bd519c6b55.lovable.app",
  "https://8b65be95-4cfa-46f4-99e6-53bd519c6b55.lovableproject.com",
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

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(organizationId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `checkout:${organizationId}`;
  const record = rateLimitStore.get(key);

  if (record && now > record.resetTime) {
    rateLimitStore.delete(key);
  }

  const currentRecord = rateLimitStore.get(key);

  if (!currentRecord) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (currentRecord.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((currentRecord.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  currentRecord.count++;
  return { allowed: true };
}

// Calculate subscription end date based on duration_months from payment date
function calculateSubscriptionEndDate(durationMonths: number): Date {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);
  return endDate;
}

// Duration label for description
function getDurationLabel(months: number): string {
  switch (months) {
    case 1: return "Mensal";
    case 12: return "Anual";
    case 24: return "2 Anos";
    case 36: return "3 Anos";
    default: return `${months} meses`;
  }
}

interface CheckoutTransparenteRequest {
  // Payment Brick data
  token?: string;
  payment_method_id: string;
  installments?: number;
  issuer_id?: string;
  transaction_amount?: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  // Plan/org data
  plan_id: string;
  plan_name: string;
  plan_price: number;
  organization_id: string;
  coupon_id?: string;
  duration_months?: number;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: userError } = await supabaseAuthClient.auth.getUser(token);

    if (userError || !authUser) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const userId = authUser.id;
    const userEmail = authUser.email ?? "";

    const body: CheckoutTransparenteRequest = await req.json();
    const { plan_id, plan_name, plan_price, organization_id, payment_method_id, coupon_id } = body;
    
    // Validate and sanitize duration_months (only allow 1, 12, 24, 36)
    const allowedDurations = [1, 12, 24, 36];
    const duration_months = allowedDurations.includes(body.duration_months || 0) 
      ? body.duration_months! 
      : 12;

    if (!plan_id || !plan_name || plan_price === undefined || !organization_id || !payment_method_id) {
      return new Response(
        JSON.stringify({ error: "Dados do pagamento incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organization_id)) {
      return new Response(
        JSON.stringify({ error: "ID da organização inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(organization_id);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rateLimitResult.retryAfter || 60) },
        }
      );
    }

    // Use service role client only for organization validation (bypasses RLS)
    const svcUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(svcUrl, svcKey);

    // Verify user belongs to organization and check owner status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("organization_id, is_owner")
      .eq("id", userId)
      .single();

    // Fetch organization details for receipt
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("name, cnpj")
      .eq("id", organization_id)
      .single();

    if (profileError || !profile?.organization_id || profile.organization_id !== organization_id) {
      console.error("Profile check failed:", { profileError, profile, expected_org: organization_id });
      return new Response(
        JSON.stringify({ error: "Você não tem acesso a esta organização" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin: owner first (reliable), then RPC fallback
    let isAdmin = profile.is_owner === true;

    if (!isAdmin) {
      const roleCheckResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/has_role_in_organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: authHeader,
        },
        body: JSON.stringify({
          _user_id: userId,
          _organization_id: organization_id,
          _role: "admin",
        }),
      });

      const roleCheckBody = await roleCheckResponse.json().catch(() => null);
      isAdmin = roleCheckResponse.ok && roleCheckBody === true;
    }

    if (!isAdmin) {
      console.error("Role check failed:", { userId, organization_id, isOwner: profile.is_owner });
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem gerenciar assinaturas" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento inválida" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate coupon if provided
    let discountPercent = 0;
    let validatedCouponId: string | null = null;

    if (coupon_id) {
      const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex2.test(coupon_id)) {
        return new Response(
          JSON.stringify({ error: "ID do cupom inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: coupon, error: couponError } = await supabaseAdmin
        .from("discount_coupons")
        .select("id, code, discount_percent, max_uses, current_uses, valid_until, is_active")
        .eq("id", coupon_id)
        .single();

      if (couponError || !coupon) {
        return new Response(
          JSON.stringify({ error: "Cupom não encontrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!coupon.is_active) {
        return new Response(
          JSON.stringify({ error: "Cupom inativo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Cupom expirado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.max_uses != null && coupon.current_uses >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ error: "Cupom atingiu o limite de uso" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      discountPercent = coupon.discount_percent;
      validatedCouponId = coupon.id;
    }

    // Build the payment request for Mercado Pago /v1/payments
    const baseAmount = body.transaction_amount || plan_price;
    const discountedAmount = discountPercent > 0
      ? Math.round((baseAmount * (1 - discountPercent / 100) + Number.EPSILON) * 100) / 100
      : baseAmount;
    const amount = Math.round((discountedAmount + Number.EPSILON) * 100) / 100;
    
    const durationLabel = getDurationLabel(duration_months);
    
    const paymentBody: Record<string, unknown> = {
      transaction_amount: amount,
      payment_method_id: payment_method_id,
      installments: body.installments || 1,
      payer: {
        email: body.payer?.email || userEmail,
        ...(body.payer?.identification && {
          identification: body.payer.identification,
        }),
      },
      external_reference: JSON.stringify({
        organization_id,
        plan_id,
        user_id: userId,
        duration_months,
      }),
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercado-pago-webhook`,
      statement_descriptor: "SISTEMA FROTA",
      description: `Plano ${plan_name} - ${durationLabel} - Gerente Frotas`,
    };

    // Add card token if present (credit/debit card payments)
    if (body.token) {
      paymentBody.token = body.token;
    }

    // Add issuer_id if present
    if (body.issuer_id) {
      paymentBody.issuer_id = body.issuer_id;
    }

    // Generate idempotency key
    const idempotencyKey = `${organization_id}-${plan_id}-${Date.now()}`;

    console.log("Creating payment via /v1/payments:", {
      payment_method_id,
      amount: paymentBody.transaction_amount,
      org: organization_id,
      plan: plan_id,
      duration_months,
    });

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago payment error:", JSON.stringify(paymentData));
      const userMessage = paymentData?.message || "Erro ao processar pagamento";
      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: response.status >= 400 && response.status < 500 ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Payment created:", { id: paymentData.id, status: paymentData.status, status_detail: paymentData.status_detail });

    // If approved immediately, activate subscription
    if (paymentData.status === "approved") {
      const subscriptionEndsAt = calculateSubscriptionEndDate(duration_months);

      await supabaseAdmin
        .from("organizations")
        .update({
          plan_id: plan_id,
          subscription_status: "active",
          subscription_ends_at: subscriptionEndsAt.toISOString(),
          trial_ends_at: null,
          duration_months: duration_months,
          last_payment_at: new Date().toISOString(),
        })
        .eq("id", organization_id);

      // Record payment event
      await supabaseAdmin
        .from("payment_events")
        .insert({
          payment_id: paymentData.id.toString(),
          organization_id,
          plan_id,
          status: paymentData.status,
          amount: paymentData.transaction_amount,
        });

      // Record coupon usage and increment counter
      if (validatedCouponId) {
        await supabaseAdmin
          .from("coupon_usage")
          .insert({
            coupon_id: validatedCouponId,
            organization_id,
            payment_id: paymentData.id.toString(),
          });

        // Increment usage counter
        await supabaseAdmin.rpc("increment_coupon_usage", { _coupon_id: validatedCouponId });
      }
    }

    // Build user-friendly status messages
    const statusMessages: Record<string, string> = {
      approved: "Pagamento aprovado! Seu plano foi ativado.",
      pending: "Pagamento pendente. Aguardando confirmação.",
      in_process: "Pagamento em processamento. Aguarde a confirmação.",
      rejected: "Pagamento não aprovado. Verifique os dados e tente novamente.",
    };

    return new Response(
      JSON.stringify({
        status: paymentData.status,
        payment_id: paymentData.id?.toString(),
        status_detail: paymentData.status_detail,
        message: statusMessages[paymentData.status] || "Status do pagamento: " + paymentData.status,
        // Receipt data
        organization_name: orgData?.name || "",
        organization_cnpj: orgData?.cnpj || null,
        payer_email: userEmail,
        payment_method: payment_method_id,
        installments: body.installments || 1,
        amount: paymentBody.transaction_amount,
        discount_percent: discountPercent > 0 ? discountPercent : undefined,
        payment_date: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
