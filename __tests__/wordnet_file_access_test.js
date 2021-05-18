const Wordnet = require('../lib/wordnet');

describe('wordnet file access', () => {

  it('should close before being used', (done) => {
    const wordnet = new Wordnet();
    wordnet.close();
    done();
  });

  it('should close after being used', (done) => {
    const wordnet = new Wordnet();
    wordnet.get(3827107, 'n', (results) => {
      wordnet.close();
      done();
    });
  });

  it('should not be affected by spurious closes', (done) => {
    const wordnet = new Wordnet();
    wordnet.get(3827107, 'n', (results) => {
      wordnet.close();
      wordnet.close();
      wordnet.close();
      done();
    });
  });

  it('should silently re-open if needed', (done) => {
    const wordnet = new Wordnet();
    wordnet.get(3827107, 'n', (results) => {
      wordnet.close();
      wordnet.querySense('ghostly#a', (results) => {
        wordnet.close();
        done();
      });
    });
  });
});
