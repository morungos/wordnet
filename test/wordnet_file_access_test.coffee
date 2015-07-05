chai = require('chai')
chai.use(require('chai-as-promised'))
should = chai.should()

async = require('async')

Wordnet = require('../lib/wordnet')

describe 'wordnet file access', () ->

  it 'should close before being used', (done) ->
    wordnet = new Wordnet()
    wordnet.close()
    done()

  it 'should close after being used', (done) ->
    wordnet = new Wordnet()
    wordnet.get 3827107, 'n', (results) ->
      wordnet.close()
      done()

  it 'should not be affected by spurious closes', (done) ->
    wordnet = new Wordnet()
    wordnet.get 3827107, 'n', (results) ->
      wordnet.close()
      wordnet.close()
      wordnet.close()
      done()

  it 'should silently re-open if needed', (done) ->
    wordnet = new Wordnet()
    wordnet.get 3827107, 'n', (results) ->
      wordnet.close()
      wordnet.querySense 'ghostly#a', (results) ->
        wordnet.close()
        done()
