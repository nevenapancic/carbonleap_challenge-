import * as XLSX from 'xlsx'

export type ParsedRow = Record<string, string>

export type ParseResult = {
  success: true
  data: ParsedRow[]
  headers: string[]
  format: 'csv' | 'json' | 'xlsx'
} | {
  success: false
  error: string
}

export type FileFormat = 'csv' | 'json' | 'xlsx' | 'unknown'

export function detectFileFormat(filename: string): FileFormat {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    case 'xlsx':
    case 'xls':
      return 'xlsx'
    default:
      return 'unknown'
  }
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

  return { success: true, data, headers, format: 'csv' }
}

export function parseJSON(content: string): ParseResult {
  try {
    const parsed = JSON.parse(content)

    // Handle array of objects
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return { success: false, error: 'JSON array is empty' }
      }

      // Get headers from the first object
      const firstRow = parsed[0]
      if (typeof firstRow !== 'object' || firstRow === null) {
        return { success: false, error: 'JSON array must contain objects' }
      }

      const headers = Object.keys(firstRow)

      const data: ParsedRow[] = parsed.map((item, index) => {
        if (typeof item !== 'object' || item === null) {
          throw new Error(`Row ${index + 1} is not an object`)
        }

        const row: ParsedRow = {}
        headers.forEach((header) => {
          const value = item[header]
          // Convert all values to strings for consistency
          if (value === null || value === undefined) {
            row[header] = ''
          } else if (typeof value === 'boolean') {
            row[header] = value ? 'true' : 'false'
          } else {
            row[header] = String(value)
          }
        })
        return row
      })

      return { success: true, data, headers, format: 'json' }
    }

    // Handle object with "data" or "certificates" array
    if (typeof parsed === 'object' && parsed !== null) {
      const dataArray = parsed.data || parsed.certificates || parsed.records || parsed.items
      if (Array.isArray(dataArray)) {
        return parseJSON(JSON.stringify(dataArray))
      }
    }

    return { success: false, error: 'JSON must be an array of objects or contain a "data"/"certificates" array' }
  } catch (e) {
    return { success: false, error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}` }
  }
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return { success: false, error: 'Excel file has no sheets' }
    }

    const worksheet = workbook.Sheets[firstSheetName]

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false, // Convert all values to strings
      defval: '' // Default value for empty cells
    })

    if (jsonData.length === 0) {
      return { success: false, error: 'Excel sheet is empty or has no data rows' }
    }

    // Get headers from the first row
    const headers = Object.keys(jsonData[0])

    // Convert to ParsedRow format (all string values)
    const data: ParsedRow[] = jsonData.map((row) => {
      const parsedRow: ParsedRow = {}
      headers.forEach((header) => {
        const value = row[header]
        if (value === null || value === undefined) {
          parsedRow[header] = ''
        } else if (typeof value === 'boolean') {
          parsedRow[header] = value ? 'true' : 'false'
        } else {
          parsedRow[header] = String(value)
        }
      })
      return parsedRow
    })

    return { success: true, data, headers, format: 'xlsx' }
  } catch (e) {
    return { success: false, error: `Failed to parse Excel file: ${e instanceof Error ? e.message : 'Unknown error'}` }
  }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const format = detectFileFormat(file.name)

  if (format === 'unknown') {
    return { success: false, error: 'Unsupported file format. Please upload CSV, JSON, or Excel (.xlsx) files.' }
  }

  try {
    if (format === 'csv' || format === 'json') {
      const content = await file.text()
      return format === 'csv' ? parseCSV(content) : parseJSON(content)
    } else {
      const buffer = await file.arrayBuffer()
      return parseExcel(buffer)
    }
  } catch (e) {
    return { success: false, error: `Failed to read file: ${e instanceof Error ? e.message : 'Unknown error'}` }
  }
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
