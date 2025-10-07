<?php
// router.php

// 1. Define el prefijo del proyecto
$project_prefix = '/testando/';
$project_root = __DIR__ . $project_prefix; // C:\Users\USER\...\testando\

// 2. Obtiene la ruta solicitada por el navegador
$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// 3. Verifica si la URI empieza con nuestro prefijo
if (strpos($uri, $project_prefix) === 0) {
    
    // Quita el prefijo para obtener la ruta relativa al proyecto (/admin.html o /uploads/imagen.png)
    $file = substr($uri, strlen($project_prefix));

    // Si es una ruta vacía o solo la raíz del proyecto, sirve admin.html (o tu index principal)
    if (empty($file) || $file === 'admin.html' || $file === '/') {
        return false; // Deja que el servidor interno maneje admin.html
    }
    
    // Si el archivo solicitado existe dentro de la carpeta 'testando', sírvelo directamente
    if (file_exists($project_root . $file)) {
        // Devuelve false para que el servidor interno de PHP sirva el archivo estático
        return false;
    }
}

// 4. Si es una ruta que pasa por /php/products.php, déjalo pasar (PHP lo maneja)
// 5. Si no es un archivo estático conocido o no existe, deja que PHP maneje la petición (para scripts PHP)
return false; 
?>