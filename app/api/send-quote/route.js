// app/api/vuce/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { palabra } = await request.json();
    
    if (!palabra || palabra.length < 3) {
      return NextResponse.json(
        { error: 'La búsqueda debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // URL de búsqueda en VUCE
    const url = `https://www.vuce.gov.ar/busqueda_producto_new.php?palabra=${encodeURIComponent(palabra)}`;
    
    // Realizar la consulta con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error en la búsqueda: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extraer resultados de la tabla HTML
    const resultados = extraerResultadosVUCE(html);
    
    return NextResponse.json({ 
      resultados,
      total: resultados.length 
    });
    
  } catch (error) {
    console.error('Error en búsqueda VUCE:', error);
    return NextResponse.json(
      { 
        error: 'Error al buscar en VUCE',
        detalles: error.message 
      },
      { status: 500 }
    );
  }
}

function extraerResultadosVUCE(html) {
  const resultados = [];
  
  // Buscar la tabla de resultados
  const tableRegex = /<table[^>]*class="[^"]*resultados[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = html.match(tableRegex);
  
  if (!tableMatch) {
    // Intenta con un método alternativo si no encuentra la tabla
    return extraerAlternativo(html);
  }
  
  const tableHtml = tableMatch[1];
  
  // Buscar filas de la tabla
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let isFirstRow = true;
  
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    // Saltar la primera fila (encabezados)
    if (isFirstRow) {
      isFirstRow = false;
      continue;
    }
    
    const rowContent = rowMatch[1];
    const cells = rowContent.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    
    if (cells && cells.length >= 3) {
      // Limpiar el contenido de las celdas
      const cleanCell = (cell) => {
        return cell
          .replace(/<[^>]*>/g, '') // Quitar HTML
          .replace(/&nbsp;/g, ' ')
          .trim();
      };
      
      // Extraer NCM, Descripción y Observaciones
      const ncm = cleanCell(cells[0] || '');
      const descripcion = cleanCell(cells[1] || '');
      const observaciones = cells.length > 2 ? cleanCell(cells[2] || '') : '';
      
      // Buscar información de aranceles en los comentarios/observaciones
      const aranceles = extraerAranceles(observaciones);
      
      if (ncm && ncm.length >= 8 && !isNaN(ncm.replace(/\./g, ''))) {
        resultados.push({
          ncm: ncm.replace(/\./g, ''),
          descripcion,
          observaciones,
          aranceles: {
            ddi: aranceles.ddi || 20,
            tasaEst: aranceles.tasaEst || 3,
            iva: aranceles.iva || 21,
            ivaAdd: aranceles.ivaAdd || 20,
            ganancias: aranceles.ganancias || 6,
            iibb: aranceles.iibb || 2.5
          }
        });
      }
    }
  }
  
  // Limitar a 20 resultados para no sobrecargar
  return resultados.slice(0, 20);
}

function extraerAlternativo(html) {
  // Método alternativo de extracción
  const resultados = [];
  
  // Buscar patrones NCM en el texto
  const ncmRegex = /(\d{4}\.\d{2}\.\d{2})/g;
  const descRegex = /<td[^>]*class="[^"]*descripcion[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
  
  let match;
  let ncmEncontrados = [];
  
  while ((match = ncmRegex.exec(html)) !== null) {
    ncmEncontrados.push(match[1]);
  }
  
  // Buscar descripciones
  let descripciones = [];
  while ((match = descRegex.exec(html)) !== null) {
    const desc = match[1].replace(/<[^>]*>/g, '').trim();
    if (desc) descripciones.push(desc);
  }
  
  // Combinar NCMs con descripciones
  const maxItems = Math.min(ncmEncontrados.length, descripciones.length);
  for (let i = 0; i < maxItems && i < 20; i++) {
    resultados.push({
      ncm: ncmEncontrados[i].replace(/\./g, ''),
      descripcion: descripciones[i] || 'Sin descripción',
      observaciones: '',
      aranceles: {
        ddi: 20,
        tasaEst: 3,
        iva: 21,
        ivaAdd: 20,
        ganancias: 6,
        iibb: 2.5
      }
    });
  }
  
  return resultados;
}

function extraerAranceles(texto) {
  const aranceles = {
    ddi: 20,
    tasaEst: 3,
    iva: 21,
    ivaAdd: 20,
    ganancias: 6,
    iibb: 2.5
  };
  
  // Buscar patrones comunes en las observaciones
  const patrones = {
    ddi: /(?:DDI|Derecho de Importaci[óo]n)[:\s]+(\d+(?:\.\d+)?)/i,
    tasaEst: /(?:Tasa Estad[íi]stica|Tasa de Estad[íi]stica)[:\s]+(\d+(?:\.\d+)?)/i,
    iva: /IVA[:\s]+(\d+(?:\.\d+)?)/i,
    ivaAdd: /(?:IVA Adicional|IVA Adic.)[:\s]+(\d+(?:\.\d+)?)/i,
    ganancias: /(?:Ganancias|Impuesto a las Ganancias)[:\s]+(\d+(?:\.\d+)?)/i,
    iibb: /(?:IIBB|Ingresos Brutos)[:\s]+(\d+(?:\.\d+)?)/i
  };
  
  for (const [key, pattern] of Object.entries(patrones)) {
    const match = texto.match(pattern);
    if (match) {
      aranceles[key] = parseFloat(match[1]);
    }
  }
  
  return aranceles;
}