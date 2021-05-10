const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  console.log("Initialized");

  const authenticateUser = (email, haslo, done) => {
    // console.log(email, haslo);
    pool.query(
      `SELECT * FROM public."Uzytkownik" WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);
        
        if (results.rows.length > 0) {
          const uzytkownik = results.rows[0];

          bcrypt.compare(haslo, uzytkownik.haslo, (err, isMatch) => {
            if (err) {
              console.log(err);
            }
            if (isMatch) {
              return done(null, uzytkownik);
            } else {
              return done(null, false, { message: "Niepoprawne hasło" });
            }
          });
        } else {
          return done(null, false, {
            message: "Konto nie istnieje!"
          });
        }
      }
    );
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "haslo" },
      authenticateUser
    )
  );

  passport.serializeUser((uzytkownik, done) => done(null, uzytkownik.id));

  passport.deserializeUser((id, done) => {
    pool.query(`SELECT * FROM public."Uzytkownik" WHERE id = $1`, [id], (err, results) => {
      if (err) {
        return done(err);
      }
    //   console.log(`ID is ${results.rows[0].id}`);
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;