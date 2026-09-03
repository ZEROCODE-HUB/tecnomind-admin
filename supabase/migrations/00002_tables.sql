-- =====================================================================
-- Tablas y secuencias
-- Reconstruido desde el backup de Magnate, sin modificar.
-- =====================================================================


-- Name: account_alias_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_alias_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    old_alias character varying(50) NOT NULL,
    new_alias character varying(50) NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    changed_by_device_id uuid
);


ALTER TABLE public.account_alias_history OWNER TO postgres;

--

-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    account_type_id uuid NOT NULL,
    cbu character varying(22) NOT NULL,
    cvu character varying(22) NOT NULL,
    alias character varying(50) NOT NULL,
    balance numeric(15,2) DEFAULT 0.00,
    status character varying(20) DEFAULT 'active'::character varying,
    status_reason text,
    is_primary boolean DEFAULT false,
    account_number integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    CONSTRAINT accounts_balance_check CHECK ((balance >= (0)::numeric)),
    CONSTRAINT accounts_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'blocked'::character varying, 'suspended'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.accounts OWNER TO postgres;

--

-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_type_id uuid NOT NULL,
    from_account_id uuid,
    to_account_id uuid,
    external_cvu character varying(22),
    external_cbu character varying(22),
    external_alias character varying(50),
    external_holder_name character varying(200),
    amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'ARS'::character varying,
    concept character varying(255),
    payment_method character varying(50),
    payment_reference character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying,
    commission_amount numeric(15,2) DEFAULT 0.00,
    net_amount numeric(15,2),
    processed_by character varying(50),
    failure_reason text,
    reference_number character varying(100),
    metadata jsonb,
    initiated_from_device_id uuid,
    initiated_from_ip inet,
    created_at timestamp with time zone DEFAULT now(),
    processing_at timestamp with time zone,
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    CONSTRAINT check_has_internal_account CHECK (((from_account_id IS NOT NULL) OR (to_account_id IS NOT NULL))),
    CONSTRAINT transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'reversed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--

-- Name: account_balance_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_balance_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    balance numeric(15,2) NOT NULL,
    snapshot_date date NOT NULL,
    transaction_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.account_balance_snapshots OWNER TO postgres;

--

-- Name: account_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    monthly_limit numeric(15,2) DEFAULT 800000.00,
    monthly_spent numeric(15,2) DEFAULT 0.00,
    monthly_available numeric(15,2) GENERATED ALWAYS AS ((monthly_limit - monthly_spent)) STORED,
    current_period_start date DEFAULT date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone),
    current_period_end date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) + '1 mon -1 days'::interval),
    daily_limit numeric(15,2),
    daily_spent numeric(15,2) DEFAULT 0.00,
    per_transaction_limit numeric(15,2),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.account_limits OWNER TO postgres;

--

-- Name: transaction_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transaction_types OWNER TO postgres;

--

-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    dni character varying(20) NOT NULL,
    cuit_cuil character varying(20) NOT NULL,
    pin_hash character varying(255) NOT NULL,
    web_access_enabled boolean DEFAULT false,
    web_password_hash character varying(255),
    web_access_enabled_at timestamp with time zone,
    verification_status character varying(20) DEFAULT 'pending'::character varying,
    zapsign_verification_id character varying(255),
    zapsign_verified_at timestamp with time zone,
    zapsign_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    photo_url text,
    role text DEFAULT 'user'::text NOT NULL,
    zapsign_contract_url text,
    CONSTRAINT users_verification_status_check CHECK (((verification_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('verified'::character varying)::text, ('suspended'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--

-- Name: account_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    currency character varying(3) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    allows_overdraft boolean DEFAULT false,
    overdraft_limit numeric(15,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.account_types OWNER TO postgres;

--

-- Name: api_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_enabled boolean DEFAULT false,
    client_id character varying(100) NOT NULL,
    api_password_hash character varying(255),
    allowed_ips text[],
    rate_limit_per_minute integer DEFAULT 60,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    enabled_at timestamp with time zone,
    last_used_at timestamp with time zone
);


ALTER TABLE public.api_access OWNER TO postgres;

--

-- Name: api_credential_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_credential_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_access_id uuid NOT NULL,
    user_id uuid NOT NULL,
    change_type character varying(50) NOT NULL,
    old_value text,
    new_value text,
    changed_from_ip inet,
    changed_from_device_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT api_credential_history_change_type_check CHECK (((change_type)::text = ANY ((ARRAY['client_id_changed'::character varying, 'password_changed'::character varying, 'whitelist_updated'::character varying, 'enabled'::character varying, 'disabled'::character varying])::text[])))
);


ALTER TABLE public.api_credential_history OWNER TO postgres;

--

-- Name: api_request_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_request_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_access_id uuid NOT NULL,
    endpoint character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    status_code integer,
    response_time_ms integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.api_request_logs OWNER TO postgres;

--

-- Name: app_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_versions (
    id bigint NOT NULL,
    version text NOT NULL,
    build_number integer,
    platform text NOT NULL,
    mandatory boolean DEFAULT false,
    store_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT app_versions_platform_check CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text])))
);


ALTER TABLE public.app_versions OWNER TO postgres;

--

-- Name: balance_corrections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_corrections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    old_balance numeric(15,2) NOT NULL,
    new_balance numeric(15,2) NOT NULL,
    difference numeric(15,2) NOT NULL,
    correction_reason character varying(100) NOT NULL,
    corrected_at timestamp with time zone DEFAULT now() NOT NULL,
    corrected_by character varying(50) DEFAULT 'system'::character varying,
    metadata jsonb
);


ALTER TABLE public.balance_corrections OWNER TO postgres;

--

-- Name: email_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    code_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_otps OWNER TO postgres;

--

-- Name: notification_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notification_type text NOT NULL,
    category text,
    onesignal_notification_id text,
    player_ids text[],
    title text,
    message text,
    data jsonb,
    related_transaction_id uuid,
    related_account_id uuid,
    status text DEFAULT 'sent'::text,
    sent_at timestamp with time zone DEFAULT now(),
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    error_details jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_log_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'delivered'::text, 'failed'::text, 'opened'::text, 'cancelled'::text])))
);


ALTER TABLE public.notification_log OWNER TO postgres;

--

-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    user_id uuid NOT NULL,
    push_enabled boolean DEFAULT true,
    transactions_received_enabled boolean DEFAULT true,
    transactions_sent_enabled boolean DEFAULT true,
    security_alerts_enabled boolean DEFAULT true,
    account_updates_enabled boolean DEFAULT true,
    marketing_enabled boolean DEFAULT false,
    quiet_hours_enabled boolean DEFAULT false,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--

-- Name: notification_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_types (
    code text NOT NULL,
    name text NOT NULL,
    description text,
    priority integer DEFAULT 5,
    template_title jsonb,
    template_message jsonb,
    default_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    email_template_html jsonb
);


ALTER TABLE public.notification_types OWNER TO postgres;

--

-- Name: qr_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    qr_data text NOT NULL,
    qr_hash character varying(64),
    qr_type character varying(20) DEFAULT 'static'::character varying,
    amount numeric(15,2),
    concept character varying(255),
    expires_at timestamp with time zone,
    max_uses integer,
    is_active boolean DEFAULT true,
    times_used integer DEFAULT 0,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT qr_codes_qr_type_check CHECK (((qr_type)::text = ANY ((ARRAY['static'::character varying, 'dynamic'::character varying])::text[])))
);


ALTER TABLE public.qr_codes OWNER TO postgres;

--

-- Name: support; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    email text,
    phone text
);


ALTER TABLE public.support OWNER TO postgres;

--

-- Name: user_auth_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_auth_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    auto_password_encrypted text NOT NULL,
    encryption_key_id character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_auth_credentials OWNER TO postgres;

--

-- Name: user_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id character varying(255) NOT NULL,
    device_name character varying(100),
    device_type character varying(50),
    device_model character varying(100),
    device_os_version character varying(50),
    app_version character varying(20),
    session_token character varying(500),
    refresh_token character varying(500),
    last_active_at timestamp with time zone DEFAULT now(),
    last_ip_address inet,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    deactivated_at timestamp with time zone,
    player_id text,
    push_enabled boolean DEFAULT true,
    platform text,
    biometric_enabled boolean DEFAULT false,
    os_version text,
    push_token text,
    status text DEFAULT 'active'::text,
    is_primary boolean DEFAULT false,
    revoked_at timestamp with time zone,
    revoke_reason text,
    registered_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_devices_platform_check CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text])))
);


ALTER TABLE public.user_devices OWNER TO postgres;

--

-- Name: worker_invocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.worker_invocations (
    id boolean DEFAULT true NOT NULL,
    last_invoked_at timestamp with time zone DEFAULT now(),
    CONSTRAINT single_row CHECK ((id = true))
);


ALTER TABLE public.worker_invocations OWNER TO postgres;

--

-- Name: app_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.app_versions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.app_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--

-- Name: support_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.support ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.support_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
