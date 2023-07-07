import { uniq } from './misc';
import { constructRecords, getSelectorMatches } from './scraping';

const SIMPLE_HTML_DOC = `
<!DOCTYPE html>
<html>
  <head>
    <title>Title</title>
    <body>
      <h1>Heading1</h1>
      <h2>Heading2</h2>
      <h3>Heading3</h3>
      <h4>Heading4</h4>
      <h5>Heading5</h5>
    </body>
  </head>
</html>
`;

const DUPLICATE_HEADINGS_HTML_DOC = `
<!DOCTYPE html>
<html>
  <head>
    <title>Title</title>
    <body>
      <h1>Heading1 a</h1>
      <h2>Heading2</h2>
      <h3>Heading3</h3>
      <h1>Heading1 b</h1>
      <h1>Heading1 c</h1>
      <h4>Heading4 a</h4>
      <h5>Heading5</h5>
      <h4>Heading4 b</h4>
      <h1>Heading1 d</h1>
      <h4>Heading4 c</h4>
    </body>
  </head>
</html>
`;

describe('utils/scraping', () => {
  beforeAll(async () => {
    await page.exposeFunction('uniq', uniq);
  });

  test('utils/scraping/getSelectorMatches - should match a page title', async () => {
    await page.setContent('<title>Foo</title>');
    const result = await page.evaluate(getSelectorMatches, {
      selectors: {
        l0: 'title'
      }
    });
    expect(result).toEqual({
      selectorMatches: ['Foo'],
      selectorMatchesByLevel: {
        l0: ['Foo']
      },
      title: 'Foo'
    });
  });

  test('utils/scraping/getSelectorMatches - should match selectors', async () => {
    await page.setContent(SIMPLE_HTML_DOC);
    const result = await page.evaluate(getSelectorMatches, {
      selectors: {
        l0: 'title',
        l1: 'h1',
        l2: 'h2',
        l3: 'h3',
        l4: 'h4'
      }
    });
    expect(result).toEqual({
      selectorMatches: [
        'Title',
        'Heading1',
        'Heading2',
        'Heading3',
        'Heading4'
      ],
      selectorMatchesByLevel: {
        l0: ['Title'],
        l1: ['Heading1'],
        l2: ['Heading2'],
        l3: ['Heading3'],
        l4: ['Heading4']
      },
      title: 'Title'
    });
  });

  test('utils/scraping/getSelectorMatches - should remove duplications', async () => {
    await page.setContent(SIMPLE_HTML_DOC);
    const result = await page.evaluate(getSelectorMatches, {
      selectors: {
        l0: 'title, h1',
        l1: 'h1',
        l2: 'h2, h3, h4',
        l3: 'h3',
        l4: 'h4'
      }
    });
    expect(result).toEqual({
      selectorMatches: [
        'Title',
        'Heading1',
        'Heading2',
        'Heading3',
        'Heading4'
      ],
      selectorMatchesByLevel: {
        l0: ['Title', 'Heading1'],
        l1: ['Heading1'],
        l2: ['Heading2', 'Heading3', 'Heading4'],
        l3: ['Heading3'],
        l4: ['Heading4']
      },
      title: 'Title'
    });
  });

  test('utils/scraping/getSelectorMatches - selector matches should be in document order', async () => {
    await page.setContent(DUPLICATE_HEADINGS_HTML_DOC);
    const result = await page.evaluate(getSelectorMatches, {
      selectors: {
        l0: 'title',
        l1: 'h1',
        l2: 'h2',
        l3: 'h3',
        l4: 'h4'
      }
    });
    expect(result).toEqual({
      selectorMatches: [
        'Title',
        'Heading1 a',
        'Heading2',
        'Heading3',
        'Heading1 b',
        'Heading1 c',
        'Heading4 a',
        'Heading4 b',
        'Heading1 d',
        'Heading4 c'
      ],
      selectorMatchesByLevel: {
        l0: ['Title'],
        l1: ['Heading1 a', 'Heading1 b', 'Heading1 c', 'Heading1 d'],
        l2: ['Heading2'],
        l3: ['Heading3'],
        l4: ['Heading4 a', 'Heading4 b', 'Heading4 c']
      },
      title: 'Title'
    });
  });

  test('utils/scraping/constructRecords', async () => {
    const records = constructRecords({
      selectorMatches: [
        'Title',
        'Heading1 a',
        'Heading2',
        'Heading3',
        'Heading1 b',
        'Heading1 c',
        'Heading4 a',
        'Heading4 b',
        'Heading1 d',
        'Heading4 c'
      ],
      selectorMatchesByLevel: {
        l0: ['Title'],
        l1: ['Heading1 a', 'Heading1 b', 'Heading1 c', 'Heading1 d'],
        l2: ['Heading2'],
        l3: ['Heading3'],
        l4: ['Heading4 a', 'Heading4 b', 'Heading4 c']
      },
      onlyContentLevel: false,
      url: 'www.google.com',
      title: 'test',
      metadata: {}
    });
    expect(records[0].content).toEqual('Title');
    expect(records[0].hierarchy).toEqual({
      l0: 'Title',
      l1: '',
      l2: '',
      l3: '',
      l4: '',
      content: ''
    });
    expect(records[1].content).toEqual('Heading1 a');
    expect(records[1].hierarchy).toEqual({
      l0: 'Title',
      l1: 'Heading1 a',
      l2: '',
      l3: '',
      l4: '',
      content: ''
    });
    expect(records[2].content).toEqual('Heading2');
    expect(records[2].hierarchy).toEqual({
      l0: 'Title',
      l1: 'Heading1 a',
      l2: 'Heading2',
      l3: '',
      l4: '',
      content: ''
    });
    expect(records[3].content).toEqual('Heading3');
    expect(records[3].hierarchy).toEqual({
      l0: 'Title',
      l1: 'Heading1 a',
      l2: 'Heading2',
      l3: 'Heading3',
      l4: '',
      content: ''
    });
    expect(records[4].content).toEqual('Heading1 b');
    expect(records[4].hierarchy).toEqual({
      l0: 'Title',
      l1: 'Heading1 b',
      l2: 'Heading2',
      l3: 'Heading3',
      l4: '',
      content: ''
    });
  });
});
