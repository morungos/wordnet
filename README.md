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

Usage
-----

You'll need a copy of WordNet. There are several on Github, but for full functionality, 
at least for now, I'd suggest using: `wndb-with-exceptions`, available at: 
https://github.com/morungos/WNdb-with-exceptions, as it includes the morphological
exception lists needed by `validForms`. If you don't care about that, you can get
by with https://github.com/moos/WNdb, or even just download WordNet directly. 

This module doesn't download and install the WordNet files, because there are 
several versions and it feels impolite to download and install one for you. 

For easy use, therefore, it might be best to add both this module and a WordNet 
data module to your project, e.g.:

```
npm install node-wordnet --save
npm install wndb-with-exceptions --save
```

API
---

### new WordNet([options | string])

The constructor returns a new object to access a WordNet database. The passed 
options configure the interface. The following options are available:

 *  __dataDir__ -- specifies the location of the Wordnet directory. 

    If this option isn't passed, the module uses `require` to locate 
    `wndb-with-exceptions`, so if you don't want to deploy your own WordNet, all you
    need to do is add `wndb-with-exceptions` as an application dependency and not 
    pass a directory to the constructor. 
    The original WordNet data files can always be manually downloaded and installed
    anywhere from http://wordnet.princeton.edu/wordnet/download. 

    As a shortcut, if you pass a string directly to the constructor, it's interpreted
    as a Wordnet directory, and all other options default in sensible ways. 

 *  __cache__ -- adds an LRU cache to the Wordnet access.

    If the option is false, no cache is set; and if it is true, then a cache (using
    `lru-cache` with a default size of 2000 items) is set. In addition, the cache can be
    an object. If that object has a `get` method then it's used as a cache directly, and 
    if it doesn't, it's assumed to be a configuration object which will be used to 
    configure a new `lru-cache`.


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

### querySense(query, callback)

Queries WordNet to find all the senses of a given word, optionally with a 
part-of-speech. 

```javascript
var wordnet = new WordNet()
wordnet.querySense('axes#n', console.log);
```

### querySenseAsync(query)

Similar to `querySense(query, callback)` but returning a promise.


### close()

Closes all the file handles being used by this instance. If new queries are
done, the files may be silently re-opened, but that probably isn't a very good
plan. It should be assumed that re-use of an instance after close is
deprecated. 


Future work
-----------

Error handling needs to be tightened a fair bit, and there is plenty of room to make the API a bit 
easier to use as well. 