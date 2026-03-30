type BuildAddOnLogLineParams = {
  addOnName: string;
  quantity: number;
  totalPrice: number;
  notes?: string | null;
  timestamp?: Date;
};

export const appendLine = (
  source: string | null | undefined,
  line: string,
): string => {
  const cleanSource = String(source || '').trim();
  const cleanLine = String(line || '').trim();
  if (!cleanLine) return cleanSource;
  return cleanSource ? `${cleanSource}\n${cleanLine}` : cleanLine;
};

export const extractAddOnLines = (
  source: string | null | undefined,
): string[] => {
  return String(source || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('[ADDON]'));
};

export const buildAddOnLogLine = ({
  addOnName,
  quantity,
  totalPrice,
  notes,
  timestamp,
}: BuildAddOnLogLineParams): string => {
  const when = (timestamp || new Date()).toISOString();
  const notePart = notes && notes.trim() ? ` | ${notes.trim()}` : '';
  return `[ADDON] ${when} | ${addOnName} x${quantity} | Rp ${totalPrice}${notePart}`;
};
