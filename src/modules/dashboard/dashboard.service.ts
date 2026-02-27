// import { bigquery } from '../../config/bigQuery.js';
// import { cache } from '../../config/cache.js';
// import type { DashboardQuery } from './dashboard.interface.js';

// // ENV
// const PROJECT = process.env.BQ_PROJECT_ID!;
// const DATASET = process.env.BQ_DATASET!;
// const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

// // TABLE MAPPING (Firestore Export)
// const TABLES = {
//   devices: 'devices_raw_latest',
//   mothers: 'mothers_raw_latest',
//   tests: 'tests_raw_latest',
//   users: 'users_raw_latest',
//   organizations: 'organizations_raw_latest'
// } as const;

// type TableKey = keyof typeof TABLES;

// // Build table path
// const table = (name: TableKey) =>
//   `\`${PROJECT}.${DATASET}.${TABLES[name]}\``;

// export class DashboardService {

//   // ================= MAIN =================

//   static async getDashboard(query: DashboardQuery) {

//     const { from, to, product, mode, trend } = query;

//     const cacheKey = `dashboard:${from}:${to}:${product}:${mode}:${trend}`;

//     // Cache
//     const cached = cache.get(cacheKey);

//     if (cached) {
//       console.log('⚡ Cache Hit', cached);
//       return cached;
//     }

//     console.log('📡 Cache Miss → BigQuery');

//     // Queries
//     // const counts = await this.getCounts(from, to);
//     // const warranty = await this.getWarranty();
//     // const amc = await this.getAMC();
//     // const distribution = await this.getDistribution();
//     // const deviceStatus = await this.getDeviceStatus();
//     // const trends = await this.getTrends(from, to, trend || 'daily');
//     // const lowUsage = await this.getLowUsageOrgs();
//     const [
//   counts,
//   warranty,
//   amc,
//   distribution,
//   deviceStatus,
//   trends,
//   lowUsage
// ] = await Promise.all([
//   this.getCounts(from, to),
//   this.getWarranty(),
//   this.getAMC(),
//   this.getDistribution(),
//   this.getDeviceStatus(),
//   this.getTrends(from, to, trend || 'daily'),
//   this.getLowUsageOrgs()
// ]);


//     const response = {
//       counts,
//       warranty,
//       amc,
//       distribution,
//       deviceStatus,
//       trends,
//       lowUsageOrgs: lowUsage
//     };

//     // Cache 1 hr
//     cache.set(cacheKey, response, 3600);

//     return response;
//   }

//   // ================= COUNTS =================

//   static async getCounts(from: string, to: string) {

//     const query = `
//       SELECT

//         (SELECT COUNT(*) FROM ${table('organizations')}) AS organizations,

//         (SELECT COUNT(*)
//          FROM ${table('mothers')}
//          WHERE DATE(
//            TIMESTAMP(
//              JSON_VALUE(data, '$.createdOn')
//            )
//          ) BETWEEN '${from}' AND '${to}'
//         ) AS mothers,

//         (SELECT COUNT(*) FROM ${table('devices')}) AS devices,

//         (SELECT COUNT(*)
//          FROM ${table('tests')}
//          WHERE DATE(
//            TIMESTAMP(
//              JSON_VALUE(data, '$.testDate')
//            )
//          ) BETWEEN '${from}' AND '${to}'
//         ) AS tests
//     `;

//     const [rows] = await bigquery.query({
//       query,
//       location: LOCATION
//     });

//     return rows[0];
//   }

//   // ================= WARRANTY =================

//   static async getWarranty() {

//     const query = `
//       SELECT COUNT(*) AS underWarranty
//       FROM ${table('devices')}
//       WHERE DATE(
//         TIMESTAMP(
//           JSON_VALUE(data, '$.warrantyEndDate')
//         )
//       ) >= CURRENT_DATE()
//     `;

//     const [rows] = await bigquery.query({
//       query,
//       location: LOCATION
//     });

//     return rows[0];
//   }

//   // ================= AMC =================

//   static async getAMC() {

//     const query = `
//       SELECT COUNT(*) AS underAMC
//       FROM ${table('devices')}
//       WHERE DATE(
//         TIMESTAMP(
//           JSON_VALUE(data, '$.amcValidity')
//         )
//       ) >= CURRENT_DATE()
//     `;

//     const [rows] = await bigquery.query({
//       query,
//       location: LOCATION
//     });

//     return rows[0];
//   }

//   // ================= DISTRIBUTION =================

//   static async getDistribution() {

//     const query = `
//       SELECT
//         JSON_VALUE(data, '$.productType') AS productType,
//         COUNT(*) AS count
//       FROM ${table('devices')}
//       GROUP BY productType
//     `;

//     const [rows] = await bigquery.query({
//       query,
//       location: LOCATION
//     });

//     return rows;
//   }

//   // ================= DEVICE STATUS =================

//   static async getDeviceStatus() {

//     const query = `
//       SELECT
//         JSON_VALUE(data, '$.isActive') AS isActive,
//         COUNT(*) AS count
//       FROM ${table('users')}
//       WHERE JSON_VALUE(data, '$.type') = 'device'
//       GROUP BY isActive
//     `;

//     const [rows] = await bigquery.query({
//       query,
//       location: LOCATION
//     });

//     return rows;
//   }

//   // ================= TRENDS =================

//   static async getTrends(
//     from: string,
//     to: string,
//     trend: string
//   ) {

//     let format = '';

//     if (trend === 'daily') {
//       format = 'DATE(ts)';
//     }

//     if (trend === 'weekly') {
//       format = "FORMAT_DATE('%Y-%W', DATE(ts))";
//     }

//     if (trend === 'monthly') {
//       format = "FORMAT_DATE('%Y-%m', DATE(ts))";
//     }

//     const mothersQuery = `
//       WITH data_cte AS (
//         SELECT
//           TIMESTAMP(
//             JSON_VALUE(data, '$.createdOn')
//           ) AS ts
//         FROM ${table('mothers')}
//       )

//       SELECT
//         ${format} AS period,
//         COUNT(*) AS count
//       FROM data_cte
//       WHERE DATE(ts) BETWEEN '${from}' AND '${to}'
//       GROUP BY period
//       ORDER BY period
//     `;

//     const testsQuery = `
//       WITH data_cte AS (
//         SELECT
//           TIMESTAMP(
//             JSON_VALUE(data, '$.testDate')
//           ) AS ts
//         FROM ${table('tests')}
//       )

//       SELECT
//         ${format} AS period,
//         COUNT(*) AS count
//       FROM data_cte
//       WHERE DATE(ts) BETWEEN '${from}' AND '${to}'
//       GROUP BY period
//       ORDER BY period
//     `;

//     const [mothers] = await bigquery.query({
//       query: mothersQuery,
//       location: LOCATION
//     });

//     const [tests] = await bigquery.query({
//       query: testsQuery,
//       location: LOCATION
//     });

//     return {
//       mothers,
//       tests
//     };
//   }

//   // ================= LOW USAGE ORGS =================

//   static async getLowUsageOrgs() {

//     const query = `
//       SELECT COUNT(*) AS count
//       FROM ${table('organizations')}
//       WHERE document_id NOT IN (

//         SELECT DISTINCT
//           JSON_VALUE(data, '$.organizationId')
//         FROM ${table('tests')}
//         WHERE DATE(
//           TIMESTAMP(
//             JSON_VALUE(data, '$.testDate')
//           )
//         ) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)

//       )
//     `;

//     const [rows] = await bigquery.query({
//       query,
//       location: LOCATION
//     });

//     return rows[0].count;
//   }

// }
// import { bigquery } from '../../config/bigQuery.js';
// import { cache } from '../../config/cache.js';
// import type { DashboardQuery } from './dashboard.interface.js';

// const PROJECT = process.env.BQ_PROJECT_ID!;
// const DATASET = process.env.BQ_DATASET!;
// const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

// const TABLES = {
//   devices: 'devices_raw_latest',
//   mothers: 'mothers_raw_latest',
//   tests: 'tests_raw_latest',
//   users: 'users_raw_latest',
//   organizations: 'organizations_raw_latest',
//   distributors: 'distributors_raw_latest'
// } as const;

// type TableKey = keyof typeof TABLES;

// const table = (name: TableKey) =>
//   `\`${PROJECT}.${DATASET}.${TABLES[name]}\``;

// export class DashboardService {

//   static async getDashboard(query: DashboardQuery) {

//     const {
//       from,
//       to,
//       product,
//       mode,
//       state,
//       salesChannel,
//       testType,
//       trend = 'daily'
//     } = query;

//     const cacheKey = `dashboard:${JSON.stringify(query)}`;
//     const cached = cache.get(cacheKey);
//     if (cached) return cached;

//     let trendFormat = 'DATE(ts)';
//     if (trend === 'weekly') trendFormat = "FORMAT_DATE('%Y-%W', DATE(ts))";
//     if (trend === 'monthly') trendFormat = "FORMAT_DATE('%Y-%m', DATE(ts))";

//     const productFilter =
//       product && product !== 'All'
//         ? `AND JSON_VALUE(d.data,'$.productType')='${product}'`
//         : '';

//     const modeFilter =
//       mode && mode !== 'All'
//         ? `AND JSON_VALUE(d.data,'$.deviceMode')='${mode}'`
//         : '';

//     const stateFilter =
//       state && state !== 'All'
//         ? `AND JSON_VALUE(o.data,'$.state')='${state}'`
//         : '';

//     const testTypeFilter =
//       testType && testType !== 'All'
//         ? `AND JSON_VALUE(data,'$.testType')='${testType}'`
//         : '';

//     const sql = `
//     WITH orgs AS (
//       SELECT
//         JSON_VALUE(data,'$.organizationId') AS organizationId,
//         JSON_VALUE(data,'$.state') AS state,
//         JSON_VALUE(data,'$.city') AS city
//       FROM ${table('organizations')}
//     ),

//     devicesWithOrg AS (
//       SELECT
//         JSON_VALUE(d.data,'$.organizationId') AS organizationId,
//         JSON_VALUE(d.data,'$.productType') AS productType,
//         o.state,
//         o.city
//       FROM ${table('devices')} d
//       LEFT JOIN orgs o
//       ON JSON_VALUE(d.data,'$.organizationId') = o.organizationId
//       WHERE 1=1 ${productFilter} ${modeFilter} ${stateFilter}
//     ),

//     stateStats AS (
//       SELECT
//         state,
//         COUNT(DISTINCT organizationId) AS orgCount,
//         COUNT(*) AS deviceCount
//       FROM devicesWithOrg
//       GROUP BY state
//     ),

//     cityDeviceCounts AS (
//       SELECT
//         city,
//         COUNT(*) AS count
//       FROM devicesWithOrg
//       GROUP BY city
//     ),

//     distributors AS (
//       SELECT
//         JSON_VALUE(data,'$.city') AS city,
//         JSON_VALUE(data,'$.state') AS state
//       FROM ${table('distributors')}
//     )

//     SELECT

//     STRUCT(
//       (SELECT COUNT(*) FROM ${table('organizations')}) AS organizations,
//       (SELECT COUNT(*) FROM ${table('mothers')}
//         WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.createdOn')))
//         BETWEEN '${from}' AND '${to}') AS mothers,
//       (SELECT COUNT(*) FROM ${table('devices')}) AS devices,
//       (SELECT COUNT(*) FROM ${table('tests')}
//         WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.testDate')))
//         BETWEEN '${from}' AND '${to}'
//         ${testTypeFilter}) AS tests
//     ) AS counts,

//     STRUCT(
//       (SELECT COUNT(*) FROM ${table('devices')}
//        WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.warrantyEndDate')))
//        >= CURRENT_DATE()) AS underWarranty
//     ) AS warranty,

//     STRUCT(
//       (SELECT COUNT(*) FROM ${table('devices')}
//        WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.amcValidity')))
//        >= CURRENT_DATE()) AS underAMC
//     ) AS amc,

//     (SELECT ARRAY_AGG(STRUCT(productType, COUNT(*) AS count))
//      FROM devicesWithOrg
//      GROUP BY productType) AS distribution,

//     (SELECT ARRAY_AGG(STRUCT(isActive, COUNT(*) AS count))
//      FROM (
//        SELECT JSON_VALUE(data,'$.isActive') AS isActive
//        FROM ${table('users')}
//        WHERE JSON_VALUE(data,'$.type')='device'
//      )
//      GROUP BY isActive) AS deviceStatus,

//     STRUCT(
//       (SELECT ARRAY_AGG(STRUCT(period,count))
//        FROM (
//          SELECT ${trendFormat} AS period, COUNT(*) AS count
//          FROM ${table('mothers')}
//          WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.createdOn')))
//          BETWEEN '${from}' AND '${to}'
//          GROUP BY period
//        )) AS mothers,

//       (SELECT ARRAY_AGG(STRUCT(period,count))
//        FROM (
//          SELECT ${trendFormat} AS period, COUNT(*) AS count
//          FROM ${table('tests')}
//          WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.testDate')))
//          BETWEEN '${from}' AND '${to}'
//          GROUP BY period
//        )) AS tests
//     ) AS trends,

//     (SELECT ARRAY_AGG(STRUCT(state,orgCount,deviceCount))
//      FROM stateStats) AS stateStats,

//     (SELECT ARRAY_AGG(STRUCT(city,count))
//      FROM cityDeviceCounts) AS cityDeviceCounts,

//     (SELECT ARRAY_AGG(STRUCT(city,state))
//      FROM distributors) AS distributorCities
//     `;

//     const [rows] = await bigquery.query({
//       query: sql,
//       location: LOCATION
//     });

//     cache.set(cacheKey, rows[0], 3600);

//     return rows[0];
//   }
// }

import { bigquery } from '../../config/bigQuery.js';
import { cache } from '../../config/cache.js';
import type { DashboardQuery } from './dashboard.interface.js';

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

const TABLES = {
  devices: 'devices_raw_latest',
  mothers: 'mothers_raw_latest',
  tests: 'tests_raw_latest',
  organizations: 'organizations_raw_latest',
  users: 'users_raw_latest'
} as const;

type TableKey = keyof typeof TABLES;

const table = (name: TableKey) =>
  `\`${PROJECT}.${DATASET}.${TABLES[name]}\``;

export class DashboardService {

  static async getDashboard(query: DashboardQuery, user: any) {

    const { from, to, trend = 'daily' } = query;

    const isGroupUser = user?.type === 'groupUser';

    const allowedOrgIds: string[] =
      isGroupUser && Array.isArray(user.allowedOrganizations)
        ? user.allowedOrganizations.map((id: string) => id.trim())
        : [];

    const cacheKey = `dashboard:${user?.type}:${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    /* ---------- TREND EXPRESSION ---------- */

    let trendExpr = `
      DATE(TIMESTAMP_SECONDS(
        CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
      ))
    `;

    if (trend === 'weekly') {
      trendExpr = `
        FORMAT_DATE('%Y-%W',
          DATE(TIMESTAMP_SECONDS(
            CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
          ))
        )
      `;
    }

    if (trend === 'monthly') {
      trendExpr = `
        FORMAT_DATE('%Y-%m',
          DATE(TIMESTAMP_SECONDS(
            CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
          ))
        )
      `;
    }

    /* ---------- DYNAMIC ORG FILTER ---------- */

    const orgFilter = isGroupUser
      ? `JSON_VALUE(data,'$.organizationId') IN UNNEST(@orgIds)`
      : `TRUE`;

    /* ---------- SQL ---------- */

    const sql = `
    WITH device_base AS (
      SELECT
        JSON_VALUE(data,'$.organizationId') AS organizationId,
        JSON_VALUE(data,'$.productType') AS productType,
        SAFE_CAST(JSON_VALUE(data,'$.warrantyEndDate._seconds') AS INT64) AS warrantySec,
        SAFE_CAST(JSON_VALUE(data,'$.amcValidity._seconds') AS INT64) AS amcSec
      FROM ${table('devices')}
      WHERE ${orgFilter}
    ),

    users_device AS (
      SELECT
        JSON_VALUE(data,'$.organizationId') AS organizationId,
        JSON_VALUE(data,'$.isActive') AS isActive
      FROM ${table('users')}
      WHERE JSON_VALUE(data,'$.type') = 'device'
      AND ${orgFilter}
    ),

    org_last_test AS (
      SELECT
        JSON_VALUE(data,'$.organizationId') AS organizationId,
        MAX(DATE(TIMESTAMP_SECONDS(
          CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
        ))) AS lastTestDate
      FROM ${table('tests')}
      GROUP BY organizationId
    )

    SELECT

    STRUCT(
      (SELECT COUNT(*) FROM ${table('organizations')} WHERE ${orgFilter}) AS organizations,

      (SELECT COUNT(*) FROM ${table('mothers')}
       WHERE DATE(TIMESTAMP_SECONDS(
         CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
       )) BETWEEN @from AND @to
       AND ${orgFilter}
      ) AS mothers,

      (SELECT COUNT(*) FROM device_base) AS devices,

      (SELECT COUNT(*) FROM ${table('tests')}
       WHERE DATE(TIMESTAMP_SECONDS(
         CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
       )) BETWEEN @from AND @to
       AND ${orgFilter}
      ) AS tests

    ) AS counts,

    STRUCT(
      (SELECT COUNT(*) FROM device_base
       WHERE warrantySec IS NOT NULL
       AND DATE(TIMESTAMP_SECONDS(warrantySec)) >= CURRENT_DATE()
      ) AS underWarranty,

      (SELECT COUNT(*) FROM device_base
       WHERE warrantySec IS NOT NULL
       AND DATE(TIMESTAMP_SECONDS(warrantySec)) < CURRENT_DATE()
      ) AS outOfWarranty
    ) AS warranty,

    STRUCT(
      (SELECT COUNT(*) FROM device_base
       WHERE amcSec IS NOT NULL
       AND DATE(TIMESTAMP_SECONDS(amcSec)) >= CURRENT_DATE()
      ) AS underAMC,

      (SELECT COUNT(*) FROM device_base
       WHERE amcSec IS NULL
       OR DATE(TIMESTAMP_SECONDS(amcSec)) < CURRENT_DATE()
      ) AS withoutAMC
    ) AS amc,

    (SELECT COUNT(*) FROM org_last_test
     WHERE lastTestDate < DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
    ) AS lowUsageOrganizations,

    (SELECT ARRAY_AGG(STRUCT(productType, count))
     FROM (
       SELECT productType, COUNT(*) AS count
       FROM device_base
       GROUP BY productType
     )
    ) AS distribution,

    (SELECT ARRAY_AGG(STRUCT(isActive, count))
     FROM (
       SELECT isActive, COUNT(*) AS count
       FROM users_device
       GROUP BY isActive
     )
    ) AS deviceStatus,

    STRUCT(
      (SELECT ARRAY_AGG(STRUCT(period,count))
       FROM (
         SELECT ${trendExpr} AS period, COUNT(*) AS count
         FROM ${table('mothers')}
         WHERE DATE(TIMESTAMP_SECONDS(
           CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
         )) BETWEEN @from AND @to
         AND ${orgFilter}
         GROUP BY period
         ORDER BY period
       )
      ) AS mothers,

      (SELECT ARRAY_AGG(STRUCT(period,count))
       FROM (
         SELECT ${trendExpr} AS period, COUNT(*) AS count
         FROM ${table('tests')}
         WHERE DATE(TIMESTAMP_SECONDS(
           CAST(JSON_VALUE(data,'$.createdOn._seconds') AS INT64)
         )) BETWEEN @from AND @to
         AND ${orgFilter}
         GROUP BY period
         ORDER BY period
       )
      ) AS tests
    ) AS trends
    `;

    const queryOptions: any = {
      query: sql,
      location: LOCATION,
      params: { from, to }
    };

    if (isGroupUser) {
      queryOptions.params.orgIds = allowedOrgIds;
    }

    const [rows] = await bigquery.query(queryOptions);

    cache.set(cacheKey, rows[0], 1800);

    return rows[0];
  }
}