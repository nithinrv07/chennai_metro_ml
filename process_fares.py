import os
import pandas as pd

# 1. Define fare slab parameters derived from CMRL fare chart
fare_slabs = [
    {"Distance_Band": "0 - 2 km", "Min_Fare_INR": 10, "Max_Fare_INR": 10},
    {"Distance_Band": "2 - 5 km", "Min_Fare_INR": 20, "Max_Fare_INR": 20},
    {"Distance_Band": "5 - 10 km", "Min_Fare_INR": 30, "Max_Fare_INR": 30},
    {"Distance_Band": "10 - 15 km", "Min_Fare_INR": 40, "Max_Fare_INR": 40},
    {"Distance_Band": "15+ km", "Min_Fare_INR": 50, "Max_Fare_INR": 50},
]

# 2. Build sample Origin-Destination (OD) fare matrix for key network hubs
key_stations = [
    "Wimco Nagar Depot", "Washermenpet", "Chennai Central",
    "AG-DMS", "Alandur", "Airport", "CMBT", "St. Thomas Mount"
]

od_matrix_records = []
for origin in key_stations:
    for destination in key_stations:
        if origin != destination:
            # Estimate base fare weight for spatial distance modeling
            od_matrix_records.append({
                "Origin_Station": origin,
                "Destination_Station": destination,
                "Base_Fare_INR": 20 if origin in ["Alandur", "CMBT"] else 30
            })

df_fares = pd.DataFrame(fare_slabs)
df_od_matrix = pd.DataFrame(od_matrix_records)

# 3. Save processed datasets
df_fares.to_csv("data/processed/fare_slabs.csv", index=False)
df_od_matrix.to_csv("data/processed/od_fare_matrix.csv", index=False)

print("Successfully processed fare matrices!")
print(f"Saved: data/processed/fare_slabs.csv")
print(f"Saved: data/processed/od_fare_matrix.csv ({len(df_od_matrix)} station pairs)")