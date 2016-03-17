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

  afterEach (done) ->
    wordnet.close()
    done()

  describe 'get', () ->
    it 'should succeed', (done) ->
      wordnet.get 3827107, 'n', (results) ->
        should.exist(results)
        results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        done()

    it 'should succeed with a two argument callback', (done) ->
      wordnet.get 3827107, 'n', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        done()

    it 'should fail with an error in a two argument callback', (done) ->
      wordnet.get 3827108, 'n', (err, results) ->
        should.not.exist(results)
        should.exist(err)
        done()

  describe 'getAsync', () ->
    it 'should succeed', (done) ->
      wordnet
        .getAsync 3827107, 'n'
        .should.eventually.exist
        .should.eventually.be.fulfilled
        .should.eventually.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
        .notify(done)

    it 'should fail with an error', (done) ->
      wordnet
        .getAsync 3827108, 'n'
        .should.eventually.be.rejected
        .notify(done)


  describe 'lookup', () ->

    it 'should succeed for node', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        results[0].should.have.property('synsetOffset', 3827107)
        done()

    it 'should succeed for test', (done) ->
      wordnet.lookup 'test', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(13)
        done()

    ## Test for #16
    it 'should succeed for nested callbacks', (done) ->
      wordnet.lookup 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        wordnet.lookup 'test', (results) ->
          should.exist(results)
          results.should.be.an.instanceOf(Array)
          results.should.have.length(13)
          done()

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

    it 'should succeed for alter#v', (done) ->
      wordnet.lookup 'alter#v', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(5)
        done()

    it 'should succeed for alte#r', (done) ->
      wordnet.lookup 'alte#r', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(0)
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


  describe 'querySense', () ->
    it 'should succeed for node', (done) ->
      wordnet.querySense 'node', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        done()

    it 'should succeed for node with two-argument callback', (done) ->
      wordnet.querySense 'node', (err, results) ->
        should.exist(results)
        should.not.exist(err)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(8)
        done()

    it 'should succeed for ghostly#a', (done) ->
      wordnet.querySense 'ghostly#a', (results) ->
        should.exist(results)
        results.should.be.an.instanceOf(Array)
        results.should.have.length(1)
        results.should.eql(['ghostly#a#1'])
        done()


  describe 'querySenseAsync', () ->
    it 'should succeed for node', (done) ->
      wordnet.querySenseAsync 'node'
        .should.eventually.exist
        .should.eventually.be.an.instanceOf(Array)
        .should.eventually.have.length(8)
        .notify(done)

    it 'should succeed for ghostly#a', (done) ->
      wordnet.querySenseAsync 'ghostly#a'
        .should.eventually.exist
        .should.eventually.be.an.instanceOf(Array)
        .should.eventually.have.length(1)
        .should.eventually.eql(['ghostly#a#1'])
        .notify(done)


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


  describe 'findSenseAsync', () ->

    it 'should succeed for lie#v#1', (done) ->
      wordnet.findSenseAsync 'lie#v#1'
        .should.eventually.exist
        .should.eventually.have.property('lemma', 'lie_down')
        .notify(done)


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

    ## Tests for #5
    it 'should succeed for fought#v', (done) ->
      wordnet.validForms 'fought#v', (results) ->
        should.exist(results)
        results.should.eql(['fight#v'])
        done()

    ## Tests for #5
    it 'should succeed for fought', (done) ->
      wordnet.validForms 'fought', (results) ->
        should.exist(results)
        results.should.eql(['fight#v'])
        done()

    ## Tests for #6
    it 'should succeed for alter', (done) ->
      wordnet.validForms 'alter', (results) ->
        should.exist(results)
        results.should.eql(['alter#v'])
        done()

    ## Tests for #10
    it 'should succeed for fought_', (done) ->
      wordnet.validForms 'fought_', (results) ->
        should.exist(results)
        results.should.eql([])
        done()

    ## Tests for #10
    it 'should succeed for red_squirrel', (done) ->
      wordnet.validForms 'red_squirrel', (results) ->
        should.exist(results)
        results.should.eql(['red_squirrel#n'])
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
