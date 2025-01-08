// Code for Marketplace with Express.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = 3000;
require('dotenv').config();

// Directory to store validated plugins
const VALIDATED_PLUGIN_DIR = path.join(__dirname, 'validated_plugins');



// GitHub Artifact API configuration
const GITHUB_API_URL = 'https://api.github.com/repos/faynix-code/OmegaPluginMarketPlace/actions/artifacts'; // Replace {owner} and {repo}
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set your GitHub personal access token

// Helper function to download and save validated plugins
async function downloadValidatedPlugins() {
    try {
        const response = await axios.get(GITHUB_API_URL, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
        });

        const artifacts = response.data.artifacts.filter((artifact) => artifact.name === 'validated-plugins');

        for (const artifact of artifacts) {
            const downloadResponse = await axios.get(artifact.archive_download_url, {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                },
                responseType: 'arraybuffer',
            });

            const zipPath = path.join(VALIDATED_PLUGIN_DIR, `${artifact.id}.zip`);
            fs.writeFileSync(zipPath, downloadResponse.data);

            console.log(`Downloaded and saved: ${artifact.name}`);
        }
    } catch (error) {
        console.error('Error downloading plugins:', error.message);
    }
}

// Route to fetch validated plugins
app.get('/plugins', (req, res) => {
    if (!fs.existsSync(VALIDATED_PLUGIN_DIR)) {
        return res.status(200).json({ plugins: [] });
    }

    const plugins = fs.readdirSync(VALIDATED_PLUGIN_DIR).map((plugin) => {
        return {
            name: plugin,
            downloadUrl: `/download/${plugin}`,
        };
    });

    res.status(200).json({ plugins });
});

// Route to download a validated plugin
app.get('/download/:pluginName', (req, res) => {
    const { pluginName } = req.params;
    const pluginPath = path.join(VALIDATED_PLUGIN_DIR, pluginName);

    if (!fs.existsSync(pluginPath)) {
        return res.status(404).json({ message: 'Plugin not found' });
    }

    res.download(pluginPath);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Marketplace server running on port ${PORT}`);
    if (!fs.existsSync(VALIDATED_PLUGIN_DIR)) {
        fs.mkdirSync(VALIDATED_PLUGIN_DIR);
    }
    downloadValidatedPlugins(); // Initial download of plugins
    setInterval(downloadValidatedPlugins, 3600000); // Refresh every hour
});