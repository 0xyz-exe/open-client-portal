# Backup & Disaster Recovery Guide

## 1. Database Backup (PostgreSQL)

To create a consistent, point-in-time snapshot of the PostgreSQL database:

```bash
# Via Docker Compose
docker compose exec postgres pg_dump -U ocp_user -F c -b -v -f /var/lib/postgresql/data/backup_$(date +%Y%m%d_%H%M%S).dump open_client_portal
```

Or directly via `pg_dump`:
```bash
pg_dump -h localhost -p 5432 -U ocp_user -F c -b -v -f ocp_backup.dump open_client_portal
```

## 2. File Assets Backup (`uploads/`)

The PostgreSQL database stores file metadata, while binary documents and deliverables are stored in the configured uploads volume.

```bash
# Archive the uploads directory
tar -czvf ocp_uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 3. Restoration Procedure

### Restore Database
```bash
# Drop existing connections and restore
docker compose exec -T postgres dropdb -U ocp_user open_client_portal
docker compose exec -T postgres createdb -U ocp_user open_client_portal
docker compose exec -T postgres pg_restore -U ocp_user -d open_client_portal -v /var/lib/postgresql/data/backup_name.dump
```

### Restore File Assets
```bash
tar -xzvf ocp_uploads_backup_*.tar.gz -C ./
```
