import { getReportData } from '../DB/querySql.js';
import ExcelJS from 'exceljs';

export const generateAttendanceReport = async (req, res) => {
  try {
    const { start, end, id_maestro } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start and end query params required (YYYY-MM-DD)' });

    const { asistencias, permisos, justificantes } = await getReportData(start, end, id_maestro);

    // Crear workbook
    const wb = new ExcelJS.Workbook();

    // --- Hoja de resumen (conteos por maestro)
    const summarySheet = wb.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Id Maestro', key: 'id_maestro', width: 12 },
      { header: 'Maestro', key: 'nombre_maestro', width: 30 },
      { header: 'Asistencias', key: 'asistencias', width: 12 },
      { header: 'Faltas', key: 'faltas', width: 12 },
      { header: 'Permisos', key: 'permisos', width: 12 },
      { header: 'Justificantes', key: 'justificantes', width: 12 }
    ];

    // --- Hoja detalle: Registros (asistencias e inasistencias)
    const registrosSheet = wb.addWorksheet('Registros');
    registrosSheet.columns = [
      { header: 'Id Maestro', key: 'id_maestro', width: 12 },
      { header: 'Maestro', key: 'nombre_maestro', width: 30 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Nota', key: 'nota', width: 40 }
    ];

    // --- Hoja detalle: Justificantes (colocada después de registros)
    const sheetJ = wb.addWorksheet('Justificantes');
    sheetJ.columns = [
      { header: 'Id Maestro', key: 'id_maestro', width: 12 },
      { header: 'Maestro', key: 'nombre_maestro', width: 30 },
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Motivo', key: 'motivo', width: 40 },
      { header: 'Autorizado', key: 'autorizado', width: 12 }
    ];

    // --- Hoja detalle: Permisos (colocada al final)
    const sheetP = wb.addWorksheet('Permisos');
    sheetP.columns = [
      { header: 'Id Maestro', key: 'id_maestro', width: 12 },
      { header: 'Maestro', key: 'nombre_maestro', width: 30 },
      { header: 'Fecha Inicio', key: 'fecha_inicio', width: 18 },
      { header: 'Fecha Fin', key: 'fecha_fin', width: 18 },
      { header: 'Permiso', key: 'permiso', width: 40 },
      { header: 'Aprobado', key: 'aprobado', width: 12 }
    ];

    // Estilos de encabezado en todas las hojas
  const allSheets = [summarySheet, registrosSheet, sheetJ, sheetP];
    for (const s of allSheets) {
      s.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      s.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF1F4E78'} };
      s.views = [{state: 'frozen', ySplit:1}];
      s.autoFilter = { from: { row:1, column:1 }, to: { row:1, column: s.columnCount } };
    }

    // Map para resumen por maestro
    const summaryMap = new Map();

    // Agregar asistencias e inasistencias (detalles) — se añaden primero en la hoja 'Registros'
    for (const a of asistencias) {
      const fechaVal = a.fecha ? new Date(a.fecha) : null;
      const statusLabel = (a.status === 4) ? 'Asistencia' : (a.status === 3 ? 'Falta' : (a.status === 2 ? 'Permiso' : (a.status === 1 ? 'Justificante' : 'Desconocido')));
      const row = registrosSheet.addRow({ id_maestro: a.id_maestro, nombre_maestro: a.nombre_maestro, fecha: fechaVal, status: statusLabel, nota: '' });
      // Formatear fecha
      if (fechaVal) row.getCell('fecha').numFmt = 'yyyy-mm-dd hh:mm';

      // Color según status (background for status cell)
      if (a.status === 4) {
        row.getCell('status').fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFDFF0D8'} };
      } else if (a.status === 3) {
        row.getCell('status').fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFF8D7DA'} };
      }else if (a.status === 2) {
        row.getCell('status').fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFFFF4D4'} };
      } else if (a.status === 1) {
        row.getCell('status').fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFD9E1F2'} };
      } 


      // Zebra stripe for rows
      const rn = row.number;
      if (rn % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = cell.fill || { type:'pattern', pattern:'solid', fgColor:{argb:'FFF7F7F7'} };
        });
      }

      // Borders for the row
      row.eachCell(cell => {
        cell.border = { top: {style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
      });

      // actualizar resumen
      const key = `${a.id_maestro}__${a.nombre_maestro}`;
      if (!summaryMap.has(key)) summaryMap.set(key, { id_maestro: a.id_maestro, nombre_maestro: a.nombre_maestro, asistencias:0, faltas:0, permisos:0, justificantes:0 });
      const entry = summaryMap.get(key);
      if (a.status === 4) entry.asistencias++;
      if (a.status === 3) entry.faltas++;
    }

    // Agregar justificantes (detalles) — después de registros
    for (const j of justificantes) {
      const fj = j.fecha ? new Date(j.fecha) : null;
      const row = sheetJ.addRow({ id_maestro: j.id_maestro, nombre_maestro: j.nombre_maestro, fecha: fj, motivo: j.motivo, autorizado: j.autorizado ? 'Sí' : 'No' });
      if (fj) row.getCell('fecha').numFmt = 'yyyy-mm-dd';
      // zebra + border
      const rn = row.number;
      if (rn % 2 === 0) row.eachCell(cell => cell.fill = cell.fill || { type:'pattern', pattern:'solid', fgColor:{argb:'FFF7F7F7'} });
      row.eachCell(cell => cell.border = { top: {style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} });
      const key = `${j.id_maestro}__${j.nombre_maestro}`;
      if (!summaryMap.has(key)) summaryMap.set(key, { id_maestro: j.id_maestro, nombre_maestro: j.nombre_maestro, asistencias:0, faltas:0, permisos:0, justificantes:0 });
      summaryMap.get(key).justificantes++;
    }

    // Agregar permisos (detalles) — al final
    for (const p of permisos) {
      const fi = p.fecha_inicio ? new Date(p.fecha_inicio) : null;
      const ff = p.fecha_fin ? new Date(p.fecha_fin) : null;
      const row = sheetP.addRow({ id_maestro: p.id_maestro, nombre_maestro: p.nombre_maestro, fecha_inicio: fi, fecha_fin: ff, permiso: `${p.nombre_permiso} - ${p.descripcion || ''}`, aprobado: p.aprobado ? 'Sí' : 'No' });
      if (fi) row.getCell('fecha_inicio').numFmt = 'yyyy-mm-dd';
      if (ff) row.getCell('fecha_fin').numFmt = 'yyyy-mm-dd';
      const rn = row.number;
      if (rn % 2 === 0) row.eachCell(cell => cell.fill = cell.fill || { type:'pattern', pattern:'solid', fgColor:{argb:'FFF7F7F7'} });
      row.eachCell(cell => cell.border = { top: {style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} });
      const key = `${p.id_maestro}__${p.nombre_maestro}`;
      if (!summaryMap.has(key)) summaryMap.set(key, { id_maestro: p.id_maestro, nombre_maestro: p.nombre_maestro, asistencias:0, faltas:0, permisos:0, justificantes:0 });
      summaryMap.get(key).permisos++;
    }

    // Llenar hoja summary
    for (const [, v] of summaryMap) {
      summarySheet.addRow(v);
    }

    // Generar buffer y enviar
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${start}_to_${end}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('generateAttendanceReport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { generateAttendanceReport };
