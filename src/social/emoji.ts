// Emoji for the reaction picker. Anything not listed can still be typed or pasted
// into the picker's box (the server accepts any single emoji).
const list = (s: string) => s.split(" ").filter(Boolean);

export const EMOJI_CATEGORIES: { name: string; icon: string; emoji: string[] }[] = [
  { name: "Smileys", icon: "😀", emoji: list("😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾 🫠 🫡 🫢 🫣 🫥") },
  { name: "Gestures", icon: "👍", emoji: list("👍 👎 👏 🙌 👐 🤲 🤝 🙏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✊ 👊 🤛 🤜 💪 🦾 🫶 👀 👁️ 🧠 🫀 👅 👄 💋 🫦") },
  { name: "Hearts", icon: "❤️", emoji: list("❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 🩷 🩵 🩶 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💯 💢 💥 💫 💦 💨 🕳️ 💬 💭 💤") },
  { name: "Fun", icon: "🎉", emoji: list("🎉 🎊 🎈 🎁 🏆 🥇 🥈 🥉 🏅 🎖️ ⭐ 🌟 ✨ 🔥 ⚡ 🌈 ☀️ 🌙 ❄️ 💎 👑 🎯 🎲 🎮 🕹️ 🧩 🃏 🎵 🎶 🎤 🎧 📸 🎬 🍿 🚀 💡 💰 🪙 📈 📉 ⏰ ⌛ 🔔 📣 🗿 🧨 🪄") },
  { name: "Food", icon: "🍕", emoji: list("🍕 🍔 🍟 🌭 🌮 🌯 🥪 🍝 🍜 🍣 🍱 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍿 🧂 🥨 🥐 🍞 🧀 🥚 🥓 🍳 🍎 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥑 🌶️ 🥕 🌽 🥦 🍄 ☕ 🍵 🧋 🥤 🍺 🍻 🥂 🍷 🧃") },
  { name: "Animals", icon: "🐶", emoji: list("🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐢 🐍 🦖 🦕 🐙 🦑 🦐 🦀 🐡 🐠 🐟 🐬 🐳 🦈 🐊 🦒 🦘 🐘 🦥 🦦 🐿️ 🌵 🌲 🌸 🌻 🍀 🍁") },
  { name: "Symbols", icon: "✅", emoji: list("✅ ❌ ❓ ❗ ‼️ ⁉️ ⚠️ 🚫 ⛔ 🆗 🆒 🆕 🆙 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ ➕ ➖ ✖️ ➗ 🔁 🔀 ▶️ ⏸️ ⏹️ ⏩ ⏪ 💲 ♻️ 🏁 🚩 🏳️‍🌈 🇺🇸 🇬🇧 🇨🇦 🇲🇽 🇧🇷 🇫🇷 🇩🇪 🇪🇸 🇮🇹 🇯🇵 🇰🇷 🇮🇳") },
];
