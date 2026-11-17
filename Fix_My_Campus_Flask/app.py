import os
import re
import secrets
from datetime import datetime, timezone
from functools import wraps

import mysql.connector
from flask import Flask, jsonify, render_template, request, session
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "replace-this-with-a-long-random-secret-key")
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "fix_my_campus"),
}

def db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def display_name(email):
    local = email.split("@", 1)[0]
    words = [w for w in re.split(r"[._-]+", local) if w and not w.isdigit()]
    return " ".join(w.capitalize() for w in words) or "Campus User"

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify(error="Please log in again."), 401
        return fn(*args, **kwargs)
    return wrapper

def complaint_dict(row):
    return {
        "id": row[0], "title": row[1], "reporterType": row[2],
        "reporterName": row[3], "department": row[4], "category": row[5],
        "facility": row[6] or "", "priority": row[7], "location": row[8],
        "description": row[9], "status": row[10],
        "createdAt": row[11].replace(tzinfo=timezone.utc).isoformat()
    }

@app.get("/")
def home():
    return render_template("index.html")

@app.post("/api/login")
def api_login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not email or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify(error="Enter a valid email address."), 400
    if len(password) < 6:
        return jsonify(error="Password must contain at least 6 characters."), 400
    try:
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, password_hash, display_name FROM users WHERE email=%s", (email,))
        user = cur.fetchone()
        if user:
            if not check_password_hash(user[2], password):
                cur.close(); conn.close()
                return jsonify(error="Incorrect password for this account."), 401
            user_id, saved_email, _, saved_name = user
            name = saved_name or display_name(saved_email)
        else:
            name = display_name(email)
            cur.execute(
                "INSERT INTO users (email, password_hash, display_name) VALUES (%s,%s,%s)",
                (email, generate_password_hash(password), name)
            )
            conn.commit()
            user_id = cur.lastrowid
            saved_email = email
        cur.close(); conn.close()
        session.clear()
        session["user_id"] = user_id
        session["email"] = saved_email
        session["display_name"] = name
        return jsonify(user={"id": user_id, "email": saved_email, "display_name": name})
    except mysql.connector.Error as exc:
        app.logger.exception("Database login error")
        return jsonify(error="Database connection failed. Check XAMPP MySQL and import database.sql."), 503

@app.get("/api/me")
def api_me():
    if not session.get("user_id"):
        return jsonify(user=None), 401
    return jsonify(user={"id": session["user_id"], "email": session["email"],
                         "display_name": session.get("display_name", "Campus User")})

@app.post("/api/logout")
def api_logout():
    session.clear()
    return jsonify(message="Logged out.")

@app.get("/api/complaints")
@login_required
def get_complaints():
    try:
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("""SELECT id,title,reporter_type,reporter_name,department,category,
                       facility,priority,location,description,status,created_at
                       FROM complaints ORDER BY created_at ASC""")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify(complaints=[complaint_dict(row) for row in rows])
    except mysql.connector.Error:
        app.logger.exception("Could not fetch complaints")
        return jsonify(error="Could not read complaints from MySQL."), 503

@app.post("/api/complaints")
@login_required
def create_complaint():
    data = request.get_json(silent=True) or {}
    required = ["title","reporterType","reporterName","department","category","priority","location","description"]
    if any(not str(data.get(key, "")).strip() for key in required):
        return jsonify(error="Please complete all required fields."), 400
    if data.get("priority") not in ("Normal", "High", "Urgent"):
        return jsonify(error="Invalid priority."), 400
    complaint_id = "FMC-" + secrets.token_hex(5).upper()
    try:
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("""INSERT INTO complaints
          (id,user_id,title,reporter_type,reporter_name,department,category,facility,priority,location,description,status)
          VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Pending')""",
          (complaint_id, session["user_id"], data["title"].strip(), data["reporterType"],
           data["reporterName"].strip(), data["department"], data["category"],
           data.get("facility", ""), data["priority"], data["location"].strip(), data["description"].strip()))
        conn.commit()
        cur.execute("""SELECT id,title,reporter_type,reporter_name,department,category,
                       facility,priority,location,description,status,created_at FROM complaints WHERE id=%s""",
                    (complaint_id,))
        item = complaint_dict(cur.fetchone())
        cur.close(); conn.close()
        return jsonify(complaint=item), 201
    except mysql.connector.Error:
        app.logger.exception("Could not create complaint")
        return jsonify(error="Could not save complaint to MySQL."), 503

@app.put("/api/complaints/<complaint_id>")
@login_required
def update_complaint(complaint_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("Pending", "In Progress", "Resolved"):
        return jsonify(error="Invalid complaint status."), 400
    try:
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE complaints SET status=%s WHERE id=%s", (status, complaint_id))
        if cur.rowcount == 0:
            cur.close(); conn.close()
            return jsonify(error="Complaint not found."), 404
        conn.commit()
        cur.execute("""SELECT id,title,reporter_type,reporter_name,department,category,
                       facility,priority,location,description,status,created_at FROM complaints WHERE id=%s""",
                    (complaint_id,))
        item = complaint_dict(cur.fetchone())
        cur.close(); conn.close()
        return jsonify(complaint=item)
    except mysql.connector.Error:
        app.logger.exception("Could not update complaint")
        return jsonify(error="Could not update complaint in MySQL."), 503

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
