should = require('chai').should()

Wordnet = require('../lib/wordnet')

describe 'wordnet', () ->

  wordnet = undefined

  beforeEach (done) ->
    wordnet = new Wordnet()
    done()

  describe 'get', () ->
    it 'should succeed', (done) ->
      wordnet.get 3827107, 'n', (results) ->
        should.exist(results)
        results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        done()


  describe 'lookup', () ->

    it 'should succeed for node', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results[0].should.have.property('synsetOffset', 3827107)
        done()

    it 'should succeed for lie#v', (done) ->
      wordnet.lookup 'lie#v', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(7)
        done()

    it 'should succeed for words with odd glosses, e.g., in#r', (done) ->
      wordnet.lookup 'in#r', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(1)
        done()


  describe 'loadExclusions', () ->

    it 'should load exclusions correctly', (done) ->
      wordnet.loadExceptions (err) ->
        should.not.exist(err)
        done()


  describe 'findSense', () ->

    it 'should succeed for lie#v#1', (done) ->
      wordnet.findSense 'lie#v#1', (results) ->
        should.exist(results)
        done()


  describe 'validForms', () ->

    it 'should succeed for axes#n', (done) ->
      wordnet.validForms 'axes#n', (results) ->
        should.exist(results)
        results.should.eql(['ax#n', 'axis#n'])
        done()

    it 'should succeed for dissatisfied#v', (done) ->
      wordnet.validForms 'dissatisfied#v', (results) ->
        should.exist(results)
        results.should.eql(['dissatisfy#v'])
        done()

    it 'should succeed for testing#v', (done) ->
      wordnet.validForms 'testing#v', (results) ->
        should.exist(results)
        results.should.eql(['test#v'])
        done()

    it 'should succeed for checked#v', (done) ->
      wordnet.validForms 'checked#v', (results) ->
        should.exist(results)
        results.should.eql(['check#v'])
        done()

    it 'should succeed for ghostliest#a', (done) ->
      wordnet.validForms 'ghostliest#a', (results) ->
        should.exist(results)
        results.should.eql(['ghostly#a'])
        done()

    it 'should succeed for farther#r', (done) ->
      wordnet.validForms 'farther#r', (results) ->
        should.exist(results)
        results.should.eql(['farther#r', 'far#r'])
        done()
