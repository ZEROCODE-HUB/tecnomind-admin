-- =====================================================================
-- Permisos (GRANT)
-- Heredados. En 00010 se corrigen los que exponen datos a anon.
-- =====================================================================


-- Name: FUNCTION archive_old_api_logs(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.archive_old_api_logs() TO anon;
GRANT ALL ON FUNCTION public.archive_old_api_logs() TO authenticated;
GRANT ALL ON FUNCTION public.archive_old_api_logs() TO service_role;


--

-- Name: FUNCTION calculate_account_balance(p_account_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_account_balance(p_account_id uuid) TO anon;
GRANT ALL ON FUNCTION public.calculate_account_balance(p_account_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_account_balance(p_account_id uuid) TO service_role;


--

-- Name: FUNCTION calculate_net_amount(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_net_amount() TO anon;
GRANT ALL ON FUNCTION public.calculate_net_amount() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_net_amount() TO service_role;


--

-- Name: FUNCTION check_device_registered(p_user_id text, p_device_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_device_registered(p_user_id text, p_device_id text) TO anon;
GRANT ALL ON FUNCTION public.check_device_registered(p_user_id text, p_device_id text) TO authenticated;
GRANT ALL ON FUNCTION public.check_device_registered(p_user_id text, p_device_id text) TO service_role;


--

-- Name: FUNCTION check_qr_validity(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_qr_validity() TO anon;
GRANT ALL ON FUNCTION public.check_qr_validity() TO authenticated;
GRANT ALL ON FUNCTION public.check_qr_validity() TO service_role;


--

-- Name: FUNCTION check_user_exists(p_dni text, p_cuit text, p_email text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_user_exists(p_dni text, p_cuit text, p_email text) TO anon;
GRANT ALL ON FUNCTION public.check_user_exists(p_dni text, p_cuit text, p_email text) TO authenticated;
GRANT ALL ON FUNCTION public.check_user_exists(p_dni text, p_cuit text, p_email text) TO service_role;


--

-- Name: FUNCTION claim_device(p_player_id text, p_device_id text, p_device_data jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.claim_device(p_player_id text, p_device_id text, p_device_data jsonb) TO anon;
GRANT ALL ON FUNCTION public.claim_device(p_player_id text, p_device_id text, p_device_data jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.claim_device(p_player_id text, p_device_id text, p_device_data jsonb) TO service_role;


--

-- Name: FUNCTION claim_onesignal_device(p_player_id text, p_device_id text, p_user_id uuid, p_platform text, p_push_enabled boolean, p_device_os_version text, p_app_version text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.claim_onesignal_device(p_player_id text, p_device_id text, p_user_id uuid, p_platform text, p_push_enabled boolean, p_device_os_version text, p_app_version text) TO anon;
GRANT ALL ON FUNCTION public.claim_onesignal_device(p_player_id text, p_device_id text, p_user_id uuid, p_platform text, p_push_enabled boolean, p_device_os_version text, p_app_version text) TO authenticated;
GRANT ALL ON FUNCTION public.claim_onesignal_device(p_player_id text, p_device_id text, p_user_id uuid, p_platform text, p_push_enabled boolean, p_device_os_version text, p_app_version text) TO service_role;


--

-- Name: FUNCTION cleanup_inactive_devices(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_inactive_devices() TO anon;
GRANT ALL ON FUNCTION public.cleanup_inactive_devices() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_inactive_devices() TO service_role;


--

-- Name: FUNCTION create_daily_balance_snapshots(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_daily_balance_snapshots() TO anon;
GRANT ALL ON FUNCTION public.create_daily_balance_snapshots() TO authenticated;
GRANT ALL ON FUNCTION public.create_daily_balance_snapshots() TO service_role;


--

-- Name: FUNCTION create_default_notification_preferences(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_default_notification_preferences() TO anon;
GRANT ALL ON FUNCTION public.create_default_notification_preferences() TO authenticated;
GRANT ALL ON FUNCTION public.create_default_notification_preferences() TO service_role;


--

-- Name: FUNCTION create_user_bank_account(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_user_bank_account(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.create_user_bank_account(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_user_bank_account(p_user_id uuid) TO service_role;


--

-- Name: FUNCTION deactivate_expired_qr_codes(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.deactivate_expired_qr_codes() TO anon;
GRANT ALL ON FUNCTION public.deactivate_expired_qr_codes() TO authenticated;
GRANT ALL ON FUNCTION public.deactivate_expired_qr_codes() TO service_role;


--

-- Name: FUNCTION delete_queue_message(p_queue_name text, p_msg_id bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.delete_queue_message(p_queue_name text, p_msg_id bigint) TO anon;
GRANT ALL ON FUNCTION public.delete_queue_message(p_queue_name text, p_msg_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.delete_queue_message(p_queue_name text, p_msg_id bigint) TO service_role;


--

-- Name: FUNCTION enqueue_notification(p_user_id uuid, p_notification_type text, p_data jsonb, p_related_transaction_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enqueue_notification(p_user_id uuid, p_notification_type text, p_data jsonb, p_related_transaction_id uuid) TO anon;
GRANT ALL ON FUNCTION public.enqueue_notification(p_user_id uuid, p_notification_type text, p_data jsonb, p_related_transaction_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.enqueue_notification(p_user_id uuid, p_notification_type text, p_data jsonb, p_related_transaction_id uuid) TO service_role;


--

-- Name: FUNCTION generate_reference_number(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_reference_number() TO anon;
GRANT ALL ON FUNCTION public.generate_reference_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_reference_number() TO service_role;


--

-- Name: FUNCTION generate_static_qr(p_account_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_static_qr(p_account_id uuid) TO anon;
GRANT ALL ON FUNCTION public.generate_static_qr(p_account_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.generate_static_qr(p_account_id uuid) TO service_role;


--

-- Name: FUNCTION generate_transaction_reference(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_transaction_reference() TO anon;
GRANT ALL ON FUNCTION public.generate_transaction_reference() TO authenticated;
GRANT ALL ON FUNCTION public.generate_transaction_reference() TO service_role;


--

-- Name: FUNCTION generate_unique_alias(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_unique_alias() TO anon;
GRANT ALL ON FUNCTION public.generate_unique_alias() TO authenticated;
GRANT ALL ON FUNCTION public.generate_unique_alias() TO service_role;


--

-- Name: FUNCTION generate_unique_cbu(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_unique_cbu() TO anon;
GRANT ALL ON FUNCTION public.generate_unique_cbu() TO authenticated;
GRANT ALL ON FUNCTION public.generate_unique_cbu() TO service_role;


--

-- Name: FUNCTION generate_unique_cvu(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_unique_cvu() TO anon;
GRANT ALL ON FUNCTION public.generate_unique_cvu() TO authenticated;
GRANT ALL ON FUNCTION public.generate_unique_cvu() TO service_role;


--

-- Name: FUNCTION get_account_info(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_account_info(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_account_info(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_account_info(p_user_id uuid) TO service_role;


--

-- Name: FUNCTION get_active_push_devices(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_active_push_devices(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_active_push_devices(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_active_push_devices(p_user_id uuid) TO service_role;


--

-- Name: FUNCTION get_api_access(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_api_access() TO anon;
GRANT ALL ON FUNCTION public.get_api_access() TO authenticated;
GRANT ALL ON FUNCTION public.get_api_access() TO service_role;


--

-- Name: FUNCTION get_balance_at_date(p_account_id uuid, p_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_balance_at_date(p_account_id uuid, p_date date) TO anon;
GRANT ALL ON FUNCTION public.get_balance_at_date(p_account_id uuid, p_date date) TO authenticated;
GRANT ALL ON FUNCTION public.get_balance_at_date(p_account_id uuid, p_date date) TO service_role;


--

-- Name: FUNCTION get_balance_inconsistencies(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_balance_inconsistencies() TO anon;
GRANT ALL ON FUNCTION public.get_balance_inconsistencies() TO authenticated;
GRANT ALL ON FUNCTION public.get_balance_inconsistencies() TO service_role;


--

-- Name: FUNCTION get_user_devices_list(p_user_id text, p_current_device_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_devices_list(p_user_id text, p_current_device_id text) TO anon;
GRANT ALL ON FUNCTION public.get_user_devices_list(p_user_id text, p_current_device_id text) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_devices_list(p_user_id text, p_current_device_id text) TO service_role;


--

-- Name: FUNCTION get_user_id_from_account(p_account_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_id_from_account(p_account_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_id_from_account(p_account_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_id_from_account(p_account_id uuid) TO service_role;


--

-- Name: FUNCTION get_user_login_data(email_input text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_login_data(email_input text) TO anon;
GRANT ALL ON FUNCTION public.get_user_login_data(email_input text) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_login_data(email_input text) TO service_role;


--

-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--

-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;


--

-- Name: FUNCTION log_account_alias_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_account_alias_change() TO anon;
GRANT ALL ON FUNCTION public.log_account_alias_change() TO authenticated;
GRANT ALL ON FUNCTION public.log_account_alias_change() TO service_role;


--

-- Name: FUNCTION log_api_credential_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_api_credential_change() TO anon;
GRANT ALL ON FUNCTION public.log_api_credential_change() TO authenticated;
GRANT ALL ON FUNCTION public.log_api_credential_change() TO service_role;


--

-- Name: FUNCTION monitor_balance_inconsistencies(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.monitor_balance_inconsistencies() TO anon;
GRANT ALL ON FUNCTION public.monitor_balance_inconsistencies() TO authenticated;
GRANT ALL ON FUNCTION public.monitor_balance_inconsistencies() TO service_role;


--

-- Name: FUNCTION monitor_negative_balances(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.monitor_negative_balances() TO anon;
GRANT ALL ON FUNCTION public.monitor_negative_balances() TO authenticated;
GRANT ALL ON FUNCTION public.monitor_negative_balances() TO service_role;


--

-- Name: FUNCTION process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying, p_payment_method character varying, p_device_id uuid, p_ip_address inet); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying, p_payment_method character varying, p_device_id uuid, p_ip_address inet) TO anon;
GRANT ALL ON FUNCTION public.process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying, p_payment_method character varying, p_device_id uuid, p_ip_address inet) TO authenticated;
GRANT ALL ON FUNCTION public.process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying, p_payment_method character varying, p_device_id uuid, p_ip_address inet) TO service_role;


--

-- Name: FUNCTION read_queue_messages(p_queue_name text, p_vt integer, p_qty integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.read_queue_messages(p_queue_name text, p_vt integer, p_qty integer) TO anon;
GRANT ALL ON FUNCTION public.read_queue_messages(p_queue_name text, p_vt integer, p_qty integer) TO authenticated;
GRANT ALL ON FUNCTION public.read_queue_messages(p_queue_name text, p_vt integer, p_qty integer) TO service_role;


--

-- Name: FUNCTION reconcile_account_balance(p_account_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reconcile_account_balance(p_account_id uuid) TO anon;
GRANT ALL ON FUNCTION public.reconcile_account_balance(p_account_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.reconcile_account_balance(p_account_id uuid) TO service_role;


--

-- Name: FUNCTION reconcile_all_accounts(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reconcile_all_accounts() TO anon;
GRANT ALL ON FUNCTION public.reconcile_all_accounts() TO authenticated;
GRANT ALL ON FUNCTION public.reconcile_all_accounts() TO service_role;


--

-- Name: FUNCTION reset_daily_limits(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reset_daily_limits() TO anon;
GRANT ALL ON FUNCTION public.reset_daily_limits() TO authenticated;
GRANT ALL ON FUNCTION public.reset_daily_limits() TO service_role;


--

-- Name: FUNCTION reset_monthly_limits(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reset_monthly_limits() TO anon;
GRANT ALL ON FUNCTION public.reset_monthly_limits() TO authenticated;
GRANT ALL ON FUNCTION public.reset_monthly_limits() TO service_role;


--

-- Name: FUNCTION revoke_all_other_devices(p_user_id text, p_current_device_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.revoke_all_other_devices(p_user_id text, p_current_device_id text) TO anon;
GRANT ALL ON FUNCTION public.revoke_all_other_devices(p_user_id text, p_current_device_id text) TO authenticated;
GRANT ALL ON FUNCTION public.revoke_all_other_devices(p_user_id text, p_current_device_id text) TO service_role;


--

-- Name: FUNCTION revoke_user_device(p_user_id text, p_device_record_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.revoke_user_device(p_user_id text, p_device_record_id uuid) TO anon;
GRANT ALL ON FUNCTION public.revoke_user_device(p_user_id text, p_device_record_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.revoke_user_device(p_user_id text, p_device_record_id uuid) TO service_role;


--

-- Name: FUNCTION search_account_for_transfer(p_identifier character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_account_for_transfer(p_identifier character varying) TO anon;
GRANT ALL ON FUNCTION public.search_account_for_transfer(p_identifier character varying) TO authenticated;
GRANT ALL ON FUNCTION public.search_account_for_transfer(p_identifier character varying) TO service_role;


--

-- Name: FUNCTION suspend_user_account(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.suspend_user_account(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.suspend_user_account(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.suspend_user_account(p_user_id uuid) TO service_role;


--

-- Name: FUNCTION sync_qr_data_from_account(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_qr_data_from_account() TO anon;
GRANT ALL ON FUNCTION public.sync_qr_data_from_account() TO authenticated;
GRANT ALL ON FUNCTION public.sync_qr_data_from_account() TO service_role;


--

-- Name: FUNCTION trigger_create_account_on_user_signup(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trigger_create_account_on_user_signup() TO anon;
GRANT ALL ON FUNCTION public.trigger_create_account_on_user_signup() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_create_account_on_user_signup() TO service_role;


--

-- Name: FUNCTION trigger_enqueue_transaction_notification(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trigger_enqueue_transaction_notification() TO anon;
GRANT ALL ON FUNCTION public.trigger_enqueue_transaction_notification() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_enqueue_transaction_notification() TO service_role;


--

-- Name: FUNCTION update_device_activity(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_device_activity() TO anon;
GRANT ALL ON FUNCTION public.update_device_activity() TO authenticated;
GRANT ALL ON FUNCTION public.update_device_activity() TO service_role;


--

-- Name: FUNCTION update_notification_preferences_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_notification_preferences_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_notification_preferences_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_notification_preferences_updated_at() TO service_role;


--

-- Name: FUNCTION update_qr_last_used(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_qr_last_used() TO anon;
GRANT ALL ON FUNCTION public.update_qr_last_used() TO authenticated;
GRANT ALL ON FUNCTION public.update_qr_last_used() TO service_role;


--

-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--

-- Name: FUNCTION upsert_user_device(p_user_id text, p_device_id text, p_device_name text, p_device_model text, p_device_type text, p_os_version text, p_app_version text, p_platform text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_user_device(p_user_id text, p_device_id text, p_device_name text, p_device_model text, p_device_type text, p_os_version text, p_app_version text, p_platform text) TO anon;
GRANT ALL ON FUNCTION public.upsert_user_device(p_user_id text, p_device_id text, p_device_name text, p_device_model text, p_device_type text, p_os_version text, p_app_version text, p_platform text) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_user_device(p_user_id text, p_device_id text, p_device_name text, p_device_model text, p_device_type text, p_os_version text, p_app_version text, p_platform text) TO service_role;


--

-- Name: FUNCTION validate_account_limits(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_account_limits() TO anon;
GRANT ALL ON FUNCTION public.validate_account_limits() TO authenticated;
GRANT ALL ON FUNCTION public.validate_account_limits() TO service_role;


--

-- Name: FUNCTION validate_balance_after_transaction(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_balance_after_transaction() TO anon;
GRANT ALL ON FUNCTION public.validate_balance_after_transaction() TO authenticated;
GRANT ALL ON FUNCTION public.validate_balance_after_transaction() TO service_role;


--

-- Name: FUNCTION validate_qr(p_qr_hash character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_qr(p_qr_hash character varying) TO anon;
GRANT ALL ON FUNCTION public.validate_qr(p_qr_hash character varying) TO authenticated;
GRANT ALL ON FUNCTION public.validate_qr(p_qr_hash character varying) TO service_role;


--

-- Name: TABLE account_alias_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_alias_history TO anon;
GRANT ALL ON TABLE public.account_alias_history TO authenticated;
GRANT ALL ON TABLE public.account_alias_history TO service_role;


--

-- Name: TABLE accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accounts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.accounts TO service_role;


--

-- Name: COLUMN accounts.alias; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(alias) ON TABLE public.accounts TO authenticated;


--

-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--

-- Name: TABLE account_balance_reconciliation; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_balance_reconciliation TO anon;
GRANT ALL ON TABLE public.account_balance_reconciliation TO authenticated;
GRANT ALL ON TABLE public.account_balance_reconciliation TO service_role;


--

-- Name: TABLE account_balance_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_balance_snapshots TO anon;
GRANT ALL ON TABLE public.account_balance_snapshots TO authenticated;
GRANT ALL ON TABLE public.account_balance_snapshots TO service_role;


--

-- Name: TABLE account_limits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_limits TO anon;
GRANT ALL ON TABLE public.account_limits TO authenticated;
GRANT ALL ON TABLE public.account_limits TO service_role;


--

-- Name: TABLE transaction_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transaction_types TO anon;
GRANT ALL ON TABLE public.transaction_types TO authenticated;
GRANT ALL ON TABLE public.transaction_types TO service_role;


--

-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--

-- Name: TABLE account_movements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_movements TO anon;
GRANT ALL ON TABLE public.account_movements TO authenticated;
GRANT ALL ON TABLE public.account_movements TO service_role;


--

-- Name: TABLE account_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_types TO anon;
GRANT ALL ON TABLE public.account_types TO authenticated;
GRANT ALL ON TABLE public.account_types TO service_role;


--

-- Name: TABLE admin_transaction_list; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_transaction_list TO anon;
GRANT ALL ON TABLE public.admin_transaction_list TO authenticated;
GRANT ALL ON TABLE public.admin_transaction_list TO service_role;


--

-- Name: TABLE api_access; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_access TO anon;
GRANT ALL ON TABLE public.api_access TO authenticated;
GRANT ALL ON TABLE public.api_access TO service_role;


--

-- Name: TABLE api_credential_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_credential_history TO anon;
GRANT ALL ON TABLE public.api_credential_history TO authenticated;
GRANT ALL ON TABLE public.api_credential_history TO service_role;


--

-- Name: TABLE api_request_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_request_logs TO anon;
GRANT ALL ON TABLE public.api_request_logs TO authenticated;
GRANT ALL ON TABLE public.api_request_logs TO service_role;


--

-- Name: TABLE app_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.app_versions TO anon;
GRANT ALL ON TABLE public.app_versions TO authenticated;
GRANT ALL ON TABLE public.app_versions TO service_role;


--

-- Name: SEQUENCE app_versions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.app_versions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.app_versions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.app_versions_id_seq TO service_role;


--

-- Name: TABLE balance_corrections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.balance_corrections TO anon;
GRANT ALL ON TABLE public.balance_corrections TO authenticated;
GRANT ALL ON TABLE public.balance_corrections TO service_role;


--

-- Name: TABLE email_otps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_otps TO anon;
GRANT ALL ON TABLE public.email_otps TO authenticated;
GRANT ALL ON TABLE public.email_otps TO service_role;


--

-- Name: TABLE notification_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_log TO anon;
GRANT ALL ON TABLE public.notification_log TO authenticated;
GRANT ALL ON TABLE public.notification_log TO service_role;


--

-- Name: TABLE notification_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_preferences TO anon;
GRANT ALL ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;


--

-- Name: TABLE notification_stats_by_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_stats_by_user TO anon;
GRANT ALL ON TABLE public.notification_stats_by_user TO authenticated;
GRANT ALL ON TABLE public.notification_stats_by_user TO service_role;


--

-- Name: TABLE notification_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_types TO anon;
GRANT ALL ON TABLE public.notification_types TO authenticated;
GRANT ALL ON TABLE public.notification_types TO service_role;


--

-- Name: TABLE qr_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.qr_codes TO anon;
GRANT ALL ON TABLE public.qr_codes TO authenticated;
GRANT ALL ON TABLE public.qr_codes TO service_role;


--

-- Name: TABLE support; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support TO anon;
GRANT ALL ON TABLE public.support TO authenticated;
GRANT ALL ON TABLE public.support TO service_role;


--

-- Name: SEQUENCE support_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.support_id_seq TO anon;
GRANT ALL ON SEQUENCE public.support_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.support_id_seq TO service_role;


--

-- Name: TABLE user_auth_credentials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_auth_credentials TO anon;
GRANT ALL ON TABLE public.user_auth_credentials TO authenticated;
GRANT ALL ON TABLE public.user_auth_credentials TO service_role;


--

-- Name: TABLE user_devices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_devices TO anon;
GRANT ALL ON TABLE public.user_devices TO authenticated;
GRANT ALL ON TABLE public.user_devices TO service_role;


--

-- Name: TABLE worker_invocations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.worker_invocations TO anon;
GRANT ALL ON TABLE public.worker_invocations TO authenticated;
GRANT ALL ON TABLE public.worker_invocations TO service_role;


--
