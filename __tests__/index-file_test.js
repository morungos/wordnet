const IndexFile = require('../lib/index-file');

const WNdb = require('wndb-with-exceptions')

describe('IndexFile', () => {

  let file;

  beforeAll(() => {
    file = new IndexFile(WNdb.path, 'noun');
    return file.open();
  });

  afterAll(() => {
    return file.close();
  });

  it('should read a line', () => {
    const buffer = Buffer.alloc(1024);
    return file.appendLineChar(file._fd, 2393326, 0, buffer)
      .then((data) => {
        expect(data).toEqual("judgement_day n 1 2 @ ; 1 1 15171307  ");
      });
  });

  it('should lookup a word', () => {
    return file.lookup("witch")
      .then((data) => {
        expect(data).toHaveProperty('lemma', 'witch');
        expect(data).toHaveProperty('pos', 'n');
        expect(data).toHaveProperty('synsetOffset', [ 10055297, 9503282, 10780105, 10155485 ]);
      });
  });

  it('should fail to lookup a non-word', () => {
    return file.lookup("witchz")
      .then((data) => {
        expect(data).toBe(null);
      });
  });

});
