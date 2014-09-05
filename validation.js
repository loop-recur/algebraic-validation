function Validation() {};
function I(x){return x};

function Success(val) {
  if(this instanceof Success){
    this.value = val;
  } else {
    return new Success(val);
  }
}
Success.prototype = new Validation();
Success.prototype.is_success = true;
Success.prototype.is_failure = false;
Success.prototype.chain = function(f){
  return f(this.value);
}
Success.prototype.concat = function(other){ return other; };
Success.prototype.traverse = function(f, pure) {
  return f(this.value).map(Success);
};

//Failure's argument must be a semigroup (have a valid concat function)
function Failure(val) {
  if(this instanceof Failure){
    this.value = val;
  } else {
    return new Failure(val);
  }
}
Failure.prototype = new Validation();
Failure.prototype.is_success = false;
Failure.prototype.is_failure = true;
Failure.prototype.chain = function(f){ return this; }
Failure.prototype.concat = function(other){
  return other.is_success ? this :
    new Failure(this.value.concat(other.value));
};
Failure.prototype.traverse = function(f, pure) { return pure(this); };

Validation.prototype.of = Validation.of = Failure.of = Success.of = Success;
Validation.prototype.map = function(f) {
  var v = this;
  return v.chain(function(a) { return new Success(f(a)); })
};
Validation.prototype.ap = function(v){
  return this.chain(function(f){return v.map(f)});
};
Validation.prototype.join = function(){
  return this.chain(I);
};
Validation.prototype.sequence = function(of){
  return this.traverse(I, of);
};
Validation.Success = Success;
Validation.Failure = Failure;

module.exports = Validation;
