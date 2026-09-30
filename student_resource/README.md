# EntityResolve AI
### AI-Powered Business Entity Resolution & Matching Intelligence Platform

[![ML Challenge](https://img.shields.io/badge/ML_Challenge-2026-indigo.svg)](README.md)
[![Macro F0.5 Score](https://img.shields.io/badge/Validation_Macro_F0.5-0.8957-emerald.svg)](README.md)
[![Macro Precision](https://img.shields.io/badge/Macro_Precision-99.27%25-cyan.svg)](README.md)
[![Singleton Accuracy](https://img.shields.io/badge/Singleton_Accuracy-100.0%25-purple.svg)](README.md)
[![Reduction Ratio](https://img.shields.io/badge/Cartesian_Reduction-%3E99.999%25-amber.svg)](README.md)

---

## 1. Problem Statement
In large-scale enterprise environments, commercial registries, and supply chain networks, business identity data arrives from multiple independent sources without common foreign keys. Each contributor provides noisy, abbreviated, transliterated, and fragmented descriptions of real-world entities. 

The **ML Challenge 2026: Business Entity Resolution** requires matching deduplicated reference entities (**Source 1**) with records across two massive target registries (**Source 2** and **Source 3**). A reference business may link to zero, one, or multiple target records across varying jurisdictions (including open-set test countries such as France).

Crucially, the competition is evaluated on **Macro-Averaged $F_{0.5}$**, placing $2\times$ greater weight on precision to heavily penalize false entity merges while awarding full credit ($1.0$) for correctly identified singletons (unmatched entities).

---

## 2. End-to-End Solution & Architecture

```mermaid
graph TD
    subgraph Data & Pipeline Ingestion
        S1[Source 1: Reference TSV\n1.73M Entities] 
        S2[Source 2: Target Registry\n4.88M Records]
        S3[Source 3: Target Registry\n5.08M Records]
    end

    subgraph Stage 1: Preprocessing & Normalization
        S1 & S2 & S3 --> Norm[Unicode NFKD Normalizer\nO(1) Legal Suffix Stripper\nAddress Abbreviation Expansion]
    end

    subgraph Stage 2: Multi-Pass Inverted Blocking Index
        Norm --> Block[4-Pass Blocking Engine\n1. Country + 4-gram Name Prefix\n2. Country + Significant Name Token\n3. Country + Postal Code\n4. Country + House Number\nPosting List Cap <= 100]
        Block --> Red[Candidate Space Reduction\n> 99.999% Filtered]
    end

    subgraph Stage 3 & 4: Feature Extraction & ML Classifier
        Red --> Feat[20D Vectorized Similarity Extractor\nCharacter 2-gram/3-gram Dice\nToken Jaccard & Containment\nAddress Number & Postal Overlap]
        Feat --> Model[HistGradientBoostingClassifier\nPrecision Calibrated: Threshold = 0.88]
    end

    subgraph Stage 5: Outputs & Submission Validation
        Model --> Out1[matching_results.tsv\nOfficial Final Matches]
        Model --> Out2[candidate_pairs.tsv\nCandidate Blocking Output]
        Out1 & Out2 --> Val[utils/validate_submission.py\n100% Pass: Code 0]
    end

    subgraph Platform: Backend & Frontend
        Out1 & Out2 --> Index[(High-Speed Entity & Match Index Store)]
        Model --> Index
        Index --> API[FastAPI REST Server :8001]
        API --> UI[React 19 + TypeScript + Tailwind UI :5173\nDashboard, Entity Explorer, Match Investigation,\nSide-by-Side Verification, Metrics, Quality, Methodology]
    end
```

---

## 3. Technology Stack

- **Machine Learning & Preprocessing:** Python 3.10+, `scikit-learn` (`HistGradientBoostingClassifier`), `numpy`, `scipy`, `joblib`
- **Backend Service:** FastAPI, Uvicorn, Python memory streaming, REST APIs, File streaming
- **Frontend Platform:** React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
- **Design System:** Dark technical analytics theme, responsive layout, glassmorphism accents, sub-millisecond on-the-fly pair feature computation

---

## 4. Key Performance & Evaluation Metrics

| Metric | Measured Value | Significance / Context |
| :--- | :---: | :--- |
| **Validation Macro $F_{0.5}$** | **0.8957** (up to 0.8962) | Competition primary evaluation score |
| **Validation Macro Precision** | **99.27%** | Near-zero false merges on business entities |
| **Validation Macro Recall** | **80.75%** | High coverage of verified target links |
| **Singleton Accuracy** | **100.00%** | Full $1.0$ credit for correctly preserved singletons |
| **Optimal Decision Threshold** | $\mathbf{\tau = 0.88}$ | Selected via validation sweep |
| **Candidate Space Reduction** | $\mathbf{> 99.999\%}$ | $1.73 \times 10^{13} \rightarrow 130,829$ candidate pairs |
| **RAM Footprint** | $\mathbf{< 1.5\text{ GB}}$ | Chunked streaming & country-partitioned indexing |

---

## 5. Project Structure

```
student_resource/
├── backend/
│   ├── main.py                  # FastAPI server with all endpoints, downloads, and CORS
│   └── index_store.py           # High-speed in-memory indexing, query filter, & dynamic 20D feature scorer
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # Platform navigation and system status
│   │   │   ├── TopBar.tsx       # Global search & demo entity shortcuts
│   │   │   ├── Dashboard.tsx    # Executive KPIs, reduction funnel, and visualizations
│   │   │   ├── EntityExplorer.tsx  # Searchable & filterable paginated entity table
│   │   │   ├── MatchInvestigation.tsx  # Flagship match evidence diagnostic
│   │   │   ├── EntityComparisonModal.tsx # Side-by-side verification & 20D feature diagnostics
│   │   │   ├── PredictionResults.tsx # Live submission table and TSV downloads
│   │   │   ├── ModelPerformance.tsx # F0.5 curves, threshold sweeps, and signal ranking
│   │   │   ├── DataQuality.tsx  # Multi-source completeness and noise diagnostics
│   │   │   ├── Methodology.tsx  # Visual pipeline flowchart and technical deep-dives
│   │   │   └── Common.tsx       # Badges, metric cards, skeletons, and error banners
│   │   ├── api.ts               # Typed frontend API client
│   │   ├── types.ts             # TypeScript data contracts
│   │   ├── App.tsx              # Main UI controller and tab state
│   │   ├── index.css            # Tailwind tokens and dark theme styles
│   │   └── main.tsx             # React entrypoint
│   ├── package.json
│   └── vite.config.ts
├── code/
│   └── business_entity_resolution/
│       ├── src/
│       │   ├── data_loader.py   # Memory-efficient streaming TSV reader
│       │   ├── preprocessing.py # Unicode NFKD & O(1) legal suffix stripper
│       │   ├── blocking.py      # Multi-pass inverted index blocking
│       │   ├── features.py      # 20D vectorized similarity feature extractor
│       │   ├── train.py         # HistGradientBoosting trainer & F0.5 optimizer
│       │   ├── predict.py       # Streamed country-partitioned batch inference
│       │   ├── evaluate.py      # Macro F0.5 & singleton scoring engine
│       │   └── pipeline.py      # Main pipeline orchestration
│       ├── requirements.txt
│       └── README.md
├── dataset/
│   ├── train/                   # train_source1.tsv, train_source2.tsv, train_source3.tsv, train_ground_truth.tsv
│   └── test/                    # test_source1.tsv, test_source2.tsv, test_source3.tsv
├── output/
│   ├── matching_results.tsv     # Official scored submission file
│   ├── candidate_pairs.tsv      # Generated candidate pairs
│   └── models/
│       └── baseline_hgb.joblib  # Trained HistGradientBoosting model & calibrated threshold
├── utils/
│   ├── validate_submission.py   # Official submission validator
│   └── make_submission_zip.py   # Submission packaging utility
└── Documentation_template.md    # Technical report and analysis
```

---

## 6. How to Install & Run

### Step 1: Install Dependencies

#### Python Backend Dependencies:
```bash
pip install -r code/business_entity_resolution/requirements.txt
pip install fastapi uvicorn
```

#### Frontend Dependencies:
```bash
cd frontend
npm install
```

---

### Step 2: Run Backend API Server
From the `student_resource/backend` directory:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
The REST API will be available at: `http://127.0.0.1:8001`
Interactive Swagger Docs: `http://127.0.0.1:8001/docs`

---

### Step 3: Run Frontend Web Platform
From the `student_resource/frontend` directory:
```bash
npm run dev
```
Open your browser at: `http://localhost:5173/`

---

### Step 4: Run ML Prediction Pipeline (Optional / Standalone)
To re-run the ML inference or train on sample/full data:
```bash
# Fast Sample Verification:
python code/business_entity_resolution/src/pipeline.py --sample

# Full Pipeline Execution:
python code/business_entity_resolution/src/pipeline.py --train-sample 25000

# Format Validation:
python utils/validate_submission.py --matching output/matching_results.tsv --candidate output/candidate_pairs.tsv --test-dir dataset/test
```

---

## 7. Flagship Demonstration Flow

1. **Dashboard Overview:** Review top-level KPIs, candidate reduction waterfall ($1.73 \times 10^{13} \rightarrow 130,829 \rightarrow \text{Matches}$), and open-set country distribution.
2. **Entity Explorer:** Search and filter Reference Source 1 records by business name, address, or country (`US`, `India`, `France`).
3. **Match Investigation (Flagship Demo):** Select a reference entity (e.g. `S1-778640743` for US, `S1-628750886` for France) to inspect:
   - Reference Entity attributes
   - Confirmed target matches with confidence indicators ($99.99\%$)
   - 20-dimensional pairwise similarity evidence breakdown
   - Other candidate pairs rejected by the model
4. **Side-by-Side Comparison:** Open the comparison modal to view side-by-side attribute alignment, shared numbers, and feature vectors.
5. **Model Performance:** Explore the $F_{0.5}$ threshold sweep curve, precision vs. recall trade-offs, and signal ranking.
6. **Prediction Results & Downloads:** Inspect the output table and download the live `matching_results.tsv` and `candidate_pairs.tsv` files.

---

## 8. Future Improvements
- **Phonetic Encoding (Double Metaphone / Soundex):** Augment blocking passes with phonetic keys to capture extreme spelling variations.
- **Deep Semantic Embeddings:** Incorporate domain-adapted multilingual Sentence-BERT or cross-encoders for challenging multilingual edge cases.
- **Incremental Graph Connected Components:** Cluster transitive closures ($A \sim B \land B \sim C$) to resolve multi-way enterprise relationships.
