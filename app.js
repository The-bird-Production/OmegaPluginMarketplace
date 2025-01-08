const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const archiver = require('archiver');
require('dotenv').config();

const app = express();
const PORT = 3002;

// Directories
const PLUGIN_DIR = path.join(__dirname, 'plugins');

// GitHub Artifact API configuration
const GITHUB_API_URL = 'https://api.github.com/repos/The-bird-Production/OmegaPluginMarketPlace/actions/artifacts';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

// Helper function to download and extract plugins
async function downloadAndExtractPlugins() {
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

            const tempZipPath = path.join(__dirname, `${artifact.id}.zip`);
            fs.writeFileSync(tempZipPath, downloadResponse.data);

            const extractPath = path.join(PLUGIN_DIR, artifact.name);
            await extractZip(tempZipPath, extractPath);

            console.log(`Extracted and saved: ${artifact.name}`);
            fs.unlinkSync(tempZipPath); // Clean up the temp zip file
        }
    } catch (error) {
        console.error('Error downloading plugins:', error.message);
    }
}

// Helper function to extract ZIP files
async function extractZip(zipPath, extractPath) {
    const unzipper = require('unzipper');
    fs.mkdirSync(extractPath, { recursive: true });

    return fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();
}

// Route to fetch plugins
app.get('/plugins', (req, res) => {
    if (!fs.existsSync(PLUGIN_DIR)) {
        return res.status(200).json({ plugins: [] });
    }

    const plugins = fs.readdirSync(PLUGIN_DIR)
        .filter((dir) => {
            const pluginJsonPath = path.join(PLUGIN_DIR, dir, 'plugin.json');
            return fs.existsSync(pluginJsonPath);
        })
        .map((dir) => {
            const pluginJsonPath = path.join(PLUGIN_DIR, dir, 'plugin.json');
            const pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
            return {
                name: pluginData.name,
                version: pluginData.version,
                description: pluginData.description,
                downloadUrl: `/download/${dir}`,
            };
        });

    res.status(200).json({ plugins });
});

// Route to download a plugin as a ZIP file
app.get('/download/:pluginName', (req, res) => {
    const { pluginName } = req.params;
    const pluginPath = path.join(PLUGIN_DIR, pluginName);

    if (!fs.existsSync(pluginPath)) {
        return res.status(404).json({ message: 'Plugin not found' });
    }

    const zipFileName = `${pluginName}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => res.status(500).send({ error: err.message }));

    archive.pipe(res);
    archive.directory(pluginPath, false);
    archive.finalize();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Marketplace server running on port ${PORT}`);
    if (!fs.existsSync(PLUGIN_DIR)) {
        fs.mkdirSync(PLUGIN_DIR);
    }
    downloadAndExtractPlugins(); // Initial download of plugins
    setInterval(downloadAndExtractPlugins, 3600000); // Refresh every hour
});
