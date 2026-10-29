# Open Client Portal Security & Multi-Tenant Model

Security is an architectural foundation in Open Client Portal. The platform enforces multi-tiered defense-in-depth to protect agency financials, client confidential briefs, and proprietary assets.

## 1. Multi-Tenant Organization Isolation

Every query executed against tenant-owned resources is filtered by `organization_id`:
```python
query = db.query(Client).filter(Client.organization_id == org.id)
```
- **Deny-by-default:** Requests lacking valid organization membership credentials are immediately rejected with `403 Forbidden` or `404 Not Found`.
- **Cross-Organization Tampering:** Automated test suite explicitly verifies that Organization B cannot view, query, or mutate Organization A's clients, projects, or documents even when supplying valid internal IDs.

## 2. Client Portal Role Isolation

Clients authenticate with `global_role == "client"`. The system enforces strict isolation:
1. **Single Client Context:** The backend resolves the client user to their associated `ClientContact` record. All project, proposal, invoice, and document queries are strictly bounded to `client_id == contact.client_id`.
2. **Internal Note Redaction:** Comments marked `is_internal = True` are filtered out server-side. Clients never receive internal notes in API responses.
3. **Internal Task Redaction:** Tasks marked `is_client_visible = False` are stripped from project payloads before returning to clients.
4. **Document Access Control:** Private files marked `is_client_visible = False` return `403 Forbidden` if download is attempted by client tokens.

## 3. Cryptography & Authentication

- **Password Hashing:** Passwords are salted and hashed using `bcrypt` (work factor 12+).
- **Session Tokens:** JSON Web Tokens (JWT) signed using HMAC-SHA256 (`HS256`) with configurable expiration.
- **Electronic Signatures:** Proposals record signer name, IP context, timestamp, and signature statement.

## 4. Input Validation & SQL Injection Prevention

- **Pydantic Validation:** All incoming request payloads undergo strict type coercion and regex validation before hitting business logic.
- **Parameterized SQL:** All queries are constructed via SQLAlchemy ORM expressions; raw string SQL interpolation is prohibited.
- **File Upload Safeguards:** Uploaded filenames are sanitized and prepended with random cryptographic UUID prefixes to prevent directory traversal attacks (`../../evil.sh`).
