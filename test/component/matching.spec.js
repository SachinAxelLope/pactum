const pactum = require('../../src/index');
const { like, somethingLike, term, regex, eachLike, contains } = pactum.matchers;

describe('Request Matchers', () => {

  it('GET - one interaction - like', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          query: {
            date: like('08/04/2020')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .get('http://localhost:9393/api/projects/1')
      .withQuery('date', '12/00/9632')
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

  it('GET - one interaction - somethingLike', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          query: {
            date: somethingLike('08/04/2020')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .get('http://localhost:9393/api/projects/1')
      .withQuery('date', '12/00/9632')
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

  it('GET - one interaction - regex instance', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          query: {
            date: regex({ generate: '08/04/2020', matcher: /\w+/g })
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .get('http://localhost:9393/api/projects/1')
      .withQuery('date', '12/00/9632')
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

  it('GET - one interaction - regex string', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          query: {
            date: regex({ generate: '08/04/2020', matcher: "\\w+" })
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .get('http://localhost:9393/api/projects/1')
      .withQuery('date', '12/00/9632')
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

  it('POST - one interaction - term instance', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'POST',
          path: '/api/projects/1',
          body: {
            id: term({ generate: 123, matcher: /\d+/ }),
            name: 'Bark'
          }
        },
        willRespondWith: {
          status: 200
        }
      })
      .post('http://localhost:9393/api/projects/1')
      .withBody({
        id: 100,
        name: 'Bark'
      })
      .expectStatus(200)
      .toss();
  });

  it('POST - one interaction - term string', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          body: {
            id: term({ generate: 123, matcher: "\\d+" }),
            name: 'Bark'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .get('http://localhost:9393/api/projects/1')
      .withBody({
        id: 100,
        name: 'Bark'
      })
      .expectStatus(200)
      .toss();
  });

  it('POST - one interaction - each like', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'POST',
          path: '/api/projects/1',
          body: eachLike({
            id: term({ generate: 123, matcher: /\d+/ }),
            name: 'Bark'
          })
        },
        willRespondWith: {
          status: 200
        }
      })
      .post('http://localhost:9393/api/projects/1')
      .withBody([{
        id: 100,
        name: 'Bark'
      }])
      .expectStatus(200)
      .toss();
  });

  it('GET - one interaction - contains', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          query: {
            date: contains('2020')
          },
          headers: {
            'x-Request-Id': contains('PutItem')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .__setLogLevel('DEBUG')
      .get('http://localhost:9393/api/projects/1')
      .withQuery('date', '12/00/2020')
      .withHeaders({
        'x-request-id': 'DynamoDB.2018.PutItem'
      })
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

  it('GET - one interaction - headers like', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          headers: {
            date: like('08/04/2020')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .get('http://localhost:9393/api/projects/1')
      .withHeaders({'date': '12/00/9632', 'place': 'hyd'})
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

  it('GET - one interaction - multiple headers like', async () => {
    await pactum
      .addMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/projects/1',
          headers: {
            date: like('08/04/2020'),
            place: 'hyd'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: {
            id: 1,
            name: 'fake'
          }
        }
      })
      .__setLogLevel('DEBUG')
      .get('http://localhost:9393/api/projects/1')
      .withHeaders({'date': '12/00/9632', 'place': 'hyd'})
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        name: 'fake'
      })
      .toss();
  });

});