import sqlite3
import random
from datetime import datetime

def create_connection():
    conn = sqlite3.connect('database/waste_management.db')
    return conn

def init_database():
    conn = create_connection()
    cursor = conn.cursor()

    # Create tables
    with open('schema.sql', 'r') as sql_file:
        cursor.executescript(sql_file.read())

    # Insert LGA types
    lga_types = [
        (1, 'C', 'City'),
        (2, 'A', 'Area')
    ]
    cursor.executemany('INSERT INTO lga_types (id, code, description) VALUES (?, ?, ?)', lga_types)

    # Insert regional groups
    regional_groups = [
        (1, 'SMA'),
        (2, 'ERA'),
        (3, 'RRA'),
        (4, 'Rest of NSW')
    ]
    cursor.executemany('INSERT INTO regional_groups (id, name) VALUES (?, ?)', regional_groups)

    # Insert waste types
    waste_types = [
        (1, 'recyclable'),
        (2, 'organics'),
        (3, 'waste')
    ]
    cursor.executemany('INSERT INTO waste_types (id, name) VALUES (?, ?)', waste_types)

    # Insert waste subtypes
    waste_subtypes = [
        # Recyclable subtypes
        (1, 1, 'Kerbside Recycling'),
        (2, 1, 'CDS Recycling'),
        (3, 1, 'Drop off Recycling'),
        (4, 1, 'Cleanup Recycling'),
        # Organics subtypes
        (5, 2, 'Kerbside Organics Bin'),
        (6, 2, 'Kerbside FOGO Organics'),
        (7, 2, 'Drop off Organics'),
        (8, 2, 'Cleanup Organics'),
        (9, 2, 'Other Council Garden Organics'),
        # Waste subtypes
        (10, 3, 'Kerbside Waste Bin'),
        (11, 3, 'Drop Off'),
        (12, 3, 'Clean Up')
    ]
    cursor.executemany('INSERT INTO waste_subtypes (id, type_id, name) VALUES (?, ?, ?)', waste_subtypes)

    # Insert LGAs with realistic NSW council names
    lgas = [
        (1, 'Albury', 2, 3),
        (2, 'Bayside', 1, 1),
        (3, 'Blacktown', 1, 1),
        (4, 'Blue Mountains', 1, 1),
        (5, 'Byron', 2, 2),
        (6, 'Camden', 2, 1),
        (7, 'Campbelltown', 1, 1),
        (8, 'Canterbury-Bankstown', 1, 1),
        (9, 'Central Coast', 1, 1),
        (10, 'Dubbo Regional', 2, 3),
        (11, 'Georges River', 1, 1),
        (12, 'Hornsby', 2, 1),
        (13, 'Inner West', 1, 1),
        (14, 'Lake Macquarie', 1, 2),
        (15, 'Liverpool', 1, 1)
    ]
    cursor.executemany('INSERT INTO lgas (id, name, type_id, regional_group_id) VALUES (?, ?, ?, ?)', lgas)

    # Insert LGA statistics for 2018-2019 and 2019-2020
    lga_stats = []
    years = [(2018, 2019), (2019, 2020)]
    
    for lga in lgas:
        lga_id = lga[0]
        for year_start, year_end in years:
            # Generate realistic population and houses data
            population = random.randint(50000, 400000)
            houses = int(population * 0.35)  # Assume average household size
            
            lga_stats.append((
                lga_id,
                year_start,
                year_end,
                population,
                houses
            ))
    
    cursor.executemany('''
        INSERT INTO lga_statistics 
        (lga_id, year_start, year_end, population, houses_surveyed) 
        VALUES (?, ?, ?, ?, ?)
    ''', lga_stats)

    # Insert waste collection data
    waste_data = []
    for lga in lgas:
        lga_id = lga[0]
        for year_start, year_end in years:
            for subtype in waste_subtypes:
                subtype_id = subtype[0]
                
                # Generate realistic waste collection data
                base_amount = random.uniform(1000, 5000)
                
                # Adjust amounts based on waste type
                if subtype[1] == 1:  # Recyclable
                    recycling_rate = random.uniform(0.65, 0.85)
                elif subtype[1] == 2:  # Organics
                    recycling_rate = random.uniform(0.70, 0.90)
                else:  # Waste
                    recycling_rate = random.uniform(0.10, 0.30)
                
                amount_collected = base_amount
                amount_recycled = base_amount * recycling_rate
                
                waste_data.append((
                    lga_id,
                    subtype_id,
                    year_start,
                    year_end,
                    amount_collected,
                    amount_recycled
                ))
    
    cursor.executemany('''
        INSERT INTO waste_data 
        (lga_id, subtype_id, year_start, year_end, amount_collected, amount_recycled)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', waste_data)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    print("Initializing database...")
    init_database()
    print("Database initialized successfully!")