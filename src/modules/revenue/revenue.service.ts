import { bigquery } from "../../config/bigQuery.js";
import type { RevenueResponse } from "./revenue.interface.js";

const PROJECT = process.env.BQ_PROJECT_ID!;
const DATASET = process.env.BQ_DATASET!;
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

const table = (name: string) => `\`${PROJECT}.${DATASET}.${name}\``;

export const getRevenueService = async (): Promise<RevenueResponse> => {

  const query = `
WITH

device_sales AS (
  SELECT
    SUM(IFNULL(SAFE_CAST(invoiceValue AS FLOAT64),0)) AS deviceSales
  FROM ${table("devices_raw_latest")}
),

service_revenue AS (
  SELECT
    SUM(IFNULL(SAFE_CAST(invoiceAmount AS FLOAT64),0)) AS serviceRevenue
  FROM ${table("tickets_raw_latest")}
),

amc_revenue AS (
  SELECT
    SUM(IFNULL(SAFE_CAST(invoiceAmount AS FLOAT64),0)) AS amcRevenue
  FROM ${table("tickets_raw_latest")}
  WHERE underAmc = TRUE
)

SELECT
  deviceSales,
  serviceRevenue,
  amcRevenue,
  deviceSales + serviceRevenue + amcRevenue AS totalRevenue
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