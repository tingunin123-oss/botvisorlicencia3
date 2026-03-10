

// const express = require("express");
// const admin = require("firebase-admin");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ==========================================
// // 🔹 CONFIGURACIÓN DE FIREBASE (Híbrida)
// // ==========================================
// // Intentamos cargar desde la variable de entorno (Render), 
// // si no existe, usamos el archivo local (Tu PC).
// let serviceAccount;

// try {
//   if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//     serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//     console.log("✅ Firebase cargado desde variables de entorno.");
//   } else {
//     serviceAccount = require("./serviceAccountKey.json");
//     console.log("🏠 Firebase cargado desde archivo local.");
//   }

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
// } catch (error) {
//   console.error("🔴 Error crítico al iniciar Firebase:", error.message);
//   process.exit(1); // Detener el servidor si no hay credenciales
// }

// const db = admin.firestore();

// // ==========================================
// // 🔐 VALIDAR LICENCIA
// // ==========================================
// app.post("/validate", async (req, res) => {
//   const { license_key, machine_id } = req.body;

//   if (!license_key || !machine_id) {
//     return res.status(400).json({ status: "missing_data" });
//   }

//   try {
//     const docRef = db.collection("licenses").doc(license_key);
//     const doc = await docRef.get();

//     // ❌ No existe la licencia
//     if (!doc.exists) {
//       return res.json({ status: "invalid" });
//     }

//     const data = doc.data();

//     // 🚫 Estado de la licencia (debe ser 'active')
//     if (data.status !== "active") {
//       return res.json({ status: "blocked" });
//     }

//     // ⏰ Verificar expiración (Firestore Timestamp a JS Date)
//     if (data.expires_at) {
//       const now = new Date();
//       const expires = data.expires_at.toDate();

//       if (now > expires) {
//         return res.json({ status: "expired" });
//       }
//     }

//     // 🔐 Vinculación de Hardware ID
//     if (!data.machine_id) {
//       // Primera vez: vinculamos la licencia a esta PC
//       await docRef.update({ machine_id });
//       console.log(`🆕 Licencia ${license_key} vinculada a ID: ${machine_id}`);
//     } else if (data.machine_id !== machine_id) {
//       // Intento de uso en una segunda PC
//       return res.json({ status: "device_mismatch" });
//     }

//     // ✅ Licencia perfecta
//     return res.json({ status: "ok" });

//   } catch (error) {
//     console.error("🔴 Error en Firestore:", error);
//     return res.status(500).json({ status: "error" });
//   }
// });

// // ==========================================
// // 🚀 INICIAR SERVIDOR (Configuración Render)
// // ==========================================
// // Usamos 0.0.0.0 para que el servicio sea accesible externamente en la red de Render
// const PORT = process.env.PORT || 10000;

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`🚀 Servidor validando en puerto ${PORT}`);
// });

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🔹 CONFIGURACIÓN DE FIREBASE (Híbrida)
// ==========================================
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("✅ Firebase cargado desde variables de entorno.");
  } else {
    serviceAccount = require("./serviceAccountKey.json");
    console.log("🏠 Firebase cargado desde archivo local.");
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error("🔴 Error crítico al iniciar Firebase:", error.message);
  process.exit(1);
}
const db = admin.firestore();

// ==========================================
// 🛠️ HELPER — obtener IP real del cliente
// ==========================================
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// ==========================================
// 🔐 VALIDAR LICENCIA
// ==========================================
// Bot envía: { license_key, machine_id, emulators, emulator_id }
// Firestore guarda en machines: { ip, last_seen, emulators_activos, emulator_ids[] }

app.post("/validate", async (req, res) => {
  const { license_key, machine_id, emulators = 1, emulator_id = "" } = req.body;
  const client_ip = getClientIP(req);

  if (!license_key || !machine_id) {
    return res.status(400).json({ status: "missing_data" });
  }

  try {
    const docRef = db.collection("licenses").doc(license_key);
    const doc   = await docRef.get();

    if (!doc.exists)             return res.json({ status: "invalid" });
    const data = doc.data();
    if (data.status !== "active") return res.json({ status: "blocked" });

    if (data.expires_at) {
      if (new Date() > data.expires_at.toDate()) return res.json({ status: "expired" });
    }

    // Primera vez: vincular máquina principal
    if (!data.machine_id) {
      await docRef.update({ machine_id });
    } else if (data.machine_id !== machine_id) {
      return res.json({ status: "device_mismatch" });
    }

    // Límite de emuladores
    const max_emulators = data.max_emulators || 5;
    if (emulators > max_emulators) {
      return res.json({
        status: "emulator_limit_exceeded",
        max_emulators,
        current: emulators,
      });
    }

    // Registrar máquina + emuladores
    const machines = data.machines || {};
    machines[machine_id] = {
      ip:                client_ip,
      last_seen:         new Date().toISOString(),
      emulators_activos: emulators,
      emulator_ids: emulator_id
        ? [...new Set([...(machines[machine_id]?.emulator_ids || []), emulator_id])]
        : (machines[machine_id]?.emulator_ids || []),
    };

    await docRef.update({
      machines,
      last_activity: admin.firestore.FieldValue.serverTimestamp(),
      last_ip: client_ip,
    });

    console.log(`✅ [${license_key}] PC: ${machine_id} | IP: ${client_ip} | Emuladores: ${emulators}/${max_emulators}`);
    return res.json({ status: "ok", max_emulators, current_emulators: emulators, remaining: max_emulators - emulators });

  } catch (err) {
    console.error("🔴 Error:", err);
    return res.status(500).json({ status: "error" });
  }
});

// ==========================================
// 💓 HEARTBEAT — bot reporta que sigue vivo
// ==========================================
app.post("/heartbeat", async (req, res) => {
  const { license_key, machine_id, emulators = 1, emulator_id = "" } = req.body;
  const client_ip = getClientIP(req);
  if (!license_key || !machine_id) return res.status(400).json({ status: "missing_data" });

  try {
    const docRef = db.collection("licenses").doc(license_key);
    const doc   = await docRef.get();
    if (!doc.exists) return res.json({ status: "invalid" });

    const machines = doc.data().machines || {};
    if (!machines[machine_id]) machines[machine_id] = {};
    machines[machine_id].last_seen         = new Date().toISOString();
    machines[machine_id].ip                = client_ip;
    machines[machine_id].emulators_activos = emulators;
    if (emulator_id && !machines[machine_id].emulator_ids?.includes(emulator_id)) {
      machines[machine_id].emulator_ids = [...(machines[machine_id].emulator_ids || []), emulator_id];
    }

    await docRef.update({ machines, last_activity: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ status: "alive" });
  } catch (err) {
    return res.status(500).json({ status: "error" });
  }
});

// ==========================================
// 📊 INFO DE LICENCIA — cuántas PCs y emuladores
// ==========================================
// GET /status/:license_key
// No necesita auth — el bot o tú pueden consultarlo

app.get("/status/:license_key", async (req, res) => {
  try {
    const doc = await db.collection("licenses").doc(req.params.license_key).get();
    if (!doc.exists) return res.status(404).json({ error: "Licencia no encontrada" });

    const data     = doc.data();
    const machines = data.machines || {};
    const now      = new Date();

    // Una máquina está "activa" si hizo heartbeat en los últimos 5 min
    const detalle = Object.entries(machines).map(([mid, info]) => {
      const mins_inactivo = Math.floor((now - new Date(info.last_seen || 0)) / 60000);
      return {
        machine_id:        mid,
        ip:                info.ip || "desconocida",
        emuladores_activos:info.emulators_activos || 0,
        emulator_ids:      info.emulator_ids || [],
        last_seen:         info.last_seen || "nunca",
        activa:            mins_inactivo < 5,
        mins_inactivo,
      };
    });

    const pcs_activas        = detalle.filter(m => m.activa).length;
    const total_emuladores   = detalle.filter(m => m.activa).reduce((a, m) => a + m.emuladores_activos, 0);
    const max_emulators      = data.max_emulators || 5;

    return res.json({
      license_key:              req.params.license_key,
      status:                   data.status,
      expires_at:               data.expires_at?.toDate()?.toISOString() || "sin expiración",
      // ── Lo que pediste ──────────────────────────
      max_emuladores:           max_emulators,
      pcs_vinculadas_total:     detalle.length,          // todas las PCs que alguna vez usaron esta licencia
      pcs_activas_ahora:        pcs_activas,             // PCs con heartbeat < 5 min
      emuladores_activos_ahora: total_emuladores,        // emuladores corriendo en este momento
      // ── Detalle por PC ──────────────────────────
      maquinas: detalle,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 🚀 INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`   POST /validate          ← bot valida licencia`);
  console.log(`   POST /heartbeat         ← bot reporta que vive`);
  console.log(`   GET  /status/:key       ← ver PCs y emuladores de una licencia`);
});
