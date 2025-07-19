FROM python:3.12-slim

# Install system dependencies for mythril & z3-solver
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    curl \
    git \
    libz3-dev \
    libssl-dev \
    libffi-dev \
    libgmp-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements only for cache
COPY requirements.txt .

# Upgrade pip & install Python deps (no cache to reduce size)
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Flask port
EXPOSE 5000

# Run Flask
CMD ["python", "app.py"]
