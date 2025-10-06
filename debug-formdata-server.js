const express = require("express");
const multer = require("multer");
const app = express();

// Middleware para interceptar e debugar FormData
app.use("/debug", (req, res, next) => {
  console.log("=== DEBUG INTERCEPTOR ===");
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.headers["content-type"]);
  
  let body = "";
  req.on("data", chunk => {
    body += chunk.toString();
  });
  
  req.on("end", () => {
    console.log("Raw body:", body.substring(0, 500) + "...");
    
    // Procurar por "documentos" no body
    if (body.includes("documentos")) {
      console.log("❌ ENCONTRADO: Campo documentos no body!");
      const lines = body.split("\n");
      lines.forEach((line, index) => {
        if (line.includes("documentos")) {
          console.log(`Linha ${index}: ${line}`);
        }
      });
    } else {
      console.log("✅ Campo documentos NÃO encontrado no body");
    }
    
    res.json({ message: "Debug completo", hasDocumentos: body.includes("documentos") });
  });
});

app.listen(3003, () => {
  console.log("Debug server rodando na porta 3003");
});