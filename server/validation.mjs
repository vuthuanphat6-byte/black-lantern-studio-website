export function validateContact(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { error: "Dữ liệu gửi không hợp lệ." };
  const clean = (key) =>
    typeof input[key] === "string" ? input[key].normalize("NFC").trim() : "";
  const name = clean("name"),
    email = clean("email"),
    topic = clean("topic"),
    message = clean("message");
  if (clean("website")) return { error: "Không thể tiếp nhận yêu cầu này." };
  if (name.length < 2 || name.length > 100 || /[\r\n\x00-\x1f]/.test(name))
    return { error: "Họ tên cần từ 2 đến 100 ký tự." };
  if (
    email.length > 254 ||
    /[\r\n\x00-\x20]/.test(email) ||
    !/^([^@<>]+)@([^@<>]+\.[^@<>]+)$/.test(email)
  )
    return { error: "Vui lòng nhập địa chỉ email hợp lệ." };
  if (!["partnership", "press", "feedback", "other"].includes(topic))
    return { error: "Vui lòng chọn chủ đề liên hệ." };
  if (
    message.length < 20 ||
    message.length > 5000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(message)
  )
    return { error: "Lời nhắn cần từ 20 đến 5.000 ký tự." };
  return { value: { name, email: email.toLowerCase(), topic, message } };
}
