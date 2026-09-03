// Auth Context for Web - Version 3.1 (Stable Logout)
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '@/domain/entities/User';
import { AccountWithType } from '@/domain/entities/Account';
import { supabase } from '@/lib/supabase';

// Import use cases and repositories
import { LoginWithWebPassword } from '@/domain/usecases/auth/LoginWithWebPassword';
import { Logout } from '@/domain/usecases/auth/Logout';
import { AuthRepository } from '@/data/repositories/AuthRepository';
import { UserRepository } from '@/data/repositories/UserRepository';
import { AccountRepository } from '@/data/repositories/AccountRepository';
import { AuthDataSource } from '@/data/datasources/supabase/AuthDataSource';
import { UserDataSource } from '@/data/datasources/supabase/UserDataSource';
import { AccountDataSource } from '@/data/datasources/supabase/AccountDataSource';

interface AuthContextType {
    user: User | null;
    account: AccountWithType | null;
    session: any;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize dependencies
const authDataSource = new AuthDataSource();
const userDataSource = new UserDataSource();
const accountDataSource = new AccountDataSource();

const authRepository = new AuthRepository(authDataSource);
const userRepository = new UserRepository(userDataSource);
const accountRepository = new AccountRepository(accountDataSource);

const loginUseCase = new LoginWithWebPassword(authRepository);
const logoutUseCase = new Logout(authRepository);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<AccountWithType | null>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ✅ Referencia para la suscripción en tiempo real (persiste entre renders)
    const realtimeSubscriptionRef = useRef<any>(null);

    const isAuthenticated = !!session && !!user;

    // ✅ Función para configurar la suscripción
    const setupRealtimeSubscription = async (userId: string) => {
        // Si ya existe una suscripción activa para este usuario, no hacer nada
        if (realtimeSubscriptionRef.current) return;


        realtimeSubscriptionRef.current = supabase
            .channel(`public:users:id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userId}`,
                },
                async (payload) => {
                    const newUser = payload.new as User;
                    if (newUser.verification_status === 'suspended') {

                        await logout();
                        window.location.replace('/login?reason=suspended');
                    }
                }
            )
            .subscribe();
    };

    // Monitor state changes specifically for logout debugging
    useEffect(() => {
        if (session || user || !loading) {

        }
    }, [session, user, loading, isAuthenticated]);

    const loadingUserRef = useRef<string | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    // Monitor for user inactivity
    useEffect(() => {
        let throttleTimeout: NodeJS.Timeout | null = null;
        
        const handleActivity = () => {
            const now = Date.now();
            lastActivityRef.current = now;
            
            // Throttle localStorage writes to prevent performance issues
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    localStorage.setItem('magnate_last_activity', now.toString());
                    throttleTimeout = null;
                }, 2000); // Write at most every 2 seconds
            }
        };

        // Attach event listeners for user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        return () => {
            if (throttleTimeout) clearTimeout(throttleTimeout);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, []);

    // Check inactivity interval
    useEffect(() => {
        const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

        const intervalId = setInterval(() => {
            if (isAuthenticated) {
                // Get the most recent activity across all tabs
                const storedActivity = parseInt(localStorage.getItem('magnate_last_activity') || '0', 10);
                const mostRecent = Math.max(lastActivityRef.current, storedActivity);
                
                const now = Date.now();
                if (now - mostRecent >= INACTIVITY_TIMEOUT_MS) {

                    // Clear the interval to prevent multiple rapid triggers before logout completes
                    clearInterval(intervalId); 
                    
                    // We use the logout case internally, but we can also trigger a direct timeout response
                    logoutUseCase.execute().catch(console.error).finally(() => {
                        clearAllState();
                        window.location.replace('/login?reason=timeout');
                    });
                }
            }
        }, 15000); // Check every 15 seconds

        return () => clearInterval(intervalId);
    }, [isAuthenticated]);

    useEffect(() => {
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {


                if (event === 'SIGNED_OUT') {

                    clearAllState();
                } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    setSession(currentSession);
                    if (currentSession?.user) {
                        loadUserData(currentSession.user.id);
                    } else {
                        setLoading(false);
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
            // ✅ Limpiar suscripción al desmontar
            if (realtimeSubscriptionRef.current) {

                supabase.removeChannel(realtimeSubscriptionRef.current);
                realtimeSubscriptionRef.current = null;
            }
        };
    }, []);

    const clearAllState = () => {

        setUser(null);
        setAccount(null);
        setSession(null);
        setSession(null);

        // ✅ Limpiar suscripción
        if (realtimeSubscriptionRef.current) {
            supabase.removeChannel(realtimeSubscriptionRef.current);
            realtimeSubscriptionRef.current = null;
        }

        loadingUserRef.current = null;
        setLoading(false);
    };

    const checkSession = async () => {
        try {

            setLoading(true);
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('❌ [V3.1] Session check error:', error);
            }

            setSession(currentSession);
            if (currentSession?.user) {

                loadUserData(currentSession.user.id);
            } else {

                setLoading(false);
            }
        } catch (error) {
            console.error('❌ [V3.1] Unexpected error during session check:', error);
            setLoading(false);
        }
    };

    const loadUserData = async (userId: string) => {
        if (loadingUserRef.current === userId) return;

        loadingUserRef.current = userId;


        try {
            // Wait for user profile with timeout
            const userPromise = userRepository.getUserById(userId);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile load timeout')), 10000)
            );

            const userData = await Promise.race([userPromise, timeoutPromise]) as User | null;


            setUser(userData);

            if (userData) {
                // [V3.1] Check for suspension immediately after loading profile
                if (userData.verification_status === 'suspended') {
                    console.warn('🚫 [V3.1] User is suspended. Aborting load and logging out.');
                    await logout();
                    window.location.replace('/login?reason=suspended');
                    return;
                }


                const accountData = await accountRepository.getPrimaryAccount(userId);
                setAccount(accountData);

                // Setup realtime listener for status changes
                setupRealtimeSubscription(userId);
            }
        } catch (error) {
            console.error('❌ [V3.1] User data load error:', error);
        } finally {
            if (loadingUserRef.current === userId) {
                loadingUserRef.current = null;
            }
            // Always resolve loading in this branch if we are the current loader
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {

            const result = await loginUseCase.execute(email, password);

            if (result.success && result.user) {

                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error: any) {
            console.error('❌ [V3.1] Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {

        try {
            setLoading(true);

            // Clear locally first to be safe
            setUser(null);
            setAccount(null);
            setSession(null);

            // Call Supabase with timeout
            const signOutPromise = logoutUseCase.execute();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SignOut timeout')), 4000)
            );

            await Promise.race([signOutPromise, timeoutPromise]);


        } catch (error) {
            console.error('❌ [V3.1] Logout error:', error);
        } finally {
            clearAllState();

        }
    };

    const refreshUser = async () => {
        if (!session?.user?.id) return;
        await loadUserData(session.user.id);
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user?.id) return { success: false, error: 'Usuario no identificado' };
        try {
            const updatedUser = await userRepository.updateUser(user.id, updates);
            setUser(updatedUser);
            return { success: true };
        } catch (error: any) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                account,
                session,
                loading,
                isAuthenticated,
                login,
                logout,
                refreshUser,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
