// server.js

const express = require('express');
const mysql = require('mysql2/promise'); // Using mysql2/promise for async/await
const cors = require('cors');

const app = express();
const port = 3000; // The port your backend will run on

// Middleware to parse JSON request bodies
app.use(express.json());

// Explicitly configure CORS to allow requests from Live Server's origin
const corsOptions = {
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Add any other origins if Live Server uses a different port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));


// MySQL Connection Pool (recommended for managing database connections)
const pool = mysql.createPool({
    host: 'localhost',      // Your MySQL host (usually localhost)
    user: 'root',           // Your MySQL username
    password: 'Amith@2005', // IMPORTANT: Replace with your MySQL root password
    database: 'cafe_management_db', // The database you created
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('Error connecting to MySQL database:', err.message);
        // Exit the process if database connection fails
        process.exit(1);
    });

// --- API Endpoints for Menu Items ---

// GET /api/menu_items
// Fetches all menu items (both available and unavailable for management)
app.get('/api/menu_items', async (req, res) => {
    try {
        // Fetch all items, not just available ones, for management purposes
        const [rows] = await pool.execute('SELECT item_id, item_name, description, price, category, is_available FROM Menu_Items');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Error fetching menu items', error: error.message });
    }
});

// POST /api/menu_items
// Adds a new menu item
app.post('/api/menu_items', async (req, res) => {
    const { item_name, description, price, category, is_available } = req.body;

    if (!item_name || !price) {
        return res.status(400).json({ message: 'Item name and price are required.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO Menu_Items (item_name, description, price, category, is_available) VALUES (?, ?, ?, ?, ?)',
            [item_name, description || null, price, category || null, is_available]
        );
        res.status(201).json({ message: 'Menu item added successfully!', item_id: result.insertId });
    } catch (error) {
        console.error('Error adding menu item:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Menu item with this name already exists.', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to add menu item', error: error.message });
        }
    }
});

// PUT /api/menu_items/:id
// Updates an existing menu item
app.put('/api/menu_items/:id', async (req, res) => {
    const itemId = req.params.id;
    const { item_name, description, price, category, is_available } = req.body;

    if (!item_name || !price) {
        return res.status(400).json({ message: 'Item name and price are required.' });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE Menu_Items SET item_name = ?, description = ?, price = ?, category = ?, is_available = ? WHERE item_id = ?',
            [item_name, description || null, price, category || null, is_available, itemId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Menu item not found.' });
        }
        res.status(200).json({ message: 'Menu item updated successfully!' });
    } catch (error) {
        console.error('Error updating menu item:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Menu item with this name already exists.', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to update menu item', error: error.message });
        }
    }
});

// DELETE /api/menu_items/:id
// Deletes a menu item
app.delete('/api/menu_items/:id', async (req, res) => {
    const itemId = req.params.id;

    try {
        const [result] = await pool.execute('DELETE FROM Menu_Items WHERE item_id = ?', [itemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Menu item not found.' });
        }
        res.status(200).json({ message: 'Menu item deleted successfully!' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
    }
});

// --- API Endpoints for Orders ---

// POST /api/orders
// Places a new order
app.post('/api/orders', async (req, res) => {
    const { customer_id, employee_id, items, payment_method } = req.body;

    if (!employee_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Missing required order data (employee_id, items).' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Start a transaction

        let total_amount = 0;
        for (const item of items) {
            const [menuItemRows] = await connection.execute('SELECT price FROM Menu_Items WHERE item_id = ?', [item.item_id]);
            if (menuItemRows.length === 0) {
                throw new Error(`Menu item with ID ${item.item_id} not found.`);
            }
            const actualPrice = menuItemRows[0].price;
            total_amount += actualPrice * item.quantity;
        }

        const [orderResult] = await connection.execute(
            'INSERT INTO Orders (customer_id, employee_id, order_date, order_time, total_amount, status, payment_method) VALUES (?, ?, CURDATE(), CURTIME(), ?, ?, ?)',
            [customer_id, employee_id, total_amount, 'Completed', payment_method || 'Cash']
        );
        const order_id = orderResult.insertId;

        for (const item of items) {
            const [menuItemRows] = await connection.execute('SELECT price FROM Menu_Items WHERE item_id = ?', [item.item_id]);
            const priceAtOrder = menuItemRows[0].price;

            await connection.execute(
                'INSERT INTO Order_Items (order_id, item_id, quantity, price_at_order) VALUES (?, ?, ?, ?)',
                [order_id, item.item_id, item.quantity, priceAtOrder]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Order placed successfully!', order_id: order_id, total_amount: total_amount });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Failed to place order', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// --- New API Endpoints for Employees ---

// GET /api/employees
// Fetches all employees
app.get('/api/employees', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT employee_id, first_name, last_name, position, contact_number, email, hire_date, salary FROM Employees');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
});

// GET /api/employees/:id
// Fetches a single employee by ID
app.get('/api/employees/:id', async (req, res) => {
    const employeeId = req.params.id;
    try {
        const [rows] = await pool.execute('SELECT employee_id, first_name, last_name, position, contact_number, email, hire_date, salary FROM Employees WHERE employee_id = ?', [employeeId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Error fetching employee', error: error.message });
    }
});

// POST /api/employees
// Adds a new employee
app.post('/api/employees', async (req, res) => {
    const { first_name, last_name, position, contact_number, email, hire_date, salary } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ message: 'First name and last name are required for an employee.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO Employees (first_name, last_name, position, contact_number, email, hire_date, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, position || null, contact_number || null, email || null, hire_date || null, salary || null]
        );
        res.status(201).json({ message: 'Employee added successfully!', employee_id: result.insertId });
    } catch (error) {
        console.error('Error adding employee:', error);
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
            res.status(409).json({ message: 'Employee with this email already exists.', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to add employee', error: error.message });
        }
    }
});

// PUT /api/employees/:id
// Updates an existing employee
app.put('/api/employees/:id', async (req, res) => {
    const employeeId = req.params.id;
    const { first_name, last_name, position, contact_number, email, hire_date, salary } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ message: 'First name and last name are required for an employee.' });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE Employees SET first_name = ?, last_name = ?, position = ?, contact_number = ?, email = ?, hire_date = ?, salary = ? WHERE employee_id = ?',
            [first_name, last_name, position || null, contact_number || null, email || null, hire_date || null, salary || null, employeeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        res.status(200).json({ message: 'Employee updated successfully!' });
    } catch (error) {
        console.error('Error updating employee:', error);
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
            res.status(409).json({ message: 'Employee with this email already exists.', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to update employee', error: error.message });
        }
    }
});

// DELETE /api/employees/:id
// Deletes an employee
app.delete('/api/employees/:id', async (req, res) => {
    const employeeId = req.params.id;
    try {
        const [result] = await pool.execute('DELETE FROM Employees WHERE employee_id = ?', [employeeId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        res.status(200).json({ message: 'Employee deleted successfully!' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Failed to delete employee', error: error.message });
    }
});

// --- New API Endpoints for Customers ---

// GET /api/customers
// Fetches all customers
app.get('/api/customers', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT customer_id, first_name, last_name, contact_number, email, loyalty_points FROM Customers');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
});

// GET /api/customers/:id
// Fetches a single customer by ID
app.get('/api/customers/:id', async (req, res) => {
    const customerId = req.params.id;
    try {
        const [rows] = await pool.execute('SELECT customer_id, first_name, last_name, contact_number, email, loyalty_points FROM Customers WHERE customer_id = ?', [customerId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: 'Error fetching customer', error: error.message });
    }
});

// POST /api/customers
// Adds a new customer
app.post('/api/customers', async (req, res) => {
    const { first_name, last_name, contact_number, email, loyalty_points } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ message: 'First name and last name are required for a customer.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO Customers (first_name, last_name, contact_number, email, loyalty_points) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, contact_number || null, email || null, loyalty_points || 0]
        );
        res.status(201).json({ message: 'Customer added successfully!', customer_id: result.insertId });
    } catch (error) {
        console.error('Error adding customer:', error);
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
            res.status(409).json({ message: 'Customer with this email already exists.', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to add customer', error: error.message });
        }
    }
});

// PUT /api/customers/:id
// Updates an existing customer
app.put('/api/customers/:id', async (req, res) => {
    const customerId = req.params.id;
    const { first_name, last_name, contact_number, email, loyalty_points } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ message: 'First name and last name are required for a customer.' });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE Customers SET first_name = ?, last_name = ?, contact_number = ?, email = ?, loyalty_points = ? WHERE customer_id = ?',
            [first_name, last_name, contact_number || null, email || null, loyalty_points || 0, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.status(200).json({ message: 'Customer updated successfully!' });
    } catch (error) {
        console.error('Error updating customer:', error);
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
            res.status(409).json({ message: 'Customer with this email already exists.', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to update customer', error: error.message });
        }
    }
});

// DELETE /api/customers/:id
// Deletes a customer
app.delete('/api/customers/:id', async (req, res) => {
    const customerId = req.params.id;
    try {
        const [result] = await pool.execute('DELETE FROM Customers WHERE customer_id = ?', [customerId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.status(200).json({ message: 'Customer deleted successfully!' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Failed to delete customer', error: error.message });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Cafe Management Backend listening at http://localhost:${port}`);
});
