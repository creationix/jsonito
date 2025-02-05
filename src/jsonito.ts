export interface JitoOptions {
  // Do a scan on the value and inject an outer scope to factor our common values.
  findDuplicates?: boolean
}

// Encode any arbitrary value as JSONito
export function stringify(val: unknown, options: JitoOptions = {}): string {
  if (options.findDuplicates) {
    throw new Error('findDuplicates is not implemented')
  }
  throw new Error('Not implemented')
}
