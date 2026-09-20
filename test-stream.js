const fs = require('fs');
const readline = require('readline');

console.time('parse');
const rl = readline.createInterface({
  input: fs.createReadStream('tb_course.sql', { encoding: 'utf8' }),
  crlfDelay: Infinity
});

let insertColumns = null;
let currentInsert = '';
let totalRows = 0;
const courses = [];
const seen = new Set();

function parseValues(block, cols) {
  if (!cols) return;
  const colIdx = {
    code: cols.findIndex(c => c.toLowerCase() === 'subjectcode'),
    nameTh: cols.findIndex(c => c.toLowerCase() === 'subjectnameth'),
    nameEn: cols.findIndex(c => c.toLowerCase() === 'subjectnameen'),
    credit: cols.findIndex(c => c.toLowerCase() === 'credit'),
    theory: cols.findIndex(c => c.toLowerCase() === 'credittheory'),
    practice: cols.findIndex(c => c.toLowerCase() === 'creditpractice'),
    year: cols.findIndex(c => c.toLowerCase().includes('curriculu') || c.toLowerCase() === 'createyear'),
    type: cols.findIndex(c => c.toLowerCase() === 'subjecttype'),
  };

  // State machine to parse tuples
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
          const key = `${code}-${name}`;
          if (!seen.has(key)) {
            seen.add(key);
            courses.push({
              id: `crs-${courses.length + 1}`,
              code,
              name,
              nameEn: currentTuple[colIdx.nameEn] || '',
              credits: parseFloat(currentTuple[colIdx.credit]) || 0,
              theory: parseFloat(currentTuple[colIdx.theory]) || 0,
              practice: parseFloat(currentTuple[colIdx.practice]) || 0,
              curriculumYear: currentTuple[colIdx.year] || '',
              subjectType: currentTuple[colIdx.type] || '',
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
  if (trimmed.startsWith('INSERT INTO `tb_course`')) {
    const colMatch = trimmed.match(/INSERT INTO `tb_course` \(([^)]+)\)/i);
    if (colMatch) {
      insertColumns = colMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
    }
    currentInsert = trimmed;
  } else if (currentInsert) {
    currentInsert += ' ' + trimmed;
  }

  if (currentInsert && trimmed.endsWith(';')) {
    const valIdx = currentInsert.indexOf('VALUES');
    if (valIdx !== -1) {
      const vals = currentInsert.slice(valIdx + 6).trim().replace(/;$/, '');
      parseValues(vals, insertColumns);
    }
    currentInsert = '';
  }
});

rl.on('close', () => {
  console.timeEnd('parse');
  console.log(`Parsed ${totalRows} total rows, ${courses.length} unique courses.`);
  console.log('Sample course #1:', courses[0]);
  console.log('Sample course #100:', courses[100]);
});
