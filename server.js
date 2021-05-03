const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');

const PORT = process.env.PORT || 3000;

//arkusz stylów
app.use(express.static(__dirname + 'public')); 
app.use('/css', express.static(__dirname + '/public/css')); //działa tylko na index.ejs
app.use('/img', express.static(__dirname + '/public/img'));
//ustaw widok
app.set('views', './views');
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false}));
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false

    })
);

app.use(flash());
//strony 
app.get('/', (req, res) => {
    res.render("index");        //na ta strone działa css
});

//wszystko poniżej nie działa
app.get("/Uzytkownik/rejestracja", (req, res) => {
    res.render("rejestracja");
});

app.get("/Uzytkownik/login", (req, res) => {
    res.render("login");
});

app.get("/Uzytkownik/stronaGlowna", (req, res) => {
    res.render("stronaGlowna", {Uzytkownik: "Jakub"});
});
//rejestracja
app.post("/Uzytkownik/rejestracja", async (req, res) => {
    let {imie, nazwisko, email, haslo, haslo2} = req.body;
    //zmienna wyświetlająca błedy
    let errors = [];
    
    console.log({
        imie,
        nazwisko,
        email,
        haslo,
        haslo2
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
                console.log(results.rows);
                if(results.rows.length > 0) {
                    errors.push({message: "Email już istnieje"});
                    res.render("rejestracja", {errors});
                } else {
                    pool.query(
                        `INSERT INTO public."Uzytkownik" (imie, nazwisko, email, haslo) VALUES($1, $2, $3, $4) RETURNING id, haslo`, 
                        [imie, nazwisko, email, zaszyfrowaneHaslo], 
                        (err, results) => {
                            if(err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash("udane_zalogowanie", "Jestes zarejestrowany. Możesz się zalogować");
                            res.redirect('/Uzytkownik/login');
                        }
                    )
                }
            }
        );
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});