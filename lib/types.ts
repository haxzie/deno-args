import { FlagError } from './flag-errors.ts'
import { ValueError } from './value-errors.ts'

/** Interface of a flag type */
export interface FlagType<Name extends string, Value> {
  /** Flag name */
  readonly name: Name

  /**
   * Extract value from a list of arguments
   * @param args List of arguments
   * @returns `Ok(result)` if succeed, `Err(error)` otherwise
   */
  extract (args: readonly ArgvItem[]): Result<{
    value: Value
    consumedFlags: ReadonlySet<ArgvItem>
  }, FlagError>

  /**
   * Create a `FlagHelp` to display in `help::help()` or `wrapper::help()`
   */
  help (): FlagHelp

  /** Class name */
  readonly [Symbol.toStringTag]: string
}

export interface FlagHelp {
  readonly title: string
  readonly description?: string
}

export interface ValueType<Value, Raw extends readonly string[]> {
  extract (raw: Raw): Result<Value, ValueError>
  getTypeName (): string
  help? (): string
  readonly [Symbol.toStringTag]: string
}

export type Result<Value, Error extends ParseError> = Ok<Value> | Err<Error>

export interface Ok<Value> {
  readonly tag: true
  readonly value: Value
  readonly error?: null
}

export interface Err<Error extends ParseError> {
  readonly tag: false
  readonly value?: null
  readonly error: Error
}

export interface ParseError {
  toString (): string
}

export type ArgvItem = ArgvItem.SingleFlag | ArgvItem.MultiFlag | ArgvItem.Value

export namespace ArgvItem {
  interface Base {
    readonly index: number
    readonly type: 'single-flag' | 'multi-flag' | 'value'
    readonly raw: string
    readonly name?: string | readonly string[] | null
  }

  export interface SingleFlag extends Base {
    readonly type: 'single-flag'
    readonly name: string
  }

  export interface MultiFlag extends Base {
    readonly type: 'multi-flag'
    readonly name: readonly string[]
  }

  export interface Value extends Base {
    readonly type: 'value'
    readonly name?: null
  }
}
