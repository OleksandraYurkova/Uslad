from flask import Flask, render_template, request, jsonify, url_for
from db import get_db
from datetime import datetime, timedelta
from decimal import Decimal

app = Flask(__name__)

def calculate_estimated_price(
    checkin_date, 
    checkout_date, 
    prices, 
    extra_place_price, 
    pet_price, 
    extra_count, 
    pets_count,
    adults,
    children
):
    nights = (checkout_date - checkin_date).days
    if nights <= 0:
        return Decimal("0.00"), 0

    total_base_price = Decimal("0.00")
    total_guests = adults + children
    current_day = checkin_date

    for _ in range(nights):
        is_weekend = current_day.weekday() in (4, 5, 6)
        day_type = 'weekend' if is_weekend else 'weekday'
        
        price_per_person = prices.get(day_type, prices.get('weekday'))
        
        total_base_price += price_per_person * Decimal(total_guests)
        current_day += timedelta(days=1)

    extra_charges = (Decimal(extra_count) * extra_place_price * Decimal(nights))
    
    pet_charges = Decimal("0.00")
    if pets_count > 0:
        pet_charges = pet_price * Decimal(nights)

    total = total_base_price + extra_charges + pet_charges
    return total.quantize(Decimal("0.01")), nights

@app.route("/")
def home():
    cnx = get_db()
    cur = cnx.cursor(dictionary=True)

    # КОТЕДЖІ
    cur.execute("""
        SELECT CottageTypeID, Name, ShortDescription,
               CheckInTime, CheckOutTime
        FROM CottageType
        ORDER BY CottageTypeID
    """)
    cottages = cur.fetchall()

    # ВІДГУКИ
    cur.execute("""
        SELECT *
        FROM Review
        ORDER BY CreatedAt DESC
    """)
    reviews = cur.fetchall()

    cur.close()
    cnx.close()

    images_map = {
        1: [url_for("static", filename="images/standart.jpg")],
        2: [url_for("static", filename="images/vip.jpg")],
        3: [url_for("static", filename="images/water.jpg")],
        4: [url_for("static", filename="images/sauna.jpg")],
    }

    return render_template(
        "index.html",
        cottages=cottages,
        images_map=images_map,
        reviews=reviews
    )

@app.post("/api/estimate")
def api_estimate():
    data = request.form
    checkin = data.get("checkin")
    checkout = data.get("checkout")
    cottage_type_name = (data.get("cottage_type") or "").strip()
    
    adults = int(data.get("adults", 1))
    kids = int(data.get("kids", 0))
    extra = int(data.get("extra_place_count", 0))
    pets = int(data.get("pets_count", 0))

    if not checkin or not checkout or not cottage_type_name:
        return jsonify({"ok": True, "estimated_price": "0.00", "nights": 0})

    try:
        checkin_date = datetime.strptime(checkin, "%Y-%m-%d").date()
        checkout_date = datetime.strptime(checkout, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"ok": False, "error": "Невірний формат дати"}), 400

    cnx = get_db()
    cur = cnx.cursor(dictionary=True)

    cur.execute("""
        SELECT ct.CottageTypeID, ct.ExtraPlacePrice, ct.PetPrice, ctp.DayType, ctp.PricePerNight
        FROM CottageType ct
        JOIN CottageTypePrice ctp ON ct.CottageTypeID = ctp.CottageTypeID
        WHERE ct.Name = %s
    """, (cottage_type_name,))
    
    rows = cur.fetchall()
    cur.close()
    cnx.close()

    if not rows:
        return jsonify({"ok": False, "error": "Тип котеджу не знайдено"}), 400

    prices = {row['DayType']: Decimal(str(row['PricePerNight'])) for row in rows}
    
    estimated_price, nights = calculate_estimated_price(
        checkin_date, checkout_date, prices, 
        Decimal(str(rows[0]['ExtraPlacePrice'])), 
        Decimal(str(rows[0]['PetPrice'])), 
        extra, pets, adults, kids
    )

    return jsonify({"ok": True, "estimated_price": str(estimated_price), "nights": nights})


@app.post("/book")
def book():
    f = request.form
    full_name = f.get("full_name", "").strip()
    phone = f.get("phone", "").strip()
    email = f.get("email", "").strip()
    checkin = f.get("checkin")
    checkout = f.get("checkout")
    cottage_type_name = f.get("cottage_type", "").strip()
    
    adults = int(f.get("adults", 1))
    kids = int(f.get("kids", 0))
    extra = int(f.get("extra_place_count", 0))
    pets_count = int(f.get("pets_count", 0))
    comment = f.get("comment", "").strip()

    if not (checkin and checkout and cottage_type_name and full_name and phone and email):
        return jsonify({"ok": False, "error": "Будь ласка, заповніть усі обов'язкові поля"}), 400

    try:
        checkin_date = datetime.strptime(checkin, "%Y-%m-%d").date()
        checkout_date = datetime.strptime(checkout, "%Y-%m-%d").date()
        
        parts = full_name.split()
        last_name = parts[0] if len(parts) >= 1 else "Гість"
        first_name = " ".join(parts[1:]) if len(parts) >= 2 else "-"

        cnx = get_db()
        cur = cnx.cursor(dictionary=True)

        cur.execute("""
            SELECT ct.CottageTypeID, ct.ExtraPlacePrice, ct.PetPrice, ctp.DayType, ctp.PricePerNight
            FROM CottageType ct
            JOIN CottageTypePrice ctp ON ct.CottageTypeID = ctp.CottageTypeID
            WHERE ct.Name = %s
        """, (cottage_type_name,))
        
        price_rows = cur.fetchall()
        if not price_rows:
            return jsonify({"ok": False, "error": "Тип котеджу не знайдено"}), 400

        prices = {r['DayType']: Decimal(str(r['PricePerNight'])) for r in price_rows}
        ct_id = price_rows[0]['CottageTypeID']
        
        estimated_price, nights = calculate_estimated_price(
            checkin_date, checkout_date, prices, 
            Decimal(str(price_rows[0]['ExtraPlacePrice'])), 
            Decimal(str(price_rows[0]['PetPrice'])), 
            extra, pets_count, adults, kids
        )

        cur.execute("SELECT GuestID FROM Guest WHERE Email = %s", (email,))
        existing_guest = cur.fetchone()
        
        if existing_guest:
            guest_id = existing_guest['GuestID']
        else:
            cur.execute(
                "INSERT INTO Guest (FirstName, LastName, Phone, Email) VALUES (%s, %s, %s, %s)",
                (first_name, last_name, phone, email)
            )
            guest_id = cur.lastrowid

        cur.execute("""
            INSERT INTO Booking (
                GuestID, CottageTypeID, CheckInDate, CheckOutDate, 
                ExtraPlaces, Pets, AdultsCount, ChildrenCount, TotalPrice, Status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
        """, (
            guest_id, ct_id, checkin_date, checkout_date, 
            extra, (1 if pets_count > 0 else 0), adults, kids, estimated_price
        ))
        
        booking_id = cur.lastrowid

        if comment:
            cur.execute(
                "INSERT INTO BookingComment (BookingID, Comment) VALUES (%s, %s)", 
                (booking_id, comment)
            )

        cnx.commit()
        cur.close()
        cnx.close()

        return jsonify({
            "ok": True, 
            "message": "Вашу заявку прийнято! Очікуйте на підтвердження.",
            "total": str(estimated_price),
            "nights": nights
        })

    except Exception as e:
        if 'cnx' in locals(): cnx.rollback()
        return jsonify({"ok": False, "error": f"Помилка сервера: {str(e)}"}), 500


@app.route("/submit_review", methods=["POST"])
def submit_review():
    from db import get_db  # 👈 ДОДАЙ

    cnx = get_db()
    cursor = cnx.cursor()

    name = request.form.get("full_name")
    rating = request.form.get("rating")
    comment = request.form.get("comment")

    if not name or not rating:
        return jsonify({"success": False})

    query = """
        INSERT INTO Review (AuthorName, Rating, Comment)
        VALUES (%s, %s, %s)
    """
    cursor.execute(query, (name, rating, comment))
    cnx.commit()

    cursor.close()
    cnx.close()

    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True)
