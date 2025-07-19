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

include "../../dbh.php";

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

    $pawnName = $data['pawnName'] ?? null;
    $ownerId = $data['ownerId'] ?? null;
    $position = $data['position'] ?? null;

    if (!$pawnName || !$ownerId || $position === null) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "pawnName, ownerId, and position are required."
        ]);
        $mysql->close();
        exit;
    }

    $stmt = $mysql->prepare("
        INSERT INTO midevil_pawns (pawn_name, owner_id, position)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("sii", $pawnName, $ownerId, $position);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Failed to add pawn."
        ]);
        $stmt->close();
        $mysql->close();
        exit;
    }

    $pawnId = $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Pawn added.",
        "pawn" => [
            "id" => $pawnId,
            "pawn_name" => $pawnName,
            "owner_id" => $ownerId,
            "position" => $position
        ]
    ]);
}


//Get all games
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['roomCode'])) {
        $roomCode = $_GET['roomCode'] ?? null;

        if (!$roomCode) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "roomCode is required."
            ]);
            exit;
        }

        // Check if game exists (optional safeguard)
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

        // Get pawns for the room
        $stmt = $mysql->prepare("
    SELECT 
        p.id AS pawn_id,
        p.pawn_name,
        p.position,
        p.owner_id,
        pl.name AS owner_name,
        pl.color AS owner_color,
        pl.is_ready
    FROM midevil_pawns p
    JOIN midevil_players pl ON p.owner_id = pl.id
    WHERE pl.room_code = ?
");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();

        $pawns = [];
        while ($row = $result->fetch_assoc()) {
            $pawns[] = [
                "id" => (int) $row['pawn_id'],
                "pawn_name" => $row['pawn_name'],
                "position" => (int) $row['position'],
                "owner_id" => (int) $row['owner_id']
            ];
        }

        $stmt->close();

        echo json_encode([
            "success" => true,
            "roomCode" => $roomCode,
            "pawns" => $pawns
        ]);
    } elseif (isset($_GET['playerId'])) {
        $playerId = $_GET['playerId'];

        // 1. Fetch all pawns owned by the player
        $stmt = $mysql->prepare("SELECT * FROM midevil_pawns WHERE owner_id = ?");
        $stmt->bind_param("i", $playerId);
        $stmt->execute();
        $result = $stmt->get_result();

        $pawns = [];

        while ($pawn = $result->fetch_assoc()) {
            $pawnId = $pawn['id'];

            // 2. For each pawn, fetch its states
            $stateStmt = $mysql->prepare("SELECT state, counter FROM midevil_pawn_states WHERE pawn_id = ?");
            $stateStmt->bind_param("i", $pawnId);
            $stateStmt->execute();
            $stateResult = $stateStmt->get_result();

            $states = [];
            while ($row = $stateResult->fetch_assoc()) {
                $states[] = $row;
            }
            $stateStmt->close();

            // 3. Add the states into the pawn object
            $pawn['state'] = $states;
            $pawns[] = $pawn;
        }

        $stmt->close();

        echo json_encode([
            "success" => true,
            "pawns" => $pawns
        ]);
    } elseif (isset($_GET['id'])) {
        // Return all games
        $id = $_GET['id'];
        $stmt = $mysql->prepare("SELECT * FROM midevil_pawns WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $pawn = $result->fetch_assoc();
        $stmt->close();

        $stmt = $mysql->prepare("SELECT * FROM midevil_pawn_states WHERE pawn_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $states = [];

        while ($row = $result->fetch_assoc()) {
            $states[] = $row;
        }

        $stmt->close();




        echo json_encode([
            "success" => true,
            "player" => $pawn,
            "dieActions" => $states,
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
    // Parse input data (JSON or URL-encoded)
    $input = file_get_contents("php://input");

    $putData = json_decode($input, true);
    if (!$putData) {
        parse_str($input, $putData); // fallback to form-encoded
    }

    $pawnId = $putData['id'] ?? null;  // required

    if (!$pawnId) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Pawn ID is required."
        ]);
        $mysql->close();
        exit;
    }

    // Optional fields to update
    $fields = [];
    $types = "";
    $values = [];

    if (isset($putData['pawn_name'])) {
        $fields[] = "pawn_name = ?";
        $types .= "s";
        $values[] = $putData['pawn_name'];
    }

    if (isset($putData['owner_id'])) {
        $fields[] = "owner_id = ?";
        $types .= "i";
        $values[] = (int) $putData['owner_id'];
    }

    if (isset($putData['position'])) {
        $fields[] = "position = ?";
        $types .= "i";
        $values[] = (int) $putData['position'];
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

    // Add WHERE clause for pawn ID
    $query = "UPDATE midevil_pawns SET " . implode(", ", $fields) . " WHERE id = ?";
    $types .= "i";
    $values[] = (int) $pawnId;

    $stmt = $mysql->prepare($query);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare statement."
        ]);
        $mysql->close();
        exit;
    }

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
            "message" => "Pawn updated.",
            "pawnId" => $pawnId
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

    $stmt1 = $mysql->prepare("DELETE FROM midevil_pawns WHERE id = ?");
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
