BEGIN;

CREATE TABLE public."Uzytkownik"
(
    id serial NOT NULL,
    nazwisko character varying(255) NOT NULL,
    imie character varying(255) NOT NULL,
    wiek integer NOT NULL,
    email character varying(255) NOT NULL,
    haslo character varying(255) NOT NULL,
    data_ostatniego_logowania date,
    rola integer NOT NULL DEFAULT 1,
    PRIMARY KEY (id)
);

CREATE TABLE public."Uzytkownik_Jezyk"
(
    uzytkownik_id integer NOT NULL,
    jezyk_id integer NOT NULL
);

CREATE TABLE public."Jezyk"
(
    id integer NOT NULL,
    nazwa character varying(255),
    "poziom " character varying(255),
    opis character varying(255),
    PRIMARY KEY (id)
);

CREATE TABLE public."Wynik_testu"
(
    uzytkownik_id integer NOT NULL,
    test_id integer NOT NULL,
    ilosc_pkt integer NOT NULL
);

CREATE TABLE public."Test"
(
    id integer NOT NULL,
    nazwa character varying(255),
    "typ " character varying(255),
    jezyk_id integer NOT NULL,
    material_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Material"
(
    id integer NOT NULL,
    tresc_opis character varying(255),
    sugerowany_nastepny_material_id integer,
    jezyk_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Pytania"
(
    id integer NOT NULL,
    tresc character varying(255) NOT NULL,
    udzielona_odp "char" NOT NULL,
    poprawna_odp "char" NOT NULL,
    bledna_odp_1 "char" NOT NULL,
    bledna_odp_2 "char" NOT NULL,
    test_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Pytania_otwarte"
(
    id integer NOT NULL,
    odpowiedz character varying(255) NOT NULL,
    poprawna_odpowiedz character varying(255) NOT NULL,
    ilosc_pkt integer NOT NULL,
    test_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Slownictwo"
(
    id serial NOT NULL,
    polski character varying(255),
    tlumaczenie character varying(255),
    jezyk_id integer NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE public."Uzytkownik_Jezyk"
    ADD FOREIGN KEY (uzytkownik_id)
    REFERENCES public."Uzytkownik" (id)
    NOT VALID;


ALTER TABLE public."Uzytkownik_Jezyk"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
	ON DELETE CASCADE
    NOT VALID;


ALTER TABLE public."Wynik_testu"
    ADD FOREIGN KEY (uzytkownik_id)
    REFERENCES public."Uzytkownik" (id)
    NOT VALID;


ALTER TABLE public."Test"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
	ON DELETE CASCADE
    NOT VALID;


ALTER TABLE public."Material"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
    NOT VALID;


ALTER TABLE public."Pytania_otwarte"
    ADD FOREIGN KEY (test_id)
    REFERENCES public."Test" (id)
    NOT VALID;


ALTER TABLE public."Slownictwo"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
    NOT VALID;


ALTER TABLE public."Pytania"
    ADD FOREIGN KEY (test_id)
    REFERENCES public."Test" (id)
    NOT VALID;

END;