# Google Cloud SQL Database Setup Guide

## Prerequisites

1. **Google Cloud Account**: You need an active Google Cloud Platform account
2. **GCP Project**: Create or select an existing GCP project
3. **gcloud CLI**: Install the Google Cloud SDK
4. **Python 3.8+**: Ensure Python is installed
5. **Cloud SQL Admin API**: Must be enabled in your GCP project

## Step 1: GCP Project Setup

### 1.1 Install Google Cloud SDK

#### Linux Ubuntu
```bash
# Add Cloud SDK repository
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Import the Google Cloud public key
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

# Update and install
sudo apt-get update && sudo apt-get install google-cloud-sdk
```

#### macOS
```bash
# Using Homebrew
brew install google-cloud-sdk
```

#### Windows
```powershell
# Download the installer from:
# https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

# Or use PowerShell
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:TEMP\GoogleCloudSDKInstaller.exe")
& "$env:TEMP\GoogleCloudSDKInstaller.exe"
```

### 1.2 Initialize gcloud and Login

```bash
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 1.3 Enable Required APIs

```bash
# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Enable Cloud SQL API
gcloud services enable sql-component.googleapis.com

# Enable Compute Engine API (required for Cloud SQL)
gcloud services enable compute.googleapis.com
```

## Step 2: Create Cloud SQL Instance

### 2.1 Create PostgreSQL Instance

```bash
# Create a Cloud SQL PostgreSQL instance
gcloud sql instances create skip-trace-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --network=default \
    --no-backup \
    --storage-type=HDD \
    --storage-size=10GB

# Note: For production, consider:
# - Using a higher tier (e.g., db-n1-standard-1)
# - Enabling backups (remove --no-backup)
# - Using SSD storage (--storage-type=SSD)
```

### 2.2 Set Root Password

```bash
# Set the postgres user password
gcloud sql users set-password postgres \
    --instance=skip-trace-db \
    --password=YOUR_SECURE_ROOT_PASSWORD
```

### 2.3 Create Database

```bash
# Create the skip_trace database
gcloud sql databases create skip_trace \
    --instance=skip-trace-db
```

### 2.4 Create Application User

```bash
# Create an application user with limited privileges
gcloud sql users create app_user \
    --instance=skip-trace-db \
    --password=YOUR_SECURE_APP_PASSWORD
```

## Step 3: Configure Local Access

### 3.1 Install Cloud SQL Proxy

#### Linux Ubuntu
```bash
# Download Cloud SQL Proxy for Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64

# Make it executable
chmod +x cloud-sql-proxy

# Move to PATH
sudo mv cloud-sql-proxy /usr/local/bin/
```

#### macOS
```bash
# Download Cloud SQL Proxy for macOS
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64

# Make it executable
chmod +x cloud-sql-proxy

# Move to PATH
sudo mv cloud-sql-proxy /usr/local/bin/
```

#### Windows
```powershell
# Download Cloud SQL Proxy for Windows
Invoke-WebRequest -Uri "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.x64.exe" -OutFile "cloud-sql-proxy.exe"

# Add to PATH or run from current directory
# To add to PATH permanently, add the directory containing cloud-sql-proxy.exe to your system PATH
```

### 3.2 Create Service Account (Recommended)

```bash
# Create a service account
gcloud iam service-accounts create skip-trace-sa \
    --display-name="Skip Trace Database Service Account"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:skip-trace-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Create and download key
gcloud iam service-accounts keys create ~/skip-trace-sa-key.json \
    --iam-account=skip-trace-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3.3 Start Cloud SQL Proxy

```bash
# Using service account
cloud-sql-proxy \
    --credentials-file=$HOME/skip-trace-sa-key.json \
    YOUR_PROJECT_ID:us-central1:skip-trace-db &

# Or using gcloud auth (if already authenticated)
cloud-sql-proxy YOUR_PROJECT_ID:us-central1:skip-trace-db &
```

## Step 4: Configure Application

### 4.1 Create .env File

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# GCP Configuration
GCP_PROJECT_ID=your-actual-project-id
GCP_REGION=us-central1

# Cloud SQL Configuration
DB_INSTANCE_CONNECTION_NAME=your-project:us-central1:skip-trace-db
DB_NAME=skip_trace
DB_USER=app_user
DB_PASSWORD=your_app_password
DB_HOST=localhost
DB_PORT=5432
DB_CONNECTION_MODE=proxy

# Optional: Set if using service account key
GCP_SERVICE_ACCOUNT_KEY=/path/to/skip-trace-sa-key.json
```

### 4.2 Install Python Dependencies

#### Linux Ubuntu
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### macOS
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Windows
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (PowerShell)
.\venv\Scripts\Activate.ps1

# Or for Command Prompt
# venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

## Step 5: Test Connection

### 5.1 Create Test Script

Run the provided test script:

```bash
python tests/test_db_connection.py
```

Expected output:
```
Testing database connection...
✓ Successfully connected to database
✓ Database version: PostgreSQL 15.x
✓ Current database: skip_trace
✓ Current user: app_user
✓ Connection test passed!
```

### 5.2 Troubleshooting Common Issues

**Issue: Connection refused**
- Ensure Cloud SQL Proxy is running
- Check that port 5432 is not already in use
- Verify instance connection name is correct

**Issue: Authentication failed**
- Double-check username and password
- Ensure user has proper permissions
- Verify service account has Cloud SQL Client role

**Issue: Cloud SQL Proxy errors**
- Check service account key file path
- Ensure APIs are enabled
- Verify project ID and instance name

## Step 6: Database Permissions

Grant necessary permissions to application user:

```sql
-- Connect as postgres user first
psql -h localhost -U postgres -d skip_trace

-- Grant permissions to app_user
GRANT CREATE, CONNECT ON DATABASE skip_trace TO app_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
```

## Step 7: Security Best Practices

1. **Use Strong Passwords**: Generate secure passwords for all database users
2. **Enable SSL**: For production, always use SSL connections
3. **IP Allowlisting**: Configure authorized networks in Cloud SQL settings
4. **Regular Backups**: Enable automated backups for production instances
5. **Monitoring**: Set up Cloud SQL insights and alerts
6. **Least Privilege**: Grant minimum necessary permissions to app user

## Step 8: Cost Optimization

1. **Development Environment**:
   - Use `db-f1-micro` tier (low cost)
   - Disable backups during development
   - Stop instance when not in use

2. **Production Environment**:
   - Right-size your instance based on load
   - Use committed use discounts for predictable workloads
   - Enable automatic storage increase
   - Use read replicas for scaling reads

## Next Steps

1. Run database migrations to create schema (Phase 2)
2. Test CRUD operations with sample data
3. Set up monitoring and alerting
4. Configure backup and recovery procedures

## Useful Commands

```bash
# Stop Cloud SQL instance (to save costs)
gcloud sql instances patch skip-trace-db --no-activation-policy

# Start Cloud SQL instance
gcloud sql instances patch skip-trace-db --activation-policy=ALWAYS

# View instance details
gcloud sql instances describe skip-trace-db

# List databases
gcloud sql databases list --instance=skip-trace-db

# Connect with psql
psql "host=localhost port=5432 dbname=skip_trace user=app_user"
```

## Additional Resources

- [Cloud SQL for PostgreSQL Documentation](https://cloud.google.com/sql/docs/postgres)
- [Cloud SQL Proxy Documentation](https://cloud.google.com/sql/docs/postgres/connect-proxy)
- [Cloud SQL Pricing](https://cloud.google.com/sql/pricing)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)