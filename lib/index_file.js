var IndexFile, WordNetFile, find, findAt, findPrevEOL, fs, getFileSize, lookup, lookupFromFile, miss, readLine, util;

WordNetFile = require('./wordnet_file');

fs = require('fs');

util = require('util');

getFileSize = function(path) {
  var stat;
  stat = fs.statSync(path);
  return stat.size;
};

findPrevEOL = function(fd, pos, callback) {
  var buff;
  buff = new Buffer(1024);
  if (pos === 0) {
    return callback(0);
  } else {
    return fs.read(fd, buff, 0, 1, pos, function(err, count) {
      if (buff[0] === 10) {
        return callback(pos + 1);
      } else {
        return findPrevEOL(fd, pos - 1, callback);
      }
    });
  }
};

readLine = function(fd, pos, callback) {
  var buff;
  buff = new Buffer(1024);
  return findPrevEOL(fd, pos, function(pos) {
    return WordNetFile.appendLineChar(fd, pos, 0, buff, callback);
  });
};

miss = function(callback) {
  return callback({
    status: 'miss'
  });
};

findAt = function(fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) {
  if (lastPos === pos || pos >= size) {
    return miss(callback);
  } else {
    return readLine(fd, pos, function(line) {
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
        return miss(callback);
      } else {
        adjustment = Math.ceil(adjustment * 0.5);
        if (key < searchKey) {
          return findAt(fd, size, pos + adjustment, pos, adjustment, searchKey, callback, key);
        } else {
          return findAt(fd, size, pos - adjustment, pos, adjustment, searchKey, callback, key);
        }
      }
    });
  }
};

find = function(searchKey, callback) {
  var indexFile;
  indexFile = this;
  return indexFile.open(function(err, fd) {
    var pos, size;
    if (err) {
      return console.log(err);
    } else {
      size = getFileSize(indexFile.filePath) - 1;
      pos = Math.ceil(size / 2);
      return findAt(fd, size, pos, null, pos, searchKey, function(result) {
        return callback(result);
      });
    }
  });
};

lookupFromFile = function(word, callback) {
  return this.find(word, function(record) {
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
    return callback(indexRecord);
  });
};

lookup = function(word, callback) {
  return this.lookupFromFile(word, callback);
};

IndexFile = function(dataDir, name) {
  return WordNetFile.call(this, dataDir, 'index.' + name);
};

util.inherits(IndexFile, WordNetFile);

IndexFile.prototype.lookupFromFile = lookupFromFile;

IndexFile.prototype.lookup = lookup;

IndexFile.prototype.find = find;

IndexFile.prototype._findAt = findAt;

module.exports = IndexFile;
