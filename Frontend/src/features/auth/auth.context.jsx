/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                // If there's a stored token or cookie, verify with backend
                const data = await getMe();
                if (isMounted && data?.user) {
                    setUser(data.user);
                } else if (isMounted) {
                    setUser(null);
                    localStorage.removeItem("token");
                }
            } catch {
                if (isMounted) {
                    setUser(null);
                    localStorage.removeItem("token");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
