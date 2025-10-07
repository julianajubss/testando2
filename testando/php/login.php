<?php
// php/login.php
header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Credenciales inválidas.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Obtener y sanitizar datos del formulario
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        $response['message'] = 'Por favor, ingrese correo y contraseña.';
        echo json_encode($response);
        exit;
    }

    $db_file = '../db/datos_admin.db';

    try {
        // 2. Conexión a la base de datos SQLite
        $pdo = new PDO("sqlite:$db_file");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // 3. Buscar usuario por email
        $stmt = $pdo->prepare("SELECT email, password_hash FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // 4. Verificar la contraseña usando la función de hash
            if (password_verify($password, $user['password_hash'])) {
                
                // --- INICIO DE SESIÓN EXITOSO ---
                session_start();
                $_SESSION['is_logged_in'] = true;
                $_SESSION['user_email'] = $user['email'];

                $response['success'] = true;
                $response['message'] = 'Inicio de sesión exitoso.';
                $response['userName'] = $user['email'];
                // ---------------------------------

            } else {
                $response['message'] = 'Contraseña incorrecta.';
            }
        } else {
            $response['message'] = 'Correo electrónico no encontrado.';
        }

    } catch (PDOException $e) {
        // Error de conexión o consulta
        $response['message'] = 'Error interno del servidor.';
        // Para desarrollo: $response['debug'] = $e->getMessage();
    }
}

echo json_encode($response);
?>