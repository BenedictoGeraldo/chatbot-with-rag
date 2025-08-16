const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");

const API_ENDPOINT = "/chat"; // Endpoint backend kita

const createChatLi = (message, className) => {
  // Buat elemen <li> dengan pesan dan class
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent =
    className === "outgoing"
      ? `<p></p>`
      : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

const createTypingIndicator = () => {
  // Buat elemen indikator "sedang mengetik"
  const typingLi = document.createElement("li");
  typingLi.classList.add("chat", "incoming");
  typingLi.innerHTML = `
        <span class="material-symbols-outlined">smart_toy</span>
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
  return typingLi;
};

const generateResponse = (userMessage) => {
  const typingIndicator = createTypingIndicator();
  chatbox.appendChild(typingIndicator);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  // Kirim permintaan POST ke backend
  fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: userMessage }),
  })
    .then((res) => res.json())
    .then((data) => {
      const botMessageLi = typingIndicator.querySelector("p")
        ? typingIndicator
        : createChatLi("", "incoming");
      // Ganti indikator dengan pesan asli dari bot
      botMessageLi.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><p>${data.answer}</p>`;
    })
    .catch(() => {
      const errorLi = createChatLi(
        "Oops! Ada yang salah. Coba lagi nanti.",
        "incoming"
      );
      errorLi.querySelector("p").classList.add("error");
      chatbox.replaceChild(errorLi, typingIndicator);
    })
    .finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
};

const handleChat = () => {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Hapus textarea dan sesuaikan tingginya
  chatInput.value = "";
  chatInput.style.height = "auto";

  // Tampilkan pesan pengguna di chatbox
  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  // Panggil fungsi untuk mendapatkan respons dari bot
  setTimeout(() => {
    generateResponse(userMessage);
  }, 600);
};

// Event listener untuk tombol kirim
sendChatBtn.addEventListener("click", handleChat);

// Event listener untuk tombol Enter
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChat();
  }
});