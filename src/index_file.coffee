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


getFileSize = (path) ->
  stat = fs.statSync(path)
  stat.size


findPrevEOL = (fd, pos, callback) ->
  buff = new Buffer(1024);
  if pos == 0
    callback(null, 0)
  else
    fs.read fd, buff, 0, 1, pos, (err, count) ->
      return callback(err, null) if err?
      if buff[0] == 10
        callback(null, pos + 1)
      else
        findPrevEOL(fd, pos - 1, callback)


readLine = (fd, pos, callback) ->
  buff = new Buffer(1024)
  findPrevEOL fd, pos, (err, pos) ->
    WordNetFile.appendLineChar fd, pos, 0, buff, callback


findAt = (fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) ->
  if lastPos == pos || pos >= size
    callback {status: 'miss'}
  else
    readLine fd, pos, (line) ->
      tokens = line.split(/\s+/)
      key = tokens[0]

      if key == searchKey
        callback {status: 'hit', key: key, 'line': line, tokens: tokens}
      else if adjustment == 1 || key == lastKey
        callback {status: 'miss'}
      else
        adjustment = Math.ceil(adjustment * 0.5)

        if key < searchKey
          findAt fd, size, pos + adjustment, pos, adjustment, searchKey, callback, key
        else
          findAt fd, size, pos - adjustment, pos, adjustment, searchKey, callback, key


find = (searchKey, callback) ->
  indexFile = this

  indexFile.open (err, fd) ->
    return callback(err, null) if err?
    size = getFileSize(indexFile.filePath) - 1
    pos = Math.ceil(size / 2)
    findAt fd, size, pos, null, pos, searchKey, (result)->
      callback(null, result)


lookupFromFile = (word, callback) ->
  @find word, (err, record) ->
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

    callback(indexRecord)


lookup = (word, callback) ->
  @lookupFromFile(word, callback)


IndexFile = (dataDir, name) ->
  WordNetFile.call(this, dataDir, 'index.' + name)


util.inherits(IndexFile, WordNetFile)

IndexFile.prototype.lookupFromFile = lookupFromFile
IndexFile.prototype.lookup = lookup
IndexFile.prototype.find = find

IndexFile.prototype._findAt = findAt

module.exports = IndexFile
