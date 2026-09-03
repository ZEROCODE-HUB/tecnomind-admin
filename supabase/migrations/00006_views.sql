-- =====================================================================
-- Vistas
-- OJO: en 00010 se les fuerza security_invoker. Ver nota de seguridad.
-- =====================================================================


-- Name: account_balance_reconciliation; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.account_balance_reconciliation AS
 SELECT id AS account_id,
    user_id,
    cvu,
    alias,
    balance AS balance_materialized,
    public.calculate_account_balance(id) AS balance_calculated,
    (balance - public.calculate_account_balance(id)) AS difference,
        CASE
            WHEN (abs((balance - public.calculate_account_balance(id))) < 0.01) THEN 'OK'::text
            WHEN (abs((balance - public.calculate_account_balance(id))) < 1.00) THEN 'WARNING'::text
            ELSE 'ERROR'::text
        END AS status,
    updated_at AS last_balance_update,
    ( SELECT count(*) AS count
           FROM public.transactions t
          WHERE (((t.from_account_id = a.id) OR (t.to_account_id = a.id)) AND ((t.status)::text = 'completed'::text))) AS total_transactions
   FROM public.accounts a
  WHERE ((status)::text = 'active'::text);


ALTER VIEW public.account_balance_reconciliation OWNER TO postgres;

--

-- Name: account_movements; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.account_movements AS
 SELECT a.id AS account_id,
    a.user_id,
    t.id AS transaction_id,
    t.created_at,
    t.completed_at,
    t.amount,
    t.concept,
    t.payment_method,
    t.reference_number,
    tt.category,
    tt.name AS transaction_type_name,
        CASE
            WHEN (t.to_account_id = a.id) THEN 'income'::text
            WHEN (t.from_account_id = a.id) THEN 'expense'::text
            ELSE 'other'::text
        END AS movement_type,
        CASE
            WHEN (t.to_account_id = a.id) THEN t.amount
            ELSE (0)::numeric
        END AS income_amount,
        CASE
            WHEN (t.from_account_id = a.id) THEN t.amount
            ELSE (0)::numeric
        END AS expense_amount,
    t.status,
        CASE
            WHEN (t.from_account_id = a.id) THEN COALESCE(t.payment_reference, t.external_holder_name, (( SELECT (((u.first_name)::text || ' '::text) || (u.last_name)::text)
               FROM (public.accounts ta
                 JOIN public.users u ON ((ta.user_id = u.id)))
              WHERE (ta.id = t.to_account_id)))::character varying)
            WHEN (t.to_account_id = a.id) THEN COALESCE(t.payment_reference, t.external_holder_name, (( SELECT (((u.first_name)::text || ' '::text) || (u.last_name)::text)
               FROM (public.accounts ta
                 JOIN public.users u ON ((ta.user_id = u.id)))
              WHERE (ta.id = t.from_account_id)))::character varying)
            ELSE NULL::character varying
        END AS counterpart_name,
    t.payment_reference
   FROM ((public.accounts a
     LEFT JOIN public.transactions t ON (((t.from_account_id = a.id) OR (t.to_account_id = a.id))))
     LEFT JOIN public.transaction_types tt ON ((t.transaction_type_id = tt.id)))
  WHERE ((t.status)::text = 'completed'::text);


ALTER VIEW public.account_movements OWNER TO postgres;

--

-- Name: admin_transaction_list; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.admin_transaction_list AS
 SELECT t.id,
    t.transaction_type_id,
    t.from_account_id,
    t.to_account_id,
    t.external_cvu,
    t.external_cbu,
    t.external_alias,
    t.external_holder_name,
    t.amount,
    t.currency,
    t.concept,
    t.payment_method,
    t.payment_reference,
    t.status,
    t.commission_amount,
    t.net_amount,
    t.processed_by,
    t.failure_reason,
    t.reference_number,
    t.metadata,
    t.initiated_from_device_id,
    t.initiated_from_ip,
    t.created_at,
    t.processing_at,
    t.completed_at,
    t.failed_at,
    fu.first_name AS from_user_first_name,
    fu.last_name AS from_user_last_name,
    fu.email AS from_user_email,
    fu.phone AS from_user_phone,
    fu.dni AS from_user_dni,
    tu.first_name AS to_user_first_name,
    tu.last_name AS to_user_last_name,
    tu.email AS to_user_email,
    tu.phone AS to_user_phone,
    tu.dni AS to_user_dni
   FROM ((((public.transactions t
     LEFT JOIN public.accounts fa ON ((t.from_account_id = fa.id)))
     LEFT JOIN public.users fu ON ((fa.user_id = fu.id)))
     LEFT JOIN public.accounts ta ON ((t.to_account_id = ta.id)))
     LEFT JOIN public.users tu ON ((ta.user_id = tu.id)));


ALTER VIEW public.admin_transaction_list OWNER TO postgres;

--

-- Name: notification_stats_by_user; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.notification_stats_by_user AS
 SELECT user_id,
    count(*) AS total_notifications,
    count(*) FILTER (WHERE (status = 'sent'::text)) AS sent_count,
    count(*) FILTER (WHERE (status = 'delivered'::text)) AS delivered_count,
    count(*) FILTER (WHERE (status = 'opened'::text)) AS opened_count,
    count(*) FILTER (WHERE (status = 'failed'::text)) AS failed_count,
    count(*) FILTER (WHERE (category = 'transaction'::text)) AS transaction_count,
    count(*) FILTER (WHERE (category = 'security'::text)) AS security_count,
    max(sent_at) AS last_notification_sent_at
   FROM public.notification_log nl
  GROUP BY user_id;


ALTER VIEW public.notification_stats_by_user OWNER TO postgres;

--
