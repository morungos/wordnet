/*
 * decaffeinate suggestions:
 * DS202: Simplify dynamic range loops
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

const fs = require('fs');
const path = require('path');


class WordNetFile {

  constructor(dataDir, fileName) {
    this.dataDir = dataDir;
    this.fileName = fileName;
    this.filePath = path.join(this.dataDir, this.fileName);
  }

  open(callback) {
    if (this.fd) {
      return callback.call(self, null, this.fd);
    }

    const { filePath } = this;

    fs.open(filePath, 'r', null, (err, fd) => {
      if (err != null) { 
        return callback.call(this, err, null); 
      }

      this.fd = fd;
      callback.call(this, err, fd);
    });
  }


  close() {
    if (this.fd != null) {
      fs.close(this.fd, () => null);
      delete this.fd;
    }
  }


  appendLineChar(fd, pos, buffPos, buff, callback) {
    const { length } = buff;
    const space = length - buffPos;
    fs.read(fd, buff, buffPos, space, pos, (err, count, buffer) => {
      if (err != null) { 
        return callback.call(this, err, null); 
      }

      for (let i = 0, end = count - 1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
        if (buff[i] === 10) {
          return callback.call(this, null, buff.slice(0, i).toString('ASCII'));
        }
      }

      //# Okay, no newline; extend and tail recurse
      const newBuff = Buffer.alloc(length * 2);
      buff.copy(newBuff, 0, 0, length);
      this.appendLineChar(fd, pos + length, length, newBuff, callback);
    });
  }
}

module.exports = WordNetFile;
