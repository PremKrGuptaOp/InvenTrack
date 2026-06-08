"""Order management routes with business logic for stock management."""

from flask import Blueprint, request

from app import db
from app.models import Customer, Order, OrderItem, Product
from app.utils import error_response, success_response

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/orders", methods=["POST"])
def create_order():
    """
    Create a new order.

    Expected payload:
    {
        "customer_id": 1,
        "items": [
            {"product_id": 1, "quantity": 2},
            {"product_id": 3, "quantity": 1}
        ]
    }

    Business rules:
    - Customer must exist
    - Each product must exist and have sufficient stock
    - Stock is reduced atomically on order creation
    - Total amount is auto-calculated from unit_price × quantity
    """
    data = request.get_json()
    if not data:
        return error_response("No data provided")

    # Validate customer_id
    customer_id = data.get("customer_id")
    if not customer_id:
        return error_response("customer_id is required")

    customer = Customer.query.get(customer_id)
    if not customer:
        return error_response("Customer not found", 404)

    # Validate items
    items = data.get("items")
    if not items or not isinstance(items, list) or len(items) == 0:
        return error_response("Order must contain at least one item")

    # Validate each item and check stock
    order_items_data = []
    for i, item in enumerate(items):
        product_id = item.get("product_id")
        quantity = item.get("quantity")

        if not product_id:
            return error_response(f"Item {i + 1}: product_id is required")

        if not quantity or not isinstance(quantity, int) or quantity <= 0:
            return error_response(f"Item {i + 1}: quantity must be a positive integer")

        product = Product.query.get(product_id)
        if not product:
            return error_response(f"Item {i + 1}: Product with ID {product_id} not found", 404)

        if product.quantity < quantity:
            return error_response(
                f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                f"Available: {product.quantity}, Requested: {quantity}",
                400,
            )

        order_items_data.append(
            {
                "product": product,
                "quantity": quantity,
                "unit_price": product.price,
            }
        )

    # All validations passed — create order atomically
    total_amount = sum(
        round(item["unit_price"] * item["quantity"], 2) for item in order_items_data
    )

    order = Order(
        customer_id=customer_id,
        total_amount=round(total_amount, 2),
    )
    db.session.add(order)
    db.session.flush()  # Get order.id before creating items

    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
        )
        db.session.add(order_item)

        # Reduce stock
        item_data["product"].quantity -= item_data["quantity"]

    db.session.commit()

    return success_response(order.to_dict(include_items=True), 201)


@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    """Retrieve all orders with customer names."""
    orders = Order.query.order_by(Order.id.desc()).all()
    return success_response([o.to_dict() for o in orders])


@orders_bp.route("/orders/<int:order_id>", methods=["GET"])
def get_order(order_id):
    """Retrieve a single order with full item details."""
    order = Order.query.get(order_id)
    if not order:
        return error_response("Order not found", 404)
    return success_response(order.to_dict(include_items=True))


@orders_bp.route("/orders/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    """
    Cancel/delete an order and restore stock.

    When an order is deleted, the quantities are added back to
    the respective products' stock.
    """
    order = Order.query.get(order_id)
    if not order:
        return error_response("Order not found", 404)

    # Restore stock for each item
    for item in order.items:
        product = Product.query.get(item.product_id)
        if product:
            product.quantity += item.quantity

    db.session.delete(order)
    db.session.commit()

    return success_response({"message": "Order deleted and stock restored successfully"})
