import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

interface InvitationEmailRequest {
  email: string;
  inviterName: string;
  organizationName: string;
  role: string;
  token: string;
}

// Escape HTML special characters to prevent HTML injection in emails
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is authenticated
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email service not configured. Please contact the administrator." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { email, inviterName, organizationName, role, token: inviteToken }: InvitationEmailRequest = await req.json();

    // Validate required fields
    if (!email || !organizationName || !role || !inviteToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      manager: "Gerente",
      driver: "Motorista",
    };

    const roleLabel = roleLabels[role] || escapeHtml(role);

    // Sanitize user-provided values to prevent HTML injection in emails
    const safeInviterName = inviterName ? escapeHtml(inviterName) : "";
    const safeOrgName = escapeHtml(organizationName);

    // Get the app URL from environment or use a default
    const appUrl = Deno.env.get("APP_URL") || "https://gerentefrotas.com.br";
    const acceptUrl = `${appUrl}/aceitar-convite?token=${encodeURIComponent(inviteToken)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para ${safeOrgName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Você foi convidado!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Olá!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${safeInviterName ? `<strong>${safeInviterName}</strong> convidou você` : 'Você foi convidado'} para fazer parte da organização <strong>${safeOrgName}</strong> como <strong>${roleLabel}</strong>.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Clique no botão abaixo para aceitar o convite e criar sua conta:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Aceitar Convite
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este e-mail.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${acceptUrl}" style="color: #667eea; word-break: break-all;">${acceptUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Gerenciar Frotas <noreply@gerenciarfrotas.com.br>",
        to: [email],
        subject: `Convite para ${safeOrgName}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: resendData.message || "Failed to send email" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error sending invitation email:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } 
      }
    );
  }
});
