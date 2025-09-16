// fix-indexes.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

// const db = new sqlite3.Database('./vervekart.db');
const db = new sqlite3.Database('/var/www/vervekart-api/vervekart.db');

console.log('🔧 Creating missing indexes...');

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_address_current_status_lat ON address_current_status (lat)',
  'CREATE INDEX IF NOT EXISTS idx_address_current_status_lon ON address_current_status (lon)', 
  'CREATE INDEX IF NOT EXISTS idx_address_current_status_lat_lon ON address_current_status (lat, lon)'
];

let completed = 0;

indexes.forEach((sql, index) => {
  db.run(sql, (err) => {
    if (err) {
      console.error(`❌ Index ${index + 1} failed:`, err.message);
    } else {
      console.log(`✅ Index ${index + 1} created successfully`);
    }
    
    completed++;
    if (completed === indexes.length) {
      console.log('🎉 All indexes created!');
      
      // Show final schema
      db.all("PRAGMA index_list(address_current_status)", (err, rows) => {
        if (!err) {
          console.log('📋 Database indexes:');
          rows.forEach(row => {
            if (row.name.includes('lat') || row.name.includes('lon')) {
              console.log(`   ✨ ${row.name} (NEW)`);
            }
          });
        }
        db.close();
        process.exit(0);
      });
    }
  });
});
