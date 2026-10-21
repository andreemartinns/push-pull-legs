const { execSync } = require('child_process');
const fs = require('fs');
const run = (c) => execSync(c, { stdio: 'inherit' });

console.log('1/3 Gerando o app...');
run('npx expo export -p web');

console.log('2/3 Corrigindo os ícones...');
fs.renameSync('dist/assets/node_modules', 'dist/assets/vendor');
const p = 'dist/_expo/static/js/web/';
for (const f of fs.readdirSync(p)) {
  if (!f.endsWith('.js')) continue;
  const texto = fs.readFileSync(p + f, 'utf8');
  fs.writeFileSync(p + f, texto.split('assets/node_modules').join('assets/vendor'));
}

console.log('3/3 Publicando no Netlify...');
run('npx netlify-cli deploy --prod --dir=dist');

console.log('Pronto! Site atualizado.');