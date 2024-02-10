import { authJwt } from "../middleware/authjwt.js";
import {
  allAccess,
  userBoard,
  adminBoard,
  moderatorBoard,
} from "../controllers/user.controller.js";

export const userRoutes = (app) => {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", allAccess);

  app.get("/api/test/user", [authJwt.verifyToken], userBoard);

  app.get("/api/test/mod", [authJwt.verifyToken], moderatorBoard);

  app.get("/api/test/admin", [authJwt.verifyToken], adminBoard);
};
