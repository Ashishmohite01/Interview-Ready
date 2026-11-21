import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect, useState } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const [ isGenerating, setIsGenerating ] = useState(false)
    const [ isDownloadingPdf, setIsDownloadingPdf ] = useState(false)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setIsGenerating(true)
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response?.interviewReport) {
                setReport(response.interviewReport)
                // Also add to reports list if available
                setReports(prev => [ response.interviewReport, ...prev ])
            }
            return response?.interviewReport
        } catch (error) {
            console.error("Report generation failed:", error)
            throw error
        } finally {
            setIsGenerating(false)
            setLoading(false)
        }
    }

    const getReportById = async (id) => {
        const targetId = id || interviewId
        if (!targetId) return null

        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(targetId)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Failed to load interview report:", error)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getReports = async () => {
        let response = null
        try {
            response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
            }
        } catch (error) {
            console.error("Failed to load past reports:", error)
        }
        return response?.interviewReports
    }

    const downloadResumePdf = async (interviewReportId) => {
        const targetId = interviewReportId || interviewId
        if (!targetId) return

        setIsDownloadingPdf(true)
        try {
            const blobData = await generateResumePdf({ interviewReportId: targetId })
            const url = window.URL.createObjectURL(new Blob([ blobData ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${targetId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Resume download error:", error)
            let errMsg = "Failed to generate resume PDF. Please try again."
            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text()
                    const json = JSON.parse(text)
                    errMsg = json.message || errMsg
                } catch {
                    // Ignore parse error
                }
            } else if (error.response?.data?.message) {
                errMsg = error.response.data.message
            }
            alert(errMsg)
        } finally {
            setIsDownloadingPdf(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return {
        loading,
        isGenerating,
        isDownloadingPdf,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf: downloadResumePdf
    }
}
