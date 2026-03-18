import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Resources that can be accessed via API
const ALLOWED_RESOURCES = ["vehicles", "trips", "fuel_records", "expenses", "maintenance_records"] as const;
type Resource = typeof ALLOWED_RESOURCES[number];

// Scope required per HTTP method
const METHOD_SCOPE: Record<string, string> = {
  GET: "read",
  POST: "write",
  PUT: "write",
  DELETE: "write",
};

// Parse route: /public-api/vehicles or /public-api/vehicles/{id}
function parseRoute(url: URL): { resource: Resource | null; id: string | null } {
  const parts = url.pathname.split("/").filter(Boolean);
  // parts: ["public-api", "resource", "id?"]
  const resourceName = parts[1] || null;
  const id = parts[2] || null;

  if (resourceName && ALLOWED_RESOURCES.includes(resourceName as Resource)) {
    return { resource: resourceName as Resource, id };
  }
  return { resource: null, id: null };
}

// UUID regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate API key using PBKDF2
async function validateApiKey(
  supabase: ReturnType<typeof createClient>,
  apiKey: string
): Promise<{ valid: boolean; organizationId: string | null; scopes: string[] }> {
  const prefix = apiKey.substring(0, 10);

  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, organization_id, key_hash, scopes, expires_at, is_active")
    .eq("key_prefix", prefix)
    .eq("is_active", true);

  if (error || !keys || keys.length === 0) {
    return { valid: false, organizationId: null, scopes: [] };
  }

  for (const key of keys) {
    // Check expiry
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      continue;
    }

    // Verify PBKDF2 hash
    const [saltHex, storedHash] = key.key_hash.split(":");
    if (!saltHex || !storedHash) continue;

    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(apiKey),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const computedHash = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedHash === storedHash) {
      // Update last_used_at
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", key.id);

      return { valid: true, organizationId: key.organization_id, scopes: key.scopes || [] };
    }
  }

  return { valid: false, organizationId: null, scopes: [] };
}

// Fields allowed for create/update per resource
const WRITABLE_FIELDS: Record<Resource, string[]> = {
  vehicles: ["prefix", "plate", "model", "brand", "year", "color", "chassis", "renavam", "fuel_type", "tank_capacity", "current_km", "current_hours", "status", "notes", "acquisition_date", "acquisition_value"],
  trips: ["vehicle_id", "driver_id", "origin", "destination", "start_date", "end_date", "start_km", "end_km", "freight_value", "cargo_type", "tonnage", "client_name", "invoice_number", "status", "notes"],
  fuel_records: ["vehicle_id", "driver_id", "trip_id", "fuel_date", "liters", "price_per_liter", "total_value", "odometer", "gas_station", "city", "state", "fuel_type", "payment_method", "receipt_number", "notes"],
  expenses: ["vehicle_id", "driver_id", "trip_id", "expense_type", "description", "value", "expense_date", "due_date", "supplier", "invoice_number", "payment_method", "status", "notes"],
  maintenance_records: ["vehicle_id", "maintenance_type", "description", "entry_date", "exit_date", "entry_km", "exit_km", "service_provider", "parts_cost", "labor_cost", "total_cost", "status", "next_maintenance_date", "next_maintenance_km", "notes"],
};

function sanitizeBody(resource: Resource, body: Record<string, unknown>): Record<string, unknown> {
  const allowed = WRITABLE_FIELDS[resource];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      sanitized[key] = body[key];
    }
  }
  return sanitized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing configuration");
    }

    // Extract API key from header
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || !apiKey.startsWith("sk_")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid API key. Use x-api-key header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to validate API key (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { valid, organizationId, scopes } = await validateApiKey(serviceClient, apiKey);

    if (!valid || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check scope
    const requiredScope = METHOD_SCOPE[req.method] || "read";
    if (!scopes.includes(requiredScope) && !scopes.includes("admin")) {
      return new Response(
        JSON.stringify({ error: `Insufficient permissions. Required scope: ${requiredScope}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse route
    const url = new URL(req.url);
    const { resource, id } = parseRoute(url);

    if (!resource) {
      return new Response(
        JSON.stringify({
          error: "Invalid resource",
          available_resources: [...ALLOWED_RESOURCES],
          usage: "/public-api/{resource} or /public-api/{resource}/{id}",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (id && !UUID_REGEX.test(id)) {
      return new Response(
        JSON.stringify({ error: "Invalid resource ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle CRUD operations
    const method = req.method;

    // GET - List or Get by ID
    if (method === "GET") {
      let query = serviceClient.from(resource).select("*").eq("organization_id", organizationId);

      if (id) {
        query = query.eq("id", id);
        const { data, error } = await query.single();
        if (error) {
          return new Response(
            JSON.stringify({ error: "Resource not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Pagination
      const page = parseInt(url.searchParams.get("page") || "1");
      const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "50"), 100);
      const offset = (page - 1) * perPage;

      // Ordering - validate against allowed columns to prevent column enumeration
      const ALLOWED_ORDER_COLUMNS = ["created_at", "updated_at", "status"];
      const requestedOrder = url.searchParams.get("order_by") || "created_at";
      const orderBy = ALLOWED_ORDER_COLUMNS.includes(requestedOrder) ? requestedOrder : "created_at";
      const orderDir = url.searchParams.get("order_dir") === "asc" ? true : false;

      // Status filter
      const status = url.searchParams.get("status");
      if (status) {
        query = query.eq("status", status);
      }

      query = query.order(orderBy, { ascending: orderDir }).range(offset, offset + perPage - 1);

      const { data, error, count } = await query;
      if (error) {
        console.error("Query error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch data" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          data,
          pagination: { page, per_page: perPage, total: count },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - Create
    if (method === "POST") {
      if (id) {
        return new Response(
          JSON.stringify({ error: "POST does not accept an ID in the URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const sanitized = sanitizeBody(resource, body);
      sanitized.organization_id = organizationId;

      const { data, error } = await serviceClient.from(resource).insert(sanitized).select().single();

      if (error) {
        console.error("Insert error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create resource" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - Update
    if (method === "PUT") {
      if (!id) {
        return new Response(
          JSON.stringify({ error: "PUT requires a resource ID: /public-api/{resource}/{id}" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const sanitized = sanitizeBody(resource, body);

      const { data, error } = await serviceClient
        .from(resource)
        .update(sanitized)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update resource" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE
    if (method === "DELETE") {
      if (!id) {
        return new Response(
          JSON.stringify({ error: "DELETE requires a resource ID: /public-api/{resource}/{id}" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await serviceClient
        .from(resource)
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) {
        console.error("Delete error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete resource" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Public API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
