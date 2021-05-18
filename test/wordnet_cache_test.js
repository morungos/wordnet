/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const should = chai.should();

const Wordnet = require('../lib/wordnet');

describe('wordnet with cache enabled', function() {

  let wordnet = undefined;

  beforeEach(function(done) {
    wordnet = new Wordnet({cache: true});
    return done();
  });

  describe('get', function() {
    it('should succeed', done => wordnet.get(3827107, 'n', function(results) {
      should.exist(results);
      results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      return done();
    }));

    it('should succeed with a two-argument callback', done => wordnet.get(3827107, 'n', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.get(3827107, 'n', function(results) {
      should.exist(results);
      return wordnet.get(3827107, 'n', function(results2) {
        (results === results2).should.be.true;
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.get(3827107, 'n', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      return wordnet.get(3827107, 'n', function(err, results2) {
        (results === results2).should.be.true;
        should.not.exist(err);
        return done();
      });
    }));
  });


  describe('lookup', function() {
    it('should succeed for node', done => wordnet.lookup('node', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results[0].should.have.property('synsetOffset', 3827107);
      return done();
    }));

    it('should succeed for node with a two-argument callback', done => wordnet.lookup('node', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.be.an.instanceOf(Array);
      results[0].should.have.property('synsetOffset', 3827107);
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.lookup('node', function(results) {
      should.exist(results);
      return wordnet.lookup('node', function(results2) {
        (results === results2).should.be.true;
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.lookup('node', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      return wordnet.lookup('node', function(err, results2) {
        (results === results2).should.be.true;
        should.not.exist(err);
        return done();
      });
    }));
  });


  describe('findSense', function() {

    it('should succeed for lie#v#1', done => wordnet.findSense('lie#v#1', function(results) {
      should.exist(results);
      results.should.have.property('lemma', 'lie_down');
      results.should.have.property('pos', 'v');
      return done();
    }));

    it('should succeed for lie#v#1 with a two-argument callback', done => wordnet.findSense('lie#v#1', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.have.property('lemma', 'lie_down');
      results.should.have.property('pos', 'v');
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.findSense('lie#v#1', function(results) {
      should.exist(results);
      return wordnet.findSense('lie#v#1', function(results2) {
        (results === results2).should.be.true;
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.findSense('lie#v#1', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      return wordnet.findSense('lie#v#1', function(err, results2) {
        should.not.exist(err);
        (results === results2).should.be.true;
        return done();
      });
    }));
  });


  describe('querySense', function() {
    it('should succeed for node', done => wordnet.querySense('node', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(8);
      return done();
    }));

    it('should succeed for node with a two-argument callback', done => wordnet.querySense('node', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(8);
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.querySense('node', function(results) {
      should.exist(results);
      return wordnet.querySense('node', function(results2) {
        (results === results2).should.be.true;
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.querySense('node', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      return wordnet.querySense('node', function(err, results2) {
        (results === results2).should.be.true;
        should.not.exist(err);
        return done();
      });
    }));
  });


  describe('validForms', function() {

    it('should succeed for axes#n', done => wordnet.validForms('axes#n', function(results) {
      should.exist(results);
      results.should.eql(['ax#n', 'axis#n']);
      return done();
    }));

    it('should succeed for axes#n with a two-argument callback', done => wordnet.validForms('axes#n', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.eql(['ax#n', 'axis#n']);
      return done();
    }));

    it('should return the exact same value for a second query', done => wordnet.validForms('axes#n', function(results) {
      should.exist(results);
      return wordnet.validForms('axes#n', function(results2) {
        (results === results2).should.be.true;
        return done();
      });
    }));

    it('should return the exact same value for a second query and a two-argument callback', done => wordnet.validForms('axes#n', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      return wordnet.validForms('axes#n', function(err, results2) {
        (results === results2).should.be.true;
        should.not.exist(err);
        return done();
      });
    }));
  });
});
