-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    destacado BOOLEAN DEFAULT FALSE,
    fecha DATE NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de usuarios (opcional, para gestionar carritos por usuario)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de carrito
CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    usuario_id INT,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, categoria, precio, destacado, fecha, stock, imagen) VALUES
('Camiseta Blanca', 'ropa', 35000, TRUE, '2025-05-20', 10, 'https://plus.unsplash.com/premium_photo-1690406382707-16d9cc7a83d5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fENhbWlzZXRhJTIwQmxhbmNhfGVufDB8fDB8fHww'),
('Collar Dorado', 'collares', 45000, FALSE, '2025-04-15', 5, 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y29sbGFyfGVufDB8fDB8fHww'),
('Chaqueta Negra', 'ropa', 120000, TRUE, '2025-06-01', 2, 'https://images.unsplash.com/photo-1727515546577-f7d82a47b51d?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Collar Plateado', 'collares', 40000, FALSE, '2025-05-10', 0, 'https://images.unsplash.com/photo-1679534591026-df73293be418?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Pantalón Azul', 'ropa', 65000, FALSE, '2025-05-25', 8, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=60'),
('Collar Perlas', 'collares', 85000, TRUE, '2025-06-05', 3, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60');

-- Insertar usuario de ejemplo ( este es opcional)
INSERT INTO usuarios (email, nombre) VALUES
('usuario@ejemplo.com', 'Usuario Demo');