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

IndexFile = require './index_file'
DataFile =  require './data_file'

async =     require 'async'
Promise =   require 'bluebird'
path =      require 'path'
fs =        require 'fs'

LRU =       require 'lru-cache'

require('es6-shim')

class WordNet

  constructor: (options) ->

    ## For compatibility, if the options are a string, it's just the Wordnet path
    if typeof options == 'string'
      options = {dataDir: options}
    else
      options ?= {}


    if ! options.dataDir?
      try
        WNdb = require('wndb-with-exceptions')
      catch e
        console.error("Please 'npm install wndb-with-exceptions' before using WordNet module or specify a dict directory.")
        throw e
      options.dataDir = WNdb.path


    if ! options.cache
      @cache = null
    else
      if options.cache == true
        options.cache = {
          max: 2000
        }

      if typeof options.cache == 'object' and typeof options.cache.get == 'function'
        @cache = options.cache
      else
        @cache = LRU options.cache


    @path = options.dataDir

    @nounIndex = new IndexFile(@path, 'noun')
    @verbIndex = new IndexFile(@path, 'verb')
    @adjIndex = new IndexFile(@path, 'adj')
    @advIndex = new IndexFile(@path, 'adv')

    @nounData = new DataFile(@path, 'noun')
    @verbData = new DataFile(@path, 'verb')
    @adjData = new DataFile(@path, 'adj')
    @advData = new DataFile(@path, 'adv')

    @allFiles = [
      {index: @nounIndex, data: @nounData, pos: 'n'}
      {index: @verbIndex, data: @verbData, pos: 'v'}
      {index: @adjIndex, data: @adjData, pos: 'a'}
      {index: @advIndex, data: @advData, pos: 'r'}
    ]

  get: (synsetOffset, pos, callback) ->
    wordnet = @

    if @cache
      query = "get:#{synsetOffset}:#{pos}"
      if hit = wordnet.cache.get query
        if callback.length == 1
          return callback.call wordnet, hit
        else
          return callback.call wordnet, null, hit

    dataFile = wordnet.getDataFile(pos)
    dataFile.get synsetOffset, (err, result) ->
      wordnet.cache.set query, result if query && !err?
      if callback.length == 1
        callback.call wordnet, result
      else
        callback.call wordnet, err, result

  getAsync: (synsetOffset, pos) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.get synsetOffset, pos, (err, data) ->
        if err?
          reject err
        else
          resolve data


  lookup: (input, callback) ->
    wordnet = @
    [word, pos] = input.split('#')
    lword = word.toLowerCase().replace(/\s+/g, '_')

    if @cache
      query = "lookup:#{input}"
      if hit = wordnet.cache.get query
        if callback.length == 1
          return callback.call wordnet, hit
        else
          return callback.call wordnet, null, hit

    selectedFiles = if ! pos then wordnet.allFiles.slice() else wordnet.allFiles.filter (file) -> file.pos == pos
    wordnet.lookupFromFiles selectedFiles, [], lword, (err, results) ->
      return callback.call wordnet, err if err?
      wordnet.cache.set query, results if query
      if callback.length == 1
        return callback.call wordnet, results
      else
        return callback.call wordnet, null, results

  lookupAsync: (input, callback) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.lookup input, (err, data) ->
        if err?
          reject err
        else
          resolve data


  findSense: (input, callback) ->
    wordnet = @
    [word, pos, senseNumber] = input.split('#')

    if @cache
      query = "findSense:#{input}"
      if hit = wordnet.cache.get query
        if callback.length == 1
          return callback.call wordnet, hit
        else
          return callback.call wordnet, null, hit

    sense = parseInt(senseNumber)
    if Number.isNaN(sense)
      throw new Error("Sense number should be an integer")
    else if sense < 1
      throw new Error("Sense number should be a positive integer")

    lword = word.toLowerCase().replace(/\s+/g, '_')
    selectedFiles = wordnet.allFiles.filter (file) -> file.pos == pos
    wordnet.lookupFromFiles selectedFiles, [], lword, (err, response) ->
      return callback.call wordnet, err if err?
      result = response[sense - 1]
      wordnet.cache.set query, result if query
      if callback.length == 1
        callback.call wordnet, result
      else
        callback.call wordnet, null, result

  findSenseAsync: (input) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.findSense input, (err, data) ->
        if err?
          reject err
        else
          resolve data


  querySense: (input, callback) ->
    wordnet = @
    [word, pos] = input.split('#')

    if @cache
      query = "querySense:#{input}"
      if hit = wordnet.cache.get query
        if callback.length == 1
          return callback.call wordnet, hit
        else
          return callback.call wordnet, null, hit

    wordnet.lookup input, (err, results)  ->
      return callback.call wordnet, err if err?
      senseCounts = {}
      senses = for sense, i in results
        pos = sense.pos
        pos = 'a' if pos == 's'
        senseCounts[pos] ?= 1
        word + "#" + pos + "#" + senseCounts[pos]++

      wordnet.cache.set query, senses if query
      if callback.length == 1
        callback.call wordnet, senses
      else
        callback.call wordnet, null, senses

  querySenseAsync: (input) ->
    wordnet = @
    new Promise (resolve, reject) ->
      wordnet.querySense input, (err, data) ->
        if err?
          reject err
        else
          resolve data


  lookupFromFiles: (files, results, word, callback) ->
    wordnet = @

    if files.length == 0
      callback.call wordnet, null, results
    else
      file = files.pop()

      file.index.lookup word, (err, record) ->
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
      data.get offsets.pop(), (err, record) ->
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

    tokens = word.split(/[ _]/g)

    ## If a single term, process using tokenDetach
    if tokens.length == 1
      return tokenDetach(tokens[0] + "#" + pos)

    ## Otherwise, handle the forms recursively
    forms = tokens.map (token) -> _forms(wordnet, token, pos)

    ## Now generate all possible token sequences (collocations)
    rtn = []
    index = (0 for token in tokens)

    while true
      colloc = forms[0][index[0]]
      for i in [1..(tokens.length - 1)]
        colloc = colloc + '_' + forms[i][index[i]]
      rtn.push colloc

      i = 0
      while i < tokens.length
        index[i] = index[i] + 1
        if index[i] < forms[i].length
          break
        else
          index[i] = 0

        i = i + 1

      if i >= tokens.length
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
          if value == undefined
            next(null, previous)
          else
            next(null, previous.concat(value))

      async.reduce ['n', 'v', 'a', 'r'], [], reducer, (err, result) ->
        callback null, result

    else

      possibleForms = forms(wordnet, word + "#" + pos)
      filteredResults = []

      eachFn = (term, done) ->
        wordnet.lookup term, (err, data) ->
          if err?
            return done(err)
          filteredResults.push term if data.length > 0
          done()

      async.each possibleForms, eachFn, (err) ->
        callback err, filteredResults


  _validFormsWithExceptions = (wordnet, string, callback) ->
    if wordnet.exceptions == undefined
      _loadExceptions wordnet, () ->
        _validFormsWithExceptions(wordnet, string, callback)
    else if wordnet.exceptions == 'pending'
      setImmediate _validFormsWithExceptions, wordnet, string, callback
    else
      _validForms(wordnet, string, callback)


  validForms: (string, callback) ->
    wordnet = @

    if @cache
      query = "validForms:#{string}"
      if hit = wordnet.cache.get query
        if callback.length == 1
          return callback.call wordnet, hit
        else
          return callback.call wordnet, null, hit

    _validFormsWithExceptions @, string, (err, result) ->
      wordnet.cache.set query, result if query
      if callback.length == 1
        return callback.call wordnet, result
      else
        return callback.call wordnet, null, result

  validFormsAsync: (string) ->
    new Promise (resolve, reject) =>
      @validForms string, (err, data) ->
        if err?
          reject err
        else
          resolve data


module.exports = WordNet
