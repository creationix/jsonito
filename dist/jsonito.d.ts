export interface EncodeOptions {
  findDuplicates?: boolean
  dictionaries?: Record<string, unknown[]>
}
export interface DecodeOptions {
  dictionaries?: Record<string, unknown[]>
}
type Known = Map<unknown, number>
export declare function stringify(rootValue: unknown, options?: EncodeOptions): string
export declare function encodeB64(num: bigint): string
export declare function encodeSignedB64(num: bigint): string
export declare function splitDecimal(num: number): {
  base: number
  exp: number
}
export declare function writeDuplicates(rootVal: unknown, parts: string[], known: Known, willKnow: Set<unknown>): void
type Seen = unknown[] & {
  dictionaries: Record<string, unknown[]>
}
export declare function parse(jito: string, opts?: DecodeOptions): unknown
export declare function parseAny(
  jito: string,
  offset: number,
  seen: Seen,
): {
  value: unknown
  offset: number
}
export declare function skipWhitespace(str: string, offset: number): number
export declare function skipB64(str: string, offset: number): number
export declare function parseB64(jito: string, start: number, end: number): bigint
