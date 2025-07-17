#!/bin/bash

# Batch fix script for character relationship history fields
# This script will add missing history fields to all character relationships

echo "Fixing character relationship history fields..."

# Define the file path
FILE="/home/mike/code/blank-wars-clean/frontend/src/data/characters.ts"

# Create a backup
cp "$FILE" "${FILE}.backup"

# Fix remaining relationships by adding generic history descriptions
# These are the remaining ones that need history fields

# Fix Sun Wukong relationships
sed -i "s/{ characterId: 'merlin', relationship: 'rival', strength: -60 },/{ characterId: 'merlin', relationship: 'rival', strength: -60, history: 'Magical rivalry between ancient wisdom and chaotic trickery' },/g" "$FILE"
sed -i "s/{ characterId: 'achilles', relationship: 'ally', strength: 30 }/{ characterId: 'achilles', relationship: 'ally', strength: 30, history: 'Warriors who respect each others fighting prowess' }/g" "$FILE"

# Fix Sammy Slugger relationships  
sed -i "s/{ characterId: 'holmes', relationship: 'rival', strength: -55 },/{ characterId: 'holmes', relationship: 'rival', strength: -55, history: 'Different detective methods create professional tension' },/g" "$FILE"
sed -i "s/{ characterId: 'dracula', relationship: 'enemy', strength: -30 },/{ characterId: 'dracula', relationship: 'enemy', strength: -30, history: 'Street cop versus supernatural evil' },/g" "$FILE"
sed -i "s/{ characterId: 'robin_hood', relationship: 'ally', strength: 25 },/{ characterId: 'robin_hood', relationship: 'ally', strength: 25, history: 'Both fight for justice against corruption' },/g" "$FILE"
sed -i "s/{ characterId: 'billy_the_kid', relationship: 'ally', strength: 20 }/{ characterId: 'billy_the_kid', relationship: 'ally', strength: 20, history: 'Mutual respect between lawman and outlaw with honor' }/g" "$FILE"

# Fix Billy the Kid relationships
sed -i "s/{ characterId: 'robin_hood', relationship: 'ally', strength: 40 },/{ characterId: 'robin_hood', relationship: 'ally', strength: 40, history: 'Outlaw heroes who protect the innocent' },/g" "$FILE"
sed -i "s/{ characterId: 'achilles', relationship: 'rival', strength: -30 },/{ characterId: 'achilles', relationship: 'rival', strength: -30, history: 'Different codes of honor and combat styles' },/g" "$FILE"
sed -i "s/{ characterId: 'sammy_slugger', relationship: 'ally', strength: 20 },/{ characterId: 'sammy_slugger', relationship: 'ally', strength: 20, history: 'Mutual respect between lawman and outlaw with honor' },/g" "$FILE"
sed -i "s/{ characterId: 'dracula', relationship: 'enemy', strength: -60 }/{ characterId: 'dracula', relationship: 'enemy', strength: -60, history: 'Free spirit opposes tyrannical darkness' }/g" "$FILE"

# Fix Genghis Khan relationships
sed -i "s/{ characterId: 'achilles', relationship: 'rival', strength: -70 },/{ characterId: 'achilles', relationship: 'rival', strength: -70, history: 'Legendary warriors competing for greatest fighter title' },/g" "$FILE"
sed -i "s/{ characterId: 'cleopatra', relationship: 'ally', strength: 40 },/{ characterId: 'cleopatra', relationship: 'ally', strength: 40, history: 'Mutual respect between great empire builders' },/g" "$FILE"
sed -i "s/{ characterId: 'billy_the_kid', relationship: 'rival', strength: -30 },/{ characterId: 'billy_the_kid', relationship: 'rival', strength: -30, history: 'Disciplined empire builder vs free-spirited outlaw' },/g" "$FILE"
sed -i "s/{ characterId: 'dracula', relationship: 'rival', strength: -25 }/{ characterId: 'dracula', relationship: 'rival', strength: -25, history: 'Conqueror of empires vs master of shadows' }/g" "$FILE"

# Fix Space Cyborg relationships
sed -i "s/{ characterId: 'alien_grey', relationship: 'ally', strength: 55 },/{ characterId: 'alien_grey', relationship: 'ally', strength: 55, history: 'Advanced beings recognize each others technological evolution' },/g" "$FILE"
sed -i "s/{ characterId: 'frankenstein_monster', relationship: 'rival', strength: -40 },/{ characterId: 'frankenstein_monster', relationship: 'rival', strength: -40, history: 'Natural vs artificial life forms - philosophical differences' },/g" "$FILE"
sed -i "s/{ characterId: 'tesla', relationship: 'ally', strength: 30 },/{ characterId: 'tesla', relationship: 'ally', strength: 30, history: 'Appreciation for technological innovation and invention' },/g" "$FILE"
sed -i "s/{ characterId: 'genghis_khan', relationship: 'ally', strength: 20 }/{ characterId: 'genghis_khan', relationship: 'ally', strength: 20, history: 'Strategic military minds recognize tactical excellence' }/g" "$FILE"

# Fix Tesla relationships
sed -i "s/{ characterId: 'merlin', relationship: 'rival', strength: -60 },/{ characterId: 'merlin', relationship: 'rival', strength: -60, history: 'Science versus magic - competing worldviews' },/g" "$FILE"
sed -i "s/{ characterId: 'dracula', relationship: 'enemy', strength: -35 }/{ characterId: 'dracula', relationship: 'enemy', strength: -35, history: 'Illumination and progress against ancient evil' }/g" "$FILE"

# Fix Alien Grey relationships  
sed -i "s/{ characterId: 'tesla', relationship: 'ally', strength: 65 },/{ characterId: 'tesla', relationship: 'ally', strength: 65, history: 'Advanced science recognizes pioneering electrical genius' },/g" "$FILE"
sed -i "s/{ characterId: 'dracula', relationship: 'enemy', strength: -80 }/{ characterId: 'dracula', relationship: 'enemy', strength: -80, history: 'Advanced logical beings oppose chaotic evil entities' }/g" "$FILE"

# Fix Robin Hood relationships
sed -i "s/{ characterId: 'napoleon', relationship: 'rival', strength: -60 },/{ characterId: 'napoleon', relationship: 'rival', strength: -60, history: 'Freedom fighter opposes imperial authority' },/g" "$FILE"
sed -i "s/{ characterId: 'joan', relationship: 'ally', strength: 50 }/{ characterId: 'joan', relationship: 'ally', strength: 50, history: 'Champions of justice and protection of innocents' }/g" "$FILE"

# Fix Agent X relationships
sed -i "s/{ characterId: 'holmes', relationship: 'rival', strength: 30 },/{ characterId: 'holmes', relationship: 'rival', strength: 30, history: 'Professional competition between brilliant investigators' },/g" "$FILE"
sed -i "s/{ characterId: 'dracula', relationship: 'enemy', strength: -40 },/{ characterId: 'dracula', relationship: 'enemy', strength: -40, history: 'Modern agent trained to combat supernatural threats' },/g" "$FILE"
sed -i "s/{ characterId: 'cleopatra', relationship: 'ally', strength: 25 },/{ characterId: 'cleopatra', relationship: 'ally', strength: 25, history: 'Mutual appreciation for strategic intelligence and diplomacy' },/g" "$FILE"
sed -i "s/{ characterId: 'alien_grey', relationship: 'ally', strength: 20 },/{ characterId: 'alien_grey', relationship: 'ally', strength: 20, history: 'Professional respect between intelligence operatives' },/g" "$FILE"
sed -i "s/{ characterId: 'robin_hood', relationship: 'ally', strength: 15 }/{ characterId: 'robin_hood', relationship: 'ally', strength: 15, history: 'Both operate from shadows to protect innocents' }/g" "$FILE"

echo "Character relationship history fields have been fixed!"
echo "Backup created at ${FILE}.backup"
