import {
  MAIN_COMMAND,
  UNKNOWN_COMMAND,
  inspect,
  __denoInspect
} from './symbols.ts'

import {
  ok,
  err,
  iterateArguments,
  partition
} from './utils.ts'

import {
  ArgumentExtractor,
  ParseResult,
  ArgvItem
} from './types.ts'

import {
  FlagError,
  UnknownFlags
} from './argument-errors.ts'

declare const __parseResult: unique symbol
type __parseResult = typeof __parseResult

const __parse = Symbol()
type __parse = typeof __parse

const __help = Symbol()
type __help = typeof __help

const __toString = Symbol()
type __toString = typeof __toString

type _ParseResult<
  Val,
  ErrArr extends readonly FlagError[] = readonly FlagError[]
> = ParseResult<{
  readonly value: Val
  readonly consumedArgs: ReadonlySet<ArgvItem>
}, ErrArr>

type TaggedVal<Tag, Val> = Val & Record<'_tag', Tag>

abstract class CommandBase<Val> {
  protected abstract [__parse] (args: ArgvItem[]): _ParseResult<Val>
  // protected abstract [__help] (): string
  // protected abstract [__toString] (): readonly string[]

  public and<NextVal> (
    next: Command<NextVal>
  ): Command<Val & NextVal> {
    return new Intersection(this, next)
  }

  public or<NextVal> (
    next: Command<NextVal>
  ): Command<Val | NextVal> {
    return new Union(this, next)
  }

  public with<NextName extends string, NextVal> (
    extractor: ArgumentExtractor<NextName, NextVal>
  ): Command<Val & Record<NextName, NextVal>> {
    return this.and(new ExtractorWrapper(extractor))
  }

  public subCommand<NextTag extends string, NextVal> (
    name: NextTag,
    define: (command: NamedSubCommand<NextTag>) => Command<TaggedVal<NextTag, NextVal>>
  ): Command<Val | TaggedVal<NextTag, NextVal>> {
    return this.or(new SubCommandWrapper(
      item => !item.isFlag && item.raw === name,
      define(new NamedSubCommand(name))
    ))
  }

  public unknownSubCommand<NextVal> (
    define: (command: UnknownSubCommand) => Command<TaggedVal<UNKNOWN_COMMAND, NextVal>>
  ): Command<Val | TaggedVal<UNKNOWN_COMMAND, NextVal>> {
    return this.or(new SubCommandWrapper(
      item => !item.isFlag,
      define(new UnknownSubCommand())
    ))
  }

  public parse (args: readonly string[]) {
    const result = this[__parse]([...iterateArguments(args)])
    if (!result.tag) return result
    return {
      value: result.value.value,
      consumedArgs: result.value.consumedArgs,
      tag: true
    } as const
  }
}

const __combine = Symbol()
type __combine = typeof __combine
abstract class Combine<A, B, C> extends CommandBase<C> {
  protected readonly [__combine]: readonly [
    Command<A>,
    Command<B>
  ]

  constructor (
    a: Command<A>,
    b: Command<B>
  ) {
    super()
    this[__combine] = [a, b]
  }
}

class Intersection<A, B> extends Combine<A, B, A & B> {
  protected [__parse] (args: ArgvItem[]): _ParseResult<A & B> {
    const [A, B] = this[__combine]
    const a = A[__parse](args)
    const b = B[__parse](args)
    if (a.tag && b.tag) {
      const value = { ...a.value.value, ...b.value.value }
      const consumedArgs = new Set([...a.value.consumedArgs, ...b.value.consumedArgs])
      return ok({ value, consumedArgs })
    }
    return err([
      ...a.error || [],
      ...b.error || []
    ])
  }
}

class Union<A, B> extends Combine<A, B, A | B> {
  protected [__parse] (args: ArgvItem[]): _ParseResult<A | B> {
    const [A, B] = this[__combine]
    const b = B[__parse](args)
    if (b.tag) return b
    const a = A[__parse](args)
    if (a.tag) return a
    return err([...a.error, ...b.error])
  }
}

class ExtractorWrapper<Name extends string, Val> extends CommandBase<Record<Name, Val>> {
  constructor (
    private readonly _extractor: ArgumentExtractor<Name, Val>
  ) {
    super()
  }

  protected [__parse] (args: ArgvItem[]): _ParseResult<
    Record<Name, Val>,
    readonly [FlagError]
  > {
    const result = this._extractor.extract(args)
    if (!result.tag) return err([result.error])
    const value = {
      [this._extractor.name]: result.value.value
    } as Record<Name, Val>
    return ok({
      value,
      consumedArgs: result.value.consumedArgs
    })
  }
}

abstract class NamedCommand<Name>
extends CommandBase<Record<'_tag', Name>> {
  public abstract readonly name: Name
  protected [__parse] (): _ParseResult<Record<'_tag', Name>, never> {
    return ok({ value: { _tag: this.name }, consumedArgs: new Set() })
  }
}

class MainCommand extends NamedCommand<MAIN_COMMAND> {
  public readonly name: MAIN_COMMAND = MAIN_COMMAND
}

class NamedSubCommand<Name extends string> extends NamedCommand<Name> {
  constructor (
    public readonly name: Name
  ) {
    super()
  }
}

class UnknownSubCommand extends NamedCommand<UNKNOWN_COMMAND> {
  public readonly name: UNKNOWN_COMMAND = UNKNOWN_COMMAND
}

class SubCommandWrapper<Val> extends CommandBase<Val> {
  constructor (
    private readonly _isSubCommand: (item: ArgvItem) => boolean,
    private readonly _subCommand: Command<Val>
  ) {
    super()
  }

  public [__parse] (args: ArgvItem[]): _ParseResult<Val> {
    const [first, ...rest] = args
    if (!first) return err([]) // TODO: Define an error
    if (!this._isSubCommand(first)) return err([]) // TODO: Define sub command error
    const result = this._subCommand[__parse](rest)
    if (!result.tag) return result // TODO: Define an error wrapper
    const consumedArgs = new Set([first, ...result.value.consumedArgs])
    return ok({ value: result.value.value, consumedArgs })
  }
}

export interface Command<Val> extends CommandBase<Val> {}
export const Command = (): Command<Record<'_tag', MAIN_COMMAND>> => new MainCommand()
export default Command
