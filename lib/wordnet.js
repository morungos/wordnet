// Copyright (c) 2011, Chris Umbel
// Copyright (c) 2021, Stuart Watt
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

const IndexFile = require('./index-file');
const DataFile =  require('./data-file');

const path =      require('path');
const fs =        require('fs').promises;

const LRU =       require('lru-cache');

function tokenForms(string) {
  const [word, pos, sense] = string.split('#');

  const forms = [word];
  const { length } = word;

  switch (pos) {
    case 'n':
      if (word.endsWith("s")) { forms.push(word.substring(0, length - 1)); }
      if (word.endsWith("ses")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("xes")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("zes")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("ches")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("shes")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("men")) { forms.push(word.substring(0, length - 3) + "man"); }
      if (word.endsWith("ies")) { forms.push(word.substring(0, length - 3) + "y"); }
      break;

    case 'v':
      if (word.endsWith("s")) { forms.push(word.substring(0, length - 1)); }
      if (word.endsWith("ies")) { forms.push(word.substring(0, length - 3) + "y"); }
      if (word.endsWith("es")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("ed")) { forms.push(word.substring(0, length - 1)); }
      if (word.endsWith("ed")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("ing")) { forms.push(word.substring(0, length - 3) + "e"); }
      if (word.endsWith("ing")) { forms.push(word.substring(0, length - 3)); }
      break;

    case 'r':
      if (word.endsWith("er")) { forms.push(word.substring(0, length - 2)); }
      if (word.endsWith("er")) { forms.push(word.substring(0, length - 1)); }
      if (word.endsWith("est")) { forms.push(word.substring(0, length - 3)); }
      if (word.endsWith("est")) { forms.push(word.substring(0, length - 2)); }
      break;
  }

  // By design, this can never result in duplicates. If you check through the
  // changes above, all modifications result in different variants. 
  return forms;
}


// Exceptions aren't part of the node.js source, but they are needed to map some of
// the exceptions in derivations. Really, these should be loaded in the constructor, but
// sadly this code is asynchronous and we really don't want to force everything to
// block here. 

const exceptionFiles = [
  {name: "noun.exc", pos: 'n'},
  {name: "verb.exc", pos: 'v'},
  {name: "adj.exc", pos: 'a'},
  {name: "adv.exc", pos: 'r'},
];


function allPossibleForms(exceptions, word, pos) {
  const lword = word.toLowerCase();

  // First check to see if we have an exception set
  const exception = exceptions[pos] ? exceptions[pos][lword] : false;

  if (exception) { 
    return [word].concat(exception); 
  }

  const tokens = word.split(/[ _]/g);

  // If a single term, process using tokenForms
  if (tokens.length === 1) {
    return tokenForms(tokens[0] + "#" + pos);
  }

  // Otherwise, handle the forms recursively
  const forms = tokens.map(token => allPossibleForms(exceptions, token, pos));

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

/**
 * @class
 * The primary class for retrieving data from a WordNet database. The methods on this
 * class correspond to the main queries for data. 
 */
class WordNet {

  /**
   * Constructs a new WordNet interface. Several options are available:
   * 
   * @param {string|Object} [options] - a set of options
   * @param {string} [options.dataDir] - the path where the WordNet database can be found.
   *   Default is to attempt to require `wndb-with-exceptions` and use that as a source
   *   of WordNet and exception files.
   * @param {boolean|Object} [options.cache] - can be either a boolean (whether or not to 
   *   cache) data, or an object (used to construct a new LRU cache), or if the object
   *   has a `get` method then it is used as a cache directly. Default is to leave 
   *   caching switched off. 
   */
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
      this._cache = null;
    } else {
      if (options.cache === true) {
        options.cache = {
          max: 2000
        };
      }

      if ((typeof options.cache === 'object') && (typeof options.cache.get === 'function')) {
        this._cache = options.cache;
      } else {
        this._cache = LRU(options.cache);
      }
    }


    this.path = options.dataDir;

    this._files = {
      'n': {index: new IndexFile(this.path, 'noun'), data: new DataFile(this.path, 'noun')},
      'v': {index: new IndexFile(this.path, 'verb'), data: new DataFile(this.path, 'verb')},
      'a': {index: new IndexFile(this.path, 'adj'), data: new DataFile(this.path, 'adj')},
      'r': {index: new IndexFile(this.path, 'adv'), data: new DataFile(this.path, 'adv')}
    };
  }

  /**
   * Opens the WordNet database, and prepares it for use.
   * @returns a Promise that resolves when the instance is ready for use.
   */
  open() {
    return Promise.all(Object.values(this._files).map((file) => Promise.all([
      file.index.open(), 
      file.data.open()
    ])));
  }


  /**
   * Closes the WordNet database, and all open files.
   * @returns a Promise that resolves when the instance is fully closed.
   */
   close() {
    return Promise.all(Object.values(this._files).map((file) => Promise.all([
      file.index.close(), 
      file.data.close()
    ])));
  }



  /**
   * Looks up a given synset for a given part of speech type, and returns a promise
   * resolving to the data. This is the lowest level of interface provided by the
   * package, and many of the higher-level functions are built on this one.
   * 
   * @param {Number} synsetOffset - the synset offset
   * @param {string} pos - the part of speech, `n`, `v`, `a`, or `r`
   * @returns a Promise resolving to data for the given synset
   * 
   * @example
   *   wordnet.get(3827107, 'n')
   *   .then((data) => console.log(data))
   */
  get(synsetOffset, pos) {
    let query;

    if (! Number.isInteger(synsetOffset)) {
      return Promise.reject(new Error("Synset offset must be an integer"));
    } else if (! pos) {
      return Promise.reject(new Error("Missing part of speech"));
    }

    if (this._cache) {
      let hit;
      query = `get:${synsetOffset}:${pos}`;
      if (hit = this._cache.get(query)) {
        return Promise.resolve(hit);
      }
    }

    const dataFile = this._files[pos].data;
    return dataFile.get(synsetOffset)
      .then((result) => {
        if (query) { 
          this._cache.set(query, result); 
        }
        return result;
      });
  }


  /**
   * Queries the WordNet database for a word, with an optional part of speech. So, for example,
   * if you pass `lie#n, it only queries for the word `lie` in the noun tables, but if you
   * pass `lie`, then all parts of speech are searched and will be merged in the result 
   * data.
   * 
   * @param {string} input - the word to search for
   * @returns a Promise that results to an Array of word senses.
   * 
   * @example
   *   wordnet.lookup("lie#n")
   *   .then((result) => console.log(result))
   */
  lookup(input) {
    let query;
    const [word, pos] = input.split('#');
    const lword = word.toLowerCase().replace(/\s+/g, '_');

    if (this._cache) {
      let hit;
      query = `lookup:${input}`;
      if (hit = this._cache.get(query)) {
        return Promise.resolve(hit);
      }
    }

    const selectedFiles = (! pos) ? Object.values(this._files) : [ this._files[pos] ];
    return this.lookupFromFiles(selectedFiles, lword)
      .then((results) => {
        if (query) { 
          this._cache.set(query, results); 
        }
        return results;
      });
  }


  findSense(input) {
    let query;
    const [word, pos, senseNumber] = input.split('#');

    if (this._cache) {
      let hit;
      query = `findSense:${input}`;
      if (hit = this._cache.get(query)) {
        return Promise.resolve(hit);
      }
    }

    const sense = parseInt(senseNumber);
    if (Number.isNaN(sense)) {
      return Promise.reject(new Error("Sense number should be an integer"));
    } else if (sense < 1) {
      return Promise.reject(new Error("Sense number should be a positive integer"));
    }

    const lword = word.toLowerCase().replace(/\s+/g, '_');
    const selectedFiles = (pos) ? [ this._files[pos] ] : Object.values(this._files);
    return this.lookupFromFiles(selectedFiles, lword)
      .then((response) => {
        const result = response[sense - 1];
        if (query) { 
          this._cache.set(query, result); 
        }
        return result;
      });
  }


  querySense(input) {
    let query;
    let [word, pos] = input.split('#');

    if (this._cache) {
      let hit;
      query = `querySense:${input}`;
      if (hit = this._cache.get(query)) {
        return Promise.resolve(hit);
      }
    }

    return this.lookup(input)
      .then((results) => {
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

        if (query) { 
          this._cache.set(query, senses); 
        }
        return senses;
      });
  }


  loadExceptions() {
    
    const loadFile = (exception) => {
      const fullPath = path.join(this.path, exception.name);
      return fs.readFile(fullPath)
        .then((data) => {
          const temp = {};
          const lines = data.toString().split("\n");
          for (let line of lines) {
            if (line.length > 0) {
              const [term1, ...term2] = line.split(' ');
              if (temp[term1] == null) { temp[term1] = []; }
              Array.prototype.push.apply(temp[term1], term2);
            }
          }
          return {pos: exception.pos, data: temp};
        });
    }

    // While loading, this.exceptions is a promise
    this.exceptions = Promise.all(exceptionFiles.map((e) => loadFile(e)))
      .then((values) => {
        this.exceptions = {};
        for(let e of values) {
          this.exceptions[e.pos] = e.data;
        }
        return this.exceptions;
      });

    return this.exceptions;
  }


  validForms(string) {
    let { exceptions } = this;

    // Nothing yet, trigger a load
    if (typeof exceptions === 'undefined') {
      exceptions = this.loadExceptions();
    }

    // We're still waiting for the exceptions, so defer until we have them
    if (exceptions && typeof exceptions.then === 'function') {
      return exceptions.then((e) => this.validForms(string));
    }

    return this.validFormsWithExceptions(string, exceptions);
  }


  validFormsWithExceptions(string, exceptions) {

    const [word, pos, sense] = string.split('#');
    if (! pos) {

      // No POS, so try them all and concatenate
      return Promise.all(exceptionFiles.map((e) => this.validFormsWithExceptions(word + '#' + e.pos, exceptions)))
        .then((values) => values.flatMap((v => v)));

    }

    const possibleForms = allPossibleForms(this.exceptions, word, pos).map((element) => element + "#" + pos);
    return Promise.all(possibleForms.map((f) => this.lookup(f).then((r) => r.length > 0 ? f : false)))
      .then((values) => values.filter((f) => f !== false));
  }


  lookupFromFiles(files, word) {
    return Promise.all(files.map((f) => f.index.lookup(word).then((record) => {
      return (record) ? Promise.all(record.synsetOffset.map((o) => f.data.get(o))) : []
    })))
      .then((records) => records.flatMap((d) => d));
  }


  getSynonyms(synsetOffset, pos) {
    return this.get(synsetOffset, pos)
      .then((result) => Promise.all(result.ptrs.map((ptr) => this.get(ptr.synsetOffset, ptr.pos))))
      .then((result) => result.flatMap((d) => d));
  }

}

module.exports = WordNet;
