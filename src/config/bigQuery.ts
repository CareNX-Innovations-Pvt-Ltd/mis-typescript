// import { BigQuery } from '@google-cloud/bigquery';

// export const bigquery = new BigQuery({
//   projectId: process.env.BQ_PROJECT_ID,
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
// });
import { BigQuery } from '@google-cloud/bigquery';

let bigquery: BigQuery;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

  serviceAccount.private_key =
    serviceAccount.private_key.replace(/\\n/g, "\n");

  bigquery = new BigQuery({
    projectId: serviceAccount.project_id,
    credentials: serviceAccount,
  });

  console.log("Using ENV BigQuery config");
} else {
  bigquery = new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,
    keyFilename: "./serviceAccountKey.json",
  });

  console.log("Using local BigQuery config");
}

export { bigquery };