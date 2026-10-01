import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Set random seed for reproducible dataset generation
np.random.seed(42)

# Comprehensive list of Chennai Metro stations across Blue & Green lines (both formal & short names)
PRIMARY_STATIONS = [
    "Guindy Metro Station",
    "Alandur Interchange Station",
    "Chennai International Airport (MAA)",
    "Meenambakkam Metro Station",
    "Nanganallur Road Station",
    "Little Mount Metro Station",
    "Saidapet Metro Station",
    "Nandanam Metro Station",
    "Teynampet Metro Station",
    "AG-DMS Metro Station",
    "Thousand Lights Metro Station",
    "LIC Metro Station",
    "Government Estate Metro Station",
    "Puratchi Thalaivar Dr. M.G.R Central",
    "High Court Metro Station",
    "Mannadi Metro Station",
    "Washermenpet Metro Station",
    "Wimco Nagar Depot Station",
    "Koyambedu CMBT Station",
    "Anna Nagar Tower Station",
    "Vadapalani Metro Station",
    "Ashok Nagar Metro Station",
    "St. Thomas Mount Metro Station",
    "Egmore Metro Station",
    # Common short aliases
    "Chennai Central",
    "Alandur",
    "Airport",
    "Guindy",
    "CMBT",
    "AG-DMS",
    "St. Thomas Mount",
    "Washermenpet",
    "Wimco Nagar Depot",
    "Saidapet",
    "Vadapalani",
    "Anna Nagar"
]

stations = sorted(list(set(PRIMARY_STATIONS)))

# Generate a 30-day hourly time-series dataset
start_date = datetime(2026, 8, 1)
records = []

for day in range(30):
    current_date = start_date + timedelta(days=day)
    day_name = current_date.strftime("%A")
    is_weekend = day_name in ["Saturday", "Sunday"]
    
    for hour in range(5, 23):  # Metro operational hours (05:00 to 23:00)
        # Determine peak windows (08:00-11:00 & 17:00-20:00)
        is_peak = (8 <= hour <= 11) or (17 <= hour <= 20)
        
        for station in stations:
            # Base density calculation with peak/weekend multipliers
            base_count = 150 if is_peak else 50
            if is_weekend:
                base_count = int(base_count * 0.65)
                # Weekend leisure boosts for shopping / beach / airport hubs
                if any(k in station for k in ["Airport", "Marina", "Vadapalani", "Anna Nagar"]):
                    base_count = int(base_count * 1.3)
            
            # High-traffic interchange and CBD stations
            if any(k in station for k in ["Central", "Alandur", "CMBT", "Guindy"]):
                base_count = int(base_count * 1.7)
            elif any(k in station for k in ["Saidapet", "AG-DMS", "High Court"]):
                base_count = int(base_count * 1.35)
                
            # Add realistic random variation (Gaussian noise)
            passenger_count = max(10, int(np.random.normal(base_count, base_count * 0.18)))
            
            # Label crowd density level for classification
            if passenger_count < 80:
                crowd_level = "Green"
            elif passenger_count < 180:
                crowd_level = "Yellow"
            else:
                crowd_level = "Red"
                
            records.append({
                "Timestamp": f"{current_date.strftime('%Y-%m-%d')} {hour:02d}:00:00",
                "Date": current_date.strftime('%Y-%m-%d'),
                "Hour": hour,
                "Day_of_Week": day_name,
                "Is_Weekend": int(is_weekend),
                "Is_Peak_Hour": int(is_peak),
                "Station_Name": station,
                "Passenger_Count": passenger_count,
                "Crowd_Level": crowd_level
            })

# Save generated dataset
df_training = pd.DataFrame(records)
output_file = "data/processed/training_crowd_data.csv"
df_training.to_csv(output_file, index=False)

print(f"Successfully generated {len(df_training)} training samples!")
print(f"Saved dataset to: {output_file}")
print("\n--- Sample Records ---")
print(df_training.head())