    # Tahap 1: Builder - Menggunakan Alpine yang ringan untuk build
    FROM python:3.12-alpine AS builder

    # Install build-time dependencies menggunakan package manager Alpine (apk)
    # --no-cache: Tidak menyimpan cache, mengurangi ukuran layer
    RUN apk add --no-cache \
        build-base \
        cmake \
        z3-dev \
        openssl-dev \
        libffi-dev \
    gmp-dev

    # Set up virtual environment
    RUN python -m venv /opt/venv
    ENV PATH="/opt/venv/bin:$PATH"

    # Copy dan install requirements
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt

    # ---

    # Tahap 2: Final - Image akhir yang super ringan berbasis Alpine
    FROM python:3.12-alpine

    # Install HANYA run-time dependencies
    RUN apk add --no-cache \
        z3 \
        libffi \
    gmp

    # Salin virtual environment dari tahap builder
    COPY --from=builder /opt/venv /opt/venv

    # Salin kode aplikasi
    WORKDIR /app
    COPY . .

    # Membersihkan file .pyc dan __pycache__ untuk menghemat space
    RUN find /opt/venv -name "*.pyc" -delete && \
        find /opt/venv -name "__pycache__" -type d -delete

    # Aktifkan virtual environment untuk runtime
    ENV PATH="/opt/venv/bin:$PATH"

    # Expose port dan jalankan aplikasi
    EXPOSE 5001
    CMD ["python", "app.py"]