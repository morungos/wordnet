const Wordnet = require('../lib/wordnet');

describe('wordnet with cache enabled', () => {

  let wordnet = undefined;

  beforeEach(() => {
    wordnet = new Wordnet({cache: true});
  });

  describe('get', () => {
    it('should succeed', (done) => wordnet.get(3827107, 'n', (results) => {
      expect(results).toBeDefined();
      expect(results).toHaveProperty('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      return done();
    }));

    it('should succeed with a two-argument callback', (done) => wordnet.get(3827107, 'n', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toHaveProperty('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      return done();
    }));

    it('should return the exact same value for a second query', (done) => wordnet.get(3827107, 'n', (results) => {
      expect(results).toBeDefined();
      return wordnet.get(3827107, 'n', (results2) => {
        expect(results2).toBe(results);
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', (done) => wordnet.get(3827107, 'n', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      return wordnet.get(3827107, 'n', (err, results2) => {
        expect(results2).toBe(results);
        expect(err).not.toBeTruthy();
        return done();
      });
    }));
  });


  describe('lookup', () => {
    it('should succeed for node', done => wordnet.lookup('node', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveProperty('0.synsetOffset', 3827107);
      return done();
    }));

    it('should succeed for node with a two-argument callback', done => wordnet.lookup('node', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveProperty('0.synsetOffset', 3827107);
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.lookup('node', (results) => {
      expect(results).toBeDefined();
      return wordnet.lookup('node', (results2) => {
        expect(results2).toBe(results);
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.lookup('node', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      return wordnet.lookup('node', (err, results2) => {
        expect(results2).toBe(results);
        expect(err).not.toBeTruthy();
        return done();
      });
    }));
  });


  describe('findSense', () => {

    it('should succeed for lie#v#1', done => wordnet.findSense('lie#v#1', (results) => {
      expect(results).toBeDefined();
      expect(results).toHaveProperty('lemma', 'lie_down');
      expect(results).toHaveProperty('pos', 'v');
      return done();
    }));

    it('should succeed for lie#v#1 with a two-argument callback', done => wordnet.findSense('lie#v#1', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toHaveProperty('lemma', 'lie_down');
      expect(results).toHaveProperty('pos', 'v');
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.findSense('lie#v#1', (results) => {
      expect(results).toBeDefined();
      return wordnet.findSense('lie#v#1', function(results2) {
        expect(results2).toBe(results);
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.findSense('lie#v#1', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      return wordnet.findSense('lie#v#1', function(err, results2) {
        expect(err).not.toBeTruthy();
        expect(results2).toBe(results);
        return done();
      });
    }));
  });


  describe('querySense', () => {
    it('should succeed for node', done => wordnet.querySense('node', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(8);
      return done();
    }));

    it('should succeed for node with a two-argument callback', done => wordnet.querySense('node', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(8);
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.querySense('node', (results) => {
      expect(results).toBeDefined();
      return wordnet.querySense('node', (results2) => {
        expect(results2).toBe(results);
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.querySense('node', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      return wordnet.querySense('node', (err, results2) => {
        expect(results2).toBe(results);
        expect(err).not.toBeTruthy();
        return done();
      });
    }));
  });


  describe('validForms', () => {

    it('should succeed for axes#n', done => wordnet.validForms('axes#n', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['ax#n', 'axis#n']);
      return done();
    }));

    it('should succeed for axes#n with a two-argument callback', done => wordnet.validForms('axes#n', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toEqual(['ax#n', 'axis#n']);
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.validForms('axes#n', (results) => {
      expect(results).toBeDefined();
      return wordnet.validForms('axes#n', (results2) => {
        expect(results2).toBe(results);
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.validForms('axes#n', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      return wordnet.validForms('axes#n', (err, results2) => {
        expect(results2).toBe(results);
        expect(err).not.toBeTruthy();
        return done();
      });
    }));
  });
});
