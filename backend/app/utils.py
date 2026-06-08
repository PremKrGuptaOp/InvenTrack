"""Utility helpers for request validation and error formatting."""

from flask import jsonify


def error_response(message, status_code=400):
    """Return a standardized JSON error response."""
    return jsonify({"error": message}), status_code


def success_response(data, status_code=200):
    """Return a standardized JSON success response."""
    return jsonify(data), status_code


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present and non-empty in the request data.
    Returns a tuple (is_valid, missing_fields).
    """
    if not data:
        return False, required_fields

    missing = []
    for field in required_fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(field)
    return len(missing) == 0, missing
