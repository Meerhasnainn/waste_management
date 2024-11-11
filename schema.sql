-- Basic tables for waste management system
CREATE TABLE IF NOT EXISTS lga_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code CHAR(1) NOT NULL,  -- 'C' for city, 'A' for area
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regional_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL  -- SMA, ERA, RRA, Rest of NSW
);

CREATE TABLE IF NOT EXISTS lgas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type_id INTEGER,
    regional_group_id INTEGER,
    FOREIGN KEY (type_id) REFERENCES lga_types(id),
    FOREIGN KEY (regional_group_id) REFERENCES regional_groups(id)
);

CREATE TABLE IF NOT EXISTS waste_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL  -- recyclable, organics, waste
);

CREATE TABLE IF NOT EXISTS waste_subtypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY (type_id) REFERENCES waste_types(id)
);

CREATE TABLE IF NOT EXISTS lga_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lga_id INTEGER,
    year_start INTEGER,
    year_end INTEGER,
    population INTEGER,
    houses_surveyed INTEGER,
    FOREIGN KEY (lga_id) REFERENCES lgas(id)
);

CREATE TABLE IF NOT EXISTS waste_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lga_id INTEGER,
    subtype_id INTEGER,
    year_start INTEGER,
    year_end INTEGER,
    amount_collected REAL,
    amount_recycled REAL,
    FOREIGN KEY (lga_id) REFERENCES lgas(id),
    FOREIGN KEY (subtype_id) REFERENCES waste_subtypes(id)
);