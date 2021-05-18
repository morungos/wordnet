/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const should = chai.should();

const async = require('async');

const Wordnet = require('../lib/wordnet');

describe('wordnet file access', function() {

  it('should close before being used', function(done) {
    const wordnet = new Wordnet();
    wordnet.close();
    return done();
  });

  it('should close after being used', function(done) {
    const wordnet = new Wordnet();
    return wordnet.get(3827107, 'n', function(results) {
      wordnet.close();
      return done();
    });
  });

  it('should not be affected by spurious closes', function(done) {
    const wordnet = new Wordnet();
    return wordnet.get(3827107, 'n', function(results) {
      wordnet.close();
      wordnet.close();
      wordnet.close();
      return done();
    });
  });

  return it('should silently re-open if needed', function(done) {
    const wordnet = new Wordnet();
    return wordnet.get(3827107, 'n', function(results) {
      wordnet.close();
      return wordnet.querySense('ghostly#a', function(results) {
        wordnet.close();
        return done();
      });
    });
  });
});
