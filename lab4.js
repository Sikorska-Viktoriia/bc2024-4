const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises; // Використовуємо асинхронні методи
const path = require('path');

// Запуск без параметрів
if (process.argv.length <= 2) {
    console.error("Помилка: Будь ласка, вкажіть обов'язкові параметри: -h <address> -p <number> -c <path>");
    process.exit(1);
}

// Ініціалізація Commander
const program = new Command();

// Налаштування командних аргументів
program
    .requiredOption('-h, --host <address>', 'адреса сервера')
    .requiredOption('-p, --port <number>', 'порт сервера')
    .requiredOption('-c, --cache <path>', 'шлях до директорії для закешованих файлів');

// Парсинг аргументів
program.parse(process.argv);
const options = program.opts();

// Перевірка обов'язкових параметрів
if (!options.host || !options.port || !options.cache) {
    console.error("Будь ласка, вкажіть адрес сервера, порт та директорію для кешу.");
    process.exit(1);
}

// Створення сервера
const requestListener = async(req, res) => {
    const { url, method } = req;
    const statusCode = url.slice(1); // Отримуємо код з URL
    const filePath = path.join(options.cache, `${statusCode}.jpg`);

    switch (method) {
        case 'GET':
            try {
                const image = await fs.readFile(filePath);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(image);
            } catch (error) {
                console.error('Помилка при читанні файлу:', error);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            break;

        case 'PUT':
            try {
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', async() => {
                    const imageBuffer = Buffer.concat(chunks);
                    await fs.writeFile(filePath, imageBuffer);
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('Created');
                });
            } catch (error) {
                console.error('Помилка при запису файлу:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
            break;

        case 'DELETE':
            try {
                await fs.unlink(filePath);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Deleted');
            } catch (error) {
                console.error('Помилка при видаленні файлу:', error);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            break;

        default:
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
    }
};

const server = http.createServer(requestListener);

// Запуск сервера на вказаних хості та порту
server.listen(options.port, options.host, () => {
    console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});