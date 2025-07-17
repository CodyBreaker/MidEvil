CREATE TABLE IF NOT EXISTS midevil_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL UNIQUE,
    turn INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS midevil_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    is_ready BOOLEAN DEFAULT FALSE,
);

CREATE TABLE IF NOT EXISTS midevil_pawns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pawn_name VARCHAR(255) NOT NULL,
    owner_id INT NOT NULL,
    position INT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES midevil_players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS midevil_pawn_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pawn_id INT NOT NULL,
    state VARCHAR(50) NOT NULL,
    counter INT NOT NULL,
    FOREIGN KEY (pawn_id) REFERENCES midevil_pawns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS midevil_die_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    own_pawn INT NOT NULL,
    target_pawn INT,
    die_value INT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES midevil_players(id) ON DELETE CASCADE,
    FOREIGN KEY (own_pawn) REFERENCES midevil_pawns(id) ON DELETE CASCADE,
    FOREIGN KEY (target_pawn) REFERENCES midevil_pawns(id) ON DELETE CASCADE
);