// import { bigquery } from '../../config/bigQuery.js';
// import { cache } from '../../config/cache.js';
// import type { AnalyticsQuery } from './analytics.interface.js';

// /* ================= ENV ================= */

// const PROJECT = process.env.BQ_PROJECT_ID!;
// const DATASET = process.env.BQ_DATASET!;
// const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

// /* ================= TABLES ================= */

// const TESTS_TABLE = 'tests_raw_latest';
// const DEVICES_TABLE = 'devices_raw_latest';
// const ORGANIZATIONS_TABLE = 'organizations_raw_latest';

// const testsTable = () =>
//   `\`${PROJECT}.${DATASET}.${TESTS_TABLE}\``;

// const devicesTable = () =>
//   `\`${PROJECT}.${DATASET}.${DEVICES_TABLE}\``;

// const organizationsTable = () =>
//   `\`${PROJECT}.${DATASET}.${ORGANIZATIONS_TABLE}\``;

// /* ================= SERVICE ================= */

// export class AnalyticsService {

//   static async getDashboard(query: AnalyticsQuery) {

//     const {
//       from,
//       to,
//       state,
//       channel,
//       testType,
//       product
//     } = query;

//     /* ================= DATE FILTER ================= */

//     const dateFilter =
//       from && to
//         ? `
//         AND DATE(
//           TIMESTAMP_SECONDS(
//             SAFE_CAST(JSON_VALUE(t.data, '$.createdOn._seconds') AS INT64)
//           )
//         )
//         BETWEEN '${from}' AND '${to}'
//         `
//         : '';

//     /* ================= CACHE ================= */

//     const cacheKey =
//       `analytics:${from || 'all'}:${to || 'all'}:${state}:${channel}:${testType}:${product}`;

//     const cached = cache.get(cacheKey);

//     if (cached) {
//       console.log('⚡ Analytics Cache Hit');
//       return cached;
//     }

//     console.log('📡 Analytics Cache Miss → BigQuery');

//     /* ================= FILTERS ================= */

//     const stateFilter =
//       state && state !== 'All States'
//         ? `AND JSON_VALUE(o.data, '$.state') = '${state}'`
//         : '';

//     const channelFilter =
//       channel && channel !== 'All Channels'
//         ? `AND JSON_VALUE(t.data, '$.channel') = '${channel}'`
//         : '';

//     const testTypeFilter =
//       testType && testType !== 'All Tests'
//         ? `AND JSON_VALUE(t.data, '$.testType') = '${testType}'`
//         : '';

//     const productFilter =
//       product && product !== 'All Products'
//         ? `AND JSON_VALUE(d.data, '$.product') = '${product}'`
//         : '';

//     /* ================= BIGQUERY ================= */

//     const sql = `

// WITH baseTests AS (

//   SELECT
//     JSON_VALUE(t.data, '$.id') AS testId,
//     JSON_VALUE(t.data, '$.deviceId') AS deviceId,
//     JSON_VALUE(t.data, '$.organizationName') AS organizationName,
//     JSON_VALUE(t.data, '$.organizationId') AS organizationId,
//     JSON_VALUE(t.data, '$.motherId') AS motherId,
//     CAST(JSON_VALUE(t.data, '$.lengthOfTest') AS FLOAT64) AS lengthOfTest,

//     TIMESTAMP_SECONDS(
//       SAFE_CAST(JSON_VALUE(t.data, '$.createdOn._seconds') AS INT64)
//     ) AS createdOn

//   FROM ${testsTable()} t

//   LEFT JOIN ${devicesTable()} d
//     ON JSON_VALUE(t.data, '$.deviceId')
//        = JSON_VALUE(d.data, '$.deviceId')

//   LEFT JOIN ${organizationsTable()} o
//     ON JSON_VALUE(t.data, '$.organizationId')
//        = JSON_VALUE(o.data, '$.organizationId')

//   WHERE 1=1
//   ${dateFilter}
//   ${stateFilter}
//   ${channelFilter}
//   ${testTypeFilter}
//   ${productFilter}
// ),

// /* ================= MONTHS ================= */

// months AS (

//   SELECT
//     DATE_TRUNC(d, MONTH) AS month,
//     FORMAT_DATE('%b %Y', DATE_TRUNC(d, MONTH)) AS monthLabel

//   FROM UNNEST(
//     GENERATE_DATE_ARRAY(
//       DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH), MONTH),
//       DATE_TRUNC(CURRENT_DATE(), MONTH),
//       INTERVAL 1 MONTH
//     )
//   ) AS d
// ),

// monthlyGrowth AS (

//   SELECT
//     m.monthLabel AS month,
//     COUNT(b.testId) AS totalTests

//   FROM months m

//   LEFT JOIN baseTests b
//     ON DATE_TRUNC(DATE(b.createdOn), MONTH) = m.month

//   GROUP BY m.month, m.monthLabel
//   ORDER BY m.month
// ),

// /* ================= SUMMARY ================= */

// avgTestsPerDevice AS (
//   SELECT ROUND(AVG(cnt),2) AS value
//   FROM (
//     SELECT deviceId, COUNT(*) AS cnt
//     FROM baseTests
//     GROUP BY deviceId
//   )
// ),

// avgTestDuration AS (
//   SELECT ROUND(AVG(lengthOfTest),2) AS value
//   FROM baseTests
// ),

// avgDailyTests AS (
//   SELECT ROUND(AVG(cnt),2) AS value
//   FROM (
//     SELECT DATE(createdOn) AS d, COUNT(*) AS cnt
//     FROM baseTests
//     GROUP BY d
//   )
// ),

// needAttention AS (
//   SELECT COUNT(DISTINCT organizationName) AS value
//   FROM baseTests
//   WHERE DATE(createdOn) < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
// ),

// /* ================= ORG ================= */

// orgCounts AS (
//   SELECT organizationName, COUNT(*) AS totalTests
//   FROM baseTests
//   GROUP BY organizationName
// ),

// top10Org AS (
//   SELECT * FROM orgCounts
//   ORDER BY totalTests DESC
//   LIMIT 10
// ),

// low10Org AS (
//   SELECT * FROM orgCounts
//   ORDER BY totalTests ASC
//   LIMIT 10
// ),

// /* ================= DEVICE ================= */

// deviceCounts AS (
//   SELECT deviceId, COUNT(*) AS totalTests
//   FROM baseTests
//   GROUP BY deviceId
// ),

// top10Devices AS (
//   SELECT * FROM deviceCounts
//   ORDER BY totalTests DESC
//   LIMIT 10
// ),

// /* ================= MOTHER ================= */

// motherCounts AS (
//   SELECT motherId, COUNT(*) AS totalTests
//   FROM baseTests
//   GROUP BY motherId
// ),

// motherAnalysis AS (
//   SELECT
//     SUM(CASE WHEN totalTests = 0 THEN 1 ELSE 0 END) AS zeroTests,
//     SUM(CASE WHEN totalTests = 1 THEN 1 ELSE 0 END) AS oneTest,
//     SUM(CASE WHEN totalTests = 2 THEN 1 ELSE 0 END) AS twoTests,
//     SUM(CASE WHEN totalTests >= 3 THEN 1 ELSE 0 END) AS threePlusTests
//   FROM motherCounts
// ),

// /* ================= DURATION ================= */

// durationDist AS (
//   SELECT
//     CASE
//       WHEN lengthOfTest < 20 THEN '<20 min'
//       WHEN lengthOfTest BETWEEN 20 AND 40 THEN '20-40 min'
//       WHEN lengthOfTest BETWEEN 40 AND 60 THEN '40-60 min'
//       ELSE '60+ min'
//     END AS label,
//     COUNT(*) AS count
//   FROM baseTests
//   GROUP BY label
// )

// /* ================= FINAL ================= */

// SELECT

// STRUCT(
//   (SELECT value FROM avgTestsPerDevice) AS avgTestsPerDevice,
//   (SELECT value FROM avgTestDuration) AS avgTestDuration,
//   (SELECT value FROM avgDailyTests) AS avgDailyTests,
//   (SELECT value FROM needAttention) AS needAttention
// ) AS summary,

// (SELECT ARRAY_AGG(STRUCT(month, totalTests))
//  FROM monthlyGrowth) AS monthlyGrowth,

// STRUCT(
//   (SELECT ARRAY_AGG(t) FROM top10Org t) AS top10,
//   (SELECT ARRAY_AGG(l) FROM low10Org l) AS low10
// ) AS organizationAnalysis,

// STRUCT(
//   (SELECT ARRAY_AGG(d) FROM top10Devices d) AS top10Devices
// ) AS deviceAnalysis,

// (SELECT AS STRUCT * FROM motherAnalysis) AS motherAnalysis,

// (SELECT ARRAY_AGG(d) FROM durationDist d) AS testDurationDistribution
// `;

//     const [rows] = await bigquery.query({
//       query: sql,
//       location: LOCATION
//     });

//     const result = rows[0];

//     cache.set(cacheKey, result, 2592000);

//     return result;
//   }
// }

import { bigquery } from '../../config/bigQuery.js';
import { cache } from '../../config/cache.js';
import type { AnalyticsQuery } from './analytics.interface.js';

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

/* ================= TABLES ================= */

const TESTS_TABLE = 'tests_raw_latest';
const DEVICES_TABLE = 'devices_raw_latest';
const ORGANIZATIONS_TABLE = 'organizations_raw_latest';

const testsTable = () =>
  `\`${PROJECT}.${DATASET}.${TESTS_TABLE}\``;

const devicesTable = () =>
  `\`${PROJECT}.${DATASET}.${DEVICES_TABLE}\``;

const organizationsTable = () =>
  `\`${PROJECT}.${DATASET}.${ORGANIZATIONS_TABLE}\``;

/* ================= SERVICE ================= */

export class AnalyticsService {

  static async getDashboard(query: AnalyticsQuery, user: any) {

    const { from, to, state, channel, testType, product } = query;

    const isGroupUser = user?.type === 'groupUser';

    const allowedOrgIds: string[] =
      isGroupUser && Array.isArray(user.allowedOrganizations)
        ? user.allowedOrganizations.map((id: string) => id.trim())
        : [];

    /* ================= CACHE ================= */

    const cacheKey =
      `analytics:${user?.type}:${from || 'all'}:${to || 'all'}:${state}:${channel}:${testType}:${product}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    /* ================= DATE FILTER ================= */

    const dateFilter =
      from && to
        ? `
        AND DATE(
          TIMESTAMP_SECONDS(
            SAFE_CAST(JSON_VALUE(t.data, '$.createdOn._seconds') AS INT64)
          )
        )
        BETWEEN @from AND @to
        `
        : '';

    /* ================= OTHER FILTERS ================= */

    const stateFilter =
      state && state !== 'All States'
        ? `AND JSON_VALUE(o.data, '$.state') = '${state}'`
        : '';

    const channelFilter =
      channel && channel !== 'All Channels'
        ? `AND JSON_VALUE(t.data, '$.channel') = '${channel}'`
        : '';

    const testTypeFilter =
      testType && testType !== 'All Tests'
        ? `AND JSON_VALUE(t.data, '$.testType') = '${testType}'`
        : '';

    const productFilter =
      product && product !== 'All Products'
        ? `AND JSON_VALUE(d.data, '$.product') = '${product}'`
        : '';

    /* ================= ORG AUTH FILTER ================= */

    const orgFilter = isGroupUser
      ? `AND JSON_VALUE(t.data, '$.organizationId') IN UNNEST(@orgIds)`
      : '';

    /* ================= BIGQUERY ================= */

    const sql = `

WITH baseTests AS (

  SELECT
    JSON_VALUE(t.data, '$.id') AS testId,
    JSON_VALUE(t.data, '$.deviceId') AS deviceId,
    JSON_VALUE(t.data, '$.organizationName') AS organizationName,
    JSON_VALUE(t.data, '$.organizationId') AS organizationId,
    JSON_VALUE(t.data, '$.motherId') AS motherId,
    CAST(JSON_VALUE(t.data, '$.lengthOfTest') AS FLOAT64) / 60 AS lengthOfTest
    TIMESTAMP_SECONDS(
      SAFE_CAST(JSON_VALUE(t.data, '$.createdOn._seconds') AS INT64)
    ) AS createdOn

  FROM ${testsTable()} t

  LEFT JOIN ${devicesTable()} d
    ON JSON_VALUE(t.data, '$.deviceId')
       = JSON_VALUE(d.data, '$.deviceId')

  LEFT JOIN ${organizationsTable()} o
    ON JSON_VALUE(t.data, '$.organizationId')
       = JSON_VALUE(o.data, '$.organizationId')

  WHERE 1=1
  ${dateFilter}
  ${stateFilter}
  ${channelFilter}
  ${testTypeFilter}
  ${productFilter}
  ${orgFilter}
),

/* ================= MONTHS ================= */

months AS (
  SELECT
    DATE_TRUNC(d, MONTH) AS month,
    FORMAT_DATE('%b %Y', DATE_TRUNC(d, MONTH)) AS monthLabel
  FROM UNNEST(
    GENERATE_DATE_ARRAY(
      DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH), MONTH),
      DATE_TRUNC(CURRENT_DATE(), MONTH),
      INTERVAL 1 MONTH
    )
  ) AS d
),

monthlyGrowth AS (
  SELECT
    m.monthLabel AS month,
    COUNT(b.testId) AS totalTests
  FROM months m
  LEFT JOIN baseTests b
    ON DATE_TRUNC(DATE(b.createdOn), MONTH) = m.month
  GROUP BY m.month, m.monthLabel
  ORDER BY m.month
),

avgTestsPerDevice AS (
  SELECT ROUND(AVG(cnt),2) AS value
  FROM (
    SELECT deviceId, COUNT(*) AS cnt
    FROM baseTests
    GROUP BY deviceId
  )
),

modeTestDuration AS (
  SELECT lengthOfTest AS value
  FROM baseTests
  GROUP BY lengthOfTest
  ORDER BY COUNT(*) DESC
  LIMIT 1
),


avgDailyTests AS (
  SELECT ROUND(AVG(cnt),2) AS value
  FROM (
    SELECT DATE(createdOn) AS d, COUNT(*) AS cnt
    FROM baseTests
    GROUP BY d
  )
),

needAttention AS (
  SELECT COUNT(DISTINCT organizationName) AS value
  FROM baseTests
  WHERE DATE(createdOn) < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
),

orgCounts AS (
  SELECT organizationName, COUNT(*) AS totalTests
  FROM baseTests
  GROUP BY organizationName
),

top10Org AS (
  SELECT * FROM orgCounts
  ORDER BY totalTests DESC
  LIMIT 10
),

low10Org AS (
  SELECT * FROM orgCounts
  ORDER BY totalTests ASC
  LIMIT 10
),

deviceCounts AS (
  SELECT deviceId, COUNT(*) AS totalTests
  FROM baseTests
  GROUP BY deviceId
),

top10Devices AS (
  SELECT * FROM deviceCounts
  ORDER BY totalTests DESC
  LIMIT 10
),

motherCounts AS (
  SELECT motherId, COUNT(*) AS totalTests
  FROM baseTests
  GROUP BY motherId
),

motherAnalysis AS (
  SELECT
    SUM(CASE WHEN totalTests = 0 THEN 1 ELSE 0 END) AS zeroTests,
    SUM(CASE WHEN totalTests = 1 THEN 1 ELSE 0 END) AS oneTest,
    SUM(CASE WHEN totalTests = 2 THEN 1 ELSE 0 END) AS twoTests,
    SUM(CASE WHEN totalTests >= 3 THEN 1 ELSE 0 END) AS threePlusTests
  FROM motherCounts
),

durationDist AS (
  SELECT
    CASE
      WHEN lengthOfTest < 20 THEN '<20 min'
      WHEN lengthOfTest < 40 THEN '20-40 min'
      WHEN lengthOfTest < 60 THEN '40-60 min'
      ELSE '60+ min'
    END AS label,
    COUNT(*) AS count
  FROM baseTests
  WHERE lengthOfTest IS NOT NULL
  GROUP BY label
)

SELECT

STRUCT(
  (SELECT value FROM avgTestsPerDevice) AS avgTestsPerDevice,
(SELECT value FROM modeTestDuration) AS modeTestDuration,
  (SELECT value FROM avgDailyTests) AS avgDailyTests,
  (SELECT value FROM needAttention) AS needAttention
) AS summary,

(SELECT ARRAY_AGG(STRUCT(month, totalTests))
 FROM monthlyGrowth) AS monthlyGrowth,

STRUCT(
  (SELECT ARRAY_AGG(t) FROM top10Org t) AS top10,
  (SELECT ARRAY_AGG(l) FROM low10Org l) AS low10
) AS organizationAnalysis,

STRUCT(
  (SELECT ARRAY_AGG(d) FROM top10Devices d) AS top10Devices
) AS deviceAnalysis,

(SELECT AS STRUCT * FROM motherAnalysis) AS motherAnalysis,

(SELECT ARRAY_AGG(d) FROM durationDist d) AS testDurationDistribution
`;

    const queryOptions: any = {
      query: sql,
      location: LOCATION,
      params: {}
    };

    if (from && to) {
      queryOptions.params.from = from;
      queryOptions.params.to = to;
    }

    if (isGroupUser) {
      queryOptions.params.orgIds = allowedOrgIds;
    }

    const [rows] = await bigquery.query(queryOptions);

    const result = rows[0];

    cache.set(cacheKey, result, 2592000);

    return result;
  }
}