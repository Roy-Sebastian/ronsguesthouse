export type ParsedAddOn = {
  label: string;
  quantity: number | null;
  total: number | null;
  note: string | null;
};

export type ParsedIncomeDescription = {
  main: string;
  addOns: ParsedAddOn[];
};

const parseAddOnLine = (line: string): ParsedAddOn => {
  const normalized = line
    .replace(/^\[ADDON\]\s*/i, '')
    .replace(/^add[\s-]?on\s*[:|-]?\s*/i, '')
    .trim();

  const parts = normalized
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  const qtyMatch =
    normalized.match(/\bx\s*(\d+)\b/i) ||
    normalized.match(/\bqty\s*[:=]?\s*(\d+)\b/i);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : null;

  const nameCandidate =
    parts.find(
      (part) =>
        !/^\d{4}-\d{2}-\d{2}t/i.test(part) &&
        !/^rp\s?/i.test(part) &&
        !/^catatan\s*[:=]/i.test(part),
    ) || normalized;

  const label = nameCandidate
    .replace(/\bx\s*\d+\b/i, '')
    .replace(/\bqty\s*[:=]?\s*\d+\b/i, '')
    .replace(/\bfor booking\b.*$/i, '')
    .trim();

  const priceMatch =
    normalized.match(/\brp\s*([\d.,]+)/i) ||
    normalized.match(/\btotal\s*[:=]?\s*([\d.,]+)/i);
  const totalDigits = (priceMatch?.[1] || '').replace(/[^\d]/g, '');
  const total = totalDigits ? Number(totalDigits) : null;

  const noteMatch = normalized.match(/\bcatatan\s*[:=]\s*(.+)$/i);
  const noteFromParts =
    parts.length > 3 ? parts.slice(3).join(' | ').trim() : null;
  const note = noteMatch?.[1]?.trim() || noteFromParts || null;

  return {
    label: label || 'Add-On',
    quantity,
    total,
    note,
  };
};

export const parseIncomeDescription = (
  description?: string,
): ParsedIncomeDescription => {
  const raw = (description || '').trim();
  if (!raw) {
    return {
      main: 'Pendapatan',
      addOns: [],
    };
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const addOnLines = lines.filter(
    (line) => /^\[ADDON\]/i.test(line) || /^add[\s-]?on\b/i.test(line),
  );
  const addOns = addOnLines.map((line) => parseAddOnLine(line));

  const mainLines = lines.filter((line) => !addOnLines.includes(line));
  return {
    main: mainLines.join(' | ') || 'Pendapatan',
    addOns,
  };
};
