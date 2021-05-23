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


app.get("/admin/uzytkownicy/postepa", checkNotAuthenticated, (req, res, next) => {

var idu=req.query.idu;
console.log(idu);

if(req.user.rola==0)
    {
        
        pool.query(`select test.nazwa as nazwaa,test.typ_testu as typa, wynik_testu.ilosc_pkt as wynika from public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu on test.id=wynik_testu.test_id WHERE test.jezyk_id=1 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/postepa.ejs",  { postepa:results.rows, user: req.user.imie });           
            }
            else
            {
                res.render("admin/brakpostepow.ejs",  { user: req.user.imie });      
            }

        });



    
    }
    if(req.user.rola==1)
    {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
    }

});


app.get("/admin/uzytkownicy/postepn", checkNotAuthenticated, (req, res, next) => {

    var idu=req.query.idu;
    console.log(idu);
    
    if(req.user.rola==0)
        {
            
            pool.query(`select test.nazwa as nazwan,test.typ_testu as typn, wynik_testu.ilosc_pkt as wynikn from public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu on test.id=wynik_testu.test_id WHERE test.jezyk_id=2 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("admin/postepn.ejs",  { postepn:results.rows, user: req.user.imie });           
                }
                else
                {
                    res.render("admin/brakpostepow.ejs",  { user: req.user.imie });      
                }
    
            });
    
    
    
        
        }
        if(req.user.rola==1)
        {
            res.render("stronaGlowna.ejs",  { user: req.user.imie });
        }
    
    });

    
app.get("/Uzytkownik/ustawienia/postepn", checkNotAuthenticated, (req, res, next) => {

    var idu=req.query.idu;
    console.log(idu);
    
    if(req.user.id==idu)
        {
            
            pool.query(`select test.nazwa as nazwan,test.typ_testu as typn, wynik_testu.ilosc_pkt as wynikn from public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu on test.id=wynik_testu.test_id WHERE test.jezyk_id=2 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("postepn.ejs",  { postepn:results.rows, user: req.user.imie });           
                }
                else
                {
                    res.render("brakpostepow.ejs",  { user: req.user.imie });      
                }
    
            });
    
    
    
        
        }
        else
        {
            res.render("stronaGlowna.ejs",  { user: req.user.imie });
        }
    
    });
    app.get("/Uzytkownik/ustawienia/postepa", checkNotAuthenticated, (req, res, next) => {

        var idu=req.query.idu;
        console.log(idu);
        
        if(req.user.id==idu)
            {
                
                pool.query(`select test.nazwa as nazwaa,test.typ_testu as typa, wynik_testu.ilosc_pkt as wynika from public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu on test.id=wynik_testu.test_id WHERE test.jezyk_id=1 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
                    if (err) {
                        throw err;
                    }
                    if(results.rows.length > 0) {
                        res.render("postepa.ejs",  { postepa:results.rows, user: req.user.imie });           
                    }
                    else
                    {
                        res.render("brakpostepow.ejs",  { user: req.user.imie });      
                    }
        
                });
        
        
        
            
            }
            else
            {
                res.render("stronaGlowna.ejs",  { user: req.user.imie });
            }
        
        });


app.get("/Uzytkownik/stronaGlowna", checkNotAuthenticated, (req, res, next) => {

    if(req.user.rola==1)
    {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
        console.log("to jest user");
    }
    if(req.user.rola==0)
    {
        res.render("admin/stronaGlownaAdmin.ejs",  { user: req.user.imie });
        console.log("to jest admin");
    }
});

/////panel administratora wyswietlenie uzytkownikow
app.get("/admin/uzytkownicy", checkNotAuthenticated, (req, res, next) => {

    var idu=req.query.idu;
    console.log(idu);
    
    if(req.user.rola==0)
    {
        if(idu>0)
        {
            pool.query( `DELETE FROM public."Uzytkownik"` + "WHERE id= '"+idu+"' " );
        }

        

        pool.query(`SELECT * FROM public."Uzytkownik" WHERE rola = 1 ORDER BY ID ASC`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/uzytkownicy.ejs",  { uzytkownik:results.rows, user: req.user.imie });           
            } 
        });
}
});

app.get("/koniec", checkNotAuthenticated, (req, res, next) => {

    var idu=req.query.idu;
    console.log(idu);
    console.log(req.user.id);

    if(idu==req.user.id)
    {
        

        pool.query( `DELETE FROM public."Uzytkownik"` + "WHERE id= '"+idu+"' " );
        req.logout();
        res.render("koniec.ejs");
        
    }

});


app.get("/Uzytkownik/ustawienia/zmianahasla", checkNotAuthenticated,  (req, res, next) => {
    res.render("zmianahasla.ejs", { user: req.user.imie});
});
app.get("/Uzytkownik/rejestracja", checkAuthenticated,  (req, res) => {
    res.render("rejestracja.ejs");
});

app.get("/Uzytkownik/login", checkAuthenticated, (req, res) => {
    // console.log(req.session.flash.error);
    res.render("login.ejs");
});


app.get("/Uzytkownik/ustawienia", checkNotAuthenticated, (req, res, next) => {
    res.render("ustawienia.ejs",  { id: req.user.id, user: req.user.imie, nazwisko: req.user.nazwisko, wiek: req.user.wiek, email: req.user.email});
});






app.get("/admin/ustawienia", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0)
    {
    res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie, nazwisko: req.user.nazwisko, wiek: req.user.wiek, email: req.user.email});
    }
    if(req.user.rola==1)
    {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
    }
    
});

app.get("/Uzytkownik/wyloguj", (req, res) => {
    req.logout();
    res.redirect("/");
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
                            req.flash("udane_zalogowanie", "Zostałeś zarejestrowany. Możesz się zalogować");
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
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//STRONA Z SLOWKAMI bez zalogowania jezyk angielski


///angielski i niemiecki
app.get("/angielski", (req, res)  => {
    res.render("gs/angielski/angielski.ejs");
});
app.get("/niemiecki", (req, res)  => {
    res.render("gs/niemiecki/niemiecki.ejs");
});

app.get("/angielski/slownictwo/slownictwoangielski", (req, res)  => {
    res.render("gs/angielski/slownictwo/slownictwoangielski.ejs");
});

app.get("/angielski/slownictwo/slownictwoangielski/zwierzeta", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/dom", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/praca", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/zdrowie", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/czlowiek", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/zwierzeta", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/jedzenieizywienie", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/podrozeiwakacje", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/czasownikifrazowe", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czasowniki frazowe' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/edukacjaiszkola", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});

app.get("/angielski/slownictwo/slownictwoangielski/rosliny", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/czasownikinieregularne", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czasowniki nieregularne' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/rodzina", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/angielski/slownictwo/slownictwoangielski/sport", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
////////////////////////////
////////////////////////////
////////////////////////////

app.get("/angielski/gramatyka/gramatykaangielski", (req, res)  => {
res.render("gs/angielski/gramatyka/gramatykaangielski.ejs");
});
                            
app.get("/angielski/gramatyka/gramatykaangielski/presentcontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/presentcontinuous.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/presentsimple", (req, res)  => {
    res.render("gs/angielski/gramatyka/presentsimple.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/presentperfect", (req, res)  => {
    res.render("gs/angielski/gramatyka/presentperfect.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/presentperfectcontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/presentperfectcontinuous.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/futuresimple", (req, res)  => {
    res.render("gs/angielski/gramatyka/futuresimple.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/futurecontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/futurecontinuous.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/futureperfect", (req, res)  => {
    res.render("gs/angielski/gramatyka/futureperfect.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/futureperfectcontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/futureperfectcontinuous.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/pastsimple", (req, res)  => {
    res.render("gs/angielski/gramatyka/pastsimple.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/pastcontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/pastcontinuous.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/pastperfect", (req, res)  => {
    res.render("gs/angielski/gramatyka/pastperfect.ejs");
});
app.get("/angielski/gramatyka/gramatykaangielski/pastperfectcontinuous", (req, res)  => {
    res.render("gs/angielski/gramatyka/pastperfectcontinuous.ejs");
});
////////////////////////////
////////////////////////////
////////////////////////////
//STRONA Z GRAMATYKA
                            //angielski
app.get("/angielski/gramatyka/gramatykaangielski", (req, res)  => {
    res.render("gs/angielski/gramatyka/gramatykaangielski.ejs");
});


app.get("/niemiecki/slownictwo/slownictwoniemiecki", (req, res)  => {
    res.render("gs/niemiecki/slownictwo/slownictwoniemiecki.ejs");
});
app.get("/niemiecki/gramatyka/gramatykaniemiecki", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/gramatykaniemiecki.ejs");
});

app.get("/niemiecki/slownictwo/slownictwoniemiecki/zwierzeta", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/dom", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/praca", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/zdrowie", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/czlowiek", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/jedzenieizywienie", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/podrozeiwakacje", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/edukacjaiszkola", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/rosliny", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/rodzina", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});
app.get("/niemiecki/slownictwo/slownictwoniemiecki/sport", (req, res)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows});     
                
        } 
    });
});

app.get("/niemiecki/gramatyka/gramatykaniemiecki/czasprzeszlyperfekt", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/czasprzeszlyperfekt.ejs");
});

app.get("/niemiecki/gramatyka/gramatykaniemiecki/czasprzeszlyprosty", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/czasprzeszlyprosty.ejs");
});

app.get("/niemiecki/gramatyka/gramatykaniemiecki/czasprzyszlyfuturi", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/czasprzyszlyfuturi.ejs");
});

app.get("/niemiecki/gramatyka/gramatykaniemiecki/czasprzyszlyfuturii", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/czasprzyszlyfuturii.ejs");
});

app.get("/niemiecki/gramatyka/gramatykaniemiecki/czaszaprzeszlyplusquamperfekt", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/czaszaprzeszlyplusquamperfekt.ejs");
});









///////////////////////////
/////////////////////////////////////////////////////////////
//////////////////////////////////
////////////////////////////////
////////////////////////////
//////////zalogowany//////////////
///////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
//////////////////////////////////
///////////////////////////////////////////////////////////////////////////

///angielski i niemiecki
app.get("/uzytkownik/angielski", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/angielski.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/niemiecki", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/niemiecki.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/slownictwo/slownictwoangielski.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/zwierzeta", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/dom", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/praca", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/zdrowie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/czlowiek", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/zwierzeta", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/jedzenieizywienie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/podrozeiwakacje", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/czasownikifrazowe", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czasowniki frazowe' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/edukacjaiszkola", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/rosliny", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/czasownikinieregularne", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czasowniki nieregularne' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/rodzina", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/slownictwo/slownictwoangielski/sport", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
////////////////////////////
////////////////////////////
////////////////////////////

app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski", checkNotAuthenticated, (req, res, next)  => {
res.render("ugs/angielski/gramatyka/gramatykaangielski.ejs",  { user: req.user.imie });
});
                            
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/presentcontinuous", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/presentcontinuous.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/presentsimple", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/presentsimple.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/presentperfect", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/presentperfect.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/presentperfectcontinuous", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/presentperfectcontinuous.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/futuresimple", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/futuresimple.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/futurecontinuous", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/futurecontinuous.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/futureperfect", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/futureperfect.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/futureperfectcontinuous", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/futureperfectcontinuous.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/pastsimple", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/pastsimple.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/pastcontinuous", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/pastcontinuous.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/pastperfect", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/pastperfect.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski/pastperfectcontinuous", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/pastperfectcontinuous.ejs",  { user: req.user.imie });
});
////////////////////////////
////////////////////////////
////////////////////////////
//STRONA Z GRAMATYKA
                            //angielski
app.get("/uzytkownik/angielski/gramatyka/gramatykaangielski", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/gramatyka/gramatykaangielski.ejs",  { user: req.user.imie });
});


app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/slownictwo/slownictwoniemiecki.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/niemiecki/gramatyka/gramatykaniemiecki", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/gramatyka/gramatykaniemiecki.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/zwierzeta", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/dom", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/praca", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/zdrowie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/czlowiek", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/jedzenieizywienie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/podrozeiwakacje", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/edukacjaiszkola", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/rosliny", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/rodzina", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/niemiecki/slownictwo/slownictwoniemiecki/sport", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM public."Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/slowka.ejs",  {slownictwo:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/gramatyka/gramatykaniemiecki/czasprzeszlyperfekt", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/gramatyka/czasprzeszlyperfekt.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/niemiecki/gramatyka/gramatykaniemiecki/czasprzeszlyprosty", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/gramatyka/czasprzeszlyprosty.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/niemiecki/gramatyka/gramatykaniemiecki/czasprzyszlyfuturi", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/gramatyka/czasprzyszlyfuturi.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/niemiecki/gramatyka/gramatykaniemiecki/czasprzyszlyfuturii", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/gramatyka/czasprzyszlyfuturii.ejs",  { user: req.user.imie });
});

app.get("/uzytkownik/niemiecki/gramatyka/gramatykaniemiecki/czaszaprzeszlyplusquamperfekt", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/gramatyka/czaszaprzeszlyplusquamperfekt.ejs",  { user: req.user.imie });
});


//////////////////////////////////
//////quizy///////////////////////
//////////////////////////////////

app.get("/uzytkownik/angielski/quizy/quizyangielski", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/quizy/quizyangielski.ejs",  { user: req.user.imie });
});
app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/quizy/quizyniemiecki.ejs",  { user: req.user.imie });
});



app.get("/uzytkownik/angielski/quizy/quizyangielski/wszystkie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/zwierzeta", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/dom", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/praca", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/quizy/quizyangielski/zdrowie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/czlowiek", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/jedzenieizywienie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/podrozeiwakacje", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/czasownikifrazowe", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'czasowniki frazowe' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/edukacjaiszkola", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/rosliny", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/czasownikinieregularne", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'czasowniki nieregularne' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/angielski/quizy/quizyangielski/rodzina", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});
app.get("/uzytkownik/angielski/quizy/quizyangielski/sport", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});
///////////////////////////////////////////////
/////////////////////niemiecki///////////////////
//////////////////////////////////////////
app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/wszystkie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/zwierzeta", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'zwierzeta' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/dom", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'dom' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/praca", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'praca' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/zdrowie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'zdrowie' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/czlowiek", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'czlowiek' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/jedzenieizywienie", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'jedzenie i zywienie' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/podrozeiwakacje", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'podroze i wakacje' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/edukacjaiszkola", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'edukacja i szkola' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/rosliny", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'rosliny' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/rodzina", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'rodzina' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki/sport", checkNotAuthenticated, (req, res, next)  => {

    pool.query(`SELECT * FROM "Slownictwo" WHERE kategoria = 'sport' AND jezyk_id=2 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/quizy/quizy.ejs",  {slowkaquiz:results.rows, user: req.user.imie });     
                
        } 
    });
});

