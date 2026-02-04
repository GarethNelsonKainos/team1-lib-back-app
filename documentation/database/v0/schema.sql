-- Library Management System Database Schema

-- Table: authors
CREATE TABLE authors (
    author_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: genres
CREATE TABLE genres (
    genre_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: books
CREATE TABLE books (
    book_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_title VARCHAR(255) NOT NULL,
    isbn VARCHAR(13) UNIQUE,
    publication_year YEAR,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Table: book_authors (junction table)
CREATE TABLE book_authors (
    author_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    PRIMARY KEY (author_id, book_id),
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Table: book_genres (junction table)
CREATE TABLE book_genres (
    genre_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    PRIMARY KEY (genre_id, book_id),
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Table: status
CREATE TABLE status (
    status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: copies
CREATE TABLE copies (
    copy_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    copy_code VARCHAR(50) NOT NULL UNIQUE,
    book_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES status(status_id)
);

-- Table: members
CREATE TABLE members (
    member_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    member_code VARCHAR(50) NOT NULL UNIQUE,
    member_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Table: borrowings
CREATE TABLE borrowings (
    borrowing_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    copy_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    borrowed_at TIMESTAMP NOT NULL,
    due_date DATE NOT NULL,
    returned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (copy_id) REFERENCES copies(copy_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);

-- Indexes for better query performance
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_deleted_at ON books(deleted_at);
CREATE INDEX idx_copies_status ON copies(status_id);
CREATE INDEX idx_copies_book ON copies(book_id);
CREATE INDEX idx_borrowings_copy ON borrowings(copy_id);
CREATE INDEX idx_borrowings_member ON borrowings(member_id);
CREATE INDEX idx_borrowings_returned ON borrowings(returned_at);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_deleted_at ON members(deleted_at);

-- Insert common status values
INSERT INTO status (status_name) VALUES
    ('Available'),
    ('Borrowed'),
    ('Maintenance'),
    ('Lost'),
    ('Reserved');
