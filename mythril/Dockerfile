FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl gnupg gcc g++ make git && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Install solc-select
RUN pip install solc-select && \
    solc-select install 0.8.20 && \
    solc-select use 0.8.20

# Set working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy only npm deps first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Jalankan Flask app
CMD ["python", "app.py"]
