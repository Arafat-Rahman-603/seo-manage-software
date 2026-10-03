const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'websites/peakline-studio/src/app/preview'));
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (content.includes('northstar-digital')) {
        content = content.replace(/northstar-digital/g, "peakline-studio");
        changed = true;
    }
    
    if (content.includes('Northstar Default')) {
        content = content.replace(/Northstar Default/g, "Peakline Default");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('done peakline replace');
