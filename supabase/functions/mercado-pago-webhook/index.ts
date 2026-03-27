import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - production, development, and Mercado Pago
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
  "https://www.mercadopago.com",
  "https://www.mercadopago.com.br",
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

// Calculate subscription end date based on duration_months from payment date
function calculateSubscriptionEndDate(durationMonths: number): Date {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);
  return endDate;
}

// Verify Mercado Pago webhook signature using HMAC-SHA256
async function verifyMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): Promise<{ valid: boolean; reason: string }> {
  if (!xSignature || !xRequestId) {
    return { valid: false, reason: "missing_signature_headers" };
  }

  const signatureParts: Record<string, string> = {};
  const parts = xSignature.split(",");
  
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      signatureParts[key.trim()] = value.trim();
    }
  }

  const ts = signatureParts["ts"];
  const v1 = signatureParts["v1"];

  if (!ts || !v1) {
    return { valid: false, reason: "invalid_format" };
  }

  const timestampMs = parseInt(ts, 10) * 1000;
  const now = Date.now();
  const fifteenMinutesMs = 15 * 60 * 1000;
  
  if (isNaN(timestampMs) || Math.abs(now - timestampMs) > fifteenMinutesMs) {
    return { valid: false, reason: "timestamp_expired" };
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(manifest)
  );

  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedSignature.length !== v1.length) {
    return { valid: false, reason: "length_mismatch" };
  }
  
  let result = 0;
  for (let i = 0; i < computedSignature.length; i++) {
    result |= computedSignature.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  
  return { valid: result === 0, reason: result === 0 ? "signature_valid" : "signature_mismatch" };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const body = await req.json();

    const dataId = body.data?.id?.toString() || "";

    console.log("Webhook received:", {
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId,
      dataId,
      action: body.action || body.type,
      hasSecret: !!webhookSecret,
      secretLength: webhookSecret?.length,
    });

    const signatureResult = await verifyMercadoPagoSignature(
      xSignature,
      xRequestId,
      dataId,
      webhookSecret
    );

    if (!signatureResult.valid) {
      console.error(`Webhook signature validation failed: ${signatureResult.reason}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingPayment } = await supabaseAdmin
        .from("payment_events")
        .select("id, status")
        .eq("payment_id", paymentId.toString())
        .maybeSingle();

      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Payment verification failed" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const payment = await paymentResponse.json();

      if (existingPayment && existingPayment.status === payment.status) {
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse external_reference for org/plan/duration info
      let externalRef: unknown;
      try {
        externalRef = JSON.parse(payment.external_reference);
      } catch {
        externalRef = null;
      }

      let organization_id: string | null = null;
      let plan_id: string | null = null;
      let duration_months = 12; // default fallback
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (
        typeof externalRef === "object" &&
        externalRef !== null &&
        !Array.isArray(externalRef)
      ) {
        const refObj = externalRef as Record<string, unknown>;
        if (typeof refObj.organization_id === "string" && uuidRegex.test(refObj.organization_id)) {
          organization_id = refObj.organization_id;
        }
        if (typeof refObj.plan_id === "string" && uuidRegex.test(refObj.plan_id)) {
          plan_id = refObj.plan_id;
        }
        // Parse duration_months with validation
        if (typeof refObj.duration_months === "number" && [1, 12, 24, 36].includes(refObj.duration_months)) {
          duration_months = refObj.duration_months;
        }
      }

      // Process approved payments - activate subscription
      if (payment.status === "approved" && organization_id && plan_id) {
        // Fetch org created_at to calculate end date from creation
        const { data: orgData } = await supabaseAdmin
          .from("organizations")
          .select("created_at")
          .eq("id", organization_id)
          .single();

        const subscriptionEndsAt = calculateSubscriptionEndDate(duration_months, orgData?.created_at);

        const { error: updateError } = await supabaseAdmin
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

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Payment processing failed" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Process refunded/chargebacked payments - cancel subscription
      if ((payment.status === "refunded" || payment.status === "charged_back") && organization_id) {
        const { error: updateError } = await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "canceled",
            plan_id: null,
          })
          .eq("id", organization_id);

        if (updateError) {
          console.error("Failed to cancel subscription on refund:", updateError);
        }
      }

      // Record/update payment event
      if (existingPayment) {
        await supabaseAdmin
          .from("payment_events")
          .update({ status: payment.status })
          .eq("id", existingPayment.id);
      } else {
        await supabaseAdmin
          .from("payment_events")
          .insert({
            payment_id: paymentId.toString(),
            organization_id: organization_id,
            plan_id: plan_id,
            status: payment.status,
            amount: payment.transaction_amount,
          });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
