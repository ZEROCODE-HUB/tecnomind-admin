// Authentication Data Source
import { supabase } from '../../../lib/supabase';
import { User } from '../../../domain/entities/User';

export interface LoginUserData {
    id: string;
    email: string;
    pin_hash: string;
    verification_status: string;
    web_access_enabled: boolean;
    web_password_hash: string | null;
    auto_password_encrypted: string | null;
}

export class AuthDataSource {
    /**
     * Login with email and web password
     * Validates web access is enabled and password is correct via Edge Function
     */
    async loginWithWebPassword(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
        try {
            const normalizedEmail = email.toLowerCase().trim();

            // 1. Call Edge Function for secure validation
            const { data, error: invokeError } = await supabase.functions.invoke('web-login', {
                body: { email: normalizedEmail, password: password }
            });

            if (invokeError) {
                console.error('Invoke error:', invokeError);

                // Try to extract the error message from the response body if it's a FunctionsHttpError
                try {
                    if (invokeError.context instanceof Response) {
                        const errorJson = await invokeError.context.clone().json();
                        const errorMsg = errorJson.error || errorJson.message;
                        if (errorMsg) return { success: false, error: errorMsg };
                    } else if (invokeError.context?.json) {
                        const errorMsg = invokeError.context.json.error || invokeError.context.json.message;
                        if (errorMsg) return { success: false, error: errorMsg };
                    }
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                }

                return { success: false, error: 'Error al conectar con el servidor de autenticación' };
            }

            if (!data?.success) {
                return { success: false, error: data?.error || 'Credenciales inválidas' };
            }

            const loginUser = data.user;

            // 2. Check verification status
            if (loginUser.verification_status === 'suspended') {
                return { success: false, error: 'Cuenta suspendida' };
            }

            if (loginUser.verification_status !== 'verified') {
                return { success: false, error: 'Cuenta pendiente de verificación' };
            }

            // 3. Check for auto password (required for Supabase Auth)
            if (!loginUser.auto_password_encrypted) {
                return { success: false, error: 'Error de configuración de cuenta (No auth credentials found)' };
            }

            // 4. Decrypt auto password
            const { decrypt } = await import('../../../lib/crypto');
            const autoPassword = await decrypt(loginUser.auto_password_encrypted);

            // 5. Sign in with Supabase Auth using the decrypted password
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: autoPassword,
            });

            if (signInError) {
                console.error('Sign in error:', signInError);
                return { success: false, error: 'Error al iniciar sesión en el servicio de datos' };
            }

            if (!authData.user) {
                return { success: false, error: 'Error al establecer la sesión' };
            }

            // 6. Fetch full user data to ensure we have all fields for the domain entity
            const { data: fullUserData, error: fullUserError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (fullUserError || !fullUserData) {
                console.error('Error fetching user data:', fullUserError);
                return { success: true, user: loginUser as unknown as User }; // Return what we have if full fetch fails
            }

            return {
                success: true,
                user: fullUserData as User
            };

        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Error desconocido' };
        }
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        await supabase.auth.signOut();
    }

    /**
     * Get current session
     */
    async getCurrentSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const session = await this.getCurrentSession();
        return !!session;
    }
}
