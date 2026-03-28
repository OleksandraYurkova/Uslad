from flask import Flask, render_template, request, jsonify
from db import get_db
from datetime import datetime, timedelta
from decimal import Decimal

app = Flask(__name__)

# VI block
@app.get("/")
def index():
    cnx = get_db()
    cur = cnx.cursor(dictionary=True)

    cur.execute("""
        SELECT CottageTypeID, CottageType, Description
        FROM CottageType
        ORDER BY CottageTypeID
    """)
    cottages = cur.fetchall()

    cur.close()
    cnx.close()

    # фото не з БД — тимчасова мапа по ID
    images_map = {
        1: [url_for("static", filename="images/standart.jpg")],
        2: [url_for("static", filename="images/vip.jpg")],
        3: [url_for("static", filename="images/water.jpg")],
        4: [url_for("static", filename="images/sauna.jpg")],
    }

    return render_template("index.html", cottages=cottages, images_map=images_map)

from flask import url_for

def calculate_estimated_price(
    checkin_date,
    checkout_date,
    price_weekday,
    price_weekend,
    extra_place_price,
    pet_price,
    extra_count,
    pets_count,
):
    nights = (checkout_date - checkin_date).days
    if nights <= 0:
        return Decimal("0.00"), 0

    total = Decimal("0.00")
    d = checkin_date

    for _ in range(nights):
        # ✅ ВИХІДНІ: Пт-Сб-Нд
        is_weekend = d.weekday() in (4, 5, 6)  # Fri=4 Sat=5 Sun=6
        total += price_weekend if is_weekend else price_weekday
        d += timedelta(days=1)

    # extra і pets — за кожну ніч
    total += Decimal(extra_count) * extra_place_price * Decimal(nights)
    if pets_count > 0:
        total += Decimal(pets_count) * pet_price * Decimal(nights)

    return total.quantize(Decimal("0.01")), nights


@app.post("/api/estimate")
def api_estimate():
    checkin = request.form.get("checkin")
    checkout = request.form.get("checkout")
    cottage_type_name = (request.form.get("cottage_type") or "").strip()
    extra = int(request.form.get("extra_place_count", 0))
    pets = int(request.form.get("pets_count", 0))

    if not checkin or not checkout or not cottage_type_name:
        return jsonify({"ok": True, "estimated_price": "0.00", "nights": 0})

    checkin_date = datetime.strptime(checkin, "%Y-%m-%d").date()
    checkout_date = datetime.strptime(checkout, "%Y-%m-%d").date()

    cnx = get_db()
    cur = cnx.cursor()
    cur.execute(
        """
        SELECT PriceWeekday, PriceWeekend, ExtraPlacePrice, PetPrice
        FROM CottageType
        WHERE CottageType=%s
        LIMIT 1
        """,
        (cottage_type_name,),
    )
    row = cur.fetchone()
    cur.close()
    cnx.close()

    if not row:
        return jsonify({"ok": False, "error": "Невірний тип котеджу"}), 400

    price_weekday = Decimal(str(row[0]))
    price_weekend = Decimal(str(row[1]))
    extra_place_price = Decimal(str(row[2]))
    pet_price = Decimal(str(row[3]))

    estimated_price, nights = calculate_estimated_price(
        checkin_date,
        checkout_date,
        price_weekday,
        price_weekend,
        extra_place_price,
        pet_price,
        extra,
        pets,
    )

    return jsonify({"ok": True, "estimated_price": str(estimated_price), "nights": nights})


@app.post("/book")
def book():
    full_name = (request.form.get("full_name") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    email = (request.form.get("email") or "").strip()
    comment = (request.form.get("comment") or "").strip()

    checkin = request.form.get("checkin")
    checkout = request.form.get("checkout")
    cottage_type_name = (request.form.get("cottage_type") or "").strip()

    adults = int(request.form.get("adults", 1))
    kids = int(request.form.get("kids", 0))
    extra = int(request.form.get("extra_place_count", 0))
    pets = int(request.form.get("pets_count", 0))

    if not (checkin and checkout and cottage_type_name and full_name and phone and email):
        return jsonify({"ok": False, "error": "Заповніть всі обов’язкові поля"}), 400

    checkin_date = datetime.strptime(checkin, "%Y-%m-%d").date()
    checkout_date = datetime.strptime(checkout, "%Y-%m-%d").date()

    parts = full_name.split()
    last_name = parts[0] if len(parts) >= 1 else ""
    first_name = " ".join(parts[1:]) if len(parts) >= 2 else ""

    cnx = get_db()
    cur = cnx.cursor()

    # 1) CottageType + ціни
    cur.execute(
        """
        SELECT CottageTypeID, PriceWeekday, PriceWeekend, ExtraPlacePrice, PetPrice
        FROM CottageType
        WHERE CottageType=%s
        LIMIT 1
        """,
        (cottage_type_name,),
    )
    row = cur.fetchone()
    if not row:
        cnx.rollback()
        cur.close()
        cnx.close()
        return jsonify({"ok": False, "error": "Невірний тип котеджу"}), 400

    cottage_type_id = row[0]
    price_weekday = Decimal(str(row[1]))
    price_weekend = Decimal(str(row[2]))
    extra_place_price = Decimal(str(row[3]))
    pet_price = Decimal(str(row[4]))

    estimated_price, nights = calculate_estimated_price(
        checkin_date,
        checkout_date,
        price_weekday,
        price_weekend,
        extra_place_price,
        pet_price,
        extra,
        pets,
    )

    # 2) Guest
    cur.execute(
        """
        INSERT INTO Guest (FirstName, LastName, Phone, Email)
        VALUES (%s, %s, %s, %s)
        """,
        (first_name, last_name, phone, email),
    )
    guest_id = cur.lastrowid

       # 3) Booking
    cur.execute(
        """
        INSERT INTO Booking
        (GuestID, CottageTypeID, CheckinDate, CheckoutDate,
         AdultsCount, ChildrenCount, ExtraPlaceCount, PetsCount,
         EstimatedPrice, Comment, BookingStatus)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            guest_id,
            cottage_type_id,
            checkin_date,
            checkout_date,
            adults,
            kids,
            extra,
            pets,
            estimated_price,
            comment,
            "pending",
        ),
    )

    cnx.commit()
    cur.close()
    cnx.close()

    return jsonify(
        {
            "ok": True,
            "message": "Вашу заявку прийнято. Очікуйте на підтвердження.",
            "estimated_price": str(estimated_price),
            "nights": nights,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)