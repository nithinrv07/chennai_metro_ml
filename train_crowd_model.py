import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report, 
    accuracy_score, 
    f1_score, 
    recall_score, 
    precision_score,
    log_loss
)

# 1. Load the canonical dataset
data_path = "data/processed/training_crowd_data.csv"
feedback_path = "data/processed/user_feedback.csv"
df = pd.read_csv(data_path)

# Map feedback records if available
if os.path.exists(feedback_path):
    try:
        fb_df = pd.read_csv(feedback_path)
        if not fb_df.empty:
            crowd_map = {
                "Low": "Green", "Moderate": "Yellow", "High": "Red", "Very High": "Red",
                "Green": "Green", "Yellow": "Yellow", "Red": "Red"
            }
            route_station_map = {
                "BL-101": "Chennai International Airport (MAA)",
                "BL-103": "Saidapet Metro Station",
                "BL-104": "Guindy Metro Station",
                "BL-112": "Puratchi Thalaivar Dr. M.G.R Central",
                "GL-202": "Nehru Park",
                "GL-206": "Koyambedu CMBT Station",
                "GL-208": "Egmore Metro Station",
                "GL-214": "Alandur Interchange Station",
            }
            new_rows = []
            for _, row in fb_df.iterrows():
                try:
                    ts = pd.to_datetime(row.get("Timestamp", None)) if pd.notna(row.get("Timestamp", None)) else pd.Timestamp.now()
                except Exception:
                    ts = pd.Timestamp.now()
                hour = int(ts.hour)
                is_weekend = 1 if ts.weekday() >= 5 else 0
                is_peak = 1 if ((8 <= hour <= 11) or (17 <= hour <= 20)) and not is_weekend else 0
                st_name = row.get("Station_Name") if pd.notna(row.get("Station_Name")) else route_station_map.get(str(row.get("Bus_Route", "")), "Guindy Metro Station")
                c_level = crowd_map.get(str(row.get("Actual_Crowd", "Moderate")).strip(), "Yellow")
                new_rows.append({
                    "Timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                    "Date": ts.strftime("%Y-%m-%d"),
                    "Hour": hour,
                    "Day_of_Week": ts.strftime("%A"),
                    "Is_Weekend": is_weekend,
                    "Is_Peak_Hour": is_peak,
                    "Station_Name": st_name,
                    "Crowd_Level": c_level
                })
            if new_rows:
                df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
                print(f"Incorporated {len(new_rows)} real user feedback records into training set.")
    except Exception as e:
        print(f"Notice: Could not load feedback CSV: {e}")

# 2. Strict Time-Aware Temporal Validation Split (Out-of-Time Forecasting)
# Ensure data is chronologically sorted by date & time
df["Timestamp"] = pd.to_datetime(df["Timestamp"])
df.sort_values(by="Timestamp", inplace=True)

unique_dates = sorted(df["Date"].unique().tolist())
split_idx = int(len(unique_dates) * 0.80)
train_cutoff_date = unique_dates[split_idx]

train_mask = df["Date"] < train_cutoff_date
test_mask = df["Date"] >= train_cutoff_date

features = ["Hour", "Is_Weekend", "Is_Peak_Hour", "Station_Name"]
target = "Crowd_Level"

X_train = df.loc[train_mask, features]
y_train = df.loc[train_mask, target]
X_test = df.loc[test_mask, features]
y_test = df.loc[test_mask, target]

print("\n=======================================================")
print("  TIME-AWARE TEMPORAL VALIDATION SPLIT")
print("=======================================================")
print(f"Training Period:   {df.loc[train_mask, 'Date'].min()} to {df.loc[train_mask, 'Date'].max()} ({len(X_train)} samples)")
print(f"Held-Out Test:     {df.loc[test_mask, 'Date'].min()} to {df.loc[test_mask, 'Date'].max()} ({len(X_test)} samples)")
print(f"Temporal Overlap:  Zero (Strictly out-of-time future evaluation)")

# 3. Baseline Comparison (Simple Historical Dummy Baseline)
dummy_baseline = DummyClassifier(strategy="most_frequent")
dummy_baseline.fit(X_train, y_train)
y_dummy_pred = dummy_baseline.predict(X_test)
baseline_acc = accuracy_score(y_test, y_dummy_pred)
baseline_macro_f1 = f1_score(y_test, y_dummy_pred, average="macro", zero_division=0)

print("\n--- Baseline Model (Most Frequent Class Baseline) ---")
print(f"Baseline Accuracy:  {baseline_acc * 100:.2f}%")
print(f"Baseline Macro-F1:  {baseline_macro_f1:.4f}")

# 4. Preprocessing & Base Pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["Station_Name"])
    ],
    remainder="passthrough"
)

base_rf = RandomForestClassifier(
    n_estimators=100, 
    max_depth=16,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42, 
    n_jobs=-1
)

base_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", base_rf)
])

print("\nFitting Random Forest Classifier on historical training window...")
base_pipeline.fit(X_train, y_train)

# Evaluate uncalibrated probabilities log loss
y_test_encoded = y_test.values
uncal_probs = base_pipeline.predict_proba(X_test)
classes = list(base_pipeline.classes_)
uncal_log_loss = log_loss(y_test, uncal_probs, labels=classes)

# 5. Probability Calibration on Held-Out Observations
# Calibrate classifier probabilities so predicted % matches empirical frequency
print("Calibrating classifier probabilities via CalibratedClassifierCV...")
calibrated_model = CalibratedClassifierCV(
    estimator=base_pipeline,
    method="sigmoid",
    cv=5
)
calibrated_model.fit(X_train, y_train)

cal_probs = calibrated_model.predict_proba(X_test)
cal_log_loss = log_loss(y_test, cal_probs, labels=classes)

# Final Out-of-Time Predictions
y_pred = calibrated_model.predict(X_test)
rf_acc = accuracy_score(y_test, y_pred)
rf_macro_f1 = f1_score(y_test, y_pred, average="macro")
rf_weighted_f1 = f1_score(y_test, y_pred, average="weighted")

print("\n=======================================================")
print("  HELD-OUT TEMPORAL EVALUATION RESULTS")
print("=======================================================")
print(f"Model Accuracy:      {rf_acc * 100:.2f}% (vs Baseline: {baseline_acc * 100:.2f}%)")
print(f"Macro-F1 Score:      {rf_macro_f1:.4f} (vs Baseline: {baseline_macro_f1:.4f})")
print(f"Weighted-F1 Score:   {rf_weighted_f1:.4f}")
print(f"Log Loss (Uncalibrated): {uncal_log_loss:.4f}")
print(f"Log Loss (Calibrated):   {cal_log_loss:.4f} (Lower = Better Probability Calibration)")

print("\n--- Detailed Per-Class Classification Report (Held-Out Test Set) ---")
report = classification_report(y_test, y_pred, digits=4)
print(report)

# 6. Save Calibrated Model Artifact and Validation Metadata
models_dir = "models"
os.makedirs(models_dir, exist_ok=True)
saved_model_path = os.path.join(models_dir, "crowd_predictor.pkl")
joblib.dump(calibrated_model, saved_model_path)
print(f"\nTrained & Calibrated Model successfully saved to: {saved_model_path}")

# Save detailed evaluation metadata JSON
metadata = {
    "model_type": "CalibratedClassifierCV(RandomForestClassifier(n_estimators=100))",
    "trained_at": datetime.now().isoformat(),
    "validation_type": "Time-Aware Chronological Temporal Split",
    "train_window": f"{df.loc[train_mask, 'Date'].min()} to {df.loc[train_mask, 'Date'].max()}",
    "test_window": f"{df.loc[test_mask, 'Date'].min()} to {df.loc[test_mask, 'Date'].max()}",
    "total_training_samples": len(X_train),
    "total_testing_samples": len(X_test),
    "accuracy_score": round(float(rf_acc), 4),
    "macro_f1_score": round(float(rf_macro_f1), 4),
    "weighted_f1_score": round(float(rf_weighted_f1), 4),
    "baseline_accuracy": round(float(baseline_acc), 4),
    "baseline_macro_f1": round(float(baseline_macro_f1), 4),
    "uncalibrated_log_loss": round(float(uncal_log_loss), 4),
    "calibrated_log_loss": round(float(cal_log_loss), 4),
    "classes": classes,
    "unique_stations_count": df["Station_Name"].nunique(),
    "supported_stations": sorted(df["Station_Name"].dropna().unique().tolist())
}

metadata_path = os.path.join(models_dir, "model_metadata.json")
with open(metadata_path, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print(f"Model validation metadata saved to: {metadata_path}")