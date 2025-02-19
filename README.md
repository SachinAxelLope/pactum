<span align="center">

![logo](https://pactumjs.github.io/_media/logo-icon-small.svg)

# PactumJS

![Build](https://github.com/pactumjs/pactum/workflows/Build/badge.svg?branch=master)
![Coverage](https://img.shields.io/codeclimate/coverage/ASaiAnudeep/pactum)
![Downloads](https://img.shields.io/npm/dt/pactum)
![Size](https://img.shields.io/bundlephobia/minzip/pactum)
![Platform](https://img.shields.io/node/v/pactum)

#### REST API Testing Tool for all levels in a Test Pyramid

</span>

<br />
<p align="center"><a href="https://pactumjs.github.io"><img src="https://raw.githubusercontent.com/pactumjs/pactum/master/assets/demo.gif" alt="PactumJS Demo"/></a>
</p>
<br />

<table>
<tr>
<td>

**PactumJS** is a REST API Testing Tool used to automate e2e, integration, contract & component (*or service level*) tests. It comes with a powerful *mock server* which can control the state of external dependencies.

- ⚡ Swift
- 🎈 Lightweight
- 🚀 Simple & Powerful
- 🛠️ Compelling Mock Server
- 💎 Elegant Data Management
- 🔧 Extendable & Customizable
- 📚 Clear & Comprehensive Testing Style
- 🔗 Component, Contract & E2E testing of APIs

</td>
</tr>
</table>

![----------](https://raw.githubusercontent.com/pactumjs/pactum/master/assets/rainbow.png)

## Documentation

This readme offers an basic introduction to the library. Head over to the full documentation at https://pactumjs.github.io

- [API Testing](https://pactumjs.github.io/#/api-testing)
- [Integration Testing](https://pactumjs.github.io/#/integration-testing)
- [Component Testing](https://pactumjs.github.io/#/component-testing)
- [Contract Testing](https://pactumjs.github.io/#/contract-testing)
- [E2E Testing](https://pactumjs.github.io/#/e2e-testing)

## Need Help

We use Github [Discussions](https://github.com/pactumjs/pactum/discussions) to receive feedback, discuss ideas & answer questions.

## Installation

```shell
# install pactum as a dev dependency
npm install --save-dev pactum

# install a test runner to run pactum tests
# mocha / jest / cucumber
npm install --save-dev mocha
```

![----------](https://raw.githubusercontent.com/pactumjs/pactum/master/assets/rainbow.png)

# Usage

**pactum** can be used for all levels of testing in a test pyramid. It can also act as an standalone mock server to generate contracts for consumer driven contract testing.

## API Testing

Tests in **pactum** are clear and comprehensive. It uses numerous descriptive methods to build your requests and expectations. 

### Simple Test Cases

#### Using Mocha

Running simple api test expectations.

```javascript
const pactum = require('pactum');

it('should be a teapot', async () => {
  await pactum.spec()
    .get('http://httpbin.org/status/418')
    .expectStatus(418);
});

it('should save a new user', async () => {
  await pactum.spec()
    .post('https://jsonplaceholder.typicode.com/users')
    .withHeaders('Authorization', 'Basic xxxx')
    .withJson({
      name: 'bolt',
      email: 'bolt@swift.run'
    })
    .expectStatus(200);
});
```

```shell
# mocha is a test framework to execute test cases
mocha /path/to/test
```

#### Using Cucumber

See [pactum-cucumber-boilerplate](https://github.com/pactumjs/pactum-cucumber-boilerplate) for more details on pactum & cucumber integration.

```javascript
// steps.js
const pactum = require('pactum');
const { Given, When, Then, Before } = require('cucumber');

let spec = pactum.spec();

Before(() => { spec = pactum.spec(); });

Given('I make a GET request to {string}', function (url) {
  spec.get(url);
});

When('I receive a response', async function () {
  await spec.toss();
});

Then('response should have a status {int}', async function (code) {
  spec.response().should.have.status(code);
});
```

```gherkin
Scenario: Check TeaPot
  Given I make a GET request to "http://httpbin.org/status/418"
  When I receive a response
  Then response should have a status 200
```

## Mock Server

**pactum** can act as a standalone *mock server* that allows us to mock any server via HTTP or HTTPS, such as a REST endpoint. Simply it is a simulator for HTTP-based APIs.

Running **pactum** as a standalone *mock server*.

```javascript
const { mock } = require('pactum');

mock.addInteraction({
  request: {
    method: 'GET',
    path: '/api/projects'
  },
  response: {
    status: 200,
    body: [
      {
        id: 'project-id',
        name: 'project-name'
      }
    ]
  }
});

mock.start(3000);
```

![----------](https://raw.githubusercontent.com/pactumjs/pactum/master/assets/rainbow.png)

# Notes

Inspired from [frisby](https://docs.frisbyjs.com/) and [pact](https://docs.pact.io).

## Support

Like this project! Star it on [Github](https://github.com/pactumjs/pactum/stargazers). Your support means a lot to us.

<a href="https://github.com/pactumjs/pactum/stargazers"><img src="https://img.shields.io/github/stars/pactumjs/pactum?style=social" style="margin-left:0;box-shadow:none;border-radius:0;height:24px"></a>

## Contributors

If you've ever wanted to contribute to open source, and a great cause, now is your chance! See the [contributing docs](https://github.com/pactumjs/pactum/blob/master/CONTRIBUTING.md) for more information

Thanks to all the people who contribute.

<a href="https://github.com/pactumjs/pactum/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=pactumjs/pactum" />
</a>
<br />