import random
import string

from fastapi.testclient import TestClient

from src import app as app_module

client = TestClient(app_module.app)


def random_email():
    return "testuser_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8)) + "@example.com"


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activities from the in-memory DB
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    email = random_email()
    activity = "Science Club"

    # Ensure the activity exists
    assert activity in app_module.activities

    # Ensure the email is not already present
    assert email not in app_module.activities[activity]["participants"]

    # Sign up
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    json_data = r.json()
    assert "Signed up" in json_data.get("message", "")

    # Verify it's added in the in-memory store
    assert email in app_module.activities[activity]["participants"]

    # Now remove the participant
    r2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r2.status_code == 200
    json2 = r2.json()
    assert "Removed" in json2.get("message", "")

    # Verify it's removed
    assert email not in app_module.activities[activity]["participants"]
