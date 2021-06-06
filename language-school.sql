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
    id serial NOT NULL,
    nazwa character varying(255),
    poziom character varying(255),
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
    id serial NOT NULL,
    nazwa character varying(255),
    typ_testu character varying(255),
    jezyk_id integer NOT NULL,
    material_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Material"
(
    id serial NOT NULL,
    tresc_opis character varying(255),
    jezyk_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Pytania"
(
    id serial NOT NULL,
    tresc character varying(255),
    poprawna_odp character varying(255),
    bledna_odp_1 character varying(255),
    bledna_odp_2 character varying(255),
    bledna_odp_3 character varying(255),
    test_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE public."Slownictwo"
(
    id serial NOT NULL,
    polski character varying(255),
    tlumaczenie character varying(255),
    jezyk_id integer NOT NULL,
	kategoria character varying(255),
    PRIMARY KEY (id)
);

CREATE TABLE public."Uzytkownik_audit"
(
    imie character varying(255),
    nazwisko character varying(255),
    wiek integer,
    rola integer,
	id integer,
	czas_stworzenia timestamp without time zone
);


ALTER TABLE public."Uzytkownik_Jezyk"
    ADD FOREIGN KEY (uzytkownik_id)
    REFERENCES public."Uzytkownik" (id)
	ON DELETE CASCADE
    NOT VALID;


ALTER TABLE public."Uzytkownik_Jezyk"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
    NOT VALID;


ALTER TABLE public."Wynik_testu"
    ADD FOREIGN KEY (uzytkownik_id)
    REFERENCES public."Uzytkownik" (id)
	ON DELETE CASCADE
    NOT VALID;

ALTER TABLE public."Test"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
    NOT VALID;


ALTER TABLE public."Material"
    ADD FOREIGN KEY (jezyk_id)
    REFERENCES public."Jezyk" (id)
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

CREATE OR REPLACE FUNCTION ustaw_czas_stworzenia()
  RETURNS TRIGGER 
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
  	INSERT INTO public."Uzytkownik_audit"(imie, nazwisko, wiek, rola, id, czas_stworzenia)
  	VALUES(NEW.imie, NEW.nazwisko, NEW.wiek, NEW.rola, NEW.id, now());
  	RETURN NEW;
END;
$$	

CREATE TRIGGER update_audit
  AFTER UPDATE
  ON public."Uzytkownik"
  FOR EACH ROW
  EXECUTE PROCEDURE ustaw_czas_stworzenia();
