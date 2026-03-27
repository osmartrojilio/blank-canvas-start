import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendCancellationEmail(
  userEmail: string,
  userName: string | null,
  scenario: string,
  accessUntil?: string | null
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured, skipping cancellation email");
    return;
  }

  const name = userName || "Usuário";
  let subject = "";
  let bodyHtml = "";

  const header = `
    <div style="background-color:#1a1a2e;padding:30px 20px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;margin:0;">Gerenciar Frotas</h1>
    </div>
  `;
  const footer = `
    <div style="padding:20px;text-align:center;color:#888;font-size:12px;">
      <p>Este é um e-mail automático. Por favor, não responda.</p>
      <p>&copy; ${new Date().getFullYear()} Gerenciar Frotas. Todos os direitos reservados.</p>
    </div>
  `;

  switch (scenario) {
    case "trial_canceled":
      subject = "Seu período de teste foi encerrado";
      bodyHtml = `
        ${header}
        <div style="padding:30px 20px;font-family:Arial,sans-serif;color:#333;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Seu período de teste gratuito foi encerrado e sua assinatura foi cancelada.</p>
          <p>Sentimos muito em vê-lo partir! Se mudar de ideia, você pode assinar um de nossos planos a qualquer momento.</p>
          <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
          <p style="margin-top:30px;">Atenciosamente,<br><strong>Equipe Gerenciar Frotas</strong></p>
        </div>
        ${footer}
      `;
      break;

    case "canceled_pending_refund":
      subject = "Sua assinatura foi cancelada — reembolso em análise";
      bodyHtml = `
        ${header}
        <div style="padding:30px 20px;font-family:Arial,sans-serif;color:#333;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Sua assinatura foi cancelada e seu pagamento está em análise para reembolso.</p>
          <p>O reembolso será processado em até <strong>5 dias úteis</strong> e o valor será devolvido ao método de pagamento original.</p>
          <p>Se tiver dúvidas sobre o processo de reembolso, entre em contato com nosso suporte.</p>
          <p style="margin-top:30px;">Atenciosamente,<br><strong>Equipe Gerenciar Frotas</strong></p>
        </div>
        ${footer}
      `;
      break;

    case "canceled_active_until_end":
      const endDate = accessUntil
        ? new Date(accessUntil).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
        : "o final do período pago";
      subject = "Sua assinatura foi cancelada";
      bodyHtml = `
        ${header}
        <div style="padding:30px 20px;font-family:Arial,sans-serif;color:#333;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Sua assinatura foi cancelada. Você continuará tendo acesso ao sistema até <strong>${endDate}</strong>.</p>
          <p>Após essa data, seu acesso será encerrado automaticamente.</p>
          <p>Se mudar de ideia, você pode renovar seu plano a qualquer momento antes do vencimento.</p>
          <p style="margin-top:30px;">Atenciosamente,<br><strong>Equipe Gerenciar Frotas</strong></p>
        </div>
        ${footer}
      `;
      break;

    default:
      subject = "Sua assinatura foi cancelada";
      bodyHtml = `
        ${header}
        <div style="padding:30px 20px;font-family:Arial,sans-serif;color:#333;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Sua assinatura no Gerenciar Frotas foi cancelada.</p>
          <p>Se tiver dúvidas ou quiser reativar seu plano, entre em contato com nosso suporte.</p>
          <p style="margin-top:30px;">Atenciosamente,<br><strong>Equipe Gerenciar Frotas</strong></p>
        </div>
        ${footer}
      `;
      break;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gerenciar Frotas <onboarding@resend.dev>",
        to: [userEmail],
        subject,
        html: bodyHtml,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
    } else {
      console.log("Cancellation email sent to", userEmail);
    }
  } catch (emailErr) {
    console.error("Failed to send cancellation email:", emailErr);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "Usuário sem organização" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
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
      .select("subscription_status, plan_id, subscription_ends_at, trial_ends_at, created_at")
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return new Response(
        JSON.stringify({ error: "Organização não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const status = org.subscription_status;

    // Already canceled
    if (["trial_canceled", "canceled", "canceled_pending_refund", "canceled_active_until_end", "expired"].includes(status || "")) {
      return new Response(
        JSON.stringify({ error: "A assinatura já foi cancelada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────────────────────────────────────
    // SCENARIO 1: During trial period
    // ──────────────────────────────────────────────
    if (status === "trialing") {
      const { error: updateError } = await supabaseAdmin
        .from("organizations")
        .update({
          subscription_status: "trial_canceled",
          canceled_at: now.toISOString(),
          plan_id: null,
          subscription_ends_at: null,
          cancellation_reason: "trial_canceled_by_user",
        })
        .eq("id", profile.organization_id);

      if (updateError) {
        console.error("Failed to cancel trial:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao cancelar. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email (non-blocking)
      await sendCancellationEmail(user.email!, profile.full_name, "trial_canceled");

      return new Response(
        JSON.stringify({
          success: true,
          scenario: "trial_canceled",
          message: "Seu período de teste foi encerrado e sua assinatura foi cancelada.",
          new_status: "trial_canceled",
          access_blocked: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────────────────────────────────────
    // SCENARIO 2 & 3: Active paid plan
    // ──────────────────────────────────────────────
    if (status === "active" && org.plan_id) {
      // Find the most recent approved payment
      const { data: paymentEvent } = await supabaseAdmin
        .from("payment_events")
        .select("payment_id, created_at, status, amount")
        .eq("organization_id", profile.organization_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const paymentDate = paymentEvent ? new Date(paymentEvent.created_at) : null;
      const daysSincePayment = paymentDate
        ? (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      // SCENARIO 2: Within 7-day refund window
      if (paymentDate && daysSincePayment <= 7) {
        let refundProcessed = false;
        const isSimulated = paymentEvent!.payment_id.startsWith("SIM-");

        if (!isSimulated) {
          const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
          if (accessToken) {
            const refundResponse = await fetch(
              `https://api.mercadopago.com/v1/payments/${paymentEvent!.payment_id}/refunds`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                  "X-Idempotency-Key": `refund-${paymentEvent!.payment_id}-${profile.organization_id}`,
                },
              }
            );

            if (refundResponse.ok) {
              refundProcessed = true;
            } else {
              console.error("Mercado Pago refund error:", await refundResponse.text());
            }
          }
        } else {
          refundProcessed = true;
        }

        if (refundProcessed && paymentEvent) {
          await supabaseAdmin
            .from("payment_events")
            .update({ status: "refunded" })
            .eq("payment_id", paymentEvent.payment_id);
        }

        const { error: updateError } = await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "canceled_pending_refund",
            canceled_at: now.toISOString(),
            refund_eligible: true,
            last_payment_at: paymentDate?.toISOString() || null,
            cancellation_reason: "canceled_within_refund_period",
          })
          .eq("id", profile.organization_id);

        if (updateError) {
          console.error("Failed to cancel:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao cancelar. Tente novamente." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await sendCancellationEmail(user.email!, profile.full_name, "canceled_pending_refund");

        return new Response(
          JSON.stringify({
            success: true,
            scenario: "canceled_pending_refund",
            message: "Sua assinatura foi cancelada e está em análise para reembolso.",
            new_status: "canceled_pending_refund",
            refund_processed: refundProcessed,
            access_blocked: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SCENARIO 3: After 7-day refund window — keep access until end of paid period
      const { error: updateError } = await supabaseAdmin
        .from("organizations")
        .update({
          subscription_status: "canceled_active_until_end",
          canceled_at: now.toISOString(),
          refund_eligible: false,
          last_payment_at: paymentDate?.toISOString() || null,
          cancellation_reason: "canceled_after_refund_period",
        })
        .eq("id", profile.organization_id);

      if (updateError) {
        console.error("Failed to cancel:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao cancelar. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await sendCancellationEmail(user.email!, profile.full_name, "canceled_active_until_end", org.subscription_ends_at);

      return new Response(
        JSON.stringify({
          success: true,
          scenario: "canceled_active_until_end",
          message: "Sua assinatura será encerrada ao final do período atual.",
          new_status: "canceled_active_until_end",
          access_until: org.subscription_ends_at,
          access_blocked: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback for other statuses (past_due, unpaid, etc.)
    const { error: updateError } = await supabaseAdmin
      .from("organizations")
      .update({
        subscription_status: "canceled",
        canceled_at: now.toISOString(),
        plan_id: null,
        cancellation_reason: "canceled_other",
      })
      .eq("id", profile.organization_id);

    if (updateError) {
      console.error("Failed to cancel:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao cancelar. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await sendCancellationEmail(user.email!, profile.full_name, "canceled");

    return new Response(
      JSON.stringify({
        success: true,
        scenario: "canceled",
        message: "Sua assinatura foi cancelada.",
        new_status: "canceled",
        access_blocked: true,
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
