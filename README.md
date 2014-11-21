validation-algebra
==================

Semigroup + Monad for doing validations in Javascript

Installation
------------

### Node
`npm install validation-algebra`

then

`var Validation = require('validation-algebra');`

### AMD

forthcoming...

Usage
----

A typical action that requires validation of user input follows follows these
steps:

1. Check for input errors and collect all of them into a single summary.
2. If there are no errors, run an action on the input and get a result.
3. Send the result of 1 (if there were errors) or 2 (if there were no errors)
   back to the client.

This library provides a simple algebra conforming to the
[fantasy land semigroup](https://github.com/fantasyland/fantasy-land#semigroup)
and [fantasy land monad](https://github.com/fantasyland/fantasy-land#monad)
specifications to help make the above steps a little easier. It goes
something like this.

```javascript
var Succ = Validation.Success;
var Fail = Validation.Failure;
function createUser(input) {
  return (
    input.name ? Succ(input) : Fail(["Name must not be blank"])
  ).concat(
    isValidEmail(input.email) ? Succ(input) : Fail(["Email must be a valid"])
  ).concat(
    isOneOf(input.gender, ['male', 'female', 'both', 'undead', 'other']) ?
      Succ(input) :
      Fail(['Gender must be one of "male", "female", "both", "undead", or "other."'])
  ).concat(
    input.gender == 'undead' && input.occupation ?
      Fail(['Occupation is not available for the undead.']) :
      Succ(input)
  ).map(function(input){
    return saveUser(input);
  });
}
```

Collecting any errors that do occur in step 1 is handled by `concat`.
Step 2 and 3 are both handled by `map`, `chain`, and `ap`, which all run
a function on success and short circuit and return the error description
on a failure.

### Interface

All functions and methods documented below are referencially transparent:
they return new values, and do not mutate their input or have any other
side effects. They all return values that are an `instanceof Validation`.

- `Validation.Success(value)`: A constructor function that returns a
  successful validation containing the `value`. Can be used with or without
  `new`.

- `Validation.Failure(value)`: A constructor that returns a failed validation,
  where `value` is a description of the error in a semigroup (ie, with an
  associative `concat` method, eg an Array). Like `Success`, can be used
  with or without `new`.

- `Validation.of(value), validationInstance.of(value)`: Aliases for `Success`.

- `instance.is_success`: `true` if the `instance` is a success. Always
  `instance.is_success === !instance.is_failure`

- `instance.concat(otherInstance)`: If one instance is a success, and the
  other is a failure, the failure is returned. If both are success,
  `otherInstance` is returned. When both are failures a new failure
  containing the concatenation of the two error values is
  returned.

- `instance.map(function(value){/*transform the success value*/})`:
  When `instance.is_success`, runs the function with `instance`'s value
  and create a new `Success` of the result. When `instance.is_failure`,
  return `instance`.

- `instanceWithFunction.ap(instanceWithArg)`: When both instances are success,
  it applies the function in the first instance to the arg in the second.
  Otherwise, returns the first failure (the function failure precedes the arg).

- `instance.chain(function(value){/*transform value into a new Validation*/}:
  `map`s the given `Validation` generating function, then flattens the
  nested validation. Like `map`, this simply returns `instance` if it
  `is_failure`.

- `instanceOfA.sequence(A.of)`: Assuming `instanceOfA` is a validation
  with another applicative `A` inside (say, an `Array`), `sequence` tranforms
  it to an `A` of a `Validation` (eg, transforms a `Validation` of an `Array`
  to an `Array` of `Validation`s).

- `instance.traverse(f, fOf)`: First `map`s `f` over `instance`, then
  `sequence`s the result.

#### Using sequence and traverse with Promises

Most Promise libaries do not implement an interface that allows them to be
sequenced/traversed with a `Validation`. For this reason I recommend using
[data.future](https://github.com/folktale/data.future). But suppose you don't
have this option, or you prefer Promises for some reason. Here's how you can
make them work with `traverse` and `sequence`. For concreteness, I'll
illustrate using [bluebird](https://github.com/petkaantonov/bluebird).

```javascript
var Promise = require('bluebird');
//traverse and sequence both rely on the internal functor having a
//valid map.
Promise.prototype.map = Promise.prototype.then;
function f(data){/*return some promise*/};
var promiseOfValidaton = validation.traverse(f, Promise.resolve);
//or
var vOfP = /*a validation of a promise somehow*/;
var promiseOfValidaton = vOfP.sequence(Promise.resolve);
```

Algebraic JS
------------

`Validation`s form a semigroup and a monad, and conforms to the
[fantasy land specification](https://github.com/fantasyland/fantasy-land)
for semigroup and monad (as well as all the generalizations of monad, such
as chain, applicative, functor, etc).

![](logo.png)

License
-------

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

The software is provided "as is", without warranty of any kind,
express or implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose and noninfringement.
In no event shall the authors be liable for any claim, damages or
other liability, whether in an action of contract, tort or otherwise,
arising from, out of or in connection with the software or the use or
other dealings in the software.

For more information, please refer to http://unlicense.org/
