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
            fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count",
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

  app.get("/api/instagram-profile", async (req, res) => {
    const { access_token } = req.query;
  
    if (!access_token) {
      return res.status(400).json({ error: "Access token is required" });
    }
  
    try {
      const profileRes = await axios.get(
        "https://graph.instagram.com/me", {
          params: {
            fields: "biography,follows_count,account_type,profile_picture_url,id,username,media_count,followers_count",
            access_token
          }
        }
      );
  
      return res.json(profileRes.data);
    } catch (error) {
      console.error("Error fetching profile info:", error.response?.data || error.message);
      return res.status(500).json({ error: "Failed to fetch profile data" });
    }
  });
  
  
  app.get("/api/instagram-media-insights", async (req, res) => {
    const { access_token, media_id } = req.query;
  
    if (!access_token || !media_id) {
      return res.status(400).json({ error: "access_token and media_id are required" });
    }
  
    try {
      const insightRes = await axios.get(
        `https://graph.instagram.com/${media_id}/insights`, {
          params: {
            metric: "impressions,reach,engagement,saved",
            access_token,
          }
        }
      );
  
      return res.json(insightRes.data);
    } catch (error) {
      if (error.response) {
        console.error("Error fetching insights:", error.response.data);
        return res.status(error.response.status).json({ error: error.response.data.error.message });
      } else if (error.request) {
        console.error("Error fetching insights:", error.request);
        return res.status(500).json({ error: "No response received from Instagram API" });
      } else {
        console.error("Error fetching insights:", error.message);
        return res.status(500).json({ error: "Failed to fetch insights" });
      }
    }
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));