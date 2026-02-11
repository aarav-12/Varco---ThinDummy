/* eslint-disable no-undef */
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "health_mvp",
  password: "mithrani0000",
  port: 5432,
});

module.exports = pool;
