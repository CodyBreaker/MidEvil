<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Return 200 OK for preflight requests with no body
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

include "../dbh.php";

$mysql = mysqli_connect($servername, $dbuser, $dbpassword, $dbname);
if (!$mysql) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed."
    ]);
    exit;
}

//Create a new game if the request is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $roomCode = $data['roomCode'] ?? null;
    $name = $data['name'] ?? null;
    $color = $data['color'] ?? null;

    if (!$roomCode || !$name) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "roomCode and name are required."
        ]);
        $mysql->close();
        exit;
    }

    $roomCheck = $mysql->prepare("SELECT id FROM midevil_games WHERE room_code = ?");
    $roomCheck->bind_param("s", $roomCode);
    $roomCheck->execute();
    $roomCheck->store_result();

    if ($roomCheck->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Room does not exist."
        ]);
        $roomCheck->close();
        $mysql->close();
        exit;
    }
    $roomCheck->close();

    // Check if the room has fewer than 12 players
    $playerCountStmt = $mysql->prepare("SELECT COUNT(*) FROM midevil_players WHERE room_code = ?");
    $playerCountStmt->bind_param("s", $roomCode);
    $playerCountStmt->execute();
    $playerCountStmt->bind_result($playerCount);
    $playerCountStmt->fetch();
    $playerCountStmt->close();

    if ($playerCount >= 12) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Room already has 12 players."
        ]);
        $mysql->close();
        exit;
    }

    // Check for duplicate name (case-insensitive) in the same room
    $nameCheckStmt = $mysql->prepare("
        SELECT id FROM midevil_players 
        WHERE room_code = ? AND LOWER(name) = LOWER(?)
    ");
    $nameCheckStmt->bind_param("ss", $roomCode, $name);
    $nameCheckStmt->execute();
    $nameCheckStmt->store_result();

    if ($nameCheckStmt->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "A player with that name already exists in the room."
        ]);
        $nameCheckStmt->close();
        $mysql->close();
        exit;
    }
    $nameCheckStmt->close();

    $stmt = $mysql->prepare("
        INSERT INTO midevil_players (room_code, name, color)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("sss", $roomCode, $name, $color);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Failed to add player."
        ]);
        $stmt->close();
        $mysql->close();
        exit;
    }

    $playerId = $stmt->insert_id;
    $stmt->close();

    $pawnStmt = $mysql->prepare("
        INSERT INTO midevil_pawns (pawn_name, owner_id, position)
        VALUES (?, ?, ?)
    ");

    for ($i = 1; $i <= 4; $i++) {
        $pawnName = (string)$i;
        $position = -1;
        $pawnStmt->bind_param("sii", $pawnName, $playerId, $position);
        $pawnStmt->execute();
    }

    $pawnStmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Player added.",
        "player" => [
            "id" => $playerId,
            "room_code" => $roomCode,
            "name" => $name,
            "color" => $color,
            "is_ready" => false
        ]
    ]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Parse input data (URL-encoded form or JSON)
    $input = file_get_contents("php://input");
    $putData = json_decode($input, true);

    $playerId = $putData['playerId'] ?? null;  // must identify which player to update

    if (!$playerId) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Player id is required."
        ]);
        $mysql->close();
        exit;
    }

    // Optional fields to update
    $fields = [];
    $types = "";
    $values = [];

    if (isset($putData['name'])) {
        $fields[] = "name = ?";
        $types .= "s";
        $values[] = $putData['name'];
    }

    if (isset($putData['color'])) {
        $fields[] = "color = ?";
        $types .= "s";
        $values[] = $putData['color'];
    }

    if (isset($putData['is_ready'])) {
        $fields[] = "is_ready = ?";
        $types .= "i";
        $values[] = (int) filter_var($putData['is_ready'], FILTER_VALIDATE_BOOLEAN);
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "No valid fields to update."
        ]);
        $mysql->close();
        exit;
    }

    // Add WHERE clause for player id
    $query = "UPDATE midevil_players SET " . implode(", ", $fields) . " WHERE id = ?";
    $types .= "i";
    $values[] = $playerId;

    $stmt = $mysql->prepare($query);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        echo json_encode([
            "success" => true,
            "message" => "No valid fields to update."
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Player updated.",
            "playerId" => $playerId
        ]);
    }

    $stmt->close();
}

//Method not allowed or missing parameters
else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed or missing parameters."
    ]);
}

$mysql->close();
