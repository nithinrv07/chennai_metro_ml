import os
import joblib
import pandas as pd
import numpy as np

# 1. Load the trained and calibrated ML model
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "crowd_predictor.pkl")
model = joblib.load(model_path)

# Authoritative CMRL station alias resolver
def resolve_station(query: str) -> str:
    if not query:
        return "Guindy Metro Station"
    q = query.strip().lower()
    if "central" in q or "mgr" in q or "puratchi" in q:
        return "Puratchi Thalaivar Dr. M.G.R Central"
    if "airport" in q or "maa" in q:
        return "Chennai International Airport (MAA)"
    if "egmore" in q:
        return "Egmore Metro Station"
    if "alandur" in q:
        return "Alandur Interchange Station"
    if "koyambedu" in q or "cmbt" in q:
        return "Koyambedu CMBT Station"
    if "guindy" in q:
        return "Guindy Metro Station"
    if "saidapet" in q:
        return "Saidapet Metro Station"
    if "anna nagar tower" in q:
        return "Anna Nagar Tower Station"
    if "anna nagar" in q:
        return "Anna Nagar Tower Station"
    if "vadapalani" in q:
        return "Vadapalani Metro Station"
    if "wimco" in q:
        return "Wimco Nagar"
    if "st. thomas mount" in q or "thomas mount" in q:
        return "St. Thomas Mount Metro Station"
    return query

def get_metro_recommendation(station_name: str, hour: int, is_weekend: int, is_peak_hour: int):
    # Resolve any short alias to canonical CMRL station name
    canonical_station = resolve_station(station_name)

    # Prepare feature input matching training schema
    input_data = pd.DataFrame([{
        "Hour": hour,
        "Is_Weekend": is_weekend,
        "Is_Peak_Hour": is_peak_hour,
        "Station_Name": canonical_station
    }])
    
    # 1. Predict crowd density level and calibrated posterior probabilities
    predicted_crowd = model.predict(input_data)[0]
    
    prob_dict = {}
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(input_data)[0]
        classes = list(model.classes_)
        prob_dict = {cls: round(float(probs[i]) * 100, 1) for i, cls in enumerate(classes)}

    # Multi-level coach spatial calculations grounded in observed Indian Metro load dynamics
    p_green = prob_dict.get("Green", 33.3) / 100.0
    p_yellow = prob_dict.get("Yellow", 33.3) / 100.0
    p_red = prob_dict.get("Red", 33.3) / 100.0

    crowd_density_pct = min(98, max(12, int(p_green * 24 + p_yellow * 62 + p_red * 94)))
    boarding_prob = min(99, max(35, int(p_green * 97 + p_yellow * 80 + p_red * 46)))

    rear_ratio = 0.70 if is_peak_hour else 0.62
    front_ratio = 0.84 if is_peak_hour else 0.78
    mid_ratio = 1.16 if is_peak_hour else 1.08

    front_c = min(99, max(10, int(crowd_density_pct * front_ratio)))
    mid_c = min(99, max(15, int(crowd_density_pct * mid_ratio)))
    rear_c = min(99, max(8, int(crowd_density_pct * rear_ratio)))
    available_seats = max(2, int((1.0 - (crowd_density_pct / 100.0)) * 64))

    # AI Congestion Redistribution Logic & Assistant Responses
    print("\n=======================================================")
    print("       CHENNAI METRO AI ASSISTANT INFERENCE")
    print("=======================================================")
    print(f"Station:            {canonical_station} (Input: '{station_name}')")
    print(f"Time Slot:          {hour:02d}:00 Hrs | {'Weekend' if is_weekend else 'Weekday'} | {'Peak Surge' if is_peak_hour else 'Off-Peak Window'}")
    print(f"Predicted Status:   [{predicted_crowd.upper()}] Crowd Density ({crowd_density_pct}% Rake Load)")
    
    if prob_dict:
        print(f"Calibrated Prob:    Green (Low): {prob_dict.get('Green', 0)}% | Yellow (Moderate): {prob_dict.get('Yellow', 0)}% | Red (High): {prob_dict.get('Red', 0)}%")
    print(f"Boarding Clearance: {boarding_prob}% chance of boarding arriving train")
    print(f"Estimated Seats:    ~{available_seats} open seats out of 64")
    print("-------------------------------------------------------")
    print("Coach Load Spatial Distribution:")
    print(f"  - Coach 1 (Women / DMC1 Front):  {front_c}% Load")
    print(f"  - Coach 2-3 (Middle Vestibules): {mid_c}% Load (Choke-point)")
    print(f"  - Coach 4 (DMC2 Rear Car):       {rear_c}% Load [Optimal Clearance]")
    print("-------------------------------------------------------")
    
    if predicted_crowd == "Red":
        print("ACTIONABLE COMMUTER GUIDANCE:")
        print("1. Heavy congestion detected. Position immediately at Coach 4 (Rear Car DMC2).")
        print("2. Consider boarding 15 mins earlier or waiting for the following originating rake.")
        print("3. Incentive: Earn +50 Singara Rewards points by shifting travel by 20 minutes.")
    elif predicted_crowd == "Yellow":
        print("ACTIONABLE COMMUTER GUIDANCE:")
        print("1. Normal peak flow. Boarding is comfortable in Coach 1 (Front) and Coach 4 (Rear).")
        print("2. Avoid center vestibules (Coaches 2 & 3) where boarding dwell time is highest.")
    else:
        print("ACTIONABLE COMMUTER GUIDANCE:")
        print("1. Optimal off-peak window. Plenty of seats available throughout the rake.")
        print("2. Fast-track entry at all automatic fare collection (AFC) turnstiles.")
    print("=======================================================\n")

if __name__ == "__main__":
    # Test Case 1: Peak Hour Rush at Chennai Central (Alias: "Chennai Central")
    get_metro_recommendation(station_name="Chennai Central", hour=9, is_weekend=0, is_peak_hour=1)

    # Test Case 2: Off-Peak Window at Airport (Alias: "Airport")
    get_metro_recommendation(station_name="Airport", hour=14, is_weekend=0, is_peak_hour=0)