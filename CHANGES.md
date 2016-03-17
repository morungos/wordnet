Release history
===============


Version 0.1.12
--------------

 * Fixed an issue with data structures being incorrectly modified - #16


Version 0.1.11
--------------

 * Added support for an error flag in the callbacks for all endpoints
 * Promisified endpoints will reject on error


Version 0.1.10
--------------

 * Total rewrite of the object inheritance for files
 * Added a working .close() method - #13
 * Partial work on improving error handling - #8


Version 0.1.9
-------------

 * Corrected an issue with underscores/spaces in terms - #10


Version 0.1.8
-------------

 * Added an optional LRU cache


Version 0.1.7
-------------

 * Fixed a bug in reading data that extends beyond a single block


Version 0.1.6
-------------

 * Fixed a bug in validForms when used without a part of speech


Version 0.1.5
-------------

 * Added the querySense method


Version 0.1.4
-------------

 * Changed to setImmediate to avoid recursive process.nextTick


Version 0.1.3
-------------

 * Fixed asynchronous loading of exceptions - #3


Version 0.1.2
-------------

 * Initial release
