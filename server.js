const express = require("express");
const bodyParser = require('body-parser');
const {Client} = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT ||4000;

// PostgreSQL connection configuration
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, // Default PostgreSQL port
    ssl: {
        rejectUnauthorized: false, // Set to false if using self-signed certificates
        // You may need to provide other SSL options such as ca, cert, and key
        // Example:
        // ca: fs.readFileSync('path/to/ca-certificate.crt'),
        // cert: fs.readFileSync('path/to/client-certificate.crt'),
        // key: fs.readFileSync('path/to/client-certificate.key')
    },
});

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

client.connect()
.then(()=> console.log('connected to postgreSQL'))
.catch(error => console.error('error connecting to postgres:',error))

app.post('/api/movies',async(req,res)=> {
    try{
        const{ title, description, release_date, genre, poster_url } = req.body;
        
          // Insert movie details into the movies table
        const query = `INSERT INTO movies (title,description,release_date,genre,poster_url)
        values ($1,$2,$3,$4,$5) RETURNING *`;

        const values = [title, description, release_date, genre, poster_url];
        const result = await client.query(query,values);
        // Return the inserted movie details as the response
        res.status(201).json({sucsess: false,movie:result.rows[0]})
    }catch (error) {
        console.error('error storing movie details:',error);
        res.status(500).json({sucess:false,error:'internal server error'})
    }
});
 app.listen(PORT,()=>{
    console.log(`server running on http://localhost:${PORT}`);
 })