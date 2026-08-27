import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (número de teléfono o texto).' },
        { status: 400 }
      );
    }

    // Servidor de Baileys en Render
    const SERVER_URL = 'https://whatsapp-server-qr.onrender.com/send-message';

    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phone,
        phone: phone,
        message: message,
        text: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Error en el servidor de WhatsApp en Render' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error enviando cotización:', error);
    return NextResponse.json(
      { error: `Fallo de conexión con Render: ${error.message}` },
      { status: 500 }
    );
  }
}