def test_crm_and_project_lifecycle(client):
    # 1. Register Owner
    reg = client.post("/api/v1/auth/register", json={
        "email": "owner@studioalpha.com",
        "password": "Password123!",
        "full_name": "Studio Owner",
        "organization_name": "Studio Alpha"
    }).json()
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Client
    client_res = client.post("/api/v1/clients", headers=headers, json={
        "name": "Beta Corp",
        "company": "Beta Corp International",
        "email": "contact@betacorp.com",
        "phone": "+1-555-0192",
        "currency": "USD",
        "contacts": [
            {
                "name": "Bob Vance",
                "email": "bob@betacorp.com",
                "is_primary": True
            }
        ]
    })
    assert client_res.status_code == 200
    client_data = client_res.json()
    client_id = client_data["id"]
    assert client_data["name"] == "Beta Corp"
    assert len(client_data["contacts"]) == 1

    # 3. Create Project
    proj_res = client.post("/api/v1/projects", headers=headers, json={
        "client_id": client_id,
        "name": "Beta E-Commerce Portal",
        "description": "Full platform build",
        "status": "in_progress",
        "budget": 25000.00
    })
    assert proj_res.status_code == 200
    proj_data = proj_res.json()
    project_id = proj_data["id"]

    # 4. Add Milestone
    m_res = client.post(f"/api/v1/projects/{project_id}/milestones", headers=headers, json={
        "title": "Milestone 1: Prototype",
        "order_index": 1
    })
    assert m_res.status_code == 200
    m_id = m_res.json()["id"]

    # 5. Add Tasks (Client visible & Internal)
    task1 = client.post(f"/api/v1/projects/{project_id}/tasks", headers=headers, json={
        "title": "Public Client Task",
        "milestone_id": m_id,
        "is_client_visible": True,
        "status": "todo"
    }).json()

    task2 = client.post(f"/api/v1/projects/{project_id}/tasks", headers=headers, json={
        "title": "Private Internal Security Audit",
        "milestone_id": m_id,
        "is_client_visible": False,
        "status": "todo"
    }).json()

    # 6. Update Task Status (Kanban movement)
    t_update = client.put(f"/api/v1/projects/tasks/{task1['id']}", headers=headers, json={
        "status": "in_progress"
    })
    assert t_update.status_code == 200
    assert t_update.json()["status"] == "in_progress"

    # 7. Submit Deliverable
    deliv_res = client.post(f"/api/v1/projects/{project_id}/deliverables", headers=headers, json={
        "title": "Figma Wireframes V1",
        "file_url": "https://example.com/figma"
    })
    assert deliv_res.status_code == 200
    deliv_id = deliv_res.json()["id"]

    # 8. Review Deliverable (Approve)
    review_res = client.post(f"/api/v1/projects/deliverables/{deliv_id}/review", headers=headers, json={
        "status": "approved",
        "feedback": "Approved, looks amazing!"
    })
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "approved"
