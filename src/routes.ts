import { postRoutes } from "@post/routes/post-routes";
import { authMiddleware } from "@global/helpers/auth-middleware";
import { serverAdapter } from "@service/queues/base-queue";
import { authRoutes } from "@auth/routes/auth-routes";
import { Application } from "express";
import { currentUserRoutes } from "@auth/routes/current-user";

const BASE_PATH = "/api/v1";

export default (app: Application) => {
  const routes = () => {
    app.use("/queues", serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.logoutRoute());

    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());

    app.use(BASE_PATH, postRoutes.routes);
  };

  routes();
};
