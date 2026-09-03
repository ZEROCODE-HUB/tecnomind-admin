-- =====================================================================
-- Claves foráneas
-- Van después de todas las tablas para evitar problemas de orden.
-- =====================================================================


-- Name: account_alias_history account_alias_history_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_alias_history
    ADD CONSTRAINT account_alias_history_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: account_alias_history account_alias_history_changed_by_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_alias_history
    ADD CONSTRAINT account_alias_history_changed_by_device_id_fkey FOREIGN KEY (changed_by_device_id) REFERENCES public.user_devices(id);


--

-- Name: account_balance_snapshots account_balance_snapshots_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_snapshots
    ADD CONSTRAINT account_balance_snapshots_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: account_limits account_limits_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_limits
    ADD CONSTRAINT account_limits_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: accounts accounts_account_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_account_type_id_fkey FOREIGN KEY (account_type_id) REFERENCES public.account_types(id);


--

-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: api_access api_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_access
    ADD CONSTRAINT api_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: api_credential_history api_credential_history_api_access_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_credential_history
    ADD CONSTRAINT api_credential_history_api_access_id_fkey FOREIGN KEY (api_access_id) REFERENCES public.api_access(id) ON DELETE CASCADE;


--

-- Name: api_credential_history api_credential_history_changed_from_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_credential_history
    ADD CONSTRAINT api_credential_history_changed_from_device_id_fkey FOREIGN KEY (changed_from_device_id) REFERENCES public.user_devices(id);


--

-- Name: api_credential_history api_credential_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_credential_history
    ADD CONSTRAINT api_credential_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: api_request_logs api_request_logs_api_access_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_request_logs
    ADD CONSTRAINT api_request_logs_api_access_id_fkey FOREIGN KEY (api_access_id) REFERENCES public.api_access(id) ON DELETE CASCADE;


--

-- Name: balance_corrections balance_corrections_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_corrections
    ADD CONSTRAINT balance_corrections_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: notification_log notification_log_related_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_related_account_id_fkey FOREIGN KEY (related_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--

-- Name: notification_log notification_log_related_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_related_transaction_id_fkey FOREIGN KEY (related_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--

-- Name: notification_log notification_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: qr_codes qr_codes_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: transactions transactions_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_from_account_id_fkey FOREIGN KEY (from_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: transactions transactions_initiated_from_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_initiated_from_device_id_fkey FOREIGN KEY (initiated_from_device_id) REFERENCES public.user_devices(id) ON DELETE CASCADE;


--

-- Name: transactions transactions_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--

-- Name: transactions transactions_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_type_id_fkey FOREIGN KEY (transaction_type_id) REFERENCES public.transaction_types(id);


--

-- Name: user_auth_credentials user_auth_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_auth_credentials
    ADD CONSTRAINT user_auth_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
