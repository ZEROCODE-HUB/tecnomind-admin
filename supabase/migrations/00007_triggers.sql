-- =====================================================================
-- Triggers
-- 25 triggers.
-- =====================================================================


-- Name: transactions on_transaction_completed_enqueue; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_transaction_completed_enqueue AFTER INSERT OR UPDATE ON public.transactions FOR EACH ROW WHEN (((new.status)::text = 'completed'::text)) EXECUTE FUNCTION public.trigger_enqueue_transaction_notification();


--

-- Name: users on_user_created_notification_prefs; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_user_created_notification_prefs AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();


--

-- Name: transactions set_net_amount; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_net_amount BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.calculate_net_amount();


--

-- Name: transactions set_transaction_reference; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_transaction_reference BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.generate_reference_number();


--

-- Name: users trigger_auto_create_account; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_auto_create_account AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_create_account_on_user_signup();


--

-- Name: qr_codes trigger_check_qr_validity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_check_qr_validity BEFORE UPDATE ON public.qr_codes FOR EACH ROW WHEN ((new.times_used IS DISTINCT FROM old.times_used)) EXECUTE FUNCTION public.check_qr_validity();


--

-- Name: transactions trigger_generate_reference; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_generate_reference BEFORE INSERT ON public.transactions FOR EACH ROW WHEN ((new.reference_number IS NULL)) EXECUTE FUNCTION public.generate_transaction_reference();


--

-- Name: accounts trigger_log_alias_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_log_alias_change AFTER UPDATE ON public.accounts FOR EACH ROW WHEN (((old.alias)::text IS DISTINCT FROM (new.alias)::text)) EXECUTE FUNCTION public.log_account_alias_change();


--

-- Name: api_access trigger_log_api_credential_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_log_api_credential_insert AFTER INSERT ON public.api_access FOR EACH ROW EXECUTE FUNCTION public.log_api_credential_change();


--

-- Name: api_access trigger_log_api_credential_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_log_api_credential_update AFTER UPDATE ON public.api_access FOR EACH ROW WHEN ((((old.api_password_hash)::text IS DISTINCT FROM (new.api_password_hash)::text) OR (old.is_enabled IS DISTINCT FROM new.is_enabled) OR (old.allowed_ips IS DISTINCT FROM new.allowed_ips) OR (old.rate_limit_per_minute IS DISTINCT FROM new.rate_limit_per_minute))) EXECUTE FUNCTION public.log_api_credential_change();


--

-- Name: accounts trigger_sync_qr_data_from_account; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_sync_qr_data_from_account AFTER UPDATE ON public.accounts FOR EACH ROW WHEN ((((old.alias)::text IS DISTINCT FROM (new.alias)::text) OR ((old.cbu)::text IS DISTINCT FROM (new.cbu)::text) OR ((old.cvu)::text IS DISTINCT FROM (new.cvu)::text))) EXECUTE FUNCTION public.sync_qr_data_from_account();


--

-- Name: account_limits trigger_update_account_limits_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_account_limits_timestamp BEFORE UPDATE ON public.account_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: accounts trigger_update_accounts_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_accounts_timestamp BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: api_access trigger_update_api_access_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_api_access_timestamp BEFORE UPDATE ON public.api_access FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: transactions trigger_update_device_activity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_device_activity AFTER INSERT ON public.transactions FOR EACH ROW WHEN ((new.initiated_from_device_id IS NOT NULL)) EXECUTE FUNCTION public.update_device_activity();


--

-- Name: notification_preferences trigger_update_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_notification_preferences_updated_at();


--

-- Name: qr_codes trigger_update_qr_codes_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_qr_codes_timestamp BEFORE UPDATE ON public.qr_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: transactions trigger_update_qr_usage; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_qr_usage AFTER INSERT ON public.transactions FOR EACH ROW WHEN ((((new.payment_method)::text = 'qr'::text) AND ((new.status)::text = 'completed'::text))) EXECUTE FUNCTION public.update_qr_last_used();


--

-- Name: user_auth_credentials trigger_update_user_auth_credentials_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_user_auth_credentials_timestamp BEFORE UPDATE ON public.user_auth_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: users trigger_update_users_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: transactions trigger_validate_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validate_balance AFTER INSERT OR UPDATE ON public.transactions FOR EACH ROW WHEN (((new.status)::text = 'completed'::text)) EXECUTE FUNCTION public.validate_balance_after_transaction();


--

-- Name: account_limits trigger_validate_limits; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validate_limits BEFORE INSERT OR UPDATE ON public.account_limits FOR EACH ROW EXECUTE FUNCTION public.validate_account_limits();


--

-- Name: account_limits update_account_limits_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_account_limits_updated_at BEFORE UPDATE ON public.account_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: api_access update_api_access_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_api_access_updated_at BEFORE UPDATE ON public.api_access FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: user_auth_credentials update_user_auth_credentials_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_auth_credentials_updated_at BEFORE UPDATE ON public.user_auth_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
