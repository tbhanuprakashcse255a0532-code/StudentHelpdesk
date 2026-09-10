-- Run in an EMPTY database selected by the mysql client. Does not create accounts.
CREATE TABLE admins (
 id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
 password VARCHAR(255) NULL, password_hash VARCHAR(255) NULL
);
CREATE TABLE students (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) NOT NULL UNIQUE,
 password VARCHAR(255) NULL, password_hash VARCHAR(255) NULL,
 branch VARCHAR(100), pin_number VARCHAR(50)
);
CREATE TABLE events (
 id INT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(100), name VARCHAR(255), info TEXT,
 date VARCHAR(100), venue VARCHAR(255), duration VARCHAR(100), time VARCHAR(100),
 fee VARCHAR(100), last_date VARCHAR(100), mode VARCHAR(100), amount VARCHAR(100),
 eligibility TEXT, registration_link VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE qa (
 id INT AUTO_INCREMENT PRIMARY KEY, question TEXT, answer TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE notices (
 id INT AUTO_INCREMENT PRIMARY KEY, notice_text TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pdf_documents (
 id INT AUTO_INCREMENT PRIMARY KEY, section_type VARCHAR(50), section_id INT,
 title VARCHAR(255), file_name VARCHAR(255), file_path VARCHAR(500), extracted_text LONGTEXT,
 uploaded_by INT, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_document_section(section_type,section_id)
);
CREATE TABLE event_registrations (
 id INT AUTO_INCREMENT PRIMARY KEY, event_id INT NOT NULL, student_id INT NOT NULL,
 student_name VARCHAR(255), branch VARCHAR(100), pin_number VARCHAR(50), event_type VARCHAR(100),
 registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_event_student UNIQUE(event_id,student_id)
);
CREATE TABLE auth_sessions (
 token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL,
 role ENUM('admin','student') NOT NULL, expires_at DATETIME NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_auth_sessions_expiry(expires_at)
);
CREATE TABLE chat_history (
 id INT AUTO_INCREMENT PRIMARY KEY, student_id INT, message TEXT, sender VARCHAR(20),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

