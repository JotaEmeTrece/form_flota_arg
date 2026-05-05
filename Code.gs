/** Code.gs - Backend Web App para preseleccion de choferes
 *  Recibe POST JSON, guarda imagenes Base64 en Drive y registra fila en Sheet.
 */

const CONFIG = {
  DRIVE_FOLDER_NAME: 'Documentos_Choferes',
  SHEET_NAME: 'Respuestas',
  TZ: Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires'
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Solicitud POST vacia.' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    validatePayload(payload);

    const folderRoot = getOrCreateFolder_(CONFIG.DRIVE_FOLDER_NAME);
    const candidateFolderName = buildCandidateFolderName_(payload);
    const candidateFolder = folderRoot.createFolder(candidateFolderName);

    let dniFrenteUrl = '';
    let dniDorsoUrl = '';
    let regFrenteUrl = '';
    let regDorsoUrl = '';

    if (normalizeChoice_(payload.registro_profesional) !== 'no') {
      dniFrenteUrl = saveBase64Image_(
        payload.documentos?.dni_frente,
        `dni_frente_${safeSlug_(payload.nombre_apellido)}.jpg`,
        candidateFolder
      );
      dniDorsoUrl = saveBase64Image_(
        payload.documentos?.dni_dorso,
        `dni_dorso_${safeSlug_(payload.nombre_apellido)}.jpg`,
        candidateFolder
      );
      regFrenteUrl = saveBase64Image_(
        payload.documentos?.registro_frente,
        `registro_frente_${safeSlug_(payload.nombre_apellido)}.jpg`,
        candidateFolder
      );
      regDorsoUrl = saveBase64Image_(
        payload.documentos?.registro_dorso,
        `registro_dorso_${safeSlug_(payload.nombre_apellido)}.jpg`,
        candidateFolder
      );
    }

    const sheet = getOrCreateSheet_(CONFIG.SHEET_NAME);
    ensureHeaders_(sheet);

    const estado = computeEstado_(payload);

    const row = [
      new Date(),
      estado,
      payload.nombre_apellido || '',
      payload.edad || '',
      payload.zona || '',
      payload.cochera || '',
      payload.tipo_calle || '',
      payload.turno_preferencia || '',
      payload.registro_vencimiento || '',
      payload.registro_profesional || '',
      payload.categoria_registro || '',
      payload.zona_segura || '',
      payload.experiencia_apps || '',
      payload.distancia_punto_encuentro || '',
      payload.disponibilidad_inicio || '',
      dniFrenteUrl,
      dniDorsoUrl,
      regFrenteUrl,
      regDorsoUrl,
      candidateFolder.getUrl()
    ];

    sheet.appendRow(row);

    const rowNumber = sheet.getLastRow();
    paintEstadoCell_(sheet, rowNumber, estado);

    return jsonResponse({
      ok: true,
      message: 'Formulario recibido correctamente.',
      estado: estado,
      fila: rowNumber
    }, 200);
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err)
    }, 500);
  }
}

function validatePayload(payload) {
  if (!payload) throw new Error('Payload invalido.');
  if (!payload.nombre_apellido) throw new Error('Falta el campo nombre_apellido.');
  if (!payload.edad) throw new Error('Falta el campo edad.');
  if (!payload.registro_profesional) throw new Error('Falta el campo registro_profesional.');

  if (normalizeChoice_(payload.registro_profesional) === 'no') {
    return;
  }

  const docs = payload.documentos || {};
  const requiredDocs = ['dni_frente', 'dni_dorso', 'registro_frente', 'registro_dorso'];
  requiredDocs.forEach(function (k) {
    if (!docs[k]) throw new Error('Falta el documento obligatorio: ' + k);
  });
}

function computeEstado_(payload) {
  const mins = extractMinutes_(payload.distancia_punto_encuentro);
  if (mins !== null && mins > 30) return 'No Apto';

  const cochera = normalizeChoice_(payload.cochera);
  const zonaSegura = normalizeChoice_(payload.zona_segura);
  const distancia = String(payload.distancia_punto_encuentro || '').toLowerCase();

  if (cochera === 'si') {
    if (zonaSegura === 'no' || zonaSegura === 'dudosa' || distancia.includes('lejos')) {
      return 'Revisar';
    }
    return 'Apto';
  }

  return 'Revisar';
}

function extractMinutes_(value) {
  const match = String(value || '').match(/(\d{1,3})/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function paintEstadoCell_(sheet, rowNumber, estado) {
  var color = '#FFF3CD';
  if (estado === 'No Apto') color = '#F8D7DA';
  if (estado === 'Apto') color = '#D4EDDA';

  const cell = sheet.getRange(rowNumber, 2);
  cell.setBackground(color);
  cell.setFontWeight('bold');
}

function saveBase64Image_(base64OrDataUrl, filename, folder) {
  const parsed = parseBase64_(base64OrDataUrl);
  const bytes = Utilities.base64Decode(parsed.base64);
  const blob = Utilities.newBlob(bytes, parsed.mimeType, filename);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function parseBase64_(input) {
  const str = String(input || '');
  const match = str.match(/^data:(.*?);base64,(.*)$/);
  if (match) {
    return { mimeType: match[1] || 'image/jpeg', base64: match[2] };
  }
  return { mimeType: 'image/jpeg', base64: str };
}

function getOrCreateFolder_(folderName) {
  const iter = DriveApp.getFoldersByName(folderName);
  if (iter.hasNext()) return iter.next();
  return DriveApp.createFolder(folderName);
}

function getOrCreateSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) return;

  const headers = [[
    'Fecha',
    'Estado',
    'Nombre',
    'Edad',
    'Zona',
    'Cochera',
    'Calle',
    'Turno',
    'Vencimiento Registro',
    'Registro Profesional',
    'Categoria Registro',
    'Zona Segura',
    'Experiencia Apps',
    'Distancia',
    'Disponibilidad Inicio',
    'DNI Frente',
    'DNI Dorso',
    'Registro Frente',
    'Registro Dorso',
    'Carpeta Drive'
  ]];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#E9ECEF');
}

function buildCandidateFolderName_(payload) {
  const name = safeSlug_(payload.nombre_apellido || 'sin_nombre');
  const stamp = Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyyMMdd_HHmmss');
  return name + '_' + stamp;
}

function safeSlug_(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

function normalizeChoice_(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'si' || raw === 's\u00ed') return 'si';
  return raw;
}

function jsonResponse(obj, statusCode) {
  obj.status = statusCode;
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
