/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Copyright (c) 2011, Chris Umbel
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const WordNetFile = require('./wordnet-file');
const fs = require('fs');


function _findPrevEOL(self, fd, pos, callback) {
  const buff = Buffer.alloc(1024);
  if (pos === 0) {
    callback(null, 0);
  } else {
    return fd.read(buff, 0, 1, pos)
      .then(({bytesRead, buffer}) => {
        if (buff[0] === 10) {
          callback(null, pos + 1);
        } else {
          _findPrevEOL(self, fd, pos - 1, callback);
        }  
      }, (err) => callback(err, null));
  }
}

function _readLine(self, fd, pos, callback) {
  const buff = Buffer.alloc(1024);
  _findPrevEOL(self, fd, pos, (err, pos) => {
    if (err != null) { 
      return callback(err, pos); 
    }
    self.appendLineChar(fd, pos, 0, buff)
      .then((line) => callback(null, line), (err) => callback(err, null));
  });
}

function _findAt(self, fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) {
  if ((lastPos === pos) || (pos >= size)) {
    callback(null, {status: 'miss'});
  } else {
    _readLine(self, fd, pos, (err, line) => {
      if (err != null) { 
        return callback(err); 
      }

      const tokens = line.split(/\s+/);
      const key = tokens[0];

      if (key === searchKey) {
        callback(null, {status: 'hit', key, 'line': line, tokens});
      } else if ((adjustment === 1) || (key === lastKey)) {
        callback(null, {status: 'miss'});
      } else {
        adjustment = Math.ceil(adjustment * 0.5);

        if (key < searchKey) {
          _findAt(self, fd, size, pos + adjustment, pos, adjustment, searchKey, callback, key);
        } else {
          _findAt(self, fd, size, pos - adjustment, pos, adjustment, searchKey, callback, key);
        }
      }
    });
  }
};

function _getFileSize(path) {
  const stat = fs.statSync(path);
  return stat.size;
}

class IndexFile extends WordNetFile {

  constructor(dataDir, name) {
    super(dataDir, 'index.' + name);
  }


  find(searchKey, callback) {
    return this.open()
      .then(() => {
        const size = _getFileSize(this.filePath) - 1;
        const pos = Math.ceil(size / 2);
        _findAt(this, this._fd, size, pos, null, pos, searchKey, (err, result) => callback.call(this, err, result));
      });
  }


  lookupFromFile(word, callback) {
    this.find(word, (err, record) => {
      if (err != null) { 
        return callback.call(this, err, null); 
      }

      let indexRecord = null;

      if (record.status === 'hit') {
        let i;
        let end;
        let end1;
        const ptrs = [];
        const offsets = [];

        for (i = 0, end = parseInt(record.tokens[3]) - 1; i <= end; i++) {
          ptrs.push(record.tokens[i]);
        }

        for (i = 0, end1 = parseInt(record.tokens[2]) - 1; i <= end1; i++) {
          offsets.push(parseInt(record.tokens[ptrs.length + 6 + i], 10));
        }

        indexRecord = {
          lemma: record.tokens[0],
          pos: record.tokens[1],
          ptrSymbol: ptrs,
          senseCnt:  parseInt(record.tokens[ptrs.length + 4], 10),
          tagsenseCnt:  parseInt(record.tokens[ptrs.length + 5], 10),
          synsetOffset:  offsets
        };
      }

      callback.call(this, null, indexRecord);
    });
  }


  lookup(word, callback) {
    return this.lookupFromFile(word, callback);
  }
};


module.exports = IndexFile;