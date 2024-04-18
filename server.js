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
        res.status(201).json({sucsess: true,movie:result.rows[0]})
    }catch (error) {
        console.error('error storing movie details:',error);
        res.status(500).json({sucess:false,error:'internal server error'})
    }
});
app.get('/api/movies',async(req,res) =>{
    try{
        const query = 'select * from movies';
        const result = await client.query(query);
        const movies = result.rows;
        res.status(200).json({success:true,movies})
    }catch (error) {
        console.error('error fetching movie:',error);
        res.status(500).json({success:false,error:'Internal server error'})
    }
});
// GET endpoint to fetch a movie by ID
app.get('/api/movies/:id', async (req,res) => {
    const movieId = req.params.id;
    try{
        const query = 'select * from movies WHERE id = $1';
        const result = await client.query(query,[movieId]);

        if(result.rows.length === 0) {
            return res.status(404).json({sucess:false,error:'movie not found'})
        }
        res.status(200).json({success:true,movie:result.rows[0]});
    }catch (error) {
        console.error('error fetching movie id :',error);
        res.status(500).json({success:false,error:'internal server error'})
    }
});
app.put('/api/movies/:id', async (req, res) => {
    const movieId = req.params.id;
    const { title, description, release_date, genre, poster_url } = req.body;
    try {
        // Check if the movie with the specified ID exists
        const checkQuery = 'SELECT * FROM movies WHERE id = $1';
        const checkResult = await client.query(checkQuery, [movieId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }
        // Update the movie details in the database
        const updateQuery = `
      UPDATE movies
      SET title = $1, description = $2, release_date = $3, genre = $4, poster_url = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 `;
        const updateValues = [title, description, release_date, genre, poster_url, movieId];
        await client.query(updateQuery, updateValues);
        // Return success response
        res.status(200).json({ success: true, message: 'Movie updated successfully' });
    } catch (error) {
        console.error('Error updating movie by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.delete('/api/movies/:id', async(req,res)=> {
    const movieId = req.params.id;
    try{
        const checkQuery = 'select * from movies where id = $1';
        const checkResult = await client.query(checkQuery,[movieId]);
        if(checkResult.rows.length === 0 ) {
            return res.status(404).json({success:false,error:'movie not found'})
        }
        const deleteQuery = 'DELETE from movies where id = $1';
        await client.query(deleteQuery,[movieId]);

        res.status(200).json({success:true,message:'Movie deleted'})
    }catch(error){
        console.error('Error deleting movie by ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

 app.listen(PORT,()=>{
    console.log(`server running on http://localhost:${PORT}`);
 })