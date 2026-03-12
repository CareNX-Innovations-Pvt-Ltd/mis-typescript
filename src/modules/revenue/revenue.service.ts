import { bigquery } from "../../config/bigQuery.js";
import type { RevenueResponse } from "./revenue.interface.js";

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

const table = (name: string) => `\`${PROJECT}.${DATASET}.${name}\``;

export const getRevenueService = async (): Promise<RevenueResponse> => {

  const query = `
  WITH

  /* ---------------- DEVICE SALES ---------------- */

  device_sales AS (
    SELECT
      SUM(invoiceValue) AS deviceSales
    FROM ${table("devices_raw_latest")}
    WHERE invoiceValue IS NOT NULL
  ),

  /* ---------------- SERVICE REVENUE ---------------- */

  service_revenue AS (
    SELECT
      SUM(invoiceAmount) AS serviceRevenue
    FROM ${table("tickets_raw_latest")}
    WHERE invoiceAmount IS NOT NULL
  ),

  /* ---------------- AMC REVENUE ---------------- */

  amc_revenue AS (
    SELECT
      SUM(invoiceAmount) AS amcRevenue
    FROM ${table("tickets_raw_latest")}
    WHERE underAmc = TRUE
      AND invoiceAmount IS NOT NULL
  ),

  /* ---------------- SALES CHANNEL ---------------- */

  sales_channel AS (
    SELECT
      CASE
        WHEN LOWER(organizationName) LIKE '%government%' THEN 'Government'
        WHEN LOWER(organizationName) LIKE '%distributor%' THEN 'Distributor'
        ELSE 'Direct'
      END AS channel,
      SUM(invoiceValue) AS amount
    FROM ${table("devices_raw_latest")}
    GROUP BY channel
  )

  SELECT
    deviceSales,
    serviceRevenue,
    amcRevenue,
    deviceSales + serviceRevenue + amcRevenue AS totalRevenue,
    (
      SELECT ARRAY_AGG(STRUCT(channel AS name, amount))
      FROM sales_channel
    ) AS byChannel

  FROM device_sales, service_revenue, amc_revenue
  `;

  const [rows] = await bigquery.query({
    query,
    location: LOCATION
  });

  const row = rows[0];

  const breakdown = [
    { name: "Services", amount: row.serviceRevenue || 0 },
    { name: "AMC", amount: row.amcRevenue || 0 },
    { name: "Sales", amount: row.deviceSales || 0 }
  ];

  return {
    summary: {
      totalRevenue: row.totalRevenue || 0,
      deviceSales: row.deviceSales || 0,
      amcRevenue: row.amcRevenue || 0,
      serviceRevenue: row.serviceRevenue || 0
    },
    breakdown,
    byChannel: row.byChannel || []
  };
};