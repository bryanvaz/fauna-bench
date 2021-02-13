/* eslint-disable operator-assignment, no-restricted-properties */
/* eslint-env browser */
/* global R:false, faunadb:false, $:false, Chart:false */
/**
 * Fauna Benchmarking JS for UI
 *
 * @author Bryan Vaz
 * Date created on: 11 Feb, 2021
 * @copyright (c)Copyright Bryan Vaz, 2021.
 */

const q = faunadb.query;

window.testResults = [];
window.rawResponses = [];

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Utility functions
// Comparator for sorting
const diff = function (a, b) {
  return a - b;
};
const variance = (X) => {
  const square_error = R.compose(
    R.partialRight(Math.pow, [2]),
    R.subtract(R.__, R.mean(X)),
  );
  return R.compose(R.mean, R.map(square_error))(X);
};
const standard_deviation = R.compose(Math.sqrt, variance);
function sortNumber(a, b) {
  return a - b;
}
function quantile(array, percentile) {
  let result;
  array.sort(sortNumber);
  const index = (percentile / 100) * (array.length - 1);
  if (Math.floor(index) === index) {
    result = array[index];
  } else {
    const i = Math.floor(index);
    const fraction = index - i;
    result = array[i] + (array[i + 1] - array[i]) * fraction;
  }
  return result;
}

const createClient = (secret) => {
  const client = new faunadb.Client({ secret });

  client._observer = (val, context) => {
    // console.log('observer val:', val);
    client._lastResponse = val;
  };
  return client;
};

/**
 * Returns the value of #snap-delay
 * in milliseconds
 */
function getSnapDelay() {
  const val = $('#snap-delay').val();
  if (val) {
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }
  return null;
}

// Charting data
window.chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)',
};

const { color } = Chart.helpers;
const barChartData = {
  labels: [
    '< 100',
    '100-200',
    '200 - 300',
    '300 - 400',
    '400 - 500',
    '500 - 600',
    '> 700',
  ],
  datasets: [
    {
      label: 'Client Query Time',
      backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
      borderColor: window.chartColors.red,
      borderWidth: 1,
      data: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      label: 'Server Query Time',
      backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
      borderColor: window.chartColors.blue,
      borderWidth: 1,
      data: [0, 0, 0, 0, 0, 0, 0],
    },
  ],
};
window.barChartData = barChartData;

const queryTest = async (client, queryDetails) => {
  const { refId, collection } = queryDetails;
  const queryStartTime = Date.now();

  let sessionData;
  // Query based on snapshot if needed
  if (queryDetails.snapDelay) {
    // subtract delay from now, the convert milliseconds to microseconds
    const timestamp = (Date.now() - queryDetails.snapDelay) * 1000;
    sessionData = await client.query(
      q.At(timestamp, q.Get(q.Ref(q.Collection(collection), refId))),
    );
    console.log(`Snapshot query made: `, {
      snapDelay: `${queryDetails.snapDelay} ms`,
      AtTimestamp: timestamp,
    });
  } else {
    sessionData = await client.query(
      q.Get(q.Ref(q.Collection(collection), refId)),
    );
    console.log('Strongly consistent query made.');
  }

  const queryTime = Date.now() - queryStartTime;

  const headers = client._lastResponse.responseHeaders;

  window.rawResponses.push(R.clone(client._lastResponse));

  const resultData = {
    clientQueryTime: queryTime,
    readOps: parseInt(headers['x-read-ops'], 10),
    serverQueryTime: parseInt(headers['x-query-time'], 10),
  };
  window.testResults.push(resultData);

  const clientQueryTimeArr = window.testResults.map((e) => e.clientQueryTime);
  window.clientQueryTimeArr = clientQueryTimeArr;
  const clientQueryTimeArrSorted = R.sort(diff, clientQueryTimeArr);

  const serverQueryTimeArr = window.testResults.map((e) => e.serverQueryTime);
  window.serverQueryTimeArr = serverQueryTimeArr;
  const serverQueryTimeArrSorted = R.sort(diff, serverQueryTimeArr);

  const stats = {
    clientQueryTime: {
      mean: Math.round(R.mean(clientQueryTimeArrSorted)),
      median: Math.round(
        clientQueryTimeArrSorted[
          Math.ceil(clientQueryTimeArrSorted.length / 2)
        ],
      ),
      stdDev: Math.round(standard_deviation(clientQueryTimeArrSorted)),
      pct95: Math.round(quantile(clientQueryTimeArrSorted, 95)),
      pct90: Math.round(quantile(clientQueryTimeArrSorted, 90)),
      iqr: Math.round(
        quantile(clientQueryTimeArrSorted, 75) -
          quantile(clientQueryTimeArrSorted, 25),
      ),
    },
    serverQueryTime: {
      mean: Math.round(R.mean(serverQueryTimeArrSorted)),
      median: Math.round(
        serverQueryTimeArrSorted[
          Math.ceil(serverQueryTimeArrSorted.length / 2)
        ],
      ),
      stdDev: Math.round(standard_deviation(serverQueryTimeArrSorted)),
      pct95: Math.round(quantile(serverQueryTimeArrSorted, 95)),
      pct90: Math.round(quantile(serverQueryTimeArrSorted, 90)),
      iqr: Math.round(
        quantile(serverQueryTimeArrSorted, 75) -
          quantile(serverQueryTimeArrSorted, 25),
      ),
    },
  };
  const statNames = {
    mean: 'Mean',
    median: 'Median',
    stdDev: 'Std. Dev.',
    pct95: '95th Percentile (slowest)',
    pct90: '90th Percentile (slowest)',
    iqr: 'Interquartile Range',
  };
  window.stats = stats;
  $('#stats-table').empty();
  R.keys(statNames).forEach((measure) => {
    $('#stats-table').append(
      // eslint-disable-next-line max-len
      `<tr><th scope="row">${statNames[measure]}</th><td>${stats.clientQueryTime[measure]} ms</td><td>${stats.serverQueryTime[measure]} ms</td></tr>`,
    );
  });

  // Update Histogram
  barChartData.datasets[0].data = [0, 0, 0, 0, 0, 0, 0];
  barChartData.datasets[1].data = [0, 0, 0, 0, 0, 0, 0];
  clientQueryTimeArrSorted.forEach((val) => {
    const i = Math.floor(val / 100);
    if (i >= barChartData.datasets[0].data.length) {
      barChartData.datasets[0].data[barChartData.datasets[0].data.length - 1] =
        barChartData.datasets[0].data[
          barChartData.datasets[0].data.length - 1
        ] + 1;
    } else {
      barChartData.datasets[0].data[i] = barChartData.datasets[0].data[i] + 1;
    }
  });
  serverQueryTimeArrSorted.forEach((val) => {
    const i = Math.floor(val / 100);
    if (i >= barChartData.datasets[1].data.length) {
      barChartData.datasets[1].data[barChartData.datasets[1].data.length - 1] =
        barChartData.datasets[1].data[
          barChartData.datasets[1].data.length - 1
        ] + 1;
    } else {
      barChartData.datasets[1].data[i] = barChartData.datasets[1].data[i] + 1;
    }
  });
  // Convert to percentages
  barChartData.datasets[0].data = barChartData.datasets[0].data.map((val) =>
    Math.round((val * 100.0) / clientQueryTimeArrSorted.length),
  );
  barChartData.datasets[1].data = barChartData.datasets[1].data.map((val) =>
    Math.round((val * 100.0) / serverQueryTimeArrSorted.length),
  );
  window.myBar.update();

  console.log({
    clientQueryTime: `${queryTime} ms`,
    readOps: headers['x-read-ops'],
    serverQueryTime: `${headers['x-query-time']} ms`,
  });
  window.fauna = client;
  const nextNum = $('#results').children().length + 1;
  $('#results').prepend(
    `<tr><th scope="row">${nextNum}</th><td>${queryTime}</td><td>${headers['x-query-time']}</td><td>${headers['x-read-ops']}</td></tr>`,
  );
};

let abortTest = false;
const runLoop = async (client, queryDetails) => {
  const numOfLoops = R.max(parseInt($('#num-of-loops').val() || '10', 10), 0);
  const pausetime = parseInt($('#pausetime').val() || '500', 10);
  console.log(`Running for ${numOfLoops} loops...`);
  try {
    for (j = 0; j < numOfLoops; j++) {
      if (abortTest) break;
      await queryTest(client, queryDetails);
      await timeout(pausetime);
    }
  } catch (error) {
    $('#alert-area')
      .append(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
      <strong>Error!</strong> ${error.message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button></div>`);
    console.error(error);
  }
};

$('#run-test').on('click', function (event) {
  abortTest = false;
  console.log('run test');
  const secret = $('#fauna-secret').val();
  const refId = $('#ref-id').val();
  const collection = $('#collection-name').val();
  const snapDelay = getSnapDelay();

  const queryDetails = { refId, collection, snapDelay };
  console.log(`secret: ${secret}`);
  const client = createClient(secret);
  // queryTest(client);
  runLoop(client, queryDetails);
});

$('#stop-test').on('click', function (event) {
  abortTest = true;
});

const ctx = document.getElementById('histogram').getContext('2d');
window.myBar = new Chart(ctx, {
  type: 'horizontalBar',
  data: barChartData,
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      // title: {
      //   display: true,
      //   text: 'Chart.js Bar Chart'
      // }
    },
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            fontSize: 12,
            labelString: 'Query time (ms)',
          },
        },
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            fontSize: 12,
            labelString: '% of requests',
          },
          ticks: {
            // Include a dollar sign in the ticks
            callback(value, index, values) {
              return `${value}%`;
            },
          },
        },
      ],
    },
  },
});
