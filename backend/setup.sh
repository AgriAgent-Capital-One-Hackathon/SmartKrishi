#!/bin/bash
# Setup script for SmartKrishi Backend

echo "🌱 SmartKrishi Backend Setup"
echo "============================="

# Check if PostgreSQL is installed
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL is already installed"
else
    echo "❌ PostgreSQL not found. Installing via Homebrew..."
    
    # Check if Homebrew is installed
    if command -v brew >/dev/null 2>&1; then
        brew install postgresql@15
        brew services start postgresql@15
    else
        echo "❌ Homebrew not found. Please install PostgreSQL manually:"
        echo "1. Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo "2. Install PostgreSQL: brew install postgresql@15"
        echo "3. Start PostgreSQL: brew services start postgresql@15"
        exit 1
    fi
fi

# Create database and user
echo "📊 Setting up database..."
psql postgres << EOF
CREATE USER smartkrishi_user WITH PASSWORD 'smartkrishi_password';
CREATE DATABASE smartkrishi_db OWNER smartkrishi_user;
GRANT ALL PRIVILEGES ON DATABASE smartkrishi_db TO smartkrishi_user;
\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully"
else
    echo "❌ Database setup failed. You may need to run this manually:"
    echo "psql postgres"
    echo "CREATE USER smartkrishi_user WITH PASSWORD 'smartkrishi_password';"
    echo "CREATE DATABASE smartkrishi_db OWNER smartkrishi_user;"
    echo "GRANT ALL PRIVILEGES ON DATABASE smartkrishi_db TO smartkrishi_user;"
fi

echo ""
echo "🚀 Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Run the FastAPI server: python -m uvicorn app.main:app --reload"
echo "3. Visit http://localhost:8000/docs for API documentation"
