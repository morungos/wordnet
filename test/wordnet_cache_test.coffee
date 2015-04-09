chai = require('chai')
chai.use(require('chai-as-promised'))
should = chai.should()

async = require('async')

Wordnet = require('../lib/wordnet')

describe 'wordnet with cache enabled', () ->

  wordnet = undefined

  beforeEach (done) ->
    wordnet = new Wordnet({cache: true})
    done()

  describe 'get', () ->
    it 'should succeed', (done) ->
      wordnet.get 3827107, 'n', (results) ->
        should.exist(results)
        results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        done()
        
    it 'should return the exact same value for a second query', (done) ->
      wordnet.get 3827107, 'n', (results) ->
        should.exist(results)
        wordnet.get 3827107, 'n', (results2) ->
          (results == results2).should.be.true
          done()


  describe 'lookup', () ->
    it 'should succeed for node', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results[0].should.have.property('synsetOffset', 3827107)
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        wordnet.lookup 'node', (results2) ->
          (results == results2).should.be.true
          done()


  describe 'findSense', () ->

    it 'should succeed for lie#v#1', (done) ->
      wordnet.findSense 'lie#v#1', (results) ->
        should.exist(results)
        results.should.have.property('lemma', 'lie_down')
        results.should.have.property('pos', 'v')
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.findSense 'lie#v#1', (results) ->
        should.exist(results)
        wordnet.findSense 'lie#v#1', (results2) ->
          (results == results2).should.be.true
          done()


  describe 'querySense', () ->
    it 'should succeed for node', (done) ->
      wordnet.querySense 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.querySense 'node', (results) ->
        should.exist(results)
        wordnet.querySense 'node', (results2) ->
          (results == results2).should.be.true
          done()


  describe 'validForms', () ->

    it 'should succeed for axes#n', (done) ->
      wordnet.validForms 'axes#n', (results) ->
        should.exist(results)
        results.should.eql(['ax#n', 'axis#n'])
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.validForms 'axes#n', (results) ->
        should.exist(results)
        wordnet.validForms 'axes#n', (results2) ->
          (results == results2).should.be.true
          done()
