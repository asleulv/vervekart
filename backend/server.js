// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

// Environment configuration
const MODE = process.env.MODE || 'development';
const PORT = process.env.PORT || 3099;

// Select values based on MODE
const NODE_ENV = MODE === 'production' ? process.env.PROD_NODE_ENV : process.env.DEV_NODE_ENV;
const SQLITE_PATH = MODE === 'production' ? process.env.PROD_SQLITE_PATH : process.env.DEV_SQLITE_PATH;
const FRONTEND_URL = MODE === 'production' ? process.env.PROD_FRONTEND_URL : process.env.DEV_FRONTEND_URL;

// Set NODE_ENV for the process
process.env.NODE_ENV = NODE_ENV;

const app = express();

// CORS configuration based on environment
const corsOptions = {
  origin: MODE === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3000', FRONTEND_URL]
    : [FRONTEND_URL],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// 👤 ENKEL BRUKAR-REGISTRERING (for testing)
app.post('/api/register-user', (req, res) => {
  const { name, email } = req.body;
  
  db.run(
    'INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)',
    [name, email || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Hent brukar (enten ny eller eksisterande)
      db.get('SELECT * FROM users WHERE name = ?', [name], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ user });
      });
    }
  );
});

// 💾 LAGRE STATUS MED FULL HISTORIKK + KOORDINATER
app.post('/api/save-status', (req, res) => {
  const { lokalid, status, address_text, kommune, fylke, user_name, user_id, lat, lon } = req.body;
  
  // Hent noverande status først
  db.get(
    'SELECT current_status FROM address_current_status WHERE lokalid = ?',
    [lokalid],
    (err, currentRow) => {
      const oldStatus = currentRow?.current_status || 'Ubehandlet';
      
      // Start transaction
      db.serialize(() => {
        // 1. Oppdater/lag noverande status MED KOORDINATER
        db.run(`
          INSERT OR REPLACE INTO address_current_status 
          (lokalid, address_text, kommune, fylke, current_status, last_changed_by, last_changed_at, lat, lon)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
        `, [lokalid, address_text, kommune, fylke, status, user_id, lat, lon]);

        // 2. Legg til i historikk
        db.run(`
          INSERT INTO address_history 
          (lokalid, address_text, kommune, fylke, old_status, new_status, changed_by, changed_by_name, action_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'status_change')
        `, [lokalid, address_text, kommune, fylke, oldStatus, status, user_id, user_name], function(err) {
          if (err) {
            console.error('History save error:', err);
            return res.status(500).json({ error: 'Failed to save history' });
          }
          
          console.log(`✅ HISTORIKK: ${address_text} | ${oldStatus} → ${status} | av ${user_name} | coords: ${lat},${lon}`);
          res.json({ 
            success: true, 
            history_id: this.lastID,
            old_status: oldStatus,
            new_status: status,
            coordinates: lat && lon ? { lat, lon } : null
          });
        });
      });
    }
  );
});

// 🎯 NY: HENT STATUSAR FOR SPESIFIKKE BOUNDS (SPATIAL FILTERING)
app.post('/api/get-statuses-bounds', (req, res) => {
  const startTime = Date.now();
  
  try {
    const bounds = req.body;
    
    // Validate bounds
    if (!bounds || !['north', 'south', 'east', 'west'].every(k => k in bounds)) {
      return res.status(400).json({ error: 'Invalid bounds provided' });
    }
    
    const { north, south, east, west } = bounds;
    
    // Convert to numbers and validate
    const n = parseFloat(north);
    const s = parseFloat(south);
    const e = parseFloat(east);
    const w = parseFloat(west);
    
    if ([n, s, e, w].some(v => isNaN(v))) {
      return res.status(400).json({ error: 'Invalid coordinate values' });
    }
    
    // SQL query with geographic filtering
    const sql = `
      SELECT 
        lokalid, 
        current_status, 
        lat, 
        lon, 
        address_text, 
        kommune, 
        fylke, 
        last_changed_at
      FROM address_current_status 
      WHERE lat BETWEEN ? AND ? 
        AND lon BETWEEN ? AND ?
      ORDER BY last_changed_at DESC
    `;
    
    db.all(sql, [s, n, w, e], (err, rows) => {
      if (err) {
        console.error('Database error in get-statuses-bounds:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Convert to same format as existing endpoint
      const statuses = {};
      rows.forEach(row => {
        statuses[row.lokalid] = row.current_status;
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`🎯 BOUNDS QUERY: ${rows.length} statuses in ${executionTime}ms | Bounds: ${s},${w} to ${n},${e}`);
      
      res.json({ 
        statuses,
        bounds: { north: n, south: s, east: e, west: w },
        count: rows.length,
        execution_time_ms: executionTime
      });
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Error in get-statuses-bounds after ${executionTime}ms:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 📊 HENT STATUSAR (GLOBAL - FALLBACK)
app.post('/api/get-statuses', (req, res) => {
  const startTime = Date.now();
  const sql = `SELECT lokalid, current_status FROM address_current_status`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const statuses = {};
    rows.forEach(row => {
      statuses[row.lokalid] = row.current_status;
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`📊 GLOBAL QUERY: ${rows.length} statuses in ${executionTime}ms`);
    res.json({ statuses, count: rows.length, execution_time_ms: executionTime });
  });
});

// 📜 HENT HISTORIKK FOR EI ADRESSE
app.get('/api/address-history/:lokalid', (req, res) => {
  const { lokalid } = req.params;
  
  const sql = `
    SELECT 
      old_status,
      new_status, 
      changed_by_name,
      changed_at,
      action_type,
      notes
    FROM address_history 
    WHERE lokalid = ?
    ORDER BY changed_at DESC
  `;
  
  db.all(sql, [lokalid], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ 
      lokalid,
      history: rows,
      total_changes: rows.length
    });
  });
});

// 📅 DAGENS STATISTIKK (NY!)
app.get('/api/daily-stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const queries = {
    // Noverande statusar per kommune (same som advanced-stats)
    current_stats: `
      SELECT kommune, current_status, COUNT(*) as count
      FROM address_current_status
      GROUP BY kommune, current_status
      ORDER BY kommune, current_status
    `,
    
    // Aktivitet per brukar - BERRE I DAG
    user_activity: `
      SELECT 
        changed_by_name,
        COUNT(*) as total_changes,
        COUNT(CASE WHEN new_status = 'Ja' THEN 1 END) as ja_count,
        COUNT(CASE WHEN new_status = 'Nei' THEN 1 END) as nei_count,
        COUNT(CASE WHEN new_status = 'Ikke hjemme' THEN 1 END) as ikke_hjemme_count,
        MIN(changed_at) as first_activity,
        MAX(changed_at) as last_activity
      FROM address_history 
      WHERE action_type = 'status_change'
        AND DATE(changed_at) = ?
      GROUP BY changed_by_name
      ORDER BY total_changes DESC
    `,
    
    // Dagens aktivitet
    daily_activity: `
      SELECT 
        DATE(changed_at) as date,
        COUNT(*) as changes,
        COUNT(DISTINCT changed_by) as active_users
      FROM address_history
      WHERE action_type = 'status_change'
        AND DATE(changed_at) = ?
      GROUP BY DATE(changed_at)
      ORDER BY date DESC
    `
  };
  
  const results = {};
  let completed = 0;
  
  // current_stats treng ikkje dato-parameter
  db.all(queries.current_stats, [], (err, rows) => {
    if (!err) results.current_stats = rows;
    completed++;
    
    if (completed === Object.keys(queries).length) {
      res.json({...results, date: today});
    }
  });
  
  // user_activity og daily_activity treng dagens dato
  db.all(queries.user_activity, [today], (err, rows) => {
    if (!err) results.user_activity = rows;
    completed++;
    
    if (completed === Object.keys(queries).length) {
      res.json({...results, date: today});
    }
  });
  
  db.all(queries.daily_activity, [today], (err, rows) => {
    if (!err) results.daily_activity = rows;
    completed++;
    
    if (completed === Object.keys(queries).length) {
      res.json({...results, date: today});
    }
  });
});

// 📈 AVANSERT STATISTIKK (total - uendra)
app.get('/api/advanced-stats', (req, res) => {
  const queries = {
    // Noverande statusar per kommune
    current_stats: `
      SELECT kommune, current_status, COUNT(*) as count
      FROM address_current_status
      GROUP BY kommune, current_status
      ORDER BY kommune, current_status
    `,
    
    // Aktivitet per brukar
    user_activity: `
      SELECT 
        changed_by_name,
        COUNT(*) as total_changes,
        COUNT(CASE WHEN new_status = 'Ja' THEN 1 END) as ja_count,
        COUNT(CASE WHEN new_status = 'Nei' THEN 1 END) as nei_count,
        COUNT(CASE WHEN new_status = 'Ikke hjemme' THEN 1 END) as ikke_hjemme_count,
        MIN(changed_at) as first_activity,
        MAX(changed_at) as last_activity
      FROM address_history 
      WHERE action_type = 'status_change'
      GROUP BY changed_by_name
      ORDER BY total_changes DESC
    `,
    
    // Aktivitet per dag
    daily_activity: `
      SELECT 
        DATE(changed_at) as date,
        COUNT(*) as changes,
        COUNT(DISTINCT changed_by) as active_users
      FROM address_history
      WHERE action_type = 'status_change'
      GROUP BY DATE(changed_at)
      ORDER BY date DESC
      LIMIT 30
    `
  };
  
  const results = {};
  let completed = 0;
  
  Object.entries(queries).forEach(([key, sql]) => {
    db.all(sql, [], (err, rows) => {
      if (!err) results[key] = rows;
      completed++;
      
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// 🗑️ NULLSTILL OMRÅDE (med full logging)
app.delete('/api/clear-area', (req, res) => {
  const { kommune, fylke, user_id, user_name, reason } = req.body;
  
  // Tel først kor mange som vil bli påverka
  db.get(
    'SELECT COUNT(*) as count FROM address_current_status WHERE kommune = ? AND fylke = ?',
    [kommune, fylke],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const affectedCount = result.count;
      
      if (affectedCount === 0) {
        return res.json({ success: true, affected: 0, message: 'Ingen adresser å nullstille' });
      }
      
      db.serialize(() => {
        // 1. Logg alle adresser som blir nullstilt
        db.run(`
          INSERT INTO address_history 
          (lokalid, address_text, kommune, fylke, old_status, new_status, changed_by, changed_by_name, action_type, notes)
          SELECT 
            lokalid, address_text, kommune, fylke, current_status, 'Ubehandlet', ?, ?, 'bulk_reset', ?
          FROM address_current_status 
          WHERE kommune = ? AND fylke = ?
        `, [user_id, user_name, reason || 'Område nullstilt', kommune, fylke]);
        
        // 2. Nullstill statusane
        db.run(
          'DELETE FROM address_current_status WHERE kommune = ? AND fylke = ?',
          [kommune, fylke]
        );
        
        // 3. Logg reset-hendelsen
        db.run(
          'INSERT INTO reset_log (kommune, fylke, reset_by, reset_by_name, addresses_affected, reason) VALUES (?, ?, ?, ?, ?, ?)',
          [kommune, fylke, user_id, user_name, affectedCount, reason || 'Område nullstilt'],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to log reset' });
            }
            
            console.log(`🗑️ NULLSTILT: ${kommune}, ${fylke} | ${affectedCount} adresser | av ${user_name}`);
            res.json({ 
              success: true, 
              affected: affectedCount,
              reset_log_id: this.lastID
            });
          }
        );
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Vervekart backend - ${MODE.toUpperCase()} mode`);
  console.log(`🌐 Frontend CORS: ${FRONTEND_URL}`);
  console.log(`📊 Database: ${SQLITE_PATH}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`⚙️  Environment: ${NODE_ENV}`);
});
