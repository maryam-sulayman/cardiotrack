// src/utils/text.ts
export const titleCaseName = (raw = '') =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => part.replace(/(^[a-z])|([-'][a-z])/g, s => s.toUpperCase()))
    .join(' ');
