// import { bigquery } from "../../../../config/bigQuery.js";
// import { cache } from "../../../../config/cache.js";

// /* ================= ENV ================= */

// const PROJECT = process.env.BQ_PROJECT_ID!;
// const DATASET = process.env.BQ_DATASET!;
// const LOCATION = process.env.BQ_LOCATION || "asia-south1";

// /* ================= TABLES ================= */

// const table = (name: string) =>
//   `\`${PROJECT}.${DATASET}.${name}\``;

// const ORG_TABLE = table("organizations_raw_latest");
// const USERS_TABLE = table("users_raw_latest");
// const TESTS_TABLE = table("tests_raw_latest");
// const MOTHERS_TABLE = table("mothers_raw_latest");
// const DEVICES_TABLE = table("devices_raw_latest");


// export class OrganizationDetailsService {

//   /* =====================================================
//      1️⃣ ORGANIZATION HEADER + CARDS
//   ===================================================== */

//   static async getOrganizationDetails(orgId: string) {

//     const cacheKey = `orgDetails:${orgId}`;
//     const cached = cache.get(cacheKey);
//     if (cached) return cached;

//     const sql = `
//     /* ================= ORGANIZATION ================= */

//     WITH org AS (
//       SELECT
//         JSON_VALUE(data, '$.organizationId') AS organizationId,
//         JSON_VALUE(data, '$.organizationName') AS name,
//         JSON_VALUE(data, '$.city') AS city,
//         JSON_VALUE(data, '$.state') AS state,
//         JSON_VALUE(data, '$.contactPerson') AS contactPerson,
//         JSON_VALUE(data, '$.mobile') AS mobile,
//         JSON_VALUE(data, '$.email') AS email,
//         JSON_VALUE(data, '$.saleRepresentative') AS saleRepresentative,
//         JSON_VALUE(data, '$.channelType') AS channelType,

//         TIMESTAMP_SECONDS(
//           SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
//         ) AS registeredAt

//       FROM ${ORG_TABLE}
//       WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     ),

//     /* ================= DEVICE STATS ================= */

//     deviceStats AS (
//       SELECT
//         COUNT(*) AS totalDevices,

//         COUNTIF(
//           DATE(JSON_VALUE(data, '$.warrantyEndDate')) > CURRENT_DATE()
//         ) AS underWarranty,

//         COUNTIF(
//           DATE(JSON_VALUE(data, '$.amcValidity')) > CURRENT_DATE()
//         ) AS underAmc

//       FROM ${DEVICES_TABLE}
//       WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//       AND JSON_VALUE(data, '$.isDeleted') = 'false'
//     ),

//     /* ================= ACTIVE DEVICES ================= */

//     activeDevices AS (
//       SELECT COUNT(*) AS activeDevices
//       FROM ${DEVICES_TABLE}
//       WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//       AND JSON_VALUE(data, '$.isDeleted') = 'false'
//       AND JSON_VALUE(data, '$.isValid') = 'true'
//     ),

//     /* ================= TOTAL TESTS ================= */

//     totalTests AS (
//       SELECT COUNT(*) AS totalTests
//       FROM ${TESTS_TABLE}
//       WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     ),

//     /* ================= LAST 30 DAYS TESTS ================= */

//     last30DaysTests AS (
//       SELECT COUNT(*) AS last30Tests
//       FROM ${TESTS_TABLE}
//       WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//       AND DATE(
//         TIMESTAMP_SECONDS(
//           SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
//         )
//       ) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
//     )

//     /* ================= FINAL SELECT ================= */

//     SELECT
//       o.*,

//       d.totalDevices,
//       a.activeDevices,
//       d.underWarranty,
//       d.underAmc,
//       t.totalTests,
//       l.last30Tests

//     FROM org o
//     CROSS JOIN deviceStats d
//     CROSS JOIN activeDevices a
//     CROSS JOIN totalTests t
//     CROSS JOIN last30DaysTests l
//     `;

//     const [rows] = await bigquery.query({
//       query: sql,
//       location: LOCATION,
//       params: { orgId }
//     });

//     if (!rows.length) return null;

//     const row = rows[0];

//     /* ================= UTILIZATION CALC ================= */

//     const activeDevices = Number(row.activeDevices || 0);
//     const last30Tests = Number(row.last30Tests || 0);

//     const maxCapacity = activeDevices * 8 * 30; // 8 tests/day/device
//     let utilization = 0;

//     if (maxCapacity > 0) {
//       utilization = Math.min(
//         Math.round((last30Tests / maxCapacity) * 100),
//         100
//       );
//     }

//     /* ================= AMC STATUS ================= */

//     const amcStatus =
//       Number(row.underAmc) > 0 ? "Active" : "Inactive";

//     const result = {
//       organizationId: row.organizationId,
//       name: row.name,
//       city: row.city,
//       state: row.state,
//       contactPerson: row.contactPerson,
//       mobile: row.mobile,
//       email: row.email,
//       saleRepresentative: row.saleRepresentative,
//       channelType: row.channelType,
//       registeredAt: row.registeredAt,

//       totalDevices: Number(row.totalDevices),
//       activeDevices: activeDevices,
//       underWarranty: Number(row.underWarranty),
//       underAmc: Number(row.underAmc),
//       amcStatus,

//       totalTests: Number(row.totalTests),

//       utilizationPercent: utilization
//     };

//     cache.set(cacheKey, result, 1800);
//     return result;
//   }

//   /* =====================================================
//      2️⃣ ANALYTICS TAB
//   ===================================================== */

//   static async getAnalytics(orgId: string) {

//   const sql = `
//   /* ================= BASE TESTS ================= */

//   WITH baseTests AS (
//     SELECT
//       JSON_VALUE(data, '$.deviceId') AS deviceId,
//       JSON_VALUE(data, '$.doctorId') AS doctorId,
//       JSON_VALUE(data, '$.doctorName') AS doctorName,

//       SAFE_CAST(JSON_VALUE(data, '$.lengthOfTest') AS INT64) AS lengthOfTest,

//       DATE(
//         TIMESTAMP_SECONDS(
//           SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
//         )
//       ) AS testDate

//     FROM ${TESTS_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//   ),

//   /* ================= MONTHLY TREND (LAST 6 MONTHS) ================= */

//   monthlyTrend AS (
//     SELECT
//       FORMAT_DATE('%b %Y', DATE_TRUNC(testDate, MONTH)) AS month,
//       COUNT(*) AS totalTests
//     FROM baseTests
//     WHERE testDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
//     GROUP BY month
//     ORDER BY MIN(testDate)
//   ),

//   /* ================= DEVICE UTILIZATION ================= */

//   deviceUtilization AS (
//     SELECT
//       deviceId,
//       COUNT(*) AS totalTests
//     FROM baseTests
//     GROUP BY deviceId
//   ),

//   /* ================= TEST DURATION DISTRIBUTION ================= */

//   durationDist AS (
//     SELECT
//       SUM(CASE WHEN lengthOfTest < 1200 THEN 1 ELSE 0 END) AS lessThan20,
//       SUM(CASE WHEN lengthOfTest BETWEEN 1200 AND 2400 THEN 1 ELSE 0 END) AS between20to40,
//       SUM(CASE WHEN lengthOfTest BETWEEN 2400 AND 3600 THEN 1 ELSE 0 END) AS between40to60,
//       SUM(CASE WHEN lengthOfTest > 3600 THEN 1 ELSE 0 END) AS above60
//     FROM baseTests
//   ),

//   /* ================= DOCTOR ACTIVITY ================= */

//   doctorActivity AS (
//     SELECT
//       doctorId,
//       doctorName,
//       COUNT(*) AS totalTests
//     FROM baseTests
//     GROUP BY doctorId, doctorName
//     ORDER BY totalTests DESC
//   )

//   /* ================= FINAL ================= */

//   SELECT
//     (SELECT ARRAY_AGG(STRUCT(month, totalTests)) FROM monthlyTrend) AS monthlyTrend,
//     (SELECT ARRAY_AGG(STRUCT(deviceId, totalTests)) FROM deviceUtilization) AS deviceUtilization,
//     (SELECT AS STRUCT * FROM durationDist) AS testDurationDistribution,
//     (SELECT ARRAY_AGG(STRUCT(doctorId, doctorName, totalTests)) FROM doctorActivity) AS doctorActivity
//   `;

//   const [rows] = await bigquery.query({
//     query: sql,
//     location: LOCATION,
//     params: { orgId }
//   });

//   const result = rows[0] || {};

//   return {
//     monthlyTrend: result.monthlyTrend || [],
//     deviceUtilization: result.deviceUtilization || [],
//     testDurationDistribution: result.testDurationDistribution || {
//       lessThan20: 0,
//       between20to40: 0,
//       between40to60: 0,
//       above60: 0
//     },
//     doctorActivity: result.doctorActivity || []
//   };
// }

//   /* =====================================================
//      3️⃣ DEVICES TAB
//   ===================================================== */

//   static async getDevices(orgId: string) {

//   const sql = `
//   /* ================= DEVICE BASE ================= */

//   WITH devices AS (
//     SELECT
//       JSON_VALUE(data, '$.documentId') AS deviceId,
//       JSON_VALUE(data, '$.deviceCode') AS deviceCode,
//       JSON_VALUE(data, '$.productType') AS productType,
//       JSON_VALUE(data, '$.isValid') AS isValid,
//       JSON_VALUE(data, '$.warrantyEndDate') AS warrantyEndDate,
//       JSON_VALUE(data, '$.amcValidity') AS amcValidity

//     FROM ${DEVICES_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     AND JSON_VALUE(data, '$.isDeleted') = 'false'
//   ),

//   /* ================= TEST COUNT PER DEVICE ================= */

//   testCounts AS (
//     SELECT
//       JSON_VALUE(data, '$.deviceId') AS deviceId,
//       COUNT(*) AS totalTests
//     FROM ${TESTS_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     GROUP BY deviceId
//   )

//   /* ================= FINAL ================= */

//   SELECT
//     d.deviceId,
//     d.deviceCode,
//     d.productType,
//     d.isValid,
//     d.warrantyEndDate,
//     d.amcValidity,
//     IFNULL(t.totalTests, 0) AS totalTests

//   FROM devices d
//   LEFT JOIN testCounts t
//   ON d.deviceId = t.deviceId
//   `;

//   const [rows] = await bigquery.query({
//     query: sql,
//     location: LOCATION,
//     params: { orgId }
//   });

//   /* ================= FORMAT RESPONSE ================= */

//   return rows.map((row: any) => {

//     const today = new Date();

//     const warrantyEnd = row.warrantyEndDate
//       ? new Date(row.warrantyEndDate)
//       : null;

//     const amcValidity = row.amcValidity
//       ? new Date(row.amcValidity)
//       : null;

//     const underWarranty =
//       warrantyEnd && warrantyEnd > today;

//     const amcStatus =
//       amcValidity && amcValidity > today
//         ? "Active"
//         : "None";

//     return {
//       deviceId: row.deviceId,
//       deviceCode: row.deviceCode,
//       productType: row.productType || "Basic",

//       status: row.isValid === "true" ? "Active" : "Inactive",

//       warrantyEnd: row.warrantyEndDate || null,

//       amcStatus,

//       totalTests: Number(row.totalTests)
//     };
//   });
// }

//   /* =====================================================
//      4️⃣ DOCTORS TAB
//   ===================================================== */

//   static async getDoctors(orgId: string) {

//   const sql = `
//   /* ================= DOCTOR BASE ================= */

//   WITH doctors AS (
//     SELECT
//       JSON_VALUE(data, '$.uid') AS doctorId,
//       JSON_VALUE(data, '$.name') AS name,
//       JSON_VALUE(data, '$.specialization') AS specialization,
//       JSON_VALUE(data, '$.delete') AS isDeleted
//     FROM ${USERS_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     AND JSON_VALUE(data, '$.type') = 'doctor'
//   ),

//   /* ================= TEST STATS ================= */

//   testStats AS (
//     SELECT
//       JSON_VALUE(data, '$.doctorId') AS doctorId,
//       COUNT(*) AS totalTests,
//       MAX(
//         TIMESTAMP_SECONDS(
//           SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
//         )
//       ) AS lastActive
//     FROM ${TESTS_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     GROUP BY doctorId
//   )

//   /* ================= FINAL ================= */

//   SELECT
//     d.doctorId,
//     d.name,
//     d.specialization,
//     IFNULL(t.totalTests, 0) AS totalTests,
//     t.lastActive,
//     d.isDeleted

//   FROM doctors d
//   LEFT JOIN testStats t
//   ON d.doctorId = t.doctorId

//   ORDER BY totalTests DESC
//   `;

//   const [rows] = await bigquery.query({
//     query: sql,
//     location: LOCATION,
//     params: { orgId }
//   });

//   return rows.map((row: any) => {

//     const lastActiveFormatted = row.lastActive
//       ? new Date(row.lastActive).toLocaleDateString("en-US", {
//           month: "short",
//           day: "2-digit",
//           year: "numeric"
//         })
//       : null;

//     return {
//       doctorId: row.doctorId,
//       name: row.name,
//       specialization: row.specialization || "General",

//       totalTests: Number(row.totalTests),

//       lastActive: lastActiveFormatted,

//       status: row.isDeleted === "true" ? "Inactive" : "Active"
//     };
//   });
// }

//   /* =====================================================
//      5️⃣ MOTHERS TAB
//   ===================================================== */

//   static async getMothers(orgId: string) {

//   const sql = `
//   /* ================= MOTHER BASE ================= */

//   WITH mothers AS (
//     SELECT
//       JSON_VALUE(data, '$.id') AS motherId,
//       JSON_VALUE(data, '$.name') AS name,
//       SAFE_CAST(JSON_VALUE(data, '$.age') AS INT64) AS age,

//       TIMESTAMP_SECONDS(
//         SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
//       ) AS registrationDate,

//       TIMESTAMP_SECONDS(
//         SAFE_CAST(JSON_VALUE(data, '$.edd._seconds') AS INT64)
//       ) AS edd

//     FROM ${MOTHERS_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//   ),

//   /* ================= TEST STATS ================= */

//   testStats AS (
//     SELECT
//       JSON_VALUE(data, '$.motherId') AS motherId,
//       COUNT(*) AS totalTests,
//       ANY_VALUE(JSON_VALUE(data, '$.doctorName')) AS doctorName
//     FROM ${TESTS_TABLE}
//     WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//     GROUP BY motherId
//   )

//   /* ================= FINAL ================= */

//   SELECT
//     m.motherId,
//     m.name,
//     m.age,
//     m.registrationDate,
//     m.edd,
//     IFNULL(t.totalTests, 0) AS totalTests,
//     t.doctorName

//   FROM mothers m
//   LEFT JOIN testStats t
//   ON m.motherId = t.motherId

//   ORDER BY registrationDate DESC
//   `;

//   const [rows] = await bigquery.query({
//     query: sql,
//     location: LOCATION,
//     params: { orgId }
//   });

//   return rows.map((row: any) => {

//     const formatDate = (date: any) =>
//       date
//         ? new Date(date).toLocaleDateString("en-US", {
//             month: "short",
//             day: "2-digit",
//             year: "numeric"
//           })
//         : null;

//     return {
//       motherId: row.motherId,
//       name: row.name,
//       age: row.age,
//       doctor: row.doctorName || null,
//       registrationDate: formatDate(row.registrationDate),
//       expectedDelivery: formatDate(row.edd),
//       totalTests: Number(row.totalTests)
//     };
//   });
// }

//   /* =====================================================
//      6️⃣ TESTS TAB
//   ===================================================== */

//   static async getTests(orgId: string) {

//   const sql = `
//   SELECT
//     JSON_VALUE(data, '$.id') AS testId,
//     JSON_VALUE(data, '$.deviceName') AS deviceName,
//     JSON_VALUE(data, '$.motherName') AS motherName,
//     JSON_VALUE(data, '$.interpretationType') AS testType,

//     SAFE_CAST(JSON_VALUE(data, '$.lengthOfTest') AS INT64) AS durationSeconds,

//     TIMESTAMP_SECONDS(
//       SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
//     ) AS createdOn

//   FROM ${TESTS_TABLE}
//   WHERE JSON_VALUE(data, '$.organizationId') = @orgId
//   ORDER BY createdOn DESC
//   LIMIT 100
//   `;

//   const [rows] = await bigquery.query({
//     query: sql,
//     location: LOCATION,
//     params: { orgId }
//   });

//   return rows.map((row: any) => {

//     const formattedDate = row.createdOn
//       ? new Date(row.createdOn).toLocaleDateString("en-US", {
//           month: "short",
//           day: "2-digit",
//           year: "numeric"
//         })
//       : null;

//     return {
//       testId: row.testId,
//       device: row.deviceName,
//       mother: row.motherName,
//       date: formattedDate,
//       duration: row.durationSeconds
//         ? Math.round(row.durationSeconds / 60)
//         : 0,
//       type: row.testType || "NST"
//     };
//   });
// }
// }
import { bigquery } from "../../../../config/bigQuery.js";
import { cache } from "../../../../config/cache.js";

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

/* ================= TABLES ================= */

const table = (name: string) =>
  `\`${PROJECT}.${DATASET}.${name}\``;

const ORG_TABLE = table("organizations_raw_latest");
const USERS_TABLE = table("users_raw_latest");
const TESTS_TABLE = table("tests_raw_latest");
const MOTHERS_TABLE = table("mothers_raw_latest");
const DEVICES_TABLE = table("devices_raw_latest");

/* =====================================================
   SERVICE
===================================================== */

export class OrganizationDetailsService {

  /* =====================================================
     🔐 ACCESS VALIDATION
  ===================================================== */

  private static validateAccess(orgId: string, user: any) {

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Admin → full access
    if (user.type === "admin") {
      return;
    }

    // groupUser → restricted access
    if (user.type === "groupUser") {

      const allowed = Array.isArray(user.allowedOrganizations)
        ? user.allowedOrganizations.map((id: string) => id.trim())
        : [];

      if (!allowed.includes(orgId)) {
        throw new Error("Forbidden");
      }

      return;
    }

    throw new Error("Forbidden");
  }

  /* =====================================================
     1️⃣ ORGANIZATION HEADER
  ===================================================== */

  static async getOrganizationDetails(orgId: string, user: any) {

    this.validateAccess(orgId, user);

    const cacheKey = `orgDetails:${user?.type}:${orgId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const sql = `
WITH org AS (
  SELECT
    JSON_VALUE(data, '$.documentId') AS organizationId,
    JSON_VALUE(data, '$.name') AS name,
    JSON_VALUE(data, '$.city') AS city,
    JSON_VALUE(data, '$.state') AS state,
    JSON_VALUE(data, '$.contactPerson') AS contactPerson,
    JSON_VALUE(data, '$.mobile') AS mobile,
    JSON_VALUE(data, '$.email') AS email,
    JSON_VALUE(data, '$.salesrepresentative') AS saleRepresentative,
    JSON_VALUE(data, '$.addressLine') AS addressLine,
    JSON_VALUE(data, '$.country') AS country,

    TIMESTAMP_SECONDS(
      SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
    ) AS registeredAt

  FROM ${ORG_TABLE}
  WHERE JSON_VALUE(data, '$.documentId') = @orgId
),

deviceStats AS (
  SELECT
    COUNT(*) AS totalDevices
  FROM ${DEVICES_TABLE}
  WHERE JSON_VALUE(data, '$.organizationId') = @orgId
  AND JSON_VALUE(data, '$.isDeleted') = 'false'
),

activeDevices AS (
  SELECT COUNT(*) AS activeDevices
  FROM ${DEVICES_TABLE}
  WHERE JSON_VALUE(data, '$.organizationId') = @orgId
  AND JSON_VALUE(data, '$.isDeleted') = 'false'
  AND JSON_VALUE(data, '$.isValid') = 'true'
),

totalTests AS (
  SELECT COUNT(*) AS totalTests
  FROM ${TESTS_TABLE}
  WHERE JSON_VALUE(data, '$.organizationId') = @orgId
)

SELECT
  o.*,
  d.totalDevices,
  a.activeDevices,
  t.totalTests

FROM org o
CROSS JOIN deviceStats d
CROSS JOIN activeDevices a
CROSS JOIN totalTests t
`;

    const [rows] = await bigquery.query({
      query: sql,
      location: LOCATION,
      params: { orgId }
    });

    if (!rows.length) return null;

    const row = rows[0];

    const activeDevices = Number(row.activeDevices || 0);
    const last30Tests = Number(row.last30Tests || 0);

    const maxCapacity = activeDevices * 8 * 30;
    const utilization =
      maxCapacity > 0
        ? Math.min(Math.round((last30Tests / maxCapacity) * 100), 100)
        : 0;

    const amcStatus =
      Number(row.underAmc) > 0 ? "Active" : "Inactive";

    const result = {
      organizationId: row.organizationId,
      name: row.name,
      city: row.city,
      state: row.state,
      contactPerson: row.contactPerson,
      mobile: row.mobile,
      email: row.email,
      saleRepresentative: row.saleRepresentative,
      channelType: row.channelType,
      registeredAt: row.registeredAt,
      totalDevices: Number(row.totalDevices),
      activeDevices,
      underWarranty: Number(row.underWarranty),
      underAmc: Number(row.underAmc),
      amcStatus,
      totalTests: Number(row.totalTests),
      utilizationPercent: utilization
    };

    cache.set(cacheKey, result, 1800);
    return result;
  }

  /* =====================================================
     REMAINING METHODS
     (Analytics, Devices, Doctors, Mothers, Tests)
     JUST ADD validateAccess() AT TOP
  ===================================================== */

  static async getAnalytics(orgId: string, user: any) {
    this.validateAccess(orgId, user);
     const sql = `
  /* ================= BASE TESTS ================= */

  WITH baseTests AS (
    SELECT
      JSON_VALUE(data, '$.deviceId') AS deviceId,
      JSON_VALUE(data, '$.doctorId') AS doctorId,
      JSON_VALUE(data, '$.doctorName') AS doctorName,

      SAFE_CAST(JSON_VALUE(data, '$.lengthOfTest') AS INT64) AS lengthOfTest,

      DATE(
        TIMESTAMP_SECONDS(
          SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
        )
      ) AS testDate

    FROM ${TESTS_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
  ),

  /* ================= MONTHLY TREND (LAST 6 MONTHS) ================= */

  monthlyTrend AS (
    SELECT
      FORMAT_DATE('%b %Y', DATE_TRUNC(testDate, MONTH)) AS month,
      COUNT(*) AS totalTests
    FROM baseTests
    WHERE testDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY MIN(testDate)
  ),

  /* ================= DEVICE UTILIZATION ================= */

  deviceUtilization AS (
    SELECT
      deviceId,
      COUNT(*) AS totalTests
    FROM baseTests
    GROUP BY deviceId
  ),

  /* ================= TEST DURATION DISTRIBUTION ================= */

  durationDist AS (
    SELECT
      SUM(CASE WHEN lengthOfTest < 1200 THEN 1 ELSE 0 END) AS lessThan20,
      SUM(CASE WHEN lengthOfTest BETWEEN 1200 AND 2400 THEN 1 ELSE 0 END) AS between20to40,
      SUM(CASE WHEN lengthOfTest BETWEEN 2400 AND 3600 THEN 1 ELSE 0 END) AS between40to60,
      SUM(CASE WHEN lengthOfTest > 3600 THEN 1 ELSE 0 END) AS above60
    FROM baseTests
  ),

  /* ================= DOCTOR ACTIVITY ================= */

  doctorActivity AS (
    SELECT
      doctorId,
      doctorName,
      COUNT(*) AS totalTests
    FROM baseTests
    GROUP BY doctorId, doctorName
    ORDER BY totalTests DESC
  )

  /* ================= FINAL ================= */

  SELECT
    (SELECT ARRAY_AGG(STRUCT(month, totalTests)) FROM monthlyTrend) AS monthlyTrend,
    (SELECT ARRAY_AGG(STRUCT(deviceId, totalTests)) FROM deviceUtilization) AS deviceUtilization,
    (SELECT AS STRUCT * FROM durationDist) AS testDurationDistribution,
    (SELECT ARRAY_AGG(STRUCT(doctorId, doctorName, totalTests)) FROM doctorActivity) AS doctorActivity
  `;

  const [rows] = await bigquery.query({
    query: sql,
    location: LOCATION,
    params: { orgId }
  });

  const result = rows[0] || {};

  return {
    monthlyTrend: result.monthlyTrend || [],
    deviceUtilization: result.deviceUtilization || [],
    testDurationDistribution: result.testDurationDistribution || {
      lessThan20: 0,
      between20to40: 0,
      between40to60: 0,
      above60: 0
    },
    doctorActivity: result.doctorActivity || []
  };
}

  static async getDevices(orgId: string, user: any) {
    this.validateAccess(orgId, user);
const sql = `
  /* ================= DEVICE BASE ================= */

  WITH devices AS (
    SELECT
      JSON_VALUE(data, '$.documentId') AS deviceId,
      JSON_VALUE(data, '$.deviceCode') AS deviceCode,
      JSON_VALUE(data, '$.productType') AS productType,
      JSON_VALUE(data, '$.isValid') AS isValid,
      JSON_VALUE(data, '$.warrantyEndDate') AS warrantyEndDate,
      JSON_VALUE(data, '$.amcValidity') AS amcValidity

    FROM ${DEVICES_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
    AND JSON_VALUE(data, '$.isDeleted') = 'false'
  ),

  /* ================= TEST COUNT PER DEVICE ================= */

  testCounts AS (
    SELECT
      JSON_VALUE(data, '$.deviceId') AS deviceId,
      COUNT(*) AS totalTests
    FROM ${TESTS_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
    GROUP BY deviceId
  )

  /* ================= FINAL ================= */

  SELECT
    d.deviceId,
    d.deviceCode,
    d.productType,
    d.isValid,
    d.warrantyEndDate,
    d.amcValidity,
    IFNULL(t.totalTests, 0) AS totalTests

  FROM devices d
  LEFT JOIN testCounts t
  ON d.deviceId = t.deviceId
  `;

  const [rows] = await bigquery.query({
    query: sql,
    location: LOCATION,
    params: { orgId }
  });

  /* ================= FORMAT RESPONSE ================= */

  return rows.map((row: any) => {

    const today = new Date();

    const warrantyEnd = row.warrantyEndDate
      ? new Date(row.warrantyEndDate)
      : null;

    const amcValidity = row.amcValidity
      ? new Date(row.amcValidity)
      : null;

    const underWarranty =
      warrantyEnd && warrantyEnd > today;

    const amcStatus =
      amcValidity && amcValidity > today
        ? "Active"
        : "None";

    return {
      deviceId: row.deviceId,
      deviceCode: row.deviceCode,
      productType: row.productType || "Basic",

      status: row.isValid === "true" ? "Active" : "Inactive",

      warrantyEnd: row.warrantyEndDate || null,

      amcStatus,

      totalTests: Number(row.totalTests)
    };
  });
}

  static async getDoctors(orgId: string, user: any) {
    this.validateAccess(orgId, user);
const sql = `
  /* ================= DOCTOR BASE ================= */

  WITH doctors AS (
    SELECT
      JSON_VALUE(data, '$.uid') AS doctorId,
      JSON_VALUE(data, '$.name') AS name,
      JSON_VALUE(data, '$.specialization') AS specialization,
      JSON_VALUE(data, '$.delete') AS isDeleted
    FROM ${USERS_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
    AND JSON_VALUE(data, '$.type') = 'doctor'
  ),

  /* ================= TEST STATS ================= */

  testStats AS (
    SELECT
      JSON_VALUE(data, '$.doctorId') AS doctorId,
      COUNT(*) AS totalTests,
      MAX(
        TIMESTAMP_SECONDS(
          SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
        )
      ) AS lastActive
    FROM ${TESTS_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
    GROUP BY doctorId
  )

  /* ================= FINAL ================= */

  SELECT
    d.doctorId,
    d.name,
    d.specialization,
    IFNULL(t.totalTests, 0) AS totalTests,
    t.lastActive,
    d.isDeleted

  FROM doctors d
  LEFT JOIN testStats t
  ON d.doctorId = t.doctorId

  ORDER BY totalTests DESC
  `;

  const [rows] = await bigquery.query({
    query: sql,
    location: LOCATION,
    params: { orgId }
  });

  return rows.map((row: any) => {

    const lastActiveFormatted = row.lastActive
      ? new Date(row.lastActive).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric"
        })
      : null;

    return {
      doctorId: row.doctorId,
      name: row.name,
      specialization: row.specialization || "General",

      totalTests: Number(row.totalTests),

      lastActive: lastActiveFormatted,

      status: row.isDeleted === "true" ? "Inactive" : "Active"
    };
  });
}

  static async getMothers(orgId: string, user: any) {
    this.validateAccess(orgId, user);
const sql = `
  /* ================= MOTHER BASE ================= */

  WITH mothers AS (
    SELECT
      JSON_VALUE(data, '$.id') AS motherId,
      JSON_VALUE(data, '$.name') AS name,
      SAFE_CAST(JSON_VALUE(data, '$.age') AS INT64) AS age,

      TIMESTAMP_SECONDS(
        SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
      ) AS registrationDate,

      TIMESTAMP_SECONDS(
        SAFE_CAST(JSON_VALUE(data, '$.edd._seconds') AS INT64)
      ) AS edd

    FROM ${MOTHERS_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
  ),

  /* ================= TEST STATS ================= */

  testStats AS (
    SELECT
      JSON_VALUE(data, '$.motherId') AS motherId,
      COUNT(*) AS totalTests,
      ANY_VALUE(JSON_VALUE(data, '$.doctorName')) AS doctorName
    FROM ${TESTS_TABLE}
    WHERE JSON_VALUE(data, '$.organizationId') = @orgId
    GROUP BY motherId
  )

  /* ================= FINAL ================= */

  SELECT
    m.motherId,
    m.name,
    m.age,
    m.registrationDate,
    m.edd,
    IFNULL(t.totalTests, 0) AS totalTests,
    t.doctorName

  FROM mothers m
  LEFT JOIN testStats t
  ON m.motherId = t.motherId

  ORDER BY registrationDate DESC
  `;

  const [rows] = await bigquery.query({
    query: sql,
    location: LOCATION,
    params: { orgId }
  });

  return rows.map((row: any) => {

    const formatDate = (date: any) =>
      date
        ? new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          })
        : null;

    return {
      motherId: row.motherId,
      name: row.name,
      age: row.age,
      doctor: row.doctorName || null,
      registrationDate: formatDate(row.registrationDate),
      expectedDelivery: formatDate(row.edd),
      totalTests: Number(row.totalTests)
    };
  });
}  

  static async getTests(orgId: string, user: any) {
    this.validateAccess(orgId, user);
const sql = `
  SELECT
    JSON_VALUE(data, '$.id') AS testId,
    JSON_VALUE(data, '$.deviceName') AS deviceName,
    JSON_VALUE(data, '$.motherName') AS motherName,
    JSON_VALUE(data, '$.interpretationType') AS testType,

    SAFE_CAST(JSON_VALUE(data, '$.lengthOfTest') AS INT64) AS durationSeconds,

    TIMESTAMP_SECONDS(
      SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
    ) AS createdOn

  FROM ${TESTS_TABLE}
  WHERE JSON_VALUE(data, '$.organizationId') = @orgId
  ORDER BY createdOn DESC
  LIMIT 100
  `;

  const [rows] = await bigquery.query({
    query: sql,
    location: LOCATION,
    params: { orgId }
  });

  return rows.map((row: any) => {

    const formattedDate = row.createdOn
      ? new Date(row.createdOn).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric"
        })
      : null;

    return {
      testId: row.testId,
      device: row.deviceName,
      mother: row.motherName,
      date: formattedDate,
      duration: row.durationSeconds
        ? Math.round(row.durationSeconds / 60)
        : 0,
      type: row.testType || "NST"
    };
  });
}
}