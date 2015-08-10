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


module.exports = class IndexFile extends WordNetFile

  constructor: (dataDir, name) ->
    super(dataDir, 'index.' + name)


  _findPrevEOL = (self, fd, pos, callback) ->
    buff = new Buffer(1024);
    if pos == 0
      callback(null, 0)
    else
      fs.read fd, buff, 0, 1, pos, (err, count) ->
        return callback(err, count) if err?
        if buff[0] == 10
          callback(null, pos + 1)
        else
          _findPrevEOL(self, fd, pos - 1, callback)


  _readLine = (self, fd, pos, callback) ->
    buff = new Buffer(1024)
    _findPrevEOL self, fd, pos, (err, pos) ->
      return callback err, pos if err?
      self.appendLineChar fd, pos, 0, buff, callback


  _findAt = (self, fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) ->
    if lastPos == pos || pos >= size
      callback null, {status: 'miss'}
    else
      _readLine self, fd, pos, (err, line) ->
        return callback err if err?

        tokens = line.split(/\s+/)
        key = tokens[0]

        if key == searchKey
          callback null, {status: 'hit', key: key, 'line': line, tokens: tokens}
        else if adjustment == 1 || key == lastKey
          callback null, {status: 'miss'}
        else
          adjustment = Math.ceil(adjustment * 0.5)

          if key < searchKey
            _findAt self, fd, size, pos + adjustment, pos, adjustment, searchKey, callback, key
          else
            _findAt self, fd, size, pos - adjustment, pos, adjustment, searchKey, callback, key


  _getFileSize = (path) ->
    stat = fs.statSync(path)
    stat.size


  find: (searchKey, callback) ->
    self = @
    @open (err, fd) ->
      return callback(err, null) if err?
      
      size = _getFileSize(@filePath) - 1
      pos = Math.ceil(size / 2)
      _findAt self, fd, size, pos, null, pos, searchKey, (err, result) ->
        callback.call(self, err, result)


  lookupFromFile: (word, callback) ->
    @find word, (err, record) ->
      return callback.call @, err, null if err?

      indexRecord = null

      if record.status == 'hit'
        ptrs = []
        offsets = []

        for i in [0..parseInt(record.tokens[3]) - 1] by 1
          ptrs.push(record.tokens[i])

        for i in [0..parseInt(record.tokens[2]) - 1] by 1
          offsets.push(parseInt(record.tokens[ptrs.length + 6 + i], 10))

        indexRecord = {
          lemma: record.tokens[0]
          pos: record.tokens[1]
          ptrSymbol: ptrs
          senseCnt:  parseInt(record.tokens[ptrs.length + 4], 10)
          tagsenseCnt:  parseInt(record.tokens[ptrs.length + 5], 10)
          synsetOffset:  offsets
        }

      callback.call @, null, indexRecord


  lookup: (word, callback) ->
    @lookupFromFile(word, callback)
