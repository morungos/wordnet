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

});
