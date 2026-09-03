import { supabase } from "./supabase";

/**
 * Servicio de autenticación de la app.
 *
 * La credencial de Supabase Auth ES el PIN: una sola fuente de verdad,
 * guardada con bcrypt por Supabase. No se replica en `users.pin_hash` ni
 * se guardan contraseñas reversibles. Ver 00021_autenticacion_app.sql.
 */

export type RegistroDatos = {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  cuit: string;
};

export type ResultadoAuth = { ok: true } | { ok: false; error: string };

/** Normaliza para comparar y guardar: el email nunca distingue mayúsculas. */
const normalizarEmail = (email: string) => email.trim().toLowerCase();

/** Quita puntos y guiones de documentos y CUIT antes de guardarlos. */
export const soloDigitos = (valor: string) => valor.replace(/\D/g, "");

/**
 * Verifica si la cuenta está bloqueada por intentos fallidos.
 * Responde igual para cuentas inexistentes, para no filtrar quién existe.
 */
export async function estadoBloqueo(email: string) {
  const { data, error } = await supabase.rpc("check_login_blocked", {
    p_email: normalizarEmail(email),
  });
  if (error || !data?.length) return { bloqueado: false, intentosRestantes: 5, esperaSegundos: 0 };
  const fila = data[0];
  return {
    bloqueado: fila.blocked,
    intentosRestantes: fila.attempts_left,
    esperaSegundos: fila.retry_after_seconds,
  };
}

export async function iniciarSesion(email: string, pin: string): Promise<ResultadoAuth> {
  const correo = normalizarEmail(email);

  const bloqueo = await estadoBloqueo(correo);
  if (bloqueo.bloqueado) {
    const minutos = Math.ceil(bloqueo.esperaSegundos / 60);
    return {
      ok: false,
      error: `Demasiados intentos fallidos. Probá de nuevo en ${minutos} minuto${minutos === 1 ? "" : "s"}.`,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: pin });

  await supabase.rpc("record_login_attempt", {
    p_email: correo,
    p_success: !error,
    p_failure_reason: error?.message ?? null,
  });

  if (!error) return { ok: true };

  // Mensaje deliberadamente ambiguo: decir "ese email no existe" permite
  // enumerar clientes.
  const restantes = bloqueo.intentosRestantes - 1;
  const aviso = restantes > 0 && restantes <= 2 ? ` Te quedan ${restantes} intentos.` : "";
  return { ok: false, error: `Email o PIN incorrectos.${aviso}` };
}

export async function registrar(datos: RegistroDatos, pin: string): Promise<ResultadoAuth> {
  const correo = normalizarEmail(datos.email);
  const documento = soloDigitos(datos.dni);
  const cuit = soloDigitos(datos.cuit);

  const { data: disponible, error: errorChequeo } = await supabase.rpc("can_register", {
    p_email: correo,
    p_document_number: documento,
    p_tax_id: cuit,
  });
  if (errorChequeo) return { ok: false, error: "No se pudo validar los datos. Intentá de nuevo." };
  if (!disponible) {
    return { ok: false, error: "Ya existe una cuenta con esos datos. Si es tuya, iniciá sesión." };
  }

  // El PIN es la contraseña. El trigger on_auth_user_created lee esta
  // metadata para crear el perfil, la cuenta bancaria, los límites y el QR.
  const { error } = await supabase.auth.signUp({
    email: correo,
    password: pin,
    options: {
      data: {
        nombres: datos.nombres.trim(),
        apellidos: datos.apellidos.trim(),
        telefono: datos.telefono.trim(),
        dni: documento,
        cuit,
        tipo_documento: "DNI",
        pais: "AR",
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { ok: false, error: "Ya existe una cuenta con ese email." };
    }
    if (error.message.includes("Password")) {
      return { ok: false, error: "El PIN no cumple los requisitos mínimos." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}
