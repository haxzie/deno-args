import parser from './parser.ts'

for (const args of [
  [
    '--choice', '123',
    '--text', 'This is Text',
    '--integer', '777',
    '--number', '57.3'
  ],

  [
    '--choice', 'foo',
    '--text', 'This is another piece of text',
    '--integer', '33',
    '--number', '57.3',
    '--foo',
    '--bar'
  ],

  [
    '--choice', '789',
    '--text', 'Text Text Text',
    '--integer', '22',
    '--number', '517.3',
    '--bar',
    'abc',
    'def',
    'ghi'
  ],

  [
    'aliases',
    '-fccc',
    '-N', '45.4',
    '--integer', '123',
    '--text', 'hello there',
    '--choice', '789'
  ],

  []
]) {
  console.log('args', args)
  const parsingResult = parser.parse(args)
  console.log('parser.parse(args)', parsingResult)
  if (parsingResult.tag) {
    console.log('  => value', parsingResult.value)
    for (const [key, value] of Object.entries(parsingResult.value)) {
      console.log('    =>', key, `(${nameType(value)})`, value)
    }
  } else {
    console.log('  => error', parsingResult.error)
  }
  console.log()
}

function nameType (value: unknown) {
  const typeName = typeof value
  if (typeName === 'object') {
    if (!value) return 'null' as const
    if (Array.isArray(value)) return 'array' as const
    return 'object' as const
  }
  return typeName
}
