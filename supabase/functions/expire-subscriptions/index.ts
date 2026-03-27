import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    expiredCount += expiredTrials?.length || 0;

    // 2. Expire canceled_active_until_end that have passed subscription_ends_at
    const { data: expiredCanceled, error: canceledError } = await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "expired", updated_at: now })
      .eq("subscription_status", "canceled_active_until_end")
      .lt("subscription_ends_at", now)
      .select("id, name");

    if (canceledError) console.error("Error expiring canceled:", canceledError.message);
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
