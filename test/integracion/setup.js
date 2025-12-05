import sinon from "sinon";
import passport from "passport";

process.env.NODE_ENV = process.env.NODE_ENV || "test";

const defaultAuthHandler = (req, _res, next) => {
  req.user = { rol: "admin" };
  next();
};

let currentAuthHandler = defaultAuthHandler;

globalThis.__setAuthHandler = (handler) => {
  currentAuthHandler = handler;
};

globalThis.__resetAuthHandler = () => {
  currentAuthHandler = defaultAuthHandler;
};

if (!passport.authenticate.restore) {
  sinon
    .stub(passport, "authenticate")
    .callsFake(() => (req, res, next) => currentAuthHandler(req, res, next));
}

after(() => {
  if (passport.authenticate.restore) {
    passport.authenticate.restore();
  }
});
