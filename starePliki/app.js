const http = require('http');
const path = require('path');
const express = require('express');
const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname + '/views/index.html'));
});
app.get('/logowanie', (request, response) => {
  response.sendFile(path.join(__dirname + '/views/logowanie.html'));
});
app.get('/index', (request, response) => {
  response.sendFile(path.join(__dirname + '/views/index.html'));
});
app.get('/rejestracja', (request, response) => {
  response.sendFile(path.join(__dirname + '/views/rejestracja.html'));
});
app.post('/podsumowanie', (request, response) => {
  response.sendFile(path.join(__dirname + '/views/podsumowanie.html'));

});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const knex = require('knex')({
  client: 'pg',
  version: '7.2',
  connection: {
    host : 'localhost',
    user : 'postgres',
    password : '1234',
    database : 'language_school'
  }
  
});

