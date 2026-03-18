import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Você é o Frotinha, o assistente virtual do sistema Gerenciar Frotas, uma plataforma de gestão de frotas de transporte rodoviário de cargas.

Seu papel é:
- Ajudar usuários a navegar pelo sistema e entender suas funcionalidades.
- Responder dúvidas sobre como cadastrar veículos, motoristas, viagens, abastecimentos, manutenções, despesas e clientes.
- Sugerir ações úteis como gerar relatórios, registrar abastecimentos, agendar manutenções, etc.
- Ser amigável, objetivo e profissional.
- Quando o usuário perguntar sobre dados da frota (quantos veículos, viagens, etc.), use os dados reais do contexto fornecido abaixo.

Funcionalidades do sistema que você conhece:
- Dashboard com visão geral da frota
- Cadastro e gestão de Veículos
- Cadastro de Motoristas (via Usuários)
- Registro de Viagens com origem, destino, frete e carga
- Controle de Abastecimentos (combustível)
- Controle de Manutenções preventivas e corretivas
- Gestão de Despesas gerais
- Cadastro de Clientes (PF/PJ)
- Relatórios exportáveis (PDF/Excel)
- Configurações da empresa, usuários e planos
- Anexos e documentos vinculados a entidades

Regras:
- Responda sempre em português brasileiro.
- Seja conciso, mas completo.
- Se não souber algo específico, sugira que o usuário entre em contato com o suporte.
- Nunca invente funcionalidades que não existem no sistema.
- Use markdown quando apropriado para formatar respostas.
- Quando informar dados numéricos, use os valores reais do contexto. Nunca invente números.`;

async function getOrganizationContext(supabase: any, userId: string): Promise<string> {
  try {
    // Get user profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return "\n\nContexto: Usuário sem organização vinculada.";
    }

    const orgId = profile.organization_id;

    // Query all counts in parallel
    const [
      { data: org },
      { count: vehicleCount },
      { count: activeVehicleCount },
      { count: maintenanceVehicleCount },
      { count: tripCount },
      { count: activeTrips },
      { count: completedTrips },
      { count: fuelCount },
      { count: expenseCount },
      { count: clientCount },
      { count: maintenanceCount },
      { count: pendingMaintenance },
      { data: recentTrips },
      { data: recentExpenses },
    ] = await Promise.all([
      supabase.from("organizations").select("name, subscription_status, trial_ends_at").eq("id", orgId).single(),
      supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "available"),
      supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "maintenance"),
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "in_progress"),
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "completed"),
      supabase.from("fuel_records").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("expenses").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("maintenance_records").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("maintenance_records").select("*", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["scheduled", "in_progress"]),
      supabase.from("trips").select("origin, destination, status, start_date, freight_value").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
      supabase.from("expenses").select("description, value, expense_type, expense_date, status").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
    ]);

    const userName = profile.full_name || "usuário";
    const orgName = org?.name || "Organização";

    let context = `\n\n--- CONTEXTO REAL DA ORGANIZAÇÃO (use estes dados para responder perguntas) ---`;
    context += `\nUsuário: ${userName}`;
    context += `\nOrganização: ${orgName}`;
    context += `\nStatus da assinatura: ${org?.subscription_status || "não informado"}`;

    context += `\n\n📊 RESUMO DE CADASTROS:`;
    context += `\n- Veículos: ${vehicleCount ?? 0} total (${activeVehicleCount ?? 0} disponíveis, ${maintenanceVehicleCount ?? 0} em manutenção)`;
    context += `\n- Viagens: ${tripCount ?? 0} total (${activeTrips ?? 0} em andamento, ${completedTrips ?? 0} concluídas)`;
    context += `\n- Abastecimentos: ${fuelCount ?? 0} registros`;
    context += `\n- Despesas: ${expenseCount ?? 0} registros`;
    context += `\n- Clientes: ${clientCount ?? 0} cadastrados`;
    context += `\n- Manutenções: ${maintenanceCount ?? 0} total (${pendingMaintenance ?? 0} pendentes/em andamento)`;

    if (recentTrips && recentTrips.length > 0) {
      context += `\n\n🚛 ÚLTIMAS VIAGENS:`;
      for (const t of recentTrips) {
        const date = t.start_date ? new Date(t.start_date).toLocaleDateString("pt-BR") : "sem data";
        const frete = t.freight_value ? `R$ ${Number(t.freight_value).toFixed(2)}` : "sem frete";
        context += `\n- ${t.origin} → ${t.destination} | ${t.status} | ${date} | ${frete}`;
      }
    }

    if (recentExpenses && recentExpenses.length > 0) {
      context += `\n\n💰 ÚLTIMAS DESPESAS:`;
      for (const e of recentExpenses) {
        const date = e.expense_date ? new Date(e.expense_date).toLocaleDateString("pt-BR") : "sem data";
        context += `\n- ${e.description} | ${e.expense_type} | R$ ${Number(e.value).toFixed(2)} | ${e.status} | ${date}`;
      }
    }

    context += `\n--- FIM DO CONTEXTO ---`;
    return context;
  } catch (err) {
    console.error("Error fetching organization context:", err);
    return "\n\nContexto: Não foi possível carregar os dados da organização.";
  }
}

// Convert OpenAI-style messages to Gemini format
function toGeminiContents(messages: Array<{ role: string; content: string }>) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    // Try to get user context from auth token
    let dbContext = "";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

      if (!claimsError && claimsData?.claims?.sub) {
        dbContext = await getOrganizationContext(supabase, claimsData.claims.sub as string);
      }
    }

    const fullSystemPrompt = BASE_SYSTEM_PROMPT + dbContext;

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GOOGLE_GEMINI_API_KEY}`;

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: fullSystemPrompt }],
      },
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;

              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;

              try {
                const geminiChunk = JSON.parse(jsonStr);
                const text = geminiChunk?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  const openaiChunk = {
                    choices: [{ delta: { content: text } }],
                  };
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`)
                  );
                }
              } catch {
                // skip unparseable chunks
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream transform error:", e);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
