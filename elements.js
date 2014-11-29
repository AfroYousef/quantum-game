// require helpers.js


Elements = {};


Elements.Vacuum = function () {

  // to all elements:
  // some var self = this, to get no problems in functions? 
  
  this.flavor = "Pure timespace without relativistic energy density.";

  this.g = null;
  this.name = "vacuum";
  this.type = "unitary";
  this.rotation = 0;

  this.rotate = function () {
    console.log("Element " + this.name + " is not rotable!");
  };

  this.draw = function () {};

  this.amplitudes = [smIdentityFull];  // copy?

}


Elements.CornerCube = function () {

  this.flavor = "Like a mirrot but cooler. It rotates you, not - reflects.";

  this.g = null;
  this.name = "corner_cube";
  this.type = "unitary";
  this.rotation = 0;

  this.rotate = function () {
    console.log("Element " + this.name + " is not rotable!");
  };

  this.draw = function () {};

  var amplitudesDirection = [{
    '>': [{to: '<', re: 1, im: 0}],
    '^': [{to: 'v', re: 1, im: 0}],
    '<': [{to: '>', re: 1, im: 0}],
    'v': [{to: '^', re: 1, im: 0}],
  }];

  this.amplitudes = amplitudesDirection
    .map(function (each) { return transitionTensor(each, smIdentityPolarization); });
  // check it with circular polarization

}


// magical thin mirror that is easy for implementation (no decoherence!)
Elements.ThinMirror = function () {

  this.flavor = "Works both ways [like 13]. So thin that it can serve as a pad... I mean iPad.";

  this.g = null;
  this.name = "thin_mirror";
  this.type = "unitary";
  this.rotation = 0;  // 0: - 1: / 2: | 3: \

  this.rotate = function () {
    this.rotation = (this.rotation + 1) % 4;
  };

  this.draw = function () {};

  var amplitudesDirection =
  [
    // -
    { 
      '>': [{to: '>', re: 1, im: 0}],
      '^': [{to: 'v', re: 1, im: 0}],
      '<': [{to: '<', re: 1, im: 0}],
      'v': [{to: '^', re: 1, im: 0}],
    },
    // /
    {
      '>': [{to: '^', re: 1, im: 0}],
      '^': [{to: '>', re: 1, im: 0}],
      '<': [{to: 'v', re: 1, im: 0}],
      'v': [{to: '<', re: 1, im: 0}],
    },
    // |
    {
      '>': [{to: '<', re: 1, im: 0}],
      '^': [{to: '^', re: 1, im: 0}],
      '<': [{to: '>', re: 1, im: 0}],
      'v': [{to: 'v', re: 1, im: 0}],
    },
    // \
    {
      '>': [{to: 'v', re: 1, im: 0}],
      '^': [{to: '<', re: 1, im: 0}],
      '<': [{to: '^', re: 1, im: 0}],
      'v': [{to: '>', re: 1, im: 0}],
    },
  ];

  this.amplitudes = amplitudesDirection
    .map(function (each) { return transitionTensor(each, smReflectionPhasePolarization); });

}

 
Elements.ThinBeamSplitter = function () {

  // it is also possible to create it as a superposition:
  // ~ (vacuum  + i * thin_mirror)
  // helpers for linear operations on sparse matrices

  this.flavor = "Making photons in two places at once. And binding them again.";

  this.g = null;
  this.name = "thin_beam_splitter";
  this.type = "unitary";
  this.rotation = 0;  // 0: - 1: / 2: | 3: \

  this.rotate = function () {
    this.rotation = (this.rotation + 1) % 4;
  };

  this.draw = function () {};

  // TO FIX!
  var amplitudesDirection =
  [
    // -
    { 
      '>': [{to: '>', re: 1, im: 0}],
      '^': [{to: '^', re: sq2inv, im: 0}, {to: 'v', re: 0, im: sq2inv}],
      '<': [{to: '<', re: 1, im: 0}],
      'v': [{to: 'v', re: sq2inv, im: 0}, {to: '^', re: 0, im: sq2inv}],
    },
    // /
    {
      '>': [{to: '>', re: sq2inv, im: 0}, {to: '^', re: 0, im: sq2inv}],
      '^': [{to: '^', re: sq2inv, im: 0}, {to: '>', re: 0, im: sq2inv}],
      '<': [{to: '<', re: sq2inv, im: 0}, {to: 'v', re: 0, im: sq2inv}],
      'v': [{to: 'v', re: sq2inv, im: 0}, {to: '<', re: 0, im: sq2inv}],
    },
    // |
    {
      '>': [{to: '>', re: sq2inv, im: 0}, {to: '<', re: 0, im: sq2inv}],
      '^': [{to: '^', re: 1, im: 0}],
      '<': [{to: '<', re: sq2inv, im: 0}, {to: '>', re: 0, im: sq2inv}],
      'v': [{to: 'v', re: 1, im: 0}],
    },
    // \
    {
      '>': [{to: '>', re: sq2inv, im: 0}, {to: 'v', re: 0, im: sq2inv}],
      '^': [{to: '^', re: sq2inv, im: 0}, {to: '<', re: 0, im: sq2inv}],
      '<': [{to: '<', re: sq2inv, im: 0}, {to: '^', re: 0, im: sq2inv}],
      'v': [{to: 'v', re: sq2inv, im: 0}, {to: '>', re: 0, im: sq2inv}],
    },
  ];

  // damn it, this thing is not as simple;
  // the only reflected thing are reflections, not - transmittions
  // this thing with sparse linear operations would 
  this.amplitudes = amplitudesDirection
    .map(function (each) { return transitionTensor(each, smReflectionPhasePolarization); });

  // WARNING: propagation alone should not change phases

}


Elements.PolarizingBeamSplitter = function () {

  this.flavor = "It separates ones how wave up and down from ones waving left and right.\n"
                + "Like religion-politics separation.";

  this.g = null;
  this.name = "polarizing_beam_splitter";
  this.type = "unitary";
  this.rotation = 0;  // 0: [/] 1: [\]

  this.rotate = function () {
    this.rotation = (this.rotation + 1) % 2;
  };

  this.draw = function () {};

  // double check if this polarization
  // I assumed that - is being reflected and | just passes
  this.amplitudes =
  [
    // [/]
    {
      '>-': [{to: '^-', re: 1, im: 0}],
      '^-': [{to: '>-', re: 1, im: 0}],
      '<-': [{to: 'v-', re: 1, im: 0}],
      'v-': [{to: '<-', re: 1, im: 0}],
      '>|': [{to: '>|', re: 1, im: 0}],
      '^|': [{to: '^|', re: 1, im: 0}],
      '<|': [{to: '<|', re: 1, im: 0}],
      'v|': [{to: 'v|', re: 1, im: 0}],
    },
    // [\]
    {
      '>-': [{to: 'v-', re: 1, im: 0}],
      '^-': [{to: '<-', re: 1, im: 0}],
      '<-': [{to: '^-', re: 1, im: 0}],
      'v-': [{to: '>-', re: 1, im: 0}],
      '>|': [{to: '>|', re: 1, im: 0}],
      '^|': [{to: '^|', re: 1, im: 0}],
      '<|': [{to: '<|', re: 1, im: 0}],
      'v|': [{to: 'v|', re: 1, im: 0}],
    },
  ];

}


// Elements.SugarSolution
//// "Vodka is a solution. But Sugar Solution is the sweetest solution."
// Elements.FaradayRotor
//// "You can go back, but it won't be the same."
// Elements.HalfWavePlate
// Elements.QuarterWavePlate
// Elements.PolarizingBeamSplitter