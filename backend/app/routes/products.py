"""Product management routes with full CRUD and validation."""

from flask import Blueprint, request

from app import db
from app.models import Product
from app.utils import error_response, success_response, validate_required_fields

products_bp = Blueprint("products", __name__)


@products_bp.route("/products", methods=["POST"])
def create_product():
    """Create a new product with unique SKU validation."""
    data = request.get_json()
    is_valid, missing = validate_required_fields(
        data, ["name", "sku", "price", "quantity"]
    )
    if not is_valid:
        return error_response(f"Missing required fields: {', '.join(missing)}")

    # Validate price
    try:
        price = float(data["price"])
        if price <= 0:
            return error_response("Price must be greater than 0")
    except (ValueError, TypeError):
        return error_response("Price must be a valid number")

    # Validate quantity
    try:
        quantity = int(data["quantity"])
        if quantity < 0:
            return error_response("Quantity cannot be negative")
    except (ValueError, TypeError):
        return error_response("Quantity must be a valid integer")

    # Check SKU uniqueness
    existing = Product.query.filter_by(sku=data["sku"].strip()).first()
    if existing:
        return error_response(f"Product with SKU '{data['sku']}' already exists", 409)

    product = Product(
        name=data["name"].strip(),
        sku=data["sku"].strip(),
        price=round(price, 2),
        quantity=quantity,
    )
    db.session.add(product)
    db.session.commit()

    return success_response(product.to_dict(), 201)


@products_bp.route("/products", methods=["GET"])
def get_products():
    """Retrieve all products."""
    products = Product.query.order_by(Product.id.desc()).all()
    return success_response([p.to_dict() for p in products])


@products_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Retrieve a single product by ID."""
    product = Product.query.get(product_id)
    if not product:
        return error_response("Product not found", 404)
    return success_response(product.to_dict())


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """Update an existing product."""
    product = Product.query.get(product_id)
    if not product:
        return error_response("Product not found", 404)

    data = request.get_json()
    if not data:
        return error_response("No data provided")

    # Update name
    if "name" in data:
        if not data["name"] or not data["name"].strip():
            return error_response("Product name cannot be empty")
        product.name = data["name"].strip()

    # Update SKU with uniqueness check
    if "sku" in data:
        if not data["sku"] or not data["sku"].strip():
            return error_response("SKU cannot be empty")
        existing = Product.query.filter(
            Product.sku == data["sku"].strip(), Product.id != product_id
        ).first()
        if existing:
            return error_response(
                f"Product with SKU '{data['sku']}' already exists", 409
            )
        product.sku = data["sku"].strip()

    # Update price
    if "price" in data:
        try:
            price = float(data["price"])
            if price <= 0:
                return error_response("Price must be greater than 0")
            product.price = round(price, 2)
        except (ValueError, TypeError):
            return error_response("Price must be a valid number")

    # Update quantity
    if "quantity" in data:
        try:
            quantity = int(data["quantity"])
            if quantity < 0:
                return error_response("Quantity cannot be negative")
            product.quantity = quantity
        except (ValueError, TypeError):
            return error_response("Quantity must be a valid integer")

    db.session.commit()
    return success_response(product.to_dict())


@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """Delete a product. Fails if product is referenced in orders."""
    product = Product.query.get(product_id)
    if not product:
        return error_response("Product not found", 404)

    if product.order_items:
        return error_response(
            "Cannot delete product that is referenced in existing orders", 400
        )

    db.session.delete(product)
    db.session.commit()
    return success_response({"message": "Product deleted successfully"})
