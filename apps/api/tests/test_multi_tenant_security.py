def test_multi_tenant_and_client_portal_security_isolation(client):
    # 1. Organization A (Agency A)
    org_a = client.post("/api/v1/auth/register", json={
        "email": "owner@orga.com",
        "password": "Password123!",
        "full_name": "Org A Owner",
        "organization_name": "Agency A"
    }).json()
    token_a = org_a["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Organization B (Agency B)
    org_b = client.post("/api/v1/auth/register", json={
        "email": "owner@orgb.com",
        "password": "Password123!",
        "full_name": "Org B Owner",
        "organization_name": "Agency B"
    }).json()
    token_b = org_b["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Create Client in Org A
    client_a = client.post("/api/v1/clients", headers=headers_a, json={
        "name": "Secret Client of Org A",
        "email": "secret@clienta.com"
    }).json()
    client_a_id = client_a["id"]

    # Security Check 1: Org B CANNOT read Org A's client
    res_b_view = client.get(f"/api/v1/clients/{client_a_id}", headers=headers_b)
    assert res_b_view.status_code == 404

    # Security Check 2: Org B CANNOT list Org A's client
    list_b = client.get("/api/v1/clients", headers=headers_b).json()
    assert len(list_b) == 0

    # Create Project in Org A
    proj_a = client.post("/api/v1/projects", headers=headers_a, json={
        "client_id": client_a_id,
        "name": "Confidential Project A",
        "status": "in_progress"
    }).json()
    proj_a_id = proj_a["id"]

    # Add Client Visible Task and Internal Task
    task_public = client.post(f"/api/v1/projects/{proj_a_id}/tasks", headers=headers_a, json={
        "title": "Public Milestone Task",
        "is_client_visible": True
    }).json()

    task_internal = client.post(f"/api/v1/projects/{proj_a_id}/tasks", headers=headers_a, json={
        "title": "Secret Agency Margin Review",
        "is_client_visible": False
    }).json()

    # Add Client Visible Comment and Internal Agency Note
    comment_public = client.post("/api/v1/comments", headers=headers_a, json={
        "project_id": proj_a_id,
        "content": "Client update message",
        "is_internal": False
    }).json()

    comment_internal = client.post("/api/v1/comments", headers=headers_a, json={
        "project_id": proj_a_id,
        "content": "Private internal agency discussion",
        "is_internal": True
    }).json()

    # Invite Client Contact to Portal
    invite_res = client.post(f"/api/v1/clients/{client_a_id}/invite-portal?contact_email=contact@clienta.com", headers=headers_a)
    assert invite_res.status_code == 200

    # Client logs into their portal
    client_login = client.post("/api/v1/auth/login", json={
        "email": "contact@clienta.com",
        "password": "ClientPortalPass123!"
    }).json()
    client_token = client_login["access_token"]
    headers_client = {"Authorization": f"Bearer {client_token}"}

    # Security Check 3: Client only sees their own project
    client_projects = client.get("/api/v1/projects", headers=headers_client).json()
    assert len(client_projects) == 1
    assert client_projects[0]["name"] == "Confidential Project A"

    # Security Check 4: Client CANNOT see internal tasks
    retrieved_proj = client.get(f"/api/v1/projects/{proj_a_id}", headers=headers_client).json()
    task_titles = [t["title"] for t in retrieved_proj["tasks"]]
    assert "Public Milestone Task" in task_titles
    assert "Secret Agency Margin Review" not in task_titles

    # Security Check 5: Client CANNOT see internal agency comments
    comments_seen = client.get(f"/api/v1/comments?project_id={proj_a_id}", headers=headers_client).json()
    comment_texts = [c["content"] for c in comments_seen]
    assert "Client update message" in comment_texts
    assert "Private internal agency discussion" not in comment_texts

    # Security Check 6: Client CANNOT access Agency staff-only endpoints
    agency_only_res = client.post("/api/v1/clients", headers=headers_client, json={
        "name": "Hacked Client",
        "email": "hacked@test.com"
    })
    assert agency_only_res.status_code == 403
