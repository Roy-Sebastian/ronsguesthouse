"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAddOnLogLine = exports.extractAddOnLines = exports.appendLine = void 0;
const appendLine = (source, line) => {
    const cleanSource = String(source || '').trim();
    const cleanLine = String(line || '').trim();
    if (!cleanLine)
        return cleanSource;
    return cleanSource ? `${cleanSource}\n${cleanLine}` : cleanLine;
};
exports.appendLine = appendLine;
const extractAddOnLines = (source) => {
    return String(source || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('[ADDON]'));
};
exports.extractAddOnLines = extractAddOnLines;
const buildAddOnLogLine = ({ addOnName, quantity, totalPrice, notes, timestamp, }) => {
    const when = (timestamp || new Date()).toISOString();
    const notePart = notes && notes.trim() ? ` | ${notes.trim()}` : '';
    return `[ADDON] ${when} | ${addOnName} x${quantity} | Rp ${totalPrice}${notePart}`;
};
exports.buildAddOnLogLine = buildAddOnLogLine;
