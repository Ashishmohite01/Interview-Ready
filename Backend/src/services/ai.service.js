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
        question: z.string().describe("The technical question can be asked in the interview"),
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
 * Resilient caller with model fallback and automatic retry
 */
async function generateContentWithFallback({ prompt, schema }) {
    const models = [ "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite" ]
    let lastError = null

    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: zodToJsonSchema(schema),
                    }
                })
                return JSON.parse(response.text)
            } catch (err) {
                lastError = err
                console.warn(`[AI Service] Attempt ${attempt + 1} with ${model} failed: ${err.message || err.status}. Retrying...`)
                await new Promise(res => setTimeout(res, 1200))
            }
        }
    }

    throw lastError || new Error("Failed to generate content after trying multiple Gemini models.")
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
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
        browser = await puppeteer.launch({
            headless: true,
            args: [ "--no-sandbox", "--disable-setuid-sandbox" ]
        })
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
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
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