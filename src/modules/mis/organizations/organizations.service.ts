import { bigquery } from "../../../config/bigQuery.js";
import { cache } from "../../../config/cache.js";
import type { IOrganizationMis } from "./organizations.interface.js";

/* ================= ENV ================= */

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

/* ================= TABLE ================= */

const ORGANIZATIONS_TABLE = "organizations_raw_latest";

const organizationsTable = () =>
  `\`${PROJECT}.${DATASET}.${ORGANIZATIONS_TABLE}\``;

/* ================= SERVICE ================= */

export class OrganizationService {

  static async getAll(search?: string): Promise<IOrganizationMis[]> {

    const cacheKey = `mis:organizations:${search || "all"}`;
    const cached = cache.get<IOrganizationMis[]>(cacheKey);
    if (cached) return cached;

    /* ================= SEARCH FILTER ================= */

    const searchFilter = search
      ? `AND LOWER(JSON_VALUE(data, '$.name')) LIKE LOWER(@search)`
      : "";

    /* ================= SQL ================= */

    const sql = `

      SELECT
        JSON_VALUE(data, '$.organizationId') AS id,
        JSON_VALUE(data, '$.name') AS name,
        JSON_VALUE(data, '$.type') AS type,
        JSON_VALUE(data, '$.city') AS city,
        JSON_VALUE(data, '$.state') AS state,
        JSON_VALUE(data, '$.contactPerson') AS contactPerson,
        JSON_VALUE(data, '$.contactNumber') AS contactNumber,
        JSON_VALUE(data, '$.amcStatus') AS amcStatus,
        JSON_VALUE(data, '$.salesChannel') AS salesChannel,
        JSON_VALUE(data, '$.registeredAt') AS registeredAt,

        CAST(JSON_VALUE(data, '$.totalDevices') AS INT64) AS devices,
        CAST(JSON_VALUE(data, '$.totalTests') AS INT64) AS totalTests,
        CAST(JSON_VALUE(data, '$.utilization') AS FLOAT64) AS utilization,

        TIMESTAMP_SECONDS(
          SAFE_CAST(JSON_VALUE(data, '$.createdOn._seconds') AS INT64)
        ) AS createdOn

      FROM ${organizationsTable()}
      WHERE 1=1
      ${searchFilter}
      ORDER BY createdOn DESC

    `;

    const options: any = {
      query: sql,
      location: LOCATION,
    };

    if (search) {
      options.params = {
        search: `%${search}%`,
      };
    }

    const [rows] = await bigquery.query(options);

    const result: IOrganizationMis[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      city: row.city,
      state: row.state,
      contactPerson: row.contactPerson,
      contactNumber: row.contactNumber,
      amcStatus: row.amcStatus,
      salesChannel: row.salesChannel,
      registeredAt: row.registeredAt,
      devices: row.devices || 0,
      totalTests: row.totalTests || 0,
      utilization: row.utilization || 0,
    }));

    cache.set(cacheKey, result, 600); // cache 10 mins

    return result;
  }
}