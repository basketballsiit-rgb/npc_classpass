const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SQL_FILE = path.join(__dirname, 'tb_course.sql');
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'courses-catalog.json');

console.log('Reading and parsing tb_course.sql...');
console.time('parse');

const rl = readline.createInterface({
  input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

let insertColumns = null;
let currentInsert = '';
let totalRows = 0;
const courses = [];
const seen = new Set();

function guessDepartmentFromCode(code) {
  if (code.startsWith('20101') || code.startsWith('30101')) return 'แผนกวิชาช่างยนต์';
  if (code.startsWith('20105') || code.startsWith('30105')) return 'แผนกวิชาช่างไฟฟ้ากำลัง';
  if (code.startsWith('20106') || code.startsWith('30106')) return 'แผนกวิชาช่างก่อสร้าง';
  if (code.startsWith('20104') || code.startsWith('30104')) return 'แผนกวิชาช่างเชื่อมโลหะ';
  if (code.startsWith('20107') || code.startsWith('30107')) return 'แผนกวิชาช่างอิเล็กทรอนิกส์';
  if (code.startsWith('20201') || code.startsWith('30201')) return 'แผนกวิชาการบัญชี';
  if (code.startsWith('20202') || code.startsWith('30202')) return 'แผนกวิชาการตลาด';
  if (code.startsWith('20204') || code.startsWith('30204')) return 'แผนกวิชาคอมพิวเตอร์ธุรกิจ';
  if (code.startsWith('20701') || code.startsWith('30701')) return 'แผนกวิชาการโรงแรม';
  if (code.startsWith('20000') || code.startsWith('30000')) return 'แผนกวิชาสามัญสัมพันธ์';
  return 'รายวิชาส่วนกลาง';
}

function parseValues(block, cols) {
  if (!cols) return;
  const colIdx = {
    id: cols.findIndex(c => c.toLowerCase() === 'id'),
    code: cols.findIndex(c => c.toLowerCase() === 'subjectcode'),
    nameTh: cols.findIndex(c => c.toLowerCase() === 'subjectnameth'),
    nameEn: cols.findIndex(c => c.toLowerCase() === 'subjectnameen'),
    credit: cols.findIndex(c => c.toLowerCase() === 'credit'),
    theory: cols.findIndex(c => c.toLowerCase() === 'credittheory'),
    practice: cols.findIndex(c => c.toLowerCase() === 'creditpractice'),
    year: cols.findIndex(c => c.toLowerCase().includes('curriculu') || c.toLowerCase() === 'createyear'),
    type: cols.findIndex(c => c.toLowerCase() === 'subjecttype'),
  };

  let inString = false;
  let quoteChar = '';
  let isEscaped = false;
  let depth = 0;
  let currentTuple = [];
  let currentField = '';

  for (let i = 0; i < block.length; i++) {
    const char = block[i];

    if (isEscaped) {
      currentField += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (inString) {
      if (char === quoteChar) {
        if (block[i + 1] === quoteChar) {
          currentField += quoteChar;
          i++;
        } else {
          inString = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = true;
      quoteChar = char;
      continue;
    }

    if (char === '(') {
      depth++;
      if (depth === 1) {
        currentTuple = [];
        currentField = '';
      }
      continue;
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        currentTuple.push(currentField.trim());
        currentField = '';
        totalRows++;

        const code = (currentTuple[colIdx.code] || '').trim();
        const name = (currentTuple[colIdx.nameTh] || '').trim();
        if (code || name) {
          const key = `${code}-${name}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            const credits = parseFloat(currentTuple[colIdx.credit]) || 0;
            const theory = parseFloat(currentTuple[colIdx.theory]) || 0;
            const practice = parseFloat(currentTuple[colIdx.practice]) || 0;
            courses.push({
              id: currentTuple[colIdx.id] ? `crs-${currentTuple[colIdx.id]}` : `crs-${courses.length + 1}`,
              code,
              name,
              nameEn: colIdx.nameEn !== -1 ? currentTuple[colIdx.nameEn] || '' : undefined,
              credits,
              theory,
              practice,
              totalHours: (theory + practice) * 18 || credits * 18 || 36,
              curriculumYear: colIdx.year !== -1 ? currentTuple[colIdx.year] || '' : undefined,
              subjectType: colIdx.type !== -1 ? currentTuple[colIdx.type] || '' : undefined,
              department: guessDepartmentFromCode(code),
            });
          }
        }
      }
      continue;
    }

    if (char === ',' && depth === 1) {
      currentTuple.push(currentField.trim());
      currentField = '';
      continue;
    }

    if (depth > 0) {
      currentField += char;
    }
  }
}

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('INSERT INTO `tb_course`') || trimmed.startsWith('INSERT INTO tb_course')) {
    const colMatch = trimmed.match(/INSERT\s+INTO\s+[`'"]?tb_course[`'"]?\s*\(([^)]+)\)/i);
    if (colMatch) {
      insertColumns = colMatch[1].split(',').map(c => c.trim().replace(/[`'"]/g, ''));
    }
    currentInsert = trimmed;
  } else if (currentInsert) {
    currentInsert += ' ' + trimmed;
  }

  if (currentInsert && trimmed.endsWith(';')) {
    const valIdx = currentInsert.indexOf('VALUES');
    if (valIdx !== -1 && insertColumns) {
      const vals = currentInsert.slice(valIdx + 6).trim().replace(/;$/, '');
      parseValues(vals, insertColumns);
    }
    currentInsert = '';
  }
});

rl.on('close', () => {
  console.timeEnd('parse');
  console.log(`Parsed ${totalRows} rows -> ${courses.length} unique courses.`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(courses, null, 2), 'utf8');
  console.log(`Saved to ${OUTPUT_FILE} successfully!`);
});
