const WordnetFile = require('../lib/wordnet-file');

const WNdb = require('wndb-with-exceptions')

describe('WordnetFile', () => {

  it('should instantiate', () => {
    const file = new WordnetFile(WNdb.path, 'index.noun');
    expect(file).toBeDefined();
  });

  it('should open and close', () => {
    const file = new WordnetFile(WNdb.path, 'index.noun');
    return file.open()
      .then(() => {
        return file.close();
      });
  });

  it('should allow opening more than once', () => {
    const file = new WordnetFile(WNdb.path, 'index.noun');
    return file.open()
      .then(() => file.open())
      .then(() => file.close());
  });

  it('should allow closing more than once', () => {
    const file = new WordnetFile(WNdb.path, 'index.noun');
    return file.open()
      .then(() => file.close())
      .then(() => file.close());
  });

  it('should set the size', () => {
    const file = new WordnetFile(WNdb.path, 'index.noun');
    return file.open()
      .then(() => {
        const size = file.size();
        expect(size).toBeGreaterThan(4500000);
        expect(size).toBeLessThan(5000000);
      })
      .finally(() => file.close())
  });
});
