/**
 * Lambda@Edge Benchmarking Code for Fauna
 *
 * @author Bryan Vaz
 * Date created on: 12 Feb, 2021
 * @copyright (c)Copyright Bryan Vaz, 2021.
 */

// invoked by CloudFront (origin requests)
const handler = (evt, context, cb) => {
  const record = evt.Records[0];
  const req = evt.Records[0].cf.request;

  const functionRegion = context.functionName.split('.')[0] || 'unknown';

  let body = {};

  if (
    req &&
    req.method === 'POST' &&
    req.body &&
    req.body.data &&
    req.body.encoding === 'base64'
  ) {
    body = Buffer.from(req.body.data, 'base64').toString('utf-8');
  }

  try {
    if (
      req.headers['content-type'] &&
      req.headers['content-type'][0] &&
      req.headers['content-type'][0].value === 'application/json' &&
      typeof body === 'string'
    ) {
      body = JSON.parse(body);
    }
  } catch (error) {
    console.error('Could not request JSON parse body');
  }

  console.log('evt: ', JSON.stringify(evt, null, 2));
  console.log('context: ', JSON.stringify(context, null, 2));
  console.log('evt.Records[0]: ', JSON.stringify(evt.Records[0], null, 2));
  console.log('req: ', JSON.stringify(req, null, 2));

  const content = {
    success: 'ok',
    source: 'origin-request',
    requestTime: new Date().toLocaleString(),
    req: {
      headers: req.headers,
      clientIp: req.clientIp,
      method: req.method,
      querystring: req.querystring,
      uri: req.uri,
      body: req.body,
    },
    cf: {
      config: record.cf.config,
    },
    body,
  };
  /*
   * Generate HTTP OK response using 200 status code with HTML body.
   */
  const response = {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'cache-control': [
        {
          key: 'Cache-Control',
          value: 'max-age=5',
        },
      ],
      'content-type': [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
      ],
      'x-pop-region': [
        {
          key: 'X-Pop-Region',
          value: functionRegion,
        },
      ],
    },
    body: JSON.stringify(content),
  };

  console.log('response: ', JSON.stringify(response, null, 2));

  cb(null, response);
};

module.exports.handler = handler;
