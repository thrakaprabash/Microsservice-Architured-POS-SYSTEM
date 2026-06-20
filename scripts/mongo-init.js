// MongoDB initialization script
// Creates databases and initial collections when MongoDB first starts

// Switch to auth database
db = db.getSiblingDB('pos-auth');
db.createCollection('users');
print('✅ Created pos-auth database');

// Switch to products database
db = db.getSiblingDB('pos-products');
db.createCollection('products');
db.createCollection('categories');
print('✅ Created pos-products database');

// Switch to orders database
db = db.getSiblingDB('pos-orders');
db.createCollection('orders');
print('✅ Created pos-orders database');

// Switch to payments database
db = db.getSiblingDB('pos-payments');
db.createCollection('payments');
print('✅ Created pos-payments database');

print('✅ MongoDB initialization complete');
