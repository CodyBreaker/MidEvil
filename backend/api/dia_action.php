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
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $playerId = $data['playerId'] ?? null;
    $mode = $data['mode'] ?? null;
    $ownPawn = $data['ownPawn'] ?? null;
    $targetPawn = $data['targetPawn'] ?? null;  // optional
    $dieValue = $data['dieValue'] ?? null;

    // Validate required fields
    if (!$playerId || !$mode || !$ownPawn || $dieValue === null) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "playerId, mode, ownPawn, and dieValue are required."
        ]);
        $mysql->close();
        exit;
    }

    // Prepare query
    $stmt = $mysql->prepare("
        INSERT INTO midevil_die_actions (player_id, mode, own_pawn, target_pawn, die_value)
        VALUES (?, ?, ?, ?, ?)
    ");

    // Bind null properly if targetPawn is missing
    if ($targetPawn === null) {
        $stmt->bind_param("isiii", $playerId, $mode, $ownPawn, $targetPawn, $dieValue);
    } else {
        $targetPawn = (int)$targetPawn;
        $stmt->bind_param("isiii", $playerId, $mode, $ownPawn, $targetPawn, $dieValue);
    }

    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Failed to add die action."
        ]);
        $stmt->close();
        $mysql->close();
        exit;
    }

    $actionId = $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Die action added.",
        "action" => [
            "id" => $actionId,
            "player_id" => (int)$playerId,
            "mode" => $mode,
            "own_pawn" => (int)$ownPawn,
            "target_pawn" => $targetPawn !== null ? (int)$targetPawn : null,
            "die_value" => (int)$dieValue
        ]
    ]);
}

//Get all games
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['playerId'])) {
        $id = $_GET['playerId'];

        $stmt = $mysql->prepare("SELECT * FROM midevil_die_actions WHERE player_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $dieActions = [];

        while ($row = $result->fetch_assoc()) {
            $dieActions[] = $row;
        }

        $stmt->close();


        echo json_encode([
            "success" => true,
            "dieActions" => $dieActions,
        ]);
    } elseif (isset($_GET['id'])) {
        $id = $_GET['id'];
        $stmt = $mysql->prepare("SELECT * FROM midevil_die_actions WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $dieAction = $result->fetch_assoc();
        $stmt->close();


        echo json_encode([
            "success" => true,
            "dieAction" => $dieAction,
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
    // Parse JSON or URL-encoded input
    $input = file_get_contents("php://input");
    $putData = json_decode($input, true);

    if (!$putData) {
        parse_str($input, $putData);
    }

    $actionId = $putData['id'] ?? null;

    if (!$actionId) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Die action ID is required."
        ]);
        $mysql->close();
        exit;
    }

    // Optional fields to update
    $fields = [];
    $types = "";
    $values = [];

    if (isset($putData['playerId'])) {
        $fields[] = "player_id = ?";
        $types .= "i";
        $values[] = (int)$putData['playerId'];
    }

    if (isset($putData['mode'])) {
        $fields[] = "mode = ?";
        $types .= "s";
        $values[] = $putData['mode'];
    }

    if (isset($putData['ownPawn'])) {
        $fields[] = "own_pawn = ?";
        $types .= "i";
        $values[] = (int)$putData['ownPawn'];
    }

    if (array_key_exists('targetPawn', $putData)) {
        $fields[] = "target_pawn = ?";
        $types .= "i";
        $values[] = is_null($putData['targetPawn']) ? null : (int)$putData['targetPawn'];
    }

    if (isset($putData['dieValue'])) {
        $fields[] = "die_value = ?";
        $types .= "i";
        $values[] = (int)$putData['dieValue'];
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

    $query = "UPDATE midevil_die_actions SET " . implode(", ", $fields) . " WHERE id = ?";
    $types .= "i";
    $values[] = (int)$actionId;

    $stmt = $mysql->prepare($query);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Die action not found or no changes made."
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Die action updated.",
            "actionId" => $actionId
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

    $stmt1 = $mysql->prepare("DELETE FROM midevil_die_actions WHERE id = ?");
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
