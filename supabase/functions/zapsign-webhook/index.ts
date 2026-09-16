// Webhook de ZapSign: recibe el POST cuando un documento se firma/concluye y
// registra server-side que ese email completó la verificación de identidad.
//
// Deploy SIN verify_jwt (ZapSign no manda JWT de Supabase). Se protege con un
// secreto en la query (?s=...) que solo nosotros conocemos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET = Deno.env.get("ZAPSIGN_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "GET") {
    // Ping simple para probar que el endpoint está vivo (sin exponer nada).
    return new Response("zapsign-webhook ok", { status: 200 });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Secreto en la query para que no lo llame cualquiera.
  const url = new URL(req.url);
  const s = url.searchParams.get("s") ?? "";
  if (!SECRET || s !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  if (!body) return new Response("bad request", { status: 400 });

  // Extracción best-effort del payload (guardamos el raw completo igual, así
  // afinamos el parseo cuando veamos la forma real del evento).
  const doc = body.document ?? body;
  const docToken = doc?.token ?? body?.doc_token ?? null;
  const status = doc?.status ?? body?.status ?? null;
  const event = body?.event_type ?? body?.event ?? body?.type ?? null;
  const signers = doc?.signers ?? body?.signers ?? [];
  const firstSigner = Array.isArray(signers) && signers.length ? signers[0] : null;
  const email = firstSigner?.email ?? body?.email ?? null;
  const signerName = firstSigner?.name ?? body?.name ?? null;

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await supabase.from("kyc_completions").insert({
      email,
      doc_token: docToken,
      event,
      status,
      signer_name: signerName,
      raw: body,
    });
    if (error) {
      console.error("[zapsign-webhook] insert error:", error);
      return new Response("db error", { status: 500 });
    }
  } catch (e) {
    console.error("[zapsign-webhook] error:", e);
    return new Response("error", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
