import { bigquery } from "../../config/bigQuery.js";
import type {
  ClinicalSummary,
  AgeDistribution,
  TransitionRecord,
} from "./clinicalAnalysis.interface.js";

export class ClinicalService {

  static async getSummary(): Promise<ClinicalSummary> {

    const query = `
    WITH classified AS (

      SELECT
        documentId,
        motherId,

        CASE
          WHEN FisherScoreArray IS NULL OR JSON_LENGTH(FisherScoreArray) = 0
            THEN 'Inconclusive'

          ELSE
            CASE

              WHEN (
                (CAST(FisherScoreArray.Acceleration AS INT64) >= 2) AND
                (CAST(FisherScoreArray.Bandwidth AS INT64) >= 20) AND
                (CAST(FisherScoreArray.Deceleration AS INT64) = 0) AND
                (CAST(FisherScoreArray.\`BaseLine Frequency\` AS INT64) BETWEEN 110 AND 160)
              )
              THEN 'Normal'

              WHEN (
                (CAST(FisherScoreArray.Acceleration AS INT64) < 2) +
                (CAST(FisherScoreArray.Bandwidth AS INT64) < 20) +
                (CAST(FisherScoreArray.Deceleration AS INT64) > 0)
              ) >= 2
              THEN 'Critical'

              ELSE 'Abnormal'

            END
        END AS result

      FROM \`dataset.tests_raw_latest\`
      WHERE delete = false
    )

    SELECT
      COUNT(*) totalTests,
      COUNTIF(result='Normal') normal,
      COUNTIF(result='Abnormal') abnormal,
      COUNTIF(result='Critical') critical,
      COUNTIF(result='Inconclusive') inconclusive

    FROM classified
    `;

    const [rows] = await bigquery.query(query);
    return rows[0];
  }

  static async getAgeDistribution(): Promise<AgeDistribution[]> {

    const query = `
    SELECT
      CASE
        WHEN age BETWEEN 18 AND 22 THEN '18-22'
        WHEN age BETWEEN 23 AND 27 THEN '23-27'
        WHEN age BETWEEN 28 AND 32 THEN '28-32'
        WHEN age BETWEEN 33 AND 37 THEN '33-37'
        ELSE '38+'
      END AS ageGroup,
      COUNT(*) AS count

    FROM \`dataset.mothers_raw_latest\`
    WHERE delete = false

    GROUP BY ageGroup
    ORDER BY ageGroup
    `;

    const [rows] = await bigquery.query(query);
    return rows;
  }

  static async getTransitions(): Promise<TransitionRecord[]> {

    const query = `
    WITH classified AS (

      SELECT
        t.documentId,
        t.motherId,
        m.name AS motherName,
        m.age AS motherAge,
        t.organizationName,
        TIMESTAMP_SECONDS(t.createdOn._seconds) AS testDate,

        CASE
          WHEN t.FisherScoreArray IS NULL OR JSON_LENGTH(t.FisherScoreArray)=0
            THEN 'Inconclusive'

          WHEN (
            CAST(t.FisherScoreArray.Acceleration AS INT64) >=2
            AND CAST(t.FisherScoreArray.Bandwidth AS INT64) >=20
            AND CAST(t.FisherScoreArray.Deceleration AS INT64)=0
          )
          THEN 'Normal'

          WHEN (
            CAST(t.FisherScoreArray.Acceleration AS INT64) <2
            AND CAST(t.FisherScoreArray.Deceleration AS INT64) >0
          )
          THEN 'Critical'

          ELSE 'Abnormal'

        END AS result

      FROM \`dataset.tests_raw_latest\` t
      JOIN \`dataset.mothers_raw_latest\` m
      ON t.motherId = m.documentId

      WHERE t.delete = false
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

    const [rows] = await bigquery.query(query);
    return rows;
  }

}