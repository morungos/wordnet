/**
 * @module wordnet-file
 */

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

const fs = require('fs').promises;
const path = require('path');

/**
 * @class
 * A base class for managing file access to all WordNet files. 
 */
class WordNetFile {

  constructor(dataDir, fileName) {
    this.dataDir = dataDir;
    this.fileName = fileName;
    this.filePath = path.join(this.dataDir, this.fileName);
  }

  /**
   * Opens a file. If the file is already open and has a good filehandle
   * nothing more happens. 
   * 
   * @returns a Promise that resolves to a filehandle when the file is open
   */
  open() {
    if (this._fd) {
      return Promise.resolve(this._fd);
    }
    return fs.open(this.filePath, 'r')
      .then((handle) => {
        this._fd = handle;
      })
      .then(() => fs.stat(this.filePath))
      .then((stat) => {
        this._size = stat.size;
      });
  }


  /**
   * Closes a file. If the file is already closed, does nothing. 
   * 
   * @returns a Promise that resolves when the file is open
   */
  close() {
    if (! this._fd) {
      return Promise.resolve();
    }
    return this._fd.close()
      .then(() => {
        delete this._fd;
        delete this._size;
      });
  }


  /**
   * Reads from the underlying file into a buffer, and generates an ASCII
   * buffer slice up to the next linefeed character, In other words, it
   * does a good approximation of reading a line. If there is no linefeed
   * found, it increases the buffer size and continues, so the final line
   * may be larger than the supplied buffer.
   * 
   * In an ideal world, we'd use a pre-built buffer, but essentially this
   * code can be used more or less in a re-entrant way -- there may easily
   * be multiple calls in progress at any one time, so we can't simply leave
   * the buffer as part of the class.
   * 
   * @param {*} fd 
   * @param {*} pos 
   * @param {*} buffPos 
   * @param {*} buff 
   * @returns a Promise resolving to a string containing the line
   */
  appendLineChar(fd, pos, buffPos, buff) {
    const { length } = buff;
    const space = length - buffPos;
    return fd.read(buff, buffPos, space, pos)
      .then(({bytesRead, buffer}) => {
        for (let i = 0, end = bytesRead - 1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
          if (buff[i] === 10) {
            return buff.slice(0, i).toString('ASCII');
          }
        }

        // If we get here, we failed to find a linefeed, so we need to try again.
        // And we need a bigger boat.
        const newBuff = Buffer.alloc(length * 2);
        buff.copy(newBuff, 0, 0, length);
        return this.appendLineChar(fd, pos + length, length, newBuff);
      });
  }

  /**
   * Returns the size of the file. For performance reasons, this is cached
   * within the instance and returned synchronously.
   * 
   * @returns the size of the file, in bytes
   */
  size() {
    return this._size;
  }
}

module.exports = WordNetFile;
