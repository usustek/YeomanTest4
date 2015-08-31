'use strict';

describe('Service: ShareData', function () {

  // load the service's module
  beforeEach(module('yeomanTest4App'));

  // instantiate service
  var ShareData;
  beforeEach(inject(function (_ShareData_) {
    ShareData = _ShareData_;
  }));

  it('should do something', function () {
    expect(!!ShareData).toBe(true);
  });

});
