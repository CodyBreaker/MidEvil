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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['roomCode'])) {
        $roomCode = $_GET['roomCode'];
        // Fetch game
        $stmt = $mysql->prepare("SELECT * FROM midevil_games WHERE room_code = ?");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();
        $game = $result->fetch_assoc();
        $stmt->close();

        // Fetch players
        $stmt = $mysql->prepare("SELECT * FROM midevil_players WHERE room_code = ?");
        $stmt->bind_param("s", $roomCode);
        $stmt->execute();
        $result = $stmt->get_result();
        $players = [];
        $playerIds = []; // for die actions
        while ($row = $result->fetch_assoc()) {
            $players[] = $row;
            $playerIds[] = $row['id'];
        }
        $stmt->close();

        // Fetch pawns
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
        $pawnIds = []; // for pawn states
        while ($row = $result->fetch_assoc()) {
            $pawns[] = [
                "id" => (int) $row['pawn_id'],
                "pawn_name" => $row['pawn_name'],
                "position" => (int) $row['position'],
                "owner_id" => (int) $row['owner_id']
            ];
            $pawnIds[] = $row['pawn_id'];
        }
        $stmt->close();


        $pawnStates = [];
        if (!empty($pawnIds)) {
            $inClause = implode(',', array_fill(0, count($pawnIds), '?'));
            $types = str_repeat('i', count($pawnIds));
            $stmt = $mysql->prepare("SELECT * FROM midevil_pawn_states WHERE pawn_id IN ($inClause)");
            $stmt->bind_param($types, ...$pawnIds);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $pawnStates[] = $row;
            }
            $stmt->close();
        }

        // Fetch die actions
        $dieActions = [];
        if (!empty($playerIds)) {
            $inClause = implode(',', array_fill(0, count($playerIds), '?'));
            $types = str_repeat('i', count($playerIds));
            $stmt = $mysql->prepare("SELECT * FROM midevil_die_actions WHERE player_id IN ($inClause)");
            $stmt->bind_param($types, ...$playerIds);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $dieActions[] = $row;
            }
            $stmt->close();
        }

        echo json_encode([
            "success" => true,
            "game" => $game,
            "players" => $players,
            "pawns" => $pawns,
            "pawn_states" => $pawnStates,
            "die_actions" => $dieActions
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

//Method not allowed or missing parameters
else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed or missing parameters."
    ]);
}

$mysql->close();
