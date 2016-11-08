var WordNetFile, fs, path, util;

fs = require('fs');

path = require('path');

util = require('util');

module.exports = WordNetFile = (function() {
  function WordNetFile(dataDir, fileName) {
    this.dataDir = dataDir;
    this.fileName = fileName;
    this.filePath = path.join(this.dataDir, this.fileName);
  }

  WordNetFile.prototype.open = function(callback) {
    var filePath, self;
    self = this;
    if (this.fd) {
      return callback.call(self, null, this.fd);
    }
    filePath = this.filePath;
    this.fd = fs.openSync(filePath, 'r', null)
    return callback.call(self, null, this.fd);
  };

  WordNetFile.prototype.close = function() {
    if (this.fd != null) {
      fs.close(this.fd);
      return delete this.fd;
    }
  };

  WordNetFile.prototype.appendLineChar = function(fd, pos, buffPos, buff, callback) {
    var length, self, space;
    self = this;
    length = buff.length;
    space = length - buffPos;
    var count = fs.readSync(fd, buff, buffPos, space, pos);
    var i, newBuff, _i, _ref;
    if (null) {
      console.log(self, fd, err);
      return callback.call(self, err, null);
    } else {
      for (i = _i = 0, _ref = count - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (buff[i] === 10) {
          return callback.call(self, null, buff.slice(0, i).toString('ASCII'));
        }
      }
      newBuff = new Buffer(length * 2);
      buff.copy(newBuff, 0, 0, length);
      return self.appendLineChar(fd, pos + length, length, newBuff, callback);
    }
  };

  return WordNetFile;

})();
