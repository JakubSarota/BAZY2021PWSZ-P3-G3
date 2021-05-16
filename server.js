const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require("./passportConfig");
initializePassport(passport);

const PORT = process.env.PORT || 3000;

//arkusz stylów
app.use(express.static('public')); 
app.use("/css", express.static(__dirname + "/public/css")); //działa tylko na index.ejs
app.use("/img", express.static(__dirname + "/public/img"));
//ustaw widok
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false}));
app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: false

    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
//strony 
app.get('/', (req, res) => {
    res.render("index");        
});

app.get("/Uzytkownik/rejestracja", checkAuthenticated,  (req, res) => {
    res.render("rejestracja.ejs");
});

app.get("/Uzytkownik/login", checkAuthenticated, (req, res) => {
    // console.log(req.session.flash.error);
    res.render("login.ejs");
});

app.get("/Uzytkownik/stronaGlowna", checkNotAuthenticated, (req, res, next) => {
    res.render("stronaGlowna.ejs",  { user: req.user.imie });
});

app.get("/Uzytkownik/wyloguj", (req, res) => {
    req.logout();
    res.redirect("/Uzytkownik/login");
});




//STRONA Z GRAMATYKA
                            //angielski
app.get("/angielski/gramatyka/gramatykaangielski", (req, res)  => {
    res.render("gs/angielski/gramatyka/gramatykaangielski.ejs");
});


app.get("/Uzytkownik/gramatykaZal", checkNotAuthenticated, (req, res, next)  => {
    res.render("gramatykaZal.ejs", { user: req.user.imie });
});

                            //niemiecki









app.get("/Uzytkownik/slownictwoZal", checkNotAuthenticated, (req, res, next)  => {


     
    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'dom'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("slownictwoZal.ejs",  { user: req.user.imie, slownictwo:results.rows});     
                
        } 
    });


});


///angielski i niemiecki
app.get("/angielski", (req, res)  => {
    res.render("gs/angielski/angielski.ejs");
});
app.get("/niemiecki", (req, res)  => {
    res.render("gs/niemiecki/niemiecki.ejs");
});














//rejestracja
app.post("/Uzytkownik/rejestracja", async (req, res) => {
    let {imie, nazwisko, email, haslo, haslo2, wiek} = req.body;
    //zmienna wyświetlająca błedy
    let errors = [];
    
    console.log({
        imie,
        nazwisko,
        email,
        haslo,
        haslo2,
        wiek
    });
    //komunikaty o błedach
    if(!imie || !email || !haslo || !haslo2) {
        errors.push({message: "Wypełnij wszystkie pola!"});
    }

    if(haslo.length < 6) {
        errors.push({message: "Za krótkie hasło, musi być minimum 7 znaków!"});
    }

    if(haslo != haslo2) {
        errors.push({message: "hasła się nie zgadzają!"})
    }

    if(errors.length > 0) {
        res.render("rejestracja", { errors });
    } else {
        //szyfrowanie hasła
        let zaszyfrowaneHaslo = await bcrypt.hash(haslo, 10);
        console.log(zaszyfrowaneHaslo);
        //sprawdzanie czy email już istnieje
        pool.query(
            `SELECT * FROM public."Uzytkownik" WHERE email = $1`, 
            [email], (err, results) => {
                if (err) {
                    throw err;
                } 
                // console.log(results.rows);
                if(results.rows.length > 0) {
                    errors.push({message: "Email już istnieje"});
                    res.render("rejestracja", {errors});
                } else {
                    pool.query(
                        `INSERT INTO public."Uzytkownik" (imie, nazwisko, email, haslo, wiek) VALUES($1, $2, $3, $4, $5) RETURNING id, haslo`, 
                        [imie, nazwisko, email, zaszyfrowaneHaslo, wiek], 
                        (err, results) => {
                            if(err) {
                                throw err;
                            }
                            // console.log(results.rows);
                            req.flash("udane_zalogowanie", "Jestes zarejestrowany. Możesz się zalogować");
                            res.redirect('/Uzytkownik/login');
                        }
                    );
                }
            }
        );
    }
});

app.post(
    "/Uzytkownik/login",
    passport.authenticate("local", {
      successRedirect: "/Uzytkownik/stronaGlowna",
      failureRedirect: "/Uzytkownik/login",
      failureFlash: true
    })
);

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/Uzytkownik/stronaGlowna");
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/Uzytkownik/login");
}

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});










///////////////////////////////////////////////////////////////////////////
//STRONA Z SLOWKAMI bez zalogowania jezyk angielski
app.get("/angielski/slownictwo/slownictwoangielski", (req, res)  => {
    res.render("gs/angielski/slownictwo/slownictwoangielski.ejs");
});
app.get("/angielski/slownictwo/slownictwoangielski/zwierzeta", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/zwierzeta.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/dom", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/dom.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/praca", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/praca.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/zdrowie", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/zdrowie.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/czlowiek", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/czlowiek.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/zwierzeta", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/zwierzeta.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/jedzenieizywienie", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/jedzenieizywienie.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/podrozeiwakacje", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/podrozeiwakacje.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/czasownikifrazowe", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czasowniki frazowe' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/czasownikifrazowe.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/edukacjaiszkola", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/edukacjaiszkola.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/rosliny", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/rosliny.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/czasownikinieregularne", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czasowniki nieregularne' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/czasownikinieregularne.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/rodzina", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/rodzina.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/sport", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/sport.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
////////////////////////////
////////////////////////////
////////////////////////////
app.get("/angielski/gramatyka/gramatykaangielski/presentcontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/presentcontinuous.ejs");
});