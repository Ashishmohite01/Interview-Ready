import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const { loading, handleRegister } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!username.trim() || !email.trim() || !password) {
            setError("Please fill in all fields.")
            return
        }

        setIsSubmitting(true)
        const res = await handleRegister({
            username: username.trim(),
            email: email.trim(),
            password
        })
        setIsSubmitting(false)

        if (res.success) {
            navigate("/")
        } else {
            setError(res.message || "Registration failed. Email or username might already exist.")
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
                <h1>Register</h1>
                {error && (
                    <div style={{ background: '#3b1219', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#fca5a5', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.875rem', lineHeight: '1.4' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            value={username}
                            type="text"
                            id="username"
                            name='username'
                            placeholder='Enter username'
                            required
                        />
                    </div>
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
                        {isSubmitting ? "Creating account..." : "Register"}
                    </button>
                </form>

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register
