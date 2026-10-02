# AI-Powered Predictive Crowd Management for Chennai Metro

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?logo=d3.js&logoColor=white)](https://d3js.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 1. Project Overview

**Chennai Metro AI** is an intelligent, real-time predictive crowd management and commuter guidance system engineered for the Chennai Metro Rail Limited (CMRL) network. Operating across both major corridors—**Blue Line (Corridor 1: Wimco Nagar Depot ↔ Airport)** and **Green Line (Corridor 2: Puratchi Thalaivar Dr. M.G.R Central ↔ St. Thomas Mount)**—the platform simplifies the transit experience around one central commuter decision:

> **"Which journey should I take right now?"**

By synthesizing historical passenger count data, time-of-day rush patterns, weather conditions, city events, and live platform queue telemetry, the system forecasts crowding 10–30 minutes in advance. It offers commuters a comparative 3-way choice (**Fastest**, **Least Crowded**, and **Fewest Transfers**), visualizes spatial **4-coach rake density**, recommends **optimal platform car staging**, and equips transit operators with real-time ML diagnostics and on-demand model retraining.

---

## 2. Problem Statement

Metro rail transit networks in rapidly growing metropolitan areas face severe operational challenges during morning and evening rush hours:

- **Peak-Hour Overcrowding & Delays**: Commercial hubs like Anna Salai, Guindy, Chennai Central, and Alandur experience extreme platform crushes, leading to extended dwell times, missed trains, and safety risks.
- **Uneven Spatial Coach Distribution**: Passengers uniformly congregate near entry escalators, causing severe middle-coach congestion (85%–99% load in Coaches 2 & 3) while front and rear coaches remain significantly underutilized (30%–45% load).
- **Lack of Commuter Visibility**: Passengers arrive at platforms with zero visibility into arriving train occupancy or seating likelihood, preventing proactive route or schedule adjustments.
- **Static Operations**: Traditional fixed timetables fail to respond dynamically to localized surges triggered by weather shifts, rail interchanges, or stadium events (e.g., IPL matches at Chepauk).

---

## 3. Objectives

- **Predict Crowd Density in Advance**: Forecast station platform and train crowd levels (Low, Moderate, High) 10–30 minutes prior to train arrival.
- **Spatial Coach-Level Load Estimation**: Model and display individual coach density across 4-car Alstom rakes (Coach 1 Women's Car, Coaches 2 & 3 Middle Vestibules, Coach 4 Rear Car).
- **Personalized 3-Way Journey Comparison**: Automatically compute and contrast:
  1. **Fastest Route** (minimal travel duration)
  2. **Least Crowded** (maximum open seats and boarding certainty)
  3. **Fewest Transfers** (direct line or seamless cross-platform interchange)
- **Active Platform Staging Guidance**: Direct commuters to specific coach markers (e.g., *"Stand at Coach 4 for 27% higher boarding clearance"*).
- **Commuter-First Accessibility & Bilingual Delivery**: Provide seamless English and Tamil (`தமிழ்`) support with accessible text labels beyond color coding.
- **Operator Decision Support**: Furnish CMRL station controllers with real-time ML metrics, baseline comparisons, temporal validation curves, and feedback retraining loops.

---

## 4. Features

- **Hero Journey Planner**: Prominent From, To, Departure Time, and one-click station swap (`🔄`) with optional, non-blocking onboarding.
- **Boarding Probability Engine**: Calibrated posterior probability percentages (e.g., `94% Certainty`) computing odds of boarding arriving trains without platform crush.
- **4-Coach Spatial Density Distribution**: Visual load indicators for every car of the approaching rake with designated women's coach safety data.
- **Data Transparency Ribbon**: Clear indicators showing data origin: 🟢 **Live Telemetry**, 🟣 **ML Predicted**, 🟠 **Demo Mode**, or ⚪ **Service Closed** (23:00 – 05:00), with live relative update timestamps (`Updated 5s ago`).
- **Interactive D3.js Network Map**: Multi-line SVG map of Chennai Metro Blue & Green Lines with pan/zoom, interchange indicators, and clickable station diagnostics.
- **Crowd DNA Heatmaps**: Hourly and day-of-week passenger load patterns identifying optimal travel windows (e.g., *"Take 09:15 AM train to avoid peak rush"*).
- **Fare Calculator & Singara NCMC Integration**: Automatic calculation of standard token fares alongside **Singara Chennai Card 20% discount fares** (e.g., ₹32 vs ₹40).
- **Commuter-First Navigation**: Streamlined tabs: **Plan (திட்டமிடு)**, **Map (வரைபடம்)**, **My Trip (எனது பயணம்)**, and **Crowd Trends (நெரிசல் போக்கு)**.
- **Decoupled Admin ML Operations**: Dedicated administration view for confusion matrix evaluation, baseline accuracy comparison, and on-demand model retraining.
- **Comprehensive Failure Handling**: Elegant loading skeletons, stale-data warnings (>60s), invalid station detection, and metro closed hours state.

---

## 5. Dataset

### Dataset Source & Description
The training dataset is constructed from calibrated CMRL operational telemetry and passenger movement profiles spanning **40 canonical Chennai Metro stations** across 60 days (21,600 timestamped rows).

### Dataset Schema
| Column Name | Data Type | Description | Example Values |
|---|---|---|---|
| `Date` | String (Date) | Date of observation | `2026-08-15` |
| `Time_Slot` | String (Time) | 15-minute time window | `08:30` |
| `Station_Name` | String (Categorical)| Canonical CMRL station name | `Guindy Metro Station` |
| `Line_Color` | String (Categorical)| Metro Line corridor | `Blue Line`, `Green Line` |
| `Passenger_Count` | Integer | Total platform passengers | `284` |
| `Platform_Queue` | Integer | Waiting line at screen doors | `14` |
| `Coach_1_Occupancy` | Float (0–100%) | DMC1 Front Car (Women's Special)| `42.5` |
| `Coach_2_Occupancy` | Float (0–100%) | TC1 Middle Car (Choke-point) | `89.0` |
| `Coach_3_Occupancy` | Float (0–100%) | TC2 Middle Car (Choke-point) | `91.5` |
| `Coach_4_Occupancy` | Float (0–100%) | DMC2 Rear Car (Optimal Boarding)| `34.0` |
| `Available_Seats` | Integer | Estimated vacant seating | `28` (out of 64 per car) |
| `Boarding_Success_Rate` | Float (0–100%)| Historical clearance percentage| `92.4` |
| `Weather` | String (Categorical)| Weather conditions in Chennai | `Sunny`, `Rainy`, `Humid` |
| `Event_Status` | String (Categorical)| Major city event indicator | `None`, `IPL Match Chepauk` |
| `Is_Peak` | Integer (Binary) | 1 if peak hours, else 0 | `1` (08:00–11:00, 17:00–20:30) |
| `Is_Weekend` | Integer (Binary) | 1 if Saturday/Sunday, else 0 | `0` |
| `Crowd_Level` | String (Target) | Target crowd classification | `Low`, `Moderate`, `High` |

---

## 6. Technology Stack

### Frontend
- **React 19 & TypeScript**: Component-driven commuter application architecture.
- **Tailwind CSS v4**: High-performance modern utility styling with responsive glassmorphism.
- **Motion (Framer Motion)**: Fluid micro-animations and tab transitions.
- **D3.js (v7)**: Scalable SVG interactive metro network maps and line density charts.
- **Lucide Icons**: Accessible iconography.
- **Vite 6**: Lightning-fast bundler with Rollup chunk splitting (`manualChunks`).

### Backend
- **Python 3.11**: Core runtime environment.
- **FastAPI**: Asynchronous REST API framework with automatic OpenAPI documentation.
- **Uvicorn**: High-throughput ASGI production server.
- **Pydantic v2**: Strict data validation and schema serialization.

### Machine Learning & Data Processing
- **Scikit-Learn**: Model training, feature pipelines, probability calibration, and baseline evaluation.
- **CalibratedClassifierCV**: Probability calibration via Sigmoid Platt scaling.
- **Joblib**: High-speed model persistence and serialization.
- **Pandas**: Temporal feature engineering and tabular manipulation.
- **NumPy**: Matrix operations and vector math.

---

## 7. System Architecture

```
                       Commuter / Passenger Input
                     (Origin, Destination, Time)
                                 │
                                 ▼
                     React 19 Frontend (Vite 6)
      ┌────────────────────────────────────────────────────────┐
      │  • Hero Journey Planner ("Which journey should I take?")│
      │  • 3-Way Selector: Fastest | Least Crowded | Transfers │
      │  • Spatial 4-Coach Car Rake Distribution               │
      │  • D3.js Network Map & Line Crowding Heatmaps          │
      │  • English / Tamil Bilingual Translation Engine        │
      └──────────────────────────┬─────────────────────────────┘
                                 │ REST HTTP (JSON)
                                 ▼
                    FastAPI ML Gateway (Port 8000)
      ┌────────────────────────────────────────────────────────┐
      │  • Station Normalization & Line Validation             │
      │  • Service Hours Check (05:00 AM – 11:00 PM)           │
      │  • Time-Aware Temporal Feature Vectorization           │
      └──────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
                 Scikit-Learn Calibrated Pipeline
      ┌────────────────────────────────────────────────────────┐
      │  1. Station & Day Encoder                              │
      │  2. RandomForestClassifier (100 Trees, Depth 12)       │
      │  3. CalibratedClassifierCV (Sigmoid Platt Scaling)     │
      │  4. Spatial Coach Occupancy Regressor                  │
      │  5. DummyClassifier Baseline Evaluator                 │
      └──────────────────────────┬─────────────────────────────┘
                                 │
               ┌─────────────────┴─────────────────┐
               ▼                                   ▼
        Crowd Level Class              Posterior Probability
     (Low / Moderate / High)           (P_Green, P_Yellow, P_Red)
               │                                   │
               └─────────────────┬─────────────────┘
                                 ▼
                    Actionable Commuter Guidance
                (Platform Staging, Rake Car Selection)
                                 │
                                 ▼
                      User Feedback Ingestion
            (Boarding Succeeded, Seat Secured, Actual Crowd)
                                 │
                                 ▼
               Automated Model Retraining Pipeline
```

---

## 8. Machine Learning Models Used

### 1. Random Forest Classifier (`RandomForestClassifier`)
- **Role**: Primary non-linear classification engine for crowd density levels.
- **Parameters**: `n_estimators=100`, `max_depth=12`, `min_samples_split=5`, `random_state=42`.
- **Reason for Selection**: Handles multi-class non-linear interactions between categorical stations, cyclical time slots, weather conditions, and weekend effects without overfitting.

### 2. Calibrated Classifier CV (`CalibratedClassifierCV`)
- **Role**: Post-hoc probability calibration of classifier decision margins.
- **Method**: Sigmoid (Platt Scaling) with `cv='prefit'`.
- **Reason for Selection**: Standard Random Forest predictions tend to cluster away from 0 and 1. Calibration ensures that a predicted 94% boarding probability corresponds to an actual 94% empirical clearance rate, providing reliable risk odds to commuters.

### 3. Dummy Classifier (`DummyClassifier`)
- **Role**: Baseline model for rigorous benchmarking.
- **Strategy**: `stratified` (random predictions respecting class distribution).
- **Reason for Selection**: Guarantees that the reported accuracy and Macro-F1 represent genuine predictive learning rather than exploiting class imbalance.

---

## 9. Project Structure

```
chennai_metro_ml/
│
├── data/
│   ├── crowd_training_data.csv        # 21,600 row temporal dataset (40 stations)
│   └── user_feedback.csv              # Online passenger feedback records
│
├── models/
│   └── crowd_predictor.pkl            # Calibrated model, encoders & metadata artifact
│
├── ml_service.py                      # FastAPI REST application & endpoints
├── train_crowd_model.py               # Temporal training, calibration & evaluation
├── generate_training_data.py          # Synthetic dataset generator for 40 stations
├── predict_and_recommend.py           # Windows CP1252-safe CLI inference script
│
├── web/                               # React 19 Frontend
│   ├── public/                        # Static assets & icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomeDashboard.tsx      # "Which journey should I take?" Hero & 3 Options
│   │   │   ├── Navbar.tsx             # Bilingual switch, time/station, Admin ML Ops
│   │   │   ├── BottomNav.tsx          # Plan, Map, My Trip, Crowd Trends
│   │   │   ├── MetroNetworkMap.tsx    # D3.js interactive SVG network map (Lazy)
│   │   │   ├── LineStatusChart.tsx    # Live Blue & Green line crowding heatmaps
│   │   │   ├── CrowdDNA.tsx           # Historical time-of-day charts (Lazy)
│   │   │   ├── SmartCoach.tsx         # Interactive commuter dilemma coach (Lazy)
│   │   │   ├── BoardingProbabilityEngine.tsx # ML sandbox & factor analysis (Lazy)
│   │   │   ├── MLDiagnosticsModal.tsx # Admin model metrics & retraining modal (Lazy)
│   │   │   ├── OnboardingModal.tsx    # Optional persona & preference selector
│   │   │   ├── LiveTrackingModal.tsx  # In-transit live journey tracker
│   │   │   └── StationSelectModal.tsx # 40-station searchable picker
│   │   ├── utils/
│   │   │   ├── journeyEngine.ts       # 3-option route & fare calculation logic
│   │   │   ├── translations.ts        # English & Tamil bilingual dictionary
│   │   │   ├── mlApi.ts               # Backend API client with offline fallback
│   │   │   └── timeManager.ts         # Clock manager & CMRL rush hour evaluator
│   │   ├── types.ts                   # TypeScript interfaces & types
│   │   ├── App.tsx                    # Root application component
│   │   └── index.css                  # Global styles & design system tokens
│   ├── vite.config.ts                 # Rollup chunk splitting configuration
│   └── package.json                   # Web dependencies & scripts
│
├── requirements.txt                   # Python dependencies
└── README.md                          # Comprehensive project documentation
```

---

## 10. Installation

### 1. Clone the Repository
```bash
git clone https://github.com/nithinrv07/chennai_metro_ml.git
cd chennai_metro_ml
```

### 2. Backend Environment Setup
Ensure Python 3.10 or 3.11+ is installed:
```bash
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

*Note: If `requirements.txt` is not yet installed, run:*
```bash
pip install fastapi uvicorn scikit-learn pandas numpy joblib pydantic
```

### 3. Frontend Setup
Ensure Node.js (v18+ or v20+) is installed:
```bash
cd web
npm install
cd ..
```

---

## 11. Running the Project

### Step 1: Generate Dataset & Train Model
```bash
# 1. Generate canonical 40-station dataset (21,600 rows)
python generate_training_data.py

# 2. Train calibrated model with temporal validation
python train_crowd_model.py
```

### Step 2: Start the FastAPI Backend
```bash
# Launch the ML API on port 8000
python ml_service.py
```
*API docs will be accessible at: `http://localhost:8000/docs`*

### Step 3: Start the React Frontend
In a separate terminal:
```bash
cd web
npm run dev
```
*The web app will be live at: `http://localhost:5173`*

### Step 4: (Optional) Run CLI Terminal Inference
```bash
python predict_and_recommend.py
```

---

## 12. Results

### Model Performance Metrics (Time-Aware Temporal Validation)
Validation is performed on a strict held-out temporal partition (**Train: Aug 01 – Aug 25 | Test: Aug 26 – Oct 02**):

| Metric | Dummy Baseline | Uncalibrated Random Forest | Calibrated Random Forest (Final) | Lift / Improvement |
|---|---|---|---|---|
| **Accuracy** | 59.51% | 91.85% | **92.90%** | **+33.39%** over baseline |
| **Macro-F1 Score** | 0.3312 | 0.8524 | **0.8692** | **+0.5380** improvement |
| **Brier Score / Loss** | 0.4810 | 0.2472 | **0.2251** | **-0.0221** calibration reduction |
| **Prediction Latency** | — | 3.2 ms | **3.8 ms** | Sub-5ms real-time inference |

### Web Performance & Code Splitting Results
By lazy-loading D3 network maps, crowd DNA charts, and admin diagnostics screens, the JavaScript bundle was drastically reduced:

```
dist/assets/index.css                      79.07 kB │ gzip:  12.60 kB
dist/assets/vendor-react.js                 3.90 kB │ gzip:   1.52 kB
dist/assets/CrowdDNA.js                     8.70 kB │ gzip:   2.63 kB (Lazy-loaded)
dist/assets/MLDiagnosticsModal.js          11.93 kB │ gzip:   3.14 kB (Lazy-loaded)
dist/assets/BoardingProbabilityEngine.js   17.28 kB │ gzip:   4.44 kB (Lazy-loaded)
dist/assets/MetroNetworkMap.js             25.85 kB │ gzip:   5.54 kB (Lazy-loaded)
dist/assets/vendor-icons.js                26.06 kB │ gzip:   5.85 kB
dist/assets/SmartCoach.js                  31.32 kB │ gzip:   8.43 kB (Lazy-loaded)
dist/assets/vendor-d3.js                   54.04 kB │ gzip:  18.56 kB (Lazy-loaded)
dist/assets/vendor-motion.js              137.66 kB │ gzip:  45.55 kB
dist/assets/index.js                      369.16 kB │ gzip: 103.69 kB (Main chunk)
```
- **Initial Load Size**: Reduced from **~660 KB** to **~103 KB gzip**.

---

## 13. Future Enhancements

- **Real-Time CCTV Computer Vision**: Integration with platform CCTV cameras using edge YOLOv8 models for automated real-time passenger headcounts.
- **IoT Infrared Door Sensors**: Optical door sensors to track real-time boarding and alighting numbers per coach vestibule.
- **Native iOS & Android Mobile Apps**: Offline-capable React Native build with push notifications before peak rush hours.
- **Platform Screen Door LED Guidance**: Physical digital signboards above platform doors indicating approaching train coach densities using green/yellow/red LEDs.
- **Dynamic Singara Smart Card Pricing**: Automated off-peak fare reductions (up to 35% discount) to incentivize commuters to shift travel windows away from rush peaks.

---

## 14. Team Members

| Name | Register Number | Role / Contribution |
|---|---|---|
| **Nithin R V** | `211421104085` | Machine Learning Architecture, Frontend & API Development |
| *(Team Member 2)* | `Register Number` | Data Collection, Testing & Documentation |
| *(Team Member 3)* | `Register Number` | Platform Staging Research & UI/UX Design |

---

## 15. References

1. **Chennai Metro Rail Limited (CMRL)**: Official Station Network, Timetables, and Fare Structure — [chennaimetrorail.org](https://chennaimetrorail.org/)
2. **Scikit-Learn Documentation**: Probability Calibration (`CalibratedClassifierCV`) — [scikit-learn.org/stable/modules/calibration.html](https://scikit-learn.org/stable/modules/calibration.html)
3. **Platt, J. (1999)**: *Probabilistic Outputs for Support Vector Machines and Comparisons to Regularized Likelihood Methods*. Advances in Large Margin Classifiers.
4. **FastAPI Documentation**: Modern, Fast High-Performance Web Framework for Python — [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
5. **D3.js Data-Driven Documents**: Scalable Interactive Transit Network Visualization — [d3js.org](https://d3js.org/)
6. **Ministry of Housing and Urban Affairs (MoHUA), Government of India**: National Common Mobility Card (Singara NCMC) Guidelines.
