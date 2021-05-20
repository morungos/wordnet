const Wordnet = require('../lib/wordnet');

describe('Wordnet constructor', () => {

  it('should create an instance', () => {
    const wordnet = new Wordnet();
    expect(wordnet).toBeInstanceOf(Wordnet);
  });

  it('should handle a passed path string', () => {
    const wordnet = new Wordnet('/usr/lib/xxxx');
    expect(wordnet).toBeInstanceOf(Wordnet);
    expect(wordnet.path).toEqual('/usr/lib/xxxx');
  });

  it('should handle a passed path as object firld', () => {
    const wordnet = new Wordnet({dataDir: '/usr/lib/xxxx'});
    expect(wordnet).toBeInstanceOf(Wordnet);
    expect(wordnet.path).toEqual('/usr/lib/xxxx');
  });

  it('should handle a passed cache instance', () => {
    const cache = {get: jest.fn()};
    const wordnet = new Wordnet({cache: cache});
    expect(wordnet).toBeInstanceOf(Wordnet);
    expect(wordnet._cache).toBe(cache);
  });

});

describe('Wordnet methods', () => {

  let wordnet;

  beforeAll(() => {
    wordnet = new Wordnet();
    return wordnet.open();
  });

  afterAll(() => {
    return wordnet.close();
  });

  describe('get()', () => {

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


  describe('lookup()', () => {

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


  describe('querySense()', () => {
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


  describe('findSense()', () => {

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

  const validForms = [
    ['axes#n', ['ax#n', 'axis#n']],
    ['leeches#n', ['leech#n']],
    ['humen#n', ['human#n']],
    ['boxes#n', ['box#n']],
    ['bosses#n', ['boss#n']],
    ['hazes#n', ['haze#n']],
    ['brushes#n', ['brush#n']],
    ['tallies#n', ['tally#n']],
    ['red_squirrel', ['red_squirrel#n']],  // See #10

    ['dissatisfied#v', ['dissatisfy#v']],
    ['testing#v', ['test#v']],
    ['checked#v', ['check#v']],
    ['find#v', ['find#v']],
    ['fights#v', ['fight#v']],
    ['carries#v', ['carry#v']],
    ['are#v', ['be#v']],
    ['fought', ['fight#v']],               // See #5
    ['alter', ['alter#v']],                // See #6
    ['fought_', []],                       // See #10

    ['ghostliest#a', ['ghostly#a']],

    ['farther#r', ['farther#r', 'far#r']],
    ['highest#r', ['high#r']],
  ];


  describe('validForms()', () => {

    test.each(validForms)('should succeed for %s', (form, values) => {
      return wordnet.validForms(form)
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual(values);    
        });
    });
    
  });

  describe('validForms()', () => {

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

    it('should succeed for a set of queries pushed asynchronously', () => {
      return Promise.all(['be#v', 'are#v'].map((w) => wordnet.validForms(w)))
        .then((results) => {
          expect(results).toBeDefined();
          expect(results).toEqual([['be#v'], ['be#v']]);  
        })
    });

  });


  describe('getSynonyms()', () => {

    it('should find synonyms', () => {
      return wordnet.getSynonyms(3827107, 'n')
      .then((result) => {
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result).toHaveProperty("0.lemma", "computer");
        expect(result).toHaveProperty("1.lemma", "computer_network");
        expect(result).toHaveProperty("2.lemma", "computer_science");
      });
    });

  })

});
