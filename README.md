# QueryGen AI — AI Database Translator
<div align="center">

### 📁 [GitHub Repository](https://github.com/nishwapandiyan/querygen-ai)



*Translate natural language to SQL instantly, powered by Google Gemini AI*

[![Next.js](https://img.shields.io/badge/Next.js-13-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?style=flat-square&logo=google)](https://ai.google.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-green?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker-blue?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Prompt Engineering](#prompt-engineering)
- [Request Walkthrough](#request-walkthrough)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Project Requirements Checklist](#project-requirements-checklist)

---

## Overview

**QueryGen AI** is a next-generation, AI-powered database workspace that bridges the gap between human language and SQL. It allows users — regardless of their SQL expertise — to interact with databases using plain English. Powered by **Google Gemini 2.5 Flash** and built with a strict 8px SaaS design system, QueryGen AI is engineered for speed, accuracy, and a premium user experience.

---

## Key Features

| Feature | Description |
|---|---|
| **Natural Language to SQL** | Describe what you want in plain English, get production-ready SQL instantly |
| **SQL to Natural Language** | Paste any complex SQL query and get a human-readable explanation |
| **AI SQL Agent (Chat)** | A multi-turn conversational SQL expert powered by Gemini |
| **Multi-Dialect Support** | Generates SQL for PostgreSQL, MySQL, SQLite, and BigQuery |
| **Translation History** | All translations are automatically saved to a local SQLite database |
| **Light / Dark Mode** | Full theme support with a premium SaaS aesthetic |
| **Keyboard Shortcuts** | Ctrl+Enter to translate from anywhere in the app |

---

## System Architecture

```
          +----------------------------------------------+
          |            STEP 1 - USER INPUT               |
          |  Natural Language or SQL Query entered via   |
          |  Next.js Frontend (React / TypeScript)       |
          +---------------------+------------------------+
                                |
                                v
          +----------------------------------------------+
          |          STEP 2 - PROMPT ENGINEERING         |
          |  Expert persona injected with few-shot       |
          |  examples and strict formatting rules        |
          +---------------------+------------------------+
                                |
                                v
          +----------------------------------------------+
          |           STEP 3 - GEMINI API CALL           |
          |  Send structured prompt to Google Gemini     |
          |  2.5 Flash (REST API + API Key Auth)         |
          +---------------------+------------------------+
                                |
                                v
          +----------------------------------------------+
          |         STEP 4 - DATABASE PERSISTENCE        |
          |  Save input, output, dialect, and timestamp  |
          |  to local SQLite Database for History page   |
          +---------------------+------------------------+
                                |
                                v
          +----------------------------------------------+
          |         RESPONSE RENDERED TO USER            |
          |  Clean SQL or Natural Language output shown  |
          +----------------------------------------------+
```

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 13 (React, Pages Router) |
| **Language** | TypeScript and JavaScript |
| **Styling** | Vanilla CSS with a custom SaaS Design System (8px scale) |
| **LLM API** | Google Gemini 2.5 Flash (REST API) |
| **Database** | SQLite via sqlite3 (local persistence) |
| **Icons** | lucide-react |
| **Deployment** | Docker / Vercel |

---

## Prompt Engineering

QueryGen AI applies structured **Prompt Engineering** principles to consistently deliver high-quality, safe SQL output. The key techniques used are:

### 1. Expert Persona Injection
Every request is prefaced with an expert identity that primes the model for precision:
```
You are an expert SQL developer and database administrator with 15+ years of experience
writing highly optimized queries for PostgreSQL, MySQL, SQLite, and BigQuery.
```

### 2. Strict Output Formatting Rules
The system prompt explicitly tells the model what to return and what NOT to return:
```
- Return ONLY the raw SQL query. No explanation. No markdown. No code fences.
- Do NOT include any prose before or after the SQL.
- The output must be valid, executable SQL for the specified dialect.
```

### 3. Constraint-Based Safety
```
- Do NOT invent table names or columns that were not mentioned.
- Use standard SQL syntax unless the user specifies otherwise.
```

### 4. Dialect-Aware Generation
The target SQL dialect (PostgreSQL, MySQL, SQLite, BigQuery) is dynamically injected into the prompt for dialect-specific syntax generation.

### 5. Multi-Turn Context for Chat Agent
The AI SQL Agent (/chat) passes the full conversation history to the model with every request, enabling rich, contextual, multi-turn database conversations.

---

## Request Walkthrough

```
User (Browser) --> Next.js Frontend --> /api/translate --> Google Gemini API --> SQLite DB
     |                  |                    |                   |                   |
     | Types query       |                    |                   |                   |
     |-----------------> |                    |                   |                   |
     |                   | POST request       |                   |                   |
     |                   |-------------------> |                   |                   |
     |                   |                    | POST structured   |                   |
     |                   |                    | prompt            |                   |
     |                   |                    |-------------------> |                   |
     |                   |                    |                   | SQL response      |
     |                   |                    | <-----------------|                   |
     |                   |                    | Save to DB        |                   |
     |                   |                    |-------------------------------------------> |
     |                   | SQL output         |                   |                   |
     |                   | <-------------------|                   |                   |
     | Rendered output   |                    |                   |                   |
     | <-----------------|                    |                   |                   |
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A Google Gemini API Key (Get one free at https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/nishw/querygen-ai.git
cd querygen-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```
Open `.env.local` and add your API key:
```env
<YOUR_GCP_API_KEY>
```

### 4. Run the Development Server
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

> The SQLite database is initialized automatically on the first translation.

---

## Docker Deployment

The project includes a production-ready `Dockerfile` and `docker-compose.yml`.

### Build and Run with Docker Compose
```bash
docker-compose up -d
```
The app will be available at http://localhost:3000

### Build Manually
```bash
docker build -t querygen-ai .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key_here querygen-ai
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key from Google AI Studio |

---

## Project Requirements Checklist

- [x] **Individual Project:** QueryGen AI is a unique, individually created AI database workspace.
- [x] **Programming Language:** TypeScript and JavaScript (Next.js full-stack).
- [x] **Prompt Engineering:** Uses expert persona injection, strict output formatting, dialect-aware prompts, and multi-turn context for the chat agent.
- [x] **LLM API:** Integrated Google Gemini 2.5 Flash via the REST API.
- [x] **Database:** Local SQLite database for persistent translation history.
- [x] **Web Framework:** Next.js (React) — industry-standard full-stack framework.
- [x] **Frontend:** Built with HTML, CSS (Vanilla), TypeScript — custom SaaS design system.
- [x] **Deployment:** Docker-ready with Dockerfile and docker-compose.yml. Also deployable on Vercel.

---

<div align="center">
  <p>Built with care by nishw</p>
  <p><a href="https://github.com/nishwapandiyan/Querry-Translator">GitHub Repository</a></p>
</div>
#   S Q L - T r a n s l a t o r 
 
 