// Copyright (c) 2011, Chris Umbel
// Copyright (c) 2021, Stuart Watt
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

function _findPreviousEndOfLine(self, fd, pos) {
  if (pos === 0) {
    return Promise.resolve(0);
  } else {
    const buff = Buffer.alloc(1024);
    return fd.read(buff, 0, 1, pos)
      .then(({bytesRead, buffer}) => {
        if (buff[0] === 10) {
          return Promise.resolve(pos + 1);
        } else {
          return _findPreviousEndOfLine(self, fd, pos - 1);
        }  
      });
  }
}

function _readWholeLine(self, fd, pos) {
  const buff = Buffer.alloc(1024);
  return _findPreviousEndOfLine(self, fd, pos)
    .then((pos) => self.appendLineChar(fd, pos, 0, buff));
}

function _findAt(self, fd, size, pos, previousPos, adjustment, searchKey, previousKey) {
  if (previousPos === pos || pos >= size) {
    return Promise.resolve({status: 'miss'});
  } else {
    return _readWholeLine(self, fd, pos)
      .then((line) => {
        const tokens = line.split(/\s+/);
        const key = tokens[0];
  
        if (key === searchKey) {
          return Promise.resolve({status: 'hit', key, 'line': line, tokens});
        } else if ((adjustment === 1) || (key === previousKey)) {
          return Promise.resolve({status: 'miss'});
        } else {
          adjustment = Math.ceil(adjustment * 0.5);
  
          if (key < searchKey) {
            return _findAt(self, fd, size, pos + adjustment, pos, adjustment, searchKey, key);
          } else {
            return _findAt(self, fd, size, pos - adjustment, pos, adjustment, searchKey, key);
          }
        }
      });
  }
};

class IndexFile extends WordNetFile {

  constructor(dataDir, name) {
    super(dataDir, 'index.' + name);
  }


  /**
   * This is the main index lookup function. Given a word, it searches the
   * index for a matching record and returns it. 
   * @param {string} word 
   * @returns a Promise that resolves to an index record
   */
  lookup(word) {
    const size = this.size() - 1;
    const pos = Math.ceil(size / 2);
    return _findAt(this, this._fd, size, pos, null, pos, word)
      .then((record) => {
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

        return indexRecord;
      });  
  };
};


module.exports = IndexFile;