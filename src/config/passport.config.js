import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { usuariosModelo } from "../dao/models/UserSchema.js";
import bcrypt from "bcrypt";
import { UserDaoMongo } from "../dao/UserDAOMongo.js";
import { generaHash, validaHash } from "./config.js";

export const iniciarPassport = () => {
  passport.use("registro",
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

  passport.use("login",
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

  passport.use("google", new GoogleStrategy({
    clientID: "TU_CLIENT_ID", // Coloca tu clientID de Google
    clientSecret: "TU_CLIENT_SECRET",
    callbackURL: "/api/usuarios/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    let usuario = await UserDaoMongo.getBy({ email: profile.emails[0].value });
    if (!usuario) {
      usuario = await UserDaoMongo.create({
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        email: profile.emails[0].value,
        password: "google", // Valor por defecto
        role: "user"
      });
    }
    return done(null, usuario);
  }
));


};











