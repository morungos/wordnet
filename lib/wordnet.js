var DataFile, IndexFile, Promise, WordNet, async, fs, path,
  __slice = [].slice;

IndexFile = require('./index_file');

DataFile = require('./data_file');

async = require('async');

Promise = require('bluebird');

path = require('path');

fs = require('fs');

require('es6-shim');

WordNet = (function() {
  var exceptions, forms, tokenDetach, unique, _forms, _validForms;

  function WordNet(dataDir) {
    var WNdb, e;
    if (!dataDir) {
      try {
        WNdb = require('wndb-with-exceptions');
      } catch (_error) {
        e = _error;
        console.error("Please 'npm install wndb-with-exceptions' before using WordNet module or specify a dict directory.");
        throw e;
      }
      dataDir = WNdb.path;
    }
    this.path = dataDir;
    this.nounIndex = new IndexFile(dataDir, 'noun');
    this.verbIndex = new IndexFile(dataDir, 'verb');
    this.adjIndex = new IndexFile(dataDir, 'adj');
    this.advIndex = new IndexFile(dataDir, 'adv');
    this.nounData = new DataFile(dataDir, 'noun');
    this.verbData = new DataFile(dataDir, 'verb');
    this.adjData = new DataFile(dataDir, 'adj');
    this.advData = new DataFile(dataDir, 'adv');
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
    var dataFile;
    dataFile = this.getDataFile(pos);
    return dataFile.get(synsetOffset, callback);
  };

  WordNet.prototype.getAsync = function(synsetOffset, pos) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.get(synsetOffset, pos, function(data) {
        return resolve(data);
      });
    });
  };

  WordNet.prototype.lookup = function(input, callback) {
    var lword, pos, selectedFiles, word, wordnet, _ref;
    wordnet = this;
    _ref = input.split('#'), word = _ref[0], pos = _ref[1];
    lword = word.toLowerCase().replace(/\s+/g, '_');
    selectedFiles = !pos ? wordnet.allFiles : wordnet.allFiles.filter(function(file) {
      return file.pos === pos;
    });
    return wordnet.lookupFromFiles(selectedFiles, [], lword, callback);
  };

  WordNet.prototype.lookupAsync = function(input, callback) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.lookup(input, function(data) {
        return resolve(data);
      });
    });
  };

  WordNet.prototype.findSense = function(input, callback) {
    var lword, pos, selectedFiles, sense, senseNumber, word, wordnet, _ref;
    wordnet = this;
    _ref = input.split('#'), word = _ref[0], pos = _ref[1], senseNumber = _ref[2];
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
    return wordnet.lookupFromFiles(selectedFiles, [], lword, function(response) {
      return callback(response[sense - 1]);
    });
  };

  WordNet.prototype.findSenseAsync = function(input) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.findSense(input, function(data) {
        return resolve(data);
      });
    });
  };

  WordNet.prototype.lookupFromFiles = function(files, results, word, callback) {
    var file, wordnet;
    wordnet = this;
    if (files.length === 0) {
      return callback(results);
    } else {
      file = files.pop();
      return file.index.lookup(word, function(record) {
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
      return data.get(offsets.pop(), function(record) {
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

  WordNet.prototype.loadExceptions = function(callback) {
    var loadFile, wordnet;
    wordnet = this;
    wordnet.exceptions = {
      n: {},
      v: {},
      a: {},
      r: {}
    };
    loadFile = function(exception, callback) {
      var fullPath;
      fullPath = path.join(wordnet.path, exception.name);
      return fs.readFile(fullPath, function(err, data) {
        var line, lines, temp, term1, term2, _i, _len, _ref;
        if (err) {
          return callback(err);
        }
        lines = data.toString().split("\n");
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          line = lines[_i];
          if (line.length > 0) {
            _ref = line.split(' '), term1 = _ref[0], term2 = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
            temp = wordnet.exceptions[exception.pos];
            if (temp[term1] == null) {
              temp[term1] = [];
            }
            Array.prototype.push.apply(temp[term1], term2);
          }
        }
        return callback();
      });
    };
    return async.each(exceptions, loadFile, callback);
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
    var detach, length, pos, sense, word, _ref;
    _ref = string.split('#'), word = _ref[0], pos = _ref[1], sense = _ref[2];
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
    var colloc, exception, forms, i, index, lword, rtn, token, _i, _j, _len, _len1, _ref, _ref1;
    lword = word.toLowerCase();
    exception = (_ref = wordnet.exceptions) != null ? (_ref1 = _ref[pos]) != null ? _ref1[lword] : void 0 : void 0;
    if (exception) {
      return [word].concat(exception);
    }
    token = word.split(/[ _]/g);
    if (token.length === 1) {
      return tokenDetach(token[0] + "#" + pos);
    }
    forms = tokens.map(function(token) {
      return _forms(wordnet, token, pos);
    });
    rtn = [];
    index = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        _results.push(0);
      }
      return _results;
    })();
    while (true) {
      colloc = forms[0][index[0]];
      for (i = _i = 0, _len = tokens.length; _i < _len; i = ++_i) {
        token = tokens[i];
        colloc = colloc + '_' + forms[i][index[i]];
      }
      rtn.push(colloc);
      for (i = _j = 0, _len1 = tokens.length; _j < _len1; i = ++_j) {
        token = tokens[i];
        if (++index[i] < forms[i].length) {
          break;
        }
        index[i] = 0;
      }
      if (i > tokens.length) {
        break;
      }
    }
    return rtn;
  };

  forms = function(wordnet, string) {
    var element, pos, rtn, sense, word, _i, _len, _ref, _results;
    _ref = string.split('#'), word = _ref[0], pos = _ref[1], sense = _ref[2];
    rtn = _forms(wordnet, word, pos);
    _results = [];
    for (_i = 0, _len = rtn.length; _i < _len; _i++) {
      element = rtn[_i];
      _results.push(element + "#" + pos);
    }
    return _results;
  };

  _validForms = function(wordnet, string, callback) {
    var filterFn, pos, possibleForms, reducer, sense, word, _ref;
    _ref = string.split('#'), word = _ref[0], pos = _ref[1], sense = _ref[2];
    if (!pos) {
      reducer = function(previous, current, next) {
        return _validForms(wordnet, string + "#" + current, function(err, value) {
          return next(null, previous.concat(value));
        });
      };
      return async.reduce(['n', 'v', 'a', 'r'], [], reducer, callback);
    } else {
      possibleForms = forms(wordnet, word + "#" + pos);
      filterFn = function(term, done) {
        return wordnet.lookup(term, function(data) {
          return done(data.length > 0 ? true : false);
        });
      };
      return async.filter(possibleForms, filterFn, callback);
    }
  };

  WordNet.prototype.validForms = function(string, callback) {
    var wordnet;
    wordnet = this;
    if (wordnet.exceptions) {
      return _validForms(wordnet, string, callback);
    } else {
      return wordnet.loadExceptions(function() {
        return _validForms(wordnet, string, callback);
      });
    }
  };

  WordNet.prototype.validFormsAsync = function(string) {
    var wordnet;
    wordnet = this;
    return new Promise(function(resolve, reject) {
      return wordnet.validForms(string, function(data) {
        return resolve(data);
      });
    });
  };

  return WordNet;

})();

module.exports = WordNet;
