const { Client } = require('pg');

const client = new Client({
    
    host: "localhost",
    user: "postgres",
    password: "123",
    port: "5432",
    database: "language_school"
})

client.connect();

client.query(`SELECT * FROM public."Uzytkownik"`, (err, result) => {

    if(!err) {
        return console.log(result.rows);
    }
    client.end();
})