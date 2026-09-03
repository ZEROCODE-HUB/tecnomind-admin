-- =====================================================================
-- Funciones
-- 54 funciones: lógica de transferencias, límites, saldos, QR, dispositivos y notificaciones.
-- =====================================================================


-- Name: archive_old_api_logs(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.archive_old_api_logs() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Eliminar logs de API de más de 6 meses
  DELETE FROM api_request_logs
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Logs antiguos eliminados: %', v_count;
END;
$$;


ALTER FUNCTION public.archive_old_api_logs() OWNER TO postgres;

--

-- Name: calculate_account_balance(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_account_balance(p_account_id uuid) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_balance NUMERIC := 0.00;
  v_incoming NUMERIC := 0.00;
  v_outgoing NUMERIC := 0.00;
BEGIN
  -- Sumar todas las entradas (dinero que entra)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_incoming
  FROM transactions
  WHERE to_account_id = p_account_id
    AND status = 'completed';
  
  -- Sumar todas las salidas (dinero que sale)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_outgoing
  FROM transactions
  WHERE from_account_id = p_account_id
    AND status = 'completed';
  
  v_balance := v_incoming - v_outgoing;
  
  RETURN v_balance;
END;
$$;


ALTER FUNCTION public.calculate_account_balance(p_account_id uuid) OWNER TO postgres;

--

-- Name: calculate_net_amount(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_net_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.net_amount := NEW.amount - COALESCE(NEW.commission_amount, 0);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_net_amount() OWNER TO postgres;

--

-- Name: check_device_registered(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_device_registered(p_user_id text, p_device_id text) RETURNS TABLE(is_registered boolean, device_record_id uuid, is_active boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        TRUE AS is_registered,
        ud.id AS device_record_id,
        ud.is_active AS is_active
    FROM public.user_devices ud
    WHERE ud.user_id = p_user_id::uuid
      AND ud.device_id = p_device_id
      AND ud.status != 'revoked'
      AND ud.is_active = TRUE
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.check_device_registered(p_user_id text, p_device_id text) OWNER TO postgres;

--

-- Name: check_qr_validity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_qr_validity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Desactivar si se alcanzó el máximo de usos
  IF NEW.max_uses IS NOT NULL AND NEW.times_used >= NEW.max_uses THEN
    NEW.is_active := false;
  END IF;
  
  -- Desactivar si expiró
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_qr_validity() OWNER TO postgres;

--

-- Name: check_user_exists(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_user_exists(p_dni text DEFAULT NULL::text, p_cuit text DEFAULT NULL::text, p_email text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_exists BOOLEAN := FALSE;
  v_fields TEXT[] := '{}';
BEGIN
  -- Check DNI
  IF p_dni IS NOT NULL AND p_dni <> '' THEN
    IF EXISTS (SELECT 1 FROM public.users WHERE dni = p_dni) THEN
      v_exists := TRUE;
      v_fields := array_append(v_fields, 'DNI');
    END IF;
  END IF;

  -- Check CUIT/CUIL
  IF p_cuit IS NOT NULL AND p_cuit <> '' THEN
    IF EXISTS (SELECT 1 FROM public.users WHERE cuit_cuil = p_cuit) THEN
      v_exists := TRUE;
      v_fields := array_append(v_fields, 'CUIT');
    END IF;
  END IF;

  -- Check Email
  IF p_email IS NOT NULL AND p_email <> '' THEN
    IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
      v_exists := TRUE;
      v_fields := array_append(v_fields, 'Email');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'exists', v_exists,
    'fields', v_fields
  );
END;
$$;


ALTER FUNCTION public.check_user_exists(p_dni text, p_cuit text, p_email text) OWNER TO postgres;

--

-- Name: claim_device(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.claim_device(p_player_id text, p_device_id text, p_device_data jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  -- 1. Eliminar registro previo (si existe) para evitar conflictos de player_id
  delete from public.user_devices 
  where player_id = p_player_id;

  -- 2. Insertar nuevo registro con todos los campos disponibles
  insert into public.user_devices (
    user_id,
    device_id,
    player_id,
    platform,
    device_name,
    device_model,
    device_type,
    device_os_version,
    os_version,
    app_version,
    push_enabled,
    push_token,
    is_active,
    status,
    is_primary,
    biometric_enabled,
    last_ip_address,
    last_active_at,
    registered_at
  ) values (
    current_user_id,
    p_device_id,
    p_player_id,
    p_device_data->>'platform',
    p_device_data->>'device_name',
    p_device_data->>'device_model',
    p_device_data->>'device_type',
    p_device_data->>'device_os_version',
    p_device_data->>'os_version',
    p_device_data->>'app_version',
    COALESCE((p_device_data->>'push_enabled')::boolean, true),
    p_device_data->>'push_token',
    COALESCE((p_device_data->>'is_active')::boolean, true),
    COALESCE(p_device_data->>'status', 'active'),
    COALESCE((p_device_data->>'is_primary')::boolean, false),
    COALESCE((p_device_data->>'biometric_enabled')::boolean, false),
    (p_device_data->>'last_ip_address')::inet,
    now(),
    now()
  );
end;
$$;


ALTER FUNCTION public.claim_device(p_player_id text, p_device_id text, p_device_data jsonb) OWNER TO postgres;

--

-- Name: claim_onesignal_device(text, text, uuid, text, boolean, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.claim_onesignal_device(p_player_id text, p_device_id text, p_user_id uuid, p_platform text, p_push_enabled boolean, p_device_os_version text, p_app_version text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 1. Libera (nullify) cualquier dispositivo que estuviera usando este player_id
    UPDATE user_devices
    SET player_id = NULL
    WHERE player_id = p_player_id
      AND (user_id != p_user_id OR device_id != p_device_id);

    -- 2. Actualiza o Inserta el dispositivo para el usuario actual
    INSERT INTO user_devices (
        user_id,
        device_id,
        player_id,
        platform,
        push_enabled,
        device_os_version,
        app_version,
        is_active,
        last_active_at
    )
    VALUES (
        p_user_id,
        p_device_id,
        p_player_id,
        p_platform,
        p_push_enabled,
        p_device_os_version,
        p_app_version,
        TRUE,
        now()
    )
    ON CONFLICT (user_id, device_id)
    DO UPDATE SET
        player_id = EXCLUDED.player_id,
        platform = EXCLUDED.platform,
        push_enabled = EXCLUDED.push_enabled,
        device_os_version = EXCLUDED.device_os_version,
        app_version = EXCLUDED.app_version,
        is_active = TRUE,
        last_active_at = now();
END;
$$;


ALTER FUNCTION public.claim_onesignal_device(p_player_id text, p_device_id text, p_user_id uuid, p_platform text, p_push_enabled boolean, p_device_os_version text, p_app_version text) OWNER TO postgres;

--

-- Name: cleanup_inactive_devices(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_inactive_devices() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Desactivar dispositivos sin actividad por más de 90 días
  UPDATE user_devices
  SET 
    is_active = false,
    deactivated_at = NOW(),
    session_token = NULL,
    refresh_token = NULL
  WHERE 
    is_active = true
    AND last_active_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Dispositivos inactivos desactivados: %', v_count;
END;
$$;


ALTER FUNCTION public.cleanup_inactive_devices() OWNER TO postgres;

--

-- Name: create_daily_balance_snapshots(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_daily_balance_snapshots() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_count INTEGER;
BEGIN
  -- Insertar snapshot de todas las cuentas activas
  INSERT INTO account_balance_snapshots (
    account_id,
    balance,
    snapshot_date,
    transaction_count
  )
  SELECT 
    a.id,
    a.balance,
    v_yesterday,
    (SELECT COUNT(*) FROM transactions t 
     WHERE (t.from_account_id = a.id OR t.to_account_id = a.id)
       AND DATE(t.created_at) = v_yesterday
       AND t.status = 'completed')
  FROM accounts a
  WHERE a.status = 'active'
  ON CONFLICT (account_id, snapshot_date) DO UPDATE
  SET 
    balance = EXCLUDED.balance,
    transaction_count = EXCLUDED.transaction_count;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Snapshots creados: % cuentas para fecha: %', v_count, v_yesterday;
END;
$$;


ALTER FUNCTION public.create_daily_balance_snapshots() OWNER TO postgres;

--

-- Name: create_default_notification_preferences(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_default_notification_preferences() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_default_notification_preferences() OWNER TO postgres;

--

-- Name: create_user_bank_account(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_user_bank_account(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$DECLARE
  v_account_id UUID;
  v_account_type_id UUID;
  v_cbu VARCHAR(22);
  v_cvu VARCHAR(22);
  v_alias VARCHAR(50);
  v_user_dni VARCHAR; -- Cambiamos variable a DNI
  v_qr_id UUID;
  v_qr_hash VARCHAR(64);
  v_qr_data TEXT;
  v_result JSONB;
  v_account_count INTEGER;
BEGIN
  -- Verificar que el usuario no tenga ya una cuenta
  SELECT COUNT(*) INTO v_account_count
  FROM accounts
  WHERE user_id = p_user_id;
  
  IF v_account_count > 0 THEN
    RAISE EXCEPTION 'USER_HAS_ACCOUNT: El usuario ya tiene una cuenta bancaria';
  END IF;

  -- 1. Obtener el DNI del usuario
  SELECT dni INTO v_user_dni
  FROM users 
  WHERE id = p_user_id;

  -- Validación por seguridad (aunque tu tabla dice NOT NULL, es buena práctica)
  IF v_user_dni IS NULL THEN
     RAISE EXCEPTION 'USER_DNI_MISSING: El usuario no tiene DNI asignado';
  END IF;
  
  -- Obtener el tipo de cuenta por defecto
  SELECT id INTO v_account_type_id
  FROM account_types
  WHERE code = 'savings_ars' AND is_active = true
  LIMIT 1;
  
  IF v_account_type_id IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_NOT_FOUND: Tipo de cuenta no encontrado';
  END IF;
  
  -- Generar CBU y CVU únicos
  v_cbu := generate_unique_cbu();
  v_cvu := generate_unique_cvu();
  
  -- 2. Generar el ALIAS con el formato magnate.DNI
  -- IMPORTANTE: Usamos REPLACE para quitar puntos si el DNI viene formateado (ej: 30.123.456 -> 30123456)
  v_alias := 'magnate.' || REPLACE(v_user_dni, '.', '');
  
  -- Crear la cuenta bancaria
  INSERT INTO accounts (
    user_id,
    account_type_id,
    cbu,
    cvu,
    alias,
    balance,
    status,
    is_primary,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_account_type_id,
    v_cbu,
    v_cvu,
    v_alias,
    0.00,
    'active',
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO v_account_id;
  
  -- Crear límites de la cuenta
  INSERT INTO account_limits (
    account_id,
    monthly_limit,
    monthly_spent,
    daily_limit,
    daily_spent,
    per_transaction_limit,
    current_period_start,
    current_period_end,
    updated_at
  ) VALUES (
    v_account_id,
    800000.00,
    0.00,
    50000.00,
    0.00,
    100000.00,
    date_trunc('month', CURRENT_DATE)::DATE,
    (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::DATE,
    NOW()
  );
  
  -- Generar datos del QR
  v_qr_data := jsonb_build_object(
    'account_id', v_account_id,
    'cvu', v_cvu,
    'cbu', v_cbu,
    'alias', v_alias,
    'type', 'static'
  )::TEXT;
  
  -- Generar hash
  v_qr_hash := replace(gen_random_uuid()::TEXT, '-', '');
  
  -- Crear código QR estático
  INSERT INTO qr_codes (
    account_id,
    qr_data,
    qr_hash,
    qr_type,
    amount,
    concept,
    expires_at,
    max_uses,
    is_active,
    times_used,
    created_at,
    updated_at
  ) VALUES (
    v_account_id,
    v_qr_data,
    v_qr_hash,
    'static',
    NULL,
    'Pago con QR',
    NULL,
    NULL,
    true,
    0,
    NOW(),
    NOW()
  ) RETURNING id INTO v_qr_id;
  
  -- Construir respuesta
  v_result := jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'cbu', v_cbu,
    'cvu', v_cvu,
    'alias', v_alias,
    'balance', 0.00,
    'qr_id', v_qr_id,
    'qr_hash', v_qr_hash,
    'created_at', NOW()
  );
  
  RAISE NOTICE 'Cuenta creada para usuario % con DNI: Alias=%', p_user_id, v_alias;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'CREATE_ACCOUNT_FAILED: %', SQLERRM;
END;$$;


ALTER FUNCTION public.create_user_bank_account(p_user_id uuid) OWNER TO postgres;

--

-- Name: deactivate_expired_qr_codes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deactivate_expired_qr_codes() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE qr_codes
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE 
    is_active = true
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'QR codes expirados desactivados: %', v_count;
END;
$$;


ALTER FUNCTION public.deactivate_expired_qr_codes() OWNER TO postgres;

--

-- Name: delete_queue_message(text, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_queue_message(p_queue_name text, p_msg_id bigint) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN pgmq.delete(p_queue_name, p_msg_id);
END;
$$;


ALTER FUNCTION public.delete_queue_message(p_queue_name text, p_msg_id bigint) OWNER TO postgres;

--

-- Name: enqueue_notification(uuid, text, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enqueue_notification(p_user_id uuid, p_notification_type text, p_data jsonb DEFAULT '{}'::jsonb, p_related_transaction_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_message JSONB;
  last_invoked TIMESTAMPTZ;
  can_invoke BOOLEAN;
BEGIN
  -- Construir el mensaje para la cola
  v_message := jsonb_build_object(
    'user_id', p_user_id,
    'notification_type', p_notification_type,
    'data', p_data,
    'related_transaction_id', p_related_transaction_id,
    'created_at', NOW()
  );
  
  -- Enviar a la cola
  PERFORM pgmq.send(
    queue_name := 'notification_jobs',
    msg := v_message
  );
  
  RAISE NOTICE 'Notificación encolada para usuario %', p_user_id;
  
  -- ✅ INVOCAR WORKER INMEDIATAMENTE (con debouncing)
  BEGIN
    -- Obtener última invocación con lock
    SELECT last_invoked_at INTO last_invoked 
    FROM public.worker_invocations 
    FOR UPDATE SKIP LOCKED;
    
    -- Solo invocar si han pasado más de 3 segundos
    can_invoke := last_invoked IS NULL OR (NOW() - last_invoked) > INTERVAL '3 seconds';
    
    IF can_invoke THEN
      -- Actualizar timestamp
      UPDATE public.worker_invocations 
      SET last_invoked_at = NOW()
      WHERE id = TRUE;
      
      -- Invocar worker con secret
      PERFORM net.http_post(
        url := 'https://mzxhyjgbbabnughknrxc.supabase.co/functions/v1/notification-worker',
        headers := '{"Content-Type": "application/json", "x-worker-secret": "wk_prod_9f8e7d6c5b4a3291807f6e5d4c3b2a10"}'::jsonb,
        timeout_milliseconds := 30000
      );
      
      RAISE NOTICE '🚀 Worker invocado inmediatamente';
    ELSE
      RAISE NOTICE '⏭️ Worker ya invocado recientemente';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error invocando worker: %, el cron lo procesará', SQLERRM;
  END;
  
END;
$$;


ALTER FUNCTION public.enqueue_notification(p_user_id uuid, p_notification_type text, p_data jsonb, p_related_transaction_id uuid) OWNER TO postgres;

--

-- Name: generate_reference_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_reference_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_reference_number() OWNER TO postgres;

--

-- Name: generate_static_qr(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_static_qr(p_account_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_qr_id UUID;
  v_cvu VARCHAR;
  v_user_name VARCHAR;
  v_qr_data JSONB;
  v_qr_hash VARCHAR;
BEGIN
  -- Obtener datos de la cuenta
  SELECT 
    a.cvu,
    u.first_name || ' ' || u.last_name
  INTO v_cvu, v_user_name
  FROM accounts a
  JOIN users u ON a.user_id = u.id
  WHERE a.id = p_account_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta no encontrada';
  END IF;
  
  -- Crear datos del QR
  v_qr_data := jsonb_build_object(
    'cvu', v_cvu,
    'account_id', p_account_id,
    'holder_name', v_user_name,
    'version', '1.0',
    'type', 'static'
  );
  
  -- Generar hash del QR
  v_qr_hash := encode(digest(v_qr_data::TEXT, 'sha256'), 'hex');
  
  -- Insertar QR code
  INSERT INTO qr_codes (
    account_id,
    qr_data,
    qr_hash,
    qr_type,
    is_active
  ) VALUES (
    p_account_id,
    v_qr_data::TEXT,
    v_qr_hash,
    'static',
    true
  ) RETURNING id INTO v_qr_id;
  
  RETURN v_qr_id;
END;
$$;


ALTER FUNCTION public.generate_static_qr(p_account_id uuid) OWNER TO postgres;

--

-- Name: generate_transaction_reference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_transaction_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := 'TRX-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                           upper(substring(gen_random_uuid()::text, 1, 8));
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_transaction_reference() OWNER TO postgres;

--

-- Name: generate_unique_alias(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_unique_alias() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_alias VARCHAR(50);
  v_exists BOOLEAN;
  v_words TEXT[] := ARRAY[
    'leon', 'tigre', 'lobo', 'aguila', 'halcon', 'puma', 'jaguar', 'condor',
    'azul', 'rojo', 'verde', 'dorado', 'plata', 'negro', 'blanco', 'violeta',
    'veloz', 'fuerte', 'rapido', 'alto', 'largo', 'grande', 'nuevo', 'libre',
    'sol', 'luna', 'estrella', 'cielo', 'mar', 'rio', 'monte', 'valle'
  ];
BEGIN
  LOOP
    -- Generar alias con 3 palabras aleatorias
    v_alias := v_words[1 + floor(random() * array_length(v_words, 1))] || '.' ||
               v_words[1 + floor(random() * array_length(v_words, 1))] || '.' ||
               v_words[1 + floor(random() * array_length(v_words, 1))];
    
    -- Verificar que no exista
    SELECT EXISTS(SELECT 1 FROM accounts WHERE alias = v_alias) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_alias;
END;
$$;


ALTER FUNCTION public.generate_unique_alias() OWNER TO postgres;

--

-- Name: generate_unique_cbu(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_unique_cbu() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_cbu VARCHAR(22);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar CBU de 22 dígitos (formato argentino)
    -- Primeros 8: código de banco (ejemplo: 00000000)
    -- Siguientes 13: número de cuenta
    -- Último: dígito verificador
    v_cbu := '0000000' || LPAD(FLOOR(random() * 999999999999999)::TEXT, 15, '0');
    
    -- Verificar que no exista
    SELECT EXISTS(SELECT 1 FROM accounts WHERE cbu = v_cbu) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_cbu;
END;
$$;


ALTER FUNCTION public.generate_unique_cbu() OWNER TO postgres;

--

-- Name: generate_unique_cvu(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_unique_cvu() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_cvu VARCHAR(22);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar CVU de 22 dígitos
    v_cvu := '0000001' || LPAD(FLOOR(random() * 999999999999999)::TEXT, 15, '0');
    
    -- Verificar que no exista
    SELECT EXISTS(SELECT 1 FROM accounts WHERE cvu = v_cvu) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_cvu;
END;
$$;


ALTER FUNCTION public.generate_unique_cvu() OWNER TO postgres;

--

-- Name: get_account_info(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_account_info(p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(account_id uuid, user_id uuid, cbu character varying, cvu character varying, alias character varying, balance numeric, status character varying, is_primary boolean, monthly_limit numeric, monthly_spent numeric, monthly_available numeric, daily_limit numeric, daily_spent numeric, qr_code_hash character varying, qr_code_data text, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS account_id,
    a.user_id,
    a.cbu,
    a.cvu,
    a.alias,
    a.balance,
    a.status,
    a.is_primary,
    al.monthly_limit,
    al.monthly_spent,
    al.monthly_available,
    al.daily_limit,
    al.daily_spent,
    qr.qr_hash AS qr_code_hash,
    qr.qr_data AS qr_code_data,
    a.created_at
  FROM accounts a
  LEFT JOIN account_limits al ON al.account_id = a.id
  LEFT JOIN qr_codes qr ON qr.account_id = a.id AND qr.qr_type = 'static' AND qr.is_active = true
  WHERE a.user_id = COALESCE(p_user_id, auth.uid())
    AND a.status = 'active'
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_account_info(p_user_id uuid) OWNER TO postgres;

--

-- Name: get_active_push_devices(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_active_push_devices(p_user_id uuid) RETURNS TABLE(device_id uuid, player_id text, platform text, device_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ud.id,
    ud.player_id,
    ud.platform,
    ud.device_name
  FROM public.user_devices ud
  WHERE ud.user_id = p_user_id
    AND ud.is_active = true
    AND ud.push_enabled = true
    AND ud.player_id IS NOT NULL;
END;
$$;


ALTER FUNCTION public.get_active_push_devices(p_user_id uuid) OWNER TO postgres;

--

-- Name: get_api_access(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_api_access() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'client_id', a.client_id,
    'is_enabled', a.is_enabled,
    'allowed_ips', COALESCE(a.allowed_ips, ARRAY[]::text[]),
    'rate_limit_per_minute', a.rate_limit_per_minute,
    'last_used_at', a.last_used_at,
    'created_at', a.created_at,
    'has_password', (a.api_password_hash IS NOT NULL)
  )
  INTO v_result
  FROM api_access a
  WHERE a.user_id = auth.uid();

  -- Si no tiene registro aún, devolver null
  RETURN v_result;
END;
$$;


ALTER FUNCTION public.get_api_access() OWNER TO postgres;

--

-- Name: get_balance_at_date(uuid, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_balance_at_date(p_account_id uuid, p_date date) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_balance NUMERIC := 0.00;
  v_snapshot_balance NUMERIC;
BEGIN
  -- Intentar obtener desde snapshot (más rápido)
  SELECT balance INTO v_snapshot_balance
  FROM account_balance_snapshots
  WHERE account_id = p_account_id
    AND snapshot_date = p_date
  LIMIT 1;
  
  IF FOUND THEN
    RETURN v_snapshot_balance;
  END IF;
  
  -- Si no hay snapshot, calcular desde transacciones
  SELECT COALESCE(SUM(
    CASE 
      WHEN to_account_id = p_account_id THEN amount
      WHEN from_account_id = p_account_id THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE (from_account_id = p_account_id OR to_account_id = p_account_id)
    AND status = 'completed'
    AND DATE(completed_at) <= p_date;
  
  RETURN v_balance;
END;
$$;


ALTER FUNCTION public.get_balance_at_date(p_account_id uuid, p_date date) OWNER TO postgres;

--

-- Name: get_balance_inconsistencies(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_balance_inconsistencies() RETURNS TABLE(account_id uuid, user_id uuid, cvu character varying, alias character varying, balance_materialized numeric, balance_calculated numeric, difference numeric, status text, total_transactions bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.account_id,
    r.user_id,
    r.cvu,
    r.alias,
    r.balance_materialized,
    r.balance_calculated,
    r.difference,
    r.status,
    r.total_transactions
  FROM account_balance_reconciliation r
  WHERE r.status != 'OK'
  ORDER BY ABS(r.difference) DESC;
END;
$$;


ALTER FUNCTION public.get_balance_inconsistencies() OWNER TO postgres;

--

-- Name: get_user_devices_list(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_devices_list(p_user_id text, p_current_device_id text) RETURNS TABLE(id uuid, device_id text, device_name text, device_model text, device_type text, platform text, os_version text, app_version text, last_active_at timestamp with time zone, registered_at timestamp with time zone, is_current boolean, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        ud.id,
        ud.device_id::text,
        ud.device_name::text,
        ud.device_model::text,
        ud.device_type::text,
        ud.platform::text,
        ud.os_version::text,
        ud.app_version::text,
        ud.last_active_at,
        ud.registered_at,
        (ud.device_id = p_current_device_id) AS is_current,
        ud.status::text
    FROM public.user_devices ud
    WHERE ud.user_id = p_user_id::uuid -- Forzar casting aquí
      AND ud.is_active = TRUE
    ORDER BY ud.last_active_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_devices_list(p_user_id text, p_current_device_id text) OWNER TO postgres;

--

-- Name: get_user_id_from_account(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_id_from_account(p_account_id uuid) RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.accounts
  WHERE id = p_account_id;
  
  RETURN v_user_id;
END;
$$;


ALTER FUNCTION public.get_user_id_from_account(p_account_id uuid) OWNER TO postgres;

--

-- Name: get_user_login_data(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_login_data(email_input text) RETURNS TABLE(id uuid, email text, pin_hash text, verification_status text, web_access_enabled boolean, web_password_hash text, auto_password_encrypted text, first_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.pin_hash::text,
    u.verification_status::text,
    u.web_access_enabled,
    u.web_password_hash::text,
    c.auto_password_encrypted::text,
    u.first_name::text
  FROM public.users u
  LEFT JOIN public.user_auth_credentials c ON c.user_id = u.id
  WHERE u.email = email_input;
END;
$$;


ALTER FUNCTION public.get_user_login_data(email_input text) OWNER TO postgres;

--

-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RAISE LOG 'Trigger handle_new_user ejecutándose para: %', NEW.email;

  INSERT INTO public.users (
    id, email, first_name, last_name, phone, dni, cuit_cuil,
    pin_hash, verification_status, web_access_enabled,
    zapsign_verification_id, zapsign_contract_url, zapsign_data,
    created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombres', 'FALTA_NOMBRE'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', 'FALTA_APELLIDO'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', '0000000000'),
    COALESCE(NEW.raw_user_meta_data->>'dni', '00000000'),
    COALESCE(NEW.raw_user_meta_data->>'cuit', '00000000000'),
    COALESCE(NEW.raw_user_meta_data->>'pin_hash', 'NO_HASH_SENT'),
    'verified',
    false,
    -- ✅ Buscar doc_token en todas las variantes posibles
    COALESCE(
        NEW.raw_user_meta_data->>'zapsign_verification_id',
        NEW.raw_user_meta_data->>'zapsign_doc_token',
        NEW.raw_user_meta_data->>'zapsign_id'
    ),
    -- ✅ Buscar contract URL en todas las variantes
    COALESCE(
        NEW.raw_user_meta_data->>'zapsign_contract_url',
        NEW.raw_user_meta_data->>'zapsign_url',
        NEW.raw_user_meta_data->>'zapsign_signed_file'
    ),
    NEW.raw_user_meta_data->'zapsign_data',
    NOW(),
    NOW()
  );

  RAISE LOG 'Usuario creado en public.users: % con data ZapSign', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ERROR EN TRIGGER handle_new_user: %', SQLERRM;
    RAISE EXCEPTION 'Error creando perfil de usuario: %', SQLERRM;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--

-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION public.is_admin() OWNER TO postgres;

--

-- Name: log_account_alias_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_account_alias_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Solo registrar si el alias realmente cambió
  IF OLD.alias IS DISTINCT FROM NEW.alias THEN
    INSERT INTO account_alias_history (
      account_id,
      old_alias,
      new_alias,
      changed_at,
      changed_by_device_id
    ) VALUES (
      NEW.id,
      OLD.alias,
      NEW.alias,
      NOW(),
      -- Intentar obtener el device_id del contexto de la sesión
      NULLIF(current_setting('app.current_device_id', true), '')::uuid
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_account_alias_change() OWNER TO postgres;

--

-- Name: log_api_credential_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_api_credential_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_change_type VARCHAR;
  v_old_value TEXT;
  v_new_value TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_change_type := 'enabled';  -- ← antes decía 'api_enabled'
    v_old_value := NULL;
    v_new_value := 'API access habilitado';
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.api_password_hash IS DISTINCT FROM NEW.api_password_hash THEN
      v_change_type := 'password_changed';
      v_old_value := 'hash_anterior';
      v_new_value := 'hash_nuevo';
    ELSIF OLD.is_enabled IS DISTINCT FROM NEW.is_enabled THEN
      v_change_type := CASE WHEN NEW.is_enabled THEN 'enabled' ELSE 'disabled' END;
      v_old_value := OLD.is_enabled::TEXT;
      v_new_value := NEW.is_enabled::TEXT;
    ELSIF OLD.allowed_ips IS DISTINCT FROM NEW.allowed_ips THEN
      v_change_type := 'whitelist_updated';
      v_old_value := OLD.allowed_ips::TEXT;
      v_new_value := NEW.allowed_ips::TEXT;
    ELSIF OLD.rate_limit_per_minute IS DISTINCT FROM NEW.rate_limit_per_minute THEN
      v_change_type := 'client_id_changed';
      v_old_value := OLD.rate_limit_per_minute::TEXT;
      v_new_value := NEW.rate_limit_per_minute::TEXT;
    END IF;
  END IF;
  
  IF v_change_type IS NOT NULL THEN
    INSERT INTO api_credential_history (
      api_access_id, user_id, change_type, old_value, new_value,
      changed_from_ip, changed_from_device_id, created_at
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      COALESCE(NEW.user_id, OLD.user_id),
      v_change_type, v_old_value, v_new_value,
      inet(NULLIF(current_setting('request.headers', true)::json->>'x-forwarded-for', '')),
      NULLIF(current_setting('app.current_device_id', true), '')::uuid,
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.log_api_credential_change() OWNER TO postgres;

--

-- Name: monitor_balance_inconsistencies(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.monitor_balance_inconsistencies() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM account_balance_reconciliation
  WHERE status = 'ERROR';
  
  IF v_count > 0 THEN
    RAISE WARNING 'ALERTA: % cuentas con inconsistencias de balance críticas', v_count;
    -- Aquí podrías enviar una notificación o insertar en tabla de alertas
  END IF;
  
  SELECT COUNT(*) INTO v_count
  FROM account_balance_reconciliation
  WHERE status = 'WARNING';
  
  IF v_count > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % cuentas con inconsistencias menores de balance', v_count;
  END IF;
END;
$$;


ALTER FUNCTION public.monitor_balance_inconsistencies() OWNER TO postgres;

--

-- Name: monitor_negative_balances(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.monitor_negative_balances() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Alertar sobre cuentas con saldo negativo
  SELECT COUNT(*) INTO v_count
  FROM accounts
  WHERE balance < 0 AND status = 'active';
  
  IF v_count > 0 THEN
    RAISE WARNING 'ALERTA: % cuentas con saldo negativo detectadas', v_count;
    -- Aquí podrías enviar una notificación o insertar en una tabla de alertas
  END IF;
END;
$$;


ALTER FUNCTION public.monitor_negative_balances() OWNER TO postgres;

--

-- Name: process_transfer(uuid, character varying, numeric, character varying, character varying, uuid, inet); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying DEFAULT ''::character varying, p_payment_method character varying DEFAULT 'cbu'::character varying, p_device_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_transaction_id UUID;
  v_to_account_id UUID;
  v_from_balance DECIMAL;
  v_monthly_limit DECIMAL;
  v_monthly_spent DECIMAL;
  v_daily_limit DECIMAL;
  v_daily_spent DECIMAL;
  v_per_transaction_limit DECIMAL;
  v_from_status VARCHAR;
  v_to_status VARCHAR;
  v_transfer_out_type_id UUID;
  v_transfer_in_type_id UUID;
  v_external_holder VARCHAR;
  v_is_external BOOLEAN := false;
  v_commission DECIMAL := 0.00;
  v_net_amount DECIMAL;
  v_reference_number VARCHAR;
  v_result JSONB;
  v_user_id UUID;
BEGIN
  -- ============================================================================
  -- 1. VALIDAR QUE EL USUARIO SEA DUEÑO DE LA CUENTA ORIGEN
  -- ============================================================================
  SELECT user_id INTO v_user_id
  FROM accounts
  WHERE id = p_from_account_id;
  
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: No tienes permisos para usar esta cuenta';
  END IF;
  
  -- ============================================================================
  -- 2. Obtener IDs de tipos de transacción
  -- ============================================================================
  SELECT id INTO v_transfer_out_type_id FROM transaction_types WHERE code = 'transfer_out';
  SELECT id INTO v_transfer_in_type_id FROM transaction_types WHERE code = 'transfer_in';
  
  IF v_transfer_out_type_id IS NULL OR v_transfer_in_type_id IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_TYPES_NOT_FOUND: Tipos de transacción no configurados';
  END IF;
  
  -- ============================================================================
  -- 3. Validar cuenta origen con bloqueo
  -- ============================================================================
  SELECT balance, status INTO v_from_balance, v_from_status 
  FROM accounts 
  WHERE id = p_from_account_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_FOUND: Cuenta de origen no encontrada';
  END IF;
  
  IF v_from_status != 'active' THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE: Cuenta de origen no está activa (%)' , v_from_status;
  END IF;
  
  -- ============================================================================
  -- 4. Validar monto mínimo
  -- ============================================================================
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: El monto debe ser mayor a 0';
  END IF;
  
  -- ============================================================================
  -- 5. Buscar cuenta destino (por alias, CVU o CBU)
  -- ============================================================================
  SELECT id, status INTO v_to_account_id, v_to_status
  FROM accounts 
  WHERE 
    (LOWER(alias) = LOWER(p_to_identifier) OR cvu = p_to_identifier OR cbu = p_to_identifier)
    AND status = 'active'
  FOR UPDATE;
  
  -- Si no se encuentra, es una transferencia externa
  IF NOT FOUND THEN
    v_is_external := true;
    v_external_holder := 'Cuenta Externa';
    v_commission := 0.00;
  ELSE
    v_commission := 0.00;
  END IF;
  
  v_net_amount := p_amount - v_commission;
  
  -- ============================================================================
  -- 6. Validar que no se transfiera a la misma cuenta
  -- ============================================================================
  IF p_from_account_id = v_to_account_id THEN
    RAISE EXCEPTION 'SAME_ACCOUNT: No puedes transferir a tu propia cuenta';
  END IF;
  
  -- ============================================================================
  -- 7. Validar saldo suficiente (incluyendo comisión)
  -- ============================================================================
  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE: Saldo insuficiente. Disponible: %, Requerido: %', 
      v_from_balance, p_amount;
  END IF;
  
  -- ============================================================================
  -- 8. Validar límites (mensual, diario, por transacción)
  -- ============================================================================
  SELECT 
    monthly_limit, 
    monthly_spent,
    daily_limit,
    daily_spent,
    per_transaction_limit
  INTO 
    v_monthly_limit, 
    v_monthly_spent,
    v_daily_limit,
    v_daily_spent,
    v_per_transaction_limit
  FROM account_limits 
  WHERE account_id = p_from_account_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LIMITS_NOT_FOUND: Límites de cuenta no configurados';
  END IF;
  
  IF v_monthly_limit IS NOT NULL AND (v_monthly_spent + p_amount) > v_monthly_limit THEN
    RAISE EXCEPTION 'MONTHLY_LIMIT_EXCEEDED: Excede el límite mensual. Límite: %, Gastado: %, Intentando: %', 
      v_monthly_limit, v_monthly_spent, p_amount;
  END IF;
  
  IF v_daily_limit IS NOT NULL AND (v_daily_spent + p_amount) > v_daily_limit THEN
    RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED: Excede el límite diario. Límite: %, Gastado: %, Intentando: %', 
      v_daily_limit, v_daily_spent, p_amount;
  END IF;
  
  IF v_per_transaction_limit IS NOT NULL AND p_amount > v_per_transaction_limit THEN
    RAISE EXCEPTION 'PER_TRANSACTION_LIMIT_EXCEEDED: Excede el límite por transacción. Límite: %, Intentando: %', 
      v_per_transaction_limit, p_amount;
  END IF;
  
  -- ============================================================================
  -- 9. Generar número de referencia único
  -- ============================================================================
  v_reference_number := 'TRX-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                        upper(substring(gen_random_uuid()::text, 1, 8));
  
  -- ============================================================================
  -- 10. Crear la transacción de salida
  -- ============================================================================
  INSERT INTO transactions (
    transaction_type_id,
    from_account_id,
    to_account_id,
    external_cvu,
    external_cbu,
    external_alias,
    external_holder_name,
    amount,
    currency,
    concept,
    payment_method,
    payment_reference,
    status,
    commission_amount,
    net_amount,
    processed_by,
    initiated_from_device_id,
    initiated_from_ip,
    reference_number,
    processing_at,
    completed_at,
    metadata
  ) VALUES (
    v_transfer_out_type_id,
    p_from_account_id,
    NULL,
    CASE WHEN v_is_external AND p_payment_method = 'cvu' THEN p_to_identifier ELSE NULL END,
    CASE WHEN v_is_external AND p_payment_method = 'cbu' THEN p_to_identifier ELSE NULL END,
    CASE WHEN v_is_external AND p_payment_method = 'alias' THEN p_to_identifier ELSE NULL END,
    CASE WHEN v_is_external THEN v_external_holder ELSE NULL END,
    p_amount,
    'ARS',
    p_concept,
    p_payment_method,
    p_to_identifier,
    'completed',
    v_commission,
    v_net_amount,
    'system',
    p_device_id,
    p_ip_address,
    v_reference_number,
    NOW(),
    NOW(),
    jsonb_build_object(
      'is_external', v_is_external,
      'commission_applied', v_commission > 0,
      'to_account_id', v_to_account_id
    )
  ) RETURNING id INTO v_transaction_id;
  
  -- ============================================================================
  -- 11. Si es transferencia interna, crear transacción de entrada
  -- ============================================================================
  IF NOT v_is_external THEN
    INSERT INTO transactions (
      transaction_type_id,
      from_account_id,
      to_account_id,
      amount,
      currency,
      concept,
      payment_method,
      payment_reference,
      status,
      commission_amount,
      net_amount,
      processed_by,
      initiated_from_device_id,
      initiated_from_ip,
      reference_number,
      processing_at,
      completed_at,
      metadata
    ) VALUES (
      v_transfer_in_type_id,
      NULL,
      v_to_account_id,
      p_amount,
      'ARS',
      p_concept,
      p_payment_method,
      p_to_identifier,
      'completed',
      0.00,
      p_amount,
      'system',
      p_device_id,
      p_ip_address,
      v_reference_number || '-IN',
      NOW(),
      NOW(),
      jsonb_build_object(
        'related_transaction_id', v_transaction_id,
        'is_incoming', true,
        'from_account_id', p_from_account_id
      )
    );
  END IF;
  
  -- ============================================================================
  -- 12. Reconciliar balances (en lugar de actualizar manualmente)
  -- ⭐ CAMBIO AQUÍ: Usar reconcile_account_balance
  -- ============================================================================
  PERFORM reconcile_account_balance(p_from_account_id);
  
  IF NOT v_is_external THEN
    PERFORM reconcile_account_balance(v_to_account_id);
  END IF;
  
  -- ============================================================================
  -- 13. Actualizar límites (mensual y diario)
  -- ============================================================================
  UPDATE account_limits 
  SET 
    monthly_spent = monthly_spent + p_amount,
    daily_spent = daily_spent + p_amount,
    updated_at = NOW()
  WHERE account_id = p_from_account_id;
  
  -- ============================================================================
  -- 14. Obtener nuevo balance
  -- ============================================================================
  SELECT balance INTO v_from_balance FROM accounts WHERE id = p_from_account_id;
  
  -- ============================================================================
  -- 15. Construir respuesta de éxito
  -- ============================================================================
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number,
    'amount', p_amount,
    'commission', v_commission,
    'net_amount', v_net_amount,
    'new_balance', v_from_balance,
    'is_external', v_is_external,
    'to_account_id', v_to_account_id,
    'status', 'completed',
    'timestamp', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en process_transfer: % - %', SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'TRANSFER_FAILED: %', SQLERRM;
END;
$$;


ALTER FUNCTION public.process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying, p_payment_method character varying, p_device_id uuid, p_ip_address inet) OWNER TO postgres;

--

-- Name: read_queue_messages(text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.read_queue_messages(p_queue_name text, p_vt integer, p_qty integer) RETURNS SETOF pgmq.message_record
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM pgmq.read(p_queue_name, p_vt, p_qty);
END;
$$;


ALTER FUNCTION public.read_queue_messages(p_queue_name text, p_vt integer, p_qty integer) OWNER TO postgres;

--

-- Name: reconcile_account_balance(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reconcile_account_balance(p_account_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_balance_materialized NUMERIC;
  v_balance_calculated NUMERIC;
  v_difference NUMERIC;
  v_result JSONB;
BEGIN
  -- Obtener balance materializado con lock
  SELECT balance INTO v_balance_materialized
  FROM accounts
  WHERE id = p_account_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Account not found'
    );
  END IF;
  
  -- Calcular balance real desde transacciones
  v_balance_calculated := calculate_account_balance(p_account_id);
  
  -- Calcular diferencia
  v_difference := v_balance_materialized - v_balance_calculated;
  
  -- Si hay diferencia significativa, corregir
  IF ABS(v_difference) >= 0.01 THEN
    -- Actualizar balance en accounts
    UPDATE accounts
    SET 
      balance = v_balance_calculated,
      updated_at = NOW()
    WHERE id = p_account_id;
    
    -- Registrar la corrección
    INSERT INTO balance_corrections (
      account_id,
      old_balance,
      new_balance,
      difference,
      correction_reason,
      corrected_at,
      metadata
    ) VALUES (
      p_account_id,
      v_balance_materialized,
      v_balance_calculated,
      v_difference,
      'automatic_reconciliation',
      NOW(),
      jsonb_build_object(
        'transactions_count', (
          SELECT COUNT(*) FROM transactions t 
          WHERE (t.from_account_id = p_account_id OR t.to_account_id = p_account_id)
            AND t.status = 'completed'
        )
      )
    );
    
    v_result := jsonb_build_object(
      'status', 'corrected',
      'account_id', p_account_id,
      'old_balance', v_balance_materialized,
      'new_balance', v_balance_calculated,
      'difference', v_difference,
      'corrected_at', NOW()
    );
    
    RAISE NOTICE 'Balance corregido para cuenta %: % -> % (diferencia: %)', 
      p_account_id, v_balance_materialized, v_balance_calculated, v_difference;
  ELSE
    v_result := jsonb_build_object(
      'status', 'ok',
      'account_id', p_account_id,
      'balance', v_balance_materialized,
      'verified_at', NOW()
    );
  END IF;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION public.reconcile_account_balance(p_account_id uuid) OWNER TO postgres;

--

-- Name: reconcile_all_accounts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reconcile_all_accounts() RETURNS TABLE(account_id uuid, status text, old_balance numeric, new_balance numeric, difference numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_account RECORD;
  v_result JSONB;
BEGIN
  FOR v_account IN 
    SELECT id FROM accounts WHERE status = 'active'
  LOOP
    v_result := reconcile_account_balance(v_account.id);
    
    RETURN QUERY SELECT 
      (v_result->>'account_id')::UUID,
      v_result->>'status',
      COALESCE((v_result->>'old_balance')::NUMERIC, 0),
      COALESCE((v_result->>'new_balance')::NUMERIC, (v_result->>'balance')::NUMERIC, 0),
      COALESCE((v_result->>'difference')::NUMERIC, 0);
  END LOOP;
END;
$$;


ALTER FUNCTION public.reconcile_all_accounts() OWNER TO postgres;

--

-- Name: reset_daily_limits(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_daily_limits() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE account_limits
  SET 
    daily_spent = 0.00,
    updated_at = NOW()
  WHERE daily_spent > 0;
  
  RAISE NOTICE 'Límites diarios reseteados para % cuentas', (SELECT count(*) FROM account_limits WHERE daily_spent = 0);
END;
$$;


ALTER FUNCTION public.reset_daily_limits() OWNER TO postgres;

--

-- Name: reset_monthly_limits(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_monthly_limits() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE account_limits
  SET 
    monthly_spent = 0.00,
    current_period_start = date_trunc('month', CURRENT_DATE),
    current_period_end = (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date,
    monthly_available = monthly_limit,
    updated_at = NOW()
  WHERE current_period_end < CURRENT_DATE;
  
  RAISE NOTICE 'Límites mensuales reseteados para % cuentas', (SELECT count(*) FROM account_limits WHERE monthly_spent = 0);
END;
$$;


ALTER FUNCTION public.reset_monthly_limits() OWNER TO postgres;

--

-- Name: revoke_all_other_devices(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.revoke_all_other_devices(p_user_id text, p_current_device_id text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.user_devices SET
        is_active = FALSE,
        status = 'revoked',
        revoked_at = NOW(),
        revoke_reason = 'Other device forced logout'
    WHERE user_id = p_user_id::uuid 
      AND device_id != p_current_device_id
      AND is_active = TRUE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


ALTER FUNCTION public.revoke_all_other_devices(p_user_id text, p_current_device_id text) OWNER TO postgres;

--

-- Name: revoke_user_device(text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.revoke_user_device(p_user_id text, p_device_record_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.user_devices SET
        is_active = FALSE,
        status = 'revoked',
        revoked_at = NOW(),
        revoke_reason = 'User requested revocation'
    WHERE id = p_device_record_id AND user_id = p_user_id::uuid;

    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.revoke_user_device(p_user_id text, p_device_record_id uuid) OWNER TO postgres;

--

-- Name: search_account_for_transfer(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_account_for_transfer(p_identifier character varying) RETURNS TABLE(account_id uuid, holder_name character varying, alias character varying, is_external boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
BEGIN
  -- Buscar cuenta interna
  RETURN QUERY
  SELECT 
    a.id as account_id,
    CAST((u.first_name || ' ' || u.last_name) AS VARCHAR) as holder_name,  -- ⭐ CAST AQUÍ
    a.alias,
    false as is_external
  FROM accounts a
  JOIN users u ON a.user_id = u.id
  WHERE a.status = 'active'
    AND (
      LOWER(a.alias) = LOWER(p_identifier)
      OR a.cbu = p_identifier
      OR a.cvu = p_identifier
    )
  LIMIT 1;
  
  -- Si no hay resultados y parece CBU/CVU externo
  IF NOT FOUND AND p_identifier ~ '^\d{22}$' THEN
    RETURN QUERY
    SELECT 
      NULL::UUID as account_id,
      CAST('Cuenta Externa' AS VARCHAR) as holder_name,  -- ⭐ CAST AQUÍ
      NULL::VARCHAR as alias,
      true as is_external;
  END IF;
END;
$_$;


ALTER FUNCTION public.search_account_for_transfer(p_identifier character varying) OWNER TO postgres;

--

-- Name: suspend_user_account(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.suspend_user_account(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users
  SET verification_status = 'suspended'
  WHERE id = p_user_id;

  -- Opcional: Loggear la acción
  RAISE NOTICE 'Cuenta % suspendida por seguridad.', p_user_id;
END;
$$;


ALTER FUNCTION public.suspend_user_account(p_user_id uuid) OWNER TO postgres;

--

-- Name: sync_qr_data_from_account(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_qr_data_from_account() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  updated_qr_data jsonb;
BEGIN
  -- Construir el nuevo qr_data con los valores actualizados
  UPDATE public.qr_codes
  SET 
    qr_data = jsonb_build_object(
      'cbu', NEW.cbu,
      'cvu', NEW.cvu,
      'alias', NEW.alias,
      'type', (qr_data::jsonb)->>'type',
      'account_id', NEW.id::text
    )::text,
    qr_hash = encode(
      digest(
        jsonb_build_object(
          'cbu', NEW.cbu,
          'cvu', NEW.cvu,
          'alias', NEW.alias,
          'type', (qr_data::jsonb)->>'type',
          'account_id', NEW.id::text
        )::text,
        'sha256'
      ),
      'hex'
    )
  WHERE 
    account_id = NEW.id
    AND is_active = true;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_qr_data_from_account() OWNER TO postgres;

--

-- Name: trigger_create_account_on_user_signup(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_create_account_on_user_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Crear cuenta bancaria automáticamente usando el nombre calificado del esquema
  -- Esto evita errores si el search_path no incluye public en el contexto del trigger
  v_result := public.create_user_bank_account(NEW.id);
  RAISE NOTICE 'Cuenta creada automáticamente para usuario %: %', NEW.id, v_result;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_create_account_on_user_signup() OWNER TO postgres;

--

-- Name: trigger_enqueue_transaction_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_enqueue_transaction_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_sender_user_id UUID;
  v_receiver_user_id UUID;
  v_transaction_category TEXT;
  last_invoked TIMESTAMPTZ;
  can_invoke BOOLEAN;
BEGIN
  -- Solo procesar transacciones completadas
  IF NEW.status = 'completed' THEN
    
    -- Obtener la categoría del tipo de transacción
    SELECT category INTO v_transaction_category
    FROM transaction_types
    WHERE id = NEW.transaction_type_id;

    -- 1. Notificar al EMISOR (Gasto/Transferencia enviada)
    IF NEW.from_account_id IS NOT NULL THEN
      SELECT user_id INTO v_sender_user_id
      FROM accounts
      WHERE id = NEW.from_account_id;

      IF v_sender_user_id IS NOT NULL THEN
        PERFORM pgmq.send(
          queue_name := 'notification_jobs',
          msg := jsonb_build_object(
            'user_id', v_sender_user_id,
            'notification_type', 'transaction_sent',
            'data', jsonb_build_object(
              'transaction_id', NEW.id,
              'amount', NEW.amount,
              'currency', NEW.currency,
              'reference_number', NEW.reference_number
            ),
            'related_transaction_id', NEW.id,
            'created_at', NOW()
          )
        );
      END IF;
    END IF;

    -- 2. Notificar al RECEPTOR (Ingreso/Transferencia recibida)
    IF NEW.to_account_id IS NOT NULL AND (v_transaction_category = 'income' OR NEW.from_account_id IS NOT NULL) THEN
      SELECT user_id INTO v_receiver_user_id
      FROM accounts
      WHERE id = NEW.to_account_id;

      IF v_receiver_user_id IS NOT NULL AND v_receiver_user_id != v_sender_user_id THEN
        PERFORM pgmq.send(
          queue_name := 'notification_jobs',
          msg := jsonb_build_object(
            'user_id', v_receiver_user_id,
            'notification_type', 'transaction_received',
            'data', jsonb_build_object(
              'transaction_id', NEW.id,
              'amount', NEW.amount,
              'currency', NEW.currency,
              'reference_number', NEW.reference_number
            ),
            'related_transaction_id', NEW.id,
            'created_at', NOW()
          )
        );
      END IF;
    END IF;

    -- ✅ LLAMADA INMEDIATA AL WORKER (con debouncing y secret)
    BEGIN
      -- Obtener última invocación con lock
      SELECT last_invoked_at INTO last_invoked 
      FROM public.worker_invocations 
      FOR UPDATE SKIP LOCKED;
      
      -- Solo invocar si han pasado más de 3 segundos
      can_invoke := last_invoked IS NULL OR (NOW() - last_invoked) > INTERVAL '3 seconds';
      
      IF can_invoke THEN
        -- Actualizar timestamp
        UPDATE public.worker_invocations 
        SET last_invoked_at = NOW()
        WHERE id = TRUE;
        
        -- Invocar worker con secret de seguridad
        PERFORM net.http_post(
          url := 'https://mzxhyjgbbabnughknrxc.supabase.co/functions/v1/notification-worker',
          headers := '{"Content-Type": "application/json", "x-worker-secret": "wk_prod_9f8e7d6c5b4a3291807f6e5d4c3b2a10"}'::jsonb,
          timeout_milliseconds := 30000
        );
        
        RAISE NOTICE '🚀 Worker invocado por trigger de transacción';
      ELSE
        RAISE NOTICE '⏭️ Worker ya invocado recientemente';
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error invocando worker desde trigger: %, el cron lo procesará', SQLERRM;
    END;

  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_enqueue_transaction_notification() OWNER TO postgres;

--

-- Name: update_device_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_device_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.initiated_from_device_id IS NOT NULL THEN
    UPDATE user_devices
    SET 
      last_active_at = NOW(),
      last_ip_address = NEW.initiated_from_ip
    WHERE id = NEW.initiated_from_device_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_device_activity() OWNER TO postgres;

--

-- Name: update_notification_preferences_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_notification_preferences_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_notification_preferences_updated_at() OWNER TO postgres;

--

-- Name: update_qr_last_used(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_qr_last_used() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_qr_hash VARCHAR;
BEGIN
  -- Extraer el hash del QR desde payment_reference o metadata
  v_qr_hash := NEW.payment_reference;
  
  IF v_qr_hash IS NOT NULL THEN
    UPDATE qr_codes
    SET 
      times_used = times_used + 1,
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE qr_hash = v_qr_hash;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_qr_last_used() OWNER TO postgres;

--

-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--

-- Name: upsert_user_device(text, text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_user_device(p_user_id text, p_device_id text, p_device_name text, p_device_model text, p_device_type text, p_os_version text, p_app_version text, p_platform text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_device_record_id UUID;
BEGIN
    SELECT id INTO v_device_record_id
    FROM public.user_devices
    WHERE user_id = p_user_id::uuid AND device_id = p_device_id
    LIMIT 1;

    IF v_device_record_id IS NOT NULL THEN
        UPDATE public.user_devices SET
            device_name = p_device_name,
            device_model = p_device_model,
            device_type = p_device_type,
            os_version = p_os_version,
            app_version = p_app_version,
            platform = p_platform,
            is_active = TRUE,
            status = 'active',
            last_active_at = NOW(),
            revoked_at = NULL,
            revoke_reason = NULL
        WHERE id = v_device_record_id;
    ELSE
        INSERT INTO public.user_devices (
            user_id, device_id, device_name, device_model,
            device_type, os_version, app_version, platform,
            is_active, status, last_active_at, registered_at
        ) VALUES (
            p_user_id::uuid, p_device_id, p_device_name, p_device_model,
            p_device_type, p_os_version, p_app_version, p_platform,
            TRUE, 'active', NOW(), NOW()
        )
        RETURNING id INTO v_device_record_id;
    END IF;

    RETURN v_device_record_id;
END;
$$;


ALTER FUNCTION public.upsert_user_device(p_user_id text, p_device_id text, p_device_name text, p_device_model text, p_device_type text, p_os_version text, p_app_version text, p_platform text) OWNER TO postgres;

--

-- Name: validate_account_limits(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_account_limits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Validar que monthly_available sea correcto
  IF NEW.monthly_available IS NULL THEN
    NEW.monthly_available := NEW.monthly_limit - NEW.monthly_spent;
  END IF;
  
  -- Validar que los valores sean no negativos
  IF NEW.monthly_spent < 0 THEN
    RAISE EXCEPTION 'monthly_spent no puede ser negativo';
  END IF;
  
  IF NEW.daily_spent < 0 THEN
    RAISE EXCEPTION 'daily_spent no puede ser negativo';
  END IF;
  
  -- Validar que no se exceda el límite
  IF NEW.monthly_spent > NEW.monthly_limit THEN
    RAISE EXCEPTION 'monthly_spent no puede exceder monthly_limit';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_account_limits() OWNER TO postgres;

--

-- Name: validate_balance_after_transaction(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_balance_after_transaction() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_calculated_balance NUMERIC;
  v_materialized_balance NUMERIC;
  v_difference NUMERIC;
BEGIN
  -- Solo validar si la transacción fue completada
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Validar cuenta origen si existe
    IF NEW.from_account_id IS NOT NULL THEN
      SELECT balance INTO v_materialized_balance
      FROM accounts WHERE id = NEW.from_account_id;
      
      v_calculated_balance := calculate_account_balance(NEW.from_account_id);
      v_difference := ABS(v_materialized_balance - v_calculated_balance);
      
      IF v_difference >= 0.01 THEN
        RAISE WARNING 'INCONSISTENCIA en cuenta %: Materializado=%, Calculado=%, Diferencia=%',
          NEW.from_account_id, v_materialized_balance, v_calculated_balance, v_difference;
        
        -- Auto-corregir si la diferencia es pequeña
        IF v_difference < 10.00 THEN
          PERFORM reconcile_account_balance(NEW.from_account_id);
        END IF;
      END IF;
    END IF;
    
    -- Validar cuenta destino si existe
    IF NEW.to_account_id IS NOT NULL THEN
      SELECT balance INTO v_materialized_balance
      FROM accounts WHERE id = NEW.to_account_id;
      
      v_calculated_balance := calculate_account_balance(NEW.to_account_id);
      v_difference := ABS(v_materialized_balance - v_calculated_balance);
      
      IF v_difference >= 0.01 THEN
        RAISE WARNING 'INCONSISTENCIA en cuenta %: Materializado=%, Calculado=%, Diferencia=%',
          NEW.to_account_id, v_materialized_balance, v_calculated_balance, v_difference;
        
        -- Auto-corregir si la diferencia es pequeña
        IF v_difference < 10.00 THEN
          PERFORM reconcile_account_balance(NEW.to_account_id);
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_balance_after_transaction() OWNER TO postgres;

--

-- Name: validate_qr(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_qr(p_qr_hash character varying) RETURNS TABLE(is_valid boolean, account_id uuid, cvu character varying, holder_name character varying, account_status character varying)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_valid,
    a.id,
    a.cvu,
    u.first_name || ' ' || u.last_name,
    a.status
  FROM qr_codes qr
  JOIN accounts a ON qr.account_id = a.id
  JOIN users u ON a.user_id = u.id
  WHERE 
    qr.qr_hash = p_qr_hash
    AND qr.is_active = true
    AND a.status = 'active';
    
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR;
  END IF;
END;
$$;


ALTER FUNCTION public.validate_qr(p_qr_hash character varying) OWNER TO postgres;

--
