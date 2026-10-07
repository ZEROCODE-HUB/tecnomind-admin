-- =====================================================================
-- 00066_backoffice_clients_kyb_status.sql
-- La vista `backoffice_clients` ya exponía `facial_status` (paso 2) pero no el
-- estado del formulario KYB (paso 1), que vive en `kyb_submissions.status`. El
-- padrón de clientes del admin solo lee esta vista, así que para mostrar KYB y
-- Facial como columnas separadas (además del estado general `verification_status`)
-- hace falta que la vista traiga también el estado del KYB.
--
-- Se agrega `kyb_status` al final (CREATE OR REPLACE solo permite columnas nuevas
-- al final; el resto queda idéntico a la definición vigente). `kyb_submissions`
-- tiene a `user_id` como PRIMARY KEY, así que el LEFT JOIN es 1:1 y no multiplica
-- filas. La vista NO es security_invoker (reloptions = null): se mantiene así, por
-- lo que el JOIN lee kyb_submissions con los privilegios del dueño de la vista.
-- =====================================================================

create or replace view public.backoffice_clients as
 SELECT u.id,
    (u.first_name::text || ' '::text) || u.last_name::text AS full_name,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.document_type,
    u.document_number,
    u.tax_id,
    u.country_code,
    u.verification_status,
    u.role,
    es_operador_backoffice(u.id) AS is_operator,
    u.created_at,
    a.id AS account_id,
    a.account_number,
    a.alias,
    a.balance,
    a.status AS account_status,
    a.status_reason AS account_status_reason,
    cr.status AS compliance_status,
    cr.notes AS compliance_notes,
    cr.reviewed_at AS compliance_reviewed_at,
    k.score AS kyc_score,
    k.provider AS kyc_provider,
    k.status AS kyc_status,
    k.verified_at AS kyc_verified_at,
    u.facial_status,
    ks.status AS kyb_status
   FROM users u
     LEFT JOIN accounts a ON a.user_id = u.id AND a.is_primary
     LEFT JOIN compliance_reviews cr ON cr.user_id = u.id
     LEFT JOIN LATERAL ( SELECT kv.score,
            kv.provider,
            kv.status,
            kv.verified_at
           FROM kyc_verifications kv
          WHERE kv.user_id = u.id
          ORDER BY kv.created_at DESC
         LIMIT 1) k ON true
     LEFT JOIN kyb_submissions ks ON ks.user_id = u.id;
