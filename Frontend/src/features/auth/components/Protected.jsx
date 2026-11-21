import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '42px', height: '42px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#e1034d', borderRadius: '50%', margin: '0 auto 1.25rem', animation: 'spin 0.8s linear infinite' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e6edf3' }}>Loading Interview-Ready...</h2>
                    <p style={{ color: '#7d8590', fontSize: '0.875rem', marginTop: '0.5rem' }}>Verifying your secure session</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </main>
        )
    }

    if (!user) {
        return <Navigate to={'/login'} replace />
    }

    return children
}

export default Protected
