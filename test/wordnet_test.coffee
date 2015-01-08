chai = require('chai')
chai.use(require('chai-as-promised'))
should = chai.should()

async = require('async')

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


  describe 'getAsync', () ->
    it 'should succeed', (done) ->
      wordnet
        .getAsync 3827107, 'n'
        .should.eventually.exist
        .should.eventually.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        .notify(done)


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


  describe 'lookupAsync', () ->

    it 'should succeed for node', (done) ->
      wordnet.lookupAsync 'node'
        .should.eventually.exist
        .should.eventually.have.deep.property('[0].synsetOffset', 3827107)
        .notify(done)

    it 'should succeed for lie#v', (done) ->
      wordnet.lookupAsync 'lie#v'
        .should.eventually.exist
        .should.eventually.be.an.instanceOf(Array)
        .should.eventually.have.length(7)
        .notify(done)

    it 'should succeed for words with odd glosses, e.g., in#r', (done) ->
      wordnet.lookupAsync 'in#r'
        .should.eventually.exist
        .should.eventually.be.an.instanceOf(Array)
        .should.eventually.have.length(1)
        .notify(done)


  describe 'loadExclusions', () ->

    it 'should load exclusions correctly', (done) ->
      wordnet.loadExceptions (err) ->
        should.not.exist(err)
        done()


  describe 'findSense', () ->

    it 'should succeed for lie#v#1', (done) ->
      wordnet.findSense 'lie#v#1', (results) ->
        should.exist(results)
        results.should.have.property('lemma', 'lie_down')
        results.should.have.property('pos', 'v')
        done()


  describe 'findSenseAsync', () ->

    it 'should succeed for lie#v#1', (done) ->
      wordnet.findSenseAsync 'lie#v#1'
        .should.eventually.exist
        .should.eventually.have.property('lemma', 'lie_down')
        .notify(done)


  describe 'validForms', () ->

    it 'should succeed for axes#n', (done) ->
      wordnet.validFormsAsync 'axes#n'
        .should.eventually.exist
        .should.eventually.eql(['ax#n', 'axis#n'])
        .notify(done)

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

    it 'should succeed for find#v', (done) ->
      wordnet.validForms 'find#v', (results) ->
        should.exist(results)
        results.should.eql(['find#v'])
        done()

    it 'should succeed for are#v', (done) ->
      wordnet.validForms 'are#v', (results) ->
        should.exist(results)
        results.should.eql(['be#v'])
        done()

    it 'should succeed for repeated queries', (done) ->
      wordnet.validForms 'find#v', (results) ->
        should.exist(results)
        results.should.eql(['find#v'])
        wordnet.validForms 'farther#r', (results) ->
          should.exist(results)
          results.should.eql(['farther#r', 'far#r'])
          done()

    it 'should succeed for a set of queries pushed asynchronously', (done) ->
      query = (item, callback) ->
        wordnet.validForms item, (results) ->
          callback null, results

      async.map ['be#v', 'are#v'], query, (err, results) ->
        should.exist(results)
        results.should.deep.eql([['be#v'], ['be#v']])
        done()


  describe 'validFormsAsync', () ->

    it 'should succeed for axes#n', (done) ->
      wordnet.validFormsAsync 'axes#n'
        .should.eventually.exist
        .should.eventually.eql(['ax#n', 'axis#n'])
        .notify(done)

    it 'should succeed for dissatisfied#v', (done) ->
      wordnet.validFormsAsync 'dissatisfied#v'
        .should.eventually.exist
        .should.eventually.eql(['dissatisfy#v'])
        .notify(done)

    it 'should succeed for testing#v', (done) ->
      wordnet.validFormsAsync 'testing#v'
        .should.eventually.exist
        .should.eventually.eql(['test#v'])
        .notify(done)

    it 'should succeed for checked#v', (done) ->
      wordnet.validFormsAsync 'checked#v'
        .should.eventually.exist
        .should.eventually.eql(['check#v'])
        .notify(done)

    it 'should succeed for ghostliest#a', (done) ->
      wordnet.validFormsAsync 'ghostliest#a'
        .should.eventually.exist
        .should.eventually.eql(['ghostly#a'])
        .notify(done)

    it 'should succeed for farther#r', (done) ->
      wordnet.validFormsAsync 'farther#r'
        .should.eventually.exist
        .should.eventually.eql(['farther#r', 'far#r'])
        .notify(done)
