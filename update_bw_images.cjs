const fs = require('fs');
const path = './src/data/home_workouts.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.forEach(ex => {
  if (ex.id.startsWith('bw_')) {
    ex.image_url = `/assets/exercises/bodyweight/${ex.id}.jpg`;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
