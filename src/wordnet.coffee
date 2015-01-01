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

IndexFile = require('./index_file')
DataFile = require('./data_file')

pushResults = (data, results, offsets, callback) ->
  wordnet = @

  if offsets.length == 0
    callback(results)
  else
    data.get offsets.pop(), (record) ->
      results.push(record)
      wordnet.pushResults(data, results, offsets, callback)

lookupFromFiles = (files, results, word, callback) ->
  wordnet = this;

  if files.length == 0
    callback(results)
  else
    file = files.pop()

    file.index.lookup word, (record) ->
      if record
        wordnet.pushResults file.data, results, record.synsetOffset, () ->
          wordnet.lookupFromFiles(files, results, word, callback)
      else
        wordnet.lookupFromFiles(files, results, word, callback)

lookup = (word, callback) ->
  word = word.toLowerCase().replace(/\s+/g, '_')

  @lookupFromFiles([
    {index: this.nounIndex, data: this.nounData},
    {index: this.verbIndex, data: this.verbData},
    {index: this.adjIndex, data: this.adjData},
    {index: this.advIndex, data: this.advData},
  ], [], word, callback)

get = (synsetOffset, pos, callback) ->
  dataFile = this.getDataFile(pos)
  wordnet = this

  dataFile.get synsetOffset, callback

getDataFile = (pos) ->
  switch pos
    when 'n' then @nounData
    when 'v' then @verbData
    when 'a', 's' then @adjData
    when 'r' then @advData

loadSynonyms = (synonyms, results, ptrs, callback) ->
  wordnet = this

  if ptrs.length > 0
    ptr = ptrs.pop()

    @.get ptr.synsetOffset, ptr.pos, (result) ->
      synonyms.push(result)
      wordnet.loadSynonyms synonyms, results, ptrs, callback
  else
    wordnet.loadResultSynonyms synonyms, results, callback

loadResultSynonyms = (synonyms, results, callback) ->
  wordnet = this

  if results.length > 0
    result = results.pop()
    wordnet.loadSynonyms synonyms, results, result.ptrs, callback
  else
    callback(synonyms)

lookupSynonyms = (word, callback) ->
  wordnet = this

  wordnet.lookup word, (results) ->
    wordnet.loadResultSynonyms [], results, callback

getSynonyms = () ->
  wordnet = this
  callback = if arguments[2] then arguments[2] else arguments[1]
  pos = if arguments[0].pos then arguments[0].pos else arguments[1]
  synsetOffset = if arguments[0].synsetOffset then arguments[0].synsetOffset else arguments[0]

  this.get synsetOffset, pos, (result) ->
    wordnet.loadSynonyms [], [], result.ptrs, callback

WordNet = (dataDir) ->

  if !dataDir
    try
      WNdb = require('WNdb')
    catch e
      console.error("Please 'npm install WNdb' before using WordNet module or specify a dict directory.")
      throw e
    dataDir = WNdb.path

  @nounIndex = new IndexFile(dataDir, 'noun')
  @verbIndex = new IndexFile(dataDir, 'verb')
  @adjIndex = new IndexFile(dataDir, 'adj')
  @advIndex = new IndexFile(dataDir, 'adv')

  @nounData = new DataFile(dataDir, 'noun')
  @verbData = new DataFile(dataDir, 'verb')
  @adjData = new DataFile(dataDir, 'adj')
  @advData = new DataFile(dataDir, 'adv')

  @get = get
  @lookup = lookup
  @lookupFromFiles = lookupFromFiles
  @pushResults = pushResults
  @loadResultSynonyms = loadResultSynonyms
  @loadSynonyms = loadSynonyms
  @lookupSynonyms = lookupSynonyms
  @getSynonyms = getSynonyms
  @getDataFile = getDataFile

  @


module.exports = WordNet