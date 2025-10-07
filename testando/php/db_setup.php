<?php
// php/db_setup.php
$db_file = '../db/datos_admin.db';

// 1. Asegurar que la carpeta 'db' exista
if (!is_dir('../db')) {
    mkdir('../db', 0777, true);
}

try {
    // 2. Conexión/Creación del archivo SQLite
    $pdo = new PDO("sqlite:$db_file");
    // Establece el modo de error de PDO a excepciones (para manejo de errores)
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Base de datos '$db_file' conectada/creada exitosamente.<br>";

    // 3. Crear la tabla de usuarios si no existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );
    ");

    echo "Tabla 'users' verificada/creada exitosamente.<br>";

    // *****************************************************************
    // *** NUEVO: CREACIÓN DE LA TABLA 'PRODUCTS' ***
    // *****************************************************************
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            price REAL NOT NULL,
            short_description TEXT,
            description TEXT,
            colors TEXT, 
            image_url TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    echo "Tabla 'products' verificada/creada exitosamente.<br>";
    // *****************************************************************
    
    // 4. Insertar el único usuario administrador (¡CAMBIA ESTAS CREDENCIALES!)
    $admin_email = 'admin@tumarca.com';
    $admin_password_raw = 'miclavesecreta123';
    
    // NUNCA guardes la contraseña en texto plano. Usa password_hash().
    $admin_password_hash = password_hash($admin_password_raw, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)");
    $stmt->execute([$admin_email, $admin_password_hash]);

    if ($stmt->rowCount() > 0) {
        echo "Usuario Admin ($admin_email) insertado exitosamente.<br>";
    } else {
        echo "Usuario Admin ($admin_email) ya existía (ignorando la inserción).<br>";
    }

} catch (PDOException $e) {
    echo "Error de Base de Datos: " . $e->getMessage();
}
?>