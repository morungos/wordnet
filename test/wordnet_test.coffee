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

  it 'should implement get method', (done) ->
    wordnet.get 4424418, 'n', (results) ->
      should.exist(results)
      results.should.have.property('gloss', 'a machine for making textiles  ')
      done()

  it 'should load exclusions correctly', (done) ->
    wordnet.loadExclusions () ->
      done()

