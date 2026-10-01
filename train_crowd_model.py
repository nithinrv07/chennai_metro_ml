import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

# 1. Load the generated dataset
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
                "BL-104": "Guindy Metro Station",
                "GL-208": "Alandur Interchange Station",
                "BL-112": "Puratchi Thalaivar Dr. M.G.R Central",
                "GL-214": "Guindy Metro Station",
            }
            new_rows = []
            for _, row in fb_df.iterrows():
                try:
                    ts = pd.to_datetime(row.get("Timestamp", None)) if pd.notna(row.get("Timestamp", None)) else pd.Timestamp.now()
                except Exception:
                    ts = pd.Timestamp.now()
                hour = ts.hour
                is_weekend = 1 if ts.weekday() >= 5 else 0
                is_peak = 1 if ((8 <= hour <= 11) or (17 <= hour <= 20)) and not is_weekend else 0
                st_name = row.get("Station_Name") if pd.notna(row.get("Station_Name")) else route_station_map.get(str(row.get("Bus_Route", "")), "Guindy Metro Station")
                c_level = crowd_map.get(str(row.get("Actual_Crowd", "Moderate")).strip(), "Yellow")
                new_rows.append({
                    "Hour": hour,
                    "Is_Weekend": is_weekend,
                    "Is_Peak_Hour": is_peak,
                    "Station_Name": st_name,
                    "Crowd_Level": c_level
                })
            if new_rows:
                df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
                print(f"Incorporated {len(new_rows)} user feedback records into training set.")
    except Exception as e:
        print(f"Notice: Could not load feedback CSV: {e}")

# 2. Define Features (X) and Target Variable (y)
features = ["Hour", "Is_Weekend", "Is_Peak_Hour", "Station_Name"]
target = "Crowd_Level"

X = df[features]
y = df[target]

# 3. Preprocessing: One-Hot Encode categorical features (Station_Name)
preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["Station_Name"])
    ],
    remainder="passthrough" # Keep Hour, Is_Weekend, Is_Peak_Hour as numeric
)

# 4. Build Machine Learning Pipeline
model_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42))
])

# 5. Train-Test Split (80% Training, 20% Testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 6. Train Model
print("Training Random Forest Model for Crowd Prediction...")
model_pipeline.fit(X_train, y_train)

# 7. Evaluate Model
y_pred = model_pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n--- Model Evaluation Results ---")
print(f"Model Accuracy: {accuracy * 100:.2f}%\n")
print("Detailed Classification Report:")
print(classification_report(y_test, y_pred))

# 8. Save Trained Model artifact
models_dir = "models"
os.makedirs(models_dir, exist_ok=True)
saved_model_path = os.path.join(models_dir, "crowd_predictor.pkl")
joblib.dump(model_pipeline, saved_model_path)

print(f"\nTrained model successfully saved to: {saved_model_path}")