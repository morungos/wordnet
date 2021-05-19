Wordnet
=======

This is an implementation of a Wordnet API in pure JavaScript. It was initially
written as a replacement of the WordNet code in [NaturalNode/natural](https://github.com/NaturalNode/natural), 
which was hard to use for higher-level tasks. It provides a simple set of query
functions that allow lookups against a WordNet database of your choice.

Usage
-----

You'll need a copy of WordNet. There are several on Github, but for full functionality,
at least for now, I'd suggest using the npm package: `wndb-with-exceptions`, available at:
[https://github.com/morungos/WNdb-with-exceptions](https://github.com/morungos/WNdb-with-exceptions), 
as it includes the morphological exception lists needed by `validForms`. If you don't care about that, 
you can get by with [https://github.com/moos/WNdb](https://github.com/moos/WNdb), or even 
download WordNet directly.

This module doesn't download and install the WordNet files, because there are
several versions and it feels impolite to download and install one for you.

For easy use, therefore, it might be best to add both this module and a WordNet
data module to your project, e.g.:

```
npm install node-wordnet --save
npm install wndb-with-exceptions --save
```

The main API
------------

### new WordNet([options | string])

The constructor returns a new object to access a WordNet database. The passed
options configure the interface. The following options are available:

 *  __dataDir__ -- specifies the location of the Wordnet directory.

    If this option isn't passed, the module uses `require` to locate
    `wndb-with-exceptions`, so if you don't want to deploy your own WordNet, all you
    need to do is add `wndb-with-exceptions` as an application dependency and not
    pass a directory to the constructor.
    The original WordNet data files can always be manually downloaded and installed
    anywhere from [http://wordnet.princeton.edu/wordnet/download](http://wordnet.princeton.edu/wordnet/download).

    As a shortcut, if you pass a string directly to the constructor, it's interpreted
    as a Wordnet directory, and all other options default in sensible ways.

 *  __cache__ -- adds an LRU cache to the Wordnet access.

    If the option is false, no cache is set; and if it is true, then a cache (using
    `lru-cache` with a default size of 2000 items) is set. In addition, the cache can be
    an object. If that object has a `get` method then it's used as a cache directly, and
    if it doesn't, it's assumed to be a configuration object which will be used to
    configure a new `lru-cache`. Benchmarks suggest that even this small cache improves
    performance by a factor of 100 or so.


### open()

Opens all access to the WordNet database. Queries will fail until this has 
resolved. It returns a promise that resolves when the database is ready for 
use. 

### lookup(word)

Here's an example of looking up definitions for the word, "node". Returns
a Promise resolving to the results.

```javascript
const wordnet = new WordNet()
wordnet.open()
  .then(() => wordnet.lookup('node'))
  .then((results) => {
    results.forEach((result) => {
      console.log('------------------------------------');
      console.log(result.synsetOffset);
      console.log(result.pos);
      console.log(result.lemma);
      console.log(result.synonyms);
      console.log(result.pos);
      console.log(result.gloss);
    });
  })
  .then(() => wordnet.close());
```

### get(offset, pos)

Given a synset offset and a part of speech, a definition can be looked up directly.

```javascript
wordnet.get(4424418, 'n')
  .then((result) => {
    console.log('------------------------------------');
    console.log(result.lemma);
    console.log(result.pos);
    console.log(result.gloss);
    console.log(result.synonyms);
  });
```

### validForms(word)

Returns a promise that resolves to valid morphological exceptions. 

```javascript
wordnet.validForms('axes#n')
  .then(console.log);
```

### querySense(query)

Queries WordNet to find all the senses of a given word, optionally with a
part-of-speech. 

```javascript
wordnet.querySense('axes#n').then(console.log);
```

### findSense(query)

Queries WordNet to find full information on a single sense of a term. 

```javascript
wordnet.findSense('lie#v#1').then(console.log);
```

### close()

Closes all the file handles being used by this instance. If new queries are
done, the files may be silently re-opened, but that probably isn't a very good
plan. Re-use of an instance after close is deprecated.
