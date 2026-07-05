# QueryGen AI — AI Database Translator

> Translate Natural Language into SQL instantly using Google Gemini AI.

[![Next.js](https://img.shields.io/badge/Next.js-13-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-green?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)

---

# Table of Contents

- Overview
- Features
- System Architecture
- Tech Stack
- Project Structure
- Prompt Engineering
- Request Flow
- Quick Start
- Docker Deployment
- Environment Variables
- Future Improvements
- Project Checklist
- Contributing
- License
- Author

---

# Overview

QueryGen AI is an AI-powered SQL workspace that enables users to interact with databases using plain English. Powered by Google Gemini 2.5 Flash, it supports Natural Language → SQL, SQL → Natural Language, an AI SQL Chat Assistant, multi-dialect SQL generation, and persistent translation history using SQLite.

---

# Features

- Natural Language → SQL
- SQL → Natural Language
- AI SQL Chat Assistant
- PostgreSQL, MySQL, SQLite & BigQuery support
- Translation History
- Light/Dark Mode
- Keyboard Shortcuts
- SQLite persistence
- Responsive SaaS UI

---

# System Architecture

```text
User
 │
 ▼
Next.js Frontend
 │
 ▼
Prompt Engineering
 │
 ▼
Google Gemini 2.5 Flash
 │
 ▼
Generated SQL
 │
 ▼
SQLite History
 │
 ▼
Response to User
```

---

# Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 13 |
| Language | TypeScript |
| Styling | Vanilla CSS |
| AI | Google Gemini 2.5 Flash |
| Database | SQLite |
| Icons | Lucide React |
| Deployment | Docker / Vercel |

---

# Project Structure

```text
querygen-ai/
├── components/
├── pages/
├── pages/api/
├── lib/
├── database/
├── public/
├── styles/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

# Prompt Engineering

## Expert Persona

```text
You are an expert SQL developer with 15+ years of experience.
```

## Output Rules

- Return only SQL.
- No markdown.
- No explanations.
- No code fences.

## Safety

- Do not invent tables.
- Do not invent columns.
- Use only the selected SQL dialect.

## Dialect Support

- PostgreSQL
- MySQL
- SQLite
- BigQuery

## Multi-turn Chat

Conversation history is sent with every request for contextual responses.

---

# Request Flow

```text
Browser
   │
   ▼
Next.js
   │
   ▼
API Route
   │
   ▼
Google Gemini
   │
   ▼
Generated SQL
   │
   ▼
SQLite
   │
   ▼
Frontend
```

---

# Quick Start

## Clone

```bash
git clone https://github.com/nishwapandiyan/querygen-ai.git
cd querygen-ai
```

## Install

```bash
npm install
```

## Configure

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=YOUR_API_KEY
```

## Run

```bash
npm run dev
```

Visit http://localhost:3000

---

# Docker

```bash
docker-compose up -d
```

or

```bash
docker build -t querygen-ai .
docker run -p 3000:3000 -e GEMINI_API_KEY=YOUR_API_KEY querygen-ai
```

---

# Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GEMINI_API_KEY | Yes | Google Gemini API Key |

---

# Future Improvements

- Voice to SQL
- Database Schema Upload
- Query Optimization
- SQL Visualization
- ER Diagram Generation
- Team Workspaces
- Authentication
- Export History

---

# Project Checklist

- [x] Next.js
- [x] TypeScript
- [x] Gemini API
- [x] SQLite
- [x] Prompt Engineering
- [x] Multi-turn Chat
- [x] Docker
- [x] Responsive UI

---

# Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit changes.
4. Push the branch.
5. Open a Pull Request.

---

# License

MIT License

---

# Author

**Nishwa R.P.**

GitHub: https://github.com/nishwapandiyan

Built with ❤️ using Next.js, TypeScript, SQLite, Docker, and Google Gemini AI.
