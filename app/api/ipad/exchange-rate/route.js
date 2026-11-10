import { NextResponse } from 'next/server';

// The old iPad contacts only its own origin. DolarAPI stays on the server.
export async function GET(request) {
  const type = new URL(request.url).searchParams.get('type') || 'blue';
  const headers = { 'Cache-Control': 'no-store' };
  if (!['oficial', 'blue', 'cripto'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de cotización inválido.' }, { status: 400, headers });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://dolarapi.com/v1/dolares/${type}`, {
      cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('No disponible');
    const data = await response.json();
    const venta = Number(data.venta);
    if (!Number.isFinite(venta) || venta <= 0) throw new Error('Valor inválido');
    return NextResponse.json({ venta, casa: type, fechaActualizacion: data.fechaActualizacion || null }, { headers });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar el dólar. Ingresá el valor manualmente.' }, { status: 502, headers });
  } finally {
    clearTimeout(timeout);
  }
}
