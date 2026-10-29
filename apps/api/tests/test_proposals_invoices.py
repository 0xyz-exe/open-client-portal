from decimal import Decimal

def test_proposals_and_invoices_workflow(client):
    # 1. Setup Agency & Client
    reg = client.post("/api/v1/auth/register", json={
        "email": "cfo@agencymatrix.com",
        "password": "Password123!",
        "full_name": "CFO Marcus",
        "organization_name": "Agency Matrix"
    }).json()
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client_res = client.post("/api/v1/clients", headers=headers, json={
        "name": "Starlight Ventures",
        "email": "finance@starlight.io"
    }).json()
    client_id = client_res["id"]

    # 2. Create Proposal with Itemized Math
    prop_res = client.post("/api/v1/proposals", headers=headers, json={
        "client_id": client_id,
        "title": "Cloud Infrastructure Migration",
        "tax_rate": 10.0,
        "discount_amount": 500.0,
        "items": [
            {"description": "Architecture Design", "quantity": 1, "unit_price": 5000.00},
            {"description": "Kubernetes Cluster Deployment", "quantity": 2, "unit_price": 2500.00}
        ]
    })
    assert prop_res.status_code == 200
    prop_data = prop_res.json()
    assert Decimal(str(prop_data["subtotal"])) == Decimal("10000.00")
    assert Decimal(str(prop_data["tax_amount"])) == Decimal("1000.00")
    assert Decimal(str(prop_data["total_amount"])) == Decimal("10500.00")
    assert prop_data["proposal_number"].startswith("PROP-")
    public_token = prop_data["public_token"]

    # Mark sent
    client.post(f"/api/v1/proposals/{prop_data['id']}/send", headers=headers)

    # 3. Public Review & Sign-Off
    view_res = client.get(f"/api/v1/proposals/public/{public_token}")
    assert view_res.status_code == 200

    accept_res = client.post(f"/api/v1/proposals/public/{public_token}/accept", json={
        "accepted_by_name": "Director Starlight",
        "signature_data": "Signed electronically via Open Client Portal"
    })
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"
    assert accept_res.json()["accepted_by_name"] == "Director Starlight"

    # 4. Generate Invoice
    inv_res = client.post("/api/v1/invoices", headers=headers, json={
        "client_id": client_id,
        "due_date": "2026-11-30T00:00:00",
        "items": [
            {"description": "Phase 1 Retainer", "quantity": 1, "unit_price": 5000.00}
        ]
    })
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    inv_id = inv_data["id"]
    assert Decimal(str(inv_data["total_amount"])) == Decimal("5000.00")
    assert Decimal(str(inv_data["balance_due"])) == Decimal("5000.00")
    assert Decimal(str(inv_data["paid_amount"])) == Decimal("0.00")
    assert inv_data["status"] == "draft"

    # 5. Record Partial Payment
    pay1 = client.post(f"/api/v1/invoices/{inv_id}/payments", headers=headers, json={
        "amount": 2000.00,
        "payment_method": "bank_transfer",
        "transaction_reference": "WIRE-001"
    })
    assert pay1.status_code == 200

    inv_after_pay1 = client.get(f"/api/v1/invoices/{inv_id}", headers=headers).json()
    assert Decimal(str(inv_after_pay1["paid_amount"])) == Decimal("2000.00")
    assert Decimal(str(inv_after_pay1["balance_due"])) == Decimal("3000.00")
    assert inv_after_pay1["status"] == "partially_paid"

    # 6. Record Final Payment
    pay2 = client.post(f"/api/v1/invoices/{inv_id}/payments", headers=headers, json={
        "amount": 3000.00,
        "payment_method": "credit_card"
    })
    assert pay2.status_code == 200

    inv_after_pay2 = client.get(f"/api/v1/invoices/{inv_id}", headers=headers).json()
    assert Decimal(str(inv_after_pay2["paid_amount"])) == Decimal("5000.00")
    assert Decimal(str(inv_after_pay2["balance_due"])) == Decimal("0.00")
    assert inv_after_pay2["status"] == "paid"
