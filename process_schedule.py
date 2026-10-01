import os
import pandas as pd

# 1. Ensure the processed output folder exists
os.makedirs("data/processed", exist_ok=True)

# 2. Extract structured operational schedule features
schedule_records = [
    {
        "Corridor": "Corridor-1 (Blue Line)",
        "Route": "Wimco Nagar Depot - Airport",
        "Day_Type": "Weekday",
        "Peak_Hours": "08:00-11:00, 17:00-20:00",
        "Peak_Headway_Mins": 6,
        "Non_Peak_Headway_Mins": 7,
        "Short_Loop_Headway_Mins": 3,  # Washermenpet - Alandur
        "First_Train": "04:51",
        "Last_Train": "23:00"
    },
    {
        "Corridor": "Corridor-1 (Blue Line)",
        "Route": "Wimco Nagar Depot - Airport",
        "Day_Type": "Saturday",
        "Peak_Hours": "08:00-11:00, 17:00-20:00",
        "Peak_Headway_Mins": 6,
        "Non_Peak_Headway_Mins": 7,
        "Short_Loop_Headway_Mins": None,
        "First_Train": "04:51",
        "Last_Train": "23:00"
    },
    {
        "Corridor": "Corridor-1 (Blue Line)",
        "Route": "Wimco Nagar Depot - Airport",
        "Day_Type": "Sunday/Holiday",
        "Peak_Hours": "12:00-20:00",
        "Peak_Headway_Mins": 7,
        "Non_Peak_Headway_Mins": 10,
        "Short_Loop_Headway_Mins": None,
        "First_Train": "04:55",
        "Last_Train": "23:08"
    },
    {
        "Corridor": "Corridor-2 (Green Line)",
        "Route": "Chennai Central - St. Thomas Mount",
        "Day_Type": "Weekday",
        "Peak_Hours": "08:00-11:00, 17:00-20:00",
        "Peak_Headway_Mins": 12,
        "Non_Peak_Headway_Mins": 14,
        "Short_Loop_Headway_Mins": None,
        "First_Train": "05:02",
        "Last_Train": "23:00"
    },
    {
        "Corridor": "Corridor-2 (Green Line)",
        "Route": "Chennai Central - St. Thomas Mount",
        "Day_Type": "Sunday/Holiday",
        "Peak_Hours": "12:00-20:00",
        "Peak_Headway_Mins": 14,
        "Non_Peak_Headway_Mins": 20,
        "Short_Loop_Headway_Mins": None,
        "First_Train": "04:51",
        "Last_Train": "23:17"
    }
]

# Convert to Pandas DataFrame
df_schedule = pd.DataFrame(schedule_records)

# Save processed dataframe as CSV
output_path = "data/processed/schedule_features.csv"
df_schedule.to_csv(output_path, index=False)

print(f"Successfully processed and saved schedule features to: {output_path}")
print("\n--- DataFrame Preview ---")
print(df_schedule.head())