Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Klasör yolunu al
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Bash komut zincirini adım adım oluşturuyoruz:
bashCmd = "pkill node || true && "
bashCmd = "cd '$(wslpath '" & ScriptDir & "')/backend' && "
bashCmd = bashCmd & "docker compose down && " ' GERÇEK VERİTABANINA GEÇİLDİĞİNDE SİLİNECEK !!!
bashCmd = bashCmd & "docker compose up -d && "
bashCmd = bashCmd & "sleep 5 && " 
bashCmd = bashCmd & "docker exec -it secureconnect-app python seed.py && " ' GERÇEK VERİTABANINA GEÇİLDİĞİNDE SİLİNECEK !!!
bashCmd = bashCmd & "cd ../frontend && npm run dev"

' Komutu WSL üzerinden çalıştır
komut = "wsl -- bash -ic """ & bashCmd & """"

' 1 (Görünür Mod): Siyah ekran açılır ve tüm işlemler (build, seed) gözünün önünde gerçekleşir.
WshShell.Run "cmd.exe /k " & komut, 1, False