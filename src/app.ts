// import express from "express";
import cors from "cors";

// import organizationMisRoutes from "./modules/mis/organizations/organizations.routes.js";
// import deviceMisRoutes from "./modules/mis/devices/devices.routes.js";
// import organizationRegistrationRoutes from "./modules/registration/organizations/organizations.routes.js";
// import deviceRegistrationRoutes from "./modules/registration/devices/devices.routes.js";
// import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
// import newTicketRoutes from "./modules/serviceAndSupport/supportTicket/newTicket/newTicket.routes.js";
// import updateTicketRoutes from "./modules/serviceAndSupport/supportTicket/updateTicket/updateTicket.routes.js";
// import serviceRoutes from "./modules/serviceAndSupport/supportTicket/serviceDashboard/service.routes.js";
// import newFeedbackRoutes from "./modules/serviceAndSupport/customerFeedback/newFeedback/newFeedback.routes.js";

// const app = express();

// app.use(express.json());

// app.use("/api/mis/organizations", organizationMisRoutes);
// app.use("/api/mis/devices", deviceMisRoutes);
// app.use("/api/registration/organizations", organizationRegistrationRoutes);
// app.use("/api/registration/devices", deviceRegistrationRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/service", newTicketRoutes);
// app.use("/api/service", updateTicketRoutes);
// app.use("/api/service", serviceRoutes);
// app.use("/api/service", newFeedbackRoutes);


// export default app;

import express from "express";
import routes from "./routes.js";

const app = express();
app.use(cors()); 

app.use(express.json()); // also re-enable this

app.use("/api", routes);

export default app; 