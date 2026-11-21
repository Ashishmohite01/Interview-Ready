const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

/**
 * Format zod schema cleanly for Gemini API responseSchema
 */
function cleanJsonSchema(zodSchema) {
    const raw = zodToJsonSchema(zodSchema, { target: "openApi3" })
    delete raw.$schema
    return raw
}

/**
 * Resilient caller with official Gemini model fallbacks and automatic retry
 */
async function generateContentWithFallback({ prompt, schema }) {
    const models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-pro"
    ]
    let lastError = null
    const responseSchema = cleanJsonSchema(schema)

    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema,
                    }
                })

                if (response && response.text) {
                    return JSON.parse(response.text)
                }
            } catch (err) {
                lastError = err
                console.warn(`[AI Service] Attempt ${attempt + 1} with model '${model}' failed: ${err.message || err.status}.`)
                // Brief pause before retry
                await new Promise(res => setTimeout(res, 1000))
            }
        }
    }

    throw lastError || new Error("Failed to generate content after trying multiple Gemini models.")
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}
`

    return await generateContentWithFallback({
        prompt,
        schema: interviewReportSchema
    })
}

async function generatePdfFromHtml(htmlContent) {
    let browser
    try {
        const launchOptions = {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote",
                "--single-process"
            ]
        }

        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
        }

        browser = await puppeteer.launch(launchOptions)
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return pdfBuffer
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using puppeteer")
    })

    const prompt = `Generate a resume for a candidate with the following details:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

The response must be a JSON object with a single field "html" containing full HTML markup of the resume suitable for PDF generation.
Tailor the resume for the given job description, highlighting candidate strengths and relevant experience.
Format with clean CSS styling, professional layout, ATS-friendly structure, 1-2 pages long.
`

    const jsonContent = await generateContentWithFallback({
        prompt,
        schema: resumePdfSchema
    })

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
    return pdfBuffer
}

const mockEvaluationSchema = z.object({
    score: z.number().min(1).max(10).describe("Score between 1 and 10 based on depth, accuracy, clarity, and relevance"),
    verdict: z.enum([ "Needs Improvement", "Good", "Strong", "Exceptional" ]).describe("Overall rating verdict"),
    feedback: z.string().describe("Direct constructive feedback in 2-3 sentences"),
    strengths: z.array(z.string()).describe("2 to 3 points the candidate addressed really well"),
    improvements: z.array(z.string()).describe("2 to 3 critical points, keywords, or examples the candidate missed"),
    idealAnswer: z.string().describe("A concise senior-level model answer the candidate can study"),
    followUpQuestion: z.string().describe("A natural interviewer follow-up question based on their answer")
})

async function evaluateMockAnswer({ question, questionType, userAnswer, jobTitle }) {
    const prompt = `You are an expert technical interviewer conducting an interview for the role: "${jobTitle || 'Software Engineer'}".
Evaluate the candidate's spoken or written answer to the following question.

Question Type: ${questionType || 'technical'}
Question: ${question}
Candidate's Answer: "${userAnswer}"

Grade the candidate's response rigorously but constructively. 
If the question is behavioral, evaluate according to the STAR method (Situation, Task, Action, Result).
If the question is technical, evaluate architectural accuracy, depth, edge cases, best practices, and communication clarity.
`

    return await generateContentWithFallback({
        prompt,
        schema: mockEvaluationSchema
    })
}

module.exports = { generateInterviewReport, generateResumePdf, evaluateMockAnswer }
