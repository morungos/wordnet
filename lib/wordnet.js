/*
 * decaffeinate suggestions:
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Copyright (c) 2011, Chris Umbel
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// Significant changes made by Stuart Watt, including:
// (1) - implementation of logic for morphological exceptions
// (2) - using sense offsets as per Perl implementations
// (3) - porting to CoffeeScript for easier validation and better array performance
// (4) - promisification of much of the API
// (5) - move to use wndb-with-exceptions instead of WNdb, to provide morphological exceptions
// (6) - significant improvements in testing

const IndexFile = require('./index_file');
const DataFile =  require('./data_file');

const async =     require('async');
const path =      require('path');
const fs =        require('fs');

const LRU =       require('lru-cache');

function unique(a) {
  const found = {};
  return a.filter((item) => {
    if (found[item]) {
      return false;
    } else {
      return found[item] = true;
    }
  });
}

function tokenDetach(string) {
  const [word, pos, sense] = string.split('#');

  const detach = [word];
  const { length } = word;

  switch (pos) {
    case 'n':
      if (word.endsWith("s")) { detach.push(word.substring(0, length - 1)); }
      if (word.endsWith("ses")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("xes")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("zes")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("ches")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("shes")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("men")) { detach.push(word.substring(0, length - 3) + "man"); }
      if (word.endsWith("ies")) { detach.push(word.substring(0, length - 3) + "y"); }
      break;

    case 'v':
      if (word.endsWith("s")) { detach.push(word.substring(0, length - 1)); }
      if (word.endsWith("ies")) { detach.push(word.substring(0, length - 3) + "y"); }
      if (word.endsWith("es")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("ed")) { detach.push(word.substring(0, length - 1)); }
      if (word.endsWith("ed")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("ing")) { detach.push(word.substring(0, length - 3) + "e"); }
      if (word.endsWith("ing")) { detach.push(word.substring(0, length - 3)); }
      break;

    case 'r':
      if (word.endsWith("er")) { detach.push(word.substring(0, length - 2)); }
      if (word.endsWith("er")) { detach.push(word.substring(0, length - 1)); }
      if (word.endsWith("est")) { detach.push(word.substring(0, length - 3)); }
      if (word.endsWith("est")) { detach.push(word.substring(0, length - 2)); }
      break;
  }

  return unique(detach);
}


// Exceptions aren't part of the node.js source, but they are needed to map some of
// the exceptions in derivations. Really, these should be loaded in the constructor, but
// sadly this code is asynchronous and we really don't want to force everything to
// block here. That's why a move to promises would be helpful, because all the dependent
// code is also going to be asynchronous and we can chain when we need to. For now, though,
// we'll handle it with callbacks when needed.

exceptions = [
  {name: "noun.exc", pos: 'n'},
  {name: "verb.exc", pos: 'v'},
  {name: "adj.exc", pos: 'a'},
  {name: "adv.exc", pos: 'r'},
];


function _loadExceptions(wordnet, callback) {
  
  // Flag while loading, so anyone who tries to use it can check and wait until the load
  // is complete, instead of multiple loads happening at once.
  WordNet.prototype.exceptions = 'pending';

  const loadFile = (exception, callback) => {
    const fullPath = path.join(wordnet.path, exception.name);
    fs.readFile(fullPath, (err, data) => {
      if (err) { 
        return callback(err); 
      }
      const temp = {};
      const lines = data.toString().split("\n");
      for (let line of lines) {
        if (line.length > 0) {
          const [term1, ...term2] = line.split(' ');
          if (temp[term1] == null) { temp[term1] = []; }
          Array.prototype.push.apply(temp[term1], term2);
        }
      }

      callback(null, {pos: exception.pos, data: temp});
    });
  };

  return async.map(exceptions, loadFile, (err, results) => {
    exceptions = {};
    for (let result of results) {
      exceptions[result.pos] = result.data;
    }
    WordNet.prototype.exceptions = exceptions;
    callback();
  });
};


function _forms(wordnet, word, pos) {
  const lword = word.toLowerCase();

  // First check to see if we have an exception set
  const exception = wordnet.exceptions[pos] != null ? wordnet.exceptions[pos][lword] : undefined;

  if (exception) { 
    return [word].concat(exception); 
  }

  const tokens = word.split(/[ _]/g);

  // If a single term, process using tokenDetach
  if (tokens.length === 1) {
    return tokenDetach(tokens[0] + "#" + pos);
  }

  // Otherwise, handle the forms recursively
  const forms = tokens.map(token => _forms(wordnet, token, pos));

  // Now generate all possible token sequences (collocations)
  const rtn = [];
  const index = (new Array(tokens.length)).fill(0);

  while (true) {
    let i;
    let asc, end;
    let colloc = forms[0][index[0]];
    for (i = 1, end = tokens.length - 1, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
      colloc = colloc + '_' + forms[i][index[i]];
    }
    rtn.push(colloc);

    i = 0;
    while (i < tokens.length) {
      index[i] = index[i] + 1;
      if (index[i] < forms[i].length) {
        break;
      } else {
        index[i] = 0;
      }

      i = i + 1;
    }

    if (i >= tokens.length) {
      break;
    }
  }

  return rtn;
};


function _validForms(wordnet, string, callback) {
  const [word, pos, sense] = string.split('#');

  if (!pos) {
    // No POS, so use a reduce to try them all and concatenate
    const reducer = (previous, current, next) => _validForms(wordnet, string + "#" + current, (err, value) => {
      if (value === undefined) {
        next(null, previous);
      } else {
        next(null, previous.concat(value));
      }
    });

    return async.reduce(['n', 'v', 'a', 'r'], [], reducer, (err, result) => callback(null, result));

  } else {

    const possibleForms = _forms(wordnet, word, pos).map((element) => element + "#" + pos);
    const filteredResults = [];

    const eachFn = (term, done) => wordnet.lookup(term, (err, data) => {
      if (err != null) {
        return done(err);
      }
      if (data.length > 0) { 
        filteredResults.push(term); 
      }
      return done();
    });

    return async.each(possibleForms, eachFn, (err) => callback(err, filteredResults));
  }
};


function _validFormsWithExceptions(wordnet, string, callback) {
  if (wordnet.exceptions === undefined) {
    _loadExceptions(wordnet, () => _validFormsWithExceptions(wordnet, string, callback));
  } else if (wordnet.exceptions === 'pending') {
    setImmediate(_validFormsWithExceptions, wordnet, string, callback);
  } else {
    _validForms(wordnet, string, callback);
  }
};



class WordNet {

  constructor(options) {

    // For compatibility, if the options are a string, it's just the Wordnet path
    if (typeof options === 'string') {
      options = {dataDir: options};
    } else {
      if (options == null) { 
        options = {}; 
      }
    }


    if ((options.dataDir == null)) {
      let WNdb;
      try {
        WNdb = require('wndb-with-exceptions');
      } catch (e) {
        console.error("Please 'npm install wndb-with-exceptions' before using WordNet module or specify a dict directory.");
        throw e;
      }
      options.dataDir = WNdb.path;
    }


    if (!options.cache) {
      this.cache = null;
    } else {
      if (options.cache === true) {
        options.cache = {
          max: 2000
        };
      }

      if ((typeof options.cache === 'object') && (typeof options.cache.get === 'function')) {
        this.cache = options.cache;
      } else {
        this.cache = LRU(options.cache);
      }
    }


    this.path = options.dataDir;

    this.nounIndex = new IndexFile(this.path, 'noun');
    this.verbIndex = new IndexFile(this.path, 'verb');
    this.adjIndex = new IndexFile(this.path, 'adj');
    this.advIndex = new IndexFile(this.path, 'adv');

    this.nounData = new DataFile(this.path, 'noun');
    this.verbData = new DataFile(this.path, 'verb');
    this.adjData = new DataFile(this.path, 'adj');
    this.advData = new DataFile(this.path, 'adv');

    this.allFiles = [
      {index: this.nounIndex, data: this.nounData, pos: 'n'},
      {index: this.verbIndex, data: this.verbData, pos: 'v'},
      {index: this.adjIndex, data: this.adjData, pos: 'a'},
      {index: this.advIndex, data: this.advData, pos: 'r'}
    ];
  }

  get(synsetOffset, pos, callback) {
    let query;

    if (this.cache) {
      let hit;
      query = `get:${synsetOffset}:${pos}`;
      if (hit = this.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(this, hit);
        } else {
          return callback.call(this, null, hit);
        }
      }
    }

    const dataFile = this.getDataFile(pos);
    dataFile.get(synsetOffset, (err, result) => {
      if (query && (err == null)) { 
        this.cache.set(query, result); 
      }
      if (callback.length === 1) {
        callback.call(this, result);
      } else {
        callback.call(this, err, result);
      }
    });
  }

  getAsync(synsetOffset, pos) {
    return new Promise((resolve, reject) => this.get(synsetOffset, pos, (err, data) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(data);
      }
    }));
  }


  lookup(input, callback) {
    let query;
    const [word, pos] = input.split('#');
    const lword = word.toLowerCase().replace(/\s+/g, '_');

    if (this.cache) {
      let hit;
      query = `lookup:${input}`;
      if (hit = this.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(this, hit);
        } else {
          return callback.call(this, null, hit);
        }
      }
    }

    const selectedFiles = !pos ? this.allFiles.slice() : this.allFiles.filter(file => file.pos === pos);
    this.lookupFromFiles(selectedFiles, [], lword, (err, results) => {
      if (err != null) { 
        return callback.call(this, err); 
      }
      if (query) { 
        this.cache.set(query, results); 
      }
      if (callback.length === 1) {
        callback.call(this, results);
      } else {
        callback.call(this, null, results);
      }
    });
  }

  lookupAsync(input) {
    return new Promise((resolve, reject) => this.lookup(input, (err, data) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(data);
      }
    }));
  }


  findSense(input, callback) {
    let query;
    const [word, pos, senseNumber] = input.split('#');

    if (this.cache) {
      let hit;
      query = `findSense:${input}`;
      if (hit = this.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(this, hit);
        } else {
          return callback.call(this, null, hit);
        }
      }
    }

    const sense = parseInt(senseNumber);
    if (Number.isNaN(sense)) {
      throw new Error("Sense number should be an integer");
    } else if (sense < 1) {
      throw new Error("Sense number should be a positive integer");
    }

    const lword = word.toLowerCase().replace(/\s+/g, '_');
    const selectedFiles = this.allFiles.filter(file => file.pos === pos);
    this.lookupFromFiles(selectedFiles, [], lword, (err, response) => {
      if (err != null) { 
        return callback.call(this, err); 
      }
      const result = response[sense - 1];
      if (query) { 
        this.cache.set(query, result); 
      }
      if (callback.length === 1) {
        callback.call(this, result);
      } else {
        callback.call(this, null, result);
      }
    });
  }

  findSenseAsync(input) {
    return new Promise((resolve, reject) => this.findSense(input, (err, data) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(data);
      }
    }));
  }


  querySense(input, callback) {
    let query;
    let [word, pos] = input.split('#');

    if (this.cache) {
      let hit;
      query = `querySense:${input}`;
      if (hit = this.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(this, hit);
        } else {
          return callback.call(this, null, hit);
        }
      }
    }

    this.lookup(input, (err, results) => {
      if (err != null) {
        return callback.call(this, err); 
      }
      const senseCounts = {};
      const senses = (() => {
        const result = [];
        for (let i = 0; i < results.length; i++) {
          const sense = results[i];
          ({
            pos
          } = sense);
          if (pos === 's') { pos = 'a'; }
          if (senseCounts[pos] == null) { senseCounts[pos] = 1; }
          result.push(word + "#" + pos + "#" + senseCounts[pos]++);
        }
        return result;
      })();

      if (query) { this.cache.set(query, senses); }
      if (callback.length === 1) {
        callback.call(this, senses);
      } else {
        callback.call(this, null, senses);
      }
    });
  }

  querySenseAsync(input) {
    return new Promise((resolve, reject) => this.querySense(input, (err, data) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(data);
      }
    }));
  }


  lookupFromFiles(files, results, word, callback) {

    if (files.length === 0) {
      return callback.call(this, null, results);
    } else {
      const file = files.pop();

      file.index.lookup(word, (err, record) => {
        if (record) {
          this.pushResults(file.data, results, record.synsetOffset, () => this.lookupFromFiles(files, results, word, callback));
        } else {
          this.lookupFromFiles(files, results, word, callback);
        }
      });
    }
  }


  pushResults(data, results, offsets, callback) {
    if (offsets.length === 0) {
      callback(results);
    } else {
      data.get(offsets.pop(), (err, record) => {
        results.push(record);
        this.pushResults(data, results, offsets, callback);
      });
    }
  }


  loadResultSynonyms(synonyms, results, callback) {
    if (results.length > 0) {
      const result = results.pop();
      this.loadSynonyms(synonyms, results, result.ptrs, callback);
    } else {
      callback(synonyms);
    }
  }


  loadSynonyms(synonyms, results, ptrs, callback) {
    if (ptrs.length > 0) {
      const ptr = ptrs.pop();

      this.get(ptr.synsetOffset, ptr.pos, (result) => {
        synonyms.push(result);
        this.loadSynonyms(synonyms, results, ptrs, callback);
      });
    } else {
      this.loadResultSynonyms(synonyms, results, callback);
    }
  }


  lookupSynonyms(word, callback) {
    this.lookup(word, (results) => this.loadResultSynonyms([], results, callback));
  }


  getSynonyms() {
    const callback = arguments[2] ? arguments[2] : arguments[1];
    const pos = arguments[0].pos ? arguments[0].pos : arguments[1];
    const synsetOffset = arguments[0].synsetOffset ? arguments[0].synsetOffset : arguments[0];
    this.get(synsetOffset, pos, result => this.loadSynonyms([], [], result.ptrs, callback));
  }


  getDataFile(pos) {
    switch (pos) {
      case 'n': return this.nounData;
      case 'v': return this.verbData;
      case 'a': case 's': return this.adjData;
      case 'r': return this.advData;
    }
  }


  close() {
    this.nounIndex.close();
    this.verbIndex.close();
    this.adjIndex.close();
    this.advIndex.close();

    this.nounData.close();
    this.verbData.close();
    this.adjData.close();
    this.advData.close();
  }


  validForms(string, callback) {
    let query;

    if (this.cache) {
      let hit;
      query = `validForms:${string}`;
      if (hit = this.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(this, hit);
        } else {
          return callback.call(this, null, hit);
        }
      }
    }

    _validFormsWithExceptions(this, string, (err, result) => {
      if (query) { 
        this.cache.set(query, result); 
      }
      if (callback.length === 1) {
        callback.call(this, result);
      } else {
        callback.call(this, null, result);
      }
    });
  }

  validFormsAsync(string) {
    return new Promise((resolve, reject) => {
      this.validForms(string, function(err, data) {
        if (err != null) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}

module.exports = WordNet;
