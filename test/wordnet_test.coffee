should = require('chai').should()

Wordnet = require('../lib/wordnet')

describe 'wordnet', () ->

  wordnet = undefined

  beforeEach (done) ->
    wordnet = new Wordnet()
    done()

  it 'should pass unfiltered lookup method', (done) ->
    wordnet.lookup 'node', (results) ->
      should.exist(results)
      results.should.be.an.instanceOf(Array)
      results[0].should.have.property('synsetOffset', 3832647)
      done()

  it 'should pass filtered lookup method', (done) ->
    wordnet.lookup 'lie#v', (results) ->
      should.exist(results)
      results.should.be.an.instanceOf(Array)
      results.should.have.length(7)
      done()

  it 'should implement get method', (done) ->
    wordnet.get 4424418, 'n', (results) ->
      should.exist(results)
      results.should.have.property('gloss', 'a machine for making textiles  ')
      done()

  it 'should load exclusions correctly', (done) ->
    wordnet.loadExclusions (err) ->

      ## Since the default WNdb doesn't include exclusions, expect an error
      should.exist(err)
      err.should.have.property('code', 'ENOENT')

      done()

  it 'should succeed for words with odd glosses', (done) ->
    wordnet.lookup 'in#r', (results) ->
      should.exist(results)
      results.should.be.an.instanceOf(Array)
      results.should.have.length(1)
      console.log(results[0])
      done()

