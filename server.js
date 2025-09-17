// const express = require("express");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
// const app = express();
// const port = 3000;

// app.use(bodyParser.json());

// // 🔑 Importar la clave de servicio de Firebase (descargada desde Firebase Console)
// // const serviceAccount = require("./serviceAccountKey.json");

// // 🔑 Usar la clave de Firebase desde variable de entorno
// const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);

// // 🚀 Inicializar Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// // ✅ Ruta de prueba (para verificar que el backend funciona)
// app.get("/", (req, res) => {
//   res.send("🚀 Backend funcionando correctamente!");
// });

// // ✅ Ruta para enviar notificación a un usuario
// app.post("/sendNotification", async (req, res) => {
//   try {
//     const { token, title, body } = req.body;

//     if (!token || !title || !body) {
//       return res.status(400).json({
//         success: false,
//         message: "Faltan parámetros: token, title, body son obligatorios"
//       });
//     }

//     const message = {
//       notification: { title, body },
//       token: token
//     };

//     const response = await admin.messaging().send(message);

//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ Error al enviar notificación:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // 🚀 Iniciar servidor
// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });


// const express = require("express");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
// const cors = require("cors");

// const app = express();
// const port = process.env.PORT || 3000;

// // CORS habilitado para aceptar peticiones desde cualquier origen
// // Puedes limitar el origen en producción si quieres
// app.use(cors());

// app.use(bodyParser.json());

// // Variable de entorno con JSON de la clave de servicio Firebase
// //  const serviceAccount = require("./serviceAccountKey.json");
// const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// // Ruta para verificar que backend está andando
// app.get("/", (req, res) => {
//   res.send("🚀 Backend funcionando correctamente!");
// });

// // Ruta para enviar notificación
// app.post("/sendNotification", async (req, res) => {
//   try {
//     const { token, notification, android, data } = req.body;

//     if (!token || !notification || !notification.title || !notification.body) {
//       return res.status(400).json({
//         success: false,
//         message: "Faltan parámetros: token y notification {title, body} son obligatorios"
//       });
//     }

//     // Construcción del mensaje para FCM, prioridad alta y canal para Android heads-up
//     const message = {
//       token,
//       notification,
//       android: android || {
//         priority: "high",
//         notification: {
//           channel_id: "default",
//           sound: "default"
//         }
//       },
//       data: data || {}
//     };

//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ Error al enviar notificación:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });



// // server.js
// const express = require("express");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
// const cors = require("cors");
// const cron = require("node-cron"); // ✅ Nuevo: librería para cron jobs

// const app = express();
// const port = process.env.PORT || 3000;

// // CORS habilitado
// app.use(cors());
// app.use(bodyParser.json());

// // Inicializar Firebase Admin con clave de servicio
// // const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);
// const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// // 🚀 Rutas existentes
// app.get("/", (req, res) => {
//   res.send("🚀 Backend funcionando correctamente!");
// });

// app.post("/sendNotification", async (req, res) => {
//   try {
//     const { token, notification, android, data } = req.body;

//     if (!token || !notification || !notification.title || !notification.body) {
//       return res.status(400).json({
//         success: false,
//         message: "Faltan parámetros: token y notification {title, body} son obligatorios"
//       });
//     }

//     const message = {
//       token,
//       notification,
//       android: android || {
//         priority: "high",
//         notification: { channel_id: "default", sound: "default" }
//       },
//       data: data || {}
//     };

//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ Error al enviar notificación:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ============================
// // 🔥 NUEVO: Función para enviar notificaciones automáticas
// // ============================
// const enviarNotificacionesAutomaticas = async () => {
//   const db = admin.firestore();
//   console.log("🚀 Ejecutando notificaciones automáticas...");

//   const configDoc = await db.collection("config").doc("notificaciones").get();
//   if (!configDoc.exists) return console.log("⚠️ Configuración no encontrada.");
//   const configData = configDoc.data();
//   if (!configData.activo) return console.log("⚠️ Notificaciones desactivadas.");

//   const horarios = configData.horarios || [];
//   const ahora = new Date();
//   const horaActual = `${("0" + ahora.getHours()).slice(-2)}:${("0" + ahora.getMinutes()).slice(-2)}`;

//   if (!horarios.includes(horaActual)) {
//     console.log(`⏰ Hora actual (${horaActual}) no coincide con horarios configurados.`);
//     return;
//   }

//   const tokensSnapshot = await db.collection("userTokens").get();
//   if (tokensSnapshot.empty) return console.log("⚠️ No hay tokens registrados.");
//   const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

//   for (const token of tokens) {
//     const message = {
//       token,
//       notification: {
//         title: "Recordatorio de pago",
//         body: "No olvides tu pago de hoy. Mantén tus finanzas al día."
//       },
//       android: { priority: "high", notification: { channel_id: "default", sound: "default" } }
//     };

//     try {
//       await admin.messaging().send(message);
//       console.log(`✅ Notificación enviada a token: ${token}`);
//     } catch (err) {
//       console.error(`❌ Error enviando notificación a token: ${token}`, err.message);
//     }
//   }

//   console.log("🎯 Notificaciones automáticas finalizadas.");
// };

// // ============================
// // 🔥 NUEVO: Cron Job que ejecuta cada minuto
// // ============================
// // Esto revisa cada minuto si hay que enviar notificaciones
// cron.schedule("* * * * *", () => {
//   enviarNotificacionesAutomaticas();
// });

// // ============================

// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });
// server.js
///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// const express = require("express");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
// const cors = require("cors");
// const cron = require("node-cron");

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(bodyParser.json());

// // 🔑 Inicializar Firebase Admin
// const serviceAccount = require("./serviceAccountKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// const db = admin.firestore();

// // ===============================
// // 🚀 ENDPOINT de prueba
// // ===============================
// app.get("/", (req, res) => {
//   res.send("🚀 Backend funcionando correctamente!");
// });

// // ===============================
// // 🚀 ENDPOINT para mandar notificación manual
// // ===============================
// app.post("/sendNotification", async (req, res) => {
//   try {
//     const { token, notification, android, data } = req.body;
//     if (!token || !notification?.title || !notification?.body) {
//       return res.status(400).json({ success: false, message: "Faltan parámetros" });
//     }

//     const message = {
//       token,
//       notification,
//       android: android || { priority: "high", notification: { channel_id: "default", sound: "default" } },
//       data: data || {}
//     };

//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ Error al enviar notificación:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ===============================
// // 🔥 FUNCIÓN PRINCIPAL DE NOTIFICACIONES AUTOMÁTICAS
// // ===============================
// // const enviarNotificacionesAutomaticas = async () => {
// //   const db = admin.firestore();
// //   console.log("🚀 Ejecutando notificaciones automáticas...");

// //   // Traer configuración
// //   const configDoc = await db.collection("config").doc("notificaciones").get();
// //   if (!configDoc.exists) return console.log("⚠️ Configuración no encontrada.");

// //   const configData = configDoc.data();

// //   if (!configData.activo) return console.log("⚠️ Notificaciones desactivadas.");

// //   const horarios = configData.horarios || [];
// //   const ahora = new Date();
// //   const horaActual = `${("0" + ahora.getHours()).slice(-2)}:${("0" + ahora.getMinutes()).slice(-2)}`;

// //   if (!horarios.includes(horaActual)) {
// //     console.log(`⏰ Hora actual (${horaActual}) no coincide con horarios configurados.`);
// //     return;
// //   }

// //   const usuarioId = configData.usuarioId;
// //   if (!usuarioId) {
// //     console.log("⚠️ Configuración sin usuarioId.");
// //     return;
// //   }

// //   // 1️⃣ Buscar todos los clientes de este usuario
// //   const clientesSnapshot = await db.collection("clientes")
// //     .where("usuarioId", "==", usuarioId)
// //     .get();

// //   if (clientesSnapshot.empty) {
// //     console.log(`⚠️ No hay clientes para este usuario (${usuarioId}).`);
// //     return;
// //   }

// //   const clienteIds = clientesSnapshot.docs.map(doc => doc.id);

// //   // 2️⃣ Buscar préstamos de esos clientes en varias colecciones
// //   const coleccionesPrestamos = ["prestamospov", "financiamientos"];
// //   let prestamos = [];

// //   for (const col of coleccionesPrestamos) {
// //     const snapshot = await db.collection(col)
// //       .where("clienteId", "in", clienteIds)
// //       .get();
// //     prestamos = prestamos.concat(snapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), coleccion: col })));
// //   }

// //   if (prestamos.length === 0) {
// //     console.log(`⚠️ No hay préstamos asociados a los clientes de este usuario (${usuarioId}).`);
// //     return;
// //   }

// //   for (const prest of prestamos) {
// //     const prestamo = prest.data;
// //     const clienteId = prestamo.clienteId;
// //     const nombre = prestamo.clienteNombre || "Cliente";
// //     const fechaPago = prestamo.proximoPago;

// //     // Buscar token del cliente
// //     const tokenDoc = await db.collection("userTokens").doc(clienteId).get();
// //     if (!tokenDoc.exists) {
// //       console.log(`⚠️ Cliente ${clienteId} no tiene token.`);
// //       continue;
// //     }
// //     const token = tokenDoc.data().token;

// //     // 📅 Calcular estado de pago
// //     const hoy = new Date().toISOString().split("T")[0];
// //     let titulo = "";
// //     let cuerpo = "";

// //     if (fechaPago === hoy) {
// //       titulo = configData.tituloHoy;
// //       cuerpo = configData.mensajeHoy.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
// //     } else if (new Date(fechaPago) < new Date(hoy)) {
// //       const dias = Math.floor((new Date(hoy) - new Date(fechaPago)) / (1000 * 60 * 60 * 24));
// //       titulo = configData.tituloAtraso;
// //       cuerpo = configData.mensajeAtraso.replace("{nombre}", nombre).replace("{dias}", dias);
// //     } else {
// //       titulo = configData.tituloRecordatorio;
// //       cuerpo = configData.mensajeRecordatorio.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
// //     }

// //     // Crear mensaje
// //     const message = {
// //       token,
// //       notification: {
// //         title: `${configData.nombreEmpresa} - ${titulo}`,
// //         body: cuerpo
// //       },
// //       android: { priority: "high", notification: { channel_id: "default", sound: "default" } }
// //     };

// //     try {
// //       await admin.messaging().send(message);
// //       console.log(`✅ Notificación enviada a ${nombre} (${clienteId})`);
// //     } catch (err) {
// //       console.error(`❌ Error enviando notificación a ${clienteId}`, err.message);
// //     }
// //   }

// //   console.log("🎯 Notificaciones automáticas finalizadas.");
// // };

// const enviarNotificacionesAutomaticas = async () => {
//   const db = admin.firestore();
//   console.log("🚀 Ejecutando notificaciones automáticas...");

//   const configDoc = await db.collection("config").doc("notificaciones").get();
//   if (!configDoc.exists) return console.log("⚠️ Configuración no encontrada.");
//   const configData = configDoc.data();
//   if (!configData.activo) return console.log("⚠️ Notificaciones desactivadas.");

//   const horarios = (configData.horarios || []).map(h => h.trim());
//   const ahora = new Date();
//   const horaActual = `${("0" + ahora.getHours()).slice(-2)}:${("0" + ahora.getMinutes()).slice(-2)}`;
//   if (!horarios.includes(horaActual)) {
//     console.log(`⏰ Hora actual (${horaActual}) no coincide con horarios configurados.`);
//     return;
//   }

//   const usuarioId = configData.usuarioId;
//   if (!usuarioId) return console.log("⚠️ Configuración sin usuarioId.");

//   const clientesSnapshot = await db.collection("clientes").where("usuarioId", "==", usuarioId).get();
//   if (clientesSnapshot.empty) return console.log("⚠️ No hay clientes para este usuario.");

//   const clienteIds = clientesSnapshot.docs.map(doc => doc.id);

//   const coleccionesPrestamos = ["prestamospov", "financiamientos"];
//   let prestamos = [];

//   for (const col of coleccionesPrestamos) {
//     const snapshot = await db.collection(col).where("clienteId", "in", clienteIds).get();
//     prestamos = prestamos.concat(snapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), coleccion: col })));
//   }

//   if (prestamos.length === 0) return console.log("⚠️ No hay préstamos asociados a los clientes.");

//   for (const prest of prestamos) {
//     const prestamo = prest.data;
//     const clienteId = prestamo.clienteId;
//     const nombre = prestamo.clienteNombre || "Cliente";
//     const fechaPago = prestamo.proximoPago;
//     const modalidad = prestamo.modalidad;

//     const tokenDoc = await db.collection("userTokens").doc(clienteId).get();
//     if (!tokenDoc.exists) continue;
//     const token = tokenDoc.data()?.token;
//     if (!token) continue;

//     const hoy = new Date().toISOString().split("T")[0];
//     const fechaPagoDate = new Date(fechaPago);
//     const hoyDate = new Date(hoy);
//     const diasAntes = Math.floor((fechaPagoDate.getTime() - hoyDate.getTime()) / (1000*60*60*24));

//     let titulo = "";
//     let cuerpo = "";

//     if (fechaPago === hoy) {
//       titulo = configData.tituloHoy;
//       cuerpo = configData.mensajeHoy.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
//     } else if (fechaPagoDate < hoyDate) {
//       const dias = Math.floor((hoyDate.getTime() - fechaPagoDate.getTime()) / (1000*60*60*24));
//       titulo = configData.tituloAtraso;
//       cuerpo = configData.mensajeAtraso.replace("{nombre}", nombre).replace("{dias}", dias);
//     } else if ((modalidad === "diario" && diasAntes === 0) || (modalidad !== "diario" && diasAntes === 3)) {
//       titulo = configData.tituloRecordatorio;
//       cuerpo = configData.mensajeRecordatorio.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
//     } else {
//       continue;
//     }

//     const message = {
//       token,
//       notification: { title: `${configData.nombreEmpresa} - ${titulo}`, body: cuerpo },
//       android: { priority: "high", notification: { channel_id: "default", sound: "default" } }
//     };

//     try {
//       await admin.messaging().send(message);
//       console.log(`✅ Notificación enviada a ${nombre} (${clienteId})`);
//     } catch (err) {
//       console.error("❌ Error enviando notificación", err.message);
//     }
//   }

//   console.log("🎯 Notificaciones automáticas finalizadas.");
// };


// // ===============================
// // 🔥 CRON JOB: ejecuta cada minuto
// // ===============================
// cron.schedule("* * * * *", () => {
//   enviarNotificacionesAutomaticas();
// });

// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });

/////////////////////////////////////////////////////////////////////
// funciona
// server.js
// const express = require("express");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
// const cors = require("cors");
// const cron = require("node-cron");
// const path = require("path");

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(bodyParser.json());

// // 🔑 Inicializar Firebase Admin
// const serviceAccount = require("./serviceAccountKey.json");
// // const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// const db = admin.firestore();

// // ===============================
// // 🚀 ENDPOINT de prueba
// // ===============================
// app.get("/", (req, res) => {
//   res.send("🚀 Backend funcionando correctamente!");
// });

// // ===============================
// // 🚀 ENDPOINT para enviar notificación manual
// // ===============================
// app.post("/sendNotification", async (req, res) => {
//   try {
//     const { token, notification, data } = req.body;
//     if (!token || !notification?.title || !notification?.body) {
//       return res.status(400).json({ success: false, message: "Faltan parámetros" });
//     }

//     const message = {
//       token,
//       notification,
//       android: {
//         priority: "high",
//         notification: {
//           channel_id: "default",
//           sound: "default",
//           icon: "logo" // nombre del asset del icono
//         }
//       },
//       data: data || {}
//     };

//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ Error al enviar notificación:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ===============================
// // 🔥 FUNCION PRINCIPAL DE NOTIFICACIONES AUTOMÁTICAS
// // ===============================
// const enviarNotificacionesAutomaticas = async () => {
//   console.log("🚀 Ejecutando notificaciones automáticas...");

//   try {
//     // Traer todos los usuarios con configuración de notificaciones activas
//     const notiSnapshot = await db.collection("notificaciones").where("activo", "==", true).get();
//     if (notiSnapshot.empty) return console.log("⚠️ No hay usuarios con notificaciones activas.");

//     const ahora = new Date();
//     const horaActual = `${("0" + ahora.getHours()).slice(-2)}:${("0" + ahora.getMinutes()).slice(-2)}`;

//     for (const doc of notiSnapshot.docs) {
//       const configData = doc.data();
//       const usuarioId = configData.usuarioId;

//       const horarios = (configData.horarios || []).map(h => h.trim());
//       if (!horarios.includes(horaActual)) {
//         console.log(`⏰ Hora actual (${horaActual}) no coincide para usuario ${usuarioId}`);
//         continue;
//       }

//       // Obtener clientes de este usuario
//       const clientesSnapshot = await db.collection("clientes").where("usuarioId", "==", usuarioId).get();
//       if (clientesSnapshot.empty) continue;

//       const clienteIds = clientesSnapshot.docs.map(c => c.id);

//       // Buscar préstamos de los clientes
//       const coleccionesPrestamos = ["prestamospov", "financiamientos"];
//       let prestamos = [];

//       for (const col of coleccionesPrestamos) {
//         const snapshot = await db.collection(col).where("clienteId", "in", clienteIds).get();
//         prestamos = prestamos.concat(snapshot.docs.map(p => ({ id: p.id, data: p.data(), coleccion: col })));
//       }

//       if (prestamos.length === 0) continue;

//       for (const prest of prestamos) {
//         const prestamo = prest.data;
//         const clienteId = prestamo.clienteId;
//         const nombre = prestamo.clienteNombre || "Cliente";
//         const fechaPago = prestamo.proximoPago;
//         const modalidad = prestamo.modalidad;

//         const tokenDoc = await db.collection("userTokens").doc(clienteId).get();
//         if (!tokenDoc.exists) continue;
//         const token = tokenDoc.data()?.token;
//         if (!token) continue;

//         const hoy = new Date().toISOString().split("T")[0];
//         const fechaPagoDate = new Date(fechaPago);
//         const hoyDate = new Date(hoy);
//         const diasAntes = Math.floor((fechaPagoDate.getTime() - hoyDate.getTime()) / (1000*60*60*24));

//         let titulo = "";
//         let cuerpo = "";

//         if (fechaPago === hoy) {
//           titulo = configData.tituloHoy;
//           cuerpo = configData.mensajeHoy.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
//         } else if (fechaPagoDate < hoyDate) {
//           const dias = Math.floor((hoyDate.getTime() - fechaPagoDate.getTime()) / (1000*60*60*24));
//           titulo = configData.tituloAtraso;
//           cuerpo = configData.mensajeAtraso.replace("{nombre}", nombre).replace("{dias}", dias);
//         } else if ((modalidad === "diario" && diasAntes === 0) || (modalidad !== "diario" && diasAntes === 3)) {
//           titulo = configData.tituloRecordatorio;
//           cuerpo = configData.mensajeRecordatorio.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
//         } else {
//           continue;
//         }

//         // // Agregar link de WhatsApp
//         // const linkWhats = `https://wa.me/18298833725?text=${encodeURIComponent(cuerpo)}`;
//         // cuerpo += `\n\nContacta: ${linkWhats}`;

//         const message = {
//           token,
//           notification: { 
//             title: `${configData.nombreEmpresa || "Empresa"} - ${titulo}`, 
//             body: cuerpo 
//           },
//           android: { 
//             priority: "high", 
//             notification: { 
//               channel_id: "default", 
//               sound: "default", 
//               icon: "logo"
//             } 
//           }
//         };

//         try {
//           await admin.messaging().send(message);
//           console.log(`✅ Notificación enviada a ${nombre} (${clienteId})`);
//         } catch (err) {
//           console.error("❌ Error enviando notificación", err.message);
//         }
//       }
//     }

//     console.log("🎯 Notificaciones automáticas finalizadas.");
//   } catch (err) {
//     console.error("❌ Error en notificaciones automáticas:", err.message);
//   }
// };

// // ===============================
// // 🔥 CRON JOB: Ejecutar cada minuto
// // ===============================
// cron.schedule("* * * * *", () => {
//   enviarNotificacionesAutomaticas();
// });

// // ===============================
// // 🔥 INICIAR SERVIDOR
// // ===============================
// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });


// // server.js
// const express = require("express");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
// const cors = require("cors");
// const cron = require("node-cron");
// const moment = require("moment-timezone");

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(bodyParser.json());

// // 🔑 Inicializar Firebase Admin
// // const serviceAccount = require("./serviceAccountKey.json");
// const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// const db = admin.firestore();

// // ===============================
// // 🚀 ENDPOINT de prueba
// // ===============================
// app.get("/", (req, res) => {
//   res.send("🚀 Backend funcionando correctamente!");
// });

// // ===============================
// // 🚀 ENDPOINT para enviar notificación manual
// // ===============================
// app.post("/sendNotification", async (req, res) => {
//   try {
//     const { token, notification, data } = req.body;
//     if (!token || !notification?.title || !notification?.body) {
//       return res.status(400).json({ success: false, message: "Faltan parámetros" });
//     }

//     const message = {
//       token,
//       notification,
//       android: {
//         priority: "high",
//         notification: {
//           channel_id: "default",
//           sound: "default",
//           icon: "logo" // nombre del asset del icono
//         }
//       },
//       data: data || {}
//     };

//     const response = await admin.messaging().send(message);
//     res.json({ success: true, response });
//   } catch (error) {
//     console.error("❌ Error al enviar notificación:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ===============================
// // 🔥 FUNCION PRINCIPAL DE NOTIFICACIONES AUTOMÁTICAS
// // ===============================
// const enviarNotificacionesAutomaticas = async () => {
//   console.log("🚀 Ejecutando notificaciones automáticas...");

//   try {
//     // Traer todos los usuarios con configuración de notificaciones activas
//     const notiSnapshot = await db.collection("notificaciones").where("activo", "==", true).get();
//     if (notiSnapshot.empty) return console.log("⚠️ No hay usuarios con notificaciones activas.");

//     // 📌 Obtener hora actual en RD (zona horaria)
//     const ahora = moment().tz("America/Santo_Domingo");
//     const horaActual = ahora.format("HH:mm"); // formato 24h (ejemplo: "08:35")

//     for (const doc of notiSnapshot.docs) {
//       const configData = doc.data();
//       const usuarioId = configData.usuarioId;

//       const horarios = (configData.horarios || []).map(h => h.trim());
//       if (!horarios.includes(horaActual)) {
//         console.log(`⏰ Hora actual (${horaActual}) no coincide para usuario ${usuarioId}`);
//         continue;
//       }

//       // Obtener clientes de este usuario
//       const clientesSnapshot = await db.collection("clientes").where("usuarioId", "==", usuarioId).get();
//       if (clientesSnapshot.empty) continue;

//       const clienteIds = clientesSnapshot.docs.map(c => c.id);

//       // Buscar préstamos de los clientes
//       const coleccionesPrestamos = ["prestamospov", "financiamientos"];
//       let prestamos = [];

//       for (const col of coleccionesPrestamos) {
//         const snapshot = await db.collection(col).where("clienteId", "in", clienteIds).get();
//         prestamos = prestamos.concat(snapshot.docs.map(p => ({ id: p.id, data: p.data(), coleccion: col })));
//       }

//       if (prestamos.length === 0) continue;

//       for (const prest of prestamos) {
//         const prestamo = prest.data;
//         const clienteId = prestamo.clienteId;
//         const nombre = prestamo.clienteNombre || "Cliente";
//         const fechaPago = prestamo.proximoPago;
//         const modalidad = prestamo.modalidad;

//         const tokenDoc = await db.collection("userTokens").doc(clienteId).get();
//         if (!tokenDoc.exists) continue;
//         const token = tokenDoc.data()?.token;
//         if (!token) continue;

//         const hoy = ahora.format("YYYY-MM-DD"); // fecha de hoy en RD
//         const fechaPagoDate = moment(fechaPago);
//         const hoyDate = moment(hoy);
//         const diasAntes = fechaPagoDate.diff(hoyDate, "days");

//         let titulo = "";
//         let cuerpo = "";

//         if (fechaPago === hoy) {
//           titulo = configData.tituloHoy;
//           cuerpo = configData.mensajeHoy.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
//         } else if (fechaPagoDate.isBefore(hoyDate)) {
//           const dias = hoyDate.diff(fechaPagoDate, "days");
//           titulo = configData.tituloAtraso;
//           cuerpo = configData.mensajeAtraso.replace("{nombre}", nombre).replace("{dias}", dias);
//         } else if ((modalidad === "diario" && diasAntes === 0) || (modalidad !== "diario" && diasAntes === 3)) {
//           titulo = configData.tituloRecordatorio;
//           cuerpo = configData.mensajeRecordatorio.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
//         } else {
//           continue;
//         }

//         const message = {
//           token,
//           notification: { 
//             title: `${configData.nombreEmpresa || "Empresa"} - ${titulo}`, 
//             body: cuerpo 
//           },
//           android: { 
//             priority: "high", 
//             notification: { 
//               channel_id: "default", 
//               sound: "default", 
//               icon: "logo"
//             } 
//           }
//         };

//         try {
//           await admin.messaging().send(message);
//           console.log(`✅ Notificación enviada a ${nombre} (${clienteId})`);
//         } catch (err) {
//           console.error("❌ Error enviando notificación", err.message);
//         }
//       }
//     }

//     console.log("🎯 Notificaciones automáticas finalizadas.");
//   } catch (err) {
//     console.error("❌ Error en notificaciones automáticas:", err.message);
//   }
// };

// // ===============================
// // 🔥 CRON JOB: Ejecutar cada minuto
// // ===============================
// cron.schedule("* * * * *", () => {
//   enviarNotificacionesAutomaticas();
// });

// // ===============================
// // 🔥 INICIAR SERVIDOR
// // ===============================
// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });

const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const cron = require("node-cron");
const moment = require("moment-timezone");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// 🔑 Inicializar Firebase Admin
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// ===============================
// 🚀 ENDPOINT de prueba
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Backend funcionando correctamente!");
});

// ===============================
// 🚀 ENDPOINT para enviar notificación manual
// ===============================
app.post("/sendNotification", async (req, res) => {
  try {
    const { token, notification, data } = req.body;
    if (!token || !notification?.title || !notification?.body) {
      return res.status(400).json({ success: false, message: "Faltan parámetros" });
    }

    const message = {
      token,
      notification,
      android: {
        priority: "high",
        notification: {
          channel_id: "default",
          sound: "default",
          icon: "logo"
        }
      },
      data: data || {}
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error al enviar notificación:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================
// 🔥 FUNCION PRINCIPAL DE NOTIFICACIONES AUTOMÁTICAS
// ===============================
const enviarNotificacionesAutomaticas = async () => {
  console.log("🚀 Ejecutando notificaciones automáticas...");
  try {
    const notiSnapshot = await db.collection("notificaciones").where("activo", "==", true).get();
    if (notiSnapshot.empty) return console.log("⚠️ No hay usuarios con notificaciones activas.");

    const ahora = moment().tz("America/Santo_Domingo");
    const horaActual = ahora.format("HH:mm"); // formato 24h (ejemplo: "08:35")

    for (const doc of notiSnapshot.docs) {
      const configData = doc.data();
      const usuarioId = configData.usuarioId;
      const horarios = (configData.horarios || []).map(h => h.trim());

      if (!horarios.includes(horaActual)) {
        console.log(`⏰ Hora actual (${horaActual}) no coincide para usuario ${usuarioId}`);
        continue;
      }

      // Obtener clientes de este usuario
      const clientesSnapshot = await db.collection("clientes").where("usuarioId", "==", usuarioId).get();
      if (clientesSnapshot.empty) continue;
      const clienteIds = clientesSnapshot.docs.map(c => c.id);

      // Buscar préstamos de los clientes
      const coleccionesPrestamos = ["prestamospov", "financiamientos"];
      let prestamos = [];
      for (const col of coleccionesPrestamos) {
        const snapshot = await db.collection(col).where("clienteId", "in", clienteIds).get();
        prestamos = prestamos.concat(snapshot.docs.map(p => ({ id: p.id, data: p.data(), coleccion: col })));
      }
      if (prestamos.length === 0) continue;

      for (const prest of prestamos) {
        const prestamo = prest.data;
        const clienteId = prestamo.clienteId;
        const nombre = prestamo.clienteNombre || "Cliente";
        const fechaPago = prestamo.proximoPago;
        const modalidad = prestamo.modalidad;
        const montoCuota = prestamo.cuota ?? prestamo.montoCuota; // Ajusta al nombre real del campo

        const tokenDoc = await db.collection("userTokens").doc(clienteId).get();
        if (!tokenDoc.exists) continue;
        const token = tokenDoc.data()?.token;
        if (!token) continue;

        const hoy = ahora.format("YYYY-MM-DD");
        const fechaPagoDate = moment(fechaPago);
        const hoyDate = moment(hoy);
        const diasAntes = fechaPagoDate.diff(hoyDate, "days");

        let titulo = "";
        let cuerpo = "";

        // ----------- CHEQUEO DE CUOTA REALMENTE SALDADA -----------
        let cuotaPagada = false;
        let totalPagado = 0;

        if (fechaPago && montoCuota) {
          const pagosQuery = await db.collection("registroPago")
            .where("prestamoId", "==", prest.id)
            .where("fecha", "==", fechaPago)
            .get();

          if (!pagosQuery.empty) {
            // Suma todos los pagos que caen para ese prestamo y esa fecha
            pagosQuery.forEach(docSnap => {
              const pago = docSnap.data();
              totalPagado += Number(pago.monto ?? pago.pago ?? 0); // Ajusta al campo real: "monto" o "pago"
            });
            if (totalPagado >= Number(montoCuota)) {
              cuotaPagada = true;
            }
          }
        }

        // ----------- Lógica de notificación -----------
        if (fechaPago === hoy && !cuotaPagada) {
          // Día de pago HOY y NO pagada
          titulo = configData.tituloHoy;
          cuerpo = configData.mensajeHoy.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
        } else if (fechaPagoDate.isBefore(hoyDate) && !cuotaPagada) {
          // Atraso y NO pagada
          const dias = hoyDate.diff(fechaPagoDate, "days");
          titulo = configData.tituloAtraso;
          cuerpo = configData.mensajeAtraso.replace("{nombre}", nombre).replace("{dias}", dias);
        } else if (
          (modalidad === "diario" && diasAntes === 0 && !cuotaPagada) ||
          (modalidad !== "diario" && diasAntes === 3 && !cuotaPagada)
        ) {
          // Recordatorio antes y NO pagada
          titulo = configData.tituloRecordatorio;
          cuerpo = configData.mensajeRecordatorio.replace("{nombre}", nombre).replace("{fecha}", fechaPago);
        } else {
          continue; // O la cuota ya fue pagada o no toca notificar
        }

        // Enviar notification solo si no se pagó suficiente
        const message = {
          token,
          notification: {
            title: `${configData.nombreEmpresa || "Empresa"} - ${titulo}`,
            body: cuerpo
          },
          android: {
            priority: "high",
            notification: {
              channel_id: "default",
              sound: "default",
              icon: "logo"
            }
          }
        };

        try {
          await admin.messaging().send(message);
          console.log(`✅ Notificación enviada a ${nombre} (${clienteId})`);
        } catch (err) {
          console.error("❌ Error enviando notificación", err.message);
        }
      }
    }
    console.log("🎯 Notificaciones automáticas finalizadas.");
  } catch (err) {
    console.error("❌ Error en notificaciones automáticas:", err.message);
  }
};

// ===============================
// 🔥 CRON JOB: Ejecutar cada minuto
// ===============================
cron.schedule("* * * * *", () => {
  enviarNotificacionesAutomaticas();
});

// ===============================
// 🔥 INICIAR SERVIDOR
// ===============================
app.listen(port, () => {
  console.log(`✅ Backend corriendo en http://localhost:${port}`);
});
