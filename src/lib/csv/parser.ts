export type ParsedRow = Record<string, string>

export type ParseResult = {
  success: true
  data: ParsedRow[]
  headers: string[]
} | {
  success: false
  error: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')

  if (lines.length < 2) {
    return { success: false, error: 'CSV must have a header row and at least one data row' }
  }

  const headers = parseCSVLine(lines[0])

  if (headers.length === 0) {
    return { success: false, error: 'No headers found in CSV' }
  }

  const data: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])

    if (values.length !== headers.length) {
      return {
        success: false,
        error: `Row ${i + 1} has ${values.length} columns, expected ${headers.length}`,
      }
    }

    const row: ParsedRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })

    data.push(row)
  }

  return { success: true, data, headers }
}

export function normalizeHeaders(row: ParsedRow): ParsedRow {
  const normalized: ParsedRow = {}

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = key
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    normalized[normalizedKey] = value
  })

  return normalized
}

export function transformBooleanField(value: string): boolean {
  const trueValues = ['true', '1', 'yes', 'ja', 'y']
  return trueValues.includes(value.toLowerCase())
}

export function transformEmptyToNull(row: ParsedRow): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  Object.entries(row).forEach(([key, value]) => {
    result[key] = value === '' ? null : value
  })
  return result
}
