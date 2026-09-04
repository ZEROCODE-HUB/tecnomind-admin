// =====================================================================
// Proxy de ZapSign (KYC) del lado servidor
//
// La app llamaba a la API de ZapSign directamente, con la API key
// incrustada en el binario. Cualquiera que abriera el APK la extraía.
// Acá la key vive SOLO en el entorno de la función (Deno.env). La app le
// pide a esta función —con su JWT— y la función habla con ZapSign.
//
// La firma del JWT la valida Supabase antes de invocar esta función
// (verify_jwt = true), así que no hace falta el SDK: solo se decodifica el
// payload para exigir que sea un usuario autenticado y no el anon key.
//
// Secrets del proyecto (Management API / dashboard):
//   ZAPSIGN_API_KEY, ZAPSIGN_TEMPLATE_ID,
//   ZAPSIGN_BASE_URL (opcional), ZAPSIGN_SELFIE_VALIDATION_TYPE (opcional)
// =====================================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const API_KEY = Deno.env.get("ZAPSIGN_API_KEY") ?? "";
const TEMPLATE_ID = Deno.env.get("ZAPSIGN_TEMPLATE_ID") ?? "";
const BASE_URL = Deno.env.get("ZAPSIGN_BASE_URL") ?? "https://sandbox.api.zapsign.com.br";
const SELFIE_VALIDATION = Deno.env.get("ZAPSIGN_SELFIE_VALIDATION_TYPE") ?? "";
const IS_PROD = BASE_URL.includes("://api.zapsign");

/** Rol del JWT ya validado por Supabase. Solo interesa distinguir usuario de anon. */
function rolDelToken(authHeader: string): string | null {
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload.role ?? null;
  } catch {
    return null;
  }
}

async function zapsign(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY.trim()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  // El auth se chequea ANTES que la config: un no-autenticado no debe
  // poder ni averiguar si ZapSign está configurado. La firma ya la validó
  // Supabase (verify_jwt); acá solo se mira el rol del payload.
  const rol = rolDelToken(req.headers.get("Authorization") ?? "");
  if (rol !== "authenticated") return json({ error: "No autenticado" }, 401);

  if (!API_KEY || !TEMPLATE_ID) {
    return json({ error: "ZapSign no está configurado en el servidor." }, 503);
  }

  let payload: { action?: string; [k: string]: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  // Acciones nombradas, no un passthrough de path arbitrario.
  switch (payload.action) {
    case "create-doc": {
      const name = String(payload.name ?? "").trim();
      const email = String(payload.email ?? "").trim().toLowerCase();
      if (!name || !email) return json({ error: "Faltan name/email" }, 400);

      const body = {
        template_id: TEMPLATE_ID,
        signer_name: name,
        send_automatic_email: false,
        signers: [
          {
            name,
            email,
            auth_mode: "assinaturaTela",
            send_automatic_email: true,
            require_selfie_photo: IS_PROD,
            require_document_photo: true,
            ...(SELFIE_VALIDATION ? { selfie_validation_type: SELFIE_VALIDATION } : {}),
          },
        ],
        data: [
          { de: "{{Nombre}}", para: name },
          { de: "{{Email}}", para: email },
        ],
      };
      const r = await zapsign("/api/v1/models/create-doc/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return json(r.data, r.ok ? 200 : r.status);
    }

    case "get-doc": {
      const token = String(payload.docToken ?? "");
      if (!token) return json({ error: "Falta docToken" }, 400);
      const r = await zapsign(`/api/v1/docs/${token}/`, { method: "GET" });
      return json(r.data, r.ok ? 200 : r.status);
    }

    case "get-signer-validation": {
      const token = String(payload.signerToken ?? "");
      if (!token) return json({ error: "Falta signerToken" }, 400);
      const r = await zapsign(`/api/v1/signer-verification-details/${token}/`, {
        method: "GET",
      });
      return json(r.data, r.ok ? 200 : r.status);
    }

    default:
      return json({ error: `Acción desconocida: ${payload.action}` }, 400);
  }
});
