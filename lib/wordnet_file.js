var WordNetFile, appendLineChar, fs, open, path, util;

fs = require('fs');

path = require('path');

util = require('util');

appendLineChar = function(fd, pos, buffPos, buff, callback) {
  var newBuff;
  if (buffPos >= buff.length) {
    newBuff = new Buffer(buff.length * 2);
    buff.copy(newBuff, 0, 0, buff.length);
    buff = newBuff;
  }
  return fs.read(fd, buff, buffPos, 1, pos, function(err, count) {
    if (err) {
      return console.log(err);
    } else {
      if (buff[buffPos] === 10 || buffPos === buff.length) {
        return callback(buff.slice(0, buffPos).toString('ASCII'));
      } else {
        return appendLineChar(fd, pos + 1, buffPos + 1, buff, callback);
      }
    }
  });
};

open = function(callback) {
  var filePath;
  filePath = this.filePath;
  return fs.open(filePath, 'r', null, function(err, fd) {
    if (err) {
      console.log('Unable to open %s', filePath);
      return;
    }
    return callback(err, fd, function() {
      return fs.close(fd);
    });
  });
};

WordNetFile = function(dataDir, fileName) {
  this.dataDir = dataDir;
  this.fileName = fileName;
  return this.filePath = require('path').join(this.dataDir, this.fileName);
};

WordNetFile.prototype.open = open;

WordNetFile.appendLineChar = appendLineChar;

module.exports = WordNetFile;
