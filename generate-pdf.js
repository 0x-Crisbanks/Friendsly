const fs = require('fs');
const path = require('path');

// Función para generar HTML desde Markdown
function markdownToHTML(markdown) {
  // Conversión básica de Markdown a HTML
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Line breaks
    .replace(/\n/g, '<br>');

  return html;
}

// Leer el archivo Markdown
const markdownContent = fs.readFileSync('FriendsX_Production_Analysis.md', 'utf8');

// Convertir a HTML
const htmlContent = markdownToHTML(markdownContent);

// Template HTML completo
const fullHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FriendsX - Análisis de Producción</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            font-size: 2.5em;
            margin-bottom: 30px;
        }
        
        h2 {
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        
        h3 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.4em;
        }
        
        pre {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            overflow-x: auto;
            margin: 15px 0;
        }
        
        code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        ul {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        strong {
            color: #2c3e50;
            font-weight: 600;
        }
        
        .status-critical { color: #e74c3c; }
        .status-high { color: #f39c12; }
        .status-medium { color: #3498db; }
        .status-success { color: #27ae60; }
        
        .cost-table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        
        .cost-table th,
        .cost-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        .cost-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        .highlight-box {
            background: #e8f4fd;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            h1 { page-break-before: avoid; }
            h2, h3 { page-break-after: avoid; }
            pre { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${htmlContent}
    
    <div class="footer">
        <p><strong>FriendsX - Análisis de Completitud para Producción</strong></p>
        <p>Generado el: ${new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</p>
        <p>Versión del documento: 1.0</p>
    </div>
</body>
</html>
`;

// Guardar el archivo HTML
fs.writeFileSync('FriendsX_Production_Analysis.html', fullHTML);

console.log('✅ Archivo HTML generado: FriendsX_Production_Analysis.html');
console.log('📄 Para convertir a PDF:');
console.log('   1. Abre el archivo HTML en tu navegador');
console.log('   2. Presiona Ctrl+P (Cmd+P en Mac)');
console.log('   3. Selecciona "Guardar como PDF"');
console.log('   4. Ajusta los márgenes y configuración según prefieras');
console.log('');
console.log('🔧 Alternativa con herramientas:');
console.log('   - Puppeteer: npm install puppeteer');
console.log('   - wkhtmltopdf: apt-get install wkhtmltopdf');
console.log('   - Pandoc: pandoc file.md -o file.pdf');