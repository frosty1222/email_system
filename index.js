const path = require('path');
const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./dbconnect');
const route = require('./routes');

app.use(express.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  express.urlencoded({
    extended: true,
  }),
);
db.connect();

route(app);
const node_port = process.env.PORT;
app.listen(node_port, () => {
  console.log(`Server Started at ${node_port}`);
});
