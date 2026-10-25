# EV-Fleet-Intelligence-Platform


## Database Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure environment variables

Create a local `.env` file using `.env.example` and configure `DATABASE_URL`.

Do not commit `.env` or database credentials.

### 3. Apply database migrations

```bash
alembic upgrade head
```

### 4. Insert sample data

```bash
python -m scripts.seed_data
```

The seed script inserts simulated demonstration records for vehicles,
telemetry, charging, battery predictions, maintenance, procurement,
suppliers, battery materials, supplier risk, and net-zero scenarios.

### 5. Verify the migration

```bash
alembic current
```
