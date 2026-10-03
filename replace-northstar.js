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

const files = walk(path.join(__dirname, 'websites/northstar-digital/src/app/preview'));
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // In northstar-digital, we hardcode projectId and use loginRoute = '/preview/login'
    if (content.includes('requireProjectAccess(params.projectId)')) {
        content = content.replace(/requireProjectAccess\(params\.projectId\)/g, "requireProjectAccess('northstar-digital', '/preview/login')");
        changed = true;
    }
    if (content.includes('requireProjectAccess(params.projectId,')) {
        content = content.replace(/requireProjectAccess\(params\.projectId,/g, "requireProjectAccess('northstar-digital',");
        changed = true;
    }
    if (content.includes('requirePermission(params.projectId,')) {
        content = content.replace(/requirePermission\(params\.projectId,/g, "requirePermission('northstar-digital',");
        changed = true;
    }
    
    if (content.includes('params.projectId')) {
        content = content.replace(/params\.projectId/g, "'northstar-digital'");
        changed = true;
    }
    
    if (content.includes('href="/projects"')) {
        content = content.replace(/href="\/projects"/g, 'href="/preview"');
        changed = true;
    }
    if (content.includes('href={`/projects/${project.id}')) {
        content = content.replace(/href={`\/projects\/\${project\.id}/g, 'href={`/preview');
        changed = true;
    }
    if (content.includes('href={`/projects/${params.projectId}')) {
        content = content.replace(/href={`\/projects\/\${params\.projectId}/g, 'href={`/preview');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('done northstar replace');
