import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.models import (
    Organization, User, OrganizationMember, Client, ClientContact, 
    Project, Milestone, Task, Deliverable, Proposal, ProposalItem, 
    Invoice, InvoiceItem, Payment, Document, Comment, Notification, AuditLog
)
from app.auth import get_password_hash

def seed_database():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding demo agency and team members...")
        # 1. Organization
        org = Organization(
            name="Vortex Creative Agency",
            slug="vortex-creative",
            logo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
            branding_color="#4f46e5",
            currency="USD",
            timezone="America/New_York"
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # 2. Agency Users
        owner_pass = get_password_hash("AgencyOwner2026!")
        owner = User(
            email="owner@vortexagency.io",
            hashed_password=owner_pass,
            full_name="Alex Mercer",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            global_role="owner",
            is_active=True
        )
        db.add(owner)

        pm_user = User(
            email="sarah.pm@vortexagency.io",
            hashed_password=owner_pass,
            full_name="Sarah Jenkins",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
            global_role="manager",
            is_active=True
        )
        db.add(pm_user)
        db.commit()
        db.refresh(owner)
        db.refresh(pm_user)

        db.add(OrganizationMember(organization_id=org.id, user_id=owner.id, role="owner"))
        db.add(OrganizationMember(organization_id=org.id, user_id=pm_user.id, role="manager"))
        db.commit()

        # 3. Clients
        print("Seeding clients...")
        client_pass = get_password_hash("ClientPortal2026!")

        # Client 1: Acme Corp
        acme = Client(
            organization_id=org.id,
            name="Acme Global Technologies",
            company="Acme Corp Ltd",
            email="contact@acmeglobal.com",
            phone="+1 (555) 234-5678",
            website="https://acmeglobal.example.com",
            billing_address="100 Innovation Way, Suite 400, San Francisco, CA 94105",
            tax_id="US-EIN-94-2819021",
            status="active",
            currency="USD",
            notes="Key enterprise client. Quarterly retainer for full-stack platform development.",
            portal_enabled=True
        )
        db.add(acme)

        # Client 2: Nexus Retail
        nexus = Client(
            organization_id=org.id,
            name="Nexus Retail Group",
            company="Nexus E-Commerce Inc",
            email="partners@nexusretail.com",
            phone="+1 (555) 876-5432",
            website="https://nexusretail.example.com",
            billing_address="742 Market Street, Chicago, IL 60601",
            tax_id="US-EIN-36-8291034",
            status="active",
            currency="USD",
            notes="Fast-growing direct-to-consumer lifestyle brand.",
            portal_enabled=True
        )
        db.add(nexus)

        # Client 3: Lumina Health
        lumina = Client(
            organization_id=org.id,
            name="Lumina Health Labs",
            company="Lumina Health Technologies",
            email="info@luminahealth.org",
            phone="+1 (555) 432-1098",
            website="https://luminahealth.example.com",
            billing_address="1200 Healthcare Blvd, Boston, MA 02115",
            tax_id="US-EIN-04-1928472",
            status="active",
            currency="USD",
            notes="HIPAA-compliant telemedicine and patient engagement system.",
            portal_enabled=True
        )
        db.add(lumina)
        db.commit()
        db.refresh(acme)
        db.refresh(nexus)
        db.refresh(lumina)

        # 4. Client Portal Users & Contacts
        acme_user = User(
            email="client@acmeglobal.com",
            hashed_password=client_pass,
            full_name="David Vance",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            global_role="client",
            is_active=True
        )
        db.add(acme_user)
        db.commit()
        db.refresh(acme_user)

        db.add(ClientContact(
            client_id=acme.id,
            user_id=acme_user.id,
            name="David Vance",
            email="client@acmeglobal.com",
            phone="+1 (555) 234-5678",
            job_title="VP of Product",
            is_primary=True
        ))

        db.add(ClientContact(
            client_id=nexus.id,
            name="Elena Rostova",
            email="elena@nexusretail.com",
            phone="+1 (555) 876-5432",
            job_title="Chief Marketing Officer",
            is_primary=True
        ))
        db.commit()

        # 5. Projects
        print("Seeding projects and tasks...")
        now = datetime.utcnow()
        proj1 = Project(
            organization_id=org.id,
            client_id=acme.id,
            name="Acme Enterprise SaaS Analytics Dashboard",
            description="Complete overhaul of the core enterprise metrics, report generator, and multi-tenant admin portal.",
            status="in_progress",
            priority="urgent",
            budget=Decimal("45000.00"),
            currency="USD",
            progress=65,
            start_date=now - timedelta(days=30),
            target_date=now + timedelta(days=45)
        )
        db.add(proj1)

        proj2 = Project(
            organization_id=org.id,
            client_id=nexus.id,
            name="Nexus Mobile Commerce iOS & Android App",
            description="Native React Native mobile storefront featuring one-click checkout and live inventory sync.",
            status="in_progress",
            priority="high",
            budget=Decimal("32000.00"),
            currency="USD",
            progress=40,
            start_date=now - timedelta(days=15),
            target_date=now + timedelta(days=60)
        )
        db.add(proj2)

        proj3 = Project(
            organization_id=org.id,
            client_id=lumina.id,
            name="Lumina Telehealth Doctor-Patient Web Portal",
            description="HIPAA-grade video consultation scheduling and secure lab result delivery workspace.",
            status="planning",
            priority="medium",
            budget=Decimal("28000.00"),
            currency="USD",
            progress=15,
            start_date=now - timedelta(days=5),
            target_date=now + timedelta(days=90)
        )
        db.add(proj3)
        db.commit()
        db.refresh(proj1)
        db.refresh(proj2)
        db.refresh(proj3)

        # 6. Milestones & Tasks for Project 1
        m1 = Milestone(
            project_id=proj1.id,
            title="Sprint 1: UX Wireframing & Information Architecture",
            description="Produce complete user flow diagrams and high-fidelity Figma components.",
            due_date=now - timedelta(days=10),
            status="completed",
            order_index=1
        )
        m2 = Milestone(
            project_id=proj1.id,
            title="Sprint 2: Real-Time Analytics & TanStack Charts Engine",
            description="Build performant SVG charts and PostgreSQL aggregation views.",
            due_date=now + timedelta(days=14),
            status="in_progress",
            order_index=2
        )
        m3 = Milestone(
            project_id=proj1.id,
            title="Sprint 3: Enterprise Tenant RBAC & Audit Trail",
            description="Implement fine-grained access policies and session audit logs.",
            due_date=now + timedelta(days=35),
            status="pending",
            order_index=3
        )
        db.add_all([m1, m2, m3])
        db.commit()
        db.refresh(m1)
        db.refresh(m2)

        # Tasks for Project 1
        db.add_all([
            Task(
                project_id=proj1.id,
                milestone_id=m1.id,
                assigned_user_id=pm_user.id,
                title="Design System Token Specs & Color Palette",
                description="Finalize accessible color contrast tokens and dark mode theme variables.",
                status="done",
                priority="high",
                is_client_visible=True,
                due_date=now - timedelta(days=12)
            ),
            Task(
                project_id=proj1.id,
                milestone_id=m2.id,
                assigned_user_id=owner.id,
                title="Integrate Recharts KPI Sparklines and Aggregated Cash Flow",
                description="Connect live backend queries with memoized client-side rendering.",
                status="in_progress",
                priority="urgent",
                is_client_visible=True,
                due_date=now + timedelta(days=5)
            ),
            Task(
                project_id=proj1.id,
                milestone_id=m2.id,
                assigned_user_id=pm_user.id,
                title="Internal DB Index Optimization & Latency Benchmarks",
                description="Profile query execution plans on 500k synthetic metrics rows.",
                status="in_progress",
                priority="medium",
                is_client_visible=False,  # Internal only!
                due_date=now + timedelta(days=8)
            ),
            Task(
                project_id=proj1.id,
                milestone_id=m3.id,
                assigned_user_id=owner.id,
                title="Client Portal Deliverable Approvals Workflow Integration",
                description="Support client sign-off with feedback remarks and automated email alert.",
                status="todo",
                priority="high",
                is_client_visible=True,
                due_date=now + timedelta(days=20)
            )
        ])
        db.commit()

        # 7. Deliverables & Client Approvals
        print("Seeding deliverables...")
        deliv1 = Deliverable(
            project_id=proj1.id,
            title="Design System & Component Library V1.0",
            description="Figma interactive prototypes and responsive layout specification sheet.",
            file_url="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
            status="approved",
            client_feedback="Approved by VP of Product David Vance. Typography and token palette look clean and on-brand.",
            submitted_by_id=pm_user.id,
            approved_at=now - timedelta(days=8)
        )
        deliv2 = Deliverable(
            project_id=proj1.id,
            title="Interactive High-Fidelity Dashboard Prototype V2",
            description="Milestone 2 deliverable: Clickable interactive web demo with real-time analytics filters.",
            file_url="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
            status="pending_review",
            submitted_by_id=owner.id
        )
        db.add_all([deliv1, deliv2])
        db.commit()

        # 8. Proposals
        print("Seeding proposals and line items...")
        prop1 = Proposal(
            organization_id=org.id,
            client_id=acme.id,
            proposal_number="PROP-202610-0001",
            title="Acme Analytics Platform Development & Cloud Architecture",
            description="Comprehensive scope of work covering UX/UI design, REST API architecture, and database tuning.",
            subtotal=Decimal("45000.00"),
            tax_rate=Decimal("5.00"),
            tax_amount=Decimal("2250.00"),
            discount_amount=Decimal("2250.00"),
            total_amount=Decimal("45000.00"),
            currency="USD",
            status="accepted",
            public_token="demo-proposal-token-acme",
            expires_at=now + timedelta(days=60),
            accepted_at=now - timedelta(days=28),
            accepted_by_name="David Vance",
            signature_data="Signed digitally by David Vance (VP Product, Acme Corp) - IP 192.168.1.10"
        )
        db.add(prop1)
        db.commit()
        db.refresh(prop1)

        db.add_all([
            ProposalItem(
                proposal_id=prop1.id,
                description="Sprint 1: Discovery, UX/UI Design & System Token Spec",
                quantity=Decimal("1.00"),
                unit_price=Decimal("12000.00"),
                total_price=Decimal("12000.00"),
                order_index=0
            ),
            ProposalItem(
                proposal_id=prop1.id,
                description="Sprint 2: High-Performance Analytics Engine & API Microservices",
                quantity=Decimal("1.00"),
                unit_price=Decimal("18000.00"),
                total_price=Decimal("18000.00"),
                order_index=1
            ),
            ProposalItem(
                proposal_id=prop1.id,
                description="Sprint 3: Enterprise Tenant Portal & Automated Reporting Service",
                quantity=Decimal("1.00"),
                unit_price=Decimal("15000.00"),
                total_price=Decimal("15000.00"),
                order_index=2
            )
        ])
        db.commit()

        # 9. Invoices & Payments
        print("Seeding invoices and payments...")
        inv1 = Invoice(
            organization_id=org.id,
            client_id=acme.id,
            project_id=proj1.id,
            invoice_number="INV-202610-0001",
            status="paid",
            issue_date=now - timedelta(days=25),
            due_date=now - timedelta(days=11),
            subtotal=Decimal("15000.00"),
            tax_rate=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("15000.00"),
            paid_amount=Decimal("15000.00"),
            balance_due=Decimal("0.00"),
            currency="USD",
            notes="Initial project deposit (Sprint 1 kickoff).",
            payment_terms="Net 14 days"
        )
        db.add(inv1)
        db.commit()
        db.refresh(inv1)

        db.add(InvoiceItem(
            invoice_id=inv1.id,
            description="Milestone 1 Kickoff Deposit — UX Architecture & Design Tokens",
            quantity=Decimal("1.00"),
            unit_price=Decimal("15000.00"),
            total_price=Decimal("15000.00"),
            order_index=0
        ))

        db.add(Payment(
            invoice_id=inv1.id,
            organization_id=org.id,
            amount=Decimal("15000.00"),
            payment_method="bank_transfer",
            transaction_reference="WIRE-ACH-891024-ACME",
            notes="Wire received in full from Acme Corp operating account.",
            paid_at=now - timedelta(days=20)
        ))

        # Second invoice (Outstanding)
        inv2 = Invoice(
            organization_id=org.id,
            client_id=acme.id,
            project_id=proj1.id,
            invoice_number="INV-202610-0002",
            status="partially_paid",
            issue_date=now - timedelta(days=5),
            due_date=now + timedelta(days=9),
            subtotal=Decimal("15000.00"),
            tax_rate=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("15000.00"),
            paid_amount=Decimal("5000.00"),
            balance_due=Decimal("10000.00"),
            currency="USD",
            notes="Sprint 2 Progress Billing — Analytics Integration.",
            payment_terms="Net 14 days"
        )
        db.add(inv2)
        db.commit()
        db.refresh(inv2)

        db.add(InvoiceItem(
            invoice_id=inv2.id,
            description="Milestone 2 Intermediate Billing — Analytics Engine & Charts",
            quantity=Decimal("1.00"),
            unit_price=Decimal("15000.00"),
            total_price=Decimal("15000.00"),
            order_index=0
        ))

        db.add(Payment(
            invoice_id=inv2.id,
            organization_id=org.id,
            amount=Decimal("5000.00"),
            payment_method="credit_card",
            transaction_reference="STRIPE-CHG-984210",
            notes="Partial advance payment received via corporate card.",
            paid_at=now - timedelta(days=2)
        ))
        db.commit()

        # 10. Documents & Files
        print("Seeding documents...")
        db.add_all([
            Document(
                organization_id=org.id,
                client_id=acme.id,
                project_id=proj1.id,
                title="Master Services Agreement (MSA) — Vortex & Acme",
                file_name="Acme_Vortex_MSA_Executed.pdf",
                file_size=1048576,
                mime_type="application/pdf",
                file_path="uploads/Acme_Vortex_MSA_Executed.pdf",
                category="contracts",
                is_client_visible=True,
                uploaded_by_id=owner.id
            ),
            Document(
                organization_id=org.id,
                client_id=acme.id,
                project_id=proj1.id,
                title="Technical Architecture & Schema Specification V2",
                file_name="Acme_Tech_Spec_v2.pdf",
                file_size=2097152,
                mime_type="application/pdf",
                file_path="uploads/Acme_Tech_Spec_v2.pdf",
                category="deliverables",
                is_client_visible=True,
                uploaded_by_id=owner.id
            ),
            Document(
                organization_id=org.id,
                client_id=acme.id,
                project_id=proj1.id,
                title="Internal Profitability & Resource Allocation Model",
                file_name="Internal_Margin_Sheet.xlsx",
                file_size=524288,
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                file_path="uploads/Internal_Margin_Sheet.xlsx",
                category="general",
                is_client_visible=False,  # Internal Agency Confidential!
                uploaded_by_id=owner.id
            )
        ])
        db.commit()

        # 11. Comments
        print("Seeding comments and collaboration thread...")
        db.add_all([
            Comment(
                organization_id=org.id,
                project_id=proj1.id,
                author_id=acme_user.id,
                author_name="David Vance",
                content="Team, the prototype animations look very responsive! Are we on track for the Sprint 2 staging release next Tuesday?",
                is_internal=False,
                created_at=now - timedelta(days=2)
            ),
            Comment(
                organization_id=org.id,
                project_id=proj1.id,
                author_id=pm_user.id,
                author_name="Sarah Jenkins",
                content="Hi David! Yes, the Recharts integration is passing all unit tests and we are pushing the staging build on Monday morning.",
                is_internal=False,
                created_at=now - timedelta(days=1)
            ),
            Comment(
                organization_id=org.id,
                project_id=proj1.id,
                author_id=owner.id,
                author_name="Alex Mercer",
                content="Internal Note: Make sure the server-side cache headers for the analytics API are configured before the client staging demo.",
                is_internal=True,  # Internal only!
                created_at=now - timedelta(hours=6)
            )
        ])

        # 12. Notifications & Audit Logs
        print("Seeding audit logs and notifications...")
        db.add_all([
            Notification(
                organization_id=org.id,
                user_id=owner.id,
                title="Deliverable Approved",
                message="David Vance approved 'Design System & Component Library V1.0'.",
                link="/app/projects/1",
                is_read=False
            ),
            Notification(
                organization_id=org.id,
                user_id=acme_user.id,
                title="New Deliverable Ready for Review",
                message="Vortex Creative submitted 'Interactive High-Fidelity Dashboard Prototype V2'.",
                link="/portal/dashboard",
                is_read=False
            ),
            AuditLog(
                organization_id=org.id,
                actor_name="Alex Mercer",
                action="organization.initialized",
                resource_type="organization",
                resource_id=str(org.id),
                metadata_json='{"name": "Vortex Creative Agency"}'
            ),
            AuditLog(
                organization_id=org.id,
                actor_name="David Vance",
                action="proposal.accepted",
                resource_type="proposal",
                resource_id="1",
                metadata_json='{"proposal_number": "PROP-202610-0001", "total": "45000.00"}'
            )
        ])
        db.commit()

        print("\n========================================================")
        print(" Demo Data Successfully Seeded!")
        print("========================================================")
        print(" Agency Owner Login:")
        print("   Email:    owner@vortexagency.io")
        print("   Password: AgencyOwner2026!")
        print("--------------------------------------------------------")
        print(" Client Portal User Login:")
        print("   Email:    client@acmeglobal.com")
        print("   Password: ClientPortal2026!")
        print("========================================================\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
