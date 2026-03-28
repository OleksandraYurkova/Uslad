import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="MdkGme3ZaIoSXpc1",
        database="uslad",
    )
