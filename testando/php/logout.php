<?php
// 1. Inicia la sesión. Esto es necesario para acceder a la sesión actual.
session_start();

// 2. Destruye todas las variables de sesión registradas.
$_SESSION = array();

// 3. Destruye la cookie de sesión (la más importante para la seguridad).
// Si se utiliza la cookie de sesión, se debe borrar.
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 4. Finalmente, destruye la sesión del lado del servidor.
session_destroy();

// 5. Devuelve una respuesta JSON al frontend (JavaScript) para confirmar el cierre.
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Sesión cerrada.']);
exit;
?>