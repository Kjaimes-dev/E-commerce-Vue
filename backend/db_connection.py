import os
import pymysql
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

def get_connection():
    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),         
            user=os.getenv("DB_USER"),        
            password=os.getenv("DB_PASSWORD"), 
            database=os.getenv("DB_NAME"),    
            port=int(os.getenv("DB_PORT")),   
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except pymysql.MySQLError as e:
        print(f"Error al conectar con la base de datos: {e}")
        raise