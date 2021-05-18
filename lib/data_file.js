/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
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

const WordNetFile = require('./wordnet_file');

class DataFile extends WordNetFile {

  constructor(dataDir, name) {
    super(dataDir, 'data.' + name);
  }


  get(location, callback) {
    const self = this;
    const buff = Buffer.alloc(4096);

    this.open((err, fd) => {
      if (err != null) { return callback.call(self, err, null); }

      this.appendLineChar(fd, location, 0, buff, (err, line) => {
        let i;
        let end;
        let end1;
        if (err != null) { return callback.call(self, err, null); }

        const data = line.split('| ');
        const tokens = data[0].split(/\s+/);
        const ptrs = [];
        const wCnt = parseInt(tokens[3], 16);
        const synonyms = [];

        for (i = 0, end = wCnt - 1; i <= end; i++) {
          synonyms.push(tokens[4 + (i * 2)]);
        }

        const ptrOffset = ((wCnt - 1) * 2) + 6;
        for (i = 0, end1 = parseInt(tokens[ptrOffset], 10) - 1; i <= end1; i++) {
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
        const definition = glossArray[0];
        const examples = glossArray.slice(1);

        for (let k = 0; k < examples.length; k++) {
          examples[k] = examples[k].replace(/(?:\"|\s\s+)/g,'');
        }

        const synsetOffset = parseInt(tokens[0], 10);
        if (synsetOffset !== location) {
          return callback.call(self, "Invalid synsetOffset: " + location, null);
        }

        return callback.call(self, null, {
          synsetOffset: parseInt(tokens[0], 10),
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
    });
  }
}

module.exports = DataFile;

