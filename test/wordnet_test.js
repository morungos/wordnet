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

describe('wordnet', function() {

  let wordnet = undefined;

  beforeEach(function(done) {
    wordnet = new Wordnet();
    return done();
  });

  afterEach(function(done) {
    wordnet.close();
    return done();
  });

  describe('get', function() {
    it('should succeed', done => wordnet.get(3827107, 'n', function(results) {
      should.exist(results);
      results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      return done();
    }));

    it('should succeed with a two argument callback', done => wordnet.get(3827107, 'n', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ');
      return done();
    }));

    return it('should fail with an error in a two argument callback', done => wordnet.get(3827108, 'n', function(err, results) {
      should.not.exist(results);
      should.exist(err);
      return done();
    }));
  });

  describe('getAsync', function() {
    it('should succeed', done => wordnet
      .getAsync(3827107, 'n')
      .should.eventually.exist
      .should.eventually.be.fulfilled
      .should.eventually.have.property('gloss', '(computer science) any computer that is hooked up to a computer network  ')
      .notify(done));

    return it('should fail with an error', done => wordnet
      .getAsync(3827108, 'n')
      .should.eventually.be.rejected
      .notify(done));
  });


  describe('lookup', function() {

    it('should succeed for node', done => wordnet.lookup('node', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(8);
      results[0].should.have.property('synsetOffset', 3827107);
      return done();
    }));

    it('should succeed for test', done => wordnet.lookup('test', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(13);
      return done();
    }));

    //# Test for #16
    it('should succeed for nested callbacks', done => wordnet.lookup('node', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(8);
      return wordnet.lookup('test', function(results) {
        should.exist(results);
        results.should.be.an.instanceOf(Array);
        results.should.have.length(13);
        return done();
      });
    }));

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

    it('should succeed for lie#v', done => wordnet.lookup('lie#v', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(7);
      return done();
    }));

    it('should succeed for words with odd glosses, e.g., in#r', done => wordnet.lookup('in#r', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(1);
      return done();
    }));

    it('should succeed for alter#v', done => wordnet.lookup('alter#v', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(5);
      return done();
    }));

    return it('should succeed for alte#r', done => wordnet.lookup('alte#r', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(0);
      return done();
    }));
  });


  describe('lookupAsync', function() {

    it('should succeed for node', done => wordnet.lookupAsync('node')
      .should.eventually.exist
      .should.eventually.have.deep.property('[0].synsetOffset', 3827107)
      .notify(done));

    it('should succeed for lie#v', done => wordnet.lookupAsync('lie#v')
      .should.eventually.exist
      .should.eventually.be.an.instanceOf(Array)
      .should.eventually.have.length(7)
      .notify(done));

    return it('should succeed for words with odd glosses, e.g., in#r', done => wordnet.lookupAsync('in#r')
      .should.eventually.exist
      .should.eventually.be.an.instanceOf(Array)
      .should.eventually.have.length(1)
      .notify(done));
  });


  describe('querySense', function() {
    it('should succeed for node', done => wordnet.querySense('node', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(8);
      return done();
    }));

    it('should succeed for node with two-argument callback', done => wordnet.querySense('node', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(8);
      return done();
    }));

    return it('should succeed for ghostly#a', done => wordnet.querySense('ghostly#a', function(results) {
      should.exist(results);
      results.should.be.an.instanceOf(Array);
      results.should.have.length(1);
      results.should.eql(['ghostly#a#1']);
      return done();
    }));
  });


  describe('querySenseAsync', function() {
    it('should succeed for node', done => wordnet.querySenseAsync('node')
      .should.eventually.exist
      .should.eventually.be.an.instanceOf(Array)
      .should.eventually.have.length(8)
      .notify(done));

    return it('should succeed for ghostly#a', done => wordnet.querySenseAsync('ghostly#a')
      .should.eventually.exist
      .should.eventually.be.an.instanceOf(Array)
      .should.eventually.have.length(1)
      .should.eventually.eql(['ghostly#a#1'])
      .notify(done));
  });


  describe('findSense', function() {

    it('should succeed for lie#v#1', done => wordnet.findSense('lie#v#1', function(results) {
      should.exist(results);
      results.should.have.property('lemma', 'lie_down');
      results.should.have.property('pos', 'v');
      return done();
    }));

    return it('should succeed for lie#v#1 with a two-argument callback', done => wordnet.findSense('lie#v#1', function(err, results) {
      should.exist(results);
      should.not.exist(err);
      results.should.have.property('lemma', 'lie_down');
      results.should.have.property('pos', 'v');
      return done();
    }));
  });


  describe('findSenseAsync', () => it('should succeed for lie#v#1', done => wordnet.findSenseAsync('lie#v#1')
    .should.eventually.exist
    .should.eventually.have.property('lemma', 'lie_down')
    .notify(done)));


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

    it('should succeed for dissatisfied#v', done => wordnet.validForms('dissatisfied#v', function(results) {
      should.exist(results);
      results.should.eql(['dissatisfy#v']);
      return done();
    }));

    it('should succeed for testing#v', done => wordnet.validForms('testing#v', function(results) {
      should.exist(results);
      results.should.eql(['test#v']);
      return done();
    }));

    it('should succeed for checked#v', done => wordnet.validForms('checked#v', function(results) {
      should.exist(results);
      results.should.eql(['check#v']);
      return done();
    }));

    it('should succeed for ghostliest#a', done => wordnet.validForms('ghostliest#a', function(results) {
      should.exist(results);
      results.should.eql(['ghostly#a']);
      return done();
    }));

    it('should succeed for farther#r', done => wordnet.validForms('farther#r', function(results) {
      should.exist(results);
      results.should.eql(['farther#r', 'far#r']);
      return done();
    }));

    it('should succeed for find#v', done => wordnet.validForms('find#v', function(results) {
      should.exist(results);
      results.should.eql(['find#v']);
      return done();
    }));

    it('should succeed for are#v', done => wordnet.validForms('are#v', function(results) {
      should.exist(results);
      results.should.eql(['be#v']);
      return done();
    }));

    it('should succeed for repeated queries', done => wordnet.validForms('find#v', function(results) {
      should.exist(results);
      results.should.eql(['find#v']);
      return wordnet.validForms('farther#r', function(results) {
        should.exist(results);
        results.should.eql(['farther#r', 'far#r']);
        return done();
      });
    }));

    //# Tests for #5
    it('should succeed for fought#v', done => wordnet.validForms('fought#v', function(results) {
      should.exist(results);
      results.should.eql(['fight#v']);
      return done();
    }));

    //# Tests for #5
    it('should succeed for fought', done => wordnet.validForms('fought', function(results) {
      should.exist(results);
      results.should.eql(['fight#v']);
      return done();
    }));

    //# Tests for #6
    it('should succeed for alter', done => wordnet.validForms('alter', function(results) {
      should.exist(results);
      results.should.eql(['alter#v']);
      return done();
    }));

    //# Tests for #10
    it('should succeed for fought_', done => wordnet.validForms('fought_', function(results) {
      should.exist(results);
      results.should.eql([]);
      return done();
    }));

    //# Tests for #10
    it('should succeed for red_squirrel', done => wordnet.validForms('red_squirrel', function(results) {
      should.exist(results);
      results.should.eql(['red_squirrel#n']);
      return done();
    }));

    return it('should succeed for a set of queries pushed asynchronously', function(done) {
      const query = (item, callback) => wordnet.validForms(item, results => callback(null, results));

      return async.map(['be#v', 'are#v'], query, function(err, results) {
        should.exist(results);
        results.should.deep.eql([['be#v'], ['be#v']]);
        return done();
      });
    });
  });


  return describe('validFormsAsync', function() {

    it('should succeed for axes#n', done => wordnet.validFormsAsync('axes#n')
      .should.eventually.exist
      .should.eventually.eql(['ax#n', 'axis#n'])
      .notify(done));

    it('should succeed for dissatisfied#v', done => wordnet.validFormsAsync('dissatisfied#v')
      .should.eventually.exist
      .should.eventually.eql(['dissatisfy#v'])
      .notify(done));

    it('should succeed for testing#v', done => wordnet.validFormsAsync('testing#v')
      .should.eventually.exist
      .should.eventually.eql(['test#v'])
      .notify(done));

    it('should succeed for checked#v', done => wordnet.validFormsAsync('checked#v')
      .should.eventually.exist
      .should.eventually.eql(['check#v'])
      .notify(done));

    it('should succeed for ghostliest#a', done => wordnet.validFormsAsync('ghostliest#a')
      .should.eventually.exist
      .should.eventually.eql(['ghostly#a'])
      .notify(done));

    return it('should succeed for farther#r', done => wordnet.validFormsAsync('farther#r')
      .should.eventually.exist
      .should.eventually.eql(['farther#r', 'far#r'])
      .notify(done));
  });
});
