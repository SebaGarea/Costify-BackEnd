import sinon from "sinon";
import passport from "passport";

process.env.NODE_ENV = process.env.NODE_ENV || "test";

if (!passport.authenticate.restore) {
  sinon.stub(passport, "authenticate").callsFake(() => (req, res, next) => next());
}

after(() => {
  if (passport.authenticate.restore) {
    passport.authenticate.restore();
  }
});
