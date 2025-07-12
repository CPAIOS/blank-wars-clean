const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('./blank_wars.db');

// User ID from the logs
const userId = '6a6d8d44-946f-45f6-9439-7663da777e2a';

// Get all characters and assign them to the user
db.serialize(() => {
  console.log('Assigning all characters to user:', userId);
  
  db.all("SELECT * FROM characters", (err, characters) => {
    if (err) {
      console.error('Error getting characters:', err);
      return;
    }
    
    console.log('Found', characters.length, 'characters');
    
    characters.forEach(char => {
      db.run(`INSERT OR REPLACE INTO user_characters 
        (user_id, character_id, level, experience, bond_level, created_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [userId, char.id, 1, 0, 1],
        function(err) {
          if (err) {
            console.error('Error assigning character:', char.name, err);
          } else {
            console.log('✅ Assigned:', char.name);
          }
        }
      );
    });
  });
});

db.close();