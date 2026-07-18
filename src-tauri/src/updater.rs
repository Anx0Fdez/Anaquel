use std::time::Duration;

use serde::Serialize;
use serde_json::Value;

const RELEASES_API_URL: &str = "https://api.github.com/repos/Anx0Fdez/Anaquel/releases/latest";

#[derive(Debug, Clone, Serialize)]
pub struct UpdateInfo {
    pub version: String,   // última disponible, sin la "v" del tag
    pub installed: String, // versión instalada (CARGO_PKG_VERSION)
    pub url: String,       // página del Release, para abrir en el navegador
}

/// Convierte "v1.2.3" (o "1.2.3") en `(major, minor, patch)` para poder
/// comparar dos versiones sin depender del crate `semver`. Los tags de este
/// repo siempre siguen `vX.Y.Z`, así que no hace falta más que esto.
fn parse_version(raw: &str) -> Option<(u32, u32, u32)> {
    let raw = raw.strip_prefix('v').unwrap_or(raw);
    let mut parts = raw.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next()?.parse().ok()?;
    let patch = parts.next()?.parse().ok()?;
    Some((major, minor, patch))
}

/// Comprueba el último Release publicado en GitHub y lo compara con la
/// versión instalada. Igual que `lookup_isbn`, nunca devuelve `Err` por fallo
/// de red o de parseo: una comprobación de actualización fallida debe ser
/// completamente silenciosa para el usuario, nunca un error visible.
#[tauri::command]
pub async fn check_for_update() -> Result<Option<UpdateInfo>, String> {
    let Some(installed) = parse_version(env!("CARGO_PKG_VERSION")) else {
        return Ok(None);
    };

    let Ok(client) = reqwest::Client::builder()
        .timeout(Duration::from_secs(6))
        .user_agent("Anaquel/0.1 (+https://github.com/Anx0Fdez/Anaquel)")
        .build()
    else {
        return Ok(None);
    };

    let Ok(res) = client
        .get(RELEASES_API_URL)
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
    else {
        return Ok(None);
    };
    if !res.status().is_success() {
        return Ok(None);
    }
    let Ok(body) = res.json::<Value>().await else {
        return Ok(None);
    };

    let Some(tag) = body.get("tag_name").and_then(Value::as_str) else {
        return Ok(None);
    };
    let Some(latest) = parse_version(tag) else {
        return Ok(None);
    };
    if latest <= installed {
        return Ok(None);
    }

    let url = body
        .get("html_url")
        .and_then(Value::as_str)
        .unwrap_or("https://github.com/Anx0Fdez/Anaquel/releases")
        .to_string();

    Ok(Some(UpdateInfo {
        version: tag.strip_prefix('v').unwrap_or(tag).to_string(),
        installed: env!("CARGO_PKG_VERSION").to_string(),
        url,
    }))
}
