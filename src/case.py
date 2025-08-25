import csv

class Case:
    def __init__(self, name, docket):
        self.name = name
        self.docket = docket
        self.defendant = ""
        self.property_address = ""
        self.phone_numbers = []

    def to_csv_record(self):
        return [
            self.name,
            self.docket,
            self.defendant,
            self.property_address,
            "; ".join(self.phone_numbers),
        ]

def save_cases_to_csv(cases, filename):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Docket", "Defendant", "Property Address", "Phone Numbers"])
        for case in cases:
            writer.writerow(case.to_csv_record())
