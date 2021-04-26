const http = require('http');
const path = require('path');
const express = require('express');
const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname + '/index.html'));
});
app.get('/logowanie', (request, response) => {
  response.sendFile(path.join(__dirname + '/logowanie.html'));
});
app.get('/index', (request, response) => {
  response.sendFile(path.join(__dirname + '/index.html'));
});
app.get('/rejestracja', (request, response) => {
  response.sendFile(path.join(__dirname + '/rejestracja.html'));
});
app.post('/podsumowanie', (request, response) => {
  response.sendFile(path.join(__dirname + '/podsumowanie.html'));
});


app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});