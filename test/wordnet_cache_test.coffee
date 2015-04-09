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
