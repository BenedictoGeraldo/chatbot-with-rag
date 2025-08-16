import os
from flask import Flask, render_template, request, jsonify
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.vectorstores import FAISS
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Konfigurasi API Key Google Anda
# Sebaiknya gunakan environment variable untuk keamanan
os.environ["GOOGLE_API_KEY"] = "AIzaSyB2TgGkUdPUrWh1LGe1T3iYOjm_Vcd8Zr0"

# Inisialisasi aplikasi Flask
app = Flask(__name__)

# --- LANGKAH 1: MEMUAT DAN MEMPROSES DATA ---
# Muat data dari knowledge_base.txt
with open("knowledge_base.txt", "r") as f:
    knowledge_base_text = f.read()

# Potong teks menjadi bagian-bagian kecil (chunks)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
documents = text_splitter.create_documents([knowledge_base_text])

# --- LANGKAH 2: MEMBUAT EMBEDDING DAN VECTOR STORE ---
# Inisialisasi model embedding
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Buat FAISS vector store dari dokumen
# Ini adalah "Peta Makna" kita
vector_store = FAISS.from_documents(documents, embeddings)

# Buat retriever untuk mencari informasi yang relevan
retriever = vector_store.as_retriever()

# --- LANGKAH 3: MEMBUAT RAG CHAIN DENGAN LANGCHAIN ---
# Inisialisasi model LLM (Gemini Pro)
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)

# Buat template prompt
# Ini adalah instruksi kita untuk LLM
prompt_template = """
Anda adalah asisten virtual yang ramah dan membantu.
Jawab pertanyaan pengguna hanya berdasarkan konteks yang diberikan di bawah ini.
Jika informasi tidak ditemukan dalam konteks, jawab dengan sopan bahwa Anda tidak memiliki informasi tersebut.
Jangan mencoba mengarang jawaban.

Konteks:
{context}

Pertanyaan:
{input}

Jawaban yang membantu:
"""
prompt = PromptTemplate.from_template(prompt_template)

# Buat "stuff documents chain" untuk menggabungkan dokumen ke dalam prompt
document_chain = create_stuff_documents_chain(llm, prompt)

# Buat "retrieval chain" yang mengintegrasikan retriever dan document chain
# Ini adalah inti dari RAG kita
retrieval_chain = create_retrieval_chain(retriever, document_chain)


# --- LANGKAH 4: MEMBUAT ENDPOINT FLASK ---
@app.route("/")
def index():
    """Menyajikan halaman utama chatbot."""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Menerima pesan dari pengguna dan mengembalikan respons dari RAG chain."""
    try:
        user_message = request.json["message"]

        # Panggil RAG chain untuk mendapatkan jawaban
        response = retrieval_chain.invoke({"input": user_message})

        # Ambil hanya bagian 'answer' dari respons
        answer = response.get("answer", "Maaf, terjadi kesalahan saat memproses jawaban.")

        return jsonify({"answer": answer})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"answer": "Maaf, server sedang mengalami masalah."}), 500


if __name__ == "__main__":
    app.run(debug=True)