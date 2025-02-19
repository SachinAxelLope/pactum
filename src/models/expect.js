const assert = require('assert');
const jqy = require('json-query');

const config = require('../config');
const utils = require('../helpers/utils');
const file = require('../helpers/file.utils');
const log = require('../exports/logger').get();
const Compare = require('../helpers/compare');
const processor = require('../helpers/dataProcessor');
const handler = require('../exports/handler');
const jsv = require('../plugins/json.schema');
const jmv = require('../plugins/json.match');

class Expect {

  constructor() {
    this.name = null;
    this.updateSnapshot = false;
    this.statusCode = null;
    this.body = null;
    this.bodyContains = [];
    this.json = [];
    this.jsonQuery = [];
    this.jsonLike = [];
    this.jsonQueryLike = [];
    this.jsonSchema = [];
    this.jsonSchemaQuery = [];
    this.jsonMatch = [];
    this.jsonMatchQuery = [];
    this.jsonMatchStrict = [];
    this.jsonMatchStrictQuery = [];
    this.jsonSnapshot = [];
    this.headers = [];
    this.headerContains = [];
    this.responseTime = null;
    this.customExpectHandlers = [];
    this.errors = [];
  }

  validate(request, response) {
    this._validateStatus(response);
    this._validateHeaders(response);
    this._validateHeaderContains(response);
    this._validateBody(response);
    this._validateBodyContains(response);
    this._validateJson(response);
    this._validateJsonLike(response);
    this._validateJsonQuery(response);
    this._validateJsonQueryLike(response);
    this._validateJsonSchema(response);
    this._validateJsonSchemaQuery(response);
    this._validateJsonMatch(response);
    this._validateJsonMatchQuery(response);
    this._validateJsonMatchStrict(response);
    this._validateJsonMatchStrictQuery(response);
    this._validateJsonSnapshot(response);
    this._validateResponseTime(response);
    this._validateErrors(response);
    // for asynchronous expectations
    return this._validateCustomExpectHandlers(request, response);
  }

  validateInteractions(interactions) {
    for (let i = 0; i < interactions.length; i++) {
      const interaction = interactions[i];
      const expects = interaction.expects;
      const intReq = {
        method: interaction.request.method,
        path: interaction.request.path,
        headers: interaction.request.headers,
        body: interaction.request.body
      };
      if (expects.exercised && !interaction.exercised) {
        log.warn('Interaction Not Exercised', intReq);
        this.fail(`Interaction not exercised: ${interaction.request.method} - ${interaction.request.path}`);
      }
      if (!expects.exercised && interaction.exercised) {
        log.warn('Interaction got Exercised', intReq);
        this.fail(`Interaction exercised: ${interaction.request.method} - ${interaction.request.path}`);
      }
      if (typeof expects.callCount !== 'undefined') {
        if (expects.callCount !== interaction.callCount) {
          this.fail(`Interaction call count ${interaction.callCount} !== ${expects.callCount} for ${interaction.request.method} - ${interaction.request.path}`);
        }
      }
    }
  }

  _validateStatus(response) {
    this.statusCode = processor.processData(this.statusCode);
    if (this.statusCode !== null) {
      assert.strictEqual(response.statusCode, this.statusCode, `HTTP status ${response.statusCode} !== ${this.statusCode}`);
    }
  }

  _validateHeaders(response) {
    this.headers = processor.processData(this.headers);
    for (let i = 0; i < this.headers.length; i++) {
      const expectedHeaderObject = this.headers[i];
      const expectedHeader = expectedHeaderObject.key;
      const expectedHeaderValue = expectedHeaderObject.value;
      if (!(expectedHeader in response.headers)) {
        this.fail(`Header '${expectedHeader}' not present in HTTP response`);
      }
      if (expectedHeaderValue !== undefined) {
        const actualHeaderValue = response.headers[expectedHeader];
        if (expectedHeaderValue instanceof RegExp) {
          if (!expectedHeaderValue.test(actualHeaderValue)) {
            this.fail(`Header regex (${expectedHeaderValue}) did not match for header '${expectedHeader}': '${actualHeaderValue}'`);
          }
        } else {
          if (expectedHeaderValue.toLowerCase() !== actualHeaderValue.toLowerCase()) {
            this.fail(`Header value '${expectedHeaderValue}' did not match for header '${expectedHeader}': '${actualHeaderValue}'`);
          }
        }
      }
    }
  }

  _validateHeaderContains(response) {
    this.headerContains = processor.processData(this.headerContains);
    for (let i = 0; i < this.headerContains.length; i++) {
      const expectedHeaderObject = this.headerContains[i];
      const expectedHeader = expectedHeaderObject.key;
      const expectedHeaderValue = expectedHeaderObject.value;
      if (!(expectedHeader in response.headers)) {
        this.fail(`Header '${expectedHeader}' not present in HTTP response`);
      }
      if (expectedHeaderValue !== undefined) {
        const actualHeaderValue = response.headers[expectedHeader];
        if (expectedHeaderValue instanceof RegExp) {
          if (!expectedHeaderValue.test(actualHeaderValue)) {
            this.fail(`Header regex (${expectedHeaderValue}) did not match for header '${expectedHeader}': '${actualHeaderValue}'`);
          }
        } else {
          if (!actualHeaderValue.toLowerCase().includes(expectedHeaderValue.toLowerCase())) {
            this.fail(`Header value '${expectedHeaderValue}' did not match for header '${expectedHeader}': '${actualHeaderValue}'`);
          }
        }
      }
    }
  }

  _validateBody(response) {
    this.body = processor.processData(this.body);
    if (this.body !== null) {
      assert.deepStrictEqual(response.body, this.body);
    }
  }

  _validateBodyContains(response) {
    this.bodyContains = processor.processData(this.bodyContains);
    for (let i = 0; i < this.bodyContains.length; i++) {
      const expectedBodyValue = this.bodyContains[i];
      let expected = expectedBodyValue;
      if (expected && typeof expected === 'object' && !(expected instanceof RegExp)) {
        expected = JSON.stringify(expected);
      }
      if (expected instanceof RegExp) {
        if (!expected.test(response.body)) {
          this.fail(`Value '${expected}' not found in response body`);
        }
      } else {
        let actual = response.body;
        if (actual && typeof actual === 'object') {
          actual = JSON.stringify(actual);
        }
        if (actual.indexOf(expected) === -1) {
          this.fail(`Value '${expected}' not found in response body`);
        }
      }
    }
  }

  _validateJson(response) {
    this.json = processor.processData(this.json);
    for (let i = 0; i < this.json.length; i++) {
      const expectedJSON = this.json[i];
      assert.deepStrictEqual(response.json, expectedJSON);
    }
  }

  _validateJsonLike(response) {
    this.jsonLike = processor.processData(this.jsonLike);
    for (let i = 0; i < this.jsonLike.length; i++) {
      const expectedJSON = this.jsonLike[i];
      const compare = new Compare();
      const res = compare.jsonLike(response.json, expectedJSON);
      if (!res.equal) {
        this.fail(res.message);
      }
    }
  }

  _validateJsonQuery(response) {
    this.jsonQuery = processor.processData(this.jsonQuery);
    for (let i = 0; i < this.jsonQuery.length; i++) {
      const jQ = this.jsonQuery[i];
      const value = jqy(jQ.path, { data: response.json }).value;
      if (typeof value === 'object') {
        assert.deepStrictEqual(value, jQ.value);
      } else {
        assert.strictEqual(value, jQ.value);
      }
    }
  }

  _validateJsonQueryLike(response) {
    this.jsonQueryLike = processor.processData(this.jsonQueryLike);
    for (let i = 0; i < this.jsonQueryLike.length; i++) {
      const jQ = this.jsonQueryLike[i];
      const value = jqy(jQ.path, { data: response.json }).value;
      const compare = new Compare();
      const res = compare.jsonLike(value, jQ.value);
      if (!res.equal) {
        this.fail(res.message);
      }
    }
  }

  _validateJsonSchema(response) {
    this.jsonSchema = processor.processData(this.jsonSchema);
    for (let i = 0; i < this.jsonSchema.length; i++) {
      const errors = jsv.validate(this.jsonSchema[i], response.json);
      if (errors) {
        this.fail(`Response doesn't match with JSON schema: \n ${JSON.stringify(errors, null, 2)}`);
      }
    }
  }

  _validateJsonSchemaQuery(response) {
    this.jsonSchemaQuery = processor.processData(this.jsonSchemaQuery);
    for (let i = 0; i < this.jsonSchemaQuery.length; i++) {
      const jQ = this.jsonSchemaQuery[i];
      const value = jqy(jQ.path, { data: response.json }).value;
      const errors = jsv.validate(jQ.value, value);
      if (errors) {
        this.fail(`Response doesn't match with JSON schema at ${jQ.path}: \n ${JSON.stringify(errors, null, 2)}`);
      }
    }
  }

  _validateJsonMatch(response) {
    this.jsonMatch = processor.processData(this.jsonMatch);
    for (let i = 0; i < this.jsonMatch.length; i++) {
      const data = this.jsonMatch[i];
      const rules = jmv.getMatchingRules(data, '$.body');
      const value = jmv.getRawValue(data);
      const errors = jmv.validate(response.json, value, rules, '$.body');
      if (errors) {
        this.fail(errors.replace('$.body', '$'));
      }
    }
  }

  _validateJsonMatchQuery(response) {
    this.jsonMatchQuery = processor.processData(this.jsonMatchQuery);
    for (let i = 0; i < this.jsonMatchQuery.length; i++) {
      const jQ = this.jsonMatchQuery[i];
      const actualValue = jqy(jQ.path, { data: response.json }).value;
      const rules = jmv.getMatchingRules(jQ.value, jQ.path);
      const expectedValue = jmv.getRawValue(jQ.value);
      const errors = jmv.validate(actualValue, expectedValue, rules, jQ.path);
      if (errors) {
        this.fail(errors);
      }
    }
  }

  _validateJsonMatchStrict(response) {
    this.jsonMatchStrict = processor.processData(this.jsonMatchStrict);
    for (let i = 0; i < this.jsonMatchStrict.length; i++) {
      const data = this.jsonMatchStrict[i];
      const rules = jmv.getMatchingRules(data, '$.body');
      const value = jmv.getRawValue(data);
      const errors = jmv.validate(response.json, value, rules, '$.body', true);
      if (errors) {
        this.fail(errors.replace('$.body', '$'));
      }
    }
  }

  _validateJsonMatchStrictQuery(response) {
    this.jsonMatchStrictQuery = processor.processData(this.jsonMatchStrictQuery);
    for (let i = 0; i < this.jsonMatchStrictQuery.length; i++) {
      const jQ = this.jsonMatchStrictQuery[i];
      const actualValue = jqy(jQ.path, { data: response.json }).value;
      const rules = jmv.getMatchingRules(jQ.value, jQ.path);
      const expectedValue = jmv.getRawValue(jQ.value);
      const errors = jmv.validate(actualValue, expectedValue, rules, jQ.path, true);
      if (errors) {
        this.fail(errors);
      }
    }
  }

  _validateJsonSnapshot(response) {
    if (this.jsonSnapshot.length > 0) {
      if (!this.name) {
        this.fail('Snapshot name is required');
      }
      if (this.updateSnapshot) {
        log.warn(`Update snapshot is enabled for "${this.name}"`);
        file.saveSnapshot(this.name, response.json);
      }
      this.jsonSnapshot = processor.processData(this.jsonSnapshot);
      const expected = file.getSnapshotFile(this.name, response.json);
      const actual = response.json;
      const rules = {};
      for (let i = 0; i < this.jsonSnapshot.length; i++) {
        const data = this.jsonSnapshot[i];
        if (data) {
          Object.assign(rules, jmv.getMatchingRules(data, '$.body'));
        }
      }
      if (Object.keys(rules).length > 0) {
        let errors = jmv.validate(actual, expected, rules, '$.body');
        if (errors) {
          this.fail(errors.replace('$.body', '$'));
        } else {
          errors = jmv.validate(expected, actual, rules, '$.body');
          if (errors) {
            this.fail(errors.replace('$.body', '$'));
          }
        }
      } else {
        assert.deepStrictEqual(actual, expected);
      }
    }
  }

  _validateResponseTime(response) {
    this.responseTime = processor.processData(this.responseTime);
    if (this.responseTime !== null) {
      if (response.responseTime > this.responseTime) {
        this.fail(`Request took longer than ${this.responseTime}ms: (${response.responseTime}ms).`);
      }
    }
  }

  _validateErrors(response) {
    if (this.errors.length > 0) {
      if (!(response instanceof Error)) {
        this.fail(`No Error while performing a request`);
      }
      for (let i = 0; i < this.errors.length; i++) {
        const expected = this.errors[i];
        if (typeof expected === 'string') {
          const actual = response.toString();
          if (!actual.includes(expected)) {
            this.fail(`Error - "${actual}" doesn't include - ${expected}`);
          }
        }
        if (typeof expected === 'object') {
          const rules = jmv.getMatchingRules(expected, '$.error');
          const value = jmv.getRawValue(expected);
          const errors = jmv.validate(response, value, rules, '$.error', false);
          if (errors) {
            this.fail(errors.replace('$.error', '$'));
          }
        }
      }
    }
  }

  async _validateCustomExpectHandlers(request, response) {
    for (let i = 0; i < this.customExpectHandlers.length; i++) {
      const requiredHandler = this.customExpectHandlers[i];
      const ctx = { req: request, res: response, data: requiredHandler.data };
      if (typeof requiredHandler.handler === 'function') {
        await requiredHandler.handler(ctx);
      } else {
        const handlerFun = handler.getExpectHandler(requiredHandler.handler);
        await handlerFun(ctx);
      }
    }
  }

  fail(error) {
    assert.fail(error);
  }

  setDefaultResponseExpectations() {
    if (config.response.status) {
      this.statusCode = config.response.status;
    }
    if (config.response.time) {
      this.responseTime = config.response.time;
    }
    if (config.response.headers && Object.keys(config.response.headers).length !== 0) {
      for (const [key, value] of Object.entries(config.response.headers)) {
        utils.upsertValues(this.headers, { key, value });
      }
    }
    if (config.response.expectHandlers.length > 0) {
      this.customExpectHandlers = this.customExpectHandlers.concat(config.response.expectHandlers);
    }
  }

}

module.exports = Expect;
