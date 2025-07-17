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

// POST — Create a new pawn state
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $pawnId = $data['pawnId'] ?? null;
    $state = $data['state'] ?? null;
    $counter = $data['counter'] ?? null;

    if (!$pawnId || !$state || $counter === null) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "pawnId, state, and counter are required."
        ]);
        $mysql->close();
        exit;
    }

    $stmt = $mysql->prepare("
        INSERT INTO midevil_pawn_states (pawn_id, state, counter)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("isi", $pawnId, $state, $counter);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Failed to insert pawn state."
        ]);
    } else {
        $stateId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Pawn state added.",
            "state" => [
                "id" => $stateId,
                "pawn_id" => (int)$pawnId,
                "state" => $state,
                "counter" => (int)$counter
            ]
        ]);
    }

    $stmt->close();
}

// GET — Get by state ID or pawn ID
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $mysql->prepare("SELECT * FROM midevil_pawn_states WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $state = $result->fetch_assoc();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "state" => $state
        ]);

    } elseif (isset($_GET['pawnId'])) {
        $pawnId = (int)$_GET['pawnId'];
        $stmt = $mysql->prepare("SELECT * FROM midevil_pawn_states WHERE pawn_id = ?");
        $stmt->bind_param("i", $pawnId);
        $stmt->execute();
        $result = $stmt->get_result();

        $states = [];
        while ($row = $result->fetch_assoc()) {
            $states[] = $row;
        }
        $stmt->close();

        echo json_encode([
            "success" => true,
            "states" => $states
        ]);

    } else {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Missing id or pawnId parameter."
        ]);
    }
}

// PUT — Update a state
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = file_get_contents("php://input");
    $putData = json_decode($input, true);

    if (!$putData) {
        parse_str($input, $putData);
    }

    $stateId = $putData['id'] ?? null;

    if (!$stateId) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "State ID is required."
        ]);
        $mysql->close();
        exit;
    }

    $fields = [];
    $types = "";
    $values = [];

    if (isset($putData['pawnId'])) {
        $fields[] = "pawn_id = ?";
        $types .= "i";
        $values[] = (int)$putData['pawnId'];
    }

    if (isset($putData['state'])) {
        $fields[] = "state = ?";
        $types .= "s";
        $values[] = $putData['state'];
    }

    if (isset($putData['counter'])) {
        $fields[] = "counter = ?";
        $types .= "i";
        $values[] = (int)$putData['counter'];
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

    $query = "UPDATE midevil_pawn_states SET " . implode(", ", $fields) . " WHERE id = ?";
    $types .= "i";
    $values[] = (int)$stateId;

    $stmt = $mysql->prepare($query);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "State not found or no changes made."
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Pawn state updated.",
            "id" => $stateId
        ]);
    }

    $stmt->close();
}

// DELETE — Remove a state by ID
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    $id = $data['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "ID is required for deletion."
        ]);
        $mysql->close();
        exit;
    }

    $stmt = $mysql->prepare("DELETE FROM midevil_pawn_states WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Pawn state not found."
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Pawn state deleted."
        ]);
    }

    $stmt->close();
}

// Fallback — Method not allowed
else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
}

$mysql->close();
