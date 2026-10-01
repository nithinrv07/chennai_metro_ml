import joblib
import pandas as pd

# 1. Load the trained ML model
model_path = "models/crowd_predictor.pkl"
model = joblib.load(model_path)

def get_metro_recommendation(station_name, hour, is_weekend, is_peak_hour):
    # Prepare feature input matching training schema
    input_data = pd.DataFrame([{
        "Hour": hour,
        "Is_Weekend": is_weekend,
        "Is_Peak_Hour": is_peak_hour,
        "Station_Name": station_name
    }])
    
    # Predict crowd density level
    predicted_crowd = model.predict(input_data)[0]
    
    # AI Congestion Redistribution Logic & Assistant Responses
    print("\n==========================================")
    print(f"  CHENNAI METRO AI ASSISTANT RESPONSE")
    print("==========================================")
    print(f"Target Station: {station_name}")
    print(f"Requested Time: {hour:02d}:00 Hrs")
    print(f"Predicted Crowd Status: [{predicted_crowd.upper()}]")
    print("------------------------------------------")
    
    if predicted_crowd == "Red":
        print("ALERT: High overcrowding expected!")
        print("Recommendation:")
        print(f"1. Board 15 mins earlier or wait for off-peak window.")
        print(f"2. Consider alternate nearby station or coach allocation guidance.")
        print(f"3. Incentive: Earn +20 reward points by taking the next non-peak train.")
    elif predicted_crowd == "Yellow":
        print("MODERATE CROWD: Station operates at normal peak flow.")
        print("Recommendation: Move towards less crowded coaches (front/rear).")
    else:
        print("LOW CROWD: Smooth travel expected. Ideal time to board.")
    print("==========================================\n")

# --- Test Case 1: Peak Hour Rush at Chennai Central ---
get_metro_recommendation(station_name="Chennai Central", hour=9, is_weekend=0, is_peak_hour=1)

# --- Test Case 2: Off-Peak Window at Airport ---
get_metro_recommendation(station_name="Airport", hour=14, is_weekend=0, is_peak_hour=0)