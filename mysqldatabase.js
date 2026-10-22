import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'artify_admin',
  password: 'ArtifyPHPassword890!WST',
  database: 'artifyph',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10
});

export default pool;