const http = require('http');
const { Command } = require('commander');
const fs = require('fs');

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
const requestListener = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
};

const server = http.createServer(requestListener);

// Запуск сервера на вказаних хості та порту
server.listen(options.port, options.host, () => {
    console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});