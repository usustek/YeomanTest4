'use strict';

describe('Controller: FindCtrl', function () {

  // load the controller's module
  beforeEach(module('yeomanTest4App'));

  var FindCtrl;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    FindCtrl = $controller('FindCtrl', {
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(FindCtrl.awesomeThings.length).toBe(3);
  });
});
