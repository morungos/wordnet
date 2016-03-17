var IndexFile, WordNetFile, fs, util,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

WordNetFile = require('./wordnet_file');

fs = require('fs');

util = require('util');

module.exports = IndexFile = (function(superClass) {
  var _findAt, _findPrevEOL, _getFileSize, _readLine;

  extend(IndexFile, superClass);

  function IndexFile(dataDir, name) {
    IndexFile.__super__.constructor.call(this, dataDir, 'index.' + name);
  }

  _findPrevEOL = function(self, fd, pos, callback) {
    var buff;
    buff = new Buffer(1024);
    if (pos === 0) {
      return callback(null, 0);
    } else {
      return fs.read(fd, buff, 0, 1, pos, function(err, count) {
        if (err != null) {
          return callback(err, count);
        }
        if (buff[0] === 10) {
          return callback(null, pos + 1);
        } else {
          return _findPrevEOL(self, fd, pos - 1, callback);
        }
      });
    }
  };

  _readLine = function(self, fd, pos, callback) {
    var buff;
    buff = new Buffer(1024);
    return _findPrevEOL(self, fd, pos, function(err, pos) {
      if (err != null) {
        return callback(err, pos);
      }
      return self.appendLineChar(fd, pos, 0, buff, callback);
    });
  };

  _findAt = function(self, fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) {
    if (lastPos === pos || pos >= size) {
      return callback(null, {
        status: 'miss'
      });
    } else {
      return _readLine(self, fd, pos, function(err, line) {
        var key, tokens;
        if (err != null) {
          return callback(err);
        }
        tokens = line.split(/\s+/);
        key = tokens[0];
        if (key === searchKey) {
          return callback(null, {
            status: 'hit',
            key: key,
            'line': line,
            tokens: tokens
          });
        } else if (adjustment === 1 || key === lastKey) {
          return callback(null, {
            status: 'miss'
          });
        } else {
          adjustment = Math.ceil(adjustment * 0.5);
          if (key < searchKey) {
            return _findAt(self, fd, size, pos + adjustment, pos, adjustment, searchKey, callback, key);
          } else {
            return _findAt(self, fd, size, pos - adjustment, pos, adjustment, searchKey, callback, key);
          }
        }
      });
    }
  };

  _getFileSize = function(path) {
    var stat;
    stat = fs.statSync(path);
    return stat.size;
  };

  IndexFile.prototype.find = function(searchKey, callback) {
    var self;
    self = this;
    return this.open(function(err, fd) {
      var pos, size;
      if (err != null) {
        return callback(err, null);
      }
      size = _getFileSize(this.filePath) - 1;
      pos = Math.ceil(size / 2);
      return _findAt(self, fd, size, pos, null, pos, searchKey, function(err, result) {
        return callback.call(self, err, result);
      });
    });
  };

  IndexFile.prototype.lookupFromFile = function(word, callback) {
    return this.find(word, function(err, record) {
      var i, indexRecord, j, k, offsets, ptrs, ref, ref1;
      if (err != null) {
        return callback.call(this, err, null);
      }
      indexRecord = null;
      if (record.status === 'hit') {
        ptrs = [];
        offsets = [];
        for (i = j = 0, ref = parseInt(record.tokens[3]) - 1; j <= ref; i = j += 1) {
          ptrs.push(record.tokens[i]);
        }
        for (i = k = 0, ref1 = parseInt(record.tokens[2]) - 1; k <= ref1; i = k += 1) {
          offsets.push(parseInt(record.tokens[ptrs.length + 6 + i], 10));
        }
        indexRecord = {
          lemma: record.tokens[0],
          pos: record.tokens[1],
          ptrSymbol: ptrs,
          senseCnt: parseInt(record.tokens[ptrs.length + 4], 10),
          tagsenseCnt: parseInt(record.tokens[ptrs.length + 5], 10),
          synsetOffset: offsets
        };
      }
      return callback.call(this, null, indexRecord);
    });
  };

  IndexFile.prototype.lookup = function(word, callback) {
    return this.lookupFromFile(word, callback);
  };

  return IndexFile;

})(WordNetFile);
