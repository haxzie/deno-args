import {
  assertEquals,
  path,
  fs,
  dirname
} from '../deps.ts'

import args from '../../lib/wrapper.ts'
import { Flag, CountFlag, Option, PartialOption } from '../../lib/flag-types.ts'
import { FiniteNumber, Integer, Text, Choice } from '../../lib/value-types.ts'

const __dirname = dirname(import.meta)

const setup = () => args
  .describe('Top level command')
  .with(Flag('foo', {
    alias: ['f'],
    describe: 'Boolean flag of foo'
  }))
  .with(Flag('bar'))
  .with(CountFlag('count', {
    alias: ['c'],
    describe: 'Counting'
  }))
  .with(Option('number', {
    alias: ['N'],
    type: FiniteNumber,
    describe: 'An integer or a floating-point number'
  }))
  .with(Option('integer', {
    type: Integer,
    describe: 'An arbitrary large integer'
  }))
  .with(Option('text', {
    type: Text
  }))
  .with(PartialOption('partial-integer', {
    type: Integer,
    describe: 'An optional integer',
    default: BigInt('123')
  }))
  .with(Option('choice', {
    type: Choice<123 | 'foo' | 456 | 'bar' | '789'>(
      { value: 123 },
      { value: 'foo' },
      { value: 456, describe: 'Not 123' },
      { value: 'bar', describe: 'Not Foo' },
      { value: '789', describe: 'Not a number' }
    ),
    describe: 'Choice to make'
  }))
  .sub('sub0', args
    .describe('Sub command without flags')
  )
  .sub('sub1', args
    .describe('Sub command with one flag')
    .with(Flag('test', {
      describe: 'Test flag for sub1'
    }))
  )
  .sub('sub2', args
    .describe('Sub command with two flags')
    .with(Option('number', {
      type: FiniteNumber,
      describe: 'Number option for sub2'
    }))
    .with(Option('text', {
      type: Text,
      describe: 'Text option for sub2'
    }))
  )

function fmtStr (text: string): string {
  const middle = text
    .split('\n')
    .map(line => line.trim() ? line : '')
    .join('\n')
    .trim()
  return '\n' + middle + '\n'
}

Deno.test('help', async () => {
  const expected = await fs.readFileStr(path.join(__dirname, './mixed-help.txt'))
  const received = setup().help()
  assertEquals(fmtStr(received), fmtStr(expected))
})
