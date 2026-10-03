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

const files = walk(path.join(__dirname, 'packages/backend/src'));
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // permissions.ts is in root of src
    const isRoot = path.dirname(file) === path.join(__dirname, 'packages/backend/src');
    
    if (content.includes("'@/lib/")) {
        content = content.replace(/'@\/lib\//g, isRoot ? "'./" : "'../");
        changed = true;
    }
    if (content.includes('"@/lib/')) {
        content = content.replace(/"@\/lib\//g, isRoot ? '"./' : '"../');
        changed = true;
    }
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('done backend replace');
