import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UserDaoMongo } from "../dao/UserDAOMongo.js";
import { validaHash } from "./config.js";
import dotenv from "dotenv";

dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

export const iniciarPassport = () => {
  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (username, password, done) => {
        try {
          const usuario = await UserDaoMongo.getBy({ email: username });
          if (!usuario) {
            console.error("Usuario no encontrado");
            return done(null, false);
          }
          if (!validaHash(password, usuario.password)) {
            console.error("Contraseña incorrecta");
            return done(null, false);
          }
          return done(null, usuario);
        } catch (error) {
          console.log("Error en la estrategia de login:", error);
          return done(error);
        }
      }
    )
  );

  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value?.toLowerCase();
          if (!email) return done(new Error("No se pudo obtener el email del perfil de Google"));
          let usuario = await UserDaoMongo.getBy({ email });

          if (!usuario) {
            console.error("Intento de login con Google sin usuario existente", { email });
            return done(null, false);
          }

          const update = {};
          if (!usuario.googleId) update.googleId = profile.id;
          if (!usuario.emailVerified) update.emailVerified = true;
          if (Object.keys(update).length) {
            usuario = await UserDaoMongo.update(usuario._id, update);
          }

          return done(null, usuario);
        } catch (err) {
          console.error("Error en estrategia Google:", err);
          return done(err, false);
        }
      }
    )
  );
  
  passport.use(
    "jwt",
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const usuario = await UserDaoMongo.getById(payload.id);
        if (!usuario) return done(null, false);
        return done(null, usuario);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};


