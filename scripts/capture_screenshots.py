import os
import time
from playwright.sync_api import sync_playwright

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUT_DIR = r"C:\Users\wondr\HermesWorkspace\open-client-portal\docs\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

pages = [
    ("dashboard.png", "http://localhost:5176/app"),
    ("clients.png", "http://localhost:5176/app/clients"),
    ("projects.png", "http://localhost:5176/app/projects"),
    ("deliverables.png", "http://localhost:5176/app/deliverables"),
    ("proposals.png", "http://localhost:5176/app/proposals"),
    ("invoices.png", "http://localhost:5176/app/invoices"),
    ("documents.png", "http://localhost:5176/app/documents"),
]

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=EDGE_PATH,
            headless=True,
            args=["--disable-gpu", "--no-sandbox"]
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Landing Page
        print("Capturing landing page...")
        page.goto("http://localhost:5176/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        landing_out = os.path.join(OUT_DIR, "landing.png")
        page.screenshot(path=landing_out, full_page=False)
        print(f"Captured landing.png ({os.path.getsize(landing_out)} bytes)")

        # 2. Login Page
        print("Capturing login page...")
        page.goto("http://localhost:5176/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        login_out = os.path.join(OUT_DIR, "login.png")
        page.screenshot(path=login_out, full_page=False)
        print(f"Captured login.png ({os.path.getsize(login_out)} bytes)")

        # 3. Agency Login
        print("Logging into Agency Workspace...")
        page.click("button:has-text('Agency Staff')")
        time.sleep(0.5)
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        print("Logged in successfully. Current URL:", page.url)

        # 4. Capture Agency pages
        for filename, url in pages:
            print(f"Navigating to {url}...")
            page.goto(url)
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            out_file = os.path.join(OUT_DIR, filename)
            page.screenshot(path=out_file, full_page=False)
            print(f"Captured {filename} ({os.path.getsize(out_file)} bytes)")

        # 5. Capture Public Proposal
        print("Capturing public proposal view...")
        page.goto("http://localhost:5176/proposal/demo-proposal-token-acme")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        prop_out = os.path.join(OUT_DIR, "public-proposal.png")
        page.screenshot(path=prop_out, full_page=False)
        print(f"Captured public-proposal.png ({os.path.getsize(prop_out)} bytes)")

        # 6. Client Portal Session
        print("Logging into Client Portal...")
        page.goto("http://localhost:5176/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        page.click("button:has-text('Client Portal')")
        time.sleep(0.5)
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        print("Logged into client portal. Current URL:", page.url)
        portal_out = os.path.join(OUT_DIR, "client-portal.png")
        page.screenshot(path=portal_out, full_page=False)
        print(f"Captured client-portal.png ({os.path.getsize(portal_out)} bytes)")

        browser.close()
        print("All showcase screenshots successfully captured!")

if __name__ == "__main__":
    capture()
