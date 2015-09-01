'use strict';

describe('Service: busData', function () {

  // load the service's module
  beforeEach(module('yeomanTest4App'));

  // instantiate service
  var busData;
  beforeEach(inject(function (_busData_) {
    busData = _busData_;
  }));

  it('should do something', function () {
    expect(!!busData).toBe(true);
  });

});
