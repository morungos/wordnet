const Wordnet = require('../lib/wordnet');

describe('wordnet', () => {

  let wordnet = undefined;

  beforeEach(() => {
    wordnet = new Wordnet();
    return wordnet.open();
  });

  afterEach(() => {
    return wordnet.close();
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


  describe('lookupFromFiles', () => {

    it('should succeed for node', () => {
      return wordnet.lookupFromFiles(wordnet.allFiles, 'node')
      .then((data) => {
        expect(data).toBeInstanceOf(Array)
        expect(data).toHaveLength(8);
        expect(data).toHaveProperty('0.synsetOffset', 13911045);
      });
    });

  })


  describe('lookup', () => {

    it('should succeed for node', () => {
      return wordnet.lookup('node')
        .then((result) => {
          expect(result).toBeDefined();
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(8);
          expect(result).toHaveProperty('0.synsetOffset', 13911045);
        });
    });

    it('should succeed for test', () => {
      return wordnet.lookup('test')
        .then((result) => {
          expect(result).toBeDefined();
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(13);
        });
    });

    it('should succeed for lie#v', () => {
      return wordnet.lookup('lie#v')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(7);
        });
    });

    it('should succeed for words with odd glosses, e.g., in#r', () => {
      return wordnet.lookup('in#r')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(1);
        });
    });

    it('should succeed for alter#v', () => {
      return wordnet.lookup('alter#v')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(5);
        });
    });

    it('should succeed for alte#r', () => {
      return wordnet.lookup('alte#r')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(0);
        });
    });

  });


  describe('querySense', () => {
    it('should succeed for node', () => {
      return wordnet.querySense('node')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(8);    
        })
    });

    it('should succeed for ghostly#a', () => {
      return wordnet.querySense('ghostly#a')
        .then((result) => {
          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(1);    
          expect(result).toEqual(['ghostly#a#1']);
        });
    });
  });


  describe('findSense', () => {

    it('should succeed for lie#v#7', () => {
      return wordnet.findSense('lie#v#7')
        .then((results) => {
          expect(results).toHaveProperty('lemma', 'lie_down');
          expect(results).toHaveProperty('pos', 'v');
        });
    });
  });


  describe("exceptions", () => {

    it('should load exceptions only when needed', () => {
      expect(wordnet).not.toHaveProperty('exceptions', expect.anything());
      const result = wordnet.loadExceptions();
      expect(result).toBeInstanceOf(Promise);
      expect(wordnet).toHaveProperty('exceptions', expect.any(Promise));
      return result
        .then((values) => {
          expect(values).toHaveProperty('r.deeper', ['deeply']);
          expect(wordnet).not.toHaveProperty('exceptions', expect.any(Promise));
          expect(wordnet).toHaveProperty('exceptions', expect.anything());
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
    })
    
    it('should succeed for dissatisfied#v', () => {
      return wordnet.validForms('dissatisfied#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['dissatisfy#v']);
        });
    })

    it('should succeed for testing#v', () => {
      return wordnet.validForms('testing#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['test#v']);
        })
    });

    it('should succeed for checked#v', () => {
      return wordnet.validForms('checked#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['check#v']);
        })
    });

    it('should succeed for ghostliest#a', () => {
      return wordnet.validForms('ghostliest#a')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['ghostly#a']);
        })
    });

    it('should succeed for farther#r', () => {
      return wordnet.validForms('farther#r')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['farther#r', 'far#r']);
        })
    });

    it('should succeed for find#v', () => {
      return wordnet.validForms('find#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['find#v']);
        })
    });

    it('should succeed for are#v', () => {
      return wordnet.validForms('are#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['be#v']);
        })
    });

    it('should succeed for repeated queries', () => {
      return wordnet.validForms('find#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['find#v']);
        })
        .then(() => wordnet.validForms('farther#r'))
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['farther#r', 'far#r']);
        });
    });

    // Tests for #5
    it('should succeed for fought#v', () => {
      return wordnet.validForms('fought#v')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['fight#v']);
        });
    });

    // Tests for #5
    it('should succeed for fought', () => {
      return wordnet.validForms('fought')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['fight#v']);
        });
    });

    // Tests for #6
    it('should succeed for alter', () => {
      return wordnet.validForms('alter')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['alter#v']);
        });
    });

    // Tests for #10
    it('should succeed for fought_', () => {
      return wordnet.validForms('fought_')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual([]);
        });
    });

    // Tests for #10
    it('should succeed for red_squirrel', () => {
      return wordnet.validForms('red_squirrel')
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(['red_squirrel#n']);
        });
    });

    it('should succeed for a set of queries pushed asynchronously', () => {
      return Promise.all(['be#v', 'are#v'].map((w) => wordnet.validForms(w)))
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual([['be#v'], ['be#v']]);  
        })
    });

  });

});
