export function buildSelectQuery(params: {
  objectName: string;
  fields: string[];
  where?: string;
  limit?: number;
}): string {
  const { objectName, fields, where, limit = 20 } = params;

  if (!fields.length) {
    throw new Error("At least one field must be provided.");
  }

  const safeFields = fields.map((f) => f.trim()).filter(Boolean);

  let soql = `SELECT ${safeFields.join(", ")} FROM ${objectName}`;

  if (where?.trim()) {
    soql += ` WHERE ${where.trim()}`;
  }

  soql += ` LIMIT ${limit}`;

  return soql;
}
