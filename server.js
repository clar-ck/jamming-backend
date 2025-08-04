const express = require('express');
const app = express();
require('dotenv').config();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const tokenEndpoint = 'https://accounts.spotify.com/api/token';
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
const scope = process.env.SPOTIFY_SCOPE || 'playlist-modify-public';

// Spotify's authorization endpoint
const authEndpoint = 'https://accounts.spotify.com/authorize';

// Use the client ID and redirect URI to create the authorization URL
const authUrl = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

// Middleware to parse JSON bodies
app.use(express.json());

//
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Welcome to the Spotify API integration server!');
});

app.get('/login', (req, res) => {
    // Redirect to Spotify's authorization page
    res.redirect(authUrl);
});

app.post('/callback', async (req, res) => {
    // Handle the callback from Spotify after user authorization
    const code = req.body.code;
    if (!code) {
            return res.status(400).send('Authorization code not provided');
        }
    try {

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        })
        // Check if the response is ok
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).send(errorData.error_description || 'Error retrieving access token');
        }

        // Parse the response to get the access token
        const data = await response.json();
        if (data.error) {
            return res.status(400).send(data.error_description || 'Error retrieving access token');
        }

        // Send the access token and refresh token back to the client
        res.json({
            accessToken: data.access_token,
            refreshToken: data.refresh_token
        });

    } catch (error) {
        console.error('Error during Spotify callback:', error);
        res.status(500).send('Internal Server Error');
    }
        
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});