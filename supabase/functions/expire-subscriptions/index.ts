import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendExpirationEmail(email: string, name: string, orgName: string, reason: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }

  const reasonMessages: Record<string, { title: string; message: string }> = {
    trial_expired: {
      title: "Seu período de teste expirou",
      message: "Seu período de teste gratuito de 14 dias chegou ao fim. Para continuar utilizando o sistema, escolha um plano que melhor atende às suas necessidades.",
    },
    subscription_expired: {
      title: "Sua assinatura expirou",
      message: "O período da sua assinatura chegou ao fim. Para continuar utilizando o sistema, renove sua assinatura ou escolha um novo plano.",
    },
    canceled_period_ended: {
      title: "Seu período de acesso encerrou",
      message: "O período restante da sua assinatura cancelada chegou ao fim. Para voltar a utilizar o sistema, escolha um novo plano.",
    },
  };

  const content = reasonMessages[reason] || reasonMessages.subscription_expired;
  const userName = name || "Usuário";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#dc2626;padding:28px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">⚠️ ${content.title}</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Olá, <strong>${userName}</strong>!</p>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 16px;">${content.message}</p>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
        Organização: <strong>${orgName}</strong>
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://gerenciarfrotas.lovable.app/configuracoes?tab=planos"
           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;font-size:14px;">
          Ver Planos e Renovar
        </a>
      </div>
      <p style="font-size:12px;color:#999;margin:24px 0 0;text-align:center;">
        Gerenciar Frotas — Sistema de Gestão de Frotas
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gerenciar Frotas <noreply@gerenciarfrotas.lovable.app>",
        to: [email],
        subject: content.title,
        html,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error(`Email send failed for ${email}:`, result);
    } else {
      console.log(`Expiration email sent to ${email}`);
    }
  } catch (err) {
    console.error(`Error sending email to ${email}:`, err);
  }
}

async function notifyOrgUsers(supabaseAdmin: any, orgId: string, orgName: string, reason: string) {
  // Get all users (profiles) in this organization
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", orgId);

  if (!profiles?.length) return;

  for (const profile of profiles) {
    // Get email from auth.users
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userData?.user?.email) {
      await sendExpirationEmail(
        userData.user.email,
        profile.full_name || "",
        orgName,
        reason
      );
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();
    let expiredCount = 0;

    // 1. Expire trials that have passed trial_ends_at
    const { data: expiredTrials, error: trialError } = await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "expired", updated_at: now })
      .eq("subscription_status", "trialing")
      .lt("trial_ends_at", now)
      .select("id, name");

    if (trialError) console.error("Error expiring trials:", trialError.message);
    if (expiredTrials?.length) {
      for (const org of expiredTrials) {
        await notifyOrgUsers(supabaseAdmin, org.id, org.name, "trial_expired");
      }
    }
    expiredCount += expiredTrials?.length || 0;

    // 2. Expire canceled_active_until_end that have passed subscription_ends_at
    const { data: expiredCanceled, error: canceledError } = await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "expired", updated_at: now })
      .eq("subscription_status", "canceled_active_until_end")
      .lt("subscription_ends_at", now)
      .select("id, name");

    if (canceledError) console.error("Error expiring canceled:", canceledError.message);
    if (expiredCanceled?.length) {
      for (const org of expiredCanceled) {
        await notifyOrgUsers(supabaseAdmin, org.id, org.name, "canceled_period_ended");
      }
    }
    expiredCount += expiredCanceled?.length || 0;

    // 3. Expire active subscriptions that have passed subscription_ends_at
    const { data: expiredActive, error: activeError } = await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "expired", updated_at: now })
      .eq("subscription_status", "active")
      .not("subscription_ends_at", "is", null)
      .lt("subscription_ends_at", now)
      .select("id, name");

    if (activeError) console.error("Error expiring active:", activeError.message);
    if (expiredActive?.length) {
      for (const org of expiredActive) {
        await notifyOrgUsers(supabaseAdmin, org.id, org.name, "subscription_expired");
      }
    }
    expiredCount += expiredActive?.length || 0;

    console.log(`Expired ${expiredCount} subscriptions at ${now}`);

    return new Response(
      JSON.stringify({ success: true, expired_count: expiredCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("expire-subscriptions error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
