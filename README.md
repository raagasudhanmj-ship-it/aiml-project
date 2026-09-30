# EntityResolve AI
### AI-Powered Business Entity Resolution & Matching Intelligence Platform

[![ML Challenge](https://img.shields.io/badge/ML_Challenge-2026-indigo.svg)](student_resource/README.md)
[![Macro F0.5 Score](https://img.shields.io/badge/Validation_Macro_F0.5-0.8957-emerald.svg)](student_resource/README.md)
[![Macro Precision](https://img.shields.io/badge/Macro_Precision-99.27%25-cyan.svg)](student_resource/README.md)
[![Singleton Accuracy](https://img.shields.io/badge/Singleton_Accuracy-100.0%25-purple.svg)](student_resource/README.md)

---

## Quick Start

### 1. Backend Server (FastAPI):
```bash
cd student_resource/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
API runs on `http://127.0.0.1:8001` (Docs at `http://127.0.0.1:8001/docs`)

### 2. Frontend Platform (React + Vite + Tailwind):
```bash
cd student_resource/frontend
npm run dev
```
UI opens at `http://localhost:5173/`

### 3. ML Pipeline Execution (Standalone):
```bash
cd student_resource
python code/business_entity_resolution/src/pipeline.py --sample
```

Please see [`student_resource/README.md`](student_resource/README.md) for full architecture and methodology documentation.
