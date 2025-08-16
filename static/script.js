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
  typingLi.classList.add("chat", "incoming", "typing-indicator");
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
  // Auto-scroll saat indikator 'mengetik' muncul
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
      const botMessageLi = createChatLi(data.answer, "incoming");
      chatbox.replaceChild(botMessageLi, typingIndicator);
    })
    .catch(() => {
      const errorLi = createChatLi(
        "Oops! Ada yang salah. Coba lagi nanti.",
        "incoming"
      );
       errorLi.querySelector("p").classList.add("error");
      chatbox.replaceChild(errorLi, typingIndicator);
    })
    .finally(() => {
      // Auto-scroll setelah jawaban diterima
      chatbox.scrollTo(0, chatbox.scrollHeight);
    });
};

const handleChat = () => {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = "";
  chatInput.style.height = "auto";

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  // Auto-scroll setelah pesan pengguna dikirim
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    generateResponse(userMessage);
  }, 600);
};

sendChatBtn.addEventListener("click", handleChat);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChat();
  }
});