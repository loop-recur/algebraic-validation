var assert = require('chai').assert;
var claire = require('claire');
var gens = claire.data;
var K = function(x){return function(y){return x}};
var I = function(x){return x};
var B = function(f){return function(g){return function(x){return f(g(x))}}};

var Validation = require('../validation');
var Success = Validation.Success;
var Failure = Validation.Failure;

var val = claire.sized(K(10), gens.Array(gens.Str));
var successGen = claire.transform(Success, val);
var failureGen = claire.transform(Failure, val);
var validGen = claire.choice(successGen, failureGen);

describe('concat', function(){
  it('is associative',
    claire.forAll(validGen, validGen, validGen).satisfy(function(v1, v2, v3){
      assert.deepEqual(v1.concat(v2.concat(v3)), v1.concat(v2).concat(v3));
      return true;
    }).asTest()
  );

  it('chooses the last of two success values',
    claire.forAll(successGen, successGen).satisfy(function(s1, s2){
      assert.deepEqual(s1.concat(s2), s2);
      return true;
    }).asTest()
  );

  it('returns a failure over a success',
    claire.forAll(successGen, failureGen).satisfy(function(s, f){
      assert.deepEqual(s.concat(f), f);
      assert.deepEqual(f.concat(s), f);
      return true;
    }).asTest()
  );

  it('concats two failure values',
    claire.forAll(failureGen, failureGen).satisfy(function(f1, f2){
      assert.deepEqual(f1.concat(f2).value, f1.value.concat(f2.value));
      return true;
    }).asTest()
  );
});

describe('of', function(){
  it('is Success', function(){ assert.equal(Validation.of, Success) });
});

var drop1 = function(a){ return a.length ? a.slice(1) : a; }
var isEmpty = function(a){ return !a.length; }

describe('map', function(){
  it('obeys identity', claire.forAll(validGen).satisfy(function(v){
    assert.deepEqual(v.map(I), v);
    return true;
  }).asTest());

  it('obeys composition', claire.forAll(validGen).satisfy(function(v){
    assert.deepEqual(v.map(B(isEmpty)(drop1)), v.map(drop1).map(isEmpty));
    return true;
  }).asTest());

  it('maps the inner value of a success',
    claire.forAll(successGen).satisfy(function(s){
      assert.deepEqual(s.map(drop1).value, drop1(s.value));
      return true;
    }).asTest()
  );

  it('is no-op with a failure', claire.forAll(failureGen).satisfy(function(f){
    assert.deepEqual(f.map(drop1).value, f.value);
    return true;
  }).asTest());
});

describe('ap', function(){
  it('obeys homomorphism', claire.forAll(val).satisfy(function(x){
    assert.deepEqual(Success(drop1).ap(Success(x)), Success(drop1(x)));
    return true;
  }).asTest());

  it('obeys interchange',
    //wrap success and failure in arrays, otherwise claire treats them as
    //generators and invokes them with a size hint to get a value.
    claire.forAll(claire.choice([Success], [Failure]), val).satisfy(function(c, x){
      var u = c[0](drop1);
      assert.deepEqual(u.ap(Success(x)), Success(function(f){return f(x)}).ap(u));
      return true;
    }).asTest()
  );
});

describe('chain', function(){
  var mDrop1 = B(Success)(drop1);
  var mEmpty = B(Success)(isEmpty);

  it('is associative', claire.forAll(validGen).satisfy(function(v){
    assert.deepEqual(v.chain(mDrop1).chain(mEmpty),
      v.chain(function(x){return mDrop1(x).chain(mEmpty)})
    );
    return true;
  }).asTest());

  it('has left identity', claire.forAll(val).satisfy(function(x){
    assert.deepEqual(Success(x).chain(mDrop1), mDrop1(x));
    return true;
  }).asTest());

  it('has right identity', claire.forAll(validGen).satisfy(function(v){
    assert.deepEqual(v.chain(Success), v);
    return true;
  }).asTest());

  it('flatmaps a success', claire.forAll(successGen).satisfy(function(s){
    assert.deepEqual(s.chain(mDrop1).value, drop1(s.value));
    return true;
  }).asTest());

  it('is a no-op for failure', claire.forAll(failureGen).satisfy(function(f){
    assert.deepEqual(f.chain(mDrop1), f);
    return true;
  }).asTest());
});
