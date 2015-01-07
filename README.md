Wordnet
=======

This is an implementation of a Wordnet API in pure JavaScript. It was initially 
adapted from [NaturalNode/natural](https://github.com/NaturalNode/natural), which had the 
original core implementation, but which was very basic and hard to use for higher-level
tasks. 

This is a drop-in replacement for the Wordnet access in 
[NaturalNode/natural](https://github.com/NaturalNode/natural), but with additional 
methods that make it easier to use for other tasks, and probably higher in performance
too. For example, the original implementation opens file handles for more or less 
each individual low-level query. 

More recently, it includes a promise-based set of methods parallel to callback ones.
Because most of the access is asynchronous, this does make it easier to use. Methods 
ending `Async` return promises. This will also assist error handling, when we get to
implement that, as it was not the strongest part of the original implementation.

API
---

### lookup(word, callback)

Here's an example of looking up definitions for the word, "node".

```javascript
var wordnet = new WordNet()

wordnet.lookup('node', function(results) {
    results.forEach(function(result) {
        console.log('------------------------------------');
        console.log(result.synsetOffset);
        console.log(result.pos);
        console.log(result.lemma);
        console.log(result.synonyms);
        console.log(result.pos);
        console.log(result.gloss);
    });
});
```

### lookupAsync(word)

Similar to `lookup(word, callback)` but returning a promise.

### get(offset, pos, callback)

Given a synset offset and a part of speech, a definition can be looked up directly.

```javascript
var wordnet = new WordNet()

wordnet.get(4424418, 'n', function(result) {
    console.log('------------------------------------');
    console.log(result.lemma);
    console.log(result.pos);
    console.log(result.gloss);
    console.log(result.synonyms);
});
```

### getAsync(offset, pos)

Similar to `get(offset, pos, callback)` but returning a promise.

### validForms(word, callback)

Returns valid morphological exceptions. 

```javascript
var wordnet = new WordNet()
wordnet.validForms('axes#n', console.log);
```

### validFormsAsync(word)

Similar to `validForms(word, callback)` but returning a promise.


Future work
-----------

Error handling needs to be tightened a fair bit, and there is plenty of room to make the API a bit 
easier to use as well. 