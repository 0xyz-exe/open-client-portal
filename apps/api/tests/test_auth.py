def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_and_login_agency_owner(client):
    # Register agency owner
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "sarah.founder@agencyhub.io",
        "password": "Password123!",
        "full_name": "Sarah Founder",
        "organization_name": "AgencyHub Digital"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "sarah.founder@agencyhub.io"

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "sarah.founder@agencyhub.io",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]

    # Access current user profile
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Sarah Founder"

    # Verify organization membership
    orgs_res = client.get("/api/v1/auth/organizations", headers={"Authorization": f"Bearer {token}"})
    assert orgs_res.status_code == 200
    orgs = orgs_res.json()
    assert len(orgs) == 1
    assert orgs[0]["name"] == "AgencyHub Digital"
