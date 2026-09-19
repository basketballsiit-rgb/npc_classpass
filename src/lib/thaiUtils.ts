/**
 * Thai Unicode Sanitizer & PUA (Private Use Area) Normalizer
 * 
 * Solves the issue where legacy Thai fonts (Windows-874, MacThai, Angsana, Cordia,
 * older Ministry of Education / ศธ.02 / FoxPro / Clipper systems) encode upper/lower
 * vowels and tone marks as PUA codepoints (U+F700-U+F71A, U+F884-U+F89E).
 * 
 * In modern web browsers and fonts (like Sarabun, Inter, Arial), these PUA characters
 * have no glyph and display as square boxes / tofu (e.g. "กรวิชญ[] นิลคง", "มูลอ[]อน").
 */

const THAI_PUA_MAP: Record<string, string> = {
  // Windows-874 / Legacy UPC Thai PUA
  '\uF700': '\u0E10', // ฐ ไม่มีเชิง (Tho Than descender-less)
  '\uF701': '\u0E48', // ไม้เอก บน (Mai Ek high)
  '\uF702': '\u0E49', // ไม้โท บน (Mai Tho high)
  '\uF703': '\u0E4A', // ไม้ตรี บน (Mai Tri high)
  '\uF704': '\u0E4B', // ไม้จัตวา บน (Mai Chattawa high)
  '\uF705': '\u0E48', // ไม้เอก เลื่อนซ้าย (หลบหาง ป, ฝ, ฟ, ฬ)
  '\uF706': '\u0E49', // ไม้โท เลื่อนซ้าย
  '\uF707': '\u0E4A', // ไม้ตรี เลื่อนซ้าย
  '\uF708': '\u0E4B', // ไม้จัตวา เลื่อนซ้าย
  '\uF709': '\u0E4C', // ทัณฑฆาต/การันต์ เลื่อนซ้าย
  '\uF70A': '\u0E48', // ไม้เอก ระดับต่ำ (ไม่มีสระบน เช่น "มูลอ่อน" -> "มูลอ[]อน")
  '\uF70B': '\u0E49', // ไม้โท ระดับต่ำ
  '\uF70C': '\u0E4A', // ไม้ตรี ระดับต่ำ
  '\uF70D': '\u0E4B', // ไม้จัตวา ระดับต่ำ
  '\uF70E': '\u0E4C', // ทัณฑฆาต/การันต์ ระดับต่ำ (เช่น "กรวิชญ์" -> "กรวิชญ[]")
  '\uF70F': '\u0E0D', // ญ ไม่มีเชิง (Yo Ying descender-less)
  '\uF710': '\u0E34', // สระอิ เลื่อนซ้าย
  '\uF711': '\u0E35', // สระอี เลื่อนซ้าย
  '\uF712': '\u0E36', // สระอึ เลื่อนซ้าย
  '\uF713': '\u0E37', // สระอือ เลื่อนซ้าย
  '\uF714': '\u0E4C', // ทัณฑฆาต/การันต์ เลื่อนซ้าย
  '\uF715': '\u0E4D', // นฤคหิต เลื่อนซ้าย
  '\uF716': '\u0E47', // ไม้ไต่คู้ เลื่อนซ้าย
  '\uF717': '\u0E48', // ไม้เอก เลื่อนซ้ายระดับต่ำ
  '\uF718': '\u0E38', // สระอุ เลื่อนลง
  '\uF719': '\u0E39', // สระอู เลื่อนลง
  '\uF71A': '\u0E3A', // พินทุ เลื่อนลง

  // Apple MacThai / Adobe Thai PUA Range (U+F884 - U+F89E)
  '\uF884': '\u0E48',
  '\uF885': '\u0E49',
  '\uF886': '\u0E4A',
  '\uF887': '\u0E4B',
  '\uF888': '\u0E4C',
  '\uF889': '\u0E48',
  '\uF88A': '\u0E49',
  '\uF88B': '\u0E4A',
  '\uF88C': '\u0E4B',
  '\uF88D': '\u0E4C',
  '\uF88E': '\u0E48',
  '\uF88F': '\u0E49',
  '\uF890': '\u0E4A',
  '\uF891': '\u0E4B',
  '\uF892': '\u0E4C',
  '\uF893': '\u0E34',
  '\uF894': '\u0E35',
  '\uF895': '\u0E36',
  '\uF896': '\u0E37',
  '\uF897': '\u0E47',
  '\uF898': '\u0E4D',
  '\uF899': '\u0E10',
  '\uF89A': '\u0E0D',
  '\uF89B': '\u0E38',
  '\uF89C': '\u0E39',
  '\uF89D': '\u0E3A',
  '\uF89E': '\u0E4E',
};

/**
 * Cleans and normalizes Thai text string by:
 * 1. Mapping legacy PUA glyphs (Windows-874 / MacThai) back to standard Thai Unicode
 * 2. Swapping misplaced tone marks before upper vowels: [Tone][AboveVowel] -> [AboveVowel][Tone]
 * 3. Removing duplicate combining tone marks/vowels
 * 4. Stripping BOM, zero-width spaces, and replacement character (\uFFFD)
 * 5. Applying Unicode NFC normalization
 */
export function cleanThaiText(input: any): string {
  if (input === null || input === undefined) return '';
  let text = String(input);

  // 1. Replace legacy PUA codepoints
  text = text.replace(/[\uF700-\uF71A\uF884-\uF89E]/g, (ch) => THAI_PUA_MAP[ch] || ch);

  // 2. Reorder misplaced tone marks typed before above vowels: [Tone][AboveVowel] -> [AboveVowel][Tone]
  text = text.replace(/([่้๊๋์])([ัิีึื็ํ])/g, '$2$1');

  // 3. Remove duplicate tone marks and vowels
  text = text.replace(/([่้๊๋์]){2,}/g, '$1');
  text = text.replace(/([ะัาำิีึืุูเแโใไ]){2,}/g, '$1');

  // 4. Strip invisible control artifacts (BOM, zero-width space, replacement character)
  text = text.replace(/[\uFEFF\u200B\u200C\u200D\uFFFD]/g, '');

  // 5. Canonical Unicode Normalization (NFC)
  return text.normalize('NFC').trim();
}
