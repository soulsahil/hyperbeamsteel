const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const {
  INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI,
} = process.env;

app.get("/", (req, res) => {
    res.send("Instagram Auth Backend is running.");
  });


app.post("/api/instagram-auth", async (req, res) => {
  const { code } = req.body;

  try {
    const formData = new URLSearchParams();
    formData.append("client_id", INSTAGRAM_CLIENT_ID);
    formData.append("client_secret", INSTAGRAM_CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", INSTAGRAM_REDIRECT_URI);
    formData.append("code", code);

    const tokenRes = await axios.post("https://api.instagram.com/oauth/access_token", formData);
    const { access_token, user_id } = tokenRes.data;

    const userInfoRes = await axios.get(
     ` https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
    );

    return res.json({
      access_token,
      user_id,
      username: userInfoRes.data.username,
    });
  } catch (error) {
    console.error("Instagram OAuth error:", error.response?.data || error.message);
    return res.status(500).json({ error: "OAuth flow failed" });
  }
});

app.get("/api/instagram-media", async (req, res) => {
    const { access_token } = req.query;
  
    if (!access_token) {
      return res.status(400).json({ error: "Access token is required" });
    }
  
    try {
      const mediaRes = await axios.get(
        `https://graph.instagram.com/me/media`, {
          params: {
            fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username",
            access_token,
          }
        }
      );
  
      return res.json(mediaRes.data);
    } catch (error) {
      console.error("Error fetching user media:", error.response?.data || error.message);
      return res.status(500).json({ error: "Failed to fetch media" });
    }
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));