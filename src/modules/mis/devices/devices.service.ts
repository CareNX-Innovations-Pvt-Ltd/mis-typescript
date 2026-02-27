// import { db } from "../../../database/firestore.js";
// import type { IDeviceMis } from "./devices.interface.js";

// const COLLECTION = "devices";

// export class DeviceService {
//   // Get All (search is OPTIONAL now)
//   static async getAll(search?: string) {
//     const snapshot = await db
//       .collection(COLLECTION)
//       .orderBy("createdOn", "desc")
//       .get();
// // console.log("snapshot:", snapshot);

//     let data = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     // Filter only if search exists
//     if (search) {
//       data = data.filter((org: any) =>
//         org.name
//           ?.toLowerCase()
//           .includes(search.toLowerCase())
//       );
//     }

//     return data;
//   }

// }
import { bigquery } from "../../../config/bigQuery.js";
import { cache } from "../../../config/cache.js";
import type { IDeviceMis } from "./devices.interface.js";

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

/* ================= TABLE ================= */

const DEVICES_TABLE = "devices_raw_latest";

const devicesTable = () =>
  `\`${PROJECT}.${DATASET}.${DEVICES_TABLE}\``;

/* ================= SERVICE ================= */

export class DeviceService {

  /* ================= AUTH ================= */

  private static validateAccess(user: any) {
    if (!user) throw new Error("Unauthorized");

    if (user.type === "admin") return;

    if (user.type === "groupUser") return;

    throw new Error("Forbidden");
  }

  /* ================= GET ALL ================= */

  static async getAll(
    search: string | undefined,
    user: any
  ): Promise<IDeviceMis[]> {

    this.validateAccess(user);

    const isGroupUser = user?.type === "groupUser";

    const allowedOrgIds: string[] =
      isGroupUser && Array.isArray(user.allowedOrganizations)
        ? user.allowedOrganizations.map((id: string) => id.trim())
        : [];

    const cacheKey = `mis:devices:${user?.type}:${search || "all"}`;
    const cached = cache.get<IDeviceMis[]>(cacheKey);
    if (cached) return cached;

    /* ================= SEARCH FILTER ================= */

    const searchFilter = search
      ? `AND LOWER(JSON_VALUE(data, '$.deviceCode')) LIKE LOWER(@search)`
      : "";

    /* ================= ORG FILTER ================= */

    const orgFilter = isGroupUser
      ? `AND JSON_VALUE(data, '$.organizationId') IN UNNEST(@orgIds)`
      : "";

    /* ================= SQL ================= */

    const sql = `
      SELECT
        JSON_VALUE(data, '$.documentId') AS deviceId,
        JSON_VALUE(data, '$.deviceCode') AS deviceCode,
        JSON_VALUE(data, '$.deviceName') AS deviceName,
        JSON_VALUE(data, '$.productType') AS productType,
        JSON_VALUE(data, '$.organizationId') AS organizationId,
        JSON_VALUE(data, '$.isValid') AS isValid,
        JSON_VALUE(data, '$.warrantyEndDate') AS warrantyEndDate,
        JSON_VALUE(data, '$.amcValidity') AS amcValidity,

        TIMESTAMP_SECONDS(
          SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
        ) AS createdOn

      FROM ${devicesTable()}
      WHERE JSON_VALUE(data, '$.isDeleted') = 'false'
      ${searchFilter}
      ${orgFilter}
      ORDER BY createdOn DESC
    `;

    const options: any = {
      query: sql,
      location: LOCATION,
    };

    if (search || isGroupUser) {
      options.params = {
        ...(search && { search: `%${search}%` }),
        ...(isGroupUser && { orgIds: allowedOrgIds })
      };
    }

    const [rows] = await bigquery.query(options);

    /* ================= FORMAT RESPONSE ================= */

    const today = new Date();

    const result: IDeviceMis[] = rows.map((row: any) => {

      const warrantyEnd = row.warrantyEndDate
        ? new Date(row.warrantyEndDate)
        : null;

      const amcValidity = row.amcValidity
        ? new Date(row.amcValidity)
        : null;

      const amcStatus =
        amcValidity && amcValidity > today
          ? "Active"
          : "Inactive";

      return {
        deviceId: row.deviceId,
        deviceCode: row.deviceCode,
        deviceName: row.deviceName,
        productType: row.productType || "main",
        organizationId: row.organizationId,
        status: row.isValid === "true" ? "Active" : "Inactive",
        warrantyEnd,
        amcStatus,
        createdOn: row.createdOn || null
      };
    });

    cache.set(cacheKey, result, 600); // cache 10 mins

    return result;
  }
}