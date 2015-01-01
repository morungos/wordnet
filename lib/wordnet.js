var DataFile, IndexFile, WordNet, async, close, exclusions, fs, get, getDataFile, getSynonyms, loadExclusions, loadResultSynonyms, loadSynonyms, lookup, lookupFromFiles, lookupSynonyms, path, pushResults;

IndexFile = require('./index_file');

DataFile = require('./data_file');

async = require('async');

path = require('path');

fs = require('fs');

pushResults = function(data, results, offsets, callback) {
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

lookupFromFiles = function(files, results, word, callback) {
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

lookup = function(input, callback) {
  var lword, pos, selectedFiles, word, wordnet, _ref;
  wordnet = this;
  _ref = input.split('#'), word = _ref[0], pos = _ref[1];
  lword = word.toLowerCase().replace(/\s+/g, '_');
  selectedFiles = !pos ? wordnet.allFiles : wordnet.allFiles.filter(function(file) {
    return file.pos === pos;
  });
  return wordnet.lookupFromFiles(selectedFiles, [], lword, callback);
};

get = function(synsetOffset, pos, callback) {
  var dataFile, wordnet;
  dataFile = this.getDataFile(pos);
  wordnet = this;
  return dataFile.get(synsetOffset, callback);
};

getDataFile = function(pos) {
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

loadSynonyms = function(synonyms, results, ptrs, callback) {
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

loadResultSynonyms = function(synonyms, results, callback) {
  var result, wordnet;
  wordnet = this;
  if (results.length > 0) {
    result = results.pop();
    return wordnet.loadSynonyms(synonyms, results, result.ptrs, callback);
  } else {
    return callback(synonyms);
  }
};

lookupSynonyms = function(word, callback) {
  var wordnet;
  wordnet = this;
  return wordnet.lookup(word, function(results) {
    return wordnet.loadResultSynonyms([], results, callback);
  });
};

getSynonyms = function() {
  var callback, pos, synsetOffset, wordnet;
  wordnet = this;
  callback = arguments[2] ? arguments[2] : arguments[1];
  pos = arguments[0].pos ? arguments[0].pos : arguments[1];
  synsetOffset = arguments[0].synsetOffset ? arguments[0].synsetOffset : arguments[0];
  return this.get(synsetOffset, pos, function(result) {
    return wordnet.loadSynonyms([], [], result.ptrs, callback);
  });
};

close = function() {
  this.nounIndex.close();
  this.verbIndex.close();
  this.adjIndex.close();
  this.advIndex.close();
  this.nounData.close();
  this.verbData.close();
  this.adjData.close();
  return this.advData.close();
};

exclusions = [
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

loadExclusions = function(callback) {
  var loadFile, wordnet;
  wordnet = this;
  wordnet.exceptions = {
    n: {},
    v: {},
    a: {},
    r: {}
  };
  loadFile = function(exclusion, callback) {
    var fullPath;
    fullPath = path.join(wordnet.path, exclusion.name);
    return fs.readFile(fullPath, function(err, data) {
      var line, lines, term1, term2, _base, _i, _len, _ref;
      if (err) {
        return callback(err);
      }
      lines = data.toString().split("\n");
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        line = lines[_i];
        _ref = line.split(' '), term1 = _ref[0], term2 = _ref[1];
        if ((_base = wordnet.exceptions[exclusion.pos])[term1] == null) {
          _base[term1] = [];
        }
        wordnet.exceptions[exclusion.pos][term1].push(term2);
      }
      return callback();
    });
  };
  return async.each(exclusions, loadFile, callback);
};

WordNet = function(dataDir) {
  var WNdb, e;
  if (!dataDir) {
    try {
      WNdb = require('WNdb');
    } catch (_error) {
      e = _error;
      console.error("Please 'npm install WNdb' before using WordNet module or specify a dict directory.");
      throw e;
    }
    dataDir = WNdb.path;
  }
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
  this.get = get;
  this.path = dataDir;
  this.lookup = lookup;
  this.lookupFromFiles = lookupFromFiles;
  this.pushResults = pushResults;
  this.loadResultSynonyms = loadResultSynonyms;
  this.loadSynonyms = loadSynonyms;
  this.lookupSynonyms = lookupSynonyms;
  this.getSynonyms = getSynonyms;
  this.getDataFile = getDataFile;
  this.loadExclusions = loadExclusions;
  return this;
};

module.exports = WordNet;
