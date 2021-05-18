const IndexFile = require('../lib/index-file');

const WNdb = require('wndb-with-exceptions')

describe('IndexFile', () => {

  it('should instantiate', () => {
    const file = new IndexFile(WNdb.path, 'noun');
    expect(file).toBeDefined();
  });

  it('should open and close', () => {
    const file = new IndexFile(WNdb.path, 'noun');
    return file.open()
      .then(() => file.close());
  });

  it('should read a line', () => {
    const buffer = Buffer.alloc(1024);
    const file = new IndexFile(WNdb.path, 'noun');
    return file.open()
      .then(() => file.appendLineChar(file._fd, 2393326, 0, buffer))
      .then((data) => {
        expect(data).toEqual("judgement_day n 1 2 @ ; 1 1 15171307  ");
      })
      .then(() => file.close());
  });

  it('should find a matching index record', () => {
    const file = new IndexFile(WNdb.path, 'noun');
    return file.open()
      .then(() => new Promise((resolve, reject) => {
        file.find("witch", (err, data) => {
          expect(err).not.toBeTruthy();
          expect(data).toHaveProperty('status', 'hit');
          expect(data).toHaveProperty('key', 'witch');
          expect(data).toHaveProperty('tokens', 
            ['witch','n','4','4','@','~','#m','+','4','2','10055297','09503282','10780105','10155485','']
          );
          resolve();
        })
      }))
      .finally(() => file.close());
  });

});
