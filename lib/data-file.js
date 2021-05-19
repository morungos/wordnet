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

class DataFile extends WordNetFile {

  constructor(dataDir, name) {
    super(dataDir, 'data.' + name);
  }


  /**
   * Reads a synset from a given location in a data file.
   * 
   * @param {*} location 
   * @returns a promise that resolves to the object data
   */
  get(location) {
    const buff = Buffer.alloc(4096);

    return this.appendLineChar(this._fd, location, 0, buff)
      .then((line) => {

        const data = line.split('| ');
        const tokens = data[0].split(/\s+/);
        const ptrs = [];
        const wCnt = parseInt(tokens[3], 16);
        const synonyms = [];

        for (let i = 0, end = wCnt - 1; i <= end; i++) {
          synonyms.push(tokens[4 + (i * 2)]);
        }

        const ptrOffset = ((wCnt - 1) * 2) + 6;
        for (let i = 0, end = parseInt(tokens[ptrOffset], 10) - 1; i <= end; i++) {
          const base = (i * 4) + ptrOffset;
          ptrs.push({
            pointerSymbol: tokens[base + 1],
            synsetOffset: parseInt(tokens[base + 2], 10),
            pos: tokens[base + 3],
            sourceTarget: tokens[base + 4]
          });
        }

        // break "gloss" into definition vs. examples
        const glossArray = data[1].split("; ");
        const { definition, ...examples} = glossArray;

        for (let k = 0; k < examples.length; k++) {
          examples[k] = examples[k].replace(/(?:\"|\s\s+)/g,'');
        }

        const synsetOffset = parseInt(tokens[0], 10);
        if (synsetOffset !== location) {
          return Promise.reject(new Error("Invalid synsetOffset: " + location));
        }

        return Promise.resolve({
          synsetOffset: synsetOffset,
          lexFilenum: parseInt(tokens[1], 10),
          pos: tokens[2],
          wCnt,
          lemma: tokens[4],
          synonyms,
          lexId: tokens[5],
          ptrs,
          gloss: data[1],
          def: definition,
          exp: examples
        });
      });
    };
}

module.exports = DataFile;

