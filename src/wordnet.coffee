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

async = require('async')
path = require('path')
fs = require('fs')

require('es6-shim')

unique = (a) ->
  found = {}
  a.filter (item) ->
    if found[item]
      false
    else
      found[item] = true

tokenDetach = (string) ->
  [word, pos, sense] = string.split('#')

  detach = []
  length = word.length

  switch pos
    when 'n'
      detach.push word.substring(0, length - 1) if word.endsWith("s")
      detach.push word.substring(0, length - 2) if word.endsWith("ses")
      detach.push word.substring(0, length - 2) if word.endsWith("xes")
      detach.push word.substring(0, length - 2) if word.endsWith("zes")
      detach.push word.substring(0, length - 2) if word.endsWith("ches")
      detach.push word.substring(0, length - 2) if word.endsWith("shes")
      detach.push word.substring(0, length - 3) + "man" if word.endsWith("men")
      detach.push word.substring(0, length - 3) + "y" if word.endsWith("ies")

    when 'v'
      detach.push word.substring(0, length - 1) if word.endsWith("s")
      detach.push word.substring(0, length - 3) + "y" if word.endsWith("ies")
      detach.push word.substring(0, length - 2) if word.endsWith("es")
      detach.push word.substring(0, length - 1) if word.endsWith("ed")
      detach.push word.substring(0, length - 2) if word.endsWith("ed")
      detach.push word.substring(0, length - 3) + "e" if word.endsWith("ing")
      detach.push word.substring(0, length - 3) if word.endsWith("ing")

    when 'r'
      detach.push word.substring(0, length - 2) if word.endsWith("er")
      detach.push word.substring(0, length - 1) if word.endsWith("er")
      detach.push word.substring(0, length - 3) if word.endsWith("est")
      detach.push word.substring(0, length - 2) if word.endsWith("est")

  unique(detach)


class WordNet

  constructor: (dataDir) ->

    if !dataDir
      try
        WNdb = require('WNdb')
      catch e
        console.error("Please 'npm install WNdb' before using WordNet module or specify a dict directory.")
        throw e
      dataDir = WNdb.path

    @path = dataDir

    @nounIndex = new IndexFile(dataDir, 'noun')
    @verbIndex = new IndexFile(dataDir, 'verb')
    @adjIndex = new IndexFile(dataDir, 'adj')
    @advIndex = new IndexFile(dataDir, 'adv')

    @nounData = new DataFile(dataDir, 'noun')
    @verbData = new DataFile(dataDir, 'verb')
    @adjData = new DataFile(dataDir, 'adj')
    @advData = new DataFile(dataDir, 'adv')

    @allFiles = [
      {index: @nounIndex, data: @nounData, pos: 'n'}
      {index: @verbIndex, data: @verbData, pos: 'v'}
      {index: @adjIndex, data: @adjData, pos: 'a'}
      {index: @advIndex, data: @advData, pos: 'r'}
    ]

  get: (synsetOffset, pos, callback) ->
    dataFile = @getDataFile(pos)
    dataFile.get synsetOffset, callback


  lookup: (input, callback) ->
    wordnet = @
    [word, pos] = input.split('#')
    lword = word.toLowerCase().replace(/\s+/g, '_')

    selectedFiles = if ! pos then wordnet.allFiles else wordnet.allFiles.filter (file) -> file.pos == pos
    wordnet.lookupFromFiles selectedFiles, [], lword, callback


  lookupFromFiles: (files, results, word, callback) ->
    wordnet = @

    if files.length == 0
      callback(results)
    else
      file = files.pop()

      file.index.lookup word, (record) ->
        if record
          wordnet.pushResults file.data, results, record.synsetOffset, () ->
            wordnet.lookupFromFiles files, results, word, callback
        else
          wordnet.lookupFromFiles files, results, word, callback


  pushResults: (data, results, offsets, callback) ->
    wordnet = @

    if offsets.length == 0
      callback(results)
    else
      data.get offsets.pop(), (record) ->
        results.push(record)
        wordnet.pushResults(data, results, offsets, callback)


  loadResultSynonyms: (synonyms, results, callback) ->
    wordnet = this

    if results.length > 0
      result = results.pop()
      wordnet.loadSynonyms synonyms, results, result.ptrs, callback
    else
      callback(synonyms)


  loadSynonyms: (synonyms, results, ptrs, callback) ->
    wordnet = this

    if ptrs.length > 0
      ptr = ptrs.pop()

      @get ptr.synsetOffset, ptr.pos, (result) ->
        synonyms.push(result)
        wordnet.loadSynonyms synonyms, results, ptrs, callback
    else
      wordnet.loadResultSynonyms synonyms, results, callback


  lookupSynonyms: (word, callback) ->
    wordnet = this

    wordnet.lookup word, (results) ->
      wordnet.loadResultSynonyms [], results, callback


  getSynonyms: () ->
    wordnet = this
    callback = if arguments[2] then arguments[2] else arguments[1]
    pos = if arguments[0].pos then arguments[0].pos else arguments[1]
    synsetOffset = if arguments[0].synsetOffset then arguments[0].synsetOffset else arguments[0]

    @get synsetOffset, pos, (result) ->
      wordnet.loadSynonyms [], [], result.ptrs, callback


  getDataFile: (pos) ->
    switch pos
      when 'n' then @nounData
      when 'v' then @verbData
      when 'a', 's' then @adjData
      when 'r' then @advData


  exclusions = [
    {name: "noun.exc", pos: 'n'},
    {name: "verb.exc", pos: 'v'},
    {name: "adj.exc", pos: 'a'},
    {name: "adv.exc", pos: 'r'},
  ]

  loadExclusions: (callback) ->
    wordnet = @
    wordnet.exceptions = {n: {}, v: {}, a: {}, r: {}}
    loadFile = (exclusion, callback) ->
      fullPath = path.join wordnet.path, exclusion.name
      fs.readFile fullPath, (err, data) ->
        return callback(err) if err
        lines = data.toString().split("\n")
        for line in lines
          [term1, term2] = line.split(' ')
          wordnet.exceptions[exclusion.pos][term1] ?= []
          wordnet.exceptions[exclusion.pos][term1].push term2
        callback()

    async.each exclusions, loadFile, callback


  close: () ->
    @nounIndex.close()
    @verbIndex.close()
    @adjIndex.close()
    @advIndex.close()

    @nounData.close()
    @verbData.close()
    @adjData.close()
    @advData.close()



  _forms: (string) ->
    wordnet = @

    [word, pos] = string.split('#')

    lword = word.toLowerCase()

    ## First check to see if we have an exclusion set
    exclusion = wordnet.exclusions[pos]?[lword]
    return [word].concat(exclusion) if exclusion

    token = word.split(/[ _]/g)

    ## If a single term, process using tokenDetach
    if token.length == 1
      return tokenDetach(token[0] + "#" + pos)

    ## Otherwise, handle the forms recursively
    forms = tokens.map (token) -> _forms(token)

    ## Now generate all possible token sequences (collocations)
    rtn = []
    index = (0 for token in tokens)

    while true
      colloc = forms[0][index[0]]
      for token, i in tokens
        colloc = colloc + '_' + forms[i][index[i]]
      rtn.push colloc

      for token, i in tokens
        break if ++index[i] < forms[i].length
        index[i] = 0

      if i > tokens.length
        break

    return rtn



module.exports = WordNet