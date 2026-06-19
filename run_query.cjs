const { execSync } = require('child_process');
const fs = require('fs');
const prompt = fs.readFileSync('tt_prompt.txt', 'utf8').replace(/"/g, '\\"').replace(/\n/g, ' ');
try {
  const result = execSync(`nlm notebook query tt "${prompt}"`, { encoding: 'utf8' });
  console.log("STDOUT:", result);
} catch (e) {
  console.error("ERROR:", e.stderr);
}
