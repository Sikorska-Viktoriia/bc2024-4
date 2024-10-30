const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises; // Use promises for async file operations
const path = require('path');

// Initialize Commander
const program = new Command();

// Set up command-line arguments
program
    .requiredOption('-h, --host <address>', 'server address')
    .requiredOption('-p, --port <number>', 'server port')
    .requiredOption('-c, --cache <path>', 'path to the directory for cached files');

// Parse arguments
program.parse(process.argv);
const options = program.opts();

// Check required parameters
if (!options.host || !options.port || !options.cache) {
    console.error("Error: Please specify required parameters: -h <address> -p <number> -c <path>");
    process.exit(1);
}

// Create server
const requestListener = async(req, res) => {
    const { url, method } = req;
    const statusCode = url.slice(1); // Get code from URL

    // Validate statusCode
    if (!/^\d{3}$/.test(statusCode)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: Invalid status code');
        return;
    }

    const filePath = path.join(options.cache, `${statusCode}.jpg`);

    switch (method) {
        case 'GET':
            try {
                await fs.access(filePath); // Check if file exists
                console.log('File exists, reading.');
                const image = await fs.readFile(filePath); // Read the image
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(image); // Send the image in the response
            } catch (error) {
                console.error('Error reading file:', error);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found'); // File not found
            }
            break;

        case 'PUT':
            try {
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk)); // Collect data chunks
                req.on('end', async() => {
                    const imageBuffer = Buffer.concat(chunks); // Combine chunks into a single buffer
                    await fs.writeFile(filePath, imageBuffer); // Write the image to the file
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('Created'); // Respond with created status
                });
            } catch (error) {
                console.error('Error writing file:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error'); // Handle internal server error
            }
            break;

        case 'DELETE':
            try {
                await fs.access(filePath); // Check if file exists
                console.log('File exists, deleting.');
                await fs.unlink(filePath); // Delete the file
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Deleted'); // Respond with deleted status
            } catch (error) {
                console.error('Error deleting file:', error);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found'); // File not found
            }
            break;

        default:
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed'); // Handle unsupported methods
    }
};

// Start the server
const server = http.createServer(requestListener);
const PORT = options.port; // Use port from parameters
server.listen(PORT, options.host, () => {
    console.log(`Server is running on http://${options.host}:${PORT}`);
});