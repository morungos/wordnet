const DataFile = require('../lib/data-file');

const WNdb = require('wndb-with-exceptions')

describe('DataFile', () => {

  it('should instantiate', () => {
    const file = new DataFile(WNdb.path, 'noun');
    expect(file).toBeDefined();
  });

  it('should open and close', () => {
    const file = new DataFile(WNdb.path, 'noun');
    return file.open()
      .then(() => file.close());
  });

  it('should retrieve', () => {
    const file = new DataFile(WNdb.path, 'noun');
    return file.open()
      .then(() => file.get(3827107, (err, data) => {
        expect(err).not.toBeTruthy();
        expect(data).toHaveProperty('synsetOffset', 3827107);
        expect(data).toHaveProperty('synonyms', [ 'node', 'client', 'guest' ]);
        expect(data).toHaveProperty('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      }))
      .finally(() => file.close());
  });

});
