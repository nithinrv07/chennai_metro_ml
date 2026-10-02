import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Set random seed for reproducible dataset generation
np.random.seed(42)

# Full, authoritative list of Chennai Metro Stations (40 unique canonical stations across Blue & Green lines)
# No duplicate short aliases - all aliases are resolved via resolve_station()
CANONICAL_BLUE_LINE = [
    "Wimco Nagar Depot Station",
    "Wimco Nagar",
    "Tiruvottriyur",
    "Tiruvottriyur Theradi",
    "Kaladipet",
    "Tollgate",
    "New Washermanpet",
    "Tondiarpet",
    "Sir Theagaraya College",
    "Washermenpet Metro Station",
    "Mannadi Metro Station",
    "High Court Metro Station",
    "Puratchi Thalaivar Dr. M.G.R Central",
    "Government Estate Metro Station",
    "LIC Metro Station",
    "Thousand Lights Metro Station",
    "AG-DMS Metro Station",
    "Teynampet Metro Station",
    "Nandanam Metro Station",
    "Saidapet Metro Station",
    "Little Mount Metro Station",
    "Guindy Metro Station",
    "Alandur Interchange Station",
    "Nanganallur Road Station",
    "Meenambakkam Metro Station",
    "Chennai International Airport (MAA)"
]

CANONICAL_GREEN_LINE = [
    "Puratchi Thalaivar Dr. M.G.R Central",
    "Egmore Metro Station",
    "Nehru Park",
    "Kilpauk",
    "Pachaiyappas",
    "Shenoy Nagar",
    "Anna Nagar East",
    "Anna Nagar Tower Station",
    "Thirumangalam",
    "Koyambedu CMBT Station",
    "Arumbakkam",
    "Vadapalani Metro Station",
    "Ashok Nagar Metro Station",
    "Ekkattuthangal",
    "Alandur Interchange Station",
    "St. Thomas Mount Metro Station"
]

ALL_CANONICAL_STATIONS = sorted(list(dict.fromkeys(CANONICAL_BLUE_LINE + CANONICAL_GREEN_LINE)))
print(f"Total unique canonical stations: {len(ALL_CANONICAL_STATIONS)}")

# Generate a 30-day chronological time-series dataset (Aug 1 to Aug 30, 2026)
start_date = datetime(2026, 8, 1)
records = []

for day in range(30):
    current_date = start_date + timedelta(days=day)
    day_name = current_date.strftime("%A")
    is_weekend = day_name in ["Saturday", "Sunday"]
    
    for hour in range(5, 23):  # Metro operational hours (05:00 to 23:00)
        # Peak windows: Morning (08:00-11:00) & Evening (17:00-20:00) on weekdays
        is_peak = ((8 <= hour <= 11) or (17 <= hour <= 20)) and not is_weekend
        # Weekend afternoon surge (12:00-16:00)
        is_weekend_surge = is_weekend and (12 <= hour <= 16)
        
        for station in ALL_CANONICAL_STATIONS:
            is_interchange = 1 if ("Central" in station or "Alandur" in station) else 0
            
            # Line corridor categorization
            if station in CANONICAL_BLUE_LINE and station in CANONICAL_GREEN_LINE:
                corridor = "Interchange Hub"
            elif station in CANONICAL_BLUE_LINE:
                corridor = "Blue Line"
            else:
                corridor = "Green Line"

            # Base density calculation with peak/weekend multipliers
            base_count = 160 if is_peak else (110 if is_weekend_surge else 55)
            if is_weekend and not is_weekend_surge:
                base_count = int(base_count * 0.70)
            
            # Station-specific demand profiles
            if is_interchange:
                base_count = int(base_count * 1.75)
            elif any(k in station for k in ["Guindy", "Koyambedu", "Airport", "Egmore"]):
                base_count = int(base_count * 1.50)
            elif any(k in station for k in ["Saidapet", "AG-DMS", "High Court", "Thousand Lights"]):
                base_count = int(base_count * 1.30)
            elif any(k in station for k in ["Wimco", "Kaladipet", "Tollgate"]):
                base_count = int(base_count * 0.85)

            # Weekend leisure boosts for shopping / leisure / airport
            if is_weekend and any(k in station for k in ["Airport", "Estate", "Vadapalani", "Anna Nagar"]):
                base_count = int(base_count * 1.25)
                
            # Realistic Gaussian noise with natural variance
            passenger_count = max(12, int(np.random.normal(base_count, base_count * 0.16)))
            
            # Grounded crowd density level classification
            if passenger_count < 85:
                crowd_level = "Green"
            elif passenger_count < 185:
                crowd_level = "Yellow"
            else:
                crowd_level = "Red"

            # Multi-level observations: Coach spatial load & seat availability
            # In Indian Metros: Middle coaches (2 & 3) bear highest boarding load; Rear (Coach 4) is lowest
            density_ratio = min(1.0, passenger_count / 260.0)
            mid_load = min(100, max(15, int(density_ratio * 100 * (1.18 if is_peak else 1.08))))
            front_load = min(100, max(12, int(density_ratio * 100 * (0.85 if is_peak else 0.80))))
            rear_load = min(100, max(10, int(density_ratio * 100 * (0.68 if is_peak else 0.62))))
            
            # Available seated capacity out of 64 seats
            available_seats = max(0, int((1.0 - (mid_load / 100.0)) * 64))
            
            # Platform queue length and historical boarding clearance rate
            platform_queue = max(2, int(passenger_count * (0.16 if is_peak else 0.08)))
            boarding_success = min(99, max(38, int(100 - (mid_load * 0.58))))
                
            records.append({
                "Timestamp": f"{current_date.strftime('%Y-%m-%d')} {hour:02d}:00:00",
                "Date": current_date.strftime('%Y-%m-%d'),
                "Hour": hour,
                "Day_of_Week": day_name,
                "Is_Weekend": int(is_weekend),
                "Is_Peak_Hour": int(is_peak),
                "Station_Name": station,
                "Is_Interchange": is_interchange,
                "Line_Corridor": corridor,
                "Passenger_Count": passenger_count,
                "Coach_1_Occupancy": front_load,
                "Coach_2_Occupancy": mid_load,
                "Coach_3_Occupancy": mid_load,
                "Coach_4_Occupancy": rear_load,
                "Available_Seats": available_seats,
                "Platform_Queue": platform_queue,
                "Boarding_Success_Rate": boarding_success,
                "Crowd_Level": crowd_level
            })

# Save generated dataset
df_training = pd.DataFrame(records)
# Ensure strictly sorted by Timestamp
df_training.sort_values(by=["Timestamp", "Station_Name"], inplace=True)
output_file = "data/processed/training_crowd_data.csv"
os.makedirs(os.path.dirname(output_file), exist_ok=True)
df_training.to_csv(output_file, index=False)

print(f"Successfully generated {len(df_training)} canonical training samples!")
print(f"Unique stations: {df_training['Station_Name'].nunique()} (No aliases)")
print(f"Date range: {df_training['Date'].min()} to {df_training['Date'].max()}")
print(f"Class distribution:\n{df_training['Crowd_Level'].value_counts(normalize=True).round(3)}")