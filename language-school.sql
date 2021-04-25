-- This script was generated by a beta version of the ERD tool in pgAdmin 4.
-- Please log an issue at https://redmine.postgresql.org/projects/pgadmin4/issues/new if you find any bugs, including reproduction steps.
BEGIN;


CREATE TABLE public.uzytkownik
(
    id integer,
    nazwisko character varying(50),
    imie character varying(50),
    wiek integer,
    "e-mail" character varying(50),
    login character varying(50),
    haslo character varying(50),
    data_ostatniego_logowania integer,
    rola_id integer,
    PRIMARY KEY (id)
);

CREATE TABLE public."Rola"
(
    id integer,
    "typ Enum" character varying,
    PRIMARY KEY (id)
);

CREATE TABLE public."Uzytkownik_Jezyk"
(
    uzytkownik_id integer,
    jezyk_id integer
);

CREATE TABLE public."Jezyk"
(
    id integer,
    nazwa character varying(50),
    "poziom Enum" character varying(50),
    opis character varying(255),
    PRIMARY KEY (id)
);

CREATE TABLE public."Wynik_testu"
(
    uzytkownik_id integer,
    test_id integer,
    ilosc_pkt integer
);

CREATE TABLE public."Test"
(
    id integer,
    nazwa character varying(50),
    "typ enum" character varying(50),
    jezyk_id integer,
    material_id integer,
    PRIMARY KEY (id)
);

CREATE TABLE public."Material"
(
    id integer,
    tresc_opis character varying(255),
    sugerowany_nastepny_material_id integer,
    jezyk_id integer,
    PRIMARY KEY (id)
);

CREATE TABLE public."Pytania"
(
    id integer,
    tresc character varying(50),
    udzielona_odp "char",
    poprawna_odp "char",
    bledna_odp_1 "char",
    bledna_odp_2 "char",
    test_id integer,
    PRIMARY KEY (id)
);

CREATE TABLE public."Pytania_otwarte"
(
    id integer,
    odpowiedz character varying(50),
    poprawna_odpowiedz character varying(50),
    ilosc_pkt integer,
    test_id integer,
    PRIMARY KEY (id)
);

CREATE TABLE public."Slownictwo"
(
    id integer,
    polski integer,
    tlumaczenie integer,
    jezyk_id integer,
    PRIMARY KEY (id)
);

ALTER TABLE public.uzytkownik
    ADD FOREIGN KEY (rola_id)
    REFERENCES public."Rola" (id)
    NOT VALID;


ALTER TABLE public."Uzytkownik_Jezyk"
    ADD FOREIGN KEY (uzytkownik_id)
    REFERENCES public.uzytkownik (id)
    NOT VALID;


ALTER TABLE public."Uzytkownik_Jezyk"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
    NOT VALID;


ALTER TABLE public."Wynik_testu"
    ADD FOREIGN KEY (uzytkownik_id)
    REFERENCES public.uzytkownik (id)
    NOT VALID;


ALTER TABLE public."Test"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
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


ALTER TABLE public."Wynik_testu"
    ADD FOREIGN KEY (test_id)
    REFERENCES public."Test" (id)
    NOT VALID;


ALTER TABLE public."Pytania"
    ADD FOREIGN KEY (test_id)
    REFERENCES public."Test" (id)
    NOT VALID;

END;