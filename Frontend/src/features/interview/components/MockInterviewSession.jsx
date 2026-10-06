import React, { useState, useEffect, useRef } from 'react'
import { evaluateMockAnswer } from '../services/interview.api'
import '../style/mock.scss'

const MockInterviewSession = ({ report }) => {
    const [ questionType, setQuestionType ] = useState('technical')
    const [ currentIndex, setCurrentIndex ] = useState(0)
    const [ answer, setAnswer ] = useState('')
    const [ isListening, setIsListening ] = useState(false)
    const [ evaluating, setEvaluating ] = useState(false)
    const [ evaluation, setEvaluation ] = useState(null)
    const [ error, setError ] = useState('')
    const [ showIdeal, setShowIdeal ] = useState(false)
    const [ sessionScores, setSessionScores ] = useState([])
    const [ sessionCompleted, setSessionCompleted ] = useState(false)

    const recognitionRef = useRef(null)

    const questions = questionType === 'technical'
        ? (report?.technicalQuestions || [])
        : (report?.behavioralQuestions || [])

    const currentQuestion = questions[ currentIndex ]

    // Setup speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onresult = (event) => {
                let transcript = ''
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[ i ][ 0 ].transcript + ' '
                }
                setAnswer(transcript.trim())
            }

            recognition.onerror = (e) => {
                console.warn('Speech recognition error:', e.error)
                setIsListening(false)
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your answer.')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            setError('')
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (err) {
                console.error(err)
            }
        }
    }

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) {
            setError('Please provide an answer before submitting (type or speak).')
            return
        }

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }

        setEvaluating(true)
        setError('')

        try {
            const data = await evaluateMockAnswer({
                question: currentQuestion.question,
                questionType,
                userAnswer: answer,
                jobTitle: report?.title || 'Software Engineer'
            })

            setEvaluation(data.evaluation)
            setSessionScores(prev => [ ...prev, data.evaluation.score ])
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to evaluate answer. Please try again.')
        } finally {
            setEvaluating(false)
        }
    }

    const handleNextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setAnswer('')
            setEvaluation(null)
            setError('')
            setShowIdeal(false)
        } else {
            setSessionCompleted(true)
        }
    }

    const handleRetry = () => {
        setEvaluation(null)
        setAnswer('')
        setError('')
        setShowIdeal(false)
    }

    const handleSwitchType = (type) => {
        setQuestionType(type)
        setCurrentIndex(0)
        setAnswer('')
        setEvaluation(null)
        setError('')
        setShowIdeal(false)
        setSessionScores([])
        setSessionCompleted(false)
    }

    if (!questions || questions.length === 0) {
        return (
            <div className='mock-empty'>
                <p>No questions found in this report to practice.</p>
            </div>
        )
    }

    if (sessionCompleted) {
        const avgScore = (sessionScores.reduce((a, b) => a + b, 0) / (sessionScores.length || 1)).toFixed(1)
        return (
            <div className='mock-completed'>
                <div className='completed-card'>
                    <div className='completed-card__trophy'>🏆</div>
                    <h2>Session Completed!</h2>
                    <p className='completed-subtitle'>You practiced {sessionScores.length} {questionType} questions for <strong>{report?.title}</strong>.</p>

                    <div className='overall-score'>
                        <div className='score-ring'>
                            <span className='score-val'>{avgScore}</span>
                            <span className='score-max'>/ 10</span>
                        </div>
                        <p className='score-desc'>
                            {avgScore >= 8 ? 'Outstanding Performance! You are well prepared.' :
                                avgScore >= 6 ? 'Solid Performance! Review the missed points to reach mastery.' :
                                    'Good practice! Study the model answers and retry to boost your score.'}
                        </p>
                    </div>

                    <div className='completed-actions'>
                        <button className='button primary-button' onClick={() => handleSwitchType(questionType)}>
                            🔄 Practice Again
                        </button>
                        <button
                            className='button secondary-button'
                            onClick={() => handleSwitchType(questionType === 'technical' ? 'behavioral' : 'technical')}
                        >
                            Switch to {questionType === 'technical' ? 'Behavioral' : 'Technical'} Questions ➡️
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const progressPct = ((currentIndex + 1) / questions.length) * 100

    return (
        <div className='mock-session'>
            {/* Header / Mode Picker */}
            <div className='mock-session__header'>
                <div className='type-switcher'>
                    <button
                        className={`type-pill ${questionType === 'technical' ? 'type-pill--active' : ''}`}
                        onClick={() => handleSwitchType('technical')}
                    >
                        💻 Technical Questions ({report?.technicalQuestions?.length || 0})
                    </button>
                    <button
                        className={`type-pill ${questionType === 'behavioral' ? 'type-pill--active' : ''}`}
                        onClick={() => handleSwitchType('behavioral')}
                    >
                        🗣️ Behavioral Questions ({report?.behavioralQuestions?.length || 0})
                    </button>
                </div>

                <div className='session-progress-info'>
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className='progress-track'>
                <div className='progress-fill' style={{ width: `${progressPct}%` }} />
            </div>

            {/* Question Display */}
            <div className='mock-question-card'>
                <div className='interviewer-badge'>
                    <span className='avatar'>🤖</span>
                    <span className='name'>AI Senior Interviewer</span>
                    <span className='role-tag'>{report?.title}</span>
                </div>
                <h3 className='mock-question-text'>"{currentQuestion.question}"</h3>
                <p className='mock-intention'><strong>Interviewer's Focus:</strong> {currentQuestion.intention}</p>
            </div>

            {/* Candidate Response Area */}
            {!evaluation ? (
                <div className='mock-answer-section'>
                    <div className='answer-toolbar'>
                        <label className='toolbar-label'>Your Answer:</label>
                        <button
                            type='button'
                            className={`mic-button ${isListening ? 'mic-button--listening' : ''}`}
                            onClick={toggleListening}
                            title={isListening ? 'Click to stop recording' : 'Click to answer by speaking'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="22" />
                            </svg>
                            {isListening ? 'Listening (Click to Stop)...' : 'Speak Your Answer'}
                        </button>
                    </div>

                    {isListening && (
                        <div className='speech-indicator'>
                            <span className='pulse-dot' />
                            <span>Microphone is active. Speak clearly into your mic...</span>
                        </div>
                    )}

                    <textarea
                        className='mock-textarea'
                        rows={7}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here or click 'Speak Your Answer' to dictate with your microphone..."
                        disabled={evaluating}
                    />

                    <div className='answer-footer'>
                        <span className='word-counter'>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span>

                        {error && <span className='mock-error'>{error}</span>}

                        <button
                            type='button'
                            className='button primary-button submit-btn'
                            onClick={handleSubmitAnswer}
                            disabled={evaluating || !answer.trim()}
                        >
                            {evaluating ? (
                                <>
                                    <span className='mini-spinner' />
                                    AI is Evaluating Your Answer...
                                </>
                            ) : (
                                <>
                                    ✨ Submit Answer for AI Grading
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* Evaluation & Scorecard */
                <div className='mock-scorecard'>
                    <div className='scorecard-header'>
                        <div className='score-badge'>
                            <span className='score-num'>{evaluation.score}</span>
                            <span className='score-denom'>/10</span>
                        </div>
                        <div className='scorecard-meta'>
                            <span className={`verdict-pill verdict--${evaluation.verdict.toLowerCase().replace(/\s+/g, '-')}`}>
                                {evaluation.verdict}
                            </span>
                            <p className='feedback-summary'>{evaluation.feedback}</p>
                        </div>
                    </div>

                    <div className='evaluation-details'>
                        {/* Strengths */}
                        <div className='detail-box detail-box--strengths'>
                            <h4>🟢 What You Did Well</h4>
                            <ul>
                                {evaluation.strengths.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Improvements */}
                        <div className='detail-box detail-box--improvements'>
                            <h4>💡 Areas to Improve & Missing Key Points</h4>
                            <ul>
                                {evaluation.improvements.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Follow-up question */}
                    {evaluation.followUpQuestion && (
                        <div className='follow-up-box'>
                            <span className='follow-up-badge'>Interviewer Follow-Up Question</span>
                            <p className='follow-up-text'>"{evaluation.followUpQuestion}"</p>
                        </div>
                    )}

                    {/* Collapsible Ideal Answer */}
                    <div className='ideal-answer-box'>
                        <button
                            type='button'
                            className='toggle-ideal-btn'
                            onClick={() => setShowIdeal(!showIdeal)}
                        >
                            <span>{showIdeal ? '▼ Hide Model Senior Answer' : '▶ Show Model Senior Answer'}</span>
                        </button>
                        {showIdeal && (
                            <div className='ideal-content'>
                                <p>{evaluation.idealAnswer}</p>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className='scorecard-actions'>
                        <button type='button' className='button secondary-button' onClick={handleRetry}>
                            🔄 Retry Answer
                        </button>
                        <button type='button' className='button primary-button' onClick={handleNextQuestion}>
                            {currentIndex < questions.length - 1 ? 'Next Question ➡️' : 'Finish & View Summary 🏆'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MockInterviewSession
