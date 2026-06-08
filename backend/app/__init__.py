"""Flask application factory."""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    from app.routes.products import products_bp
    from app.routes.customers import customers_bp
    from app.routes.orders import orders_bp

    app.register_blueprint(products_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(orders_bp)

    # Health check endpoint
    @app.route("/health", methods=["GET"])
    def health():
        return {"status": "healthy", "service": "inventory-api"}

    # Create database tables
    with app.app_context():
        db.create_all()
        from app.seeder import seed_database
        seed_database()

    return app
