const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 1. Ekşi Şeyler'den ana listeyi çekip veriseyler.html oluşturan fonksiyon
async function createHtml() {
    try {
        const url = "https://eksiseyler.com";
        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const $ = cheerio.load(data);
        
        let listItemsHtml = "";
        $("a[href*='eksiseyler.com/']").each((i, el) => {
            const link = $(el).attr("href");
            const title = $(el).find(".hero-headline").text().trim() || $(el).find("img").attr("alt") || "Başlıksız";
            
            if (link && title !== "Başlıksız") {
                listItemsHtml += `
                    <div style="margin: 10px; border-bottom: 1px solid #eee; padding: 10px; display: flex; align-items: center; gap: 15px;">
                        <input type="checkbox" class="entry-check" data-link="${link}" style="transform: scale(1.3); cursor: pointer;">
                        <span style="color: #888; font-size: 0.9em;">${i + 1}.</span>
                        <a href="${link}" target="_blank" style="text-decoration: none; color: #2980b9; font-weight: 500;">${title}</a>
                    </div>`;
            }
        });

        const finalHtml = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Ekşi Şeyler - Seçim Paneli</title>
                <style>
                    body { font-family: sans-serif; padding: 30px; background: #fdfdfd; }
                    h2 { color: #333; border-bottom: 3px solid #2ecc71; display: inline-block; padding-bottom: 5px; }
                    #list { background: white; border: 1px solid #ddd; border-radius: 8px; max-width: 900px; margin-bottom: 80px;}
                    .controls { position: fixed; bottom: 0; left: 0; width: 100%; background: #fff; padding: 20px; border-top: 1px solid #ddd; text-align: center; }
                    button { padding: 12px 25px; cursor: pointer; border: none; border-radius: 5px; font-weight: bold; margin: 0 10px; }
                    #btn { background: #2ecc71; color: white; }
                    #openBtn { background: #34495e; color: white; }
                </style>
            </head>
            <body>
                <h2>Ekşi Şeyler Listesi</h2>
                <div id="list">${listItemsHtml}</div>
                <div class="controls">
                    <button id="btn">Seçilenleri Çek</button>
                    <button id="openBtn" onclick="window.open('okunanseyler.html', '_blank')">Okuma Sayfasını Aç</button>
                </div>
                <script>
                    document.getElementById("btn").addEventListener("click", async () => {
                        const links = Array.from(document.querySelectorAll(".entry-check:checked")).map(cb => cb.dataset.link);
                        if(links.length === 0) { alert("Lütfen önce seçim yapın!"); return; }
                        
                        document.getElementById("btn").innerText = "Veriler Çekiliyor...";
                        const res = await fetch("/save-links", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({ links })
                        });
                        alert(await res.text());
                        document.getElementById("btn").innerText = "Seçilenleri Çek";
                    });
                </script>
            </body>
            </html>`;
        
        fs.writeFileSync("veriseyler.html", finalHtml, "utf-8");
    } catch (err) { console.log("Hata:", err.message); }
}

// 2. Sunucu Rotaları
app.get("/veriseyler.html", (req, res) => {
    res.sendFile(path.join(__dirname, "veriseyler.html"));
});

// Linkleri alıp içerikleri okunanseyler.html'e kaydeden asıl kısım
app.post("/save-links", async (req, res) => {
    const { links } = req.body;
    
    let combinedHtml = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Okunan Şeyler</title>
    <style>
        body { background-color: #1a1a1a; color: #ccc; font-family: sans-serif; padding: 50px; line-height: 1.6; }
        .content-main { max-width: 850px; margin: 0 auto; background: #222; padding: 30px; border-radius: 10px; margin-bottom: 50px; }
        .content { font-size: 22px; transition: font-size 0.2s; }
        img { max-width: 100%; border-radius: 5px; margin: 15px 0; }
        h1 { color: #17FF00; text-align: center; }
        a { color: #17FF00; }
        hr { border: 0; height: 1px; background: #444; margin: 60px 0; }
    </style>
    </head><body>`;

    for (const url of links) {
        try {
            console.log("Çekiliyor: " + url);
            const { data } = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            });
            const $ = cheerio.load(data);
            
            const title = $("h1").text().trim();
            const content = $(".content-main").html();

            if (content) {
                combinedHtml += `
                <section>
                    <h1>${title}</h1>
                    <div class="content">${content}</div>
                </section>
                <hr/>`;
            }
        } catch (err) {
            combinedHtml += `<p style="color:red;">Hata: ${url} içeriği alınamadı.</p>`;
        }
    }

    // Senin Özel Panel Scriptin (Kumanda)
    combinedHtml += `
    <script>
   var punto = 60;
    var scrl = 2;
    var artis = 3;
    var ilk_bas = false;
    var ilk_bas_tekrari = 12;
    var hiz = 0;
    var yon = 0;
    var dongu = null;

    var boyut = sessionStorage.getItem("boyut") ? parseInt(sessionStorage.getItem("boyut")) : punto;
    
    // Stil Enjeksiyonu
    var style = document.createElement('style');
    style.innerHTML = \`
        #kutu { position: fixed; top: 150px; right: 20px; background: rgba(40, 40, 40, 0.9); color: white; padding: 10px; border-radius: 10px; z-index: 9999; font-family: sans-serif; text-align: center; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid #444; width: 80px; }
        #kutu button { cursor: pointer; padding: 8px 0; border-radius: 4px; border: none; background: #555; color: white; font-weight: bold; }
        #kutu button:hover { background: #17FF00; color: black; }
        #kutuheader { font-size: 12px; color: #17FF00; margin-bottom: 5px; }
    \`;
    document.head.appendChild(style);

    var btn = document.createElement("div");
    btn.id = "kutu";
    var header = document.createElement("div");
    header.id = "kutuheader";
    header.innerHTML = "%0<br>0:00<br>hız:0";

    function createBtn(txt, id, func) {
        let b = document.createElement("button");
        b.innerHTML = txt;
        b.id = id;
        b.onclick = func;
        return b;
    }

    btn.appendChild(header);
    btn.appendChild(createBtn("+1", "up", yukari));
    btn.appendChild(createBtn("-1", "down", asagi));
    btn.appendChild(createBtn("DUR", "dur", dur));
    btn.appendChild(createBtn("<<", "sizedown", sizedown));
    btn.appendChild(createBtn(">>", "sizeup", sizeup));
    btn.appendChild(createBtn("KYDT", "save", save));
    document.body.appendChild(btn);

    function metinleriGuncelle() {
        document.querySelectorAll(".content").forEach(el => {
            el.style.fontSize = boyut + "px";
        });
    }

    function yukari() { yon -= scrl; hiz--; durdur(); git(); }
    function asagi() { 
        if (!ilk_bas) { yon += (scrl * ilk_bas_tekrari); hiz = ilk_bas_tekrari; } 
        else { yon += scrl; hiz++; }
        ilk_bas = true; durdur(); git(); 
    }
    function durdur() { clearInterval(dongu); }
    function dur() { ilk_bas = false;    if (hiz != 0) {ilk_bas_tekrari = hiz;} yon = 0; hiz = 0; durdur(); }

function git() {
    if (yon === 0) return;
    var intervlhiz = 480 / Math.abs(yon);
    dongu = setInterval(() => {
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        var currentScroll = window.scrollY;
        var miktar = Math.round((currentScroll / maxScroll) * 100);

        // kalan mesafe
        var kalanMesafe = maxScroll - currentScroll;

        // hız: her intervalde kaç px kaydırıyorsun
        var pxPerStep = Math.sign(yon); 
        var stepsNeeded = kalanMesafe / Math.abs(pxPerStep);

        // kalan süre (ms cinsinden)
        var kalanSureMs = stepsNeeded * intervlhiz;

        // dakika ve saniye
        var dakika = Math.floor(kalanSureMs / 60000);
        var saniye = Math.floor((kalanSureMs % 60000) / 1000);

        header.innerHTML = "%" + miktar + "<br>" +
            dakika + ":" + (saniye < 10 ? "0" + saniye : saniye) +
            "<br>hız:" + hiz;

        window.scrollBy(0, pxPerStep);
    }, intervlhiz);
}


    function sizedown() { boyut -= artis; metinleriGuncelle(); }
    function sizeup() { boyut += artis; metinleriGuncelle(); }
    function save() { sessionStorage.setItem("boyut", boyut); alert("Boyut kaydedildi: " + boyut); }

    // Başlangıç ayarı
    metinleriGuncelle();
    </script>
    </body></html>`;

    fs.writeFileSync("okunanseyler.html", combinedHtml, "utf-8");
    res.send(links.length + " adet içerik başarıyla çekildi ve okunanseyler.html oluşturuldu!");
});

app.listen(3000, async () => {
    await createHtml();
    console.log("-----------------------------------------");
    console.log("Sistem çalışıyor: http://localhost:3000/veriseyler.html");
    console.log("-----------------------------------------");
});
/*

node veriseyler.js



*/