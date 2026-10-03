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

const files = walk(path.join(__dirname, 'apps/seo-admin/src'));
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (content.includes('import connectMongoDB from')) {
        content = content.replace(/import connectMongoDB from/g, 'import { connectMongoDB } from');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('done admin connect replace');
