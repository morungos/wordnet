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
    return fs.open(filePath, 'r', null, (function(_this) {
      return function(err, fd) {
        if (err != null) {
          return callback.call(self, err, null);
        }
        _this.fd = fd;
        return callback.call(self, err, fd);
      };
    })(this));
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
    return fs.read(fd, buff, buffPos, space, pos, function(err, count, buffer) {
      var i, j, newBuff, ref;
      if (err != null) {
        return callback.call(self, err, null);
      }
      for (i = j = 0, ref = count - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        if (buff[i] === 10) {
          return callback.call(self, null, buff.slice(0, i).toString('ASCII'));
        }
      }
      newBuff = new Buffer(length * 2);
      buff.copy(newBuff, 0, 0, length);
      return self.appendLineChar(fd, pos + length, length, newBuff, callback);
    });
  };

  return WordNetFile;

})();
