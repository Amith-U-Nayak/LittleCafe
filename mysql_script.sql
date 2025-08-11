CREATE DATABASE cafe_management_db;
USE cafe_management_db;
CREATE TABLE Employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    contact_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    hire_date DATE,
    salary DECIMAL(10, 2)
);
CREATE TABLE Menu_Items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE
);
CREATE TABLE Customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    contact_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    loyalty_points INT DEFAULT 0
);
CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT, 
    employee_id INT NOT NULL, 
    order_date DATE NOT NULL,
    order_time TIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', 
    payment_method VARCHAR(50), 
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);
CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL, 
    item_id INT NOT NULL, 
    quantity INT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL, 
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id)
);
CREATE TABLE Suppliers (
    supplier_id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_name VARCHAR(100) NOT NULL UNIQUE,
    contact_person VARCHAR(100),
    contact_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    address VARCHAR(255)
);
CREATE TABLE Ingredients (
    ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    ingredient_name VARCHAR(100) NOT NULL UNIQUE,
    unit_of_measure VARCHAR(20), 
    current_stock DECIMAL(10, 2) DEFAULT 0,
    min_stock_level DECIMAL(10, 2) DEFAULT 0
);
CREATE TABLE Recipe_Ingredients (
    recipe_ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL, 
    ingredient_id INT NOT NULL, 
    quantity_needed DECIMAL(10, 2) NOT NULL, 
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id),
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
);
CREATE TABLE Inventory_Transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    ingredient_id INT NOT NULL, 
    transaction_type VARCHAR(20) NOT NULL, 
    quantity_change DECIMAL(10, 2) NOT NULL, 
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP, 
    supplier_id INT, 
    notes TEXT,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id),
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);
INSERT INTO Employees (first_name, last_name, position, contact_number, email, hire_date, salary) VALUES
('Alice', 'Smith', 'Manager', '111-222-3333', 'alice.smith@cafe.com', '2022-01-15', 60000.00),
('Bob', 'Johnson', 'Barista', '444-555-6666', 'bob.j@cafe.com', '2023-03-01', 35000.00),
('Charlie', 'Brown', 'Cashier', '777-888-9999', 'charlie.b@cafe.com', '2023-05-10', 30000.00),
('Diana', 'Prince', 'Barista', '123-456-7890', 'diana.p@cafe.com', '2024-02-20', 36000.00);

INSERT INTO Menu_Items (item_name, description, price, category, is_available) VALUES
('Espresso', 'Strong shot of coffee', 2.50, 'Coffee', TRUE),
('Latte', 'Espresso with steamed milk', 4.00, 'Coffee', TRUE),
('Croissant', 'Flaky pastry', 3.00, 'Pastry', TRUE),
('Blueberry Muffin', 'Classic blueberry muffin', 3.50, 'Pastry', TRUE),
('Iced Tea', 'Refreshing black iced tea', 3.00, 'Tea', TRUE),
('Chicken Sandwich', 'Grilled chicken with lettuce and tomato', 7.50, 'Sandwich', TRUE),
('Cappuccino', 'Espresso with steamed milk and foam', 4.25, 'Coffee', TRUE);

INSERT INTO Customers (first_name, last_name, contact_number, email, loyalty_points) VALUES
('Emma', 'Davis', '987-654-3210', 'emma.davis@example.com', 150),
('Frank', 'White', '555-123-4567', 'frank.w@example.com', 50),
('Grace', 'Taylor', '222-333-4444', 'grace.t@example.com', 200);

INSERT INTO Suppliers (supplier_name, contact_person, contact_number, email, address) VALUES
('Coffee Bean Co.', 'John Coffee', '100-200-3000', 'info@coffeebeanco.com', '123 Bean St, Coffee Town'),
('Dairy Delights', 'Sarah Milk', '101-202-3030', 'sales@dairydelights.com', '456 Farm Rd, Milkville'),
('Bake Goods Inc.', 'Peter Pastry', '102-203-3040', 'orders@bakegoods.com', '789 Oven Ln, Bakerton');

INSERT INTO Ingredients (ingredient_name, unit_of_measure, current_stock, min_stock_level) VALUES
('Espresso Beans', 'kg', 10.0, 2.0),
('Milk', 'liter', 50.0, 10.0),
('Sugar', 'kg', 20.0, 5.0),
('Flour', 'kg', 15.0, 3.0),
('Blueberries', 'kg', 5.0, 1.0),
('Tea Leaves', 'kg', 3.0, 0.5),
('Chicken Breast', 'kg', 8.0, 2.0),
('Lettuce', 'piece', 30.0, 5.0);

INSERT INTO Recipe_Ingredients (item_id, ingredient_id, quantity_needed) VALUES
((SELECT item_id FROM Menu_Items WHERE item_name = 'Espresso'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Espresso Beans'), 0.018); -- 18g per shot
INSERT INTO Recipe_Ingredients (item_id, ingredient_id, quantity_needed) VALUES
((SELECT item_id FROM Menu_Items WHERE item_name = 'Latte'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Espresso Beans'), 0.018),
((SELECT item_id FROM Menu_Items WHERE item_name = 'Latte'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Milk'), 0.250); -- 250ml milk
INSERT INTO Recipe_Ingredients (item_id, ingredient_id, quantity_needed) VALUES
((SELECT item_id FROM Menu_Items WHERE item_name = 'Croissant'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Flour'), 0.050); -- 50g flour
INSERT INTO Recipe_Ingredients (item_id, ingredient_id, quantity_needed) VALUES
((SELECT item_id FROM Menu_Items WHERE item_name = 'Blueberry Muffin'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Flour'), 0.080),
((SELECT item_id FROM Menu_Items WHERE item_name = 'Blueberry Muffin'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Blueberries'), 0.030);
INSERT INTO Recipe_Ingredients (item_id, ingredient_id, quantity_needed) VALUES
((SELECT item_id FROM Menu_Items WHERE item_name = 'Iced Tea'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Tea Leaves'), 0.005),
((SELECT item_id FROM Menu_Items WHERE item_name = 'Iced Tea'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Sugar'), 0.020);
INSERT INTO Recipe_Ingredients (item_id, ingredient_id, quantity_needed) VALUES
((SELECT item_id FROM Menu_Items WHERE item_name = 'Chicken Sandwich'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Chicken Breast'), 0.100),
((SELECT item_id FROM Menu_Items WHERE item_name = 'Chicken Sandwich'), (SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Lettuce'), 0.010);

INSERT INTO Orders (customer_id, employee_id, order_date, order_time, total_amount, status, payment_method) VALUES
((SELECT customer_id FROM Customers WHERE first_name = 'Emma'), (SELECT employee_id FROM Employees WHERE first_name = 'Bob'), '2024-07-17', '10:00:00', 6.50, 'Completed', 'Card');
INSERT INTO Orders (customer_id, employee_id, order_date, order_time, total_amount, status, payment_method) VALUES
(NULL, (SELECT employee_id FROM Employees WHERE first_name = 'Charlie'), '2024-07-17', '10:15:00', 7.00, 'Completed', 'Cash');
INSERT INTO Orders (customer_id, employee_id, order_date, order_time, total_amount, status, payment_method) VALUES
((SELECT customer_id FROM Customers WHERE first_name = 'Frank'), (SELECT employee_id FROM Employees WHERE first_name = 'Bob'), '2024-07-17', '10:30:00', 11.50, 'Pending', 'Mobile Pay');

INSERT INTO Order_Items (order_id, item_id, quantity, price_at_order) VALUES
((SELECT order_id FROM Orders WHERE order_date = '2024-07-17' AND order_time = '10:00:00' AND total_amount = 6.50), (SELECT item_id FROM Menu_Items WHERE item_name = 'Latte'), 1, 4.00),
((SELECT order_id FROM Orders WHERE order_date = '2024-07-17' AND order_time = '10:00:00' AND total_amount = 6.50), (SELECT item_id FROM Menu_Items WHERE item_name = 'Espresso'), 1, 2.50);
INSERT INTO Order_Items (order_id, item_id, quantity, price_at_order) VALUES
((SELECT order_id FROM Orders WHERE order_date = '2024-07-17' AND order_time = '10:15:00' AND total_amount = 7.00), (SELECT item_id FROM Menu_Items WHERE item_name = 'Blueberry Muffin'), 1, 3.50),
((SELECT order_id FROM Orders WHERE order_date = '2024-07-17' AND order_time = '10:15:00' AND total_amount = 7.00), (SELECT item_id FROM Menu_Items WHERE item_name = 'Iced Tea'), 1, 3.50);
INSERT INTO Order_Items (order_id, item_id, quantity, price_at_order) VALUES
((SELECT order_id FROM Orders WHERE order_date = '2024-07-17' AND order_time = '10:30:00' AND total_amount = 11.50), (SELECT item_id FROM Menu_Items WHERE item_name = 'Chicken Sandwich'), 1, 7.50),
((SELECT order_id FROM Orders WHERE order_date = '2024-07-17' AND order_time = '10:30:00' AND total_amount = 11.50), (SELECT item_id FROM Menu_Items WHERE item_name = 'Latte'), 1, 4.00);

INSERT INTO Inventory_Transactions (ingredient_id, transaction_type, quantity_change, transaction_date, supplier_id, notes) VALUES
((SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Espresso Beans'), 'Received', 5.0, '2024-07-16 09:00:00', (SELECT supplier_id FROM Suppliers WHERE supplier_name = 'Coffee Bean Co.'), 'Bulk order');
INSERT INTO Inventory_Transactions (ingredient_id, transaction_type, quantity_change, transaction_date, supplier_id, notes) VALUES
((SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Milk'), 'Used', -0.250, '2024-07-17 10:05:00', NULL, 'Used for Latte in Order 1');
INSERT INTO Inventory_Transactions (ingredient_id, transaction_type, quantity_change, transaction_date, supplier_id, notes) VALUES
((SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Milk'), 'Received', 20.0, '2024-07-17 08:30:00', (SELECT supplier_id FROM Suppliers WHERE supplier_name = 'Dairy Delights'), 'Weekly milk delivery');
INSERT INTO Inventory_Transactions (ingredient_id, transaction_type, quantity_change, transaction_date, supplier_id, notes) VALUES
((SELECT ingredient_id FROM Ingredients WHERE ingredient_name = 'Flour'), 'Adjustment', -0.5, '2024-07-17 11:00:00', NULL, 'Spillage during transfer');