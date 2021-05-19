const Wordnet = require('../lib/wordnet');

describe('wordnet with cache enabled', () => {

  let wordnet = undefined;

  beforeEach(() => {
    wordnet = new Wordnet({cache: true});
    return wordnet.open();
  });

  afterEach(() => {
    return wordnet.close();
  });

  describe('get', () => {
    it('should succeed', () => {
      return wordnet.get(3827107, 'n')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toHaveProperty('gloss', '(computer science) any computer that is hooked up to a computer network  ');
        });
    });

    /**
     * With caching enabled, a second request should never make it 
     * through any I/O parts. We can sort of track that.
     */
    it('should return the exact same value for a second query', () => {
      return wordnet.get(3827107, 'n')
        .then((results) => {
          expect(results).toBeDefined();
          return wordnet.get(3827107, 'n')
            .then((results2) => {
              expect(results2).toBe(results);
            })
        });
    });
  });


  describe('lookup', () => {

    it('should succeed for node',() => {
      return wordnet.lookup('node')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toBeInstanceOf(Array);
          expect(results).toHaveProperty('0.synsetOffset', 13911045);
        });
    });

    /**
     * With caching enabled, a second request should never make it 
     * through any I/O parts. We can sort of track that.
     */
    it('should return the exact same value for a second query',() => {
      return wordnet.lookup('node')
        .then((results) => {
          expect(results).toBeDefined();
          return wordnet.lookup('node')
            .then((results2) => {
              expect(results2).toBe(results);
            });
          });
    });

  });


  describe('findSense', () => {

    it('should succeed for lie#v#1', () => {
      return wordnet.findSense('lie#v#1')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toHaveProperty('lemma', 'lie');
          expect(results).toHaveProperty('pos', 'v');
        });
    });

    /**
     * With caching enabled, a second request should never make it 
     * through any I/O parts. We can sort of track that.
     */
    it('should return the exact same value for a second query', () => {
      return wordnet.findSense('lie#v#1')
        .then((results) => {
          expect(results).toBeDefined();
          return wordnet.findSense('lie#v#1')
            .then((results2) => {
              expect(results2).toBe(results);
            });
        });
    });

  });


  describe('querySense', () => {

    it('should succeed for node', () => {
      return wordnet.querySense('node')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toBeInstanceOf(Array);
          expect(results).toHaveLength(8);
        });
    });

    /**
     * With caching enabled, a second request should never make it 
     * through any I/O parts. We can sort of track that.
     */
    it('should return the exact same value for a second query', () => {
      return wordnet.querySense('node')
        .then((results) => {
          expect(results).toBeDefined();
          return wordnet.querySense('node')
            .then((results2) => {
              expect(results2).toBe(results);
            });
        });
    });

  });


  describe('validForms', () => {

    it('should succeed for axes#n', () => {
      return wordnet.validForms('axes#n')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['ax#n', 'axis#n']);
        });
    });

    /**
     * With caching enabled, a second request should never make it 
     * through any I/O parts. We can sort of track that.
     */
    it('should return the exact same value for a second query', () => {
      return wordnet.validForms('axes#n')
        .then((results) => {
          expect(results).toBeDefined();
          return wordnet.validForms('axes#n')
            .then((results2) => {
              expect(results2).toEqual(results);
            });
        });
    });

  });
});
