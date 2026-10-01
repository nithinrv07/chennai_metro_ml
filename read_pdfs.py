import os
import pdfplumber

# Verify files are visible in the folder
raw_path = "data/raw"
files = os.listdir(raw_path)
print("Files found in data/raw:", files)

# Find the timetable PDF
schedule_pdf = [f for f in files if f.endswith(".pdf") and "train" in f.lower()]

if schedule_pdf:
    pdf_file_path = os.path.join(raw_path, schedule_pdf[0])
    with pdfplumber.open(pdf_file_path) as pdf:
        print(f"\nSuccessfully opened: {schedule_pdf[0]}")
        print(f"Total Pages: {len(pdf.pages)}")
        # Extract and display sample text from page 1
        page_text = pdf.pages[0].extract_text()
        print("\n--- PDF Content Sample ---")
        print(page_text[:400])
else:
    print("No matching schedule PDF found inside data/raw. Please check file placement.")
    