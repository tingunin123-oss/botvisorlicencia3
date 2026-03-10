// const express = require("express");
// const admin = require("firebase-admin");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // 🔹 Conectar Firebase con clave local
// admin.initializeApp({
//   credential: admin.credential.cert(require("./serviceAccountKey.json"))
// });

// const db = admin.firestore();

// // =============================
// // 🔐 VALIDAR LICENCIA
// // =============================
// app.post("/validate", async (req, res) => {
//   const { license_key, machine_id } = req.body;

//   if (!license_key || !machine_id) {
//     return res.status(400).json({ status: "missing_data" });
//   }

//   try {
//     const docRef = db.collection("licenses").doc(license_key);
//     const doc = await docRef.get();

//     // ❌ No existe
//     if (!doc.exists) {
//       return res.json({ status: "invalid" });
//     }

//     const data = doc.data();

//     // 🚫 Desactivada manualmente
//     if (data.status !== "active") {
//       return res.json({ status: "blocked" });
//     }

//     // ⏰ Verificar expiración
//     const now = new Date();
//     const expires = data.expires_at.toDate();

//     if (now > expires) {
//       return res.json({ status: "expired" });
//     }

//     // 🔐 Si no tiene machine_id lo asignamos
//     if (!data.machine_id) {
//       await docRef.update({ machine_id });
//     }

//     // 🚨 Si ya está ligada a otra máquina
//     if (data.machine_id && data.machine_id !== machine_id) {
//       return res.json({ status: "device_mismatch" });
//     }

//     // ✅ Todo correcto
//     return res.json({ status: "ok" });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: "error" });
//   }
// });

// // =============================
// // 🚀 INICIAR SERVIDOR
// // =============================
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log("Server running on port " + PORT);
// });

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
// 🔐 VALIDAR LICENCIA  (ruta principal del bot)
// ==========================================
// El bot envía:
//   license_key   → clave de la licencia
//   machine_id    → ID único de la PC  (ej: "PC-JUAN-WIN10")
//   emulators     → cuántos MEmu están corriendo AHORA  (número, ej: 3)
//   emulator_id   → ID del emulador específico  (ej: "127.0.0.1:21503")
//
// Firestore guarda en licenses/{license_key}:
//   status          → "active" | "blocked" | etc.
//   expires_at      → Timestamp
//   machine_id      → primera PC que la usó
//   max_emulators   → límite de emuladores permitidos (tú lo pones al crear la licencia)
//   machines        → map { machine_id: { ip, last_seen, emulators, emulator_ids[] } }

app.post("/validate", async (req, res) => {
  const { license_key, machine_id, emulators = 1, emulator_id = "" } = req.body;
  const client_ip = getClientIP(req);

  if (!license_key || !machine_id) {
    return res.status(400).json({ status: "missing_data" });
  }

  try {
    const docRef = db.collection("licenses").doc(license_key);
    const doc = await docRef.get();

    // ❌ No existe
    if (!doc.exists) return res.json({ status: "invalid" });

    const data = doc.data();

    // 🚫 Bloqueada
    if (data.status !== "active") return res.json({ status: "blocked" });

    // ⏰ Expirada
    if (data.expires_at) {
      const now = new Date();
      const expires = data.expires_at.toDate();
      if (now > expires) return res.json({ status: "expired" });
    }

    // 🔐 Vinculación de hardware (primera vez)
    if (!data.machine_id) {
      await docRef.update({ machine_id });
      console.log(`🆕 Licencia ${license_key} vinculada a: ${machine_id}`);
    } else if (data.machine_id !== machine_id) {
      // Está intentando usarse en una PC diferente a la original
      return res.json({ status: "device_mismatch" });
    }

    // 🖥️ Límite de emuladores
    const max_emulators = data.max_emulators || 5; // default 5 si no se definió
    if (emulators > max_emulators) {
      console.log(`⛔ ${license_key} intentó usar ${emulators} emuladores (máx: ${max_emulators})`);
      return res.json({
        status: "emulator_limit_exceeded",
        max_emulators,
        current: emulators,
        message: `Límite de ${max_emulators} emuladores superado`
      });
    }

    // 📋 Registrar/actualizar info de esta máquina
    const now_ts = admin.firestore.FieldValue.serverTimestamp();
    const machines = data.machines || {};

    machines[machine_id] = {
      ip: client_ip,
      last_seen: new Date().toISOString(),
      emulators_activos: emulators,
      emulator_ids: emulator_id
        ? [...new Set([...(machines[machine_id]?.emulator_ids || []), emulator_id])]
        : (machines[machine_id]?.emulator_ids || []),
      hostname: machine_id,
    };

    await docRef.update({
      machines,
      last_activity: now_ts,
      last_ip: client_ip,
    });

    console.log(`✅ [${license_key}] PC: ${machine_id} | IP: ${client_ip} | Emuladores: ${emulators}/${max_emulators}`);

    return res.json({
      status: "ok",
      max_emulators,
      current_emulators: emulators,
      remaining: max_emulators - emulators,
    });

  } catch (error) {
    console.error("🔴 Error en Firestore:", error);
    return res.status(500).json({ status: "error" });
  }
});

// ==========================================
// 💓 HEARTBEAT — el bot reporta que sigue vivo
// ==========================================
// El bot llama esto cada X segundos para mantener
// el registro actualizado sin re-validar licencia completa
//
// Body: { license_key, machine_id, emulators, emulator_id }

app.post("/heartbeat", async (req, res) => {
  const { license_key, machine_id, emulators = 1, emulator_id = "" } = req.body;
  const client_ip = getClientIP(req);

  if (!license_key || !machine_id) {
    return res.status(400).json({ status: "missing_data" });
  }

  try {
    const docRef = db.collection("licenses").doc(license_key);
    const doc = await docRef.get();
    if (!doc.exists) return res.json({ status: "invalid" });

    const data = doc.data();
    const machines = data.machines || {};

    // Actualizar last_seen y emuladores activos
    if (!machines[machine_id]) machines[machine_id] = {};
    machines[machine_id].last_seen         = new Date().toISOString();
    machines[machine_id].ip                = client_ip;
    machines[machine_id].emulators_activos = emulators;
    if (emulator_id && !machines[machine_id].emulator_ids?.includes(emulator_id)) {
      machines[machine_id].emulator_ids = [
        ...(machines[machine_id].emulator_ids || []),
        emulator_id,
      ];
    }

    await docRef.update({
      machines,
      last_activity: admin.firestore.FieldValue.serverTimestamp(),
      last_ip: client_ip,
    });

    return res.json({ status: "alive" });
  } catch (err) {
    return res.status(500).json({ status: "error" });
  }
});

// ==========================================
// 📊 ESTADO DE UNA LICENCIA (para tu panel)
// ==========================================
// GET /status/:license_key
// Devuelve todo el detalle: máquinas, IPs, emuladores, etc.

app.get("/status/:license_key", async (req, res) => {
  const { license_key } = req.params;

  // Autenticación básica con header secreto (para que no sea público)
  const auth = req.headers["x-admin-key"];
  if (auth !== (process.env.ADMIN_KEY || "mi-clave-admin-secreta")) {
    return res.status(403).json({ error: "No autorizado" });
  }

  try {
    const doc = await db.collection("licenses").doc(license_key).get();
    if (!doc.exists) return res.status(404).json({ error: "Licencia no encontrada" });

    const data = doc.data();
    const machines = data.machines || {};

    // Calcular cuántas máquinas están "activas" (vistas en los últimos 5 min)
    const now = new Date();
    const maquinas_detalle = Object.entries(machines).map(([mid, info]) => {
      const last = new Date(info.last_seen || 0);
      const minutos_inactivo = Math.floor((now - last) / 60000);
      return {
        machine_id:        mid,
        ip:                info.ip || "desconocida",
        emuladores_activos:info.emulators_activos || 0,
        emulator_ids:      info.emulator_ids || [],
        last_seen:         info.last_seen || "nunca",
        activa:            minutos_inactivo < 5,   // activa si heartbeat < 5 min
        minutos_inactivo,
      };
    });

    const total_emuladores = maquinas_detalle
      .filter(m => m.activa)
      .reduce((acc, m) => acc + m.emuladores_activos, 0);

    return res.json({
      license_key,
      status:            data.status,
      expires_at:        data.expires_at?.toDate()?.toISOString() || "sin expiración",
      max_emulators:     data.max_emulators || 5,
      total_emuladores_activos: total_emuladores,
      maquinas_registradas: maquinas_detalle.length,
      maquinas:          maquinas_detalle,
      last_ip:           data.last_ip || "desconocida",
      last_activity:     data.last_activity?.toDate()?.toISOString() || "nunca",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 📋 LISTAR TODAS LAS LICENCIAS (panel admin)
// ==========================================
// GET /admin/licenses

app.get("/admin/licenses", async (req, res) => {
  const auth = req.headers["x-admin-key"];
  if (auth !== (process.env.ADMIN_KEY || "mi-clave-admin-secreta")) {
    return res.status(403).json({ error: "No autorizado" });
  }

  try {
    const snapshot = await db.collection("licenses").get();
    const now = new Date();
    const lista = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const machines = data.machines || {};

      const maquinas_activas = Object.values(machines).filter(m => {
        const last = new Date(m.last_seen || 0);
        return (now - last) / 60000 < 5;
      });

      const total_emuladores = maquinas_activas
        .reduce((acc, m) => acc + (m.emulators_activos || 0), 0);

      lista.push({
        license_key:       doc.id,
        status:            data.status,
        expires_at:        data.expires_at?.toDate()?.toISOString() || "sin expiración",
        max_emulators:     data.max_emulators || 5,
        maquinas_activas:  maquinas_activas.length,
        total_emuladores_activos: total_emuladores,
        last_ip:           data.last_ip || "—",
        last_activity:     data.last_activity?.toDate()?.toISOString() || "nunca",
      });
    });

    return res.json({ total: lista.length, licenses: lista });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✏️ CREAR / ACTUALIZAR LICENCIA (admin)
// ==========================================
// POST /admin/license
// Body: { license_key, max_emulators, days, status }

app.post("/admin/license", async (req, res) => {
  const auth = req.headers["x-admin-key"];
  if (auth !== (process.env.ADMIN_KEY || "mi-clave-admin-secreta")) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const { license_key, max_emulators = 5, days = 30, status = "active" } = req.body;
  if (!license_key) return res.status(400).json({ error: "Falta license_key" });

  try {
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + days);

    await db.collection("licenses").doc(license_key).set({
      status,
      max_emulators,
      expires_at: admin.firestore.Timestamp.fromDate(expires_at),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      machines: {},
    }, { merge: true });

    console.log(`✏️ Licencia creada/actualizada: ${license_key} | max: ${max_emulators} | días: ${days}`);
    return res.json({
      status: "created",
      license_key,
      max_emulators,
      expires_at: expires_at.toISOString(),
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
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /validate          ← bot valida licencia`);
  console.log(`   POST /heartbeat         ← bot reporta que vive`);
  console.log(`   GET  /status/:key       ← ver estado de una licencia`);
  console.log(`   GET  /admin/licenses    ← listar todas las licencias`);
  console.log(`   POST /admin/license     ← crear/editar licencia`);
});
