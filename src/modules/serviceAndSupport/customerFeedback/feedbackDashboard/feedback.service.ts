import { bigquery } from '../../../../config/bigQuery.js';
import { cache } from '../../../../config/cache.js';
import type { FeedbackQuery } from './feedback.interface.js';

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || 'asia-south1';

/* ================= TABLE ================= */

const FEEDBACK_TABLE = 'customerFeedbacks_raw_latest';
const table = () =>
  `\`${PROJECT}.${DATASET}.${FEEDBACK_TABLE}\``;


/* ================= SERVICE ================= */

export class FeedbackService {

  /* =====================================================
     CUSTOMER FEEDBACK DASHBOARD
  ===================================================== */

  static async getDashboard(query: FeedbackQuery) {

    const { from, to } = query;

    /* ================= CACHE ================= */

    const cacheKey = `feedback:${from}:${to}`;

    const cached = cache.get(cacheKey);

    if (cached) {
      // console.log('⚡ Feedback Cache Hit');
      return cached;
    }

    // console.log('📡 Feedback Cache Miss → BigQuery');


    /* ================= BIGQUERY ================= */

    const sql = `

    WITH

    /* ================= BASE ================= */

    base AS (
  SELECT

    document_id,

    JSON_VALUE(data, '$.ticketId') AS ticketId,

    JSON_VALUE(data, '$.organizationName') AS organizationName,

    JSON_VALUE(data, '$.customerEmail') AS customerEmail,

    CAST(JSON_VALUE(data, '$.rating') AS INT64) AS rating,

    JSON_VALUE(data, '$.comment') AS comment,

    TIMESTAMP(JSON_VALUE(data, '$.createdOn')) AS createdOn,

    TIMESTAMP(JSON_VALUE(data, '$.modifiedAt')) AS modifiedAt,

    JSON_VALUE(data, '$.channel') AS channel

  FROM ${table()}

  WHERE DATE(
    TIMESTAMP(JSON_VALUE(data, '$.createdOn'))
  )
  BETWEEN '${from}' AND '${to}'
),


    /* ================= TOTAL ================= */

    total AS (
      SELECT COUNT(*) AS totalSent
      FROM base
    ),


    responded AS (
      SELECT COUNT(*) AS totalResponses
      FROM base
      WHERE rating IS NOT NULL
    ),


    /* ================= POSITIVE ================= */

    positive AS (
      SELECT COUNT(*) AS count
      FROM base
      WHERE rating >= 4
    ),


    /* ================= NEGATIVE ================= */

    negative AS (
      SELECT COUNT(*) AS count
      FROM base
      WHERE rating <= 2
    ),


    /* ================= AVG ================= */

    avgRating AS (
      SELECT ROUND(AVG(rating), 2) AS avg
      FROM base
      WHERE rating IS NOT NULL
    ),


    /* ================= DISTRIBUTION ================= */

    distribution AS (
      SELECT
        rating AS star,
        COUNT(*) AS count
      FROM base
      WHERE rating IS NOT NULL
      GROUP BY rating
      ORDER BY star DESC
    ),


    /* ================= CSAT ================= */
    /* (4+ stars / total responses) * 100 */

    csat AS (
      SELECT
        ROUND(
          SAFE_DIVIDE(
            SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END),
            COUNT(*)
          ) * 100
        ,2) AS score
      FROM base
      WHERE rating IS NOT NULL
    ),


    /* ================= NPS ================= */
    /* Promoter(5) - Detractor(1,2) */

    nps AS (
      SELECT

        (
          SAFE_DIVIDE(
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END),
            COUNT(*)
          ) * 100
        )

        -

        (
          SAFE_DIVIDE(
            SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END),
            COUNT(*)
          ) * 100
        )

        AS score

      FROM base
      WHERE rating IS NOT NULL
    ),


    /* ================= RESPONSE RATE ================= */

    responseRate AS (
      SELECT
        ROUND(
          SAFE_DIVIDE(
            (SELECT totalResponses FROM responded),
            (SELECT totalSent FROM total)
          ) * 100
        ,2) AS rate
    ),


    /* ================= ALL ================= */

    allData AS (
      SELECT *
      FROM base
      WHERE rating IS NOT NULL
      ORDER BY createdOn DESC
    ),


    positiveData AS (
      SELECT *
      FROM base
      WHERE rating >= 4
      ORDER BY createdOn DESC
    ),


    negativeData AS (
      SELECT *
      FROM base
      WHERE rating <= 2
      ORDER BY createdOn DESC
    ),


    pendingData AS (
      SELECT *
      FROM base
      WHERE rating IS NULL
      ORDER BY createdOn DESC
    )


    /* ================= FINAL ================= */

    SELECT

      STRUCT(
        (SELECT count FROM positive) AS positive,
        (SELECT count FROM negative) AS needsImprovement,
        (SELECT totalResponses FROM responded) AS totalResponses,
        (SELECT avg FROM avgRating) AS avgRating
      ) AS summary,


      (SELECT ARRAY_AGG(STRUCT(star, count))
       FROM distribution) AS ratingDistribution,


      STRUCT(
        (SELECT score FROM csat) AS csat,
        (SELECT score FROM nps) AS nps,
        (SELECT rate FROM responseRate) AS responseRate
      ) AS feedbackSummary,


      (SELECT ARRAY_AGG(t) FROM allData t) AS allResponses,

      (SELECT ARRAY_AGG(t) FROM positiveData t) AS positiveResponses,

      (SELECT ARRAY_AGG(t) FROM negativeData t) AS negativeResponses,

      (SELECT ARRAY_AGG(t) FROM pendingData t) AS pendingResponses

    `;


    /* ================= EXECUTE ================= */

    const [rows] = await bigquery.query({
      query: sql,
      location: LOCATION
    });


    const result = rows[0];


    /* ================= CACHE ================= */

    cache.set(cacheKey, result, 86400); // 24 hrs


    return result;
  }

}