import {
  ParseSuccess,
  ParseFailure,
  ParseError,
  ArgvItem
} from './types.ts'

export const ok = <Value> (value: Value): ParseSuccess<Value> => ({
  tag: true,
  value
})

export const err = <Error extends ParseError> (error: Error): ParseFailure<Error> => ({
  tag: false,
  error
})

export const flagPrefix = (name: string): '-' | '--' => name.length === 1 ? '-' : '--'
export const flag = (name: string) => flagPrefix(name) + name

export function * iterateArguments (args: readonly string[]) {
  let fn = (raw: string, index: number): ArgvItem[] => {
    if (raw === '--') {
      fn = (raw, index) => ([{ isFlag: false, index, raw }])
      return []
    }

    if (raw.startsWith('--')) {
      return [{
        isFlag: true,
        name: raw.slice('--'.length),
        index,
        raw
      }]
    }

    if (raw.startsWith('-') && isNaN(raw as any)) {
      return [...raw.slice('_'.length)].map(name => ({
        isFlag: true,
        name,
        index,
        raw
      }))
    }

    return [{
      isFlag: false,
      index,
      raw
    }]
  }

  for (let i = 0; i !== args.length; ++i) {
    yield * fn(args[i], i)
  }
}

export function partition<X> (xs: Iterable<X>, fn: (x: X) => boolean): [X[], X[]] {
  const left: X[] = []
  const right: X[] = []
  for (const x of xs) {
    (fn(x) ? left : right).push(x)
  }
  return [left, right]
}

const flagMapFn = (item: ArgvItem, index: number) => ({ ...item, index })

const flagPredicate = (names: readonly string[]) =>
  (item: ArgvItem) => item.isFlag && names.includes(item.name)

export const partitionFlags = (
  args: Iterable<ArgvItem>,
  names: readonly string[]
) => partition(
  [...args].map(flagMapFn),
  flagPredicate(names)
)

export const findFlags = (
  args: readonly ArgvItem[],
  names: readonly string[]
) => args
  .map(flagMapFn)
  .filter(flagPredicate(names))
