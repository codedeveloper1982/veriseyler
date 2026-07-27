@echo off
echo Değisiklikler Git'e yukleniyor...

:: Proje klasorune git
cd /d "%~dp0"

:: Tum degisiklikleri stage alanina ekle
git add .

:: Tarih ve saat ile otomatik commit mesaji olustur
set COMMIT_MSG=Otomatik commit - %date% %time:~0,5%
git commit -m "%COMMIT_MSG%"

:: Degisiklikleri GitHub'a gonder
git push

echo.
echo Islem tamamlandi! Bu pencere 3 saniye icinde kapanacak.
timeout /t 3 >nul