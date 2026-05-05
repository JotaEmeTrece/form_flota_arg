# Proyecto: Sistema de Preselección de Choferes (Flow-Chat)
**Arquitectura:** Serverless de Propiedad Total (Cero Abono)
**Stack:** Next.js (Frontend) + Google Apps Script (Backend/DB)

---

## 🎯 Objetivo
Crear una interfaz tipo chat (UX Conversacional) para la captación y filtrado de choferes de flota. Los datos y documentos deben centralizarse en un Google Sheet del cliente sin costos mensuales de mantenimiento.

## 🏗️ Arquitectura Técnica
1. **Frontend (Vercel):** Aplicación Next.js con Tailwind CSS. Interfaz de una sola pregunta a la vez con estados de transición suaves.
2. **Backend (Google Apps Script):** Actúa como API Web (Endpoint POST). 
    - Recibe JSON con respuestas.
    - Recibe archivos en Base64.
    - Clasifica visualmente en el Sheet según lógica de negocio básica.
3. **Almacenamiento:** 
    - **Datos:** Google Sheets.
    - **Documentos:** Google Drive (Carpeta dedicada).

---

## 📋 Flujo Lógico de Preguntas (UX Chat)

### Bloque 1: Identidad
3. **Nombre y Apellido.** (Input texto)
4. **Edad.** (Input numérico)



### Bloque 2: Filtros Legales 
1. **¿Tienes registro de conducir profesional vigente?** (Botones: Sí / No)
2. **Categoría y fecha de vencimiento.** (Input texto/fecha)



### Bloque 3: Seguridad y Logística
5. **Zona donde vives:** (Partido y Localidad).
6. **¿Tienes cochera o lugar seguro para guardar el auto?** (Botones: Sí / No)
7. **¿La calle donde dormiría el auto es de asfalto o tierra?** (Botones: Asfalto / Tierra)
8. **¿Consideras que la zona es segura?** (Botones: Sí / No / Dudosa)

### Bloque 4: Operación y Experiencia
9. **Turno de preferencia:** (Día / Noche / Indistinto).
10. **Experiencia en Apps:** (Cabify, Uber, DiDi, Otros).
11. **¿A qué distancia estás (en tiempo/colectivo) del punto de encuentro?** (Input texto)
12. **¿Cuándo podrías empezar?** (Input texto)

### Bloque 5: Documentación (Carga de archivos)
13. **DNI:** (Frente y Dorso).
14. **Registro:** (Frente y Dorso).

---

## 📊 Diseño del Google Sheet (Salida)
El sistema debe popular una fila con las siguientes columnas:
`Fecha | Estado | Nombre | Edad | Zona | Cochera | Calle | Turno | Vencimiento Registro | Links Drive (Docs)`

**Lógica de clasificación visual (Formato condicional):**
- **Verde:** Cumple requisitos clave (Cochera + Registro).
- **Amarillo:** Revisar detalles (Distancia o zona).
- **Rojo:** No apto (Sin registro).

---

## 🚀 Despliegue
- **Frontend:** `vercel deploy`
- **Backend:** `clasp push` o copiado directo en el editor de Apps Script.
- **Seguridad:** Uso de variables de entorno para el Webhook URL de Google.

---

## 🛠️ Roadmap de Desarrollo
- [ ] Configurar Google Sheet y Script de recepción (POST).
- [ ] Desarrollar Componente `ChatInterface.tsx` con manejo de estados.
- [ ] Implementar lógica de subida de imágenes Base64 -> Blob (Drive).
- [ ] Integrar validaciones básicas de campos.
- [ ] Despliegue en Vercel y prueba de fin a fin.