
const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'dictionaries');
const msgDir = path.join(__dirname, 'messages');

if (!fs.existsSync(msgDir)) {
    fs.mkdirSync(msgDir);
}

const files = fs.readdirSync(dictDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

files.forEach(file => {
    const locale = file.replace('.ts', '');
    const content = fs.readFileSync(path.join(dictDir, file), 'utf8');
    
    // Simple regex to extract the object content. 
    // This assumes the format is `export const en = { ... };`
    const match = content.match(/export const \w+ = ([\s\S]+?);/);
    if (match) {
        let objectStr = match[1];
        // We need to make it valid JSON. 
        // A quick hack is to use eval (since we trust the files) or a better parser.
        // I'll use a safer approach: use a temporary .js file and require it.
        const tempJs = path.join(__dirname, `temp_${locale}.js`);
        fs.writeFileSync(tempJs, `module.exports = ${objectStr}`);
        const data = require(tempJs);
        fs.writeFileSync(path.join(msgDir, `${locale}.json`), JSON.stringify(data, null, 2));
        fs.unlinkSync(tempJs);
        console.log(`Converted ${locale}.ts to ${locale}.json`);
    }
});
