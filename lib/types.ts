import { FlagError } from './flag-errors.ts'
import { ValueError } from './value-errors.ts'

export interface FlagType<Name extends string, Value> {
  readonly name: Name
  extract (args: readonly ArgvItem[]): ParseResult<{
    value: Value
    remainingArgs: readonly ArgvItem[]
  }, FlagError>
  help (): string
  readonly [Symbol.toStringTag]: string
}

export interface ValueType<Value, Raw extends readonly string[]> {
  extract (raw: Raw): ParseResult<Value, ValueError>
  getTypeName (): string
  help? (): string
  readonly [Symbol.toStringTag]: string
}

export type ParseResult<Value, Error extends ParseError> = ParseSuccess<Value> | ParseFailure<Error>

export interface ParseSuccess<Value> {
  readonly tag: true
  readonly value: Value
  readonly error?: null
}

export interface ParseFailure<Error extends ParseError> {
  readonly tag: false
  readonly value?: null
  readonly error: Error
}

export interface ParseError {
  toString (): string
}

export type ArgvItem = ArgvItem.Flag | ArgvItem.Value

export namespace ArgvItem {
  interface Base {
    readonly index: number
    readonly isFlag: boolean
    readonly raw: string
    readonly name?: string | null
  }

  export interface Flag extends Base {
    readonly isFlag: true
    readonly name: string
  }

  export interface Value extends Base {
    readonly isFlag: false
    readonly name?: null
  }
}
