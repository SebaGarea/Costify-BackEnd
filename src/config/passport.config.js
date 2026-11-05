import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UserDaoMongo } from "../dao/UserDAOMongo.js";
import crypto from "crypto";
import { generaHash, validaHash } from "./config.js";
import logger from "./logger.js";
import { JWT_ALGORITHM } from "../services/authTokens.service.js";
import dotenv from "dotenv";

dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: [JWT_ALGORITHM],
};

// Hash de relleno: si el email no existe se compara igual, así la respuesta
// tarda lo mismo y no revela qué emails están registrados.
const HASH_RELLENO = generaHash(crypto.randomBytes(16).toString("hex"));

export const iniciarPassport = () => {
  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (username, password, done) => {
        try {
          const email = String(username || "").trim().toLowerCase();
          const usuario = await UserDaoMongo.getBy({ email });
          const coincide = validaHash(String(password || ""), usuario?.password || HASH_RELLENO);
          if (!usuario || !coincide) {
            logger.warn("Login fallido", { motivo: usuario ? "contraseña" : "email no registrado" });
            return done(null, false);
          }
          return done(null, usuario);
        } catch (error) {
          logger.error("Error en la estrategia de login", { error: error.message });
          return done(error);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const datos = profile?._json || {};
            const email = String(datos.email || profile?.emails?.[0]?.value || "").toLowerCase();
            if (!email) return done(null, false, { motivo: "sin_email" });
            // Solo emails que Google confirmó que pertenecen a esa cuenta.
            if (datos.email_verified === false || datos.email_verified === "false") {
              return done(null, false, { motivo: "email_no_verificado" });
            }

            let usuario = await UserDaoMongo.getBy({ email });
            if (!usuario) {
              logger.warn("Login con Google sin usuario registrado");
              return done(null, false, { motivo: "sin_cuenta" });
            }
            // Si la cuenta ya está vinculada a otra cuenta de Google, no se acepta.
            if (usuario.googleId && usuario.googleId !== profile.id) {
              logger.warn("Login con Google desde una cuenta distinta a la vinculada", { id: usuario._id });
              return done(null, false, { motivo: "otra_cuenta" });
            }

            const update = {};
            if (!usuario.googleId) update.googleId = profile.id;
            if (!usuario.emailVerified) update.emailVerified = true;
            if (Object.keys(update).length) {
              usuario = await UserDaoMongo.update(usuario._id, update);
            }

            return done(null, usuario);
          } catch (err) {
            logger.error("Error en estrategia Google", { error: err.message });
            return done(err, false);
          }
        }
      )
    );
  } else {
    logger.warn("Login con Google desactivado: faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }

  passport.use(
    "jwt",
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const usuario = await UserDaoMongo.getById(payload.id);
        if (!usuario) return done(null, false);
        // Cambiar la contraseña cierra las sesiones abiertas antes de ese momento.
        if (usuario.passwordChangedAt && payload.iat * 1000 < new Date(usuario.passwordChangedAt).getTime() - 1000) {
          return done(null, false);
        }
        return done(null, usuario);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
