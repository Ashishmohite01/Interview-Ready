import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useNavigate } from 'react-router'

const Home = () => {
    const { isGenerating, generateReport, reports } = useInterview()
    const { user, handleLogout } = useAuth()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ selectedFile, setSelectedFile ] = useState(null)
    const [ isDragging, setIsDragging ] = useState(false)
    const [ error, setError ] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleFileChange = (file) => {
        if (!file) return
        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setError("Please upload a PDF file (.pdf).")
            return
        }
        setError("")
        setSelectedFile(file)
    }

    const handleGenerateReport = async () => {
        if (!jobDescription.trim()) {
            setError("Please paste the Target Job Description.")
            return
        }

        if (!selectedFile && !selfDescription.trim()) {
            setError("Please provide either a Resume PDF or a Quick Self-Description.")
            return
        }

        try {
            setError("")
            const data = await generateReport({
                jobDescription: jobDescription.trim(),
                selfDescription: selfDescription.trim(),
                resumeFile: selectedFile
            })

            if (data?._id) {
                navigate(`/interview/${data._id}`)
            }
        } catch (err) {
            console.error("Strategy generation error:", err)
            const msg = err.response?.data?.message || err.message || "Failed to generate report. Please try again."
            setError(msg)
        }
    }

    if (isGenerating) {
        return (
            <main className='loading-screen'>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#e1034d', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.5rem' }}>Analyzing Job &amp; Profile...</h1>
                    <p style={{ color: '#8b949e', fontSize: '0.95rem' }}>Our AI is generating tailored questions, gap analysis, and a custom preparation roadmap (~30s).</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </main>
        )
    }

    return (
        <div className='home-page'>
            {/* Top Navigation Bar with User Info and Logout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #21262d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎯</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0f6fc', letterSpacing: '-0.02em' }}>Interview<span className='highlight'>Ready</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#21262d', border: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#e6edf3', fontSize: '0.85rem' }}>
                                {(user.username || user.email || 'U')[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#c9d1d9', fontWeight: 500 }}>{user.username || user.email}</span>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className='button outline-button'
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                {error && (
                    <div className='form-alert-error' style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: '#3b1219', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            value={jobDescription}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>

                            <div
                                className={`dropzone ${isDragging ? 'dropzone--dragging' : ''} ${selectedFile ? 'dropzone--has-file' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        handleFileChange(e.dataTransfer.files[0]);
                                    }
                                }}
                                onClick={() => {
                                    if (!selectedFile && resumeInputRef.current) {
                                        resumeInputRef.current.click()
                                    }
                                }}
                            >
                                <input
                                    ref={resumeInputRef}
                                    hidden
                                    type='file'
                                    id='resume'
                                    name='resume'
                                    accept='.pdf'
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileChange(e.target.files[0])
                                        }
                                    }}
                                />

                                {selectedFile ? (
                                    <div className='file-selected-box' style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: '#059669', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                ✓
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ margin: 0, fontWeight: 600, color: '#e6edf3', fontSize: '0.9rem' }}>{selectedFile.name}</p>
                                                <p style={{ margin: 0, color: '#7d8590', fontSize: '0.75rem' }}>{(selectedFile.size / 1024).toFixed(1)} KB &bull; PDF</p>
                                            </div>
                                        </div>
                                        <button
                                            type='button'
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedFile(null)
                                                if (resumeInputRef.current) resumeInputRef.current.value = ""
                                            }}
                                            style={{ background: 'transparent', border: '1px solid #ff2d78', color: '#ff2d78', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className='dropzone__icon'>
                                             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                        </span>
                                        <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                        <p className='dropzone__subtitle'>PDF (Max 10MB)</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                value={selfDescription}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports && reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home
