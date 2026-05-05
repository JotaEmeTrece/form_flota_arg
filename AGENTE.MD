# INSTRUCCIONES PARA EL AGENTE DE CODIFICACIÓN (MODO ARCHITECT)

## 👤 Rol
Actúa como un Desarrollador Senior Fullstack experto en Next.js 14+, TypeScript y Google Apps Script. Tu objetivo es construir un sistema de preselección de choferes conversacional.

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion (para transiciones de chat).
- **Backend:** Google Apps Script (GAS) como API REST (POST).
- **Persistencia:** Google Sheets + Google Drive.

---

## 🏗️ Tarea 1: Backend (Google Apps Script)
Escribe un script de Google (`Code.gs`) que:
1. Exponga una función `doPost(e)`.
2. Cree una carpeta en Google Drive llamada "Documentos_Choferes" (si no existe).
3. Procese un JSON que contenga datos del formulario y 4 imágenes en Base64 (DNI y Registro).
4. Guarde las imágenes en Drive y obtenga sus URLs públicas.
5. Inserte una fila en el Sheet activo con los datos y los links a las imágenes.
6. **Importante:** Incluye lógica para que, si el campo `registro_profesional` es "No", la celda de "Estado" se pinte automáticamente de Rojo.

---

## 💻 Tarea 2: Frontend (Next.js - Interfaz de Chat)
Crea un componente principal `ChatFlow.tsx` que:
1. **Estado Conversacional:** Gestione el flujo de preguntas definido en el `PROJECT.md` (una por una).
2. **Componentes de Input:**
    - Botones de opción rápida (Sí/No, Asfalto/Tierra) para evitar que el usuario escriba.
    - Input de fecha para vencimientos.
    - Componente de Dropzone/Cámara para las 4 fotos requeridas.
3. **Lógica de Envío:**
    - Convierta las imágenes a Base64.
    - Envíe el objeto JSON final al Webhook de Google Apps Script.
    - Muestre una pantalla de "Éxito" profesional al terminar.

---

## 🎨 Especificaciones de Diseño (UI/UX)
- **Estética:** Limpia, moderna, similar a Typeform o Tally.
- **Transiciones:** Las preguntas deben aparecer con un efecto de "fade-in" o "slide-up".
- **Responsive:** Prioridad 100% móvil (el 99% de los choferes usará su celular).
- **Colores:** Usa una paleta profesional (ej. Indigo/Slate) con estados visuales claros.

---

## ⚠️ Restricciones Técnicas
1. **Cero Dependencias Pesadas:** No uses bases de datos externas (Supabase/Firebase). Todo a Google Sheets.
2. **Seguridad:** No expongas el ID del Google Sheet en el cliente; el Webhook de GAS debe manejarlo internamente.
3. **Optimización:** Comprime o redimensiona las imágenes en el cliente antes de enviarlas para evitar exceder los límites de tamaño de POST en GAS.

## 🏁 Resultado Esperado
Proporciona primero el código completo del `Code.gs` y luego el código del componente React `ChatFlow.tsx` junto con sus tipos de TypeScript.

## Reglas
me dices siempre lo que vas a hacer y por que y esperas mi autorizacion
si ves que se puede mejorar algo de lo que propongo, exponlo y me dices por que y que difecrencia tiene con la propuesta original. 
