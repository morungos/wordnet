const async = require('async');

const Wordnet = require('../lib/wordnet');

describe('wordnet', () => {

  let wordnet = undefined;

  beforeEach(() => {
    wordnet = new Wordnet();
  });

  afterEach(() => {
    wordnet.close();
  });

  describe('get', () => {

    it('should succeed', () => {
      return wordnet.get(3827107, 'n')
        .then((result) => {
          expect(result).toHaveProperty('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        });
    });

    it('should fail with an error', () => {
      const result = wordnet.get(3827108, 'n');
      return expect(result).rejects.toThrow(/Invalid synsetOffset/);
    });
    
  });



  describe('lookup', () => {

    it('should succeed for node', (done) => wordnet.lookup('node', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(8);
      expect(results).toHaveProperty('0.synsetOffset', 3827107);
      done();
    }));

    it('should succeed for test', (done) => wordnet.lookup('test', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(13);
      done();
    }));

    //# Test for #16
    it('should succeed for nested callbacks', (done) => wordnet.lookup('node', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(8);
      return wordnet.lookup('test', (results) => {
        expect(results).toBeDefined();
        expect(results).toBeInstanceOf(Array);
        expect(results).toHaveLength(13);
        done();
      });
    }));

    it('should succeed for node', (done) => wordnet.lookup('node', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveProperty('0.synsetOffset', 3827107);
      done();
    }));

    it('should succeed for node with a two-argument callback', (done) => wordnet.lookup('node', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveProperty('0.synsetOffset', 3827107);
      done();
    }));

    it('should succeed for lie#v', (done) => wordnet.lookup('lie#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(7);
      done();
    }));

    it('should succeed for words with odd glosses, e.g., in#r', (done) => wordnet.lookup('in#r', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(1);
      done();
    }));

    it('should succeed for alter#v', (done) => wordnet.lookup('alter#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(5);
      done();
    }));

    it('should succeed for alte#r', (done) => wordnet.lookup('alte#r', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(0);
      done();
    }));
  });


  describe('lookupAsync', () => {

    it('should succeed for node', () => {
      return wordnet.lookupAsync('node')
        .then((result) => {
          expect(result).toHaveProperty('0.synsetOffset', 3827107);
        });
    });

    it('should succeed for lie#v', () => {
      return wordnet.lookupAsync('lie#v')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(7);
        });
    });

    it('should succeed for words with odd glosses, e.g., in#r', () => {
      return wordnet.lookupAsync('in#r')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(1);
        });
    });
  });


  describe('querySense', () => {
    it('should succeed for node', (done) => wordnet.querySense('node', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(8);
      done();
    }));

    it('should succeed for node with two-argument callback', (done) => wordnet.querySense('node', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(8);
      done();
    }));

    it('should succeed for ghostly#a', (done) => wordnet.querySense('ghostly#a', (results) => {
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(1);
      expect(results).toEqual(['ghostly#a#1']);
      done();
    }));
  });


  describe('querySenseAsync', () => {
    it('should succeed for node', () => {
      return wordnet.querySenseAsync('node')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(8);    
        })
    });

    it('should succeed for ghostly#a', () => {
      return wordnet.querySenseAsync('ghostly#a')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(1);    
          expect(result).toEqual(['ghostly#a#1']);
        });
    });
  });


  describe('findSense', () => {

    it('should succeed for lie#v#1', (done) => wordnet.findSense('lie#v#1', (results) => {
      expect(results).toBeDefined();
      expect(results).toHaveProperty('lemma', 'lie_down');
      expect(results).toHaveProperty('pos', 'v');
      done();
    }));

    it('should succeed for lie#v#1 with a two-argument callback', (done) => wordnet.findSense('lie#v#1', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toHaveProperty('lemma', 'lie_down');
      expect(results).toHaveProperty('pos', 'v');
      done();
    }));
  });


  describe('findSenseAsync', () => {
    it('should succeed for lie#v#1', () => {
      return wordnet.findSenseAsync('lie#v#1')
        .then((results) => {
          expect(results).toHaveProperty('lemma', 'lie_down');
        });
    });
  });


  describe('validForms', () => {

    it('should succeed for axes#n', (done) => wordnet.validForms('axes#n', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['ax#n', 'axis#n']);
      done();
    }));

    it('should succeed for axes#n with a two-argument callback', (done) => wordnet.validForms('axes#n', (err, results) => {
      expect(results).toBeDefined();
      expect(err).not.toBeTruthy();
      expect(results).toEqual(['ax#n', 'axis#n']);
      done();
    }));

    it('should succeed for dissatisfied#v', (done) => wordnet.validForms('dissatisfied#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['dissatisfy#v']);
      done();
    }));

    it('should succeed for testing#v', (done) => wordnet.validForms('testing#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['test#v']);
      done();
    }));

    it('should succeed for checked#v', (done) => wordnet.validForms('checked#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['check#v']);
      done();
    }));

    it('should succeed for ghostliest#a', (done) => wordnet.validForms('ghostliest#a', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['ghostly#a']);
      done();
    }));

    it('should succeed for farther#r', (done) => wordnet.validForms('farther#r', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['farther#r', 'far#r']);
      done();
    }));

    it('should succeed for find#v', (done) => wordnet.validForms('find#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['find#v']);
      done();
    }));

    it('should succeed for are#v', (done) => wordnet.validForms('are#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['be#v']);
      done();
    }));

    it('should succeed for repeated queries', (done) => wordnet.validForms('find#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['find#v']);
      return wordnet.validForms('farther#r', (results) => {
        expect(results).toBeDefined();
        expect(results).toEqual(['farther#r', 'far#r']);
        done();
      });
    }));

    //# Tests for #5
    it('should succeed for fought#v', (done) => wordnet.validForms('fought#v', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['fight#v']);
      done();
    }));

    //# Tests for #5
    it('should succeed for fought', (done) => wordnet.validForms('fought', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['fight#v']);
      done();
    }));

    //# Tests for #6
    it('should succeed for alter', (done) => wordnet.validForms('alter', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['alter#v']);
      done();
    }));

    //# Tests for #10
    it('should succeed for fought_', (done) => wordnet.validForms('fought_', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual([]);
      done();
    }));

    //# Tests for #10
    it('should succeed for red_squirrel', (done) => wordnet.validForms('red_squirrel', (results) => {
      expect(results).toBeDefined();
      expect(results).toEqual(['red_squirrel#n']);
      done();
    }));

    it('should succeed for a set of queries pushed asynchronously', (done) => {
      const query = (item, callback) => wordnet.validForms(item, results => callback(null, results));

      async.map(['be#v', 'are#v'], query, (err, results) => {
        expect(results).toBeDefined();
        expect(results).toEqual([['be#v'], ['be#v']]);
        done();
      });
    });
  });


  describe('validFormsAsync', () => {

    it('should succeed for axes#n', () => {
      return wordnet.validFormsAsync('axes#n')
        .then((results) => {
          expect(results).toEqual(['ax#n', 'axis#n'])
        });
    });

    it('should succeed for dissatisfied#v', () => {
      return wordnet.validFormsAsync('dissatisfied#v')
        .then((results) => {
          expect(results).toEqual(['dissatisfy#v'])
        });
    });

    it('should succeed for testing#v', () => {
      return wordnet.validFormsAsync('testing#v')
        .then((results) => {
          expect(results).toEqual(['test#v'])
        });
    });

    it('should succeed for checked#v', () => {
      return wordnet.validFormsAsync('checked#v')
        .then((results) => {
          expect(results).toEqual(['check#v'])
        });
    });

    it('should succeed for ghostliest#a', () => {
      return wordnet.validFormsAsync('ghostliest#a')
        .then((results) => {
          expect(results).toEqual(['ghostly#a'])
        });
    });

    it('should succeed for farther#r', () => {
      return wordnet.validFormsAsync('farther#r')
        .then((results) => {
          expect(results).toEqual(['farther#r', 'far#r'])
        });
    });
  });

});
