var WordNetFile, appendLineChar, close, fs, open, path, util;

fs = require('fs');

path = require('path');

util = require('util');

appendLineChar = function(fd, pos, buffPos, buff, callback) {
  var length;
  length = buff.length;
  return fs.read(fd, buff, buffPos, length, pos, function(err, count, buffer) {
    var i, newBuff, _i, _ref;
    if (err) {
      return console.log(err);
    } else {
      for (i = _i = 0, _ref = count - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (buff[i] === 10) {
          return callback(buff.slice(0, i).toString('ASCII'));
        }
      }
      newBuff = new Buffer(length * 2);
      buff.copy(newBuff, 0, 0, length);
      return appendLineChar(fd, pos + count, length, newBuff, callback);
    }
  });
};

close = function() {
  fs.close(this.fd);
  return delete this.fd;
};

open = function(callback) {
  var filePath;
  if (this.fd) {
    return callback(null, this.fd);
  }
  filePath = this.filePath;
  return fs.open(filePath, 'r', null, (function(_this) {
    return function(err, fd) {
      if (err) {
        console.log('Unable to open %s', filePath);
        return;
      }
      _this.fd = fd;
      return callback(err, fd, function() {
        return void 0;
      });
    };
  })(this));
};

WordNetFile = function(dataDir, fileName) {
  this.dataDir = dataDir;
  this.fileName = fileName;
  return this.filePath = require('path').join(this.dataDir, this.fileName);
};

WordNetFile.prototype.open = open;

WordNetFile.appendLineChar = appendLineChar;

module.exports = WordNetFile;
