import csv
import random
import os

def generate_large_dataset(filename="dataset.csv", num_records=2000):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, filename)

    print(f"Generating {num_records} realistic student placement dataset records...")

    random.seed(42)  # Deterministic seed for reproducible evaluation

    headers = ["skills_count", "avg_assessment_score", "project_count", "cgpa", "internship_count", "placed"]

    records = []
    for _ in range(num_records):
        # Generate realistic student metrics
        cgpa = round(random.uniform(4.5, 9.9), 1)
        skills_count = random.randint(1, 12)
        avg_assessment_score = random.randint(30, 98)
        project_count = random.randint(0, 6)
        internship_count = random.randint(0, 3)

        # Placement logic: multi-factor weighted score threshold
        readiness_score = (skills_count * 3.5) + (avg_assessment_score * 0.25) + (project_count * 3.0) + (cgpa * 1.0) + (internship_count * 4.0)
        
        # Determine placement label (1 = Placed, 0 = Not Placed)
        if readiness_score >= 44.0 and cgpa >= 6.0:
            placed = 1
        elif readiness_score < 36.0 or cgpa < 5.2:
            placed = 0
        else:
            placed = 1 if random.random() > 0.4 else 0

        records.append([skills_count, avg_assessment_score, project_count, cgpa, internship_count, placed])

    with open(file_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(records)

    print(f"Successfully wrote {num_records} dataset records to '{file_path}'.")

if __name__ == "__main__":
    generate_large_dataset()

