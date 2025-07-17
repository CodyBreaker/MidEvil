<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Return 200 OK for preflight requests with no body
    http_response_code(200);
    exit;
}

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
}

//Get all games
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['roomCode'])) {
        $roomCode = $_GET['roomCode'];

        // Get the game by roomCode
        $stmt = $mysql->prepare("SELECT * FROM midevil_games WHERE room_code = ?");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();
        $game = $result->fetch_assoc();
        $stmt->close();

        if (!$game) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Game not found for roomCode '$roomCode'."
            ]);
            exit;
        }

        // Get players for that room
        $stmt = $mysql->prepare("SELECT id, name, color, is_ready FROM midevil_players WHERE room_code = ?");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();

        $players = [];
        while ($row = $result->fetch_assoc()) {
            $players[] = [
                "id" => (int) $row['id'],
                "name" => $row['name'],
                "color" => $row['color'],
                "is_ready" => (bool) $row['is_ready']
            ];
        }

        $stmt->close();

        echo json_encode([
            "success" => true,
            "players" => $players
        ]);
    } elseif (isset($_GET['id'])) {
        // Return all games
        $id = $_GET['id'];
        $stmt = $mysql->prepare("SELECT id, name, color, is_ready FROM midevil_players WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $player = $result->fetch_assoc();
        $stmt->close();

        $stmt = $mysql->prepare("SELECT * FROM midevil_die_actions WHERE player_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $dieActions = $result->fetch_assoc();
        $stmt->close();


        echo json_encode([
            "success" => true,
            "player" => $player,
            "dieActions" => $dieActions,
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "roomCode or id parameter is required."
        ]);
    }
}

// Update a game (PUT)
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Parse input data (URL-encoded form or JSON)
    parse_str(file_get_contents("php://input"), $putData);

    $playerId = $putData['id'] ?? null;  // must identify which player to update

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
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Player not found or no changes made."
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

//Delete a game if the request is DELETE
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            "success" => $input,
            "message" => "Room code is required."
        ]);
        $mysql->close();
        exit;
    }

    $stmt1 = $mysql->prepare("DELETE FROM midevil_players WHERE id = ?");
    $stmt1->bind_param("i", $id);
    $stmt1->execute();
    $stmt1->close();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Room code does not exist."
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Game deleted."
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
