const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, 'data/blankwars.db');
const db = new sqlite3.Database(dbPath);
const userId = '6a6d8d44-946f-45f6-9439-7663da777e2a';

db.serialize(() => {
  db.all('SELECT * FROM characters', (err, characters) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log(`Assigning ${characters.length} characters to user`);
    
    const insert = db.prepare(`
      INSERT INTO user_characters (
        id, user_id, character_id, level, experience, bond_level,
        total_battles, total_wins, current_health, max_health,
        is_injured, equipment, enhancements, conversation_memory,
        significant_memories, personality_drift
      ) VALUES (?, ?, ?, 1, 0, 0, 0, 0, ?, ?, 0, '[]', '[]', '[]', '[]', '{}')
    `);
    
    characters.forEach(char => {
      insert.run([
        uuidv4(),
        userId,
        char.id,
        char.base_health,
        char.base_health
      ], (err) => {
        if (err) console.error(`Error: ${char.name}:`, err);
        else console.log(`✅ ${char.name}`);
      });
    });
    
    insert.finalize(() => {
      db.get('SELECT COUNT(*) as count FROM user_characters WHERE user_id = ?', [userId], (err, result) => {
        console.log(`\n🎉 Total assigned: ${result.count}`);
        db.close();
      });
    });
  });
});