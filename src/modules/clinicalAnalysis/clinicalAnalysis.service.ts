import { bigquery } from "../../config/bigQuery.js";
import type {
  ClinicalSummary,
  AgeDistribution,
  TransitionRecord,
} from "./clinicalAnalysis.interface.js";

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

/* ================= TABLES ================= */

const TESTS_TABLE = "tests_raw_latest";
const MOTHERS_TABLE = "mothers_raw_latest";

const testsTable = () =>
  `\`${PROJECT}.${DATASET}.${TESTS_TABLE}\``;

const mothersTable = () =>
  `\`${PROJECT}.${DATASET}.${MOTHERS_TABLE}\``;

/* ================= SERVICE ================= */

export class ClinicalService {

  /* ================= SUMMARY ================= */

  static async getSummary(): Promise<ClinicalSummary> {

    const query = `

    WITH classified AS (

      SELECT
        JSON_VALUE(t.data,'$.id') AS testId,
        JSON_VALUE(t.data,'$.motherId') AS motherId,

        CASE
          WHEN JSON_QUERY(t.data,'$.FisherScoreArray') IS NULL
            THEN 'Inconclusive'

          WHEN (
            SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Acceleration') AS INT64) >= 2
            AND SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Bandwidth') AS INT64) >= 20
            AND SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Deceleration') AS INT64) = 0
            AND SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.BaseLine Frequency') AS INT64)
              BETWEEN 110 AND 160
          )
          THEN 'Normal'

          WHEN (
            SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Acceleration') AS INT64) < 2
            OR SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Deceleration') AS INT64) > 0
          )
          THEN 'Critical'

          ELSE 'Abnormal'

        END AS result

      FROM ${testsTable()} t
    )

    SELECT
      COUNT(*) AS totalTests,
      COUNTIF(result='Normal') AS normal,
      COUNTIF(result='Abnormal') AS abnormal,
      COUNTIF(result='Critical') AS critical,
      COUNTIF(result='Inconclusive') AS inconclusive

    FROM classified
    `;

    const [rows] = await bigquery.query({
      query,
      location: LOCATION
    });

    return rows[0];
  }

  /* ================= AGE DISTRIBUTION ================= */

  static async getAgeDistribution(): Promise<AgeDistribution[]> {

    const query = `

    SELECT
      CASE
        WHEN SAFE_CAST(JSON_VALUE(m.data,'$.age') AS INT64) BETWEEN 18 AND 22 THEN '18-22'
        WHEN SAFE_CAST(JSON_VALUE(m.data,'$.age') AS INT64) BETWEEN 23 AND 27 THEN '23-27'
        WHEN SAFE_CAST(JSON_VALUE(m.data,'$.age') AS INT64) BETWEEN 28 AND 32 THEN '28-32'
        WHEN SAFE_CAST(JSON_VALUE(m.data,'$.age') AS INT64) BETWEEN 33 AND 37 THEN '33-37'
        ELSE '38+'
      END AS ageGroup,

      COUNT(*) AS count

    FROM ${mothersTable()} m

    GROUP BY ageGroup
    ORDER BY ageGroup
    `;

    const [rows] = await bigquery.query({
      query,
      location: LOCATION
    });

    return rows;
  }

  /* ================= TRANSITIONS ================= */

  static async getTransitions(): Promise<TransitionRecord[]> {

    const query = `

    WITH classified AS (

      SELECT
        JSON_VALUE(t.data,'$.motherId') AS motherId,
        JSON_VALUE(m.data,'$.name') AS motherName,
        SAFE_CAST(JSON_VALUE(m.data,'$.age') AS INT64) AS motherAge,
        JSON_VALUE(t.data,'$.organizationName') AS organizationName,

        TIMESTAMP_SECONDS(
          SAFE_CAST(JSON_VALUE(t.data,'$.createdOn._seconds') AS INT64)
        ) AS testDate,

        CASE
          WHEN JSON_QUERY(t.data,'$.FisherScoreArray') IS NULL
            THEN 'Inconclusive'

          WHEN (
            SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Acceleration') AS INT64) >= 2
            AND SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Bandwidth') AS INT64) >= 20
            AND SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Deceleration') AS INT64) = 0
          )
          THEN 'Normal'

          WHEN (
            SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Acceleration') AS INT64) < 2
            OR SAFE_CAST(JSON_VALUE(t.data,'$.FisherScoreArray.Deceleration') AS INT64) > 0
          )
          THEN 'Critical'

          ELSE 'Abnormal'

        END AS result

      FROM ${testsTable()} t

      LEFT JOIN ${mothersTable()} m
        ON JSON_VALUE(t.data,'$.motherId')
           = JSON_VALUE(m.data,'$.id')
    ),

    ordered AS (

      SELECT
        *,
        LAG(result) OVER(PARTITION BY motherId ORDER BY testDate) AS prevResult,
        LAG(testDate) OVER(PARTITION BY motherId ORDER BY testDate) AS prevDate

      FROM classified
    )

    SELECT
      motherId,
      motherName,
      motherAge,
      organizationName AS hospitalName,
      CONCAT(prevResult,' → ',result) AS transitionPath,
      DATE_DIFF(DATE(testDate), DATE(prevDate), DAY) AS totalDays,
      0 AS testsInBetween

    FROM ordered
    WHERE prevResult IS NOT NULL
    `;

    const [rows] = await bigquery.query({
      query,
      location: LOCATION
    });

    return rows;
  }

}