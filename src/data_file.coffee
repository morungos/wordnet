## Copyright (c) 2011, Chris Umbel
##
## Permission is hereby granted, free of charge, to any person obtaining a copy
## of this software and associated documentation files (the "Software"), to deal
## in the Software without restriction, including without limitation the rights
## to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
## copies of the Software, and to permit persons to whom the Software is
## furnished to do so, subject to the following conditions:
##
## The above copyright notice and this permission notice shall be included in
## all copies or substantial portions of the Software.
##
## THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
## IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
## FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
## AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
## LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
## OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
## THE SOFTWARE.

WordNetFile = require('./wordnet_file')
fs = require('fs')
util = require('util')


module.exports = class DataFile extends WordNetFile

  constructor: (dataDir, name) ->
    super(dataDir, 'data.' + name)


  get: (location, callback) ->
    self = @
    buff = new Buffer(4096)

    @open (err, fd) ->
      return callback.call self, err, null if err?

      @appendLineChar fd, location, 0, buff, (err, line) ->
        return callback.call self, err, null if err?

        data = line.split('| ')
        tokens = data[0].split(/\s+/)
        ptrs = []
        wCnt = parseInt(tokens[3], 16)
        synonyms = []

        for i in [0..wCnt - 1] by 1
          synonyms.push(tokens[4 + i * 2]);

        ptrOffset = (wCnt - 1) * 2 + 6
        for i in [0..parseInt(tokens[ptrOffset], 10) - 1] by 1
          base = i * 4 + ptrOffset
          ptrs.push {
            pointerSymbol: tokens[base + 1]
            synsetOffset: parseInt(tokens[base + 2], 10)
            pos: tokens[base + 3]
            sourceTarget: tokens[base + 4]
          }

        ## break "gloss" into definition vs. examples
        glossArray = data[1].split("; ")
        definition = glossArray[0]
        examples = glossArray.slice(1)

        for element, k in examples
          examples[k] = examples[k].replace(/\"/g,'').replace(/\s\s+/g,'')

        synsetOffset = parseInt(tokens[0], 10)
        if synsetOffset != location
          return callback.call self, "Invalid synsetOffset: " + location, null

        callback.call self, null, {
          synsetOffset: parseInt(tokens[0], 10)
          lexFilenum: parseInt(tokens[1], 10)
          pos: tokens[2]
          wCnt: wCnt
          lemma: tokens[4]
          synonyms: synonyms
          lexId: tokens[5]
          ptrs: ptrs
          gloss: data[1]
          def: definition
          exp: examples
        }
