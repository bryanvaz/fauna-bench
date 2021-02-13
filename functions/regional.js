/**
 * Regional Verions of Lambda deployment to benchmark Fauna
 *
 * @author Bryan Vaz
 * Date created on: 12 Feb, 2021
 * @copyright (c)Copyright Bryan Vaz, 2021.
 */

const faunadb = require('faunadb');
const R = require('ramda');
// const R = {
//   // eslint-disable-next-line global-require
//   pick: require('ramda/src/pick'),
//   // eslint-disable-next-line global-require
//   keys: require('ramda/src/keys'),
// };

const q = faunadb.query;

const FAUNA_SECRET = process.env.FAUNA_API_KEY || '';

const createClient = (secret) => {
  const client = new faunadb.Client({ secret });

  client._observer = (val, context) => {
    client._lastResponse = val;
  };
  return client;
};

let faunaClient = createClient(FAUNA_SECRET);

const handler = async (event, context) => {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  console.log('event', event);

  try {
    let body;
    // Parse Body to get required params
    if (
      event &&
      event.body &&
      event.headers &&
      (event.headers['Content-Type'] === 'application/json' ||
        event.headers['content-type'] === 'application/json')
    ) {
      body = JSON.parse(event.body);
    } else {
      throw new Error('Invalid body format');
    }

    const { collectionName, refId } = body;

    if (!collectionName || !refId) {
      throw new Error('Missing required params');
    }

    let faunaClientCreated = false;

    if (!faunaClient) {
      faunaClient = createClient(FAUNA_SECRET);
      faunaClientCreated = true;
    }

    const queryStartTime = Date.now();

    const sessionData = await faunaClient.query(
      q.Get(q.Ref(q.Collection(collectionName), refId)),
    );

    const queryTime = Date.now() - queryStartTime;

    console.debug(
      `${collectionName} ${refId}:`,
      JSON.stringify(sessionData, null, 2),
    );

    // console.debug('response: ', faunaClient._lastResponse);

    const result = sessionData && sessionData.data ? sessionData.data : null;

    const response = faunaClient._lastResponse;

    console.debug('response', response);

    return {
      message: 'ok',
      success: true,
      faunaClientRecreatedInFunction: faunaClientCreated,
      observedQueryTime: `${queryTime}ms`,
      serverQueryTime:
        response &&
        response.responseHeaders &&
        response.responseHeaders['x-query-time'] &&
        `${response.responseHeaders['x-query-time']}ms`,
      serverTxnRetries:
        response &&
        response.responseHeaders &&
        response.responseHeaders['x-txn-retries'],
      rawFaunaClientQueryTime: `${response.endTime - response.startTime}ms`,
      rawFaunaQueryResultHeaders:
        response &&
        response.responseHeaders &&
        R.pick(
          R.keys(response.responseHeaders).filter((k) => k.startsWith('x-')),
        )(response.responseHeaders),
      rawFaunaQueryResult: sessionData,
      result,
    };
    // eslint-disable-next-line no-unreachable
  } catch (error) {
    console.error(error);
    return {
      action: event.action,
      success: false,
      error: error.toString(),
    };
  }
};

module.exports.handler = handler;
