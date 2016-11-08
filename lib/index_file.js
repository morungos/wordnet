var IndexFile, WordNetFile, fs, util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

WordNetFile = require('./wordnet_file');

fs = require('fs');

util = require('util');

module.exports = IndexFile = (function(_super) {
  var _findAt, _findPrevEOL, _getFileSize, _readLine;

  __extends(IndexFile, _super);

  function IndexFile(dataDir, name) {
    IndexFile.__super__.constructor.call(this, dataDir, 'index.' + name);
  }

  _findPrevEOL = function(self, fd, pos, callback) {
    var buff;
    buff = new Buffer(1024);
    if (pos === 0) {
      return callback(null, 0);
    } else {
      fs.readSync(fd, buff, 0, 1, pos)
      if (buff[0] === 10) {
        return callback(null, pos + 1);
      } else {
        return _findPrevEOL(self, fd, pos - 1, callback);
      }
    }
  };

  _readLine = function(self, fd, pos, callback) {
    var buff;
    buff = new Buffer(1024);
    return _findPrevEOL(self, fd, pos, function(err, pos) {
      return self.appendLineChar(fd, pos, 0, buff, callback);
    });
  };

  _findAt = function(self, fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) {
    if (lastPos === pos || pos >= size) {
      return callback({
        status: 'miss'
      });
    } else {
      return _readLine(self, fd, pos, function(err, line) {
        var key, tokens;
        tokens = line.split(/\s+/);
        key = tokens[0];
        if (key === searchKey) {
          return callback({
            status: 'hit',
            key: key,
            'line': line,
            tokens: tokens
          });
        } else if (adjustment === 1 || key === lastKey) {
          return callback({
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
      return _findAt(self, fd, size, pos, null, pos, searchKey, function(result) {
        return callback.call(self, null, result);
      });
    });
  };

  IndexFile.prototype.lookupFromFile = function(word, callback) {
    return this.find(word, function(err, record) {
      var i, indexRecord, offsets, ptrs, _i, _j, _ref, _ref1;
      indexRecord = null;
      if (record.status === 'hit') {
        ptrs = [];
        offsets = [];
        for (i = _i = 0, _ref = parseInt(record.tokens[3]) - 1; _i <= _ref; i = _i += 1) {
          ptrs.push(record.tokens[i]);
        }
        for (i = _j = 0, _ref1 = parseInt(record.tokens[2]) - 1; _j <= _ref1; i = _j += 1) {
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
