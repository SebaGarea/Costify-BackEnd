import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UserDaoMongo } from "../dao/UserDAOMongo.js";
import { generaHash, validaHash } from "./config.js";
import dotenv from "dotenv";

dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

export const iniciarPassport = () => {
  passport.use(
    "registro",
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      async (req, username, password, done) => {
        try {
          let { first_name, last_name, role } = req.body;
          if (!first_name || !last_name || !role) {
            return done(null, false);
          }

          let existe = await UserDaoMongo.getBy({ email: username });
          if (existe) {
            console.error("El usuario ya existe");
            return done(null, false);
          }
          password = generaHash(password);
          let usuario = await UserDaoMongo.create({
            email: username,
            password,
            first_name,
            last_name,
            role: role || "user",
          });
          return done(null, usuario);
        } catch (error) {
          console.log("Error en la estrategia de registro:", error);
          return done(error);
        }
      }
    )
  );

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
          const email = profile.emails[0].value;
          if (!email) return done(new Error("No se pudo obtener el email del perfil de Google"));
          let usuario = await UserDaoMongo.getBy({ email });

          if (!usuario) {
            const [first_name, ...rest] = profile.displayName.split(" ");
            const last_name = rest.join(" ") || "GoogleUser";

            usuario = await UserDaoMongo.create({
              first_name,
              last_name,
              email,
              googleId: profile.id,
              password: "google-auth", 
              foto: profile.photos?.[0]?.value || "",
            });
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


