/* eslint max-len: [2, 140] */
define(['util/Util', 'util/Logger'], function (Util, Logger) {

  describe('util/Util', function () {

    describe('transformErrorXHR', function () {
      it('errorSummary shows network connection error when status is 0', function () {
        var xhr = {
          'status': 0
        };
        Util.transformErrorXHR(xhr);
        expect(xhr.responseJSON.errorSummary).toEqual('Unable to connect to the server. Please check your network connection.');
      });
      it('errorSummary shows internal error when there are no responseJSON and no responseText', function () {
        var xhr = {
          'status': 400
        };
        Util.transformErrorXHR(xhr);
        expect(xhr.responseJSON.errorSummary).toEqual('There was an unexpected internal error. Please try again.');
      });
      it('errorSummary is set from responseText when there is no responseJSON', function () {
        var responseText = '{"errorSummary": "errorSummary from responseText"}';
        var xhr = {
          'status': 400,
          'responseText': responseText
        };
        Util.transformErrorXHR(xhr);
        expect(xhr.responseJSON.errorSummary).toEqual('errorSummary from responseText');
      });
      it('If there is an errorCauses array and there is no error code, get errorSummary from errorCauses array', function () {
        var errorCauses = [{
          'errorSummary': 'errorSummary from errorCauses'
        }];
        var xhr = {
          'status': 400,
          'responseJSON': {
            'errorCauses': errorCauses
          }
        };
        Util.transformErrorXHR(xhr);
        expect(xhr.responseJSON.errorSummary).toEqual('errorSummary from errorCauses');
        expect(xhr.responseJSON.errorCauses).toBe(errorCauses);
      });
      it('If there is an errorCauses array and there is an invalid error code, get errorSummary from errorCauses array', function () {
        var errorCauses = [{
          'errorSummary': 'errorSummary from errorCauses'
        }];
        var xhr = {
          'status': 400,
          'responseJSON': {
            'errorCauses': errorCauses,
            'errorCode': 'E01212AB'
          }
        };
        Util.transformErrorXHR(xhr);
        expect(xhr.responseJSON.errorSummary).toEqual('errorSummary from errorCauses');
        expect(xhr.responseJSON.errorCauses).toBe(errorCauses);
      });
      it('If there is a valid error code, get errorSummary from that and delete errorCauses array', function () {
        var errorCauses = [{
          'errorSummary': 'errorSummary from errorCauses'
        }];
        var xhr = {
          'status': 400,
          'responseJSON': {
            'errorCauses': errorCauses,
            'errorCode': 'E0000017'
          }
        };
        Util.transformErrorXHR(xhr);
        expect(xhr.responseJSON.errorSummary).toEqual('Password reset failed');
        expect(xhr.responseJSON.errorCauses).not.toBeDefined();
      });
    });

    describe('expandLanguages', function () {
      it('works with an empty array', function () {
        var languages = [],
            expected = [];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
      it('works in the default "en" case', function () {
        var languages = ['en'],
            expected = ['en'];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
      it('expands with 2 parts (regions) in the correct order', function () {
        var languages = ['pt-BR'],
            expected = ['pt-BR', 'pt'];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
      it('expands when there are 3 parts (regions+dialects) in the correct order', function () {
        var languages = ['de-DE-bavarian'],
            expected = ['de-DE-bavarian', 'de-DE', 'de'];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
      it('returns a flattened array with multiple languages', function () {
        var languages = ['en', 'pt-BR', 'ja', 'zh-CN'],
            expected = ['en', 'pt-BR', 'pt', 'ja', 'zh-CN', 'zh'];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
      it('filters out any duplicates that are generated', function () {
        var languages = ['en-US', 'en'],
            expected = ['en-US', 'en'];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
      it('filters out duplicates that are passed in (correct order)', function () {
        var languages = ['en-US', 'ja', 'en'],
            expected = ['en-US', 'en', 'ja'];
        expect(Util.expandLanguages(languages)).toEqual(expected);
      });
    });

    describe('toLower', function () {
      it('lowercases all string entries in a given array', function () {
        var arr = ['Hi', 'THERE', 'i', 'wOUld'],
            expected = ['hi', 'there', 'i', 'would'];
        expect(Util.toLower(arr)).toEqual(expected);
      });
    });

    describe('debugMessage', function () {
      it('formats template literal strings into a consistent format', function () {
        var debugMessage = `
          Multi-line
          String
          Message
        `;
        // Remove all prior tracking of Spy
        Logger.warn.calls.reset();
        Util.debugMessage(debugMessage);
        expect(Logger.warn).toHaveBeenCalledWith('\nMulti-line\nString\nMessage\n');
      });
    });

    describe('filterOAuthParams', function () {
      it('returns top-level configuration if no overrides are provided', function () {
        var config = {
          baseUrl: 'foo',
          authParams: {
            bar: 'bazz'
          }
        };

        expect(Util.filterOAuthParams({}, config)).toEqual({
          baseUrl: 'foo',
          authParams: {
            bar: 'bazz'
          }
        });
      });

      it('overrides top-level configuration when overrides are provided', function () {
        var config = {
          baseUrl: 'foo',
          authParams: {
            bar: 'bazz'
          }
        };
        var options = {
          baseUrl: 'bazz',
          bar: 'foo'
        };
        expect(Util.filterOAuthParams(options, config)).toEqual({
          baseUrl: 'bazz',
          authParams: {
            bar: 'foo'
          }
        });
      });

      it('updates the responseType given getAccessToken and getIdToken keys', function () {
        var config = {
          baseUrl: 'foo'
        };
        var options = {
          getAccessToken: true,
          getIdToken: true
        };
        expect(Util.filterOAuthParams(options, config)).toEqual({
          baseUrl: 'foo',
          authParams: {
            responseType: ['token', 'id_token']
          }
        });
      });

      it('returns a complex object, overriding the basic Widget configuration option', function () {
        var config = {
          baseUrl: 'foo',
          clientId: 'cid',
          authParams: {
            responseType: ['id_token'],
            scopes: ['openid']
          }
        };
        var options = {
          getAccessToken: true,
          oAuthTimeout: 3000,
          scopes: ['openid', 'profile'],
          clientId: 'bar',
          display: 'page'
        };
        var renderOptions = Util.filterOAuthParams(options, config);

        // Verify object contains all the following key/value pairs
        expect(renderOptions).toEqual(jasmine.objectContaining({ baseUrl: 'foo' }));
        expect(renderOptions).toEqual(jasmine.objectContaining({ clientId: 'bar' }));
        expect(renderOptions).toEqual(jasmine.objectContaining({ oAuthTimeout: 3000 }));
        expect(renderOptions.authParams).toEqual(jasmine.objectContaining({
          // 'token' should sppear second in the list - since it was added after the initial 'id_token'
          responseType: ['id_token', 'token'],
          scopes: ['openid', 'profile'],
          display: 'page'
        }));
      });
    });

  });

});
