const fs = require('fs');
const path = './src/data/home_workouts.json';
let data = [];

try {
  data = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {
  console.error("Error reading file:", e);
  process.exit(1);
}

// Push-ups: ~0.65
// Pull-ups/Chin-ups: ~0.7
// Dips: ~0.75
// Squats/Lunges (bodyweight): ~0.8
// Core (plank, crunches): ~0.5

data.forEach(ex => {
  if (ex.equipment && ex.equipment.includes('bodyweight')) {
    ex.isBodyweight = true;
    
    const name = ex.name.toLowerCase();
    if (name.includes('push-up') || name.includes('hít đất')) {
      ex.bwFraction = 0.65;
    } else if (name.includes('pull-up') || name.includes('chin-up') || name.includes('hít xà')) {
      ex.bwFraction = 0.70;
    } else if (name.includes('dip') || name.includes('xà kép')) {
      ex.bwFraction = 0.75;
    } else if (name.includes('squat') || name.includes('lunge') || name.includes('chân')) {
      ex.bwFraction = 0.80;
    } else if (name.includes('plank') || name.includes('crunch') || name.includes('bụng')) {
      ex.bwFraction = 0.50;
    } else {
      ex.bwFraction = 0.60; // fallback
    }
  } else {
    ex.isBodyweight = false;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated bwFraction for bodyweight exercises');
