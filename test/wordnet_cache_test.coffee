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

    it 'should succeed with a two-argument callback', (done) ->
      wordnet.get 3827107, 'n', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.get 3827107, 'n', (results) ->
        should.exist(results)
        wordnet.get 3827107, 'n', (results2) ->
          (results == results2).should.be.true
          done()

    it 'should return the exact same value for a second query and a two-argument callback', (done) ->
      wordnet.get 3827107, 'n', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        wordnet.get 3827107, 'n', (err, results2) ->
          (results == results2).should.be.true
          should.not.exist(err)
          done()


  describe 'lookup', () ->
    it 'should succeed for node', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results[0].should.have.property('synsetOffset', 3827107)
        done()

    it 'should succeed for node with a two-argument callback', (done) ->
      wordnet.lookup 'node', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.be.an.instanceOf(Array)
        results[0].should.have.property('synsetOffset', 3827107)
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        wordnet.lookup 'node', (results2) ->
          (results == results2).should.be.true
          done()

    it 'should return the exact same value for a second query and a two-argument callback', (done) ->
      wordnet.lookup 'node', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        wordnet.lookup 'node', (err, results2) ->
          (results == results2).should.be.true
          should.not.exist(err)
          done()


  describe 'findSense', () ->

    it 'should succeed for lie#v#1', (done) ->
      wordnet.findSense 'lie#v#1', (results) ->
        should.exist(results)
        results.should.have.property('lemma', 'lie_down')
        results.should.have.property('pos', 'v')
        done()

    it 'should succeed for lie#v#1 with a two-argument callback', (done) ->
      wordnet.findSense 'lie#v#1', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.have.property('lemma', 'lie_down')
        results.should.have.property('pos', 'v')
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.findSense 'lie#v#1', (results) ->
        should.exist(results)
        wordnet.findSense 'lie#v#1', (results2) ->
          (results == results2).should.be.true
          done()

    it 'should return the exact same value for a second query and a two-argument callback', (done) ->
      wordnet.findSense 'lie#v#1', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        wordnet.findSense 'lie#v#1', (err, results2) ->
          should.not.exist(err)
          (results == results2).should.be.true
          done()


  describe 'querySense', () ->
    it 'should succeed for node', (done) ->
      wordnet.querySense 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        done()

    it 'should succeed for node with a two-argument callback', (done) ->
      wordnet.querySense 'node', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.querySense 'node', (results) ->
        should.exist(results)
        wordnet.querySense 'node', (results2) ->
          (results == results2).should.be.true
          done()

    it 'should return the exact same value for a second query and a two-argument callback', (done) ->
      wordnet.querySense 'node', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        wordnet.querySense 'node', (err, results2) ->
          (results == results2).should.be.true
          should.not.exist(err)
          done()


  describe 'validForms', () ->

    it 'should succeed for axes#n', (done) ->
      wordnet.validForms 'axes#n', (results) ->
        should.exist(results)
        results.should.eql(['ax#n', 'axis#n'])
        done()

    it 'should succeed for axes#n with a two-argument callback', (done) ->
      wordnet.validForms 'axes#n', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.eql(['ax#n', 'axis#n'])
        done()

    it 'should return the exact same value for a second query', (done) ->
      wordnet.validForms 'axes#n', (results) ->
        should.exist(results)
        wordnet.validForms 'axes#n', (results2) ->
          (results == results2).should.be.true
          done()

    it 'should return the exact same value for a second query and a two-argument callback', (done) ->
      wordnet.validForms 'axes#n', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        wordnet.validForms 'axes#n', (err, results2) ->
          (results == results2).should.be.true
          should.not.exist(err)
          done()
