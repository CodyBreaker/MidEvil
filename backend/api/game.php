<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

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
    do {
        $newRoomCode = strtoupper(substr(str_shuffle(str_repeat("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)), 0, 4));
        $stmt = $mysql->prepare("SELECT room_code FROM midevil_games WHERE room_code = ?");
        $stmt->bind_param("s", $newRoomCode);
        $stmt->execute();
        $stmt->store_result();
    } while ($stmt->num_rows > 0);
    $stmt->close();


    $stmt = $mysql->prepare("INSERT INTO midevil_games (room_code) VALUES (?)");
    $stmt->bind_param("s", $newRoomCode);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Failed to create game."
        ]);
        $stmt->close();
        $mysql->close();
        exit;
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Game created.",
        "newRoomCode" => $newRoomCode,
    ]);
}

//Get all games
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['roomCode'])) {
        $roomCode = $_GET['roomCode'];
        $stmt = $mysql->prepare("SELECT * FROM midevil_games WHERE room_code = ?");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();
        $game = $result->fetch_assoc();

        $stmt = $mysql->prepare("SELECT * FROM midevil_players WHERE room_code = ?");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();

        $players = [];

        while ($row = $result->fetch_assoc()) {
            $players[] = $row;
        }

        $stmt->close();

        echo json_encode([
            "success" => true,
            "game" => $game,
            "players" => $players
        ]);
    } else {
        $stmt = $mysql->prepare("SELECT * FROM midevil_games");
        $stmt->execute();
        $result = $stmt->get_result();
        $games = [];

        while ($row = $result->fetch_assoc()) {
            $games[] = $row;
        }

        $stmt->close();

        echo json_encode([
            "success" => true,
            "games" => $games
        ]);
    }
}

// Update a game (PUT)
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    parse_str(file_get_contents("php://input"), $putData);
    $roomCode = $putData['roomCode'] ?? null;

    if (!$roomCode) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "roomCode is required."
        ]);
        $mysql->close();
        exit;
    }

    // Optional fields
    $turn = isset($putData['turn']) ? intval($putData['turn']) : null;

    // Build SET clause dynamically
    $fields = [];
    $types = "";
    $values = [];

    if ($turn !== null) {
        $fields[] = "turn = ?";
        $types .= "i";
        $values[] = $turn;
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

    // Add roomCode to WHERE clause
    $query = "UPDATE midevil_games SET " . implode(", ", $fields) . " WHERE room_code = ?";
    $types .= "s";
    $values[] = $roomCode;

    $stmt = $mysql->prepare($query);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Room code not found or no changes made."
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Game updated.",
            "roomCode" => $roomCode
        ]);
    }

    $stmt->close();
}

//Delete a game if the request is DELETE
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $roomCode = $data['roomCode'] ?? null;

    if (!$roomCode) {
        http_response_code(400);
        echo json_encode([
            "success" => $input,
            "message" => "Room code is required."
        ]);
        $mysql->close();
        exit;
    }

    $stmt1 = $mysql->prepare("DELETE FROM midevil_players WHERE room_code = ?");
    $stmt1->bind_param("s", $roomCode);
    $stmt1->execute();
    $stmt1->close();

    $stmt = $mysql->prepare("DELETE FROM midevil_games WHERE room_code = ?");
    $stmt->bind_param("s", $roomCode);
    $stmt->execute();

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
