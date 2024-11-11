from flask import Flask, render_template, jsonify, request
import sqlite3
from contextlib import closing

app = Flask(__name__)

DATABASE = 'database/waste_management.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with closing(get_db()) as db:
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.route('/')
def index():
    return render_template('index.html')

# Level 1 (GREEN) routes
@app.route('/level1')
def level1():
    return render_template('level1.html')

@app.route('/api/landing-stats')
def landing_stats():
    with get_db() as db:
        stats = {}
        # Get statistics for 2018-2019
        cur = db.execute('''
            SELECT COUNT(DISTINCT l.id) as total_lgas,
                   SUM(ls.houses_surveyed) as total_houses
            FROM lgas l
            JOIN lga_statistics ls ON l.id = ls.lga_id
            WHERE ls.year_start = 2018 AND ls.year_end = 2019
        ''')
        row = cur.fetchone()
        stats['2018-2019'] = {
            'total_lgas': row['total_lgas'],
            'total_houses': row['total_houses']
        }
        
        # Get statistics for 2019-2020
        cur = db.execute('''
            SELECT COUNT(DISTINCT l.id) as total_lgas,
                   SUM(ls.houses_surveyed) as total_houses
            FROM lgas l
            JOIN lga_statistics ls ON l.id = ls.lga_id
            WHERE ls.year_start = 2019 AND ls.year_end = 2020
        ''')
        row = cur.fetchone()
        stats['2019-2020'] = {
            'total_lgas': row['total_lgas'],
            'total_houses': row['total_houses']
        }
        
        return jsonify(stats)

# Level 2 (ORANGE) routes
@app.route('/level2')
def level2():
    return render_template('level2.html')

@app.route('/api/lgas')
def get_lgas():
    with get_db() as db:
        cur = db.execute('SELECT id, name FROM lgas ORDER BY name')
        lgas = [dict(row) for row in cur.fetchall()]
        return jsonify(lgas)

@app.route('/api/waste-types')
def get_waste_types():
    with get_db() as db:
        cur = db.execute('''
            SELECT wt.id, wt.name, 
                   GROUP_CONCAT(ws.id || ':' || ws.name) as subtypes
            FROM waste_types wt
            LEFT JOIN waste_subtypes ws ON wt.id = ws.type_id
            GROUP BY wt.id
        ''')
        types = [dict(row) for row in cur.fetchall()]
        return jsonify(types)

# Update this section in app.py

@app.route('/api/lga-comparison')
def lga_comparison():
    lga_ids = request.args.getlist('lga_ids[]')
    waste_type = request.args.get('waste_type')
    subtypes = request.args.getlist('subtypes[]')
    
    print(f"Received request - LGAs: {lga_ids}, Type: {waste_type}, Subtypes: {subtypes}")  # Debug print
    
    if not lga_ids or not waste_type or not subtypes:
        return jsonify([])

    try:
        with get_db() as db:
            # Convert waste type name to ID
            cursor = db.cursor()
            cursor.execute('SELECT id FROM waste_types WHERE name = ?', (waste_type,))
            waste_type_id = cursor.fetchone()[0]

            # Build the query
            query = '''
                SELECT 
                    l.name as lga_name,
                    ls.population,
                    ls.houses_surveyed,
                    SUM(wd.amount_collected) as total_collected,
                    SUM(wd.amount_recycled) as total_recycled,
                    ROUND(SUM(wd.amount_recycled) * 100.0 / NULLIF(SUM(wd.amount_collected), 0), 2) as recycling_percentage,
                    ROUND(SUM(wd.amount_collected) * 1.0 / ls.houses_surveyed, 2) as avg_per_household
                FROM lgas l
                JOIN lga_statistics ls ON l.id = ls.lga_id
                JOIN waste_data wd ON l.id = wd.lga_id
                JOIN waste_subtypes ws ON wd.subtype_id = ws.id
                WHERE l.id IN ({})
                AND ws.type_id = ?
                AND wd.subtype_id IN ({})
                AND wd.year_start = 2019
                GROUP BY l.id, l.name, ls.population, ls.houses_surveyed
            '''.format(
                ','.join('?' * len(lga_ids)),
                ','.join('?' * len(subtypes))
            )
            
            # Prepare parameters
            params = lga_ids + [waste_type_id] + subtypes
            
            # Execute query
            cursor.execute(query, params)
            results = [dict((cursor.description[i][0], value) 
                     for i, value in enumerate(row))
                     for row in cursor.fetchall()]
            
            print(f"Query results: {results}")  # Debug print
            return jsonify(results)
            
    except Exception as e:
        print(f"Error in lga_comparison: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500

# Level 3 (RED) routes
@app.route('/level3')
def level3():
    return render_template('level3.html')

@app.route('/api/similar-lgas')
def similar_lgas():
    try:
        lga_id = request.args.get('lga_id')
        waste_type = request.args.get('waste_type')
        year_start = request.args.get('year_start', '2019')
        cutoff = request.args.get('cutoff', '10')

        print(f"Received parameters: LGA ID: {lga_id}, Type: {waste_type}, Year: {year_start}")  # Debug print
        
        with get_db() as db:
            # First get the waste type ID
            cursor = db.cursor()
            cursor.execute('SELECT id FROM waste_types WHERE name = ?', (waste_type,))
            waste_type_id = cursor.fetchone()[0]

            # Get recycling rate for the selected LGA
            query = '''
                WITH base_lga AS (
                    SELECT 
                        SUM(wd.amount_recycled) * 100.0 / NULLIF(SUM(wd.amount_collected), 0) as recycle_rate
                    FROM waste_data wd
                    JOIN waste_subtypes ws ON wd.subtype_id = ws.id
                    WHERE wd.lga_id = ?
                    AND ws.type_id = ?
                    AND wd.year_start = ?
                ),
                lga_rates AS (
                    SELECT 
                        l.id as lga_id,
                        l.name as lga_name,
                        ls.population,
                        ls.houses_surveyed,
                        SUM(wd.amount_collected) as total_collected,
                        SUM(wd.amount_recycled) as total_recycled,
                        SUM(wd.amount_recycled) * 100.0 / NULLIF(SUM(wd.amount_collected), 0) as recycle_rate,
                        ABS(SUM(wd.amount_recycled) * 100.0 / NULLIF(SUM(wd.amount_collected), 0) - 
                            (SELECT recycle_rate FROM base_lga)) as difference
                    FROM lgas l
                    JOIN lga_statistics ls ON l.id = ls.lga_id AND ls.year_start = ?
                    JOIN waste_data wd ON l.id = wd.lga_id AND wd.year_start = ?
                    JOIN waste_subtypes ws ON wd.subtype_id = ws.id
                    WHERE l.id != ?
                    AND ws.type_id = ?
                    GROUP BY l.id, l.name, ls.population, ls.houses_surveyed
                    HAVING SUM(wd.amount_collected) > 0
                )
                SELECT *
                FROM lga_rates
                ORDER BY difference
                LIMIT ?
            '''
            
            params = [
                lga_id, waste_type_id, year_start,  # For base_lga CTE
                year_start, year_start,             # For lga_rates CTE
                lga_id, waste_type_id,             # For WHERE clause
                int(cutoff)                        # For LIMIT
            ]
            
            cursor.execute(query, params)
            
            # Convert to list of dictionaries
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            print(f"Found {len(results)} similar LGAs")  # Debug print
            
            # If no results found, return an informative error
            if not results:
                return jsonify({
                    'error': 'No similar LGAs found',
                    'message': 'Try adjusting the criteria or selecting a different LGA'
                })
            
            return jsonify(results)
            
    except Exception as e:
        print(f"Error in similar_lgas: {str(e)}")  # Debug print
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500
if __name__ == '__main__':
    app.run(debug=True)