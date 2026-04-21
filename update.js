const fs = require('fs');

function replaceInFile(path, search, replaceStr) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(search, replaceStr);
    fs.writeFileSync(path, content, 'utf8');
}

const navReplace = '<li><a href="index.html">Головна</a></li>\n                    <li><a href="pages/about.html">Про мене</a></li>\n                    <li><a href="pages/contact.html">Контакти</a></li>\n                    <li><a href="pages/catalog.html">Каталог</a></li>\n                    <li><a href="pages/favorites.html">Обране</a></li>';
replaceInFile('index.html', /<li><a href="index.html">Головна<\/a><\/li>\s*<li><a href="pages\/about.html">Про мене<\/a><\/li>\s*<li><a href="pages\/contact.html">Контакти<\/a><\/li>/g, navReplace);

const navReplacePages = '<li><a href="../index.html">Головна</a></li>\n                    <li><a href="about.html">Про мене</a></li>\n                    <li><a href="contact.html\">Контакти</a></li>\n                    <li><a href="catalog.html">Каталог</a></li>\n                    <li><a href="favorites.html">Обране</a></li>';
replaceInFile('pages/about.html', /<li><a href="\.\.\/index.html">Головна<\/a><\/li>\s*<li><a href="about.html">Про мене<\/a><\/li>\s*<li><a href="contact.html">Контакти<\/a><\/li>/g, navReplacePages);
replaceInFile('pages/contact.html', /<li><a href="\.\.\/index.html">Головна<\/a><\/li>\s*<li><a href="about.html">Про мене<\/a><\/li>\s*<li><a href="contact.html">Контакти<\/a><\/li>/g, navReplacePages);

function removeControls(path) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/<div class="controls-bar">[\s\S]*?<\/select>\s*<\/div>/, '');
    content = content.replace('<div id="services-container"></div>', '<div style="text-align:center; margin-top:30px;"><a href="pages/catalog.html" class="btn" style="padding: 12px 30px; font-size: 1.1rem; text-decoration: none; background: #007bff; color: white; border-radius: 4px;">Перейти до повного каталогу</a></div>\n                <div id="services-container"></div>');
    fs.writeFileSync(path, content, 'utf8');
}
removeControls('index.html');
