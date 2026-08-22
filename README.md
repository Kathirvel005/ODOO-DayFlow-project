# HR Links: AI Workforce Digital Twin & Predictive HR Intelligence Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000.svg?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/Framework-React%2019-20232A.svg?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED.svg?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

HR Links is a next-generation **Workforce Intelligence Platform** that merges core HR operations with predictive machine learning algorithms, real-time activity streams, organizational graph theory, and a natural language AI Copilot. It models an entire enterprise as an active **digital twin**, allowing HR leaders to simulate stress-testing scenarios, predict flight risks, and analyze structural dependencies dynamically.

---

## 🌟 Key Platform Modules

### 🖥️ Executive Overview Dashboard
- **Role-Based Perspectives**: Custom tailored analytics viewpoints for **CEO/Executive**, **HR Super Admin**, **Team Manager**, and **Individual Employee**.
- **Real-Time Stream**: WebSocket-driven live event ticker showing check-ins, late notifications, leave requests, and simulation completions.
- **High-Impact Metrics**: Active attrition warnings, workload stress index averages, attendance percentages, and critical operational flags.

### 👥 Interactive Workforce Directory
- Comprehensive profile card views detailing employee designation, skills matrix, team alignment, salary details, and individual work status (On-site, Remote, Hybrid).
- Real-time search and filter tools with direct visual risk levels attached to each employee profile.

### 🌐 Digital Twin Organizational Chart
- **Dynamic Node Graphs**: Interactive SVG/Canvas hierarchy engine visualizing report configurations.
- **Visual Alerting**: Color-coded nodes highlighting workload stress or flight risk, enabling direct visual audits of organizational pressure points.

### ⏱️ Attendance & Statistical Anomaly Detection
- **Z-Score Anomaly Tracking**: Automatic check-in time evaluation against an employee's historical check-in baseline.
- **Automated Alert System**: Flags statistical outliers (Z > 2.0) and generates live notifications indicating early/late deviations.

### 📅 Smart Leave Workflows
- Comprehensive submit-and-review pipeline for leave requests.
- Automatic checks evaluating team capacity to predict potential workload bottlenecks before leaves are approved.

### 📊 Workload & Stress Capacity Tracker
- Multi-dimensional stress rating computed from:
  1. **Task Density**: Volume of current assignments.
  2. **Capacity Utilization**: Estimated task hours vs. weekly working hours limit (with overload penalty multiplier).
  3. **Deadline Pressure Index**: User-defined stress metrics.
  4. **Context Switching Index**: Multi-project tracking penalty.

### 🧠 Predictive Analytics Forecasting
- 30-day forward-looking regression forecasting with dynamic confidence boundaries (Upper/Lower uncertainty limits).
- Generates trends for **Workforce Availability**, **Average Workload**, **Attendance Risk**, and **Operational Risk**.

### 🛡️ Risk Intelligence Engine
- **Graph Centrality Algorithms**: Uses NetworkX directed organization tree structures to measure manager dependency weightings. High in-degree and ancestor node counts flag single points of failure.
- **Flight & Burnout Predictors**: Combined evaluation of low leave balances, late check-in frequency (disengagement indicator), and workload.
- **Actionable AI Prescriptions**: Suggests concrete actions, e.g., *"Create redundant cross-training for direct reports to reduce dependencies"* or *"Mandate a leave to prevent burnout."*

### 🧪 What-If Simulation Lab
- Run sandboxed organizational stress tests by adjusting variables:
  - Simulate specific employee absences.
  - Spike or drop workloads globally or targeting specific teams.
  - Scale remote work targets.
  - Inject new hires to analyze capacity recovery.
- Analyzes results in real-time, showing post-simulation workload averages, operational risk changes, and team-specific bottlenecks.

### 💬 AI Copilot Workspace
- Interactive natural language interface powered by LLM integration (Gemini API with robust mock fallback).
- Instantly queries employee records, answers complex database questions, calculates average salaries, and outlines team risk profiles.

---

## 🏗️ Technical Architecture

HR Links is structured as a mono-repository separating concerns between a fast backend and a dynamic modern frontend.

```
HR Links Workspace
├── apps/
│   ├── api/                      # FastAPI, Uvicorn, SQLAlchemy, NetworkX, Pandas/NumPy
│   └── web/                      # Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
├── hrlinks.db                    # Fallback SQLite database for local-first zero-config run
├── docker-compose.yml            # Multi-container local execution setup
├── render.yaml                   # Infrastructure-as-code for Render cloud deployments
├── .gitignore                    # Root ignore parameters
└── README.md                     # Project documentation
```

### Backend API Stack
- **FastAPI**: Asynchronous Python API gateway featuring automatic OpenAPI generation.
- **Uvicorn**: Lightning-fast ASGI web server implementation.
- **NetworkX**: Robust network/graph computation library driving dependency risk models.
- **SQLAlchemy ORM**: Flexible SQL database mapping supporting SQLite for zero-config runs and PostgreSQL for production.
- **WebSockets**: Bi-directional event stream broadcaster.

### Frontend Web Stack
- **Next.js (v16.3)**: Modern framework featuring React 19, Client Component routing, and dynamic data fetching.
- **Tailwind CSS (v4)**: Modern, compile-time utility styling engine.
- **Framer Motion**: Smooth micro-animations, transitions, and hover feedback.
- **Recharts**: Beautiful SVG charts visualising forecasting, workload spikes, and historical trends.

---

## 🚀 Getting Started & Local Setup

Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 1. Backend API Configuration & Execution
1. Navigate to the root directory in your terminal.
2. Initialize or activate your Python virtual environment:
   ```bash
   # Windows (PowerShell/CMD):
   .venv\Scripts\activate
   
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. *(Optional)* Install backend dependencies if not already done:
   ```bash
   pip install -r apps/api/requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn apps.api.main:app --port 8000 --reload
   ```
   *The backend documentation will be accessible at: `http://localhost:8000/docs`*

### 2. Frontend Next.js Installation & Execution
1. Open a new terminal window in the root directory.
2. Navigate to the web client folder:
   ```bash
   cd apps/web
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Boot the Next.js development client:
   ```bash
   npm run dev
   ```
   *The web interface will run on `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).*

---

## 🐳 Docker Deployment

To spin up the entire monorepo locally with a single command:

```bash
docker-compose up --build
```
This builds and links:
- **API Backend**: Running at `http://localhost:8000`
- **Next.js Web Client**: Running at `http://localhost:3000`
- **Database**: SQLite volumes mapped locally to `hrlinks.db` for instant data persistence.

---

## 🔐 Credentials & Demo Personas

When launching the web application, you will be redirected to the login portal. You can authenticate using any of the following accounts (all share the password **`password123`**):

| Persona / Role | Email Username | Core Dashboard View / Scope |
| :--- | :--- | :--- |
| **HR Super Admin** | `admin@nexora.ai` | Global administration, setting updates, user management, full analytics. |
| **Executive / CEO** | `executive@nexora.ai` | Multi-department high-level statistics, company-wide risk models. |
| **Team Manager** | `manager@nexora.ai` | Department focus, review team check-ins, approve team leave requests. |
| **Employee** | `employee@nexora.ai` | Personal profile dashboard, check-in history, submit personal leave requests. |

---

## ⚙️ Environment Variables

A `.env` template file can be created in the root or backend folder to customize execution parameters:

```env
# Server Config
PORT=8000
DATABASE_URL=sqlite:///./hrlinks.db

# Security Secrets (Must be changed in production)
JWT_SECRET=nexora_jwt_secret_key_change_me_in_production_1234567890
JWT_REFRESH_SECRET=nexora_jwt_refresh_secret_key_change_me_in_production_1234567890

# AI/ML Copilot Integration
GEMINI_API_KEY=your_gemini_api_key_here
```
