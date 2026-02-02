const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 1. Ekşi Şeyler Ana Sayfasını Scrape Edip Seçim Panelini Oluşturan Fonksiyon
async function createSelectionPanel() {
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
                    #list { background: white; border: 1px solid #ddd; border-radius: 8px; max-width: 900px; margin-bottom:100px; }
                    .controls { position: fixed; bottom: 0; left: 0; width: 100%; background: white; padding: 20px; border-top: 1px solid #ccc; text-align: center; }
                    button { padding: 12px 30px; cursor: pointer; border: none; border-radius: 5px; font-weight: bold; font-size: 16px; }
                    #btn { background: #2ecc71; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    #btn:hover { background: #27ae60; }
                    #openBtn { background: #34495e; color: white; margin-left: 10px; }
                </style>
            </head>
            <body>
                <h2>Ekşi Şeyler Listesi</h2>
                <div id="list">${listItemsHtml}</div>
                <div class="controls">
                    <button id="btn">Seçilenleri Çek ve Hazırla</button>
                    <button id="openBtn" onclick="window.open('/okunanseyler.html', '_blank')">Okuma Sayfasını Aç</button>
                </div>
                <script>
                    document.getElementById("btn").addEventListener("click", async () => {
                        const links = Array.from(document.querySelectorAll(".entry-check:checked")).map(cb => cb.dataset.link);
                        if(links.length === 0) { alert("Lütfen önce seçim yapın!"); return; }
                        
                        document.getElementById("btn").innerText = "İşleniyor...";
                        const res = await fetch("/scrape-content", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({ links })
                        });
                        const result = await res.text();
                        document.getElementById("btn").innerText = "Seçilenleri Çek ve Hazırla";
                        alert(result);
                    });
                </script>
            </body>
            </html>`;
        
        fs.writeFileSync("veriseyler.html", finalHtml, "utf-8");
    } catch (err) { console.log("Hata:", err.message); }
}

// 2. Seçilen Linklerin İçindeki Content-Main Alanını Çeken Route
app.post("/scrape-content", async (req, res) => {
    const { links } = req.body;
    let combinedContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Okuma Sayfası - Ekşi Şeyler</title>
        <style>
            body { background-color: #1a1a1a; color: #ccc; font-family: 'Segoe UI', sans-serif; line-height: 1.6; padding: 50px; }
            .content-main { max-width: 800px; margin: 0 auto 100px auto; padding: 20px; background: #222; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            img { max-width: 100%; height: auto; border-radius: 5px; margin: 20px 0; }
            h1, h2 { color: #17FF00; }
            a { color: #17FF00; text-decoration: none; }
            hr { border: 0; height: 2px; background: #333; margin: 50px 0; }
            .content { font-size: 20px; transition: font-size 0.2s; }
        </style>
    </head>
    <body>`;

    for (const url of links) {
        try {
            console.log(`Çekiliyor: ${url}`);
            const { data } = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            });
            const $ = cheerio.load(data);
            
            // Sadece .content-main kısmını al
            const content = $(".content-main").html();
            const title = $("h1").text() || "Başlık Bulunamadı";

            if (content) {
                combinedContent += `
                    <section class="content-wrapper">
                        <h1 style="text-align:center; color:#17FF00;">${title}</h1>
                        <div class="content">${content}</div>
                    </section>
                    <hr/>`;
            }
        } catch (err) {
            combinedContent += `<p style="color:red;">Hata: ${url} çekilemedi.</p>`;
        }
    }

    // Kumanda Panel Scriptini Ekle
    combinedContent += `
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

    fs.writeFileSync("okunanseyler.html", combinedContent, "utf-8");
    res.send(links.length + " içerik başarıyla hazırlandı! 'Okuma Sayfasını Aç' butonuna basabilirsiniz.");
});

// Sunucu Başlatma
app.listen(3000, async () => {
    await createSelectionPanel();
    console.log("-----------------------------------------");
    console.log("SİSTEM AKTİF: http://localhost:3000/veriseyler.html");
    console.log("-----------------------------------------");
});

/*

node veriseyler.js

node server.js




*/