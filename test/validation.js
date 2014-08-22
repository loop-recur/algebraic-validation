var assert = require('chai').assert;
var claire = require('claire');
var gens = claire.data;
var K = function(x){return function(y){return x}};

var Validation = require('../validation');
var Success = Validation.Success;
var Failure = Validation.Failure;

var SuccessGen = claire.transform(Success, claire.sized(K(10), gens.Any));
var ErrGen = claire.sized(K(10), gens.Array(gens.Str));
var FailureGen = claire.transform(Failure, ErrGen);
var ValidGen = claire.choice(SuccessGen, FailureGen);

describe('concat', function(){
  it('is associative',
    claire.forAll(ValidGen, ValidGen, ValidGen).satisfy(function(v1, v2, v3){
      assert.deepEqual(v1.concat(v2.concat(v3)), v1.concat(v2).concat(v3));
      return true;
    }).asTest()
  );

  it('chooses the last of two success values',
    claire.forAll(SuccessGen, SuccessGen).satisfy(function(s1, s2){
      assert.deepEqual(s1.concat(s2), s2);
      return true;
    }).asTest()
  );

  it('returns a failure over a success',
    claire.forAll(SuccessGen, FailureGen).satisfy(function(s, f){
      assert.deepEqual(s.concat(f), f);
      assert.deepEqual(f.concat(s), f);
      return true;
    }).asTest()
  );

  it('concats two failure values',
    claire.forAll(FailureGen, FailureGen).satisfy(function(f1, f2){
      assert.deepEqual(f1.concat(f2).value, f1.value.concat(f2.value));
      return true;
    }).asTest()
  );
});
