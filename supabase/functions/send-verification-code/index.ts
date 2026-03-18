import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

Deno.serve(async (req) => {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to manage codes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check rate limit - max 1 code per minute
    const { data: recentCodes } = await supabaseAdmin
      .from("email_verification_codes")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      return new Response(
        JSON.stringify({ error: "Aguarde 1 minuto para reenviar o código" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old codes
    await supabaseAdmin
      .from("email_verification_codes")
      .delete()
      .eq("user_id", userId)
      .is("verified_at", null);

    // Insert new code
    await supabaseAdmin.from("email_verification_codes").insert({
      user_id: userId,
      email: userEmail,
      code,
      expires_at: expiresAt.toISOString(),
    });

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gerenciar Frotas <noreply@gerenciarfrotas.com.br>",
        to: [userEmail],
        subject: "Código de Verificação - Gerenciar Frotas",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
            <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">Confirme seu e-mail</h1>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">
              Use o código abaixo para verificar sua conta no Gerenciar Frotas:
            </p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">
              Este código expira em <strong>10 minutos</strong>.<br/>
              Se você não solicitou este código, ignore este e-mail.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
