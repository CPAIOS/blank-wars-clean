# PostgreSQL Development Setup

We've switched from SQLite to PostgreSQL for development to ensure database parity between development and production environments.

## Quick Start

1. **Start PostgreSQL with Docker:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```

## What Changed

### ✅ Benefits of PostgreSQL Everywhere:
- **Development/Production Parity**: Same database, same behavior
- **Early Bug Detection**: Catch PostgreSQL-specific issues during development
- **Consistent Performance**: Similar query behavior across environments
- **Better Reliability**: No more "works on my machine" database problems

### 🗑️ Removed SQLite Dependencies:
- Removed `better-sqlite3` and `sqlite3` packages
- Removed `@types/better-sqlite3` 
- Simplified database layer to PostgreSQL only
- Removed SQLite-specific code paths

## Database Connection

- **Development**: `postgresql://dev:dev@localhost:5432/blankwars_dev`
- **Production**: Uses Railway's PostgreSQL connection string

## Docker PostgreSQL Container

The `docker-compose.yml` creates a PostgreSQL container with:
- **Database**: `blankwars_dev`
- **Username**: `dev`
- **Password**: `dev`
- **Port**: `5432`
- **Persistent Storage**: Docker volume `postgres_data`

## Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs postgres

# Connect to database (optional)
docker exec -it blankwars-postgres-dev psql -U dev -d blankwars_dev

# Reset database (nuclear option)
docker-compose down -v
docker-compose up -d
```

## Environment Variables

Your `.env` file should contain:
```
DATABASE_URL=postgresql://dev:dev@localhost:5432/blankwars_dev
```

## Railway Production

For production on Railway, ensure these environment variables are set:
```
NODE_ENV=production
DATABASE_URL=postgresql://[your-postgres-connection-string]
```

## Troubleshooting

**Error: "DATABASE_URL must be a PostgreSQL connection string"**
- Make sure PostgreSQL is running: `docker-compose up -d`
- Check your `.env` file has the correct `DATABASE_URL`

**Connection refused errors:**
- Ensure Docker is running
- Check if port 5432 is available: `lsof -i :5432`
- Restart the container: `docker-compose restart postgres`

**Database schema issues:**
- The database will auto-initialize on first run
- If you have schema issues, reset: `docker-compose down -v && docker-compose up -d`