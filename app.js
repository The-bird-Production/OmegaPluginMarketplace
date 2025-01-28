// Code for Marketplace with Express.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const unzipper = require('unzipper'); // For extracting ZIP files
require('dotenv').config(); // For loading environment variables

const app = express();
const PORT = 3002;

// Directory to store validated plugins
const VALIDATED_PLUGIN_DIR = path.join(__dirname, 'validated_plugins');
const TEMP_ZIP_DIR = path.join(__dirname, 'temp_zip');

// GitHub Artifact API configuration
const GITHUB_API_URL = process.env.GITHUB_API_URL; // Replace {owner} and {repo}
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set your GitHub personal access token

// Helper function to download and extract the latest validated plugins
async function downloadAndExtractValidatedPlugins() {
    try {
        console.log('Fetching artifacts from GitHub...');
        const response = await axios.get(GITHUB_API_URL, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
        });

        const artifacts = response.data.artifacts
            .filter((artifact) => artifact.name === 'validated-plugins')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by creation date (latest first)

        if (artifacts.length === 0) {
            console.log('No validated plugin artifacts found.');
            return;
        }

        const latestArtifact = artifacts[0];
        console.log(`Downloading latest artifact: ${latestArtifact.name}`);

        const downloadResponse = await axios.get(latestArtifact.archive_download_url, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
            responseType: 'arraybuffer',
        });

        // Save the downloaded ZIP file temporarily
        const zipPath = path.join(TEMP_ZIP_DIR, `${latestArtifact.id}.zip`);
        if (!fs.existsSync(TEMP_ZIP_DIR)) {
            fs.mkdirSync(TEMP_ZIP_DIR, { recursive: true });
        }
        fs.writeFileSync(zipPath, downloadResponse.data);

        console.log('Extracting plugins...');
        
        await extractZip(zipPath, VALIDATED_PLUGIN_DIR);

      
        console.log('Plugins extracted successfully.');

        // Clean up the temporary ZIP file
        fs.unlinkSync(zipPath); 
    } catch (error) {
        console.error('Error downloading or extracting plugins:', error.message);
    }
}

// Helper function to extract ZIP files
async function extractZip(zipPath, outputDir) {
    return fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: outputDir }))
        .promise();
}

// Route to fetch validated plugins
app.get('/plugins', (req, res) => {
    if (!fs.existsSync(VALIDATED_PLUGIN_DIR)) {
        return res.status(200).json({ plugins: [] });
    }

    const plugins = fs.readdirSync(VALIDATED_PLUGIN_DIR).map((plugin) => {
        const pluginJsonPath = path.join(VALIDATED_PLUGIN_DIR, plugin, 'plugin.json');
        const pluginInfo = fs.existsSync(pluginJsonPath) ? require(pluginJsonPath) : { name: plugin };

        return {
            id : pluginInfo.id || plugin,
            name: pluginInfo.name || plugin,
            version: pluginInfo.version || 'none',
            description: pluginInfo.description || 'No description available',
            downloadUrl: `/download/${pluginInfo.id || plugin}`,
        };
    });

    res.status(200).json({ plugins });
});

// Route to download a validated plugin as a ZIP
app.get('/download/:pluginId', (req, res) => {
    const { pluginId } = req.params;
    // Locate plugin name with the given pluginId
    const pluginName = fs.readdirSync(VALIDATED_PLUGIN_DIR).find((plugin) => {
        const pluginJsonPath = path.join(VALIDATED_PLUGIN_DIR, plugin, 'plugin.json');
        const pluginInfo = fs.existsSync(pluginJsonPath) ? require(pluginJsonPath) : { name: plugin };
        return pluginInfo.id === pluginId;
    });

    const pluginPath = path.join(VALIDATED_PLUGIN_DIR, pluginName);

    if (!fs.existsSync(pluginPath)) {
        return res.status(404).json({ message: 'Plugin not found' });
    }

    const zipPath = path.join(TEMP_ZIP_DIR, `${pluginName}.zip`);

    // Zip the plugin folder
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(pluginPath, false);
    archive.finalize();

    output.on('close', () => {
        res.download(zipPath, `${pluginName}.zip`, (err) => {
            if (!err) {
                fs.unlinkSync(zipPath); // Clean up the temporary ZIP after download
            }
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Marketplace server running on port ${PORT}`);
    if (!fs.existsSync(VALIDATED_PLUGIN_DIR)) {
        fs.mkdirSync(VALIDATED_PLUGIN_DIR, { recursive: true });
    }
    downloadAndExtractValidatedPlugins(); // Initial download of plugins
    setInterval(downloadAndExtractValidatedPlugins, 600000); // Refresh every ten minutes
});
