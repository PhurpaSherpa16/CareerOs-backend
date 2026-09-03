# Product Requirement Document (PRD) — CareerOS

> *Note: This guide can be updated and expanded during development.*

---

## Development Roadmap

- **Day 1 — Research**
  - Competitors + user experience + AI requirements.
- **Day 2 — PRD**
  - Finalize MVP, user flows, and requirements.
- **Day 3 — Architecture**
  - Database + API design + AI response schema.
- **Day 4 — Backend Setup**
  - Node + TypeScript + Prisma + PostgreSQL.
- **Day 5 — AI Pipeline**
  - PDF extraction → Qwen / DeepSeek → structured JSON.
- **Day 6 — API**
  - Analysis endpoint + validation + error handling.
- **Day 7 — Frontend**
  - Vite + React + basic upload/analysis flow.

---

## 1. Product Overview

### What is CareerOS?
**CareerOS** is an AI-powered career intelligence platform that analyzes a job seeker's resume against a specific job description. It identifies matching skills, missing requirements, experience gaps, and areas for improvement, helping job seekers understand how well they fit a role and what they can improve to increase their chances of getting shortlisted.

### What Problem Does It Solve?
There is often a gap between what a company is looking for and what a job seeker communicates through their resume. Job seekers may have relevant skills and experience but fail to present them effectively for a specific position.

CareerOS helps bridge this gap by:
- Comparing the resume against the actual job description
- Identifying matching and missing skills
- Highlighting experience or requirement gaps
- Showing how well the candidate fits the role
- Suggesting specific improvements
- Helping the candidate create a more relevant application

> **Value Proposition:**  
> *"Job seekers often don't know whether their resume clearly demonstrates what a specific company is looking for. CareerOS helps them identify and close that gap."*

| Positioning | Statement |
| :--- | :--- |
| **Not Promising** | *"CareerOS will get you a job."* |
| **Promising** | *"CareerOS helps you understand and improve your fit for a specific job."* |

### Target Users
- Job seekers
- Junior developers
- Professionals changing careers

---

## 2. MVP Features & Requirements

### Core MVP Features
- Upload resume (PDF)
- Paste job description
- AI-driven match score
- Identification of matching & missing skills
- Strengths & improvement suggestions
- One free anonymous analysis (guest mode)
- Authentication/Login required for continued usage
- Save & view analysis history for registered users

### AI Requirements
- Resume text extraction
- Job Description (JD) text extraction
- Skill identification & matching
- Gap analysis & actionable recommendations
- Integration with Qwen API

### Anonymous Usage & Flow
- First analysis free per guest session
- Anonymous session tracking & rate limiting
- Login required after free usage

#### User Flows
- **Anonymous Flow:**  
  `Landing Page` → `Upload Resume` → `Paste Job Description` → `Analyze` → `AI Processing` → `Analysis Result` → `Free Usage Consumed` → `Sign Up to Continue`

- **Registered Flow:**  
  `Login / Sign Up` → `Dashboard` → `Upload / Select Resume` → `Paste / Select Job` → `Analyze` → `Detailed Result` → `Save Analysis` → `View History`

---

## 3. System Architecture

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js (Express), PostgreSQL + Prisma ORM, Supabase, REST API
- **AI Engine:** Qwen / DeepSeek APIs

---

## 4. Analysis Data Structure

```text
Analysis
├── Overview
│   ├── Overall Fit
│   ├── Confidence
│   └── Summary
│
├── Skills
│   ├── Matched
│   ├── Partial
│   ├── Missing
│   └── Evidence
│
├── Experience
│   ├── Required
│   ├── Candidate
│   ├── Match
│   └── Gaps
│
├── Responsibilities
│   ├── Matched
│   ├── Partial
│   └── Missing
│
├── Education
├── Strengths
├── Gaps
├── Recommendations
└── Resume Quality
```

### Response JSON Schema

```json
{
  "overview": {
    "fitScore": 82,
    "summary": "...",
    "confidence": "high"
  },
  "skills": {
    "matched": [],
    "partial": [],
    "missing": []
  },
  "experience": {},
  "responsibilities": {},
  "education": {},
  "strengths": [],
  "gaps": [],
  "recommendations": []
}
```

---

## 5. Roadmap & Scope

### Future Features
- AI cover letter generation
- Resume improvement suggestions
- Interview preparation
- Application tracker
- Career dashboard
- Job recommendations

### Out of Scope for MVP
- Job scraping
- Automatic job applications
- AI-generated resume from scratch
- AI cover letters *(considered for future releases)*
- Interview simulation
- Career coaching
- Payment / Subscriptions
- Mobile App
