-- =====================================================================
-- Constraints e índices
-- PK, UNIQUE, CHECK e índices.
-- =====================================================================


-- Name: account_alias_history account_alias_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_alias_history
    ADD CONSTRAINT account_alias_history_pkey PRIMARY KEY (id);


--

-- Name: account_balance_snapshots account_balance_snapshots_account_id_snapshot_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_snapshots
    ADD CONSTRAINT account_balance_snapshots_account_id_snapshot_date_key UNIQUE (account_id, snapshot_date);


--

-- Name: account_balance_snapshots account_balance_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_snapshots
    ADD CONSTRAINT account_balance_snapshots_pkey PRIMARY KEY (id);


--

-- Name: account_limits account_limits_account_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_limits
    ADD CONSTRAINT account_limits_account_id_key UNIQUE (account_id);


--

-- Name: account_limits account_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_limits
    ADD CONSTRAINT account_limits_pkey PRIMARY KEY (id);


--

-- Name: account_types account_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_code_key UNIQUE (code);


--

-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (id);


--

-- Name: accounts accounts_alias_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_alias_key UNIQUE (alias);


--

-- Name: accounts accounts_cbu_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_cbu_key UNIQUE (cbu);


--

-- Name: accounts accounts_cvu_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_cvu_key UNIQUE (cvu);


--

-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--

-- Name: api_access api_access_client_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_access
    ADD CONSTRAINT api_access_client_id_key UNIQUE (client_id);


--

-- Name: api_access api_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_access
    ADD CONSTRAINT api_access_pkey PRIMARY KEY (id);


--

-- Name: api_access api_access_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_access
    ADD CONSTRAINT api_access_user_id_key UNIQUE (user_id);


--

-- Name: api_credential_history api_credential_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_credential_history
    ADD CONSTRAINT api_credential_history_pkey PRIMARY KEY (id);


--

-- Name: api_request_logs api_request_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_request_logs
    ADD CONSTRAINT api_request_logs_pkey PRIMARY KEY (id);


--

-- Name: app_versions app_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT app_versions_pkey PRIMARY KEY (id);


--

-- Name: balance_corrections balance_corrections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_corrections
    ADD CONSTRAINT balance_corrections_pkey PRIMARY KEY (id);


--

-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--

-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--

-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id);


--

-- Name: notification_types notification_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_types
    ADD CONSTRAINT notification_types_pkey PRIMARY KEY (code);


--

-- Name: qr_codes qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_pkey PRIMARY KEY (id);


--

-- Name: qr_codes qr_codes_qr_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_qr_hash_key UNIQUE (qr_hash);


--

-- Name: support support_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support
    ADD CONSTRAINT support_pkey PRIMARY KEY (id);


--

-- Name: transaction_types transaction_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_types
    ADD CONSTRAINT transaction_types_code_key UNIQUE (code);


--

-- Name: transaction_types transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_types
    ADD CONSTRAINT transaction_types_pkey PRIMARY KEY (id);


--

-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--

-- Name: transactions transactions_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_reference_number_key UNIQUE (reference_number);


--

-- Name: user_auth_credentials user_auth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_auth_credentials
    ADD CONSTRAINT user_auth_credentials_pkey PRIMARY KEY (id);


--

-- Name: user_auth_credentials user_auth_credentials_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_auth_credentials
    ADD CONSTRAINT user_auth_credentials_user_id_key UNIQUE (user_id);


--

-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--

-- Name: user_devices user_devices_player_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_player_id_key UNIQUE (player_id);


--

-- Name: user_devices user_devices_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_refresh_token_key UNIQUE (refresh_token);


--

-- Name: user_devices user_devices_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_session_token_key UNIQUE (session_token);


--

-- Name: user_devices user_devices_user_id_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_device_id_key UNIQUE (user_id, device_id);


--

-- Name: users users_cuit_cuil_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_cuit_cuil_key UNIQUE (cuit_cuil);


--

-- Name: users users_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_dni_key UNIQUE (dni);


--

-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--

-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--

-- Name: users users_zapsign_verification_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_zapsign_verification_id_key UNIQUE (zapsign_verification_id);


--

-- Name: worker_invocations worker_invocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.worker_invocations
    ADD CONSTRAINT worker_invocations_pkey PRIMARY KEY (id);


--

-- Name: idx_account_limits_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_limits_account_id ON public.account_limits USING btree (account_id);


--

-- Name: idx_account_types_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_types_active ON public.account_types USING btree (is_active) WHERE (is_active = true);


--

-- Name: idx_account_types_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_types_code ON public.account_types USING btree (code);


--

-- Name: idx_accounts_alias; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_alias ON public.accounts USING btree (alias);


--

-- Name: idx_accounts_cbu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_cbu ON public.accounts USING btree (cbu);


--

-- Name: idx_accounts_cvu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_cvu ON public.accounts USING btree (cvu);


--

-- Name: idx_accounts_one_primary_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_accounts_one_primary_per_user ON public.accounts USING btree (user_id) WHERE (is_primary = true);


--

-- Name: idx_accounts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_status ON public.accounts USING btree (status);


--

-- Name: idx_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id);


--

-- Name: idx_accounts_user_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_user_primary ON public.accounts USING btree (user_id, is_primary) WHERE (is_primary = true);


--

-- Name: idx_alias_history_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alias_history_account ON public.account_alias_history USING btree (account_id);


--

-- Name: idx_alias_history_changed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alias_history_changed_at ON public.account_alias_history USING btree (changed_at DESC);


--

-- Name: idx_api_access_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_access_client_id ON public.api_access USING btree (client_id);


--

-- Name: idx_api_access_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_access_enabled ON public.api_access USING btree (is_enabled) WHERE (is_enabled = true);


--

-- Name: idx_api_access_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_access_user_id ON public.api_access USING btree (user_id);


--

-- Name: idx_api_credential_history_api_access; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_credential_history_api_access ON public.api_credential_history USING btree (api_access_id);


--

-- Name: idx_api_credential_history_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_credential_history_created ON public.api_credential_history USING btree (created_at DESC);


--

-- Name: idx_api_credential_history_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_credential_history_user ON public.api_credential_history USING btree (user_id);


--

-- Name: idx_api_request_logs_api_access; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_request_logs_api_access ON public.api_request_logs USING btree (api_access_id);


--

-- Name: idx_api_request_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_request_logs_created ON public.api_request_logs USING btree (created_at DESC);


--

-- Name: idx_api_request_logs_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_request_logs_ip ON public.api_request_logs USING btree (ip_address);


--

-- Name: idx_balance_corrections_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_corrections_account ON public.balance_corrections USING btree (account_id);


--

-- Name: idx_balance_corrections_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_corrections_date ON public.balance_corrections USING btree (corrected_at DESC);


--

-- Name: idx_email_otps_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_otps_email ON public.email_otps USING btree (email, expires_at);


--

-- Name: idx_notification_log_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_category ON public.notification_log USING btree (category) WHERE (category IS NOT NULL);


--

-- Name: idx_notification_log_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_sent_at ON public.notification_log USING btree (sent_at DESC);


--

-- Name: idx_notification_log_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_status ON public.notification_log USING btree (status);


--

-- Name: idx_notification_log_transaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_transaction ON public.notification_log USING btree (related_transaction_id) WHERE (related_transaction_id IS NOT NULL);


--

-- Name: idx_notification_log_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_type ON public.notification_log USING btree (notification_type);


--

-- Name: idx_notification_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_user_id ON public.notification_log USING btree (user_id);


--

-- Name: idx_notification_log_user_sent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_log_user_sent ON public.notification_log USING btree (user_id, sent_at DESC);


--

-- Name: idx_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);


--

-- Name: idx_one_account_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_one_account_per_user ON public.accounts USING btree (user_id);


--

-- Name: idx_qr_codes_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_account_id ON public.qr_codes USING btree (account_id);


--

-- Name: idx_qr_codes_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_active ON public.qr_codes USING btree (account_id, is_active) WHERE (is_active = true);


--

-- Name: idx_qr_codes_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_hash ON public.qr_codes USING btree (qr_hash);


--

-- Name: idx_qr_codes_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_type ON public.qr_codes USING btree (qr_type);


--

-- Name: idx_snapshots_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_snapshots_account ON public.account_balance_snapshots USING btree (account_id);


--

-- Name: idx_snapshots_account_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_snapshots_account_date ON public.account_balance_snapshots USING btree (account_id, snapshot_date DESC);


--

-- Name: idx_snapshots_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_snapshots_date ON public.account_balance_snapshots USING btree (snapshot_date DESC);


--

-- Name: idx_transaction_types_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transaction_types_category ON public.transaction_types USING btree (category);


--

-- Name: idx_transaction_types_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transaction_types_code ON public.transaction_types USING btree (code);


--

-- Name: idx_transactions_amount_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_amount_range ON public.transactions USING btree (amount) WHERE ((status)::text = 'completed'::text);


--

-- Name: idx_transactions_completed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_completed_at ON public.transactions USING btree (completed_at DESC) WHERE (completed_at IS NOT NULL);


--

-- Name: idx_transactions_concept_text; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_concept_text ON public.transactions USING btree (concept) WHERE (concept IS NOT NULL);


--

-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at DESC);


--

-- Name: idx_transactions_from_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_from_account ON public.transactions USING btree (from_account_id) WHERE (from_account_id IS NOT NULL);


--

-- Name: idx_transactions_payment_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_payment_method ON public.transactions USING btree (payment_method);


--

-- Name: idx_transactions_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_reference ON public.transactions USING btree (reference_number) WHERE (reference_number IS NOT NULL);


--

-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--

-- Name: idx_transactions_to_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_to_account ON public.transactions USING btree (to_account_id) WHERE (to_account_id IS NOT NULL);


--

-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (transaction_type_id);


--

-- Name: idx_transactions_user_accounts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_user_accounts ON public.transactions USING btree (from_account_id, to_account_id, created_at DESC);


--

-- Name: idx_user_auth_credentials_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_auth_credentials_user_id ON public.user_auth_credentials USING btree (user_id);


--

-- Name: idx_user_devices_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_active ON public.user_devices USING btree (user_id, is_active) WHERE (is_active = true);


--

-- Name: idx_user_devices_last_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_last_active ON public.user_devices USING btree (last_active_at DESC);


--

-- Name: idx_user_devices_player_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_player_id ON public.user_devices USING btree (player_id) WHERE (player_id IS NOT NULL);


--

-- Name: idx_user_devices_push_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_push_active ON public.user_devices USING btree (user_id, push_enabled) WHERE ((push_enabled = true) AND (is_active = true));


--

-- Name: idx_user_devices_session_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_session_token ON public.user_devices USING btree (session_token) WHERE (session_token IS NOT NULL);


--

-- Name: idx_user_devices_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_user_id ON public.user_devices USING btree (user_id);


--

-- Name: idx_users_cuit_cuil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_cuit_cuil ON public.users USING btree (cuit_cuil);


--

-- Name: idx_users_dni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_dni ON public.users USING btree (dni);


--

-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--

-- Name: idx_users_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_verification_status ON public.users USING btree (verification_status);


--

-- Name: idx_users_web_access; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_web_access ON public.users USING btree (web_access_enabled) WHERE (web_access_enabled = true);


--
