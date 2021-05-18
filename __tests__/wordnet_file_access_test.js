const Wordnet = require('../lib/wordnet');

describe('wordnet file access', () => {

  it('should allow close before being used', () => {
    const wordnet = new Wordnet();
    return wordnet.close();
  });

  it('should close after being used', () => {
    const wordnet = new Wordnet();
    return wordnet.get(3827107, 'n')
      .then(() => wordnet.close());
  });

  it('should not be affected by spurious closes', () => {
    const wordnet = new Wordnet();
    return wordnet.get(3827107, 'n')
      .then(() => wordnet.close())
      .then(() => wordnet.close())
      .then(() => wordnet.close());
  });

  it('should silently re-open if needed', () => {
    const wordnet = new Wordnet();
    return wordnet.get(3827107, 'n')
      .then(() => wordnet.close())
      .then(() => wordnet.querySense('ghostly#a'))
      .then(() => wordnet.close());
  });
});
