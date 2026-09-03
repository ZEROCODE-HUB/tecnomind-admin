-- =====================================================================
-- RLS y políticas
-- Habilitación de RLS y 55 políticas heredadas de Magnate.
-- =====================================================================


-- Name: account_alias_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_alias_history ENABLE ROW LEVEL SECURITY;

--

-- Name: account_balance_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_balance_snapshots ENABLE ROW LEVEL SECURITY;

--

-- Name: account_limits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_limits ENABLE ROW LEVEL SECURITY;

--

-- Name: account_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;

--

-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--

-- Name: api_access; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.api_access ENABLE ROW LEVEL SECURITY;

--

-- Name: api_credential_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.api_credential_history ENABLE ROW LEVEL SECURITY;

--

-- Name: api_request_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

--

-- Name: app_versions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

--

-- Name: balance_corrections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.balance_corrections ENABLE ROW LEVEL SECURITY;

--

-- Name: email_otps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

--

-- Name: notification_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

--

-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--

-- Name: qr_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

--

-- Name: support; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support ENABLE ROW LEVEL SECURITY;

--

-- Name: transaction_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;

--

-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--

-- Name: user_auth_credentials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_auth_credentials ENABLE ROW LEVEL SECURITY;

--

-- Name: user_devices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

--

-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--

-- Name: account_limits Admins can insert account limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert account limits" ON public.account_limits FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--

-- Name: account_limits Admins can update all account limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all account limits" ON public.account_limits FOR UPDATE TO authenticated USING (public.is_admin());


--

-- Name: users Admins can update all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE TO authenticated USING (public.is_admin());


--

-- Name: account_limits Admins can view all account limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all account limits" ON public.account_limits FOR SELECT TO authenticated USING (public.is_admin());


--

-- Name: accounts Admins can view all accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT TO authenticated USING (public.is_admin());


--

-- Name: transactions Admins can view all transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.is_admin());


--

-- Name: users Admins can view all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all users" ON public.users FOR SELECT TO authenticated USING (public.is_admin());


--

-- Name: email_otps All; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "All" ON public.email_otps USING (true) WITH CHECK (true);


--

-- Name: support Allow authenticated update access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated update access" ON public.support FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--

-- Name: support Allow public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read access" ON public.support FOR SELECT TO authenticated, anon USING (true);


--

-- Name: account_types Anyone can view account types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view account types" ON public.account_types FOR SELECT USING ((is_active = true));


--

-- Name: transaction_types Anyone can view transaction types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view transaction types" ON public.transaction_types FOR SELECT USING ((is_active = true));


--

-- Name: app_versions Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON public.app_versions FOR SELECT USING (true);


--

-- Name: account_types Service role can manage account types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can manage account types" ON public.account_types TO service_role USING (true) WITH CHECK (true);


--

-- Name: transaction_types Service role can manage transaction types; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can manage transaction types" ON public.transaction_types TO service_role USING (true) WITH CHECK (true);


--

-- Name: api_request_logs System can insert API logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert API logs" ON public.api_request_logs FOR INSERT TO service_role WITH CHECK (true);


--

-- Name: account_alias_history System can insert alias history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert alias history" ON public.account_alias_history FOR INSERT TO service_role WITH CHECK (true);


--

-- Name: balance_corrections System can insert corrections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert corrections" ON public.balance_corrections FOR INSERT TO service_role WITH CHECK (true);


--

-- Name: api_credential_history System can insert credential history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert credential history" ON public.api_credential_history FOR INSERT TO service_role WITH CHECK (true);


--

-- Name: account_balance_snapshots System can manage snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can manage snapshots" ON public.account_balance_snapshots TO service_role USING (true) WITH CHECK (true);


--

-- Name: account_limits System can update limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can update limits" ON public.account_limits FOR UPDATE TO service_role USING (true) WITH CHECK (true);


--

-- Name: transactions System can update transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can update transactions" ON public.transactions FOR UPDATE TO service_role USING (true) WITH CHECK (true);


--

-- Name: qr_codes Users can delete own QR codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own QR codes" ON public.qr_codes FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = qr_codes.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: user_devices Users can delete own devices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own devices" ON public.user_devices FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--

-- Name: users Users can insert during signup; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert during signup" ON public.users FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--

-- Name: api_access Users can insert own API access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own API access" ON public.api_access FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (is_enabled = false)));


--

-- Name: qr_codes Users can insert own QR codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own QR codes" ON public.qr_codes FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = qr_codes.account_id) AND (a.user_id = auth.uid()) AND ((a.status)::text = 'active'::text)))));


--

-- Name: account_limits Users can insert own account limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own account limits" ON public.account_limits FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = account_limits.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: accounts Users can insert own accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND ((status)::text = 'active'::text) AND (NOT (EXISTS ( SELECT 1
   FROM public.accounts accounts_1
  WHERE (accounts_1.user_id = auth.uid()))))));


--

-- Name: user_auth_credentials Users can insert own credentials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own credentials" ON public.user_auth_credentials FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--

-- Name: user_devices Users can insert own devices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own devices" ON public.user_devices FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--

-- Name: transactions Users can insert own transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = transactions.from_account_id) AND (a.user_id = auth.uid()) AND ((a.status)::text = 'active'::text)))) AND ((status)::text = 'pending'::text)));


--

-- Name: notification_preferences Users can insert their own notification preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK ((user_id = auth.uid()));


--

-- Name: api_access Users can update own API access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own API access" ON public.api_access FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--

-- Name: qr_codes Users can update own QR codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own QR codes" ON public.qr_codes FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = qr_codes.account_id) AND (a.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = qr_codes.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: accounts Users can update own accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--

-- Name: user_auth_credentials Users can update own credentials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own credentials" ON public.user_auth_credentials FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--

-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK (((auth.uid() = id) AND (id = ( SELECT users_1.id
   FROM public.users users_1
  WHERE (users_1.id = auth.uid())))));


--

-- Name: user_devices Users can update own devices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own devices" ON public.user_devices FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--

-- Name: notification_preferences Users can update their own notification preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences FOR UPDATE USING ((user_id = auth.uid()));


--

-- Name: api_access Users can view own API access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own API access" ON public.api_access FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--

-- Name: api_credential_history Users can view own API history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own API history" ON public.api_credential_history FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--

-- Name: api_request_logs Users can view own API logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own API logs" ON public.api_request_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.api_access aa
  WHERE ((aa.id = api_request_logs.api_access_id) AND (aa.user_id = auth.uid())))));


--

-- Name: qr_codes Users can view own QR codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own QR codes" ON public.qr_codes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = qr_codes.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: accounts Users can view own accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--

-- Name: account_alias_history Users can view own alias history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own alias history" ON public.account_alias_history FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = account_alias_history.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: balance_corrections Users can view own balance corrections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own balance corrections" ON public.balance_corrections FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = balance_corrections.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: user_auth_credentials Users can view own credentials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own credentials" ON public.user_auth_credentials FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--

-- Name: users Users can view own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own data" ON public.users FOR SELECT TO authenticated USING ((auth.uid() = id));


--

-- Name: user_devices Users can view own devices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own devices" ON public.user_devices FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--

-- Name: account_limits Users can view own limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own limits" ON public.account_limits FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = account_limits.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: account_balance_snapshots Users can view own snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own snapshots" ON public.account_balance_snapshots FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE ((a.id = account_balance_snapshots.account_id) AND (a.user_id = auth.uid())))));


--

-- Name: transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.accounts a
  WHERE (((a.id = transactions.from_account_id) OR (a.id = transactions.to_account_id)) AND (a.user_id = auth.uid())))));


--

-- Name: notification_log Users can view their own notification logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notification logs" ON public.notification_log FOR SELECT USING ((user_id = auth.uid()));


--

-- Name: notification_preferences Users can view their own notification preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences FOR SELECT USING ((user_id = auth.uid()));


--
