"""Customer management routes with full CRUD and validation."""

import re

from flask import Blueprint, request

from app import db
from app.models import Customer
from app.utils import error_response, success_response, validate_required_fields

customers_bp = Blueprint("customers", __name__)


def is_valid_email(email):
    """Basic email format validation."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


@customers_bp.route("/customers", methods=["POST"])
def create_customer():
    """Create a new customer with unique email validation."""
    data = request.get_json()
    is_valid, missing = validate_required_fields(data, ["name", "email", "phone"])
    if not is_valid:
        return error_response(f"Missing required fields: {', '.join(missing)}")

    email = data["email"].strip().lower()
    if not is_valid_email(email):
        return error_response("Invalid email format")

    # Check email uniqueness
    existing = Customer.query.filter_by(email=email).first()
    if existing:
        return error_response(
            f"Customer with email '{email}' already exists", 409
        )

    customer = Customer(
        name=data["name"].strip(),
        email=email,
        phone=data["phone"].strip(),
    )
    db.session.add(customer)
    db.session.commit()

    return success_response(customer.to_dict(), 201)


@customers_bp.route("/customers", methods=["GET"])
def get_customers():
    """Retrieve all customers."""
    customers = Customer.query.order_by(Customer.id.desc()).all()
    return success_response([c.to_dict() for c in customers])


@customers_bp.route("/customers/<int:customer_id>", methods=["GET"])
def get_customer(customer_id):
    """Retrieve a single customer by ID."""
    customer = Customer.query.get(customer_id)
    if not customer:
        return error_response("Customer not found", 404)
    return success_response(customer.to_dict())


@customers_bp.route("/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    """Delete a customer. Fails if customer has existing orders."""
    customer = Customer.query.get(customer_id)
    if not customer:
        return error_response("Customer not found", 404)

    if customer.orders:
        return error_response(
            "Cannot delete customer with existing orders. Delete their orders first.",
            400,
        )

    db.session.delete(customer)
    db.session.commit()
    return success_response({"message": "Customer deleted successfully"})
