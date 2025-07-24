import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401, headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (!user || userError) {
    return new Response(JSON.stringify({ error: "Usuário inválido." }), { status: 401, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const method = req.method;
  const reminderId = url.searchParams.get("id");

  // GET /reminders - listar lembretes
  if (method === "GET") {
    const { data, error } = await supabaseClient
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("remind_at", { ascending: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  }

  // POST /reminders - criar lembrete
  if (method === "POST") {
    const body = await req.json();
    const { title, description, remind_at, is_recurring, recurrence_rule } = body;
    const { data, error } = await supabaseClient
      .from("reminders")
      .insert([{ user_id: user.id, title, description, remind_at, is_recurring, recurrence_rule }])
      .select();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    return new Response(JSON.stringify(data[0]), { status: 201, headers: corsHeaders });
  }

  // PUT /reminders?id=... - atualizar lembrete
  if (method === "PUT" && reminderId) {
    const body = await req.json();
    const { title, description, remind_at, is_recurring, recurrence_rule } = body;
    const { data, error } = await supabaseClient
      .from("reminders")
      .update({ title, description, remind_at, is_recurring, recurrence_rule, updated_at: new Date().toISOString() })
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .select();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    return new Response(JSON.stringify(data[0]), { headers: corsHeaders });
  }

  // DELETE /reminders?id=... - excluir lembrete
  if (method === "DELETE" && reminderId) {
    const { error } = await supabaseClient
      .from("reminders")
      .delete()
      .eq("id", reminderId)
      .eq("user_id", user.id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Método não suportado" }), { status: 405, headers: corsHeaders });
});
