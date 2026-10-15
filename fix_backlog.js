const fs = require('fs');
const path = require('path');

function findBacklogFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      const res = findBacklogFile(path.join(dir, file.name));
      if (res) return res;
    } else {
      if (file.name.toLowerCase().includes('backlog') && file.name !== 'BacklogTab.tsx' && file.name.endsWith('.tsx')) {
        return path.join(dir, file.name);
      }
    }
  }
  return null;
}

const actualFile = findBacklogFile('src');

if (!actualFile) {
  console.log('❌ Настоящий файл бэклога не найден.');
  process.exit(1);
}

// Формируем правильный путь для импорта (src/... -> @/...)
const filename = path.basename(actualFile, '.tsx');
const importPath = actualFile.replace(/^src\//, '@/').replace(/\.tsx$/, '');

// Достаем имя компонента из файла
const content = fs.readFileSync(actualFile, 'utf8');
const match = content.match(/export (?:default )?function ([A-Za-z0-9_]+)/);
const compName = match ? match[1] : filename;

console.log(`✅ Найден настоящий бэклог: <${compName}> в файле ${actualFile}`);

const boardPath = 'src/features/planning/pages/PeriodBoard.tsx';
if (fs.existsSync(boardPath)) {
  let boardContent = fs.readFileSync(boardPath, 'utf8');
  
  // Меняем старый импорт заглушки на правильный
  boardContent = boardContent.replace(/import\s+\{\s*BacklogTab\s*\}\s+from\s+['"][^'"]+['"];?/g, `import { ${compName} } from '${importPath}';`);
  
  // Меняем компонент в JSX
  boardContent = boardContent.replace(/<BacklogTab/g, `<${compName}`);
  
  fs.writeFileSync(boardPath, boardContent);
  console.log('✨ PeriodBoard.tsx успешно обновлен!');
}

const dummyPath = 'src/features/planning/components/BacklogTab.tsx';
if (fs.existsSync(dummyPath)) {
  fs.unlinkSync(dummyPath);
  console.log('🗑️ Ошибочная заглушка удалена.');
}
