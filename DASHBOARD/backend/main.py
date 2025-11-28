from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import json, os
from routers.client_product import router as client_product_router

app = FastAPI()

# -----------------------------------------------------
# CORS
# -----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.middleware("http")
async def no_cache_middleware(request: Request, call_next):
    response = await call_next(request)
    if isinstance(response, JSONResponse):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# -----------------------------------------------------
# FILE PATHS
# -----------------------------------------------------
PRODUCTS_PATH = "products.json"
RELEASES_PATH = "releases.json"
CLIENTS_PATH = "clients.json"
UPDATES_PATH = "updates.json"
LICENSES_PATH = "licenses.json"
SETTINGS_PATH = "settings.json"
ARTIFACTS_PATH = "artifacts.json"
UPDATE_LOGS_PATH = "update_logs.json"



# -----------------------------------------------------
# HELPERS
# -----------------------------------------------------
def load_json(path: str):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def current_time():
    return datetime.now(timezone.utc).isoformat()


# -----------------------------------------------------
# MODELS (ONE COPY ONLY)
# -----------------------------------------------------
class Product(BaseModel):
    productId: int
    name: str
    sku: Optional[str] = ""
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    lastModified: Optional[str] = None

class Client(BaseModel):
    clientId: int
    name: str
    lastModified: Optional[str] = None

class ClientLocation(BaseModel):
    clientLocationId: int
    name: str

class Artifact(BaseModel):
    artifactId: int
    releaseId: int
    fileUrl: str
    hash: str
    signature: Optional[str] = None
    size: int
    createdAt: str

class UpdateLog(BaseModel):
    updateLogId: int
    clientId: int
    releaseId: int
    clientLocationId: Optional[int] = None
    installedAt: str
    status: str
    client: Client
    location: Optional[ClientLocation] = None

class ReleaseDependency(BaseModel):
    releaseDependencyId: int
    releaseId: int
    dependsOnReleaseId: int
    dependsOn: dict

class Release(BaseModel):
    releaseId: int
    productId: int
    version: str
    releaseType: str
    status: str
    releaseDate: str
    notes: Optional[str] = None
    artifacts: List[Artifact] = []
    updateLogs: List[UpdateLog] = []
    dependencies: List[ReleaseDependency] = []
    lastModified: Optional[str] = None



 # --------------------------
# PRODUCTS ENDPOINTS
# --------------------------

@app.get("/api/products")
async def get_products():
    return load_json(PRODUCTS_PATH)


@app.post("/api/products")
async def create_product(product: dict):
    print("\n✅ Incoming product:", product)

    try:
        products = load_json(PRODUCTS_PATH)
        releases = load_json(RELEASES_PATH)
        artifacts = load_json(ARTIFACTS_PATH)
        update_logs = load_json(UPDATE_LOGS_PATH)

        # ✅ Generate productId
        new_pid = max([p.get("productId", 0) for p in products], default=0) + 1
        product["productId"] = new_pid
        product["createdAt"] = current_time()
        product["lastModified"] = current_time()

        # ✅ Normalize optional fields
        product["clientId"] = product.get("clientId") or None
        product["clientName"] = product.get("clientName") or None

        # ✅ Default Release
        new_rid = max([r.get("releaseId", 0) for r in releases], default=0) + 1
        default_release = {
            "releaseId": new_rid,
            "productId": new_pid,
            "version": "1.0.0",
            "releaseType": "minor",
            "status": "draft",
            "releaseDate": current_time(),
            "notes": "Auto-generated initial release",
            "lastModified": current_time(),
            "artifacts": [],
            "updateLogs": [],
            "dependencies": [],
        }

        # ✅ Default Artifact
        new_aid = max([a.get("artifactId", 0) for a in artifacts], default=0) + 1
        default_artifact = {
            "artifactId": new_aid,
            "releaseId": new_rid,
            "fileUrl": "https://example.com/default.bin",
            "hash": "sha256:autogenerated",
            "signature": None,
            "size": 1500000,
            "createdAt": current_time()
        }

        # ✅ Default Update Log
        new_log_id = max([l.get("updateLogId", 0) for l in update_logs], default=0) + 1
        default_log = {
            "updateLogId": new_log_id,
            "clientId": 1,
            "releaseId": new_rid,
            "installedAt": current_time(),
            "status": "completed",
            "client": {"clientId": 1, "name": "Default Client"},
            "location": None
        }

        default_release["artifacts"].append(default_artifact)
        default_release["updateLogs"].append(default_log)

        releases.append(default_release)
        artifacts.append(default_artifact)
        update_logs.append(default_log)

        save_json(RELEASES_PATH, releases)
        save_json(ARTIFACTS_PATH, artifacts)
        save_json(UPDATE_LOGS_PATH, update_logs)

        products.append(product)
        save_json(PRODUCTS_PATH, products)

        return {**product, "releases": [default_release]}

    except Exception as e:
        print("❌ ERROR in create_product:", e)
        raise HTTPException(500, detail=str(e))


@app.put("/api/products/{product_id}")
async def update_product(product_id: int, updated: dict):
    products = load_json(PRODUCTS_PATH)

    for p in products:
        if p["productId"] == product_id:
            p.update(updated)
            p["lastModified"] = current_time()
            save_json(PRODUCTS_PATH, products)
            return p

    raise HTTPException(404, "Product not found")


@app.delete("/api/products/{product_id}")
async def delete_product(product_id: int):
    products = load_json(PRODUCTS_PATH)
    new_list = [p for p in products if p["productId"] != product_id]

    if len(new_list) == len(products):
        raise HTTPException(404, "Product not found")

    save_json(PRODUCTS_PATH, new_list)
    return {"message": "Product deleted"}




# --------------------------
# RELEASES ENDPOINTS
# --------------------------

def _load_releases():
    data = load_json(RELEASES_PATH)
    return data if isinstance(data, list) else []

def _save_releases(data):
    save_json(RELEASES_PATH, data)

def _find_release_index(items, rid):
    for i, r in enumerate(items):
        if int(r["releaseId"]) == int(rid):
            return i
    return -1


@app.get("/api/releases")
async def get_releases():
    return _load_releases()

@app.post("/api/releases")
async def create_release(release: Release):
    releases = _load_releases()
    data = release.dict()
    data["lastModified"] = current_time()

    idx = _find_release_index(releases, release.releaseId)
    if idx >= 0:
        releases[idx] = data
    else:
        releases.append(data)

    _save_releases(releases)
    return data

@app.delete("/api/releases/{release_id}")
async def delete_release(release_id: int):
    releases = _load_releases()
    new_list = [r for r in releases if int(r["releaseId"]) != release_id]
    _save_releases(new_list)
    return {"message": "deleted"}


########  ARTIFACTS  ########

@app.post("/api/releases/{release_id}/artifacts")
async def add_artifact(release_id: int, artifact: Artifact):
    releases = _load_releases()
    idx = _find_release_index(releases, release_id)
    if idx < 0:
        raise HTTPException(404, "Release not found")

    releases[idx].setdefault("artifacts", [])
    artifacts = releases[idx]["artifacts"]

    # upsert
    for i, a in enumerate(artifacts):
        if a["artifactId"] == artifact.artifactId:
            artifacts[i] = artifact.dict()
            break
    else:
        artifacts.append(artifact.dict())

    releases[idx]["lastModified"] = current_time()
    _save_releases(releases)
    return artifact


@app.delete("/api/releases/{release_id}/artifacts/{artifact_id}")
async def delete_artifact(release_id: int, artifact_id: int):
    releases = _load_releases()
    idx = _find_release_index(releases, release_id)

    artifacts = releases[idx].get("artifacts", [])
    releases[idx]["artifacts"] = [
        a for a in artifacts if a["artifactId"] != artifact_id
    ]
    releases[idx]["lastModified"] = current_time()
    _save_releases(releases)
    return {"deleted": artifact_id}


########  UPDATE LOGS  ########

@app.post("/api/releases/{release_id}/update-logs")
async def add_update_log(release_id: int, log: UpdateLog):
    releases = _load_releases()
    idx = _find_release_index(releases, release_id)

    releases[idx].setdefault("updateLogs", [])
    logs = releases[idx]["updateLogs"]

    # upsert
    for i, l in enumerate(logs):
        if l["updateLogId"] == log.updateLogId:
            logs[i] = log.dict()
            break
    else:
        logs.append(log.dict())

    releases[idx]["lastModified"] = current_time()
    _save_releases(releases)
    return log

@app.delete("/api/releases/{release_id}/update-logs/{log_id}")
async def delete_log(release_id: int, log_id: int):
    releases = _load_releases()
    idx = _find_release_index(releases, release_id)

    logs = releases[idx].get("updateLogs", [])
    releases[idx]["updateLogs"] = [
        l for l in logs if l["updateLogId"] != log_id
    ]
    releases[idx]["lastModified"] = current_time()
    _save_releases(releases)
    return {"deleted": log_id}


########  DEPENDENCIES  ########

@app.post("/api/releases/{release_id}/dependencies")
async def add_dep(release_id: int, dep: ReleaseDependency):
    releases = _load_releases()
    idx = _find_release_index(releases, release_id)

    releases[idx].setdefault("dependencies", [])
    deps = releases[idx]["dependencies"]

    # upsert
    for i, d in enumerate(deps):
        if d["releaseDependencyId"] == dep.releaseDependencyId:
            deps[i] = dep.dict()
            break
    else:
        deps.append(dep.dict())

    releases[idx]["lastModified"] = current_time()
    _save_releases(releases)
    return dep

@app.delete("/api/releases/{release_id}/dependencies/{dep_id}")
async def delete_dep(release_id: int, dep_id: int):
    releases = _load_releases()
    idx = _find_release_index(releases, release_id)

    releases[idx]["dependencies"] = [
        d for d in releases[idx].get("dependencies", [])
        if d["releaseDependencyId"] != dep_id
    ]
    releases[idx]["lastModified"] = current_time()
    _save_releases(releases)
    return {"deleted": dep_id}




# --------------------------
# CLIENTS ENDPOINTS  
# --------------------------

from fastapi import HTTPException

@app.get("/api/clients")
async def get_clients():
    """Return the full list of clients"""
    return load_json(CLIENTS_PATH)


@app.get("/api/clients/{client_id}")
async def get_client(client_id: int):
    clients = load_json(CLIENTS_PATH)
    client = next((c for c in clients if c["clientId"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@app.post("/api/clients")
async def create_client(client: dict):
    """
    Create a new client:
    - Auto assigns clientId
    - Auto sets createdAt and lastModified
    - Ensures required arrays exist
    """

    clients = load_json(CLIENTS_PATH)
    new_id = max([c["clientId"] for c in clients], default=0) + 1

    client["clientId"] = new_id
    client["createdAt"] = current_time()
    client["lastModified"] = current_time()

    # Ensure arrays exist
    client.setdefault("productIds", [])
    client.setdefault("releaseIds", [])
    client.setdefault("updateLogIds", [])
    client.setdefault("locations", [])

    clients.append(client)
    save_json(CLIENTS_PATH, clients)
    return client


@app.put("/api/clients/{client_id}")
async def update_client(client_id: int, updated_client: dict):
    """
    Replace full client object (as clients.tsx does)
    and update lastModified timestamp.
    """

    clients = load_json(CLIENTS_PATH)
    found = False

    for idx, client in enumerate(clients):
        if client["clientId"] == client_id:
            found = True

            updated_client["clientId"] = client_id
            updated_client["createdAt"] = client.get("createdAt", current_time())
            updated_client["lastModified"] = current_time()

            # Ensure arrays exist
            updated_client.setdefault("productIds", [])
            updated_client.setdefault("releaseIds", [])
            updated_client.setdefault("updateLogIds", [])
            updated_client.setdefault("locations", [])

            clients[idx] = updated_client
            break

    if not found:
        raise HTTPException(status_code=404, detail="Client not found")

    save_json(CLIENTS_PATH, clients)
    return updated_client


@app.delete("/api/clients/{client_id}")
async def delete_client(client_id: int):
    """Delete a client by ID."""

    clients = load_json(CLIENTS_PATH)
    updated = [c for c in clients if c["clientId"] != client_id]

    if len(updated) == len(clients):
        raise HTTPException(status_code=404, detail="Client not found")

    save_json(CLIENTS_PATH, updated)
    return {"message": "Client deleted"}






# --------------------------
# SERVER TIME ENDPOINT
# --------------------------
@app.get("/api/time")
async def get_server_time():
    return {"serverTime": current_time()}





# --------------------------
# SETTINGS ENDPOINTS
# --------------------------
SETTINGS_PATH = "settings.json"

@app.get("/api/settings")
async def get_settings():
    data = load_json(SETTINGS_PATH)
    if not data:
        raise HTTPException(status_code=404, detail="Settings not found")
    return data

@app.post("/api/settings/user")
async def update_user(user: dict):
    data = load_json(SETTINGS_PATH)
    if not data:
        raise HTTPException(status_code=404, detail="Settings not found")

    data["user"] = user
    save_json(SETTINGS_PATH, data)
    return {"message": "User updated successfully", "user": user}


@app.post("/api/settings/notifications")
async def add_notification(notification: dict):
    data = load_json(SETTINGS_PATH)
    if not data:
        raise HTTPException(status_code=404, detail="Settings not found")

    notifications = data.get("notifications", [])
    new_id = max([n["notificationId"] for n in notifications], default=0) + 1
    notification["notificationId"] = new_id
    notification["createdAt"] = current_time()
    notifications.insert(0, notification)
    data["notifications"] = notifications
    save_json(SETTINGS_PATH, data)

    return {"message": "Notification added successfully", "notification": notification}


@app.delete("/api/settings/notifications/{notification_id}")
async def delete_notification(notification_id: int):
    data = load_json(SETTINGS_PATH)
    if not data:
        raise HTTPException(status_code=404, detail="Settings not found")

    notifications = [
        n for n in data.get("notifications", [])
        if n["notificationId"] != notification_id
    ]
    data["notifications"] = notifications
    save_json(SETTINGS_PATH, data)
    return {"message": f"Notification {notification_id} deleted successfully"}




# --------------------------
# UPDATES ENDPOINTS
# --------------------------
@app.get("/api/updates")
async def get_updates():
    releases = load_json(RELEASES_PATH)
    products = load_json(PRODUCTS_PATH)

    merged = []
    for r in releases:
        prod = next((p for p in products if p.get("productId") == r.get("productId")), None)

        # ✅ guarantee safe fields
        changelog = r.get("changelog")
        if not isinstance(changelog, list):
            changelog = []

        notes = r.get("notes")
        if notes is None:
            notes = ""

        merged.append({
            "releaseId": r.get("releaseId", 0),
            "productId": r.get("productId", 0),
            "productName": prod["name"] if prod else "Unknown Product",
            "version": r.get("version", ""),
            "releaseType": r.get("releaseType", "minor"),
            "status": r.get("status", "draft"),
            "releaseDate": r.get("releaseDate", ""),
            "title": r.get("title", "(No Title Provided)"),   # ✅ always exists
            "notes": notes,                                   # ✅ always string
            "changelog": changelog,                           # ✅ always list
            "artifacts": r.get("artifacts", []),
            "dependencies": r.get("dependencies", []),
            "updateLogs": r.get("updateLogs", []),
            "lastModified": r.get("lastModified", "")
        })

    merged.sort(key=lambda x: x["releaseDate"], reverse=True)
    return merged

# --------------------------
# LICENSES ENDPOINTS
# --------------------------

@app.get("/api/licenses")
async def get_licenses():
    with open("licenses.json", "r") as f:
        licenses = json.load(f)
    return licenses


@app.get("/api/licenses/{license_id}")
async def get_license(license_id: int):
    """Fetch a single license by ID."""
    licenses = load_json(LICENSES_PATH)
    license_obj = next((l for l in licenses if l["licenseId"] == license_id), None)
    if not license_obj:
        raise HTTPException(status_code=404, detail="License not found")
    return license_obj

@app.post("/api/licenses")
async def create_license(license_data: dict):
    """Create a new license."""
    licenses = load_json(LICENSES_PATH)
    new_id = max([l["licenseId"] for l in licenses], default=0) + 1
    license_data["licenseId"] = new_id
    license_data["lastModified"] = current_time()
    licenses.append(license_data)
    save_json(LICENSES_PATH, licenses)
    return license_data

@app.put("/api/licenses/{license_id}")
async def update_license(license_id: int, updated_license: dict = Body(...)):
    print("\n--- UPDATE REQUEST ---")
    print("License ID:", license_id)
    print("Data received:", updated_license)
    print("-----------------------\n")

    licenses = load_json(LICENSES_PATH)
    found = False

    for idx, l in enumerate(licenses):
        if int(l["licenseId"]) == int(license_id):
            found = True
            updated_license["licenseId"] = license_id
            updated_license["lastModified"] = current_time()
            licenses[idx] = updated_license
            save_json(LICENSES_PATH, licenses)
            return updated_license

    if not found:
        print("❌ License not found in file!")
        raise HTTPException(status_code=404, detail="License not found")


@app.delete("/api/licenses/{license_id}")
async def delete_license(license_id: int):
    """Delete a license by ID."""
    licenses = load_json(LICENSES_PATH)
    new_licenses = [l for l in licenses if l["licenseId"] != license_id]
    if len(new_licenses) == len(licenses):
        raise HTTPException(status_code=404, detail="License not found")
    save_json(LICENSES_PATH, new_licenses)
    return {"message": f"License {license_id} deleted successfully"}

app.include_router(client_product_router)