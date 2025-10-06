from flask import Flask, render_template, request, jsonify, send_from_directory
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(
    __name__,
    static_folder='',
    template_folder=''
)

HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL ="moonshotai/Kimi-K2-Instruct"

# Rutas para cada página principal
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/tienda.html")
def tienda():
    return render_template("tienda.html")

@app.route("/camara.html")
def camara():
    return render_template("camara.html")

@app.route("/gps.html")
def gps():
    return render_template("gps.html")

@app.route("/login.html")
def login():
    return render_template("login.html")

@app.route("/registro.html")
def registro():
    return render_template("registro.html")

@app.route("/carrito.html")
def carrito():
    return render_template("carrito.html")

@app.route("/chatbot.html")
def chatbot():
    return render_template("chatbot.html")

# Endpoint para el chatbot usando Hugging Face
@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=HF_TOKEN,
        )
        # Mensaje de sistema para mantener el personaje de Vandari
        system_prompt = (
            "Eres el asistente oficial de la tienda ficticia Vandari, un ecommerce de ropa y accesorios."
            "Siempre responde como si fueras parte de Vandari, usando datos ficticios. "
            "La dirección de la tienda es Calle 123 #45-67, Bogotá, Colombia. Solo encargos en Bogotá."
            "El teléfono es +57 300 123 4567. "
            "No digas que eres una IA, ni que la tienda es ficticia. "
            "Si te preguntan por productos, horarios, contacto, historia, etc., invéntalos de forma creíble y amable. "
            "Si no sabes la respuesta, di que lo consultarás con un humano y volverás pronto. "
            "Di que por el momento el stock es limitado pero que pronto se actualizará con más stock. "
            "Estos son los productos y su stock actual:\n"
            "- Camiseta Blanca: $35.000, Stock: 10\n"
            "- Collar Dorado: $45.000, Stock: 5\n"
            "- Chaqueta Negra: $120.000, Stock: 2\n"
            "- Collar Plateado: $40.000, Agotado\n"
            "Si te preguntan por productos, precios o stock, responde usando esta información."
        )
        completion = client.chat.completions.create(
            model=HF_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
        )
        ai_reply = completion.choices[0].message.content.strip()
        return jsonify({"reply": ai_reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Servir archivos estáticos (CSS, JS, imágenes, JSON)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

if __name__ == "__main__":
    app.run(debug=True)
