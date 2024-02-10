import { verifySignUp } from "../middleware/verifySignUp.js";
import { signin, signup } from "../controllers/auth-controller.js";

export const authRoutes = (app) => {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/auth/signup", signup);

  app.post("/api/auth/signin", signin);
};
