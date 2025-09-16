// migrate-local.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

// Use your exact local database path
// const db = new sqlite3.Database('./vervekart.db');

// Use your exact production database path
const db = new sqlite3.Database('/var/www/vervekart-api/vervekart.db');

console.log('🔧 Starting LOCAL coordinate migration...');
console.log('📂 Database: ./vervekart.db');

const migrations = [
  'ALTER TABLE address_current_status ADD COLUMN lat REAL',
  'ALTER TABLE address_current_status ADD COLUMN lon REAL',
  'CREATE INDEX IF NOT EXISTS idx_address_current_status_lat ON address_current_status (lat)',
  'CREATE INDEX IF NOT EXISTS idx_address_current_status_lon ON address_current_status (lon)',
  'CREATE INDEX IF NOT EXISTS idx_address_current_status_lat_lon ON address_current_status (lat, lon)'
];

let completed = 0;

migrations.forEach((sql, index) => {
  db.run(sql, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error(`❌ Migration ${index + 1} failed:`, err.message);
    } else {
      console.log(`✅ Migration ${index + 1} completed: ${sql.substring(0, 40)}...`);
    }
    
    completed++;
    if (completed === migrations.length) {
      console.log('🎉 LOCAL migration completed!');
      
      // Verify schema
      db.all("PRAGMA table_info(address_current_status)", (err, rows) => {
        if (!err) {
          console.log('📋 Updated LOCAL schema:');
          rows.forEach(row => {
            if (row.name === 'lat' || row.name === 'lon') {
              console.log(`   ✨ ${row.name}: ${row.type} (NEW)`);
            } else {
              console.log(`   - ${row.name}: ${row.type}`);
            }
          });
        } else {
          console.error('❌ Schema check failed:', err);
        }
        
        db.close();
        process.exit(0);
      });
    }
  });
});
