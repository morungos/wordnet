var DataFile, WordNetFile, fs, util,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

WordNetFile = require('./wordnet_file');

fs = require('fs');

util = require('util');

module.exports = DataFile = (function(superClass) {
  extend(DataFile, superClass);

  function DataFile(dataDir, name) {
    DataFile.__super__.constructor.call(this, dataDir, 'data.' + name);
  }

  DataFile.prototype.get = function(location, callback) {
    var buff, self;
    self = this;
    buff = new Buffer(4096);
    return this.open(function(err, fd) {
      if (err != null) {
        return callback.call(self, err, null);
      }
      return this.appendLineChar(fd, location, 0, buff, function(err, line) {
        var base, data, definition, element, examples, glossArray, i, j, k, l, len, m, ptrOffset, ptrs, ref, ref1, synonyms, synsetOffset, tokens, wCnt;
        if (err != null) {
          return callback.call(self, err, null);
        }
        data = line.split('| ');
        tokens = data[0].split(/\s+/);
        ptrs = [];
        wCnt = parseInt(tokens[3], 16);
        synonyms = [];
        for (i = j = 0, ref = wCnt - 1; j <= ref; i = j += 1) {
          synonyms.push(tokens[4 + i * 2]);
        }
        ptrOffset = (wCnt - 1) * 2 + 6;
        for (i = l = 0, ref1 = parseInt(tokens[ptrOffset], 10) - 1; l <= ref1; i = l += 1) {
          base = i * 4 + ptrOffset;
          ptrs.push({
            pointerSymbol: tokens[base + 1],
            synsetOffset: parseInt(tokens[base + 2], 10),
            pos: tokens[base + 3],
            sourceTarget: tokens[base + 4]
          });
        }
        glossArray = data[1].split("; ");
        definition = glossArray[0];
        examples = glossArray.slice(1);
        for (k = m = 0, len = examples.length; m < len; k = ++m) {
          element = examples[k];
          examples[k] = examples[k].replace(/\"/g, '').replace(/\s\s+/g, '');
        }
        synsetOffset = parseInt(tokens[0], 10);
        if (synsetOffset !== location) {
          return callback.call(self, "Invalid synsetOffset: " + location, null);
        }
        return callback.call(self, null, {
          synsetOffset: parseInt(tokens[0], 10),
          lexFilenum: parseInt(tokens[1], 10),
          pos: tokens[2],
          wCnt: wCnt,
          lemma: tokens[4],
          synonyms: synonyms,
          lexId: tokens[5],
          ptrs: ptrs,
          gloss: data[1],
          def: definition,
          exp: examples
        });
      });
    });
  };

  return DataFile;

})(WordNetFile);
