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

fs = require('fs')
path = require('path')
util = require('util')


module.exports = class WordNetFile

  constructor: (@dataDir, @fileName) ->
    @filePath = path.join(@dataDir, @fileName)

  open: (callback) ->
    self = @
    if @fd
      return callback.call self, null, @fd

    filePath = @filePath

    fs.open filePath, 'r', null, (err, fd) =>
      return callback.call self, err, null if err?

      @fd = fd
      callback.call self, err, fd


  close: () ->
    if @fd?
      fs.close(@fd)
      delete @fd


  appendLineChar: (fd, pos, buffPos, buff, callback) ->
    self = @
    length = buff.length
    space = length - buffPos
    fs.read fd, buff, buffPos, space, pos, (err, count, buffer) ->
      return callback.call(self, err, null) if err?

      for i in [0..count - 1]
        if buff[i] == 10
          return callback.call(self, null, buff.slice(0, i).toString('ASCII'))

      ## Okay, no newline; extend and tail recurse
      newBuff = new Buffer(length * 2)
      buff.copy(newBuff, 0, 0, length)
      self.appendLineChar fd, pos + length, length, newBuff, callback
