import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!email.trim() || !password) {
            setError("Please enter both email and password.")
            return
        }

        setIsSubmitting(true)
        const res = await handleLogin({ email: email.trim(), password })
        setIsSubmitting(false)

        if (res.success) {
            navigate('/')
        } else {
            setError(res.message || "Invalid credentials or server error. Please try again.")
        }
    }

    if (loading) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className='spinner' style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#e1034d', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Checking session...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </main>
        )
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                {error && (
                    <div style={{ background: '#3b1219', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#fca5a5', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.875rem', lineHeight: '1.4' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            value={email}
                            type="email"
                            id="email"
                            name='email'
                            placeholder='Enter email address'
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            value={password}
                            type="password"
                            id="password"
                            name='password'
                            placeholder='Enter password'
                            required
                        />
                    </div>
                    <button className='button primary-button' disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login
