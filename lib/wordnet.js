var DataFile, IndexFile, LRU, Promise, WordNet, async, fs, path,
  slice = [].slice;

IndexFile = require('./index_file');

DataFile = require('./data_file');

async = require('async');

Promise = require('bluebird');

path = require('path');

fs = require('fs');

LRU = require('lru-cache');

require('es6-shim');

WordNet = (function() {
  var _forms, _loadExceptions, _validForms, _validFormsWithExceptions, exceptions, forms, tokenDetach, unique;

  function WordNet(options) {
    var WNdb, e, error;
    if (typeof options === 'string') {
      options = {
        dataDir: options
      };
    } else {
      if (options == null) {
        options = {};
      }
    }
    if (options.dataDir == null) {
      try {
        WNdb = require('wndb-with-exceptions');
      } catch (error) {
        e = error;
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
      if (typeof options.cache === 'object' && typeof options.cache.get === 'function') {
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
      {
        index: this.nounIndex,
        data: this.nounData,
        pos: 'n'
      }, {
        index: this.verbIndex,
        data: this.verbData,
        pos: 'v'
      }, {
        index: this.adjIndex,
        data: this.adjData,
        pos: 'a'
      }, {
        index: this.advIndex,
        data: this.advData,
        pos: 'r'
      }
    ];
  }

  WordNet.prototype.get = function(synsetOffset, pos, callback) {
    var dataFile, hit, query, wordnet;
    wordnet = this;
    if (this.cache) {
      query = "get:" + synsetOffset + ":" + pos;
      if (hit = wordnet.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(wordnet, hit);
        } else {
          return callback.call(wordnet, null, hit);
        }
      }
    }
    dataFile = wordnet.getDataFile(pos);
    return dataFile.get(synsetOffset, function(err, result) {
      if (query && (err == null)) {
        wordnet.cache.set(query, result);
      }
      if (callback.length === 1) {
        return callback.call(wordnet, result);
      } else {
        return callback.call(wordnet, err, result);
      }
    });
  };

  WordNet.prototype.getAsync = function(synsetOffset, pos) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.get(synsetOffset, pos, function(err, data) {
        if (err != null) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  };

  WordNet.prototype.lookup = function(input, callback) {
    var hit, lword, pos, query, ref, selectedFiles, word, wordnet;
    wordnet = this;
    ref = input.split('#'), word = ref[0], pos = ref[1];
    lword = word.toLowerCase().replace(/\s+/g, '_');
    if (this.cache) {
      query = "lookup:" + input;
      if (hit = wordnet.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(wordnet, hit);
        } else {
          return callback.call(wordnet, null, hit);
        }
      }
    }
    selectedFiles = !pos ? wordnet.allFiles.slice() : wordnet.allFiles.filter(function(file) {
      return file.pos === pos;
    });
    return wordnet.lookupFromFiles(selectedFiles, [], lword, function(err, results) {
      if (err != null) {
        return callback.call(wordnet, err);
      }
      if (query) {
        wordnet.cache.set(query, results);
      }
      if (callback.length === 1) {
        return callback.call(wordnet, results);
      } else {
        return callback.call(wordnet, null, results);
      }
    });
  };

  WordNet.prototype.lookupAsync = function(input, callback) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.lookup(input, function(err, data) {
        if (err != null) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  };

  WordNet.prototype.findSense = function(input, callback) {
    var hit, lword, pos, query, ref, selectedFiles, sense, senseNumber, word, wordnet;
    wordnet = this;
    ref = input.split('#'), word = ref[0], pos = ref[1], senseNumber = ref[2];
    if (this.cache) {
      query = "findSense:" + input;
      if (hit = wordnet.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(wordnet, hit);
        } else {
          return callback.call(wordnet, null, hit);
        }
      }
    }
    sense = parseInt(senseNumber);
    if (Number.isNaN(sense)) {
      throw new Error("Sense number should be an integer");
    } else if (sense < 1) {
      throw new Error("Sense number should be a positive integer");
    }
    lword = word.toLowerCase().replace(/\s+/g, '_');
    selectedFiles = wordnet.allFiles.filter(function(file) {
      return file.pos === pos;
    });
    return wordnet.lookupFromFiles(selectedFiles, [], lword, function(err, response) {
      var result;
      if (err != null) {
        return callback.call(wordnet, err);
      }
      result = response[sense - 1];
      if (query) {
        wordnet.cache.set(query, result);
      }
      if (callback.length === 1) {
        return callback.call(wordnet, result);
      } else {
        return callback.call(wordnet, null, result);
      }
    });
  };

  WordNet.prototype.findSenseAsync = function(input) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.findSense(input, function(err, data) {
        if (err != null) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  };

  WordNet.prototype.querySense = function(input, callback) {
    var hit, pos, query, ref, word, wordnet;
    wordnet = this;
    ref = input.split('#'), word = ref[0], pos = ref[1];
    if (this.cache) {
      query = "querySense:" + input;
      if (hit = wordnet.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(wordnet, hit);
        } else {
          return callback.call(wordnet, null, hit);
        }
      }
    }
    return wordnet.lookup(input, function(err, results) {
      var i, sense, senseCounts, senses;
      if (err != null) {
        return callback.call(wordnet, err);
      }
      senseCounts = {};
      senses = (function() {
        var j, len, results1;
        results1 = [];
        for (i = j = 0, len = results.length; j < len; i = ++j) {
          sense = results[i];
          pos = sense.pos;
          if (pos === 's') {
            pos = 'a';
          }
          if (senseCounts[pos] == null) {
            senseCounts[pos] = 1;
          }
          results1.push(word + "#" + pos + "#" + senseCounts[pos]++);
        }
        return results1;
      })();
      if (query) {
        wordnet.cache.set(query, senses);
      }
      if (callback.length === 1) {
        return callback.call(wordnet, senses);
      } else {
        return callback.call(wordnet, null, senses);
      }
    });
  };

  WordNet.prototype.querySenseAsync = function(input) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.querySense(input, function(err, data) {
        if (err != null) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  };

  WordNet.prototype.lookupFromFiles = function(files, results, word, callback) {
    var file, wordnet;
    wordnet = this;
    if (files.length === 0) {
      return callback.call(wordnet, null, results);
    } else {
      file = files.pop();
      return file.index.lookup(word, function(err, record) {
        if (record) {
          return wordnet.pushResults(file.data, results, record.synsetOffset, function() {
            return wordnet.lookupFromFiles(files, results, word, callback);
          });
        } else {
          return wordnet.lookupFromFiles(files, results, word, callback);
        }
      });
    }
  };

  WordNet.prototype.pushResults = function(data, results, offsets, callback) {
    var wordnet;
    wordnet = this;
    if (offsets.length === 0) {
      return callback(results);
    } else {
      return data.get(offsets.pop(), function(err, record) {
        results.push(record);
        return wordnet.pushResults(data, results, offsets, callback);
      });
    }
  };

  WordNet.prototype.loadResultSynonyms = function(synonyms, results, callback) {
    var result, wordnet;
    wordnet = this;
    if (results.length > 0) {
      result = results.pop();
      return wordnet.loadSynonyms(synonyms, results, result.ptrs, callback);
    } else {
      return callback(synonyms);
    }
  };

  WordNet.prototype.loadSynonyms = function(synonyms, results, ptrs, callback) {
    var ptr, wordnet;
    wordnet = this;
    if (ptrs.length > 0) {
      ptr = ptrs.pop();
      return this.get(ptr.synsetOffset, ptr.pos, function(result) {
        synonyms.push(result);
        return wordnet.loadSynonyms(synonyms, results, ptrs, callback);
      });
    } else {
      return wordnet.loadResultSynonyms(synonyms, results, callback);
    }
  };

  WordNet.prototype.lookupSynonyms = function(word, callback) {
    var wordnet;
    wordnet = this;
    return wordnet.lookup(word, function(results) {
      return wordnet.loadResultSynonyms([], results, callback);
    });
  };

  WordNet.prototype.getSynonyms = function() {
    var callback, pos, synsetOffset, wordnet;
    wordnet = this;
    callback = arguments[2] ? arguments[2] : arguments[1];
    pos = arguments[0].pos ? arguments[0].pos : arguments[1];
    synsetOffset = arguments[0].synsetOffset ? arguments[0].synsetOffset : arguments[0];
    return this.get(synsetOffset, pos, function(result) {
      return wordnet.loadSynonyms([], [], result.ptrs, callback);
    });
  };

  WordNet.prototype.getDataFile = function(pos) {
    switch (pos) {
      case 'n':
        return this.nounData;
      case 'v':
        return this.verbData;
      case 'a':
      case 's':
        return this.adjData;
      case 'r':
        return this.advData;
    }
  };

  exceptions = [
    {
      name: "noun.exc",
      pos: 'n'
    }, {
      name: "verb.exc",
      pos: 'v'
    }, {
      name: "adj.exc",
      pos: 'a'
    }, {
      name: "adv.exc",
      pos: 'r'
    }
  ];

  _loadExceptions = function(wordnet, callback) {
    var loadFile;
    WordNet.prototype.exceptions = 'pending';
    loadFile = function(exception, callback) {
      var fullPath;
      fullPath = path.join(wordnet.path, exception.name);
      return fs.readFile(fullPath, function(err, data) {
        var j, len, line, lines, ref, temp, term1, term2;
        if (err) {
          return callback(err);
        }
        temp = {};
        lines = data.toString().split("\n");
        for (j = 0, len = lines.length; j < len; j++) {
          line = lines[j];
          if (line.length > 0) {
            ref = line.split(' '), term1 = ref[0], term2 = 2 <= ref.length ? slice.call(ref, 1) : [];
            if (temp[term1] == null) {
              temp[term1] = [];
            }
            Array.prototype.push.apply(temp[term1], term2);
          }
        }
        return callback(null, {
          pos: exception.pos,
          data: temp
        });
      });
    };
    return async.map(exceptions, loadFile, function(err, results) {
      var j, len, result;
      exceptions = {};
      for (j = 0, len = results.length; j < len; j++) {
        result = results[j];
        exceptions[result.pos] = result.data;
      }
      WordNet.prototype.exceptions = exceptions;
      return callback();
    });
  };

  WordNet.prototype.close = function() {
    this.nounIndex.close();
    this.verbIndex.close();
    this.adjIndex.close();
    this.advIndex.close();
    this.nounData.close();
    this.verbData.close();
    this.adjData.close();
    return this.advData.close();
  };

  unique = function(a) {
    var found;
    found = {};
    return a.filter(function(item) {
      if (found[item]) {
        return false;
      } else {
        return found[item] = true;
      }
    });
  };

  tokenDetach = function(string) {
    var detach, length, pos, ref, sense, word;
    ref = string.split('#'), word = ref[0], pos = ref[1], sense = ref[2];
    detach = [word];
    length = word.length;
    switch (pos) {
      case 'n':
        if (word.endsWith("s")) {
          detach.push(word.substring(0, length - 1));
        }
        if (word.endsWith("ses")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("xes")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("zes")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("ches")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("shes")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("men")) {
          detach.push(word.substring(0, length - 3) + "man");
        }
        if (word.endsWith("ies")) {
          detach.push(word.substring(0, length - 3) + "y");
        }
        break;
      case 'v':
        if (word.endsWith("s")) {
          detach.push(word.substring(0, length - 1));
        }
        if (word.endsWith("ies")) {
          detach.push(word.substring(0, length - 3) + "y");
        }
        if (word.endsWith("es")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("ed")) {
          detach.push(word.substring(0, length - 1));
        }
        if (word.endsWith("ed")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("ing")) {
          detach.push(word.substring(0, length - 3) + "e");
        }
        if (word.endsWith("ing")) {
          detach.push(word.substring(0, length - 3));
        }
        break;
      case 'r':
        if (word.endsWith("er")) {
          detach.push(word.substring(0, length - 2));
        }
        if (word.endsWith("er")) {
          detach.push(word.substring(0, length - 1));
        }
        if (word.endsWith("est")) {
          detach.push(word.substring(0, length - 3));
        }
        if (word.endsWith("est")) {
          detach.push(word.substring(0, length - 2));
        }
    }
    return unique(detach);
  };

  _forms = function(wordnet, word, pos) {
    var colloc, exception, forms, i, index, j, lword, ref, ref1, rtn, token, tokens;
    lword = word.toLowerCase();
    exception = (ref = wordnet.exceptions[pos]) != null ? ref[lword] : void 0;
    if (exception) {
      return [word].concat(exception);
    }
    tokens = word.split(/[ _]/g);
    if (tokens.length === 1) {
      return tokenDetach(tokens[0] + "#" + pos);
    }
    forms = tokens.map(function(token) {
      return _forms(wordnet, token, pos);
    });
    rtn = [];
    index = (function() {
      var j, len, results1;
      results1 = [];
      for (j = 0, len = tokens.length; j < len; j++) {
        token = tokens[j];
        results1.push(0);
      }
      return results1;
    })();
    while (true) {
      colloc = forms[0][index[0]];
      for (i = j = 1, ref1 = tokens.length - 1; 1 <= ref1 ? j <= ref1 : j >= ref1; i = 1 <= ref1 ? ++j : --j) {
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

  forms = function(wordnet, string) {
    var element, j, len, pos, ref, results1, rtn, sense, word;
    ref = string.split('#'), word = ref[0], pos = ref[1], sense = ref[2];
    rtn = _forms(wordnet, word, pos);
    results1 = [];
    for (j = 0, len = rtn.length; j < len; j++) {
      element = rtn[j];
      results1.push(element + "#" + pos);
    }
    return results1;
  };

  _validForms = function(wordnet, string, callback) {
    var eachFn, filteredResults, pos, possibleForms, reducer, ref, sense, word;
    ref = string.split('#'), word = ref[0], pos = ref[1], sense = ref[2];
    if (!pos) {
      reducer = function(previous, current, next) {
        return _validForms(wordnet, string + "#" + current, function(err, value) {
          if (value === void 0) {
            return next(null, previous);
          } else {
            return next(null, previous.concat(value));
          }
        });
      };
      return async.reduce(['n', 'v', 'a', 'r'], [], reducer, function(err, result) {
        return callback(null, result);
      });
    } else {
      possibleForms = forms(wordnet, word + "#" + pos);
      filteredResults = [];
      eachFn = function(term, done) {
        return wordnet.lookup(term, function(err, data) {
          if (err != null) {
            return done(err);
          }
          if (data.length > 0) {
            filteredResults.push(term);
          }
          return done();
        });
      };
      return async.each(possibleForms, eachFn, function(err) {
        return callback(err, filteredResults);
      });
    }
  };

  _validFormsWithExceptions = function(wordnet, string, callback) {
    if (wordnet.exceptions === void 0) {
      return _loadExceptions(wordnet, function() {
        return _validFormsWithExceptions(wordnet, string, callback);
      });
    } else if (wordnet.exceptions === 'pending') {
      return setImmediate(_validFormsWithExceptions, wordnet, string, callback);
    } else {
      return _validForms(wordnet, string, callback);
    }
  };

  WordNet.prototype.validForms = function(string, callback) {
    var hit, query, wordnet;
    wordnet = this;
    if (this.cache) {
      query = "validForms:" + string;
      if (hit = wordnet.cache.get(query)) {
        if (callback.length === 1) {
          return callback.call(wordnet, hit);
        } else {
          return callback.call(wordnet, null, hit);
        }
      }
    }
    return _validFormsWithExceptions(this, string, function(err, result) {
      if (query) {
        wordnet.cache.set(query, result);
      }
      if (callback.length === 1) {
        return callback.call(wordnet, result);
      } else {
        return callback.call(wordnet, null, result);
      }
    });
  };

  WordNet.prototype.validFormsAsync = function(string) {
    return new Promise((function(_this) {
      return function(resolve, reject) {
        return _this.validForms(string, function(err, data) {
          if (err != null) {
            return reject(err);
          } else {
            return resolve(data);
          }
        });
      };
    })(this));
  };

  return WordNet;

})();

module.exports = WordNet;
