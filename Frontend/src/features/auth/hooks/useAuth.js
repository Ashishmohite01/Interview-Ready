import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            if (data?.token) {
                localStorage.setItem("token", data.token);
            }
            if (data?.user) {
                setUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data?.message || "Login failed" };
        } catch (err) {
            console.error("Login failed:", err);
            const message =
                err.response?.data?.message ||
                (err.code === "ERR_NETWORK"
                    ? "Cannot reach the server. If this is a deployed app, ensure VITE_API_URL is configured in your frontend host."
                    : "Invalid email or password. Please try again.");
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            if (data?.token) {
                localStorage.setItem("token", data.token);
            }
            if (data?.user) {
                setUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data?.message || "Registration failed" };
        } catch (err) {
            console.error("Registration failed:", err);
            const message =
                err.response?.data?.message ||
                (err.code === "ERR_NETWORK"
                    ? "Cannot reach the server. If this is a deployed app, ensure VITE_API_URL is configured in your frontend host."
                    : "Registration failed. An account with this email or username may already exist.");
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            localStorage.removeItem("token");
            setUser(null);
            setLoading(false);
        }
    };

    return { user, loading, handleRegister, handleLogin, handleLogout };
};
