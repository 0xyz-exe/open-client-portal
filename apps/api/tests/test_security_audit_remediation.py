import os
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
import io

def test_comment_security_and_idor_prevention(client):
    # Setup Agency
    agency = client.post("/api/v1/auth/register", json={
        "email": "agency.lead@securityaudit.com",
        "password": "Password123!",
        "full_name": "Audit Lead",
        "organization_name": "Security Audit Agency"
    }).json()
    token_agency = agency["access_token"]
    headers_agency = {"Authorization": f"Bearer {token_agency}"}

    # Create Client 1 and Client 2
    c1 = client.post("/api/v1/clients", headers=headers_agency, json={"name": "Client Alpha", "email": "alpha@client.com"}).json()
    c2 = client.post("/api/v1/clients", headers=headers_agency, json={"name": "Client Beta", "email": "beta@client.com"}).json()

    # Projects
    p1 = client.post("/api/v1/projects", headers=headers_agency, json={"client_id": c1["id"], "name": "Project Alpha"}).json()
    p2 = client.post("/api/v1/projects", headers=headers_agency, json={"client_id": c2["id"], "name": "Project Beta"}).json()

    # Post comments on Project Beta
    client.post("/api/v1/comments", headers=headers_agency, json={"project_id": p2["id"], "content": "Beta Confidential Scope", "is_internal": False})
    client.post("/api/v1/comments", headers=headers_agency, json={"project_id": p1["id"], "content": "Alpha Public Comment", "is_internal": False})

    # Invite Client Alpha & Login
    inv_c1 = client.post(f"/api/v1/clients/{c1['id']}/invite-portal?contact_email=alpha@client.com", headers=headers_agency).json()
    temp_pass_c1 = inv_c1["credentials"]["temporary_password"]
    c1_login = client.post("/api/v1/auth/login", json={"email": "alpha@client.com", "password": temp_pass_c1}).json()
    token_c1 = c1_login["access_token"]
    headers_c1 = {"Authorization": f"Bearer {token_c1}"}

    # 1. IDOR Read Attempt: Client Alpha tries to read comments of Project Beta
    res_idor = client.get(f"/api/v1/comments?project_id={p2['id']}", headers=headers_c1)
    assert res_idor.status_code == 403

    # 2. IDOR Write Attempt: Client Alpha tries to comment on Project Beta
    res_inject = client.post("/api/v1/comments", headers=headers_c1, json={"project_id": p2["id"], "content": "Injected comment"})
    assert res_inject.status_code == 403

    # 3. Unscoped comments call by Client Alpha must only return Project Alpha's comments
    res_unscoped = client.get("/api/v1/comments", headers=headers_c1)
    assert res_unscoped.status_code == 200
    texts = [c["content"] for c in res_unscoped.json()]
    assert "Alpha Public Comment" in texts
    assert "Beta Confidential Scope" not in texts

def test_document_path_traversal_and_boundaries(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "doc.admin@securityaudit.com",
        "password": "Password123!",
        "full_name": "Doc Admin",
        "organization_name": "Doc Security Org"
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # Upload with malicious path in filename
    fake_file = io.BytesIO(b"secret file content")
    upload_res = client.post(
        "/api/v1/documents",
        headers=headers,
        data={"title": "Security Test Doc", "category": "contracts", "is_client_visible": "true"},
        files={"file": ("../../../../etc/passwd", fake_file, "text/plain")}
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    # File name must be sanitized to leaf base name
    assert doc_data["file_name"] == "passwd"

def test_proposal_lifecycle_and_expired_rejection(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "sales@propcorp.com",
        "password": "Password123!",
        "full_name": "Sales Rep",
        "organization_name": "Prop Corp"
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    cl = client.post("/api/v1/clients", headers=headers, json={"name": "Buyer Corp", "email": "buyer@corp.com"}).json()

    # 1. Create Draft Proposal with valid expiration
    prop_res = client.post("/api/v1/proposals", headers=headers, json={
        "client_id": cl["id"],
        "title": "Draft Proposal",
        "expires_at": (datetime.utcnow() + timedelta(days=10)).isoformat(),
        "items": [{"description": "Work", "quantity": 1, "unit_price": 500}]
    }).json()
    token = prop_res["public_token"]

    # 2. Public review of DRAFT proposal is blocked (403)
    pub_view = client.get(f"/api/v1/proposals/public/{token}")
    assert pub_view.status_code == 403

    # Send proposal so it is no longer draft
    client.post(f"/api/v1/proposals/{prop_res['id']}/send", headers=headers)

    # 3. Acceptance of expired proposal is rejected
    exp_prop = client.post("/api/v1/proposals", headers=headers, json={
        "client_id": cl["id"],
        "title": "Expired Proposal",
        "expires_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "items": [{"description": "Old Work", "quantity": 1, "unit_price": 500}]
    }).json()
    client.post(f"/api/v1/proposals/{exp_prop['id']}/send", headers=headers)
    exp_token = exp_prop["public_token"]

    accept_res = client.post(f"/api/v1/proposals/public/{exp_token}/accept", json={"accepted_by_name": "Late Buyer"})
    assert accept_res.status_code == 400
    assert "expired" in accept_res.json()["detail"].lower()

def test_invoice_overpayment_prevention(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "finance@invsecurity.com",
        "password": "Password123!",
        "full_name": "Finance Head",
        "organization_name": "Inv Security"
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    cl = client.post("/api/v1/clients", headers=headers, json={"name": "Payer Corp", "email": "payer@corp.com"}).json()
    inv = client.post("/api/v1/invoices", headers=headers, json={
        "client_id": cl["id"],
        "due_date": "2026-12-31T00:00:00",
        "items": [{"description": "Service Fee", "quantity": 1, "unit_price": 1000.00}]
    }).json()
    inv_id = inv["id"]

    # 1. Overpayment rejected
    overpay = client.post(f"/api/v1/invoices/{inv_id}/payments", headers=headers, json={"amount": 1500.00})
    assert overpay.status_code == 400
    assert "exceeds" in overpay.json()["detail"].lower()

    # 2. Exact payment accepted
    exact_pay = client.post(f"/api/v1/invoices/{inv_id}/payments", headers=headers, json={"amount": 1000.00})
    assert exact_pay.status_code == 200

    # 3. Payment on already paid invoice rejected
    post_pay = client.post(f"/api/v1/invoices/{inv_id}/payments", headers=headers, json={"amount": 10.00})
    assert post_pay.status_code == 400
    assert "fully paid" in post_pay.json()["detail"].lower()

def test_password_reset_and_change_flow(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "reset.user@corp.com",
        "password": "OldPassword123!",
        "full_name": "Reset User",
        "organization_name": "Reset Corp"
    }).json()
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Change password while authenticated
    chg = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "OldPassword123!",
        "new_password": "NewPassword456!"
    })
    assert chg.status_code == 200

    # Verify old password fails, new succeeds
    fail_login = client.post("/api/v1/auth/login", json={"email": "reset.user@corp.com", "password": "OldPassword123!"})
    assert fail_login.status_code == 400

    ok_login = client.post("/api/v1/auth/login", json={"email": "reset.user@corp.com", "password": "NewPassword456!"})
    assert ok_login.status_code == 200

    # 2. Forgot password & reset token flow
    forgot_res = client.post("/api/v1/auth/forgot-password", json={"email": "reset.user@corp.com"}).json()
    reset_tok = forgot_res["reset_token"]

    # Execute reset with token
    confirm_res = client.post("/api/v1/auth/reset-password", json={
        "token": reset_tok,
        "new_password": "FinalPassword789!"
    })
    assert confirm_res.status_code == 200

    # Reusing reset token must fail
    reuse_res = client.post("/api/v1/auth/reset-password", json={
        "token": reset_tok,
        "new_password": "AnotherPassword!"
    })
    assert reuse_res.status_code == 400

    # Login with final password succeeds
    final_login = client.post("/api/v1/auth/login", json={"email": "reset.user@corp.com", "password": "FinalPassword789!"})
    assert final_login.status_code == 200
