# 🛡️ Varbe Content Moderation System

## Übersicht

Das Content-Moderation-System schützt die Varbe-Community durch automatische und manuelle Prüfung aller Inhalte:

- **🤖 KI-Erkennung**: Kritisch für Varbe's Anti-AI-Stance
- **🔞 Explizite Inhalte**: Google Cloud Vision SafeSearch
- **💬 Toxizität**: Google Perspective API für Text-Prüfung
- **📧 Spam-Schutz**: Rate Limiting und Duplikat-Erkennung
- **⚡ Strike-System**: Warnungen und Bans bei wiederholten Verstößen

## Erforderliche API-Keys

Füge diese Umgebungsvariablen zu deiner `.env.local` Datei hinzu:

```bash
# Content Moderation APIs

# Hive AI Detection - für KI-generierte Kunst-Erkennung
# Anmelden unter: https://thehive.ai/
HIVE_API_KEY=your_hive_api_key

# ODER Illuminarty als Alternative
# Anmelden unter: https://illuminarty.ai/
ILLUMINARTY_API_KEY=your_illuminarty_api_key

# Google Cloud Vision - für explizite Inhalte
# Aktiviere die Vision API in der Google Cloud Console
# https://console.cloud.google.com/apis/library/vision.googleapis.com
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_key

# Google Perspective API - für Toxizitäts-Erkennung
# Beantrage Zugang unter: https://www.perspectiveapi.com/
PERSPECTIVE_API_KEY=your_perspective_api_key
```

## Kosten-Übersicht (geschätzt)

| Service | Kosten | Notizen |
|---------|--------|---------|
| Hive AI Detection | ~€0.001/Bild | ~€10 pro 10.000 Uploads |
| Google Cloud Vision | ~€1.50/1.000 Bilder | SafeSearch Detection |
| Perspective API | **KOSTENLOS** | Bis 1 Million Requests/Monat |

**Bei 1.000 Uploads/Monat**: ~€12
**Bei 10.000 Kommentare/Monat**: €0 (unter Limit)

## Moderation-Schwellenwerte

Die Standard-Schwellenwerte können im Admin-Dashboard angepasst werden:

### KI-Erkennung
- **Block-Schwelle**: 70% - Automatisches Blockieren
- **Review-Schwelle**: 50% - Manuelle Prüfung erforderlich

### Toxizität
- **Block-Schwelle**: 80% - Automatisches Blockieren
- **Review-Schwelle**: 60% - Manuelle Prüfung erforderlich

### Rate Limiting
- **Kommentare**: Max. 10 pro Minute
- **Posts**: Max. 5 pro Stunde
- **Nachrichten**: Max. 30 pro Minute

## Strike-System

| Strikes | Aktion |
|---------|--------|
| 1 | Warnung |
| 2 | 7-Tage-Ban |
| 3+ | Permanenter Ban |

Strikes verfallen nach 90 Tagen.

## API Endpoints

### POST /api/moderation/check-image
Prüft ein Bild auf KI-generierte Inhalte und explizite Inhalte.

```json
{
  "imageUrl": "https://...",
  "contentType": "artwork",
  "userId": "user123",
  "contentId": "optional_id"
}
```

### POST /api/moderation/check-text
Prüft Text auf Toxizität und Spam.

```json
{
  "text": "Kommentar-Text",
  "contentType": "comment",
  "userId": "user123",
  "contentId": "optional_id",
  "language": "de"
}
```

### GET /api/moderation/queue
Ruft die Moderationswarteschlange ab.

Query-Parameter:
- `status`: pending, flagged, auto_blocked, approved, rejected
- `contentType`: feed_post, comment, chat_message, artwork, etc.
- `limit`: Anzahl der Einträge (Standard: 50)

### POST /api/moderation/review
Überprüft einen Warteschlangen-Eintrag.

```json
{
  "itemId": "queue_item_id",
  "decision": "approve" | "reject" | "escalate",
  "adminId": "admin_user_id",
  "notes": "Optional reviewer notes"
}
```

### POST /api/moderation/report
Meldet Inhalte.

```json
{
  "contentType": "feed_post",
  "contentId": "post123",
  "reportedBy": "user123",
  "reason": "ai_generated",
  "description": "Optional description"
}
```

### GET /api/moderation/stats
Ruft Moderation-Statistiken ab.

## Admin-Dashboard

Zugriff über: `/admin/moderation`

Features:
- 📋 Moderationswarteschlange mit Filtern
- 📊 Statistiken (Gründe, Content-Typen)
- ⚙️ Einstellungen für Schwellenwerte

## Integrierte Services

Die Moderation ist bereits in folgende Services integriert:

- `feed.ts` - Posts und Kommentare
- `chatrooms.ts` - Chat-Nachrichten
- `messages.ts` - Direktnachrichten

### Beispiel: Post erstellen

```typescript
const result = await createPost({
    artistId: user.uid,
    type: 'artwork',
    text: 'Mein neues Kunstwerk!',
    images: [imageUrl],
});

if (!result.success) {
    // Zeige Fehlermeldung an
    console.error(result.error);
    // result.moderationResult enthält Details
}
```

## Firestore Collections

Das System verwendet folgende Collections:

- `moderation_queue` - Warteschlange für manuelle Prüfung
- `content_reports` - Nutzer-Meldungen
- `user_moderation` - Strike-History und Ban-Status
- `moderation_settings` - Einstellungen (zukünftig)

## Wichtige Hinweise

1. **Kunst kann kontrovers sein** - Edge-Cases sollten manuell geprüft werden
2. **Aktkunst erlaubt** - Sofern künstlerisch wertvoll und nicht pornografisch
3. **Appeals-Prozess** - Künstler können Entscheidungen anfechten
4. **DSGVO-konform** - Alle Daten können auf Anfrage gelöscht werden

## Support

Bei Fragen zur Content-Moderation wende dich an das Varbe-Team.




