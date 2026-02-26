import { bigquery } from '../../../../config/bigQuery.js';
import { cache } from '../../../../config/cache.js';
import type { ServiceDashboardQuery } from './service.interface.js';

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

/* ================= TABLES ================= */
/* Firestore Export Tables */

const TABLES = {
  tickets: 'tickets_raw_latest',
  devices: 'devices_raw_latest',
  users: 'users_raw_latest'
} as const;

type TableKey = keyof typeof TABLES;

/* ================= HELPERS ================= */

const table = (name: TableKey) =>
  `\`${PROJECT}.${DATASET}.${TABLES[name]}\``;

/* ================= SERVICE ================= */

export class ServiceSupportService {

  /* =====================================================
      MAIN SERVICE DASHBOARD
  ===================================================== */

  static async getServiceDashboard(query: ServiceDashboardQuery) {

    const { from, to } = query;

    /* ================= CACHE ================= */

    const cacheKey = `service-dashboard:${from}:${to}`;

    const cached = cache.get(cacheKey);

    if (cached) {
      console.log('⚡ Service Cache Hit');
      return cached;
    }

    console.log('📡 Service Cache Miss → BigQuery');

    /* ================= BIGQUERY SQL ================= */

    const querySQL = `
    WITH

    /* ================= FILTERED TICKETS ================= */

    tickets_filtered AS (
      SELECT
        *,
        TIMESTAMP(JSON_VALUE(data,'$.createdOn')) AS createdAt,
        TIMESTAMP(JSON_VALUE(data,'$.resolvedAt')) AS resolvedAt,
        JSON_VALUE(data,'$.status') AS status
      FROM ${table('tickets')}
      WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.createdOn')))
        BETWEEN '${from}' AND '${to}'
    ),


    /* ================= COUNTS ================= */

    counts AS (
      SELECT

        /* Open Tickets */
        COUNTIF(status = 'open') AS openTickets,

        /* Resolved This Month */
        COUNTIF(
          status = 'resolved'
          AND FORMAT_DATE('%Y-%m', DATE(resolvedAt))
              = FORMAT_DATE('%Y-%m', CURRENT_DATE())
        ) AS resolvedThisMonth

      FROM tickets_filtered
    ),


    /* ================= AVG RESOLUTION ================= */

    avgResolution AS (
      SELECT
        ROUND(
          AVG(
            TIMESTAMP_DIFF(resolvedAt, createdAt, HOUR)
          ),
          2
        ) AS avgResolutionHours
      FROM tickets_filtered
      WHERE status = 'resolved'
        AND resolvedAt IS NOT NULL
    ),


    /* ================= SERVICE TICKETS ================= */

    serviceTickets AS (
      SELECT
        document_id AS ticketId,

        JSON_VALUE(data,'$.deviceId') AS deviceId,
        JSON_VALUE(data,'$.organizationName') AS organization,
        JSON_VALUE(data,'$.issueType') AS issueType,
        JSON_VALUE(data,'$.priority') AS priority,
        JSON_VALUE(data,'$.status') AS status,
        JSON_VALUE(data,'$.attempts') AS attempts,

        DATE(TIMESTAMP(JSON_VALUE(data,'$.createdOn'))) AS createdOn,

        IFNULL(
          TIMESTAMP_DIFF(
            TIMESTAMP(JSON_VALUE(data,'$.resolvedAt')),
            TIMESTAMP(JSON_VALUE(data,'$.createdOn')),
            HOUR
          ),
          NULL
        ) AS resolutionTime

      FROM ${table('tickets')}
      WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.createdOn')))
        BETWEEN '${from}' AND '${to}'
    ),


    /* ================= WARRANTY ================= */

    warrantySoon AS (
      SELECT
        document_id AS deviceId,
        JSON_VALUE(data,'$.organizationName') AS organization,
        DATE(TIMESTAMP(JSON_VALUE(data,'$.warrantyEndDate'))) AS warrantyEnd
      FROM ${table('devices')}
      WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.warrantyEndDate')))
        BETWEEN CURRENT_DATE()
        AND DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
    ),


    expiredWarranty AS (
      SELECT
        document_id AS deviceId,
        JSON_VALUE(data,'$.organizationName') AS organization,
        DATE(TIMESTAMP(JSON_VALUE(data,'$.warrantyEndDate'))) AS warrantyEnd
      FROM ${table('devices')}
      WHERE DATE(TIMESTAMP(JSON_VALUE(data,'$.warrantyEndDate')))
        < CURRENT_DATE()
    ),


    /* ================= AMC ================= */

    amcData AS (
      SELECT
        document_id AS deviceId,
        JSON_VALUE(data,'$.organizationName') AS organization,

        JSON_VALUE(data,'$.amcLog.amcStartDate') AS amcStart,

        JSON_VALUE(data,'$.amcLog.amcValidity') AS amcValidity,

        DATE(TIMESTAMP(JSON_VALUE(data,'$.amcLog.amcValidity')))
          AS amcEndDate

      FROM ${table('users')}
      WHERE JSON_VALUE(data,'$.type') = 'device'
        AND JSON_VALUE(data,'$.amcLog.amcValidity') IS NOT NULL
    )


    /* ================= FINAL OUTPUT ================= */

    SELECT

      /* COUNTS */
      (SELECT AS STRUCT * FROM counts) AS counts,

      /* AVG RESOLUTION */
      (SELECT AS STRUCT * FROM avgResolution) AS avgResolution,

      /* SERVICE TICKETS */
      (
        SELECT ARRAY_AGG(STRUCT(
          ticketId,
          deviceId,
          organization,
          issueType,
          priority,
          status,
          attempts,
          createdOn,
          resolutionTime
        ))
        FROM serviceTickets
      ) AS tickets,


      /* WARRANTY */
      STRUCT(

        (
          SELECT ARRAY_AGG(STRUCT(
            deviceId,
            organization,
            warrantyEnd
          ))
          FROM warrantySoon
        ) AS expiringSoon,

        (
          SELECT ARRAY_AGG(STRUCT(
            deviceId,
            organization,
            warrantyEnd
          ))
          FROM expiredWarranty
        ) AS expired

      ) AS warranty,


      /* AMC */
      (
        SELECT ARRAY_AGG(STRUCT(
          deviceId,
          organization,
          amcStart,
          amcValidity,
          amcEndDate,

          CASE
            WHEN amcEndDate >= CURRENT_DATE() THEN 'Active'
            ELSE 'Expired'
          END AS status,

          DATE_DIFF(amcEndDate, CURRENT_DATE(), DAY)
            AS daysRemaining

        ))
        FROM amcData
      ) AS amc

    `;

    /* ================= EXECUTE ================= */

    const [rows] = await bigquery.query({
      query: querySQL,
      location: LOCATION
    });

    const result = rows[0];

    /* ================= CACHE (1 HOUR) ================= */

    cache.set(cacheKey, result, 3600);

    return result;
  }

}