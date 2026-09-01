export type ImportedResident = {
  firstName: string;
  lastName: string;
  fullName: string;
  address: string;
  email: string;
  phone?: string;
};

export type ResidentImportRow = ImportedResident & {
  rowNumber: number;
  status: "valid" | "existing" | "invalid";
  errors: string[];
};

const requiredHeaders = ["First Name", "Last Name", "Address", "Email"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  if (quoted) throw new Error("The CSV contains an unterminated quoted field.");
  return rows;
}

function value(record: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const result = record[normalizeHeader(key)]?.trim();
    if (result) return result;
  }
  return "";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function parseResidentCsv(csv: string, existingEmails: Set<string>): ResidentImportRow[] {
  const rows = parseCsv(csv);
  if (rows.length === 0) throw new Error("The CSV is empty.");

  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(normalizeHeader(header)));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(", ")}`);
  }

  const seenEmails = new Set<string>();
  return rows.slice(1).map((columns, index) => {
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, columns[columnIndex] ?? ""]));
    const firstName = value(record, "First Name", "FirstName");
    const lastName = value(record, "Last Name", "LastName");
    const address = value(record, "Address");
    const email = normalizeEmail(value(record, "Email", "Email Address"));
    const imported: ImportedResident = {
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(" "),
      address,
      email,
      phone: value(record, "Phone", "Phone Number") || undefined,
    };
    const errors: string[] = [];

    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!imported.address) errors.push("Address is required");
    if (!imported.email) errors.push("Email is required");
    else if (!emailPattern.test(imported.email)) errors.push("Email format is invalid");

    let status: ResidentImportRow["status"] = errors.length > 0 ? "invalid" : "valid";
    if (status === "valid" && existingEmails.has(email)) {
      status = "existing";
      errors.push("A resident with this email already exists");
    } else if (status === "valid" && seenEmails.has(email)) {
      status = "invalid";
      errors.push("Duplicate email in this CSV");
    }
    if (status === "valid") seenEmails.add(email);

    return { ...imported, rowNumber: index + 2, status, errors };
  });
}
