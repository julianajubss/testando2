<?php
// php/products.php

session_start();
header('Content-Type: application/json');

// Ruta al archivo SQLite
const DB_FILE = '../db/datos_admin.db';

// --- Función de subida de archivos ---
function handle_file_uploads() {
    $uploaded_files = [];
    $physical_upload_dir = '../../uploads/'; 
    $public_url_dir = '/uploads/'; // usamos ruta absoluta desde raíz

    if (!is_dir($physical_upload_dir)) {
        mkdir($physical_upload_dir, 0777, true);
    }

    if (!empty($_FILES['photos']['name'][0]) && is_array($_FILES['photos']['name'])) {
        $file_count = count($_FILES['photos']['name']);
        for ($i = 0; $i < $file_count; $i++) {
            $file = [
                'name' => $_FILES['photos']['name'][$i],
                'tmp_name' => $_FILES['photos']['tmp_name'][$i],
                'error' => $_FILES['photos']['error'][$i],
            ];
            if ($file['error'] === UPLOAD_ERR_OK) {
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = 'prod_' . uniqid() . '_' . time() . '.' . $ext;
                $destination_path = $physical_upload_dir . $filename;

                if (move_uploaded_file($file['tmp_name'], $destination_path)) {
                    $uploaded_files[] = $public_url_dir . $filename; // ej: /uploads/abc.png
                }
            }
        }
    }
    return $uploaded_files;
}

// Conexión a la base de datos
try {
    $pdo = new PDO("sqlite:" . DB_FILE);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error crítico de DB: ' . $e->getMessage()]);
    exit;
}

// Acción
$action = $_POST['action'] ?? $_GET['action'] ?? '';
if (empty($action)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción no especificada.']);
    exit;
}

// Función para verificar login solo para acciones privadas
function require_login() {
    if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado. Se requiere autenticación.']);
        exit;
    }
}

$response = ['success' => false, 'message' => 'Acción no reconocida.'];

try {
    switch ($action) {
        // -------- PUBLICAS --------
        case 'list':
            $stmt = $pdo->query("SELECT id, title, price, short_description, colors, image_url FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response = ['success' => true, 'products' => $products];
            break;

        case 'get':
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                http_response_code(400);
                $response['message'] = 'ID inválido.';
                break;
            }
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($product) {
                $response = ['success' => true, 'product' => $product];
            } else {
                http_response_code(404);
                $response['message'] = 'Producto no encontrado.';
            }
            break;

        // -------- PRIVADAS (requieren login) --------
        case 'create':
            require_login();
            $title = filter_input(INPUT_POST, 'title', FILTER_SANITIZE_SPECIAL_CHARS);
            $price = filter_input(INPUT_POST, 'price', FILTER_VALIDATE_FLOAT);
            $short_description = filter_input(INPUT_POST, 'short_description', FILTER_SANITIZE_SPECIAL_CHARS);
            $description = filter_input(INPUT_POST, 'description', FILTER_SANITIZE_SPECIAL_CHARS);
            $colors = filter_input(INPUT_POST, 'colors', FILTER_SANITIZE_SPECIAL_CHARS);

            if (!$title || $price === false || $price <= 0) {
                http_response_code(400);
                $response['message'] = 'Datos inválidos (revisar título y precio).';
                break;
            }

            $uploaded_files = handle_file_uploads();
            $image_url = implode(',', $uploaded_files);
            if (empty($image_url)) {
                $initials = strtoupper(substr($title, 0, 2));
                $image_url = 'https://placehold.co/60x60/' . substr(md5(rand()), 0, 6) . '/FFFFFF?text=' . $initials;
            }

            $stmt = $pdo->prepare("INSERT INTO products (title, price, short_description, description, colors, image_url) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $price, $short_description, $description, $colors, $image_url]);
            $response = ['success' => true, 'message' => 'Producto creado exitosamente.', 'id' => $pdo->lastInsertId()];
            break;

        case 'update':
            require_login();
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            $title = filter_input(INPUT_POST, 'title', FILTER_SANITIZE_SPECIAL_CHARS);
            $price = filter_input(INPUT_POST, 'price', FILTER_VALIDATE_FLOAT);
            $short_description = filter_input(INPUT_POST, 'short_description', FILTER_SANITIZE_SPECIAL_CHARS);
            $description = filter_input(INPUT_POST, 'description', FILTER_SANITIZE_SPECIAL_CHARS);
            $colors = filter_input(INPUT_POST, 'colors', FILTER_SANITIZE_SPECIAL_CHARS);

            if (!$id || !$title || $price === false || $price <= 0) {
                http_response_code(400);
                $response['message'] = 'Datos inválidos para actualización.';
                break;
            }

            // Traer imágenes actuales
            $stmt_fetch = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
            $stmt_fetch->execute([$id]);
            $old = $stmt_fetch->fetch(PDO::FETCH_ASSOC);
            $existing_images = $old && $old['image_url'] ? explode(',', $old['image_url']) : [];

            // Manejo de imágenes a borrar
            if (!empty($_POST['delete_images'])) {
                $toDelete = json_decode($_POST['delete_images'], true);
                if (is_array($toDelete)) {
                    foreach ($toDelete as $url) {
                        $existing_images = array_filter($existing_images, fn($img) => $img !== $url);
                        if ($url && strpos($url, 'http') === false) {
                            $relative = ltrim($url, '/');
                            $path = '../../' . $relative;
                            if (file_exists($path)) unlink($path);
                        }
                    }
                }
            }

            // Manejo de nuevas subidas
            $uploaded_files = handle_file_uploads();
            $final_images = array_merge($existing_images, $uploaded_files);
            $new_image_url = implode(',', $final_images);

            $stmt = $pdo->prepare("UPDATE products SET title = ?, price = ?, short_description = ?, description = ?, colors = ?, image_url = ? WHERE id = ?");
            $stmt->execute([$title, $price, $short_description, $description, $colors, $new_image_url, $id]);

            $response = ['success' => true, 'message' => 'Producto actualizado.'];
            break;

        case 'delete':
            require_login();
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                http_response_code(400);
                $response['message'] = 'ID inválido.';
                break;
            }

            $stmt_fetch = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
            $stmt_fetch->execute([$id]);
            $product = $stmt_fetch->fetch(PDO::FETCH_ASSOC);

            if ($product && !empty($product['image_url'])) {
                $urls = explode(',', $product['image_url']);
                foreach ($urls as $url) {
                    if ($url && strpos($url, 'http') === false) {
                        $relative_path = ltrim($url, '/'); 
                        $path = '../../' . $relative_path;
                        if (file_exists($path)) unlink($path);
                    }
                }
            }

            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $response = ['success' => true, 'message' => 'Producto eliminado.'];
            break;

        default:
            http_response_code(400);
            $response['message'] = 'Acción desconocida.';
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Error interno: ' . $e->getMessage()];
}

echo json_encode($response);
