import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data?.user) {
                setUser(data.user)
                return data.user
            }
        } catch (err) {
            console.error("Login failed:", err)
        } finally {
            setLoading(false)
        }
        return null
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if (data?.user) {
                setUser(data.user)
                return data.user
            }
        } catch (err) {
            console.error("Registration failed:", err)
        } finally {
            setLoading(false)
        }
        return null
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.error("Logout failed:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                if (data?.user) {
                    setUser(data.user)
                }
            } catch (err) {
                console.debug("User not authenticated:", err)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [ setLoading, setUser ])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}