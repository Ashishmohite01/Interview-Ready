const path = require("path")
const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf, evaluateMockAnswer } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

let standardFontDataUrl = ""
try {
    standardFontDataUrl = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts").replace(/\\/g, "/") + "/"
} catch {
    // fallback if pdfjs-dist path cannot be resolved directly
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        let resumeText = ""
        if (req.file && req.file.buffer) {
            try {
                const parser = new pdfParse.PDFParse({
                    data: Uint8Array.from(req.file.buffer),
                    ...(standardFontDataUrl && { standardFontDataUrl })
                })
                const parsed = await parser.getText()
                resumeText = parsed.text || ""
            } catch (pdfErr) {
                console.warn("Could not parse PDF text:", pdfErr.message)
            }
        }

        if (!resumeText && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({
                message: "Please provide either a Resume PDF or a Quick Self-Description."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error generating interview report:", err)
        return res.status(500).json({
            message: err.message || "Failed to generate interview report. Please try again."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error fetching interview report:", err)
        return res.status(500).json({
            message: "Failed to fetch interview report."
        })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("Error fetching interview reports:", err)
        return res.status(500).json({
            message: "Failed to fetch interview reports."
        })
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        return res.send(pdfBuffer)
    } catch (err) {
        console.error("Error generating resume PDF:", err)
        return res.status(500).json({
            message: "Failed to generate resume PDF. Please try again."
        })
    }
}

/**
 * @description Controller to evaluate a mock interview answer using AI.
 */
async function evaluateMockAnswerController(req, res) {
    try {
        const { question, questionType, userAnswer, jobTitle } = req.body

        if (!question || !userAnswer || !userAnswer.trim()) {
            return res.status(400).json({
                message: "Question and candidate answer are required."
            })
        }

        const evaluation = await evaluateMockAnswer({
            question,
            questionType: questionType || "technical",
            userAnswer: userAnswer.trim(),
            jobTitle: jobTitle || "Candidate"
        })

        return res.status(200).json({
            message: "Answer evaluated successfully.",
            evaluation
        })
    } catch (err) {
        console.error("Error evaluating mock answer:", err)
        return res.status(500).json({
            message: "Failed to evaluate answer. Please try again."
        })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    evaluateMockAnswerController
}