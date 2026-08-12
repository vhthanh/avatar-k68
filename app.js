const photoInput = document.getElementById("photoInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const frame = new Image();
frame.src = "khung-k68.png";

const editor = document.getElementById("editor");
const zoom = document.getElementById("zoom");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");

let photo = null;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let lastX = 0, lastY = 0;
let frameReady = false;

frame.onload = () => { frameReady = true; draw(); };
frame.onerror = () => { message.textContent = "Không tải được khung K68. Hãy kiểm tra file khung-k68.png."; };

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    message.textContent = "Vui lòng chọn một file ảnh.";
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    photo = img;
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    zoom.value = "1";
    editor.classList.remove("hidden");
    message.textContent = "Đã ghép khung. Bạn có thể kéo ảnh để căn khuôn mặt.";
    draw();
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    message.textContent = "Không đọc được ảnh này.";
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

zoom.addEventListener("input", () => {
  scale = Number(zoom.value);
  draw();
});

function drawCoverImage(img, x, y, userScale) {
  const W = canvas.width, H = canvas.height;
  // Clip ảnh người dùng vào vòng tròn bên trong khung.
  // Tọa độ được khớp theo file khung K68 1722x1723.
  const sx = W / 1722;
  const cx = 861 * sx, cy = 862 * (H / 1723);
  const radius = 690 * sx;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const base = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const s = base * userScale;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = (W - dw) / 2 + x;
  const dy = (H - dh) / 2 + y;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  if (photo) drawCoverImage(photo, offsetX, offsetY, scale);
  if (frameReady) ctx.drawImage(frame, 0, 0, W, H);
}

function pointerPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return {x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy};
}

canvas.addEventListener("pointerdown", e => {
  if (!photo) return;
  dragging = true;
  const p = pointerPosition(e);
  lastX = p.x; lastY = p.y;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", e => {
  if (!dragging || !photo) return;
  const p = pointerPosition(e);
  offsetX += p.x - lastX;
  offsetY += p.y - lastY;
  lastX = p.x; lastY = p.y;
  draw();
});

canvas.addEventListener("pointerup", e => {
  dragging = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
});
canvas.addEventListener("pointercancel", () => dragging = false);

downloadBtn.addEventListener("click", () => {
  if (!photo) {
    message.textContent = "Hãy chọn ảnh trước.";
    return;
  }
  draw();
  canvas.toBlob(blob => {
    if (!blob) {
      message.textContent = "Không tạo được ảnh. Hãy thử lại.";
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Avatar-K68-Truong-Dai-hoc-Quang-Binh.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    message.textContent = "Đã tải ảnh. Bạn có thể dùng ảnh này làm avatar Facebook.";
  }, "image/png");
});

resetBtn.addEventListener("click", () => {
  photo = null;
  photoInput.value = "";
  editor.classList.add("hidden");
  message.textContent = "";
  ctx.clearRect(0,0,canvas.width,canvas.height);
});
