const fs = require('fs');
const path = './src/data/home_workouts.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.forEach(ex => {
  if (ex.id.startsWith('bw_')) {
    ex.image_url = `/assets/exercises/bodyweight/${ex.id}.gif`;
  } else if (ex.id.startsWith('rb_')) {
    ex.image_url = `/assets/exercises/bands/${ex.id}.gif`;
  } else if (ex.id.startsWith('pub_')) {
    ex.image_url = `/assets/exercises/pull_up_bar/${ex.id}.gif`;
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
