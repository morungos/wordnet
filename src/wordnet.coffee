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
##
## Significant changes made by Stuart Watt, including:
## (1) - implementation of logic for morphological exceptions
## (2) - using sense offsets as per Perl implementations
## (3) - porting to CoffeeScript for easier validation and better array performance
## (4) - promisification of much of the API
## (5) - move to use wndb-with-exceptions instead of WNdb, to provide morphological exceptions
## (6) - significant improvements in testing

IndexFile = require('./index_file')
DataFile = require('./data_file')

async = require('async')
Promise = require('bluebird')
path = require('path')
fs = require('fs')

require('es6-shim')

class WordNet

  constructor: (dataDir) ->

    if !dataDir
      try
        WNdb = require('wndb-with-exceptions')
      catch e
        console.error("Please 'npm install wndb-with-exceptions' before using WordNet module or specify a dict directory.")
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

  getAsync: (synsetOffset, pos) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.get synsetOffset, pos, (data) -> resolve(data)


  lookup: (input, callback) ->
    wordnet = @
    [word, pos] = input.split('#')
    lword = word.toLowerCase().replace(/\s+/g, '_')

    selectedFiles = if ! pos then wordnet.allFiles else wordnet.allFiles.filter (file) -> file.pos == pos
    wordnet.lookupFromFiles selectedFiles, [], lword, callback

  lookupAsync: (input, callback) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.lookup input, (data) -> resolve(data)


  findSense: (input, callback) ->
    wordnet = @
    [word, pos, senseNumber] = input.split('#')

    sense = parseInt(senseNumber)
    if Number.isNaN(sense)
      throw new Error("Sense number should be an integer")
    else if sense < 1
      throw new Error("Sense number should be a positive integer")

    lword = word.toLowerCase().replace(/\s+/g, '_')
    selectedFiles = wordnet.allFiles.filter (file) -> file.pos == pos
    wordnet.lookupFromFiles selectedFiles, [], lword, (response) ->
      callback(response[sense - 1])

  findSenseAsync: (input) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.findSense input, (data) -> resolve(data)


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


  ## Exceptions aren't part of the node.js source, but they are needed to map some of
  ## the exceptions in derivations. Really, these should be loaded in the constructor, but
  ## sadly this code is asynchronous and we really don't want to force everything to 
  ## block here. That's why a move to promises would be helpful, because all the dependent
  ## code is also going to be asynchronous and we can chain when we need to. For now, though,
  ## we'll handle it with callbacks when needed. 

  exceptions = [
    {name: "noun.exc", pos: 'n'},
    {name: "verb.exc", pos: 'v'},
    {name: "adj.exc", pos: 'a'},
    {name: "adv.exc", pos: 'r'},
  ]

  _loadExceptions = (wordnet, callback) ->

    ## Flag while loading, so anyone who tries to use it can check and wait until the load
    ## is complete, instead of multiple loads happening at once.
    WordNet::exceptions = 'pending'

    loadFile = (exception, callback) ->
      fullPath = path.join wordnet.path, exception.name
      fs.readFile fullPath, (err, data) ->
        return callback(err) if err
        temp = {}
        lines = data.toString().split("\n")
        for line in lines
          if line.length > 0
            [term1, term2...] = line.split(' ')
            temp[term1] ?= []
            Array.prototype.push.apply temp[term1], term2

        callback null, {pos: exception.pos, data: temp}

    async.map exceptions, loadFile, (err, results) ->
      exceptions = {}
      for result in results
        exceptions[result.pos] = result.data
      WordNet::exceptions = exceptions
      callback()


  close: () ->
    @nounIndex.close()
    @verbIndex.close()
    @adjIndex.close()
    @advIndex.close()

    @nounData.close()
    @verbData.close()
    @adjData.close()
    @advData.close()


  ## Implementation of validForms. This isn't part of the original node.js Wordnet,
  ## and has instead been adapted from WordNet::QueryData. This helps to map words
  ## to WordNet by allowing different forms to be considered. Obviously, it's highly
  ## specific to English. 

  unique = (a) ->
    found = {}
    a.filter (item) ->
      if found[item]
        false
      else
        found[item] = true

  tokenDetach = (string) ->
    [word, pos, sense] = string.split('#')

    detach = [word]
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


  _forms = (wordnet, word, pos) ->
    lword = word.toLowerCase()

    ## First check to see if we have an exception set
    exception = wordnet.exceptions[pos]?[lword]

    return [word].concat(exception) if exception

    token = word.split(/[ _]/g)

    ## If a single term, process using tokenDetach
    if token.length == 1
      return tokenDetach(token[0] + "#" + pos)

    ## Otherwise, handle the forms recursively
    forms = tokens.map (token) -> _forms(wordnet, token, pos)

    ## Now generate all possible token sequenc,es (collocations)
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


  forms = (wordnet, string) ->
    [word, pos, sense] = string.split('#')
    rtn = _forms(wordnet, word, pos)
    (element + "#" + pos for element in rtn)


  _validForms = (wordnet, string, callback) ->
    [word, pos, sense] = string.split('#')

    if ! pos
      ## No POS, so use a reduce to try them all and concatenate
      reducer = (previous, current, next) ->
        _validForms wordnet, string + "#" + current, (err, value) ->
          next(null, previous.concat(value))

      async.reduce ['n', 'v', 'a', 'r'], [], reducer, callback

    else

      possibleForms = forms(wordnet, word + "#" + pos)

      filterFn = (term, done) -> 
        wordnet.lookup term, (data) ->
          done(if data.length > 0 then true else false)

      async.filter possibleForms, filterFn, callback


  _validFormsWithExceptions = (wordnet, string, callback) ->
    if wordnet.exceptions == undefined
      _loadExceptions wordnet, () ->
        _validFormsWithExceptions(wordnet, string, callback)
    else if wordnet.exceptions == 'pending'
      setImmediate _validFormsWithExceptions, wordnet, string, callback
    else
      _validForms(wordnet, string, callback)


  validForms: (string, callback) ->
    _validFormsWithExceptions @, string, callback

  validFormsAsync: (string) ->
    new Promise (resolve, reject) =>
      @validForms string, (data) -> resolve(data)


module.exports = WordNet