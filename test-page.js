console.log("Testing page..."); fetch("http://localhost:8087/").then(r => r.text()).then(html => console.log("HTML length:", html.length)).catch(e => console.error("Error:", e))
