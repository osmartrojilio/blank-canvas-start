import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const userEmail = userData.user.email as string;

    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Código inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid code
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from("email_verification_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .is("verified_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError || !codeRecord) {
      return new Response(
        JSON.stringify({ error: "Código inválido ou expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as verified
    await supabaseAdmin
      .from("email_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", codeRecord.id);

    // Mark profile as verified
    await supabaseAdmin
      .from("profiles")
      .update({ is_email_verified: true })
      .eq("id", userId);

    // Get user profile info for admin notification
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    // Send notification email to admin
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const now = new Date();
      const formattedDate = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      
      // Try to get IP from headers
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
        || req.headers.get("x-real-ip") 
        || "Não disponível";

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Gerenciar Frotas <noreply@gerenciarfrotas.com.br>",
            to: ["gerenciarfrotas@gmail.com"],
            subject: "Novo Cadastro Confirmado - Gerenciar Frotas",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
                <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px;">🎉 Novo Cadastro Confirmado</h1>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Nome:</strong></td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px;">${profileData?.full_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>E-mail:</strong></td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Data/Hora:</strong></td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>IP:</strong></td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px;">${clientIp}</td>
                  </tr>
                </table>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send admin notification:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "E-mail verificado com sucesso" }),
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
