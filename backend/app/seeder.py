from datetime import datetime, timezone, timedelta
from app import db
from app.models import Product, Customer, Order, OrderItem

def seed_database():
    """
    Seed the database with realistic business entities and historic sales data.
    Only triggers if there is no pre-existing data in the Product or Customer tables.
    """
    if Product.query.first() or Customer.query.first():
        print("Database already contains data. Seeding skipped.")
        return

    print("Seeding database with humanized real-world data...")

    # 1. Seed Realistic Products
    products_data = [
        {"name": "iPhone 15 Pro Max (256GB)", "sku": "APL-IPH15P-256", "price": 1199.00, "quantity": 14},
        {"name": "Sony WH-1000XM5 Wireless Headphones", "sku": "SNY-WH1000XM5", "price": 348.00, "quantity": 22},
        {"name": "Logitech MX Master 3S Mouse", "sku": "LOG-MX3S-W", "price": 99.99, "quantity": 40},
        {"name": "Dell UltraSharp 32\" 4K USB-C Hub Monitor", "sku": "DEL-U3223QE", "price": 729.50, "quantity": 8},
        {"name": "Keychron K2 Mechanical Keyboard (Hot-swappable)", "sku": "KCH-K2-BROWN", "price": 89.90, "quantity": 5}, # Low stock
        {"name": "Anker 8-in-1 USB-C Multiport Adapter", "sku": "ANK-8IN1-C", "price": 45.00, "quantity": 0}, # Out of stock
        {"name": "Apple MacBook Pro 14\" (M3 Pro, 16GB)", "sku": "APL-MBP14-M3", "price": 1999.00, "quantity": 10},
        {"name": "Ergonomic Mesh Office Chair", "sku": "OFF-ERG-MESH", "price": 289.00, "quantity": 12},
    ]

    products = []
    for item in products_data:
        p = Product(
            name=item["name"],
            sku=item["sku"],
            price=item["price"],
            quantity=item["quantity"]
        )
        db.session.add(p)
        products.append(p)
    
    db.session.flush()  # Flush to generate product IDs

    # 2. Seed Realistic Customers
    customers_data = [
        {"name": "Marcus Vance", "email": "marcus.vance@techcorp.co", "phone": "+1 (555) 019-8822"},
        {"name": "Elena Rostova", "email": "elena.rostova@designstudio.io", "phone": "+1 (555) 028-3344"},
        {"name": "Rajesh Kumar", "email": "rajesh.kumar@infotech.in", "phone": "+91 98765 43210"},
        {"name": "Sarah Jenkins", "email": "sarah.j@retailhq.net", "phone": "+1 (555) 039-7711"},
    ]

    customers = []
    for item in customers_data:
        c = Customer(
            name=item["name"],
            email=item["email"],
            phone=item["phone"]
        )
        db.session.add(c)
        customers.append(c)
    
    db.session.flush()  # Flush to generate customer IDs

    # Map details to retrieve generated database IDs
    p_map = {p.sku: p for p in products}
    c_map = {c.email: c for c in customers}

    # 3. Seed Historic Completed Sales Transactions
    # Order 1: Marcus Vance buying MBP and Logitech Mouse (3 days ago)
    o1 = Order(
        customer_id=c_map["marcus.vance@techcorp.co"].id,
        total_amount=2098.99,
        created_at=datetime.now(timezone.utc) - timedelta(days=3)
    )
    db.session.add(o1)
    db.session.flush()
    db.session.add(OrderItem(order_id=o1.id, product_id=p_map["APL-MBP14-M3"].id, quantity=1, unit_price=1999.00))
    db.session.add(OrderItem(order_id=o1.id, product_id=p_map["LOG-MX3S-W"].id, quantity=1, unit_price=99.99))
    
    # Order 2: Elena Rostova buying Sony WH-1000XM5 and Anker USB Hub (2 days ago)
    o2 = Order(
        customer_id=c_map["elena.rostova@designstudio.io"].id,
        total_amount=393.00,
        created_at=datetime.now(timezone.utc) - timedelta(days=2)
    )
    db.session.add(o2)
    db.session.flush()
    db.session.add(OrderItem(order_id=o2.id, product_id=p_map["SNY-WH1000XM5"].id, quantity=1, unit_price=348.00))
    db.session.add(OrderItem(order_id=o2.id, product_id=p_map["ANK-8IN1-C"].id, quantity=1, unit_price=45.00))

    # Order 3: Rajesh Kumar buying Dell Monitor and Keychron Keyboard (1 day ago)
    o3 = Order(
        customer_id=c_map["rajesh.kumar@infotech.in"].id,
        total_amount=819.40,
        created_at=datetime.now(timezone.utc) - timedelta(days=1)
    )
    db.session.add(o3)
    db.session.flush()
    db.session.add(OrderItem(order_id=o3.id, product_id=p_map["DEL-U3223QE"].id, quantity=1, unit_price=729.50))
    db.session.add(OrderItem(order_id=o3.id, product_id=p_map["KCH-K2-BROWN"].id, quantity=1, unit_price=89.90))

    db.session.commit()
    print("Database seeding completed successfully!")
