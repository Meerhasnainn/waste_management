import sqlite3

def verify_data():
    conn = sqlite3.connect('database/waste_management.db')
    cursor = conn.cursor()

    print("=== Database Verification ===\n")

    # Check LGAs
    cursor.execute("SELECT COUNT(*) FROM lgas")
    lga_count = cursor.fetchone()[0]
    print(f"Total LGAs: {lga_count}")

    # Check statistics
    cursor.execute("""
        SELECT year_start, year_end, COUNT(*) as count, 
               SUM(population) as total_population,
               SUM(houses_surveyed) as total_houses
        FROM lga_statistics
        GROUP BY year_start, year_end
    """)
    print("\nStatistics by Year:")
    for row in cursor.fetchall():
        print(f"{row[0]}-{row[1]}: {row[2]} LGAs, Population: {row[3]:,}, Houses: {row[4]:,}")

    # Check waste data
    cursor.execute("""
        SELECT wt.name, 
               COUNT(DISTINCT wd.lga_id) as lgas,
               SUM(wd.amount_collected) as total_collected,
               SUM(wd.amount_recycled) as total_recycled,
               (SUM(wd.amount_recycled) * 100.0 / SUM(wd.amount_collected)) as recycling_rate
        FROM waste_data wd
        JOIN waste_subtypes ws ON wd.subtype_id = ws.id
        JOIN waste_types wt ON ws.type_id = wt.id
        WHERE wd.year_start = 2019
        GROUP BY wt.name
    """)
    print("\n2019-2020 Waste Statistics by Type:")
    for row in cursor.fetchall():
        print(f"{row[0].title()}: {row[1]} LGAs, {row[2]:,.0f} collected, {row[3]:,.0f} recycled ({row[4]:.1f}%)")

    conn.close()

if __name__ == '__main__':
    verify_data()