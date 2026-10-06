# Interview Ready 🎯

An AI-powered interview preparation platform that analyzes job descriptions against candidate profiles/resumes, generates personalized interview strategies, identifies skill gaps, conducts interactive AI mock interviews with instant feedback, and crafts tailored ATS-friendly resumes.

---

## 🚀 Features

- **Profile & Resume Analysis**: Upload a resume PDF or enter a quick self-description alongside a target job description.
- **AI Interview Strategy**: Generates matching score, high-priority technical questions, behavioral questions, and targeted skill gap analysis.
- **Interactive Mock Interview**: Practice responses to generated questions in real-time and receive AI evaluation, score (1-10), and actionable improvement tips.
- **ATS Resume Generator**: Exports tailored, professional resume PDFs generated via Puppeteer.
- **Authentication**: JWT-based authentication with protected routes.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite**
- **React Router 7**
- **Axios** (Cookie-based auth)
- **SCSS**

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **Google Gen AI (Gemini 2.5 Flash)**
- **Puppeteer** (PDF generation)
- **PDF-Parse** (Resume text extraction)
- **JWT** & **Bcrypt**

---

## 📂 Project Structure

```
Interview-Ready/
├── Backend/               # Express API & AI services
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Auth & Interview controllers
│   │   ├── middlewares/   # Auth & Multer file upload
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Gemini AI & Puppeteer services
│   └── server.js
├── Frontend/              # React + Vite application
│   └── src/
│       ├── features/      # Auth & Interview components, hooks, styles
│       └── app.routes.jsx # Application routing
├── package.json           # Root workspace script (concurrently)
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Install dependencies
```bash
# Root
npm install

# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 3. Environment Variables

Create a `.env` file in the `Backend` directory:
```env
PORT=3000
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string
```

### 4. Run the project
From the root directory:
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

---

## 📄 License
MIT
