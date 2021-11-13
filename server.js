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
app.use("/css", express.static(__dirname + "/public/css")); 
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

app.listen(PORT, () => {
    console.log(`Serwer wystartował na porcie ${PORT}`);
});

//strony 
app.get('/', (req, res) => {
    res.render("index");        
});

app.get("/Uzytkownik/ustawienia/zmianahasla", checkNotAuthenticated,  (req, res, next) => {
    res.render("zmianahasla.ejs", { user: req.user.imie});
});

app.get("/admin/zmianahaslaadmin", checkNotAuthenticated,  (req, res, next) => {
    if(req.user.rola==0) {
        res.render("admin/zmianahasla.ejs", { user: req.user.imie});
    }
    if(req.user.rola==1) {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
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

/////////////////////////////////////////////////////////////////////////////////////////////////REJESTRACJA, LOGOWANIE, WYLOGOWANIE

app.get("/Uzytkownik/rejestracja", checkAuthenticated,  (req, res) => {
    res.render("rejestracja.ejs");
});

/////////////////////////////////////////////////////////////////////////////////////////////////LOGOWANIE

app.get("/Uzytkownik/login", checkAuthenticated, (req, res) => {
    // console.log(req.session.flash.error);
    res.render("login.ejs");
});

/////////////////////////////////////////////////////////////////////////////////////////////////REJESTRACJA

app.post("/Uzytkownik/rejestracja", async (req, res) => {
    let {imie, nazwisko, email, haslo, haslo2} = req.body;
    //zmienna wyświetlająca błedy
    let errors = [];
    
    console.log({
        imie,
        nazwisko,
        email
    });
    //komunikaty o błedach
    if(!imie || !email || !haslo || !haslo2) {
        errors.push({message: "Wypełnij wszystkie pola!"});
    }

    if(haslo.length < 6) {
        errors.push({message: "Za krótkie hasło, musi być minimum 6 znaków!"});
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
                        `INSERT INTO public."Uzytkownik" (imie, nazwisko, email, haslo) VALUES($1, $2, $3, $4) RETURNING id, haslo`, 
                        [imie, nazwisko, email, zaszyfrowaneHaslo], 
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

app.get("/Uzytkownik/wyloguj", (req, res) => {
    req.logout();
    res.redirect("/");
});

//////////////////////////////////////////////////////////////////////////////////////////////////PODSTRONY BEZ ZALOGOWANIA SIĘ

app.get("/angielski", (req, res)  => {
    res.render("gs/angielski/angielski.ejs");
});

app.get("/niemiecki", (req, res)  => {
    res.render("gs/niemiecki/niemiecki.ejs");
});

//////////////////////////////////////////////////////////////////////////////////////////////////MATERIAŁY DO SŁÓWEK ANGIELSKI

app.get("/angielski/slownictwo/materialAngielski", (req, res)  => {
    pool.query(`SELECT * FROM public."Material" WHERE typ_materialu = 1 AND id_jezyk=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/materialAngielski.ejs",  {material: results.rows});          
        } else {
            res.redirect("/") 
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////MATERIAŁY DO SŁÓWEK NIEMIECKI


app.get("/niemiecki/slownictwo/materialNiemiecki", (req, res)  => {
    pool.query(`SELECT * FROM public."Material" WHERE typ_materialu = 1 AND id_jezyk=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/materialNiemiecki.ejs",  {material: results.rows});          
        } else {
            res.redirect("/") 
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////SŁÓWKA ANGIELSKI

app.get("/angielski/slownictwo/materialAngielski/slowkaAngielski", (req, res) => {
    var id=req.query.id;
    pool.query(`SELECT * FROM public."Slownictwo" WHERE`+" id_material ='"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        else if(results.rows.length > 0) {
            res.render("gs/angielski/slownictwo/slowkaAngielski.ejs",  { slownictwo: results.rows});   
        } 
        else if(results.rows.length == 0) {
            res.redirect("/")
        } 
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////SŁÓWKA NIEMIECKI

app.get("/niemiecki/slownictwo/materialNiemiecki/slowkaNiemiecki", (req, res) => {
    var id=req.query.id;
    pool.query(`SELECT * FROM public."Slownictwo" WHERE`+" id_material ='"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        else if(results.rows.length > 0) {
            res.render("gs/niemiecki/slownictwo/slowkaNiemiecki.ejs",  { slownictwo: results.rows});   
        } 
        else if(results.rows.length == 0) {
            res.redirect("/")
        } 
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////GRAMATYKA ANGIELSKI

app.get("/angielski/gramatyka/gramatykaAngielski", (req, res)  => {
    pool.query(`SELECT * FROM public."Material" WHERE typ_materialu = 2 AND id_jezyk=1`, (err, results) => {
        if (err) {
            throw err;
        }
        else if(results.rows.length > 0) {
            res.render("gs/angielski/gramatyka/gramatykaAngielski.ejs",  {material: results.rows});          
        } 
        else if(results.rows.length == 0) {
            res.redirect("/")
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////GRAMATYKA TEMATY ANGIELSKI

app.get("/angielski/gramatyka/tematAngielski", (req, res)  => {
    var id = req.query.id
    pool.query(`SELECT * FROM public."Gramatyka" WHERE`+" id_material ='"+id+"' ;", (err, results) => {
        if (err) {
            throw err;
        }
        else if(results.rows.length > 0) {
            res.render("gs/angielski/gramatyka/tematAngielski.ejs",  {gramatyka: results.rows});    
        } 
        else if(results.rows.length == 0) {
            res.redirect("/")
        }
    });
    
});

//////////////////////////////////////////////////////////////////////////////////////////////////GRAMATYKA NIEMIECKI

app.get("/niemiecki/gramatyka/gramatykaniemiecki", (req, res)  => {
    res.render("gs/niemiecki/gramatyka/gramatykaniemiecki.ejs");
});

//////////////////////////////////////////////////////////////////////////////////////////////////PODSTRONY ZALOGOWANY

//////////////////////////////////////////////////////////////////////////////////////////////////GŁÓWNA STRONA
app.get("/Uzytkownik/stronaGlowna", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==1) {
        var d = (Date().toString()).slice(4, 21);
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
        var ide = req.user.id;
        
        pool.query(`UPDATE public."Uzytkownik"` + "SET data_ostatniego_logowania = '" + d + "' WHERE id = '" + ide + "' ; " ), (err, results) => {
            if(err) {
                throw err;
            }         
        }
        // console.log(d);
        //console.log("id uzytkownika = " + ide);
        console.log("Użytkownik");
    }

    if(req.user.rola==0) {
        res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie });
        console.log("Admin");
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////USTAWIENIA

app.get("/Uzytkownik/ustawienia", checkNotAuthenticated, (req, res, next) => {
    res.render("ustawienia.ejs",  { id: req.user.id, user: req.user.imie, nazwisko: req.user.nazwisko, email: req.user.email});
});

/////////////////////////////////////////////////////////////////////////////////////////////////ZMIANA HASŁA

app.post("/Uzytkownik/ustawienia/zmianahasla",checkNotAuthenticated, async (req, res,next) => {
    let { obecne, haslo, haslo2} = req.body;
    let errors = [];
    console.log({
        obecne,
        haslo,
        haslo2,
    });

    if(!obecne ||!haslo || !haslo2) {
        errors.push({message: "Wypełnij wszystkie pola!"});
    }

    if(haslo.length < 6 || haslo2.length < 6 || obecne.length < 6){
        errors.push({message: "Za krótkie hasło, musi być minimum 6 znaków!"});
        console.log("krotkie");
        
    }

    if(haslo != haslo2) {
        errors.push({message: "hasła się nie zgadzają!"})
    }

    if(errors.length > 0) {
        res.render("zmianahasla.ejs", { user: req.user.imie, errors });
    } else {
        pool.query(
            `SELECT * FROM public."Uzytkownik" WHERE id =`+"'"+req.user.id+"'",
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              
              if (results.rows.length > 0) {
                const uzytkownik = results.rows[0];
                    console.log(results.rows[0]);
                    bcrypt.compare(obecne, uzytkownik.haslo, (err, isMatch) => {
                        if (err) {
                          console.log(err);
                        }
                        if (isMatch) {
                            let nowehaslo =  bcrypt.hashSync(haslo, 10);
                            console.log(nowehaslo);
                            pool.query(`UPDATE public."Uzytkownik"`+"SET haslo='"+nowehaslo+"' WHERE id='"+req.user.id+"'");
                            errors.push({message: "Twoje haslo zostalo zmienione"})
                            res.render("zmianahasla.ejs", { user: req.user.imie, errors });
                            
                        } else {
                            console.log("zle haselko");
                            errors.push({message: "Obecne haslo jest niepoprawne"})
                            res.render("zmianahasla.ejs", { user: req.user.imie, errors });
                        }
                    });
                } 
            }
        );
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////WYŚWIETLANIE POSTĘPÓW

app.get("/Uzytkownik/ustawienia/postepn", checkNotAuthenticated, (req, res, next) => {
    var idu=req.query.idu;
    console.log(idu);
    
    if(req.user.id==idu) { 
            pool.query(`SELECT test.nazwa AS nazwan, test.typ_testu AS typn, wynik_testu.ilosc_pkt AS wynikn FROM public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu ON test.id=wynik_testu.test_id WHERE test.jezyk_id=2 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("postepn.ejs",  { postepn:results.rows, user: req.user.imie });           
                } else {
                    res.render("brakpostepow.ejs",  { user: req.user.imie });      
                }
            }); 
        } else {
            res.render("stronaGlowna.ejs",  { user: req.user.imie });
        }
    
});

app.get("/Uzytkownik/ustawienia/postepa", checkNotAuthenticated, (req, res, next) => {

    var idu=req.query.idu;
    console.log(idu);
        
    if(req.user.id==idu) {
            pool.query(`select test.nazwa as nazwaa,test.typ_testu as typa, wynik_testu.ilosc_pkt as wynika from public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu on test.id=wynik_testu.test_id WHERE test.jezyk_id=1 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("postepa.ejs",  { postepa:results.rows, user: req.user.imie });           
                } else {
                    res.render("brakpostepow.ejs",  { user: req.user.imie });      
                }
            });     
        } else {
            res.render("stronaGlowna.ejs",  { user: req.user.imie });
        }
});

/////////////////////////////////////////////////////////////////////////////////////////////////MATERIAŁY ANGIELSKI

app.get("/Uzytkownik/angielski", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/angielski/angielski.ejs",  { user: req.user.imie });    
});

//////////////////////////////////////////////////////////////////////////////////////////////////MATERIAŁY DO SŁÓWEK ANGIELSKI

app.get("/Uzytkownik/angielski/slownictwo/materialAngielskiU", checkNotAuthenticated, (req, res, next)  => {
    pool.query(`SELECT * FROM public."Material" WHERE typ_materialu = 1 AND id_jezyk=1`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/materialAngielskiU.ejs",  {material: results.rows, user: req.user.imie});          
        } else {
            res.redirect("/") 
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////SŁÓWKA ANGIELSKI

app.get("/Uzytkownik/angielski/slownictwo/materialAngielskiU/slowkaAngielskiU", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;
    pool.query(`SELECT * FROM public."Slownictwo" WHERE`+" id_material ='"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        else if(results.rows.length > 0) {
            res.render("ugs/angielski/slownictwo/slowkaAngielskiU.ejs",  { slownictwo: results.rows, user: req.user.imie});   
        } 
        else if(results.rows.length == 0) {
            res.redirect("/")
        } 
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////MATERIAŁY NIEMIECKI

app.get("/Uzytkownik/Niemiecki", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/niemiecki.ejs",  { user: req.user.imie });    
});

//////////////////////////////////////////////////////////////////////////////////////////////////MATERIAŁY DO SŁÓWEK NIEMIECKI


app.get("/Uzytkownik/niemiecki/slownictwo/materialNiemiecki", checkNotAuthenticated, (req, res, next)  => {
    pool.query(`SELECT * FROM public."Material" WHERE typ_materialu = 1 AND id_jezyk=2`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/slownictwo/materialNiemiecki.ejs",  {material: results.rows, user: req.user.imie});          
        } else {
            res.redirect("/");    
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////QUIZY ANGIELSKI

app.get("/Uzytkownik/angielski/quizyAngielski", checkNotAuthenticated, (req, res, next)  => {
    pool.query(`SELECT public."Material".id_jezyk AS id_jezyk, public."Slownictwo".tlumaczenie AS tlumaczenie, public."Slownictwo".polski AS polski FROM public."Material" INNER JOIN public."Slownictwo" ON public."Material".id=public."Slownictwo".id_material WHERE id_jezyk=1 AND typ_materialu=1 ORDER BY random();`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 4) {
            res.render("ugs/angielski/quizy/quizyAngielski.ejs",  {slowkaquiz: results.rows, user: req.user.imie });     
        } else {
            res.render("ugs/angielski/angielski.ejs",  { user: req.user.imie }); 
        }
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////PODSTRONY ADMINISTRATOR

/////////////////////////////////////////////////////////////////////////////////////////////////WYŚWIETLANIE UŻYTKOWNIKÓW

app.get("/admin/ustawienia", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
    res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie, nazwisko: req.user.nazwisko, email: req.user.email});
    }
    if(req.user.rola==1) {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
    } 
});

/////////////////////////////////////////////////////////////////////////////////////////////////ZMIANA HASŁA NA ADMINISTRATORZE

app.post("/admin/zmianahaslaadmin",checkNotAuthenticated, async (req, res,next) => {  
    if(req.user.rola==0) {
        let { obecne, haslo, haslo2} = req.body;
        let errors = [];
        console.log({
            obecne,
            haslo,
            haslo2,
    });

    if(!obecne ||!haslo || !haslo2) {
        errors.push({message: "Wypełnij wszystkie pola!"});
    }

    if(haslo.length < 6 || haslo2.length < 6 || obecne.length < 6){
        errors.push({message: "Za krótkie hasło, musi być minimum 6 znaków!"});
        console.log("krotkie");
        
    }

    if(haslo != haslo2) {
        errors.push({message: "hasła się nie zgadzają!"})
    }

    if(errors.length > 0) {
        res.render("admin/zmianahasla.ejs", { user: req.user.imie, errors });
    } else {
        pool.query(
            `SELECT * FROM public."Uzytkownik" WHERE id =`+"'"+req.user.id+"'",
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              
              if (results.rows.length > 0) {
                const uzytkownik = results.rows[0];
                    console.log(results.rows[0]);
                    bcrypt.compare(obecne, uzytkownik.haslo, (err, isMatch) => {
                        if (err) {
                          console.log(err);
                        }
                        if (isMatch) {
                            let nowehaslo =  bcrypt.hashSync(haslo, 10);
                            console.log(nowehaslo);
                            pool.query(`UPDATE public."Uzytkownik"`+"SET haslo='"+nowehaslo+"' WHERE id='"+req.user.id+"'");
                            errors.push({message: "Twoje haslo zostalo zmienione"})
                            res.render("admin/zmianahasla.ejs", { user: req.user.imie, errors });
                            
                        } else {
                            console.log("zle haselko");
                            errors.push({message: "Obecne haslo jest niepoprawne"})
                            res.render("admin/zmianahasla.ejs", { user: req.user.imie, errors });
                        }
                    });
                } 
            }
        );
    }
    }

    if(req.user.rola==1) {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
    }
})

/////////////////////////////////////////////////////////////////////////////////////////////////PANEL ADMINISTRATORA WYŚWIETLANIE UŻYTKOWNIKÓW

app.get("/admin/uzytkownicy", checkNotAuthenticated, (req, res, next) => {

    var idu=req.query.idu;
    // console.log(idu);
    
    if(req.user.rola==0) {
        if(idu>0) {
            pool.query( `DELETE FROM public."Uzytkownik"` + "WHERE id= '"+idu+"' " );
        }

        pool.query(`SELECT * FROM public."Uzytkownik" WHERE rola = 1 ORDER BY ID ASC`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/uzytkownicy.ejs",  { uzytkownik:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/uzytkownicy.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////PANEL ADMINISTRATORA WYŚWIETLANIE POSTĘPÓW 

app.get("/admin/uzytkownicy/postepa", checkNotAuthenticated, (req, res, next) => {
    var idu=req.query.idu;
    console.log(idu);
    
    if(req.user.rola==0) {   
        pool.query(`SELECT test.nazwa AS nazwaa,test.typ_testu AS typa, wynik_testu.ilosc_pkt AS wynika FROM public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu on test.id=wynik_testu.test_id WHERE test.jezyk_id=1 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/postepa.ejs",  { postepa:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/brakpostepow.ejs",  { user: req.user.imie });      
            }
        });
    }
    if(req.user.rola==1) {
        res.render("stronaGlowna.ejs",  { user: req.user.imie });
    }
});

app.get("/admin/uzytkownicy/postepn", checkNotAuthenticated, (req, res, next) => {
    var idu=req.query.idu;
    console.log(idu);
    if(req.user.rola==0) {
            pool.query(`SELECT test.nazwa AS nazwan,test.typ_testu AS typn, wynik_testu.ilosc_pkt AS wynikn FROM public."Test" AS test LEFT JOIN public."Wynik_testu" AS wynik_testu ON test.id=wynik_testu.test_id WHERE test.jezyk_id=2 AND`+" wynik_testu.uzytkownik_id='"+idu+"'", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("admin/postepn.ejs",  { postepn:results.rows, user: req.user.imie });           
                } else {
                    res.render("admin/brakpostepow.ejs",  { user: req.user.imie });      
                }
            });
        }
        if(req.user.rola==1) {
            res.render("stronaGlowna.ejs",  { user: req.user.imie });
        }
});

/////////////////////////////////////////////////////////////////////////////////////////////////PANEL ADMINISTRATORA DZIAŁ SŁOWNICTWO 

app.get("/admin/slownictwoAngielski", checkNotAuthenticated, (req, res, next) => {
    var idM = req.query.idM

    if(req.user.rola==0) {

        if(idM>0) {
            pool.query(`DELETE FROM public."Material"`+"WHERE id= '"+idM+"' ")
        }

        pool.query(`SELECT * FROM public."Material" WHERE typ_materialu=1 AND id_jezyk=1 ORDER BY id ASC;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/slownictwoAngielski.ejs",  { nazwa_materialu: results.rows, user: req.user.imie });           
            } else {
                res.render("admin/slownictwoAngielski.ejs", { nazwa_materialu: results.rows, user: req.user.imie });  
            } 
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////DODAWANIE MATERIAŁU ANGIELSKI 

app.get("/admin/slownictwoAngielski/dodajMaterialAngielski", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT nazwa_materialu from public."Material" where id_jezyk=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajMaterialAngielski.ejs",  { nazwa_materialu:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/dodajMaterialAngielski.ejs",  { nazwa_materialu:results.rows, user: req.user.imie });  
            } 
        });
    }
});

app.post("/admin/slownictwoAngielski/dodajMaterialAngielski", checkNotAuthenticated, (req, res, next) => {
    let { nazwa_materialu } = req.body;
    let errors = []
    console.log("Dodano " + nazwa_materialu)
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT nazwa_materialu FROM public."Material" WHERE id_jezyk=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            pool.query(`SELECT FROM public."Material" WHERE typ_materialu=1 AND id_jezyk=1 AND nazwa_materialu = $1`, [nazwa_materialu], (err, results) => {
                if(results.rows.length > 0) {
                    errors.push({message: "Już istnieje materiał"})
                    res.render("admin/dodajMaterialAngielski.ejs",  { nazwa_materialu: results.rows, user: req.user.imie, errors });
                } else {
                    pool.query( `INSERT INTO public."Material" (id_jezyk, nazwa_materialu, typ_materialu)`+" VALUES (1, '"+nazwa_materialu+"', 1);",(err, results) => {
                        if(err) {
                            throw err
                        } 
                        res.redirect("/admin/slownictwoAngielski")
                    });  
                } 
            });
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////DODAWANIE SŁÓWEK DO MATERIAŁU ANGIELSKI 

app.get("/admin/slownictwoAngielski/dodajSLownictwoAngielski", checkNotAuthenticated, (req, res, next) => {
    let {idM, idS} = req.query

    if(req.user.rola==0) {
        if(idS>0) {
            console.log(idS)
            pool.query(`DELETE FROM public."Slownictwo" WHERE`+" id_material = '"+idM+"' AND id = '"+idS+"';")
        }

            pool.query(`SELECT * FROM public."Slownictwo"` +"WHERE id_material = '"+idM+"' ORDER BY id ASC;", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("admin/dodajSLownictwoAngielski.ejs",  {  slownictwo: results.rows, user: req.user.imie, idM });           
                } 
                else if(results.rows.length == 0) {
                    res.render("admin/dodajSLownictwoAngielski.ejs",  {  slownictwo: results.rows,  user: req.user.imie, idM });
                } 
            });
    }
});

app.get("/admin/slownictwoAngielski/dodajSlowkoAngielski", checkNotAuthenticated, (req, res, next) => {
    let { idM } = req.query 
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT id, tlumaczenie, polski FROM public."Slownictwo"`+"WHERE id_material ='"+idM+"'", (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajSlowkoAngielski.ejs",  { slownictwo: results.rows, user: req.user.imie, idM });           
            } else {
                res.render("admin/dodajSlowkoAngielski.ejs",  { slownictwo: results.rows, user: req.user.imie, idM });  
            } 
        });
    }
});

app.post("/admin/slownictwoAngielski/dodajSlowkoAngielski", checkNotAuthenticated, (req, res, next) => {
    let { idM } = req.query
    let { polski, tlumaczenie } = req.body;
    let errors = []
    console.log("Dodano " + tlumaczenie +" "+ polski)
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT polski, tlumaczenie FROM public."Slownictwo"`+"WHERE id_material='"+idM+"';", (err, results) => {
            if (err) {
                throw err;
            }
            pool.query(`SELECT * FROM public."Slownictwo" WHERE tlumaczenie = $1;`, [tlumaczenie], (err, results) => {
                if(results.rows.length > 0) {
                    errors.push({message: "Już istnieje to słówko"})
                    res.render("admin/dodajSlowkoAngielski.ejs",  { tlumaczenie: results.rows, user: req.user.imie, errors, idM });
                } else {
                    pool.query( `INSERT INTO public."Slownictwo" (id_material, tlumaczenie, polski)`+" VALUES ('"+idM+"', '"+tlumaczenie+"', '"+polski+"');",(err, results) => {
                        if(err) {
                            throw err
                        } 
                        errors.push({message: "dodano słówko"})
                        res.render("admin/dodajSlowkoAngielski.ejs",  { tlumaczenie: results.rows, user: req.user.imie, errors, idM });
                    });  
                } 
            });
        });
    }
});

app.get("/admin/slownictwoAngielski/edytujSlowkoAngielski", checkNotAuthenticated, (req, res, next) => {
    let { idM, idS } = req.query 
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT tlumaczenie, polski FROM public."Slownictwo"`+"WHERE id_material ='"+idM+"' AND id='"+idS+"';", (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/edytujSlowkoAngielski.ejs",  { slownictwo: results.rows, user: req.user.imie, idM, idS });           
            } else {
                res.render("admin/dodajSlowkoAngielski.ejs",  { slownictwo: results.rows, user: req.user.imie, idM });  
            } 
        });
    }
});

app.post("/admin/slownictwoAngielski/edytujSlowkoAngielski", checkNotAuthenticated, (req, res, next) => {
    let { idM, idS } = req.query
    let { polski, tlumaczenie } = req.body
    let errors = []
    console.log("Edytowano " + tlumaczenie +" "+ polski)
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT polski, tlumaczenie FROM public."Slownictwo"`+"WHERE id_material='"+idM+"';", (err, results) => {
            if (err) {
                throw err;
            }
            pool.query(`SELECT * FROM public."Slownictwo" WHERE tlumaczenie = $1;`, [tlumaczenie], (err, results) => {
                if(results.rows.length > 0) {
                    errors.push({message: "Już istnieje to słówko"})
                    res.render("admin/edytujSlowkoAngielski.ejs",  { tlumaczenie: results.rows, user: req.user.imie, errors, idM });
                } else {
                    pool.query( `UPDATE public."Slownictwo"`+"SET tlumaczenie='"+tlumaczenie+"', polski='"+polski+"'WHERE id='"+idS+"' AND id_material='"+idM+"';", (err, results) => {
                        if(err) {
                            throw err
                        } 
                        res.render("admin/edytujSlowkoAngielski.ejs",  { slownictwo: results.rows, user: req.user.imie, idM, idS });
                    }); 
                }
            });
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////PANEL ADMINISTRATORA DZIAŁ GRAMATYKA 

app.get("/admin/gramatykaAngielski", checkNotAuthenticated, (req, res, next) => {
    var idM = req.query.idM

    if(req.user.rola==0) {

        if(idM>0) {
            pool.query(`DELETE FROM public."Material"`+"WHERE id= '"+idM+"' ")
        }

        pool.query(`SELECT * FROM public."Material" WHERE typ_materialu=2 AND id_jezyk=1 ORDER BY id ASC;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/gramatykaAngielski.ejs",  { nazwa_materialu: results.rows, user: req.user.imie });           
            } else {
                res.render("admin/gramatykaAngielski.ejs", { nazwa_materialu: results.rows, user: req.user.imie });  
            } 
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////ADMINISTRATOR DODAWANIE GRAMATYKI ANGIELSKI

app.get("/admin/gramatykaAngielski/dodajGramatykeAngielski", checkNotAuthenticated, (req, res, next) => {
    var idM = req.query.idM

    if(req.user.rola==0) {

        if(idM>0) {
            pool.query(`DELETE FROM public."Material"`+"WHERE id= '"+idM+"' ")
        }

        pool.query(`SELECT * FROM public."Material" WHERE typ_materialu=2 AND id_jezyk=1 ORDER BY id ASC;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajGramatykeAngielski.ejs",  { nazwa_materialu: results.rows, user: req.user.imie });           
            } else {
                res.render("admin/dodajGramatykeAngielski.ejs", { nazwa_materialu: results.rows, user: req.user.imie });  
            } 
        });
    }
});

app.post("/admin/gramatykaAngielski/dodajGramatykeAngielski", checkNotAuthenticated, (req, res, next) => {
    let { nazwa_materialu } = req.body;
    let errors = []
    console.log("Dodano " + nazwa_materialu)
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT nazwa_materialu FROM public."Material" WHERE id_jezyk=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            pool.query(`SELECT FROM public."Material" WHERE typ_materialu=2 AND id_jezyk=1 AND nazwa_materialu = $1`, [nazwa_materialu], (err, results) => {
                if(results.rows.length > 0) {
                    errors.push({message: "Już istnieje materiał"})
                    res.render("admin/dodajMaterialAngielski.ejs",  { nazwa_materialu: results.rows, user: req.user.imie, errors });
                } else {
                    pool.query( `INSERT INTO public."Material" (id_jezyk, nazwa_materialu, typ_materialu)`+" VALUES (1, '"+nazwa_materialu+"', 2);",(err, results) => {
                        if(err) {
                            throw err
                        } 
                        res.redirect("/admin/gramatykaAngielski")
                    });  
                } 
            });
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////PANEL ADMINISTRATORA DODAWANIE TESTÓW

app.get("/admin/testAngielski", checkNotAuthenticated, (req, res, next) => {
    var idT = req.query.idT

    if(req.user.rola==0) {
        if(idT>0) {
            pool.query(`DELETE FROM public."Test"`+"WHERE id= '"+idT+"' ")
        }

        pool.query(`SELECT * FROM public."Test" WHERE jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/testAngielski.ejs",  { test: results.rows, user: req.user.imie });           
            } else {
                res.render("admin/testAngielski.ejs",  { test: results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.get("/admin/testAngielski/dodajTestAngielski", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT typ_testu, nazwa FROM public."Test" WHERE jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajTestAngielski.ejs",  { typ_testu: results.rows, user: req.user.imie });           
            } else {
                res.render("admin/dodajTestAngielski.ejs",  { typ_testu: results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.post("/admin/testAngielski/dodajTestAngielski", checkNotAuthenticated, (req, res, next) => {
    let { nazwa, typtest} = req.body;
    let errors = []
    console.log("Dodano test "+nazwa+" "+" typ: "+typtest)
    if(req.user.rola==0) {
        pool.query(`SELECT * FROM public."Test" WHERE jezyk_id=1 AND nazwa = $1 AND typ_testu = $2`, [nazwa, typtest], (err, results) => {
            if(results.rows.length > 0) {
                errors.push({message: "Test już istnieje"})
                res.render("admin/dodajtestangielski.ejs",  {user: req.user.imie, errors }); 
            } else {
                errors.push({message: "Dodano test o nazwie: "+nazwa})
                pool.query( `INSERT INTO public."Test" (nazwa, typ_testu, jezyk_id)`+" VALUES ('"+nazwa+"','"+typtest+"',1);");
                res.render("admin/dodajtestangielski.ejs",  { user: req.user.imie, errors }); 
            }
        })          
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////KASOWANIE PYTAŃ


app.get("/admin/skasujpytanieangielskidzial", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT * from public."Test" where jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {                
                res.render("admin/skasujpytanieangielskidzial.ejs",  {test:results.rows, user: req.user.imie });     
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.get("/admin/skasujpytanieniemieckidzial", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT * from public."Test" where jezyk_id=2;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/skasujpytanieniemieckidzial.ejs",  {test:results.rows, user: req.user.imie });       
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.post("/admin/skasujpytanieangielskislowka", checkNotAuthenticated, (req, res, next) => {
    let { test, id} = req.body;
    console.log({
        test,
        id,
    });

    if(req.user.rola==0) {
        if(id>0){
            pool.query( `DELETE FROM public."Pytania" WHERE `+"id= '"+id+"';");
        }
        if(test>0) {
        pool.query(`SELECT * from public."Pytania" where `+"test_id = '"+test+"' ", (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/skasujpytanieangielskislowka.ejs",  { pytanie:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie });
            } 
        });
    } else {
        pool.query(`SELECT * from public."Test" where jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/skasujpytanieangielskidzial.ejs",  {test:results.rows, user: req.user.imie });     
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  {user: req.user.imie }); 
            } 
        });
    }
}
});

app.post("/admin/skasujpytanieniemieckislowka", checkNotAuthenticated, (req, res, next) => {
    let { test, id} = req.body;
    console.log({
        test,
        id,
    });

    if(req.user.rola==0) {
        if(id>0) {
            pool.query( `DELETE FROM public."Pytania" WHERE `+"id= '"+id+"';");
        }
        if(test>0) {
            pool.query(`SELECT * from public."Pytania" where `+"test_id = '"+test+"' ", (err, results) => {
                if (err) {
                    throw err;
                }
                if(results.rows.length > 0) {
                    res.render("admin/skasujpytanieniemieckislowka.ejs",  { pytanie:results.rows, user: req.user.imie });           
                } else {
                    res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie });
                } 
        });
    } else {
        pool.query(`SELECT * from public."Test" where jezyk_id=2;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/skasujpytanieniemieckidzial.ejs",  {test:results.rows, user: req.user.imie });      
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  {user: req.user.imie }); 
            } 
        });
    }
}
});

app.get("/admin/skasujtestangielski", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT * from public."Test" where jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/skasujtestangielski.ejs",  {test:results.rows, user: req.user.imie });    
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.get("/admin/skasujtestniemiecki", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT * from public."Test" where jezyk_id=2;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/skasujtestniemiecki.ejs",  {test:results.rows, user: req.user.imie });     
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.post("/admin/skasujtestangielski", checkNotAuthenticated, (req, res, next) => {
    let { test} = req.body;
    console.log({
        test,
    });

    if(req.user.rola==0) {
         if(test>0) {
            pool.query(`DELETE from public."Pytania" where`+" test_id='"+test+"';", (err, re) => {
                if(err) throw err;
                pool.query(`DELETE from public."Test" where`+" id='"+test+"';", (e, r) => {
                    if(e) throw e;
                    pool.query(`SELECT * from public."Test" where jezyk_id=1;`, (error, results) => {
                        if (error) {
                            throw error;
                        }
                        if(results.rows.length > 0) {
                            res.render("admin/skasujtestangielski.ejs",  { test:results.rows, user: req.user.imie });           
                        } else {
                            res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie });
                        } 
                    });
                });
            });
        }
    }
});

app.post("/admin/skasujtestniemiecki", checkNotAuthenticated, (req, res, next) => {
    let { test} = req.body;
    console.log({
        test,
    });
    if(req.user.rola==0) {
        if(test>0) {
            pool.query(`DELETE from public."Pytania" where`+" test_id='"+test+"';", (err, re) => {
                if(err) throw err;
                pool.query(`DELETE from public."Test" where`+" id='"+test+"';", (e, r) => {
                    if(e) throw e;
                    pool.query(`SELECT * from public."Test" where jezyk_id=2;`, (error, results) => {
                        if (error) {
                            throw error;
                        }
                        if(results.rows.length > 0) {
                            res.render("admin/skasujtestniemiecki.ejs",  { test:results.rows, user: req.user.imie });           
                        } else {
                            res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie });
                        } 
                    });
                });
            });
        }
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////DODAWANIE PYTAŃ

app.get("/admin/dodajpytanieangielski", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT id, nazwa, typ_testu from public."Test" where jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajpytaniaangielski.ejs",  { test:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie }); 
            } 
        });
    }
});

app.get("/admin/dodajpytanieniemiecki", checkNotAuthenticated, (req, res, next) => {

    if(req.user.rola==0) {
        pool.query(`SELECT id, nazwa, typ_testu from public."Test" where jezyk_id=2;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajpytanianiemiecki.ejs",  { test:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });
    }
});

app.post("/admin/dodajpytanieangielski", checkNotAuthenticated, (req, res, next) => {
    let { tresc, poprawna, bledna1, bledna2, bledna3, test} = req.body;
    console.log({
        tresc,
        poprawna,
        bledna1,
        bledna2,
        bledna3,
        test,
     
    });
    if(req.user.rola==0) {
        if(test>0){
            pool.query( `INSERT INTO public."Pytania" (tresc, poprawna_odp, bledna_odp_1, bledna_odp_2, bledna_odp_3, test_id )`+" VALUES ('"+tresc+"'  ,'"+poprawna+"','"+bledna1+"','"+bledna2+"','"+bledna3+"', "+test+");");  
        }  
        pool.query(`SELECT id, nazwa, typ_testu from public."Test" where jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajpytaniaangielski.ejs",  { test:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });              
    }
});

app.post("/admin/dodajpytanieniemiecki", checkNotAuthenticated, (req, res, next) => {
    let { tresc, poprawna, bledna1, bledna2, bledna3, test} = req.body;
    console.log({
        tresc,
        poprawna,
        bledna1,
        bledna2,
        bledna3,
        test,
     
    });
    if(req.user.rola==0) {
        if(test>0){
            pool.query( `INSERT INTO public."Pytania" (tresc, poprawna_odp, bledna_odp_1, bledna_odp_2, bledna_odp_3, test_id )`+" VALUES ('"+tresc+"'  ,'"+poprawna+"','"+bledna1+"','"+bledna2+"','"+bledna3+"', "+test+");");  
        }
  
        pool.query(`SELECT id, nazwa, typ_testu from public."Test" where jezyk_id=2;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajpytanianiemiecki.ejs",  { test:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { uzytkownik:results.rows, user: req.user.imie }); 
            } 
        });              
    }
});


/////////////////////////////////////////////////////////////////////////////////////////////////DODAWANIE TESTÓW



app.get("/admin/dodajtestniemiecki", checkNotAuthenticated, (req, res, next) => {
    if(req.user.rola==0) {
        pool.query(`SELECT DISTINCT kategoria from public."Slownictwo" where jezyk_id=1;`, (err, results) => {
            if (err) {
                throw err;
            }
            if(results.rows.length > 0) {
                res.render("admin/dodajtestniemiecki.ejs",  { kategoria:results.rows, user: req.user.imie });           
            } else {
                res.render("admin/ustawieniaAdmin.ejs",  { user: req.user.imie }); 
            } 
        });
    }
});


app.post("/admin/dodajtestniemiecki", checkNotAuthenticated, (req, res, next) => {
    let { nazwa, test} = req.body;
    console.log({
        nazwa,
        test,
    });
    if(req.user.rola==0) {
        pool.query( `INSERT INTO public."Test" (nazwa, typ_testu, jezyk_id)`+" VALUES ('"+nazwa+"','"+test+"',2);");
        res.render("admin/dodajtestniemiecki.ejs",  {user: req.user.imie });                
    }
});



/////////////////////////////////////////////////////////////////////////////////////////////////wypełnianie testów ANGIELSKI


app.get("/uzytkownik/angielski/testangielski/wybortestu", checkNotAuthenticated, (req, res, next) => {
    res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie });           
});


app.get("/uzytkownik/angielski/testangielski/wybortestu/latwy", checkNotAuthenticated, (req, res, next) => {
    pool.query(`SELECT * from public."Test" where jezyk_id=1 AND typ_testu='łatwy'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/test/latwy/latwy.ejs",  { testy: results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/sredni", checkNotAuthenticated, (req, res, next) => {

    pool.query(`SELECT * from public."Test" where jezyk_id=1 AND typ_testu='średni'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            
            res.render("ugs/angielski/test/sredni/sredni.ejs",  { testy:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/trudny", checkNotAuthenticated, (req, res, next) => {
    pool.query(`SELECT * from public."Test" where jezyk_id=1 AND typ_testu='Trudny'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/test/trudny/trudny.ejs",  { testy:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/latwy/test", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;
    pool.query(`SELECT * FROM public."Pytania" where`+" test_id= '"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/test/test.ejs",  { testangielski:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/angielski/test/wybortestu.ejs",  {  user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/sredni/test", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;

    pool.query(`SELECT * FROM public."Pytania" where`+" test_id= '"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/test/test.ejs",  { testangielski:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/angielski/test/wybortestu.ejs",  {  user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/trudny/test", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;

    pool.query(`SELECT * FROM public."Pytania" where`+" test_id= '"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/angielski/test/test.ejs",  { testangielski:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/angielski/test/wybortestu.ejs",  {  user: req.user.imie }); 
        } 
    });
});


app.get("/uzytkownik/angielski/testangielski/wybortestu/latwy/wynik", checkNotAuthenticated, (req, res, next) => {
    var wynik=req.query.wynik;
    var test=req.query.test;

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"';" );
            }
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie }); 
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie });   
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/sredni/wynik", checkNotAuthenticated, (req, res, next) => {
    var wynik=req.query.wynik;
    var test=req.query.test;

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"';" );
            }
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie }); 
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie });   
        } 
    });
});

app.get("/uzytkownik/angielski/testangielski/wybortestu/trudny/wynik", checkNotAuthenticated, (req, res, next) => {
    var wynik=req.query.wynik;
    var test=req.query.test;

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {

            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"';" );
            }
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie }); 
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
            res.render("ugs/angielski/test/wybortestu.ejs",  { user: req.user.imie });   
        } 
    });
});

app.get("/zapiszwynik", checkNotAuthenticated, (req, res, next) => {
    
    var wynik= req.query.wynik;
    console.log(wynik);
    var test= req.query.test;
    console.log(test);

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' and uzytkownik_id= '"+req.user.id+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"' where uzytkownik_id= '"+req.user.id+"';" );
            }
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
        } 
    });
});


/////////////////////////////////////////////////////////////////////////////////////////////////NIEMIECKI WYPEŁNIANIE TESTÓW


app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu", checkNotAuthenticated, (req, res, next) => {
    res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie });           
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/latwy", checkNotAuthenticated, (req, res, next) => {
    pool.query(`SELECT * from public."Test" where jezyk_id=2 AND typ_testu='łatwy'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/test/latwy/latwy.ejs",  { testy: results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/sredni", checkNotAuthenticated, (req, res, next) => {

    pool.query(`SELECT * from public."Test" where jezyk_id=2 AND typ_testu='średni'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            
            res.render("ugs/niemiecki/test/sredni/sredni.ejs",  { testy:results.rows, user: req.user.imie });           
        } else {
            
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/trudny", checkNotAuthenticated, (req, res, next) => {

    pool.query(`SELECT * from public."Test" where jezyk_id=2 AND typ_testu='Trudny'`, (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {  
            res.render("ugs/niemiecki/test/trudny/trudny.ejs",  { testy: results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/latwy/test", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;

    pool.query(`SELECT * FROM public."Pytania" where`+" test_id= '"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/test/test.ejs",  { testniemiecki:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/niemiecki/test/wybortestu.ejs",  {  user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/sredni/test", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;

    pool.query(`SELECT * FROM public."Pytania" where`+" test_id= '"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/test/test.ejs",  { testniemiecki:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/niemiecki/test/wybortestu.ejs",  {  user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/trudny/test", checkNotAuthenticated, (req, res, next) => {
    var id=req.query.id;

    pool.query(`SELECT * FROM public."Pytania" where`+" test_id= '"+id+"' ;" , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            res.render("ugs/niemiecki/test/test.ejs",  { testniemiecki:results.rows, user: req.user.imie });           
        } else {
            res.render("ugs/niemiecki/test/wybortestu.ejs",  {  user: req.user.imie }); 
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/latwy/wynik", checkNotAuthenticated, (req, res, next) => {
    var wynik=req.query.wynik;
    var test=req.query.test;

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"';" );
            }
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie }); 
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie });   
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/sredni/wynik", checkNotAuthenticated, (req, res, next) => {
    var wynik=req.query.wynik;
    var test=req.query.test;

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"';" );
            }
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie }); 
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie });   
        } 
    });
});

app.get("/uzytkownik/niemiecki/testniemiecki/wybortestu/trudny/wynik", checkNotAuthenticated, (req, res, next) => {
    var wynik=req.query.wynik;
    var test=req.query.test;

    pool.query(`SELECT * from public."Wynik_testu"`+" where test_id= '"+test+"' ;"  , (err, results) => {
        if (err) {
            throw err;
        }
        if(results.rows.length > 0) {
            if(results.rows[0].ilosc_pkt < wynik) {
                pool.query(`UPDATE public."Wynik_testu" `+ "SET ilosc_pkt = '"+wynik+"';" );
            }
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie }); 
        } else {
            pool.query(`INSERT INTO public."Wynik_testu"(uzytkownik_id, test_id, ilosc_pkt) VALUES (`+" '"+req.user.id+"', '"+test+"', '"+wynik+"');");
            res.render("ugs/niemiecki/test/wybortestu.ejs",  { user: req.user.imie });   
        } 
    });
});

app.get("/koniec", checkNotAuthenticated, (req, res, next) => {
    var idu=req.query.idu;
    console.log(idu);
    console.log(req.user.id);

    if(idu==req.user.id) {
        pool.query( `DELETE FROM public."Uzytkownik"` + "WHERE id= '"+idu+"' " );
        req.logout();
        res.render("koniec.ejs");
    }
});




/////////////////////////////////////////////////////////////////////////////////////////////////NIEMIECKI WYPEŁNIANIE TESTÓW

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//STRONA Z SLOWKAMI bez zalogowania jezyk angielski

///angielski i niemiecki

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

/////////////////////////////////////////////////////////////////////////////////////////////////QUIZY NIEMIECKI

app.get("/uzytkownik/niemiecki/quizy/quizyniemiecki", checkNotAuthenticated, (req, res, next)  => {
    res.render("ugs/niemiecki/quizy/quizyniemiecki.ejs",  { user: req.user.imie });
});


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
