const { compare } = require('pactum-matchers').utils;
const graphQL = require('./graphQL');

const log = require('../exports/logger').get();
const helper = require('./helper');

const utils = {

  /**
   * returns a matching interaction
   * @param {object} req - req object
   * @param {Map<string, object>} interactions - interactions
   */
  getMatchingInteraction(req, interactions) {
    const ids = Array.from(interactions.keys());
    for (let i = ids.length - 1; i >= 0; i--) {
      const interactionId = ids[i];
      log.debug(`Comparing interaction with id "${interactionId}"`);
      const interaction = interactions.get(interactionId);
      const isValidMethod = (interaction.request.method === req.method);
      if (!isValidMethod) {
        log.debug(`Interaction with id "${interactionId}" failed to match - HTTP Method`);
        continue;
      }
      const isValidPath = validatePath(req, interaction);
      if (!isValidPath.equal) {
        log.debug(`Interaction with id "${interactionId}" failed to match - HTTP Path - ${isValidPath.message}`);
        continue;
      }
      const isValidQuery = validateQuery(req, interaction);
      if (!isValidQuery.equal) {
        log.debug(`Interaction with id "${interactionId}" failed to match - HTTP Query Params - ${isValidQuery.message}`);
        continue;
      }
      const isValidHeaders = validateHeaders(req, interaction);
      if (!isValidHeaders.equal) {
        log.debug(`Interaction with id "${interactionId}" failed to match - HTTP Headers - ${isValidHeaders.message}`);
        continue;
      }
      const isValidBody = validateBody(req, interaction);
      if (isValidMethod && isValidPath.equal && isValidQuery.equal && isValidHeaders.equal && isValidBody.equal) {
        return interaction;
      }
      log.debug(`Interaction with id "${interactionId}" failed to match - HTTP Body - ${isValidBody.message}`);
    }
    return null;
  },

  printReqAndRes(request, response) {
    log.warn('Request', request);
    log.warn('Response', helper.getTrimResponse(response));
  },

  upsertValues(jsonArray, item) {
    const index = jsonArray.findIndex(_item => _item.key === item.key);
    if (index > -1 ) {
      jsonArray[index] = item;
    } else {
      jsonArray.push(item);
    }
  }

};

function validatePath(req, interaction) {
  const { path, pathParams, matchingRules } = interaction.request;
  const actualPath = req.path;
  const expectedPath = path;
  if (pathParams) {
    const actualParts = actualPath.split('/');
    const expectedParts = expectedPath.split('/');
    if (actualParts.length !== expectedParts.length) {
      return {
        message: `Path parts length not equal "${actualParts.length}" !== "${expectedParts.length}"`,
        equal: false
      };
    }
    const actual = {};
    const expected = {};
    for (let i = 0; i < actualParts.length; i++) {
      if (!actualParts[i]) continue;
      const actualPart = actualParts[i];
      const expectedPart = expectedParts[i];
      if (expectedPart.startsWith('{') && expectedPart.endsWith('}')) {
        const param = expectedPart.slice(1, -1);
        expected[param] = pathParams[param];
        actual[param] = actualPart;
      } else {
        if (actualPart !== expectedPart) {
          return {
            message: `Path part not equal "${actualPart}" !== "${expectedPart}"`,
            equal: false
          };
        }
      }
    }
    req.pathParams = actual;
    return compare(actual, expected, matchingRules, '$.path');
  } else {
    return compare(actualPath, expectedPath, matchingRules, '$.path');
  }
}

function validateQuery(req, interaction) {
  const { strict, request } = interaction;
  if (req.method === 'GET' && request.graphQL) {
    return graphQL.compare(req.query, request.queryParams, strict);
  }
  return compare(req.query, request.queryParams, request.matchingRules, '$.query', strict);
}

function validateHeaders(req, interaction) {
  const { request } = interaction;
  if (request.headers) {
    const lowerCaseActual = {};
    for (const prop in req.headers) {
      lowerCaseActual[prop.toLowerCase()] = req.headers[prop];
    }
    const lowerCaseExpected = {};
    for (const prop in request.headers) {
      lowerCaseExpected[prop.toLowerCase()] = request.headers[prop];
    }
    return compare(lowerCaseActual, lowerCaseExpected, request.matchingRules, '$.headers');
  }
  return { message: '', equal: true };
}

function validateBody(req, interaction) {
  const { strict, request } = interaction;
  if (request.graphQL && req.method !== 'GET') {
    return graphQL.compare(req.body, request.body, strict);
  }
  if (strict) {
    if (req.body || request.body) {
      return compare(req.body, request.body, request.matchingRules, '$.body', strict);
    }
  } else {
    if (request.body) {
      return compare(req.body, request.body, request.matchingRules, '$.body', strict);
    }
  }
  return { message: '', equal: true };
}

module.exports = utils;