from fastapi import APIRouter, HTTPException
import json, os
from datetime import datetime

router = APIRouter()

DATA_FILE = os.path.join("data", "client_product.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


@router.get("/client-products")
def get_client_products():
    return load_data()


@router.post("/clients/{client_id}/assign/{product_id}")
def assign_client_product(client_id: int, product_id: int):
    db = load_data()

     
    for entry in db:
        if entry["clientId"] == client_id and entry["productId"] == product_id:
            raise HTTPException(status_code=400, detail="Already assigned")

    new_entry = {
        "id": int(datetime.now().timestamp()),
        "clientId": client_id,
        "productId": product_id,
        "assignedAt": datetime.utcnow().isoformat()
    }

    db.append(new_entry)
    save_data(db)

    return new_entry


@router.delete("/client-products/{id}")
def delete_assignment(id: int):
    db = load_data()
    new_db = [x for x in db if x["id"] != id]

    if len(db) == len(new_db):
        raise HTTPException(status_code=404, detail="Not found")

    save_data(new_db)
    return {"success": True}
