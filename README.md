# Azubiprojekt 2023 Digitales Schachbrett

## Schritte zum Ausführen:

```
1. RasperryPi anschließen

2. 'chess' WLAN starten. -> IP-Adresse sollte 10.42.0.1 sein. Passwort: chess123

3. Backend Server starten: 
  - cd Desktop/digital-chessboard/src
  - sudo python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

4. Frontend starten (dist ordner)
  - cd Desktop/digital-chessboard
  - serve -s dist/ -l 8080

5. Im Browser 10.42.0.1:8080 aufrufen

6. Spiel starten
** Wichtig: Spielfiguren so aufstellen, wie es das Brett auf der Website anzeigt, sobald man das Spiel startet! **

7. eingeschränktes Schach spielen (Bitte keine Bauernumwandlung vornehmen!)
```

LED Farben bedeutung:
  - Grün: Feld, worauf die Figur ziehen kann
  - Gelb: Feld, von der die Figur aufgehoben wurde
  - Rot: Felder, wo Figuren drauf stehen, welche geschlagen werden können.


Für sonstige Informationen, siehe Hausmesse-Projektdokumentation im Dokumentation Ordner

**Last Updated: November 2025**